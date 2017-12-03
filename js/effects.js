class effect{
	constructor(){
		this.pos = new vec2();
		this.glowing = false;
	}
	
	add(glowing = false){
		this.glowing = glowing;
		if(glowing) glowEffects.push(this);
		else effects.push(this);
	}
	remove(){
		if(this.glowing) glowEffects.splice(glowEffects.indexOf(this), 1);
		else effects.splice(effects.indexOf(this), 1);
	}
	
	update(){}
	draw(ctx){}
}

class lightParticle extends effect{
	constructor(life = Math.rand() * 30 + 30){
		super();
		this.life = life;
		this.maxLife = life;
		this.vel;
		this.radius;
		this.intensity;
		this.color = [255,255,0,1];
	}
	
	update(){
		this.pos = this.pos.plus(this.vel);
		
		this.life--;
		if(this.life <= 0)
			this.remove();
	}
	
	add(){ super.add(true); }
	
	draw(ctx){
		var ints = this.intensity * (this.life / this.maxLife);
		var a = this.color[3] * (this.life / this.maxLife);
		var col = "rgba(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + "," + a + ")";
		
		drawLine(ctx, this.pos, this.pos.plus(this.vel), col, 2);
		
		lights.push({
			pos:this.pos,
			radius:this.radius,
			intensity:ints
		});
	}
}

class corpse extends effect{
	constructor(){
		super();
		this.isPlayer = false;
		this.pos = new vec2();
		this.vel = new vec2();
		this.isStatic = false;
		this.flipped = false;
	}
	
	update(){
		if(this.isStatic) return;
		this.vel.y += gravity / 2;
		this.pos = this.pos.plus(this.vel.multiply(0.5));
		this.checkCollisions(worldTerrain);
	}
	checkCollisions(terrain){
		if(this.pos.y >= terrain.bounds.bottom)
			this.hitGround(terrain.bounds.bottom);
		if(this.pos.y < terrain.bounds.top)
			this.hitCeiling(terrain.bounds.top);
		if(this.pos.x > terrain.bounds.right)
			this.hitLWall(terrain.bounds.right);
		if(this.pos.x < terrain.bounds.left)
			this.hitRWall(terrain.bounds.left);
		
		for(var i = terrain.terrainObjects.length - 1; i >= 0; i--){
			var tobj = terrain.terrainObjects[i];
			if(tobj.containsPoint(this.pos)){
				var bdist = this.pos.y - tobj.top;
				var cdist = tobj.bottom - this.pos.y;
				var rdist = this.pos.x - tobj.left;
				var ldist = tobj.right - this.pos.x;
				switch(Math.min(bdist, cdist, ldist, rdist)){
					case bdist: this.hitGround(tobj.top); break;
					case cdist: this.hitCeiling(tobj.bottom); break;
					case rdist: this.hitRWall(tobj.left); break;
					case ldist: this.hitLWall(tobj.right); break;
				}
			}
		}
	}
	hitGround(ypos){
		this.vel.y = 0;
		this.vel.x *= 0.8;
		this.pos.y = ypos;
		if(Math.abs(this.vel.x) < 0.1 && Math.abs(this.vel.y <= 0))
			this.isStatic = true;
	}
	hitCeiling(ypos){
		this.vel.y = 0;
		this.pos.y = ypos;
	}
	hitRWall(xpos){
		this.vel.x = 0;
		this.pos.x = xpos;
	}
	hitLWall(xpos){
		this.vel.x = 0;
		this.pos.x = xpos;
	}
	
	draw(ctx){
		var sprite = new box(
			0, this.isPlayer ? 0 : gfx.corpse.height / 2, 
			gfx.corpse.width / 3, gfx.corpse.height / 2);
		
		if(this.isStatic) sprite.position.x = sprite.width * 2;
		else{
			if(this.vel.y < 0) 
				sprite.position.x = sprite.width * 0;
			else if(this.vel.y > gravity) 
				sprite.position.x = sprite.width * 1;
			else sprite.position.x = sprite.width * 2;
		}
		
		drawSprite(ctx, gfx.corpse, 
			this.pos, 
			sprite, 
			sprite.size.multiply(2), 
			this.flipped);
	}
}