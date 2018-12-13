const Bezier = require('bezier-js')
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

    // use this for initialization
    onEnable: function () {
        var self = this
        let canvas = cc.find('Canvas')
        this.graphics = this.getComponent(cc.Graphics)
        this.graphics.lineWidth = 2
        this.graphics.strokeColor = cc.color().fromHEX('#e5e5e5')

        var curve = new Bezier(200,200 , 250,450 , 600,300)

        this.drawCurve(this.graphics, curve)
        var doc = function(c){
            self.drawCurve(self.graphics, c)
        }
        var outline = curve.offset(25)
        // cc.log("---->",outline.curves.length)
        // doc(outline.curves[3])
        outline.forEach(doc)
        curve.offset(-25).forEach(doc)

        canvas.on(cc.Node.EventType.TOUCH_START, function(event){
            var touchPoints = event.getLocation()
            this.graphics.moveTo(touchPoints.x, touchPoints.y)
        }, this)

        canvas.on(cc.Node.EventType.TOUCH_MOVE, function(event)
        {
            var touchPoints = event.getLocation()
            this.graphics.lineTo(touchPoints.x, touchPoints.y)
            this.graphics.stroke()
        }, this)

        canvas.on(cc.Node.EventType.TOUCH_END, function(event)
        {
            var point = event.getLocation()
            ctx.lineTo(point.x,point.y)
            ctx.stroke()
        }, this)
        
    },

    // called every frame
    update: function (dt) {

    },
});
