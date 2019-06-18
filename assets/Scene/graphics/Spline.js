(function() { 
    'use-strict';

    var Spline = function(){

    };

    var calculateParam = function(knots)
    {
        var n = knots.length - 1;
        var i = 0, j = 0;
        var dArray = [];
        var d0 = 3 * (knots[1] - knots[0]);
        var d1 = 3 * (knots[2] - knots[0]);
        dArray.push(d0, d1);
        for( i = 3, j = i - 2; i <= n-1; ++j, ++i)
        {
            var di = 3 * (knots[i] - knots[j]);
            dArray.push(di);
        } 
        var dn_1 = 3 * (knots[n] - knots[n - 2]);
        var dn = 3 * (knots[n] - knots[n - 1]);
        dArray.push(dn_1, dn);

        var cpArray = [];
        var dpArray = [];
        var a0 = 0, b0 = 2, c0 = 1;
        var ai = 1, bi = 4, ci = 1;
        var an = 1, bn = 2, cn = 0;

        var cp0 = c0 / b0;
        cpArray.push(cp0);

        for( i = 1; i < n; ++i)
        {
            var cpi = ci / (bi - ai * cpArray[i - 1]);
            cpArray.push(cpi);
        }

        var cpn = cn / bn;
        cpArray.push(cpn);

        var dp0 = dArray[0] / b0;
        dpArray.push(dp0);

        for(i = 1; i < n; ++i)
        {
            var dpi = (dArray[i] - ai * dpArray[i - 1]) / (bi - ai * cpArray[i - 1]);
            dpArray.push(dpi);
        }

        var dpn = (dArray[n] - an * dpArray[n - 1]) / (bn - an * cpArray[n - 1]);
        dpArray.push(dpn);

        var DArray = [];
        DArray.push(dpArray[dpArray.length - 1]);
        for( i = n-1; i >= 0; i--)
        {
            DArray.unshift(dpArray[i] - cpArray[i] * DArray[0]);
        }

        var paramsArray = [];//[(a0, b0, c0, d0), (a1, b1, c1, d1) ...(an, bn, cn, dn)]
        for( i = 0; i+1 <= n; i++)
        {
            var a = knots[i];
            var b = DArray[i];
            var c = 3 * (knots[i+1] - knots[i]) - 2 * DArray[i] - DArray[i + 1];
            var d = 2 * (knots[i] - knots[i+1]) + DArray[i] + DArray[i + 1];
            paramsArray.push({a:a, b:b, c:c, d:d});
        }
        return paramsArray;
    };

    // http://mathworld.wolfram.com/CubicSpline.html
    // yi(t) = ai + bi*t + ci*t^2 + di*t^3
    // knots: array,[(x0, y0), (x1, y1), ... (xn, yn)]
    Spline.naturalCubicSpline = function(knots)
    {
        var n = knots.length - 1;
        //https://zh.wikipedia.org/wiki/%E4%B8%89%E5%AF%B9%E8%A7%92%E7%9F%A9%E9%98%B5%E7%AE%97%E6%B3%95
        
        var i = 0, j = 0;
        var xKnots = [];
        var yKnots = [];
        for(i = 0; i <= n; i++)
        {
            xKnots.push(knots[i].x);
            yKnots.push(knots[i].y);
        }
        var xParams = calculateParam(xKnots);
        var yParams = calculateParam(yKnots);

        var segNum = 25;
        var uniformPoints = [];
        for( i = 0; i+1 <= n; i++)
        {
            for( j = 0; j <= segNum; j++)
            {
                var t = j / segNum;
                var t2 = t * t;
                var t3 = t2 * t;

                var dx = xParams[i].a + xParams[i].b * t + xParams[i].c * t2 + xParams[i].d * t3;
                var dy = yParams[i].a + yParams[i].b * t + yParams[i].c * t2 + yParams[i].d * t3;
                uniformPoints.push({x:dx, y:dy});
            }
        }
        return uniformPoints;
    };

    Spline.cardinalSpline = function()
    {

    };

    module.exports = Spline;
}) ();