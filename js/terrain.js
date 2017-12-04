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
		
		var ob = new terrainObj(0, 0, 125, 32);
		
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
	
	findPlayerSpawnPoint(){
		var pspawns = [];
		for(var i = this.terrainObjects.length - 1; i >= 0; i--)
			if(this.terrainObjects[i].right < 0)
				pspawns.push(this.terrainObjects[i]);
		
		var rs = Math.floor(pspawns.length * Math.random());
		var r = pspawns[rs].center();
		r.y = pspawns[rs].top - 19;
		return r;
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
		var thickness = Math.floor(1000 / 32) * 32;
		
		var gobj = new terrainObj(this.bounds.left - thickness, this.bounds.bottom, this.bounds.width + 2 * thickness, thickness);
		var lobj = new terrainObj(this.bounds.left - thickness, this.bounds.top - thickness, thickness, this.bounds.height + 2 * thickness);
		var robj = new terrainObj(this.bounds.right, this.bounds.top - thickness, thickness, this.bounds.height + 2 * thickness);
		var cobj = new terrainObj(this.bounds.left - thickness, this.bounds.top - thickness, this.bounds.width + 2 * thickness, thickness);
		
		gobj.draw(ctx);
		lobj.draw(ctx);
		robj.draw(ctx);
		cobj.draw(ctx);
		drawBoxOutline(ctx, this.bounds, "#FFF", 2);
	}
	draw(ctx){
		for(var i = this.terrainObjects.length - 1; i >= 0; i--){
			this.terrainObjects[i].draw(ctx);
		}
		this.drawBounds(ctx);
	}
}

class terrainObj extends box{
	constructor(x = 0, y = x, w = 100, h = 20){
		super(x, y, w, h);
		this.isPlatform = false;
		this.size = new vec2(
			Math.floor(this.width / 32) * 32,
			Math.floor(this.height / 32) * 32);
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
		var tpos = this.position.plus(new vec2(1500));
		
		var sprite = new box(0, 0, 16, 16);
		for(var x = 0; x < this.width; x += 32){
			if(x == 0) sprite.position.x = 16;
			else if(x + 32 >= this.width) sprite.position.x = 32;
			else sprite.position.x = 0;
			
			for(var y = 0; y < this.height; y += 32){
				drawSprite(
					ctx,
					gfx.tiles,
					tpos.plus(new vec2(x, y)).plus(new vec2(16)),
					sprite,
					new vec2(32),
					false,
					0,
					true
					);
			}
		}
	}
}