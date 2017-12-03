class object{
	constructor(){
		this.pos = new vec2();
		this.vel = new vec2();
	}
	
	update(){
		this.pos = this.pos.plus(this.vel);
	}
	draw(ctx){}
}

class character extends object{
	constructor(){
		super();
		this.health = 5;
		this.hitbox = new box();
	}
	
	update(){
		super.update();
		this.hitbox.setCenter(this.pos.clone());
	}
}

class projectile extends object{
	constructor(friendly = false){
		super();
		this.friendly = friendly;
	}
	
	update(){
		super.update();
		this.checkCollisions();
	}
	
	checkCollisions(){
		if(this.friendly)
			this.checkCloneCollisions();
		else this.checkPlayerCollision(p1);
		this.checkTerrainCollisions(worldTerrain);
	}
	checkTerrainCollisions(terrain){
		var bpos = null;
		if(this.pos.x > terrain.bounds.right)
			bpos = new vec2(terrain.bounds.right, this.pos.y); 
		if(this.pos.x < terrain.bounds.left)
			bpos = new vec2(terrain.bounds.left, this.pos.y);
		if(this.pos.y > terrain.bounds.bottom)
			bpos = new vec2(this.pos.x, terrain.bounds.bottom);
		if(this.pos.y < terrain.bounds.top )
			bpos = new vec2(this.pos.x, terrain.bounds.top);
		
		if(bpos){
			this.pos = bpos;
			this.destroy();
			return;
		}
		
		for(var i = terrain.terrainObjects.length - 1; i >= 0; i--){
			var tobj = terrain.terrainObjects[i];
			var r = ray.fromPoints(this.pos.minus(this.vel), this.pos);
			var sect = tobj.rayIntersect(r);
			if(sect){
				this.pos = sect.clone();
				this.destroy();
			}
		}
	}
	checkCloneCollisions(){
		for(var i = clones.length - 1; i >= 0; i--){
			if(clones[i].dead) continue;
			if(clones[i].hitbox.containsPoint(this.pos)){
				this.hitClone(clones[i]);
				return;
			}
			var r = ray.fromPoints(this.pos.minus(this.vel), this.pos);
			var sect = clones[i].hitbox.rayIntersect(r);
			if(sect){
				this.pos = sect.clone();
				this.hitClone(clones[i]);
			}
		}
	}
	checkPlayerCollision(player){
		if(player.hitbox.containsPoint(this.pos)){
			this.hitPlayer(player);
			return;
		} 
		var r = ray.fromPoints(this.pos.minus(this.vel), this.pos);
		var sect = player.hitbox.rayIntersect(r);
		if(sect){
			this.pos = sect.clone();
			this.hitPlayer(player);
		}
	}
	
	hitClone(clone){
		clone.dead = true;
		this.destroy();
	}
	hitPlayer(player){
		this.destroy();
	}
	
	add(){
		projectiles.push(this);
	}
	remove(){
		if(projectiles.includes(this))
			projectiles.splice(projectiles.indexOf(this), 1);
	}
	fire(pos, dir, speed){
		this.pos = pos.clone();
		this.vel = vec2.fromAng(dir, speed);
		this.add();
	}
	destroy(){
		this.remove();
	}
	
	draw(ctx){
		var rad = this.friendly ? 200 : 100;
		
		var sprite = new box(0, 
			this.friendly ? 0 : gfx.bullet.height / 2, 
			gfx.bullet.width, gfx.bullet.height / 2);
		
		drawSprite(
			ctx, 
			gfx.bullet, 
			this.pos, 
			sprite,
			sprite.size.multiply(2), 
			false, 
			this.vel.direction());
		
		lights.push({
			pos:this.pos.clone(), 
			radius:rad, 
			intensity:0.6});
		lights.push({
			pos:this.pos.clone(), 
			radius:25, 
			intensity:1});
	}
}