(function() { 
    'use-strict';

    //https://en.wikipedia.org/wiki/Spline_%28mathematics%29#Derivation_of_a_Cubic_Spline

    var Spline = function(){

    };

    //https://zh.wikipedia.org/wiki/%E4%B8%89%E5%AF%B9%E8%A7%92%E7%9F%A9%E9%98%B5%E7%AE%97%E6%B3%95
    var tdma = function(L, R)
    {
        var n = L.length - 1;

        var cpArray = [];
        var dpArray = [];

        var cp0 = L[0].c / L[0].b;
        cpArray.push(cp0);

        for( i = 1; i <= n; ++i)
        {
            var cpi = L[i].c / (L[i].b - L[i].a * cpArray[i - 1]);
            cpArray.push(cpi);
        }

        var dp0 = R[0] / L[0].b;
        dpArray.push(dp0);

        for(i = 1; i <= n; ++i)
        {
            var dpi = (R[i] - L[i].a * dpArray[i - 1]) / (L[i].b - L[i].a * cpArray[i - 1]);
            dpArray.push(dpi);
        }

        var m = [];
        m.push(dpArray[n]);
        for( i = n-1; i >= 0; i--)
        {
            m.unshift(dpArray[i] - cpArray[i] * m[0]);
        }

        return m
    };

    var calculateParam = function(knots)
    {
        var n = knots.length - 1;
        var i = 0, j = 0;
        var R = [];
        var d0 = 3 * (knots[1] - knots[0]);
        var d1 = 3 * (knots[2] - knots[0]);
        R.push(d0, d1);
        for( i = 3, j = i - 2; i <= n-1; ++j, ++i)
        {
            var di = 3 * (knots[i] - knots[j]);
            R.push(di);
        } 
        var dn_1 = 3 * (knots[n] - knots[n - 2]);
        var dn = 3 * (knots[n] - knots[n - 1]);
        R.push(dn_1, dn);

        var L = [];
        L.push({a:0, b:2, c:1});
        for( var i = 1; i < n; i++)
        {
            L.push(
                {a:1, b:4, c:1}
            );
        }
        L.push({a:1, b:2, c:0});
        
        var DArray = tdma(L, R);

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
    // segments: default 25, the num of per interval in x_i and x_i+1
    Spline.naturalCubicSpline = function(knots, segments)
    {
        if ( knots instanceof Array && knots.length > 0)
        {
            segments = segments || 25;
            var n = knots.length - 1;        
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

            var uniformPoints = [];
            for( i = 0; i+1 <= n; i++)
            {
                for( j = 0; j <= segments; j++)
                {
                    var t = j / segments;
                    var t2 = t * t;
                    var t3 = t2 * t;

                    var dx = xParams[i].a + xParams[i].b * t + xParams[i].c * t2 + xParams[i].d * t3;
                    var dy = yParams[i].a + yParams[i].b * t + yParams[i].c * t2 + yParams[i].d * t3;
                    uniformPoints.push({x:dx, y:dy});
                }
            }
            return uniformPoints;
        }
        else
        {
            return [];
        }
    };

    //https://zhuanlan.zhihu.com/p/62860859
    // knots: array,[(x0, y0), (x1, y1), ... (xn, yn)]
    Spline.cubicSpline = function(knots, segments)
    {
        if ( knots instanceof Array && knots.length > 0)
        {
            segments = segments || 25;
            var n = knots.length - 1;

            var h = [];//h[i] = knots[i + 1].x - knots[i].x
            for( var i = 0; i < n; i++)
            {
                h.push(knots[i + 1].x - knots[i].x);
            }

            var L = [{a:0, b:1, c:0}];
            for( var i = 0; i < n - 1; i++)
            {
                L.push({a:h[i], b: 2*(h[i] + h[i+1]), c: h[i + 1]});
            }
            L.push({a:0, b:1, c:0});

            var R = [0];
            for( var i = 0; i < n - 1; i++)
            {
                var r1 = (knots[i + 2].y - knots[i + 1].y) / h[i+1];
                var r0 = (knots[i + 1].y - knots[i].y) / h[i];
                R.push(6 * (r1 - r0));
            }
            R.push(0);
            var c = tdma(L, R);

            var a = [];
            for( var i = 0; i <= n; i++ )
            {
                a.push(knots[i].y);
            }

            var b = [];
            for( var i = 0; i < n; i++)
            {
                var r0 = (knots[i + 1].y - knots[i].y) / h[i];
                var r = r0 - h[i]*( 2 * c[i] + c[i+1])/6;
                b.push(r);
            }

            var d = [];
            for( var i = 0; i < n; i++)
            {
                d.push((c[i+1] - c[i]) / (h[i] * 6));
            }
            
            var uniformPoints = [];
            for( var i = 0; i < n; i++)
            {
                for( var j = 0; j <= segments; j++)
                {
                    var t = h[i] * j / segments;
                    var t2 = t * t;
                    var t3 = t2 * t;

                    var dx = knots[i].x + t;
                    var dy = a[i] + b[i] * t + c[i] * t2 / 2 + d[i] * t3;
                    uniformPoints.push({x:dx, y:dy});
                }
            }
            return uniformPoints;
        }
        else
        {
            return [];
        }
    };

    //https://www.cnblogs.com/flysun027/p/10371726.html
    // knots: array,[(x0, y0), (x1, y1), ... (xn, yn)]
    var cubicTypeSpline = function(type, knots, segments)
    {
        if ( knots instanceof Array && knots.length > 0)
        {
            segments = segments || 25;
            var n = knots.length - 1;

            var h = [];//h[i] = knots[i + 1].x - knots[i].x
            var d = [];
            for( var i = 0; i < n; i++)
            {
                h.push(knots[i + 1].x - knots[i].x);
                d.push(( knots[i+1].y - knots[i].y ) / h[i]);
            }

            var a = [], b = [], c = [], f = [];
            switch ( type )
            {
                case "natural":
                    a = [0];
                    b = [1];
                    c = [0];
                    f = [0];
                    a[n] = 0;
                    b[n] = 1;
                    c[n] = 0;
                    f[n] = 0;
                break;
                case "clamped":
                    a[0] = 0;
                    c[n] = 0;
                    f[0] = 6 * (d[0] - a[0]);
                    f[n] = 6 * (c[n] - d[n - 1]);
                    c[0] = h[0];
                    a[n] = h[n - 1];
                    b[0] = 2 * h[0];
                    b[n] = 2 * h[n - 1];
                break;
                case "notaknot":
                    a = [h[0]];
                    b = [h[1]];
                    c = [-(h[0] + h[1])];
                    a[n] = -(h[n - 2] + h[n - 1]);
                    b[n] = h[n - 2];
                    c[n] = h[n - 1];
                    f = [0];
                    f[n] = 0;
                break;
            }
           
            for( var i = 1; i < n; i++)
            {
                a[i] = h[i - 1];
                b[i] = 2 * (h[i - 1] + h[i]);
                c[i] = h[i];
                f[i] = 6 * (d[i] - d[i - 1]);
            }

            if ( n > 2)
            {
                for( var i = 0; i <= n-3; i++ )
                {
                    if ( Math.abs(a[i + 1]) > Math.abs(b[i]))
                    {
                        var temp = a[i+1];
                        a[i+1] = b[i];
                        b[i] = temp;

                        temp = b[i+1];
                        b[i+1] = c[i];
                        c[i] = temp;

                        temp = c[i+1];
                        c[i+1] = a[i];
                        a[i] = temp;

                        temp = f[i + 1];
                        f[i+1] = f[i];
                        f[i] = temp;
                    }

                    var temp = a[i+1] / b[i];
                    a[i + 1] = 0;
                    b[i + 1] = b[i + 1] - temp * c[i];
                    c[i + 1] = c[i + 1] - temp * a[i];
                    f[i + 1] = f[i + 1] - temp * f[i];
                }
            }

            if (n >= 2)
            {
                if ( Math.abs(a[n - 1]) > Math.abs(b[n - 2]))
                {
                    var temp = a[n - 1];
                    a[n - 1] = b[n - 2];
                    b[n - 2] = temp;

                    temp = b[n - 1];
                    b[n - 1] = c[n - 2];
                    c[n - 2] = temp;

                    temp = c[n - 1];
                    c[n - 1] = a[n - 2];
                    a[n - 2] = temp;

                    temp = f[n - 1];
                    f[n - 1] = f[n - 2];
                    f[n - 2] = temp;
                }

                if ( Math.abs(c[n]) > Math.abs(b[n - 2]))
                {
                    var temp = c[n];
                    c[n] = b[n - 2];
                    b[n - 2] = temp;

                    temp = a[n];
                    a[n] = c[n - 2];
                    c[n - 2] = temp;

                    temp = b[n];
                    b[n] = a[n - 2];
                    a[n - 2] = temp;

                    temp = f[n];
                    f[n] = f[n - 2];
                    f[n - 2] = temp;
                }

                /* 消元 */
                var temp = a[n - 1] / b[n - 2];
                a[n - 1] = 0;
                b[n - 1] = b[n - 1] - temp * c[n - 2];
                c[n - 1] = c[n - 1] - temp * a[n - 2];
                f[n - 1] = f[n - 1] - temp * f[n - 2];
                /* 消元 */
                temp = c[n] / b[n - 2];
                c[n] = 0;
                a[n] = a[n] - temp * c[n - 2];
                b[n] = b[n] - temp * a[n - 2];
                f[n] = f[n] - temp * f[n - 2];
            }
            
            if ( Math.abs(a[n]) > Math.abs(b[n - 1]))
            {
                var temp = a[n];
                a[n] = b[n - 1];
                b[n - 1] = temp;

                temp = b[n];
                b[n] = c[n - 1];
                c[n - 1] = temp;

                temp = f[n];
                f[n - 1] = f[n - 1];
                f[n] = temp;
            }

            var temp = a[n] / b[n-1];
            a[n] = 0;
            b[n] = b[n] - temp * c[n - 1];
            f[n] = f[n] - temp * f[n - 1];

            var m = [];
            m[n] = f[n] / b[n];
            m[n - 1] = (f[n - 1] - c[n - 1] * m[n]) / b[n-1];
            for (i = n - 2; i >= 0; i--)
            {
                m[i] = ( f[i] - (m[i + 2] * a[i] + m[i + 1] * c[i]) ) / b[i];
            }
            
            var a = [];
            for( var i = 0; i < n; i++ )
            {
                a.push(knots[i].y);
            }

            var b = [];
            for( var i = 0; i < n; i++)
            {
                var r = d[i] - h[i]*( 2 * m[i] + m[i+1])/6;
                b.push(r);
            }

            var d = [];
            for( var i = 0; i < n; i++)
            {
                d.push((m[i+1] - m[i]) / (h[i] * 6));
            }

            var uniformPoints = [];
            for( var i = 0; i < n; i++)
            {
                for( var j = 0; j <= segments; j++)
                {
                    var t = h[i] * j / segments;
                    var t2 = t * t;
                    var t3 = t2 * t;

                    var dx = knots[i].x + t;
                    var dy = a[i] + b[i] * t + m[i] * t2 / 2 + d[i] * t3;
                    uniformPoints.push({x:dx, y:dy});
                }
            }
            return uniformPoints;
        }
        else
        {
            return [];
        }
    };

    Spline.naturalCubicSpline = function(knots, segments)
    {
        return cubicTypeSpline("natural", knots, segments);
    };

    Spline.clampedCubicSpline = function( knots, segments)
    {
        return cubicTypeSpline("clamped", knots, segments);
    };

    Spline.notaknotCubicSpline = function( knots, segments )
    {
        return cubicTypeSpline("notaknot", knots, segments);
    }

    //https://en.wikipedia.org/wiki/Cubic_Hermite_spline
    //tension [0, 1]
    // tension = 0, is catmull-rom spline
    // mk = (1 - tension) * (p[k+1] - p[k-1]) / (t[k+1] - t[k])
    // p[t] = (2*t^3 - 3*t^2 + 1) p[0] + (t^3 -2*t^2 + t)m[0] + (-2*t^3 + 3*t^2)p[1] + (t^3 - t^2)m[0];
    Spline.cardinalSpline = function(knots, segments, tension)
    {
        segments = segments || 25;
        tension = tension || 0.5;

        var n = knots.length;
        // need calculate p[k+1], p[k-1]
        knots.unshift(knots[0]);
        knots.push(knots[knots.length - 1]);
        var p = knots;
        var h = [];
        for( var i = 0; i <= segments; i++)
        {
            var t = i / segments;
            var t2 = t * t;
            var t3 = t2 * t;
            var h00 = 2 * t3 - 3*t2 + 1;
            var h10 = t3 - 2 * t2 + t;
            var h01 = -2*t3 + 3*t2;
            var h11 = t3 - t2;
            h.push({h00: h00, h10 : h10, h01 : h01, h11: h11});
        }
        
        var intervalPoints = [];

        for( var i = 1; i < n; i++ )
        {
            // t[k+1] - t[k - 1] = 2; because [t[k], t[k+1]] is a unit interval [0, 1]
            var m0x = (1 - tension) * (p[i+1].x - p[i - 1].x) / 2;
            var m0y = (1 - tension) * (p[i+1].y - p[i - 1].y) / 2;

            var m1x = (1 - tension) * (p[i+2].x - p[i].x) / 2;
            var m1y = (1 - tension) * (p[i+2].y - p[i].y) / 2;

            for( var j = 0; j <= segments; j++)
            {
                var x = h[j].h00 * p[i].x + h[j].h10 * m0x + h[j].h01 * p[i+1].x + h[j].h11 * m1x;
                var y = h[j].h00 * p[i].y + h[j].h10 * m0y + h[j].h01 * p[i+1].y + h[j].h11 * m1y;
                intervalPoints.push({x:x, y:y});
            }
        }
        return intervalPoints;
    };

    
    var getFirstControlPoints = function(rhs){
        var n = rhs.length;
        var x = [];
        var tmp = [];
        var b = 2.0;
        x[0] = rhs[0] / b;

        for(var i = 1; i < n; i++)
        {
            tmp[i] = 1 / b;
            b = (i < n-1 ? 4.0 : 3.5) - tmp[i];
            x[i] = (rhs[i] - x[i-1]) / b;
        }

        for(var i = 1; i < n; i++)
        {
            x[n - i - 1] -= tmp[n - i] * x[n - i];
        }
        return x;
    };

    var getCurveControlPoints = function( knots)
    {
        var firstControlPoints = [];
        var secondControlPoints = [];
        var n = knots.length - 1;
        if (n === 1)
        { // Special case: Bezier curve should be a straight line.
            // 3P1 = 2P0 + P3
            firstControlPoints[0] = new cc.Vec2((2 * knots[0].x + knots[1].x) / 3, (2 * knots[0].y + knots[1].y) / 3);

            // P2 = 2P1 – P0
            secondControlPoints[0] = new cc.Vec2(2 * firstControlPoints[0].x - knots[0].x,  2 * firstControlPoints[0].y - knots[0].y);
            return;
        }
        // Calculate first Bezier control points
        // Right hand side vector
        var rhs = [];

        // Set right hand side x values
        for (var i = 1; i < n - 1; ++i)
            rhs[i] = 4 * knots[i].x + 2 * knots[i + 1].x;

        rhs[0] = knots[0].x + 2 * knots[1].x;
        rhs[n - 1] = (8 * knots[n - 1].x + knots[n].x) / 2.0;
        // Get first control points x-values
        var x = getFirstControlPoints(rhs);

        // Set right hand side y values
        for (var i = 1; i < n - 1; ++i)
            rhs[i] = 4 * knots[i].y + 2 * knots[i + 1].y;
        rhs[0] = knots[0].y + 2 * knots[1].y;
        rhs[n - 1] = (8 * knots[n - 1].y + knots[n].y) / 2.0;
        // Get first control points y-values
        var y = getFirstControlPoints(rhs);

        // Fill output arrays.
        for (var i = 0; i < n; ++i)
        {
            // First control point
            firstControlPoints[i] = new cc.Vec2(x[i], y[i]);
            // Second control point
            if (i < n - 1)
                secondControlPoints[i] = new cc.Vec2(2 * knots
                    [i + 1].x - x[i + 1], 2 *
                    knots[i + 1].y - y[i + 1]);
            else
                secondControlPoints[i] = new cc.Vec2((knots
                    [n].x + x[n - 1]) / 2,
                    (knots[n].y + y[n - 1]) / 2);
        }
        return {firstControlPoints: firstControlPoints, secondControlPoints: secondControlPoints};
    };


    //https://www.codeproject.com/Articles/31859/Draw-a-Smooth-Curve-through-a-Set-of-2D-Points-wit
    Spline.bezierSpline = function( knots )
    {
        return getCurveControlPoints(knots);
    };

    module.exports = Spline;
}) ();