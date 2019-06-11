const Bezier = require('bezier-js')
const Simplify = require('simplify-js')
const utils = Bezier.getUtils()
const Draw = require('draw')
const cardinalSpline = require('cardinal-spline')

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
            this.clear();
            this.graphics.strokeColor = cc.color().fromHEX('#e5e5e5')
            var touchPoints = event.getLocation()
            this.paths.push(touchPoints)
            // this.beginSquads = this.createSquads( touchPoints, 5, 8);
        }, this)

        canvas.on(cc.Node.EventType.TOUCH_MOVE, function(event)
        {
            var touchPoints = event.getLocation()
            this.paths.push(touchPoints)
        }, this)
+
        canvas.on(cc.Node.EventType.TOUCH_END, function(event)
        {
            var self = this;
            var point = event.getLocation()
            this.paths.push(point)

            // this.simplifyTest();
            this.cardinalSplineTest();
            
        }, this)
    },

    

    // called every frame
    update: function (dt) {

    },

    clear: function()
    {
        var self = this;
        this.graphics.clear();
        this.paths = [];
    },

    cardinalSplineTest: function()
    {
        this.graphics.strokeColor = cc.color().fromHEX('#FF0000')
        var simplifyPoints = Simplify(this.paths, 5, true);

        var points = [];
        for(var i = 0; i < simplifyPoints.length; i++)
        {
            points.push(simplifyPoints[i].x);
            points.push(simplifyPoints[i].y);
        }

        var splinePoints = cardinalSpline(points, 0.2, 25);
        var dis = 0;
        var uniformPoints = [];
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
