'use strict';

let Player = require('./models.js').Player;
let Enemy = require('./models.js').Enemy;


function sqCollide(s1, s2) {
	const c1 = s1.x < s2.x + s2.w; // right edge of square 1 is to the right of left edge of square 2
	const c2 = s2.x < s1.x + s1.w; // left edge of square 1 is to the left of right edge of square 2
	const c3 = s1.y + s1.h > s2.y; // top edge of square 1 is above bottom edge of square 2
	const c4 = s2.y + s2.h > s1.y //  bottom edge of the square 1 is below the top edge of the square 2
		// collision has happened
	return (c1 && c2 && c3 && c4);
}

function createEnemyBodies() {
	let range = Array(8).keys();
	// [0, 1, 2, 3...7]
	return range.map(function(i) {
		return range.map(function(j) {
			return Enemy({
				x: 45 * i,
				y: 20 + 45 * j
			});
		});
	}).reduce((result, next) => result.concat(next));
}

function GameState(args) {
	
	let {
	keys,
	inputs,
	x = 0,
	y = 0,
	gameRunning = false,
	bullets = [],
	enemies = createEnemyBodies(),
	player = Player({}),
	playerBulletNframeCounter = 0,
	playerFinalBulletNframeCount = 0
	} = args;
	let enemies = Object.freeze(enemies);
	let bullets = Object.freeze(bullets);
	let velX = 2;
	let velY = 10;
	let playerVel = 5;
	let killZone = 500;

	function interrogateKeyStates() {
		let leftPressedKey = keys.leftPressedKey;
		let rightPressedKey = keys.rightPressedKey;
		let spacePressedKey = keys.spacePressedKey;
		let rPressedKey = keys.rPressedKey;

		let moveLeft = leftPressedKey === true && player.x > 0;
		let moveRight = rightPressedKey === true && player.x < canvas.width - 32;
		let dir = 0;

		if (moveLeft) {
			dir = -1;
		} else if (moveRight) {
			dir = 1;
		}

		let newPlayer = player.assoc("x", player.x + dir * playerVel;);
		// get new GameState 
		let newGameState = assoc("player", newPlayer);

		let shoot = spacePressedKey === true
		if (rPressedKey === true) {
			return GameState();
		} else if (shoot) {
			return newGameState.playerShoots()
		} else {
			return newGameState;
		}
	}

	function update() {
		if (gameRunning) {
			let newGameState = merge({
				bullets: bullets.map(bullet => bullet.update()),
				player: player.update(),
				enemies: enemies.map(enemy => enemy.update(velX))
			}).enemyCollisionWithBorder().enemyShootsAI().bulletCollision();
			return newGameState;
		} else {
			// return old obj since there is no change
			return that;
		}
	}

	function playerShoots() {
		let newCounter = playerBulletNframeCounter;
		let newBullets = Array.Clone(bullets);
		
		if (playerBulletNframeCounter > 0) {
			newCounter = playerBulletNframeCounter - 1;
		}

		if (playerBulletNframeCounter === 0) {
			newBullets.push(PlayerBullet({
				x: player.x + player.w / 2,
				y: player.y
			}));
			inputs.playerShootSound.play();
			newCounter = playerFinalBulletNframeCount;
		}
		let newGameState = merge({counter: newCounter, bullets: newBullets});
		return newGameState;
	};

	function enemyShootsAI() {
		if ((Math.random() * 100) <= 1) {
			return enemyShoots();
		} else {
			return that;
		}
	}

	function enemyCollisionWithBorder() {
		// set the left and right most enemy positions - collision with boundary
		let leftMostEnemPix = enemies[0].x;
		let rightMostEnemPix = enemies[enemies.length - 1].x + enemies[0].w;
		let newVelX = velX;
		let newGameRunning = gameRunning;
		let newEnemies = enemies;
		// ensure that enemies doesn't pass the borders of the screen
		if (leftMostEnemPix < 0 || rightMostEnemPix > inputs.canvas.width) {
			// if they do, move them in the opposite direction
			newVelX = velX * -1;
			// make enemies go down
			newEnemies = enemies.map(enemy => {
				// enemy keeps going down
				let newY = enemy.y + velY;
				if (newY > killZone) {
					newGameRunning = false;
					inputs.status.innerHTML = 'You lose';
				}
			});
		}
		let newGameState = merge({velX: newVelX, gameRunning: newGameRunning, enemies: newEnemies});
		return newGameState;
	};

	function enemyShoots() {
		let randIndx = Math.floor(Math.random() * (enemies.length - 1));
		let enemy = enemies[randIndx];
		let newBullets = Array.Clone(bullets);
		let b = EnemyBullet({
			x: enemy.x,
			y: enemy.y
		});
		newBullets.push(b);
		inputs.invaderShootSound.play();
		let newGameState = assoc('bullets', newBullets);
		return newGameState;
	}

	function bulletCollision() {
	    let newGameRunning = gameRunning;
	    let newBullets = bullets;
	    let newEnemies = enemies;

		for (let i = 0; i < newBullets.length; i += 1) {
			// if it is the player's newBullets 
			if (newBullets[i].d === -1) {
				for (let j = 0; j < newEnemies.length; j += 1) {
					if (sqCollide(newEnemies[j], newBullets[i]) === true) {
						inputs.invaderDiesSound.play();
						newEnemies.splice(j, 1);
						newBullets.splice(i, 1);
						if (newEnemies.length === 0) {
							newGameRunning = false;
							inputs.status.innerHTML = 'You win';
						}
						break;
					}
				}
			}
			// else it is the enemies' bullets
			else {
				if (sqCollide(newBullets[i], player)) {
					inputs.playerDiesSound.play();
					newGameRunning = false;
					inputs.status.innerHTML = 'You lose';
				}
			}
		}
		let newGameState = merge({gameRunning: newGameRunning, bullets: newBullets, enemies: newEnemies});
		return newGameState;
	}

	let that = Object.freeze({
		x,
		y,
		gameRunning,
		bullets
		enemies,
		playerFinalBulletNframeCount,
		playerBulletNframeCounter,
		player,
		update
	});
	return that;
}

module.exports = States;