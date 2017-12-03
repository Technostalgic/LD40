class terrain{
	constructor(){
		this.bounds = new box(-400, -300, 800, 600);
		this.terrainObjects = [];
	}
	
	add(tObj){
		this.terrainObjects.push(tObj);
	}
	
	static getDefaultTerrain(focus = new vec2()){
		var width = 100;
		var r = new terrain();
		
		r.add(new terrainObj(focus.x - width / 2, focus.y + 400, width));
		
		return r;
	}
	
	drawBounds(ctx){
		var thickness = 100;
		
		var gobj = new terrainObj(this.bounds.left, this.bounds.bottom, this.bounds.width, thickness);
		var lobj = new terrainObj(this.bounds.left - thickness, this.bounds.top, thickness, this.bounds.height);
		var robj = new terrainObj(this.bounds.right, this.bounds.top, thickness, this.bounds.height);
		var cobj = new terrainObj(this.bounds.left, this.bounds.top - thickness, this.bounds.width, thickness);
		
		drawBoxFill(ctx, gobj, "#CCC");
		drawBoxOutline(ctx, gobj, "#FFF", 2);
		drawBoxFill(ctx, lobj, "#CCC");
		drawBoxOutline(ctx, lobj, "#FFF", 2);
		drawBoxFill(ctx, robj, "#CCC");
		drawBoxOutline(ctx, robj, "#FFF", 2);
		drawBoxFill(ctx, cobj, "#CCC");
		drawBoxOutline(ctx, cobj, "#FFF", 2);
	}
	draw(ctx){
		this.drawBounds(ctx);
		for(var i = this.terrainObjects.length - 1; i >= 0; i--){
			this.terrainObjects[i].draw(ctx);
		}
	}
}

class terrainObj extends box{
	constructor(x = 0, y = x, w = 100, h = 20){
		super(x, y, w, h);
		this.isPlatform = false;
	}
	
	draw(ctx){
		if(!this.isPlatform)
			drawBoxFill(ctx, this, "#CCC");
		drawBoxOutline(ctx, this, "#FFF", 2);
	}
}