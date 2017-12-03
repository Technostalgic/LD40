class player extends character{
	constructor(){
		super();
		this.rFrames = [];
		this.health = 10;
		this.hitbox = new box(0, 0, 18, 38);
		this.pos = new vec2(-250);
		this.acc = new vec2();
		this.mana = 0;
		this.gunCooldown = 0;
		this.scale = 2;
		this._onGround = false;
		this._flipped = false;
		this._frame = 0;
	}
	
	createClone(){
		var r = new playerClone();
		
		r.frames = this.rFrames;
		this.rFrames = [];
		
		return r;
	}
	
	get currentRFrame(){
		if(this.rFrames.length <= 0) return null;
		return this.rFrames[this.rFrames.length - 1];
	}
	
	update(){
		if(this.gunCooldown > 0){
			this.gunCooldown -= 1;
			if(this.gunCooldown < 0)
				this.gunCooldown = 0;
		}
		
		this.rFrames.push(createPlayerFrame(new vec2(this.pos.x * -1, this.pos.y)));
		this.handlePhysics();
		super.update();
		this.checkCollisions();
		this.control();
	}
	handlePhysics(){
		var runSpeed = 5;
		
		this.acc.y += 0.7; //gravity
		
		//ground friction
		var fricforce = 0;
		if(this._onGround)
			if(Math.abs(this.acc.x) <= 0.1)
				fricforce = this.vel.x * -0.2;
		
		if(this.acc.x > 0){
			if(this.vel.x > runSpeed)
				this.acc.x = 0;
			else if(this.vel.x + this.acc.x > runSpeed)
				this.acc.x = runSpeed - this.vel.x;
		}
		else{
			if(this.vel.x < -runSpeed)
				this.acc.x = 0;
			else if(this.vel.x - this.acc.x < -runSpeed)
				this.acc.x = -runSpeed + this.vel.x;
		}
		
		
		this.acc.x += fricforce;
		this.vel = this.vel.plus(this.acc);
		this.acc = new vec2();
	}
	
	control(){
		if(controlActive(controls.right)) this.control_move(1);
		if(controlActive(controls.left)) this.control_move(-1);
		if(controlActive(controls.jump)) this.control_jump();
		if(controlActive(controls.attack)) this.control_fire();
	}
	control_move(dir){
		var accspeed = 0.25;
		dir = Math.sign(dir);
		
		this.acc.x += dir * accspeed;
	}
	control_jump(){
		if(this._onGround)
			this.vel.y = -9;
		else if(this.vel.y < 0)
			this.vel.y -= 0.475;
	}
	control_fire(){
		if(this.gunCooldown > 0) return;
		var cooldown = 20;
		var spd = 15;
		var ang = this._flipped ? Math.PI : 0;
		var angmod = 0;
		
		var p = new projectile(true);
		p.fire(this.getBarrelPos(), ang + angmod, spd);
		this.gunCooldown = cooldown;
		if(this.currentRFrame)
			this.currentRFrame.f = true;
		
		lights.push({
			pos:this.getBarrelPos(), 
			radius: 350, 
			intensity:1 });
	}
	
	getBarrelPos(){
		var tpos = new vec2(4, -4);
		if(this._flipped) tpos.x *= -1;
		return this.pos.plus(tpos.multiply(this.scale));
	}
	
	checkCollisions(){
		this._onGround = false;
		this.checkTerrainCollisions(worldTerrain);
	}
	checkTerrainCollisions(terrain){
		if(this.hitbox.bottom > terrain.bounds.bottom)
			this.hitGround(terrain.bounds.bottom);
		if(this.hitbox.right > terrain.bounds.right)
			this.hitRWall(terrain.bounds.right);
		if(this.hitbox.left < terrain.bounds.left)
			this.hitLWall(terrain.bounds.left);
		if(this.hitbox.top < terrain.bounds.top)
			this.hitCeiling(terrain.bounds.top);
		
		for(var i = terrain.terrainObjects.length - 1; i >= 0; i--){
			var ob = terrain.terrainObjects[i];
			if(this.hitbox.overlaps(ob))
				this.terrainObjCollide(ob);
		}
	}
	terrainObjCollide(terobj){
		var coldir = -1;
		
		if(this.vel.y > 0){
			var bdist = this.hitbox.bottom - terobj.top;
			if(this.vel.x > 0){
				if(bdist <= 1) coldir = bdist;
				else{
					var rdist = this.hitbox.right - terobj.left;
					coldir = bdist <= rdist ? 0 : 1;
				}
			}
			else if(this.vel.x < 0){
				if(bdist <= 1) coldir = bdist;
				else{
					var ldist = terobj.right - this.hitbox.left;
					coldir = bdist <= ldist ? 0 : 2;
				}
			}
			else {
				var ldist = terobj.right - this.hitbox.left;
				var rdist = this.hitbox.right - terobj.left;
				var bdist = this.hitbox.bottom - terobj.top;
				switch(Math.min(ldist, rdist, bdist)){
					case rdist: coldir = 1; break;
					case ldist: coldir = 2; break;
					case bdist: coldir = 0; break;
				}
			}
		}
		else if(this.vel.y < 0){
			var cdist = terobj.bottom - this.hitbox.top;
			if(this.vel.x > 0){
				var rdist = this.hitbox.right - terobj.left;
				coldir = cdist < rdist ? 3 : 1;
			}
			else if(this.vel.x < 0){
				var ldist = terobj.right - this.hitbox.left;
				coldir = cdist < ldist ? 3 : 2;
			}
			else {
				var ldist = terobj.right - this.hitbox.left;
				var rdist = this.hitbox.right - terobj.left;
				var bdist = this.hitbox.bottom - terobj.top;
				switch(Math.min(ldist, rdist, bdist)){
					case rdist: coldir = 1; break;
					case ldist: coldir = 2; break;
					case bdist: coldir = 0; break;
				}
			}
		}
		else{
			var bdist = this.hitbox.bottom - terobj.top;
			if(this.vel.x > 0){
				var rdist = this.hitbox.right - terobj.left;
				coldir = rdist < bdist ? 1 : 0;
			}
			else if(this.vel.x < 0){
				var ldist = terobj.right - this.hitbox.left;
				coldir = ldist < bdist ? 2 : 0;
			}
			else {
				var rdist = this.hitbox.right - terobj.left;
				var ldist = terobj.right - this.hitbox.left;
				coldir = rdist <= ldist ? 1 : 2;
			}
		}
		
		switch(coldir){
			case 0: this.hitGround(terobj.top); break;
			case 1: this.hitRWall(terobj.left); break;
			case 2: this.hitLWall(terobj.right); break;
			case 3: this.hitCeiling(terobj.bottom); break;
			default: this.hitGround(terobj.top); break;
		}
	}
	hitGround(ypos){
		this.vel.y = 0;
		this.pos.y = ypos - this.hitbox.height / 2;
		this.hitbox.setCenter(this.pos);
		this._onGround = true;
	}
	hitRWall(xpos){
		this.vel.x = 0;
		this.pos.x = xpos - this.hitbox.width / 2;
		this.hitbox.setCenter(this.pos);
	}
	hitLWall(xpos){
		this.vel.x = 0;
		this.pos.x = xpos + this.hitbox.width / 2;
		this.hitbox.setCenter(this.pos);
	}
	hitCeiling(ypos){
		this.vel.y = 0;
		this.pos.y = ypos + this.hitbox.height / 2;
		this.hitbox.setCenter(this.pos);
	}
	
	draw(ctx){
		var txtr = gfx.player;
		var frame = 0;
		var sprite = new box(0, 0, 12, 19);
		
		if(Math.abs(this.acc.x) > 0.1)
			frame = 2 + Math.floor(currentTime / 60) % 3;
		if(!this._onGround) frame = 1;
		if(Math.abs(this.acc.x) > 0.1){
			var f = this._flipped;
			this._flipped = this.acc.x < 0 ? true : false;
			if(f != this._flipped)
				this.currentRFrame.fl = true;
		}
		switch(frame){
			case 0: sprite.position = new vec2(); break;									//idle
			case 1: sprite.position = new vec2(sprite.width * 1, sprite.height * 0); break; //jumping
			case 2: sprite.position = new vec2(sprite.width * 0, sprite.height * 1); break; //running
			case 3: sprite.position = new vec2(sprite.width * 1, sprite.height * 1); break; //running
			case 4: sprite.position = new vec2(sprite.width * 2, sprite.height * 1); break; //running
		}
		this._frame = frame;
		
		drawSprite(ctx, txtr, this.pos, sprite, sprite.size.multiply(this.scale), this._flipped);
		//drawBoxOutline(ctx, this.hitbox, "#FFF");
		lights.push({pos:this.pos, radius: 1200, intensity: 0.75});
	}
}

class playerClone{
	constructor(){
		this.frames = [];
		this.currentFrame = 0;
		this.runFrameOffset = Math.random() * 60;
		this.hitbox = new box(0, 0, 18, 38);
		this.dead = false;
		this.lastVel = new vec2();
		this._flipped = true;
		
		this.vd = new vec2(); //derived velocity
		this.acc = new vec2();
		this.lastVel = this.vd;
	}
	
	get pos(){
		return this.frames[Math.min(this.currentFrame, this.frames.length - 1)].pos;
	}
	getBarrelPos(){
		var tpos = new vec2(4, -4);
		if(this._flipped) tpos.x *= -1;
		return vec2.fromOther(this.pos).plus(tpos.multiply(2));
	}
	fire(){
		var spd = 7.5;
		var ang = this._flipped ? Math.PI : 0;
		
		var p = new projectile(false);
		p.fire(this.getBarrelPos(), ang, spd);
		
		lights.push({
			pos:this.getBarrelPos(), 
			radius: 350, 
			intensity: 1 });
	}
	
	update(){
		if(this.dead) return;
		this.currentFrame++;
		if(this.currentFrame >= this.frames.length) return;
		
		this.hitbox.setCenter(this.pos);
		
		this.updateVars();
		if(this.frames[this.currentFrame].f)
			this.fire();
	}
	
	updateVars(){
		var cf = Math.min(this.currentFrame, this.frames.length - 1);
		cf = Math.max(0, cf - 1);
		var p0 = this.frames[cf].pos;
		var p1 = this.pos;
		this.vd = new vec2(p0.x - p1.x, p0.y - p1.y); //derived velocity
		this.acc = this.lastVel.minus(this.vd);
		
		if(this.frames[this.currentFrame].fl)
			this._flipped = !this._flipped;
		
		this.lastVel = this.vd;
	}
	
	draw(ctx){
		if(this.dead) return;
		//drawBoxOutline(ctx, this.hitbox, "#FFF");
		var sprite = new box(0, 0, 12, 19);
		var frame = 0;
		if(Math.abs(this.vd.x) > 0.5)
			frame = 2 + Math.floor((this.runFrameOffset + currentTime) / 60) % 3;
		if(this.vd.y != 0)
			frame = 1;
		switch(frame){
			case 0: sprite.position = new vec2(sprite.size.x * 0, sprite.size.y * 0); break;
			case 1: sprite.position = new vec2(sprite.size.x * 1, sprite.size.y * 0); break;
			case 2: sprite.position = new vec2(sprite.size.x * 0, sprite.size.y * 1); break;
			case 3: sprite.position = new vec2(sprite.size.x * 1, sprite.size.y * 1); break;
			case 4: sprite.position = new vec2(sprite.size.x * 2, sprite.size.y * 1); break;
		}
		drawSprite(ctx, gfx.clone, vec2.fromOther(this.pos), sprite, sprite.size.multiply(2), this._flipped);
	}
}

function createPlayerFrame(tpos, options = {}){
	var r = { pos: { x: tpos.x, y: tpos.y } };
	
	for(var i in options)
		eval("r." + i + "=" + options[i]);
	
	return r;
}