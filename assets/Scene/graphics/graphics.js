const Simplify = require('simplify-js')
const Draw = require('draw')
const cardinalSpline = require('cardinal-spline')
const Spline = require('Spline')

cc.Class({
    extends: cc.Component,

    properties: {
        paths: [],
        beginSquads: [],
        endSquads:[],
        entityRadius: 5.0,
        spacing: 20.0
    },

    createSquads: function(startPos, row, colomn, dir)
    {
        var self = this;
        var pawnDiameter = this.entityRadius * 2 + this.spacing;
        var beginX = (this.entityRadius + this.spacing * 0.5 ) * (colomn - 1);
        var beginY = 0;
        var squads = [];
        var initialDir = cc.v2(0, 1);
        dir = dir || initialDir;
        var radians = cc.pAngleSigned(cc.pNormalize(initialDir), cc.pNormalize(dir));
        for (var i = 0; i < row; ++i)
        {
            squads[i] = [];
            for (var j = 0; j < colomn; ++j)
            {
                var offset = cc.v2(beginX - pawnDiameter * j, beginY - pawnDiameter * i);
                offset.rotate(radians, offset);
                var pos = cc.pAdd( startPos, offset)
                this.graphics.circle(pos.x, pos.y, this.entityRadius)
                this.graphics.stroke()
                squads[i][j] = pos;
            }
        }
        return squads;
    },

    moveSquads: function( start, end, totalTime )
    {

    },

    // use this for initialization
    onEnable: function () {
        var self = this
        let canvas = cc.find('Canvas')
        this.graphics = this.getComponent(cc.Graphics)
        this.graphics.lineWidth = 2
        this.graphics.strokeColor = cc.color().fromHEX('#e5e5e5')

        canvas.on(cc.Node.EventType.TOUCH_START, function(event){
            // this.clear();
            this.graphics.strokeColor = cc.color().fromHEX('#e5e5e5')
            var touchPoints = event.getLocation()
            this.paths.push(touchPoints)
            this.graphics.circle(touchPoints.x, touchPoints.y, 3)
            this.graphics.stroke()
            // this.beginSquads = this.createSquads( touchPoints, 5, 8);
        }, this)

        canvas.on(cc.Node.EventType.TOUCH_MOVE, function(event)
        {
            // var touchPoints = event.getLocation()
            // this.paths.push(touchPoints)
        }, this)
+
        canvas.on(cc.Node.EventType.TOUCH_END, function(event)
        {
            // var self = this;
            // var point = event.getLocation()
            // this.paths.push(point)

            // this.simplifyTest();
            // this.cardinalSplineTest();
            // this.splineTest();
            
        }, this)
    },

    

    // called every frame
    update: function (dt) {

    },

    clear: function()
    {
        this.graphics.clear();
        this.paths = [];
    },

    generateCurve: function(event, splinetype)
    {
        if (this.paths.length <= 0) return;
        this.graphics.strokeColor = cc.color().fromHEX('#00FF00')
        for(var i=0;i < this.paths.length; i++)
        {
            this.graphics.circle(this.paths[i].x, this.paths[i].y, 3)
            this.graphics.stroke()
        }
        var simplifyPoints = Simplify(this.paths, 0.01, true);
        var splinePoints;
        var color;
        switch( splinetype )
        {
            case "bezier":
                {
                    splinePoints = Spline.bezierSpline(simplifyPoints);
                    if (simplifyPoints.length > 2) {
                        var controlPoints = splinePoints;
                        var n = controlPoints.firstControlPoints.length;
                        for (var i = 0; i < n; i++)
                        {
                            this.graphics.strokeColor = cc.color().fromHEX('#FF0000')
                            var curve = [simplifyPoints[i], 
                                controlPoints.firstControlPoints[i], 
                                controlPoints.secondControlPoints[i],
                                simplifyPoints[i+1]]
                            Draw.drawCurve(this.graphics, curve);
                        }
                    }
                    else
                    {
                        var cx = (simplifyPoints[0].x + simplifyPoints[1].x) / 2;
                        var cy = (simplifyPoints[0].y + simplifyPoints[1].y) / 2;
                        var curve = [simplifyPoints[0], {x:cx, y:cy}, simplifyPoints[1]];
                        Draw.drawCurve(this.graphics, curve)
                    }
                    return;
                }
            break;
            case "cardinal":
                splinePoints = Spline.cardinalSpline(simplifyPoints);
                color = '#00FF00';
            break;
            case "natural":
                splinePoints = Spline.naturalCubicSpline(simplifyPoints);
                color = '#FF0000';
            break;
            case "clamed":
                splinePoints = Spline.clampedCubicSpline(simplifyPoints);
                color = '#00FFFF';
            break;
            case "notaknot":
                splinePoints = Spline.notaknotCubicSpline(simplifyPoints);
                color = '#FFFF00';
            break;
            case "clear":
                {
                    this.clear();
                    return;
                }
            break;
        }

        this.graphics.strokeColor = cc.color().fromHEX(color)
        this.graphics.moveTo(splinePoints[0].x, splinePoints[0].y);
        for( var i = 1; i < splinePoints.length; i++)
        {            
            this.graphics.lineTo(splinePoints[i].x, splinePoints[i].y);
        }
        this.graphics.stroke();
    },

    simplifyUniformDistance: function ( points, sqTolerance )
    {
        var last = points.length - 1;
        var simplified = [points[0]];

        var dis = 0;
        var iLast = 0;
        for( var i = 1; i < last;)
        {
            var x1 = points[i].x;
            var y1 = points[i].y;
            var x2 = points[iLast].x;
            var y2 = points[iLast].y;
            var dx = x1 - x2;
            var dy = y1 - y2;
            var d1 = dx * dx + dy * dy;
            if ( d1 < 0.01 )
            {
                i++;
                continue;
            }
            iLast=i;
            i++;
            dis += d1;
            if ( dis >= sqTolerance )
            {
                simplified.push(points[i - 1]);
                dis = 0;
            }
        }

        simplified.push(points[last]);
        return simplified;

    },

    simplify: function (points, tolerance, highestQuality) {

        if (points.length <= 2) return points;

        var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
        points = this.simplifyUniformDistance( points, sqTolerance );

        return points;
    },
});
