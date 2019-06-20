const Bezier = require('bezier-js')
const Simplify = require('simplify-js')
const utils = Bezier.getUtils()
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
        if ( splinetype === "cubic")
        {
            this.cubicSplineTest();
        }
        else if ( splinetype == "cardinal")
        {
            this.cardinalSplineTest();
        }
        else if( splinetype == "natural_cubic")
        {
            this.naturalCubicSplineTest();
        }
        else if ( splinetype === "cubic2")
        {
            this.cubicSplineTest2();
        }
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

    naturalCubicSplineTest: function()
    {
        this.graphics.strokeColor = cc.color().fromHEX('#00FF00')
        for(var i=0;i < this.paths.length; i++)
        {
            this.graphics.circle(this.paths[i].x, this.paths[i].y, 3)
            this.graphics.stroke()
        }
        var simplifyPoints = Simplify(this.paths, 0.01, true);

        var splinePoints = Spline.naturalCubicSpline(simplifyPoints);
        this.graphics.strokeColor = cc.color().fromHEX('#0000FF')
        this.graphics.moveTo(splinePoints[0].x, splinePoints[0].y);
        for( var i = 1; i < splinePoints.length; i++)
        {            
            this.graphics.lineTo(splinePoints[i].x, splinePoints[i].y);
        }
        this.graphics.stroke();
    },

    cubicSplineTest: function()
    {
        this.graphics.strokeColor = cc.color().fromHEX('#00FF00')
        for(var i=0;i < this.paths.length; i++)
        {
            this.graphics.circle(this.paths[i].x, this.paths[i].y, 3)
            this.graphics.stroke()
        }
        // this.paths.push({x:1, y:1});
        // this.paths.push({x:2, y:2});
        // this.paths.push({x:4, y:3});
        // this.paths.push({x:5, y:4});
        var simplifyPoints = Simplify(this.paths, 0.01, true);

        var splinePoints = Spline.cubicSpline(simplifyPoints);
        this.graphics.strokeColor = cc.color().fromHEX('#0000FF')
        this.graphics.moveTo(splinePoints[0].x, splinePoints[0].y);
        for( var i = 1; i < splinePoints.length; i++)
        {            
            this.graphics.lineTo(splinePoints[i].x, splinePoints[i].y);
        }
        this.graphics.stroke();
    },

    cubicSplineTest2: function()
    {
        this.graphics.strokeColor = cc.color().fromHEX('#00FF00')
        for(var i=0;i < this.paths.length; i++)
        {
            this.graphics.circle(this.paths[i].x, this.paths[i].y, 3)
            this.graphics.stroke()
        }
        // this.paths.push({x:1, y:1});
        // this.paths.push({x:2, y:2});
        // this.paths.push({x:4, y:3});
        // this.paths.push({x:5, y:4});
        // this.paths.push({x:6, y:6});
        // this.paths.push({x:7, y:3});
        var simplifyPoints = Simplify(this.paths, 0.01, true);

        var splinePoints = Spline.cubicSpline2(simplifyPoints);
        this.graphics.strokeColor = cc.color().fromHEX('#0000FF')
        this.graphics.moveTo(splinePoints[0].x, splinePoints[0].y);
        for( var i = 1; i < splinePoints.length; i++)
        {            
            this.graphics.lineTo(splinePoints[i].x, splinePoints[i].y);
        }
        this.graphics.stroke();
    },

    cardinalSplineTest: function()
    {
        this.graphics.strokeColor = cc.color().fromHEX('#00FF00')
        for(var i=0;i < this.paths.length; i++)
        {
            this.graphics.circle(this.paths[i].x, this.paths[i].y, 1)
            this.graphics.stroke()
        }
        var simplifyPoints = Simplify(this.paths, 0.01, true);
        
        this.graphics.strokeColor = cc.color().fromHEX('#FF0000')
        var points = [];
        for(var i = 0; i < simplifyPoints.length; i++)
        {
            points.push(simplifyPoints[i].x);
            points.push(simplifyPoints[i].y);
        }

        var splinePoints = cardinalSpline(points, 0.3, 25);
        this.graphics.moveTo(splinePoints[0], splinePoints[1]);
        for( var i = 2; i < splinePoints.length-1; i+=2)
        {            
            this.graphics.lineTo(splinePoints[i], splinePoints[i+1]);
        }
        this.graphics.stroke();
        /*
        var dis = 0;
        var uniformPoints = [splinePoints[0], splinePoints[1]];
        this.graphics.strokeColor = cc.color().fromHEX('#0000FF')
        for(var i = 0; i < splinePoints.length-3; i+=2)
        {
            dis += cc.pDistance(cc.v2(splinePoints[i], splinePoints[i+1]), cc.v2(splinePoints[i+2], splinePoints[i+3]));
            if ( dis >= 16 )
            {
                uniformPoints.push(splinePoints[i+2]);
                uniformPoints.push(splinePoints[i+3]);
                this.graphics.circle(splinePoints[i+2], splinePoints[i+3], 3)
                this.graphics.stroke()
                dis = 0;
            }
        }

        this.graphics.moveTo(uniformPoints[0], uniformPoints[1]);
        for( var i = 2; i < uniformPoints.length-1; i+=2)
        {            
            this.graphics.lineTo(uniformPoints[i], uniformPoints[i+1])
        }
        this.graphics.stroke()
        */
    },

    simplifyTest: function()
    {
        this.graphics.strokeColor = cc.color().fromHEX('#FF0000')
        var simplifyPoints = Simplify(this.paths, 2, true);

        for(var i = 0; i < simplifyPoints.length; i++)
        {
            this.graphics.circle(simplifyPoints[i].x, simplifyPoints[i].y, 3)
            this.graphics.stroke()
        }

        if (simplifyPoints.length > 2) {
            var controlPoints = Draw.getCurveControlPoints(simplifyPoints);
            var n = controlPoints.firstControlPoints.length;
            for (var i = 0; i < n; i++)
            {
                this.graphics.strokeColor = cc.color().fromHEX('#FF0000')
                var curve = new Bezier(simplifyPoints[i].x, simplifyPoints[i].y, 
                    controlPoints.firstControlPoints[i].x, controlPoints.firstControlPoints[i].y, 
                    controlPoints.secondControlPoints[i].x, controlPoints.secondControlPoints[i].y,
                    simplifyPoints[i+1].x, simplifyPoints[i+1].y)
                Draw.drawCurve(this.graphics, curve)
            }
            this.graphics.circle(simplifyPoints[simplifyPoints.length-1].x, simplifyPoints[simplifyPoints.length-1].y, 3)
            this.graphics.stroke()
        }
        else{
            var cx = (simplifyPoints[0].x + simplifyPoints[1].x) / 2;
            var cy = (simplifyPoints[0].y + simplifyPoints[1].y) / 2;
            var curve = new Bezier(simplifyPoints[0].x, simplifyPoints[0].y, cx, cy, simplifyPoints[1].x, simplifyPoints[1].y);
            Draw.drawCurve(this.graphics, curve)
        }

        for ( var i = 1; i < simplifyPoints.length; i++)
        {
            var endPoint = simplifyPoints[i];
            var endPoint2 = simplifyPoints[i - 1];
            var direction = cc.pSub( endPoint, endPoint2);
            // this.createSquads( endPoint, 5, 8, cc.pNormalize( direction ));
        }
        // var endPoint = simplifyPoints[simplifyPoints.length - 1];
        // var endPoint2 = simplifyPoints[simplifyPoints.length - 2];
        // var direction = cc.pSub( endPoint, endPoint2);
        // this.endSquads = this.createSquads( point, 5, 8, cc.pNormalize( direction ));
    }
});
