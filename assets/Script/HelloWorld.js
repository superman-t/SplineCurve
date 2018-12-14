const Bezier = require('bezier-js')
const Simplify = require('simplify-js')
const utils = Bezier.getUtils()
cc.Class({
    extends: cc.Component,

    properties: {
        paths: []
    },
    drawCurve: function(ctx, curve, offset) {
        offset = offset || { x:0, y:0 };
        var ox = offset.x;
        var oy = offset.y;
        var p = curve.points, i;
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
    },

    getSqDist: function(p1, p2) {

        var dx = p1.x - p2.x,
            dy = p1.y - p2.y;
    
        return dx * dx + dy * dy;
    },
    
    // square distance from a point to a segment
    getSqSegDist: function(p, p1, p2) {
    
        var x = p1.x,
            y = p1.y,
            dx = p2.x - x,
            dy = p2.y - y;
    
        if (dx !== 0 || dy !== 0) {
    
            var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
    
            if (t > 1) {
                x = p2.x;
                y = p2.y;
    
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
    
        dx = p.x - x;
        dy = p.y - y;
    
        return dx * dx + dy * dy;
    },
    // rest of the code doesn't care about point format
    
    // basic distance-based simplification
    simplifyRadialDist: function(points, sqTolerance) {
    
        var prevPoint = points[0],
            newPoints = [prevPoint],
            point;
    
        for (var i = 1, len = points.length; i < len; i++) {
            point = points[i];
    
            if (this.getSqDist(point, prevPoint) > sqTolerance) {
                newPoints.push(point);
                prevPoint = point;
            }
        }
    
        if (prevPoint !== point) newPoints.push(point);
    
        return newPoints;
    },
    
    simplifyDPStep: function(points, first, last, sqTolerance, simplified) {
        var maxSqDist = sqTolerance,
            index;
    
        for (var i = first + 1; i < last; i++) {
            var sqDist = this.getSqSegDist(points[i], points[first], points[last]);
    
            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }
    
        if (maxSqDist > sqTolerance) {
            if (index - first > 1) this.simplifyDPStep(points, first, index, sqTolerance, simplified);
            simplified.push(points[index]);
            if (last - index > 1) this.simplifyDPStep(points, index, last, sqTolerance, simplified);
        }
    },
    
    // simplification using Ramer-Douglas-Peucker algorithm
    simplifyDouglasPeucker: function(points, sqTolerance) {
        var last = points.length - 1;
    
        var simplified = [points[0]];
        this.simplifyDPStep(points, 0, last, sqTolerance, simplified);
        simplified.push(points[last]);
    
        return simplified;
    },
    
    // both algorithms combined for awesome performance
    simplify: function(points, tolerance, highestQuality) {
    
        if (points.length <= 2) return points;
    
        var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
    
        points = highestQuality ? points : this.simplifyRadialDist(points, sqTolerance);
        points = this.simplifyDouglasPeucker(points, sqTolerance);
    
        return points;
    },

    getCurveControlPoints: function( knots)
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
    },

    getFirstControlPoints: function(rhs){
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
    },

    // use this for initialization
    onEnable: function () {
        var self = this
        let canvas = cc.find('Canvas')
        this.graphics = this.getComponent(cc.Graphics)
        this.graphics.lineWidth = 2
        this.graphics.strokeColor = cc.color().fromHEX('#e5e5e5')
        var radius = 3
        var point1 = {x:150, y:200}
        var point2 = {x:300, y:400}
        var point3 = {x:400, y:150}

        var curve = new Bezier(point1.x, point1.y, point2.x, point2.y, point3.x, point3.y)
        this.graphics.circle(point1.x, point1.y, radius)
        this.graphics.circle(point2.x, point2.y, radius)
        this.graphics.circle(point3.x, point3.y, radius)
        this.graphics.stroke()
        // this.drawCurve(this.graphics, curve)
        var doc = function(c){
            self.drawCurve(self.graphics, c)
        }
        // var outline = curve.offset(25)
        // cc.log("---->",outline.curves.length)
        // doc(outline.curves[3])
        // outline.forEach(doc)
        // curve.offset(-25).forEach(doc)

        canvas.on(cc.Node.EventType.TOUCH_START, function(event){
            var touchPoints = event.getLocation()
            // this.graphics.strokeColor = cc.color().fromHEX('#e5e5e5')
            // this.graphics.moveTo(touchPoints.x, touchPoints.y)
            this.paths.push(touchPoints)
        }, this)

        canvas.on(cc.Node.EventType.TOUCH_MOVE, function(event)
        {
            var touchPoints = event.getLocation()
            // this.graphics.lineTo(touchPoints.x, touchPoints.y)
            // this.graphics.stroke()
            this.paths.push(touchPoints)
        }, this)

        canvas.on(cc.Node.EventType.TOUCH_END, function(event)
        {
            var point = event.getLocation()
            // this.graphics.lineTo(point.x,point.y)
            // this.graphics.stroke()
            this.paths.push(point)
            cc.log(this.paths.length)
            this.graphics.strokeColor = cc.color().fromHEX('#FF0000')
            var simplifyPoints = this.simplify(this.paths, 10, true)
            // this.graphics.moveTo(simplifyPoints[0].x, simplifyPoints[0].y)
            // for(var i = 1; i < simplifyPoints.length; i++)
            // {
            //     this.graphics.lineTo(simplifyPoints[i].x, simplifyPoints[i].y)
            //     this.graphics.stroke()
            //     this.graphics.circle(simplifyPoints[i].x, simplifyPoints[i].y, 3)
            //     this.graphics.stroke()
            // }
            
            if (simplifyPoints.length > 2) {
                var controlPoints = this.getCurveControlPoints(simplifyPoints);
                var n = controlPoints.firstControlPoints.length;
                for (var i = 0; i < n; i++)
                {
                    this.graphics.circle(simplifyPoints[i].x, simplifyPoints[i].y, 3)
                    this.graphics.stroke()
                    this.graphics.strokeColor = cc.color().fromHEX('#FF0000')
                    var curve = new Bezier(simplifyPoints[i].x, simplifyPoints[i].y, 
                        controlPoints.firstControlPoints[i].x, controlPoints.firstControlPoints[i].y, 
                        controlPoints.secondControlPoints[i].x, controlPoints.secondControlPoints[i].y,
                        simplifyPoints[i+1].x, simplifyPoints[i+1].y)
                    this.drawCurve(this.graphics, curve)

                    curve.offset(40).forEach(doc)
                    curve.offset(-40).forEach(doc)
                }
                this.graphics.circle(simplifyPoints[simplifyPoints.length-1].x, simplifyPoints[simplifyPoints.length-1].y, 3)
                this.graphics.stroke()
            }
            else{
                var cx = (simplifyPoints[0].x + simplifyPoints[1].x) / 2;
                var cy = (simplifyPoints[0].y + simplifyPoints[1].y) / 2;
                var curve = new Bezier(simplifyPoints[0].x, simplifyPoints[0].y, cx, cy, simplifyPoints[1].x, simplifyPoints[1].y);
                this.drawCurve(this.graphics, curve)
                curve.offset(40).forEach(doc)
                curve.offset(-40).forEach(doc)
            }
            this.paths = []
        }, this)
    },

    

    // called every frame
    update: function (dt) {

    },
});
