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
    Spline.cubicSpline2 = function(knots, segments)
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

            // var a = [h[0]];
            // var b = [h[1]];
            // var c = [-(h[0] + h[1])];
            // var f = [0];
            // a[n] = -(h[n - 2] + h[n - 1]);
            // b[n] = h[n - 2];
            // c[n] = h[n - 1];
            // f[n] = 0;

            var a = [0];
            var b = [1];
            var c = [0];
            var f = [0];
            a[n] = 0;
            b[n] = 1;
            c[n] = 0;
            f[n] = 0;
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

    //https://en.wikipedia.org/wiki/Cubic_Hermite_spline
    Spline.cardinalSpline = function()
    {

    };

    
    //https://www.codeproject.com/Articles/31859/Draw-a-Smooth-Curve-through-a-Set-of-2D-Points-wit
    Spline.bezierSpline = function( knots )
    {


    };

    module.exports = Spline;
}) ();