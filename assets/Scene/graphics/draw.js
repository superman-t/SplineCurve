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

    Draw.drawPoint = function(ctx, points, color)
    {
        if (!ctx || points.length <= 0) return;
        ctx.strokeColor = cc.color().fromHEX(color);
        for(var i=0;i < points.length; i++)
        {
            ctx.circle(points[i].x, points[i].y, 3);
            ctx.stroke();
        }
    };

    Draw.drawSpline = function(ctx, splinePoints, color)
    {
        if (!ctx || splinePoints.length <= 0) return;
        ctx.strokeColor = cc.color().fromHEX(color)
        ctx.moveTo(splinePoints[0].x, splinePoints[0].y);
        for( var i = 1; i < splinePoints.length; i++)
        {            
            ctx.lineTo(splinePoints[i].x, splinePoints[i].y);
        }
        ctx.stroke();
    };
    module.exports = Draw;
})();
