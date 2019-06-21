(function () { 'use strict';

    var Draw = function()
    {
    };
    Draw.drawCurve = function(ctx, curve, offset) {
        offset = offset || { x:0, y:0 };
        var ox = offset.x;
        var oy = offset.y;
        var p = curve, i;
        ctx.moveTo(p[0].x + ox, p[0].y + oy);
        if(p.length === 3) {
        ctx.quadraticCurveTo(
            p[1].x + ox, p[1].y + oy,
            p[2].x + ox, p[2].y + oy
        );
        }
        if(p.length === 4) {
        ctx.bezierCurveTo(
            p[1].x + ox, p[1].y + oy,
            p[2].x + ox, p[2].y + oy,
            p[3].x + ox, p[3].y + oy
        );
        }
        ctx.stroke();
    };

    Draw.getCurveControlPoints = function( knots)
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
        var x = this.getFirstControlPoints(rhs);

        // Set right hand side y values
        for (var i = 1; i < n - 1; ++i)
            rhs[i] = 4 * knots[i].y + 2 * knots[i + 1].y;
        rhs[0] = knots[0].y + 2 * knots[1].y;
        rhs[n - 1] = (8 * knots[n - 1].y + knots[n].y) / 2.0;
        // Get first control points y-values
        var y = this.getFirstControlPoints(rhs);

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

    Draw.getFirstControlPoints = function(rhs){
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

    module.exports = Draw;
})();
