class terrain{
	constructor(){
		this.bounds = new box(-500, -300, 1000, 600);
		this.terrainObjects = [];
	}
	
	add(tObj){
		this.terrainObjects.push(tObj);
	}
	
	static getDefaultTerrain(focus = new vec2()){
		var width = 100;
		var r = new terrain();
		
		r.add(new terrainObj(focus.x - width / 2, focus.y + 400, width));
		
		return r.mirrorify();
	}
	static generateLevel(){
		var r = new terrain();
		
		var ob = new terrainObj(0, 0, 125, 20);
		
		var l1 = 125;
		ob.position.y = r.bounds.bottom - l1;
		var l1c = 0;
		for(var i = 0; i < 3; i++){
			if(Math.random() < 0.33) continue;
			var xpos = 50 + i * ob.width;
			ob.position.x = xpos;
			r.terrainObjects.push(ob.clone());
			l1c++;
		}
		
		var l2 = l1 + 125;
		ob.position.y = r.bounds.bottom - l2;
		for(var i = 0; i < l1c + 1; i++){
			if(Math.random() < 0.33) continue;
			var xpos = 50 + i * ob.width;
			ob.position.x = xpos;
			r.terrainObjects.push(ob.clone());
		}
		
		return r.mirrorify();
	}
	
	mirrorify(){
		var mobjs = [];
		for(var i = 0; i < this.terrainObjects.length; i++){
			var ob = this.terrainObjects[i];
			var nl = -ob.right;
			var nr = -ob.left;
			var p = ob.isPlatform;
			
			ob = terrainObj.fromBounds(nl, nr, ob.top, ob.bottom);
			ob.isPlatform = p;
			mobjs.push(ob);
		}
		
		this.terrainObjects = this.terrainObjects.concat(mobjs);
		return this;
	}
	
	drawBounds(ctx){
		var thickness = 1000;
		
		var gobj = new terrainObj(this.bounds.left - thickness, this.bounds.bottom, this.bounds.width + 2 * thickness, thickness);
		var lobj = new terrainObj(this.bounds.left - thickness, this.bounds.top - thickness, thickness, this.bounds.height + 2 * thickness);
		var robj = new terrainObj(this.bounds.right, this.bounds.top - thickness, thickness, this.bounds.height + 2 * thickness);
		var cobj = new terrainObj(this.bounds.left - thickness, this.bounds.top - thickness, this.bounds.width + 2 * thickness, thickness);
		
		drawBoxFill(ctx, gobj, "#CCC");
		drawBoxFill(ctx, lobj, "#CCC");
		drawBoxFill(ctx, robj, "#CCC");
		drawBoxFill(ctx, cobj, "#CCC");
		drawBoxOutline(ctx, this.bounds, "#FFF", 2);
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
	
	static fromBounds(l, r, t, b){
		var r = new terrainObj(l, t, r - l, b - t);
		
		return r;
	}
	
	clone(){
		var r = new terrainObj(this.left, this.top, this.width, this.height);
		r.isPlatform = this.isPlatform;
		return r;
	}
	
	draw(ctx){
		if(!this.isPlatform)
			drawBoxFill(ctx, this, "#CCC");
		drawBoxOutline(ctx, this, "#FFF", 2);
	}
}