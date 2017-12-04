///	Made by Isaiah Smith; Technostalgic Games
///	http://technostalgic.tech | http://technostalgic.itch.io
/// twitter: @TehnostalgicGM

//prevents keyboard scrolling:
window.addEventListener("keydown", function(e) {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

var canvas,
	context,
	canvas_lighting,
	context_lighting,
	canvas_terrain,
	context_terrain;

var effects = [],
	glowEffects = [],
	lights = [];
	
var gfx = {},
	vfx = {},
	sfx = {};
	
var dt = 0,
	currentTime = 0,
	roundTime = 0;
	
var mousePos = new vec2(),
	controls = {},
	pressedKeys = []
	saveKey = "technostalgic_LD40_highscore";
	
var camPos = new vec2();

var p1,
	worldTerrain,
	projectiles =[],
	clones = [];
	
var gravity = 0.7,
	ambientLight = 0.2;
	
var gameMode = 0,
	roundNum = 0,
	roundTransition = 0,
	score = 0,
	highscore = 0;

function loadControlBindings(){
	controls = {
		right:39,
		left:37,
		up:38,
		down:40,
		jump:90,
		attack:67, 
		dodge:88,
		spacebar:32
	};
}
function loadGraphics(){
	gfx = {
		back_cave: new Image(),
		hud_manaBar: new Image(),
		tiles: new Image(),
		player: new Image(),
		clone: new Image(),
		corpse: new Image(),
		bullet: new Image()
	};
	gfx.back_cave.src = "./gfx/back_cave.png"
	gfx.hud_manaBar.src = "./gfx/hud_manaBar.png";
	gfx.tiles.src = "./gfx/tiles.png";
	gfx.player.src = "./gfx/player.png";
	gfx.clone.src = "./gfx/clone.png";
	gfx.corpse.src = "./gfx/corpse.png";
	gfx.bullet.src = "./gfx/bullet.png";
	
	vfx = {
		light: new Image()
	};
	vfx.light.src = "./gfx/light.png";
}
function loadSounds(){
	sfx = {
		music: new Audio("./sfx/music.ogg"),
		select: new Audio("./sfx/select.wav"),
		playerShoot: new Audio("./sfx/playerShoot.wav"),
		cloneShoot: new Audio("./sfx/cloneShoot.wav"),
		bulletHit: new Audio("./sfx/bulletHit.wav"),
		jump: new Audio("./sfx/jump.wav"),
		hitGround: new Audio("./sfx/hitGround.wav"),
		death1: new Audio("./sfx/death1.wav"),
		death2: new Audio("./sfx/death2.wav"),
		death3: new Audio("./sfx/death3.wav"),
		death4: new Audio("./sfx/death4.wav"),
		playerHurt: new Audio("./sfx/playerHurt.wav"),
		loseGame: new Audio("./sfx/loseGame.wav")
	};
}
function printTerrain(){
	context_terrain.clearRect(0, 0, canvas_terrain.width, canvas_terrain.height);
	worldTerrain.draw(context_terrain);
}
loadSounds();
loadGraphics();

function setCamCenter(pos){
	camPos = pos.clone();
}
function easeCamCenter(pos, strength = 0.25){
	var tpos = camPos.multiply(1 / strength).plus(pos.multiply(strength)).multiply(1/(strength + 1 / strength));
	setCamCenter(tpos);
}
function getScreenCenter(){
	return new vec2(canvas.width / 2, canvas.height / 2);
}

function updateMousePos(e){
	mousePos = new vec2(e.offsetX, e.offsetY);
}
function onKeyPress(e){
	if(!pressedKeys.includes(e.keyCode))
		pressedKeys.push(e.keyCode);

	if(gameMode != 1){
		if(e.keyCode == controls.spacebar)
			select();
	}
	
	//console.log(e.key + ": " + e.keyCode);
	if(e.keyCode == 220)
		nextRound();
}
function onKeyUp(e){
	if(pressedKeys.includes(e.keyCode))
		pressedKeys.splice(pressedKeys.indexOf(e.keyCode), 1);
}
function mouseDown(e){
	var m = new vec2(e.offsetX, e.offsetY).minus(getScreenCenter());
	camPos = camPos.plus(m);
	ambientLight = 0.9;
}
function hookControls(){
	//canvas.addEventListener("click", mouseDown);
	canvas.addEventListener("mousemove", updateMousePos);
	window.addEventListener("keydown", onKeyPress);
	window.addEventListener("keyup", onKeyUp);
}
function controlActive(control){
	return pressedKeys.includes(control);
}

function createCanvas(){
	canvas = document.createElement("canvas");
	canvas.id="canvas";
	canvas.width=800;
	canvas.height=600;
	document.body.appendChild(canvas);
	context = canvas.getContext("2d");
	context.mozImageSmoothingEnabled = false;
	context.webkitImageSmoothingEnabled = false;
	context.msImageSmoothingEnabled = false;
	context.imageSmoothingEnabled = false;
	
	canvas_lighting = document.createElement("canvas");
	canvas_lighting.width = canvas.width;
	canvas_lighting.height = canvas.height;
	context_lighting = canvas_lighting.getContext("2d");
	fillScreen(context_lighting, "rgba(0, 0, 0, 1)");
	
	canvas_terrain = document.createElement("canvas");
	canvas_terrain.width = 3000;
	canvas_terrain.height = 3000;
	context_terrain = canvas_terrain.getContext("2d");
	context_terrain.mozImageSmoothingEnabled = false;
	context_terrain.webkitImageSmoothingEnabled = false;
	context_terrain.msImageSmoothingEnabled = false;
	context_terrain.imageSmoothingEnabled = false;
	clrScreen(context_terrain, "rgba(0,0,0,0)");
}
function init(){
	loadHighscore();
	createCanvas();
	clrScreen(context);
	step();
	
	loadControlBindings();
	hookControls();
}

function select(){
	switch(gameMode){
		case 0: startGame(); break;
		case 2: nextRound(); break;
		case 3:
			if(score > highscore) 
				saveHighscore();
			startGame();
			break;
	}
	playSound(sfx.select);
}
function startGame(){
	gameMode = 1;
	roundNum = 0;
	score = 0;
	clones = [];
	
	worldTerrain = terrain.generateLevel();
	printTerrain();
	startRound();
	
	var clone = p1.createClone();
	clone.frames.push(createPlayerFrame(new vec2(p1.pos.x * -1, p1.pos.y)));
	clone.frames.push(createPlayerFrame(new vec2(p1.pos.x * -1, p1.pos.y)));
	clones.push(clone);
}
function startRound(){
	gameMode = 1;
	roundTransition = 0;
	roundTime = 0;
	effects = [];
	glowEffects = [];
	lights = [];
	projectiles = [];
	
	resetClones();
	
	p1 = new player();
	p1.pos = worldTerrain.findPlayerSpawnPoint();
	setCamCenter(p1.pos.clone());
}
function finishRound(){
	roundNum++;
	gameMode = 2;
	effects = [];
}
function nextRound(){
	var clone = p1.createClone();
	clones.push(clone);
	startRound();
	if(roundNum == 2)
		playMusic();
}
function loseGame(){
	gameMode = 3;
	effects = [];
}

function loadHighscore(){
	try{
		hi = localStorage.getItem(saveKey);
		if(!hi){
			hi = score;
			return;
		}
		highscore = Number.parseInt(hi);
	}
	catch(e){
		console.log(e);
	}
}
function saveHighscore(){
	highscore = score;
	try{
		localStorage.setItem(saveKey, score.toString());
	}
	catch(e){
		console.log(e);
	}
	console.log(localStorage.getItem(saveKey));
}

function allClonesDead(){
	for(var i = clones.length - 1; i >= 0; i--){
		if(!clones[i].dead)
			return false;
	}
	return true;
}
function resetClones(){
	for(var i = clones.length - 1; i >= 0; i--){
		clones[i].dead = false;
		clones[i].currentFrame = 0;
		clones[i]._flipped = true;
	}
}

function step(){
	var dstep = 16.66667;
	while(dt > 16.66667 / dstep){
		update();
		dt -= 16.66667 / dstep;
		
		if(dt > 60) dt = 0; //prevents too much timelag buildup
	}
	draw(context);
	dt += (performance.now() - currentTime) / 16.66667;
	currentTime = performance.now();
	requestAnimationFrame(step);
}

function update(){
	updateEffects();
	updateGlowEffects();
	if(gameMode == 1)
		updateGame();
}

function updateGame(){
	roundTime += 1;
	updateClones();
	
	p1.update();
	easeCamCenter(p1.pos.plus(new vec2(0, -50).plus(p1.vel.multiply(25))));
	
	updateProjectiles();
	
	if(roundTransition > 0){
		roundTransition++;
		if(roundTransition > 60){
			if(p1.isDead()) loseGame();
			else finishRound();
		}
	}
}
function updateClones(){
	for(var i = clones.length - 1; i >= 0; i--)
		clones[i].update();
}
function updateProjectiles(){
	for(var i = projectiles.length - 1; i >= 0; i--)
		projectiles[i].update();
}
function updateEffects(){
	for(var i = effects.length - 1; i >= 0; i--)
		effects[i].update();
}
function updateGlowEffects(){
	for(var i = glowEffects.length - 1; i >= 0; i--)
		glowEffects[i].update();
}

function drawClones(ctx){
	for(var i = clones.length - 1; i >= 0; i--)
		clones[i].draw(ctx);
}
function drawProjectiles(ctx){
	for(var i = projectiles.length - 1; i >= 0; i--)
		projectiles[i].draw(ctx);
}
function drawEffects(ctx){
	for(var i = effects.length - 1; i >= 0; i--)
		effects[i].draw(ctx);
}
function drawGlowEffects(ctx){
	for(var i = glowEffects.length - 1; i >= 0; i--)
		glowEffects[i].draw(ctx);
}

function clrScreen(ctx, color = "#AAA"){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	fillScreen(ctx, color);
}
function fillScreen(ctx, color = "#FFF"){
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw(ctx){
	clrScreen(ctx);
	drawBG(ctx);
	
	switch(gameMode){
		case 0: drawMainMenuScreen(ctx); break;
		case 1: drawGame(ctx); break;
		case 2: drawNextRoundScreen(ctx); break;
		case 3: drawGameOverScreen(ctx); break;
	}
	
	drawEffects(ctx);
	drawLighting(ctx);
	drawGlowEffects(ctx);
	if(gameMode == 1) 
		drawHUD(ctx);
}
function drawBG(ctx){
	ctx.drawImage(gfx.back_cave, 0, 0);
}
function drawLighting(ctx){
	context_lighting.globalCompositeOperation = "destination-out";
	var tLightLayer = document.createElement("canvas");
	tLightLayer.width = canvas_lighting.width;
	tLightLayer.height = canvas_lighting.height;
	var TLLctx = tLightLayer.getContext("2d");
	for(var i = 0; i < lights.length; i++){
		var pos = lights[i].pos;
		var radius = lights[i].radius || 100;
		var intensity = lights[i].intensity || 1;
		drawImg(TLLctx, vfx.light, pos, new vec2(radius), intensity);
	}
	lights = [];
	context_lighting.drawImage(tLightLayer, 0, 0);
	context_lighting.globalCompositeOperation = "source-over";
	
	ctx.drawImage(canvas_lighting, 0, 0);
	clrScreen(context_lighting, "rgba(0, 0, 0, " + (1 - ambientLight).toString() + ")");
}
function drawHUD(ctx){
	var tpos = new vec2(0, canvas.height - 70);
	var sprt = new box(0, 0, gfx.hud_manaBar.width, gfx.hud_manaBar.height / 2);
	ctx.drawImage(gfx.hud_manaBar, sprt.left, sprt.top, sprt.width, sprt.height, tpos.x, tpos.y, sprt.width * 2, sprt.height * 2);
	sprt = new box(0, gfx.hud_manaBar.height / 2, gfx.hud_manaBar.width, gfx.hud_manaBar.height / 2);
	ctx.drawImage(gfx.hud_manaBar, sprt.left, sprt.top, sprt.width, sprt.height, tpos.x, tpos.y, sprt.width * 2, sprt.height * 2);
}

function drawGame(ctx){
	ambientLight = 0.1;
	drawImg(ctx, canvas_terrain, new vec2());
	drawClones(ctx);
	p1.draw(ctx);
	drawProjectiles(ctx);
}
function drawMainMenuScreen(ctx){
	clrScreen(ctx, "#444");
	ambientLight = 0.3;
	camPos = getScreenCenter();
	ctx.textAlign = "center";
	
	ctx.font = "46px sans-serif";
	ctx.fillStyle = "#FFF";
	var tpos = getScreenCenter().plus(new vec2(0, -250));
	ctx.fillText("Clones", tpos.x, tpos.y + 10);
	lights.push({pos: tpos.plus(new vec2(0, 0)),radius: 500});
	lights.push({pos: tpos.plus(new vec2(0, 0)),radius: 200});
	tpos.y += 25;
	ctx.font = "16px sans-serif";
	ctx.fillStyle = "#DDD";
	ctx.fillText("the more you have.. well, it's not so great", tpos.x, tpos.y + 6);
	
	drawSpacePrompt(ctx, "Press 'space' to start");
	
	ctx.textAlign = "left";
	tpos = new vec2(3, canvas.height - 20);
	ctx.fillStyle = "#0F0";
	ctx.font = "12px sans-serif";
	ctx.fillText("game by: Technostalgic | @TechnostalgicGM", tpos.x, tpos.y);
	ctx.fillText("music by: Mark Sparling | @Markymark665", tpos.x, tpos.y + 15);
}
function drawNextRoundScreen(ctx){
	clrScreen(ctx, "#444");
	ambientLight = 0.3;
	camPos = getScreenCenter();
	
	ctx.textAlign = "center";
	ctx.font = "bold 32px sans-serif";
	ctx.fillStyle = "#FFF";
	
	var tpos = getScreenCenter().plus(new vec2(0, -250));
	ctx.fillText("Round #" + roundNum.toString(), tpos.x, tpos.y + 12);
	lights.push({pos: tpos.clone(),radius: 300,intensity: 0.5});
	lights.push({pos: tpos.plus(new vec2(75, 0)),radius: 300,intensity: 1});
	lights.push({pos: tpos.plus(new vec2(-75, 0)),radius: 300,intensity: 1});
	
	tpos.y += 100;
	ctx.font = "28px sans-serif";
	ctx.fillText("Score:" + score.toString(), tpos.x, tpos.y + 12);
		lights.push({pos: tpos.plus(new vec2(0, 20)),radius: 300});
	tpos.y += 20
	ctx.font = "16px sans-serif";
	ctx.fillStyle = "#AAA";
	ctx.fillText("HI:" + highscore.toString(), tpos.x, tpos.y + 8);
	
	drawSpacePrompt(ctx);
}
function drawGameOverScreen(ctx){
	clrScreen(ctx, "#444");
	ambientLight = 0.3;
	camPos = getScreenCenter();
	ctx.textAlign = "center";
	
	ctx.font = "bold 56px sans-serif";
	ctx.fillStyle = "#F44";
	var tpos = getScreenCenter().plus(new vec2(0, -250));
	ctx.fillText("Game Over", tpos.x, tpos.y + 12);
	lights.push({pos: tpos.clone(),radius: 450,intensity: 1});
	lights.push({pos: tpos.plus(new vec2(75, 0)),radius: 300,intensity: 1});
	lights.push({pos: tpos.plus(new vec2(-75, 0)),radius: 300,intensity: 1});
	
	ctx.fillStyle = "#FFF";
	tpos.y += 50;
	ctx.font = "26px sans-serif";
	ctx.fillText("You made it to round #" + roundNum.toString(), tpos.x, tpos.y + 10);
	
	tpos.y += 100;
	ctx.font = "32px sans-serif";
	ctx.fillText("Score:" + score.toString(), tpos.x, tpos.y + 12);
		lights.push({pos: tpos.plus(new vec2(0, 20)),radius: 300});
	tpos.y += 30
	ctx.font = "24px sans-serif";
	ctx.fillStyle = "#AAA";
	ctx.fillText("HI:" + highscore.toString(), tpos.x, tpos.y + 8);
	
	drawSpacePrompt(ctx, "Press 'space' to try again");
}
function drawSpacePrompt(ctx, message = "Press 'space' to continue"){
	ctx.font = "32px sans-serif";
	ctx.fillStyle = "#FFF";
	tpos = getScreenCenter().plus(new vec2(0, 250));
	ctx.fillText(message, tpos.x, tpos.y + 12);
	if(currentTime % 800 < 400 || currentTime % 800 >= 750){
		lights.push({pos: tpos.clone(),radius: 200});
		lights.push({pos: tpos.plus(new vec2(125, 0)),radius: 200});
		lights.push({pos: tpos.plus(new vec2(-125, 0)),radius: 200});
	}
	if(currentTime % 800 < 300){
		lights.push({pos: tpos.clone(),radius: 400});
		lights.push({pos: tpos.plus(new vec2(125, 0)),radius: 400});
		lights.push({pos: tpos.plus(new vec2(-125, 0)),radius: 400});
	}
}

function drawLine(ctx, start, end, color, thickness = 2){
	var tstart = start.minus(camPos).plus(getScreenCenter());
	var tend = end.minus(camPos).plus(getScreenCenter());
	
	ctx.strokeStyle = color;
	ctx.lineWidth = thickness;
	ctx.beginPath();
	ctx.moveTo(tstart.x, tstart.y);
	ctx.lineTo(tend.x, tend.y);
	ctx.stroke();
}
function drawBoxFill(ctx, bx, color){
	var tbox = bx.clone();
	tbox.position = tbox.position.minus(camPos).plus(getScreenCenter());
	tbox.drawFill(ctx, color);
}
function drawBoxOutline(ctx, bx, color, thickness = 1){
	var tbox = bx.clone();
	tbox.position = tbox.position.minus(camPos).plus(getScreenCenter());
	tbox.drawOutline(ctx, color, thickness);
}
function drawPolyFill(ctx, poly, color){
	var tpol = poly.getRenderClone().setPos(camPos.inverted.plus(getScreenCenter()));
	tpol.drawFill(ctx, color);
}
function drawPolyOutline(ctx, poly, color, thickness = 1){
	var tpol = poly.getRenderClone().setPos(camPos.inverted.plus(getScreenCenter()));
	tpol.drawOutline(ctx, color, thickness);
}

function drawImg(ctx, img, pos, size = null, alpha = 1){
	var sz = size || new vec2(img.width, img.height);
	var tpos = pos.minus(camPos).plus(getScreenCenter());
	ctx.globalAlpha = alpha;
	ctx.drawImage(
		img, 
		tpos.x - sz.x / 2, tpos.y - sz.y / 2, 
		sz.x, sz.y
		);
	ctx.globalAlpha = 1;
}
function drawSprite(ctx, img, pos, spritebox, size, flip, angle = 0, abs = false){
	var tpos = pos;
	if(!abs) tpos = pos.minus(camPos).plus(getScreenCenter());
	
	ctx.translate(tpos.x, tpos.y);
	ctx.rotate(angle);
	if(flip) ctx.scale(-1, 1);
	ctx.translate(size.x / -2, size.y / -2);
	
	ctx.drawImage(
		img,
		spritebox.left, spritebox.top,
		spritebox.width, spritebox.height,
		0, 0,
		size.x, size.y
		);
	
	ctx.translate(size.x / 2, size.y / 2);
	if(flip) ctx.scale(-1, 1);
	ctx.rotate(-angle);
	ctx.translate(-tpos.x, -tpos.y);
}

function playSound(sound, restart = true, volume = 1){
	if(restart) sound.currentTime = 0;
	sound.volume = volume;
	sound.play();
}
function playMusic(volume = 1){
	sfx.music.volume = volume * 0.65;
	sfx.music.loop = true;
	sfx.music.play();
}
function stopMusic(){
	sfx.music.pause();
	sfx.music.currentTime = 0;
}

window.addEventListener("load", init);