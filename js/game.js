var canvas,
	context,
	canvas_lighting,
	context_lighting;

var effects = [],
	lights = [];
	
var gfx = {},
	vfx = {}
	
var dt = 0,
	currentTime = 0;
	
var mousePos = new vec2(),
	controls = {},
	pressedKeys = [];
	
var camPos = new vec2();

var p1,
	worldTerrain,
	projectiles =[],
	clones = [];

var gameMode = 0;

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
		player: new Image(),
		clone: new Image(),
		bullet: new Image()
	};
	gfx.back_cave.src = "./gfx/back_cave.png"
	gfx.hud_manaBar.src = "./gfx/hud_manaBar.png";
	gfx.player.src = "./gfx/player.png";
	gfx.clone.src = "./gfx/clone.png";
	gfx.bullet.src = "./gfx/bullet.png";
	
	vfx = {
		light: new Image()
	};
	vfx.light.src = "./gfx/light.png";
}
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
	//console.log(e.key + ": " + e.keyCode);
	if(e.keyCode == 220)
		nextRound();
}
function onKeyUp(e){
	if(pressedKeys.includes(e.keyCode))
		pressedKeys.splice(pressedKeys.indexOf(e.keyCode), 1);
}
function hookControls(){
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
	document.body.append(canvas);
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
}
function init(){
	createCanvas();
	clrScreen(context);
	step();
	
	loadControlBindings();
	hookControls();
	
	startGame();
}

function startGame(){
	gameMode = 1;
	effects = [];
	lights = [];
	clones = [];
	projectiles = [];
	
	p1 = new player();
	worldTerrain = terrain.getDefaultTerrain(p1.pos);
	setCamCenter(p1.pos.clone());
}
function nextRound(){
	var clone = p1.createClone();
	clones.push(clone);
	
	effects = [];
	lights = [];
	projectiles = [];
	resetClones();
	
	p1 = new player();
	worldTerrain = terrain.getDefaultTerrain(p1.pos);
	setCamCenter(p1.pos.clone());
}
function resetClones(){
	for(var i = clones.length - 1; i >= 0; i--){
		clones[i].dead = false;
		clones[i].currentFrame = 0;
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
	if(gameMode == 1)
		updateGame();
}

function updateGame(){
	updateClones();
	
	p1.update();
	easeCamCenter(p1.pos.plus(new vec2(0, -50).plus(p1.vel.multiply(25))));
	
	updateProjectiles();
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
	
	if(gameMode == 1){
		worldTerrain.draw(ctx);
		drawClones(ctx);
		p1.draw(ctx);
		drawProjectiles(ctx);
	}
	
	drawLighting(ctx);
	drawEffects(ctx);
	drawHUD(ctx);
}
function drawBG(ctx){
	ctx.drawImage(gfx.back_cave, 0, 0);
}
function drawLighting(ctx){
	var ambientLight = 0.1;
	
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
function drawSprite(ctx, img, pos, spritebox, size, flip, angle){
	var tpos = pos.minus(camPos).plus(getScreenCenter());
	
	ctx.translate(tpos.x, tpos.y);
	ctx.rotate(angle);
	if(flip) ctx.scale(-1, 1);
	ctx.translate(size.x / -2, size.y / -2);
	
	ctx.drawImage(
		img,
		spritebox.left, spritebox.top,
		spritebox.width, spritebox.height,
		0, 0,
		size.x, size.y,
		);
	
	ctx.translate(size.x / 2, size.y / 2);
	if(flip) ctx.scale(-1, 1);
	ctx.rotate(-angle);
	ctx.translate(-tpos.x, -tpos.y);
}

window.addEventListener("load", init);