
BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {
  
  preload: function () {
    //  Show the loading progress bar asset we loaded in boot.js
    this.stage.backgroundColor = '#2d2d2d';

    this.preloadBar = this.add.sprite(this.game.width / 2 - 100, this.game.height / 2, 'preloaderBar');
    this.add.text(this.game.width / 2, this.game.height / 2 - 30, "Loading...", { font: "32px monospace", fill: "#fff" }).anchor.setTo(0.5, 0.5);

    //  This sets the preloadBar sprite as a loader sprite.
    //  What that does is automatically crop the sprite from 0 to full-width
    //  as the files below are loaded in.
    this.load.setPreloadSprite(this.preloadBar);

    //  Here we load the rest of the assets our game needs.
    this.load.image('titlepage', 'assets/titlepage.png');
    this.load.image('sea', 'assets/sea.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('enemyBullet', 'assets/enemy-bullet.png');
    this.load.image('powerup1', 'assets/powerup1.png');
    this.load.spritesheet('greenEnemy', 'assets/enemy.png', 32, 32);
    this.load.spritesheet('whiteEnemy', 'assets/shooting-enemy.png', 32, 32);
    this.load.spritesheet('boss', 'assets/boss.png', 93, 75);
    this.load.spritesheet('explosion', 'assets/explosion.png', 32, 32);
    this.load.spritesheet('player', 'assets/player.png', 64, 64);
    this.load.audio('explosion', ['assets/explosion.ogg', 'assets/explosion.wav']);
    this.load.audio('playerExplosion', ['assets/player-explosion.ogg', 'assets/player-explosion.wav']);
    this.load.audio('enemyFire', ['assets/enemy-fire.ogg', 'assets/enemy-fire.wav']);
    this.load.audio('playerFire', ['assets/player-fire.ogg', 'assets/player-fire.wav']);
    this.load.audio('powerUp', ['assets/powerup.ogg', 'assets/powerup.wav']);
    //this.load.audio('titleMusic', ['audio/main_menu.mp3']);
    //  + lots of other required assets here
  },

  create: function () {

    this.sea = this.add.tileSprite(0, 0, 800, 600, 'sea');
    
    
    // this.bullets = [];
    this.bulletPool = this.add.group();
    this.bulletPool.enableBody = true;
    this.bulletPool.PhysicsBodytype = Phaser.Physics.ARCADE;

    this.bulletPool.createMultiple(100, 'bullet');

    this.bulletPool.setAll('anchor.x', 0.5);
    this.bulletPool.setAll('anchor.y', 0.5);

    this.bulletPool.setAll('outOfBoundsKill', true);
    this.bulletPool.setAll('checkWorldBounds', true);

    this.nextShotAt = 0;
    this.shotDelay = 100;

    this.cursors = this.input.keyboard.createCursorKeys();

    // this.enemy = this.add.sprite(400, 200, 'greenEnemy');
    // this.enemy.animations.add('fly', [0,1,2], 20, true);
    // this.enemy.play('fly');
    // this.enemy.anchor.setTo(0.5,0.5);
    // this.physics.enable(this.enemy, Phaser.Physics.ARCADE);
    this.enemyPool = this.add.group();
    this.enemyPool.enableBody = true;
    this.enemyPool.PhysicsBodytype = Phaser.Physics.ARCADE;
    this.enemyPool.createMultiple(50, 'greenEnemy');
    this.enemyPool.setAll('anchor.x', 0.5);
    this.enemyPool.setAll('anchor.y', 0.5);
    this.enemyPool.setAll('outOfBoundsKill', true);
    this.enemyPool.setAll('checkWorldBounds', true);

    // Set the animation for each sprite
    this.enemyPool.forEach(function(enemy){
      enemy.animations.add('fly', [0,1,2], 20, true);
    });

    this.nextEnemyAt = 0;
    this.enemyDelay = 1000;


    this.player = this.add.sprite(400, 550, 'player');
    this.player.anchor.setTo(0.5,0.5);
    this.player.animations.add('fly', [0,1,2], 20, true);
    this.player.play('fly');
    this.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.speed = 300;
    this.player.body.collideWorldBounds = true;
    this.player.body.setSize(20, 20, 0, -5);

    this.instructions = this.add.text(400, 500, 
      'Use Arrow Keys to Move, Press Z to Fire\n' + 'Tapping/clicking does both',
      {font: '20px monospace', fill: '#fff', align: 'center'});
    this.instructions.anchor.setTo(0.5,0.5);
    this.instExpire = this.time.now + 10000;
  },

  update: function () {
    //  Honestly, just about anything could go here. It's YOUR game after all. Eat your heart out!
    this.sea.tilePosition.y += 0.7;
    // this.bullet.y -= 1;
    this.physics.arcade.overlap(
      // this.bulletPool, this.enemy, this.enemyHit, null, this
      this.bulletPool, this.enemyPool, this.enemyHit, null, this
    );
    // for (var i = 0; i < this.bullets.length; i++) {
    //   this.physics.arcade.overlap(this.bullets[i], this.enemy, this.enemyHit, null, this);
    // }

    this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;
    if (this.cursors.left.isDown) {
      this.player.body.velocity.x = -this.player.speed;
    } else if (this.cursors.right.isDown) {
      this.player.body.velocity.x = this.player.speed;
    }

    if (this.cursors.up.isDown) {
      this.player.body.velocity.y = -this.player.speed;
    } else if (this.cursors.down.isDown) {
      this.player.body.velocity.y = this.player.speed;
    }

    if (this.input.activePointer.isDown &&
      this.physics.arcade.distanceToPointer(this.player) > 15) {
      this.physics.arcade.moveToPointer(this.player, this.player.speed);
    }

    if (this.input.keyboard.isDown(Phaser.Keyboard.Z) ||
      this.input.activePointer.isDown) {
      this.fire();
    }

    if (this.instructions.exists && this.time.now > this.instExpire) {
      this.instructions.destroy();
    }

    if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0){
      this.nextEnemyAt = this.time.now + this.enemyDelay;
      var enemy = this.enemyPool.getFirstExists(false);
      enemy.reset(this.rnd.integerInRange(20, 780), 0);
      enemy.body.velocity.y = this.rnd.integerInRange(30, 60);
      enemy.play('fly');
    }

    this.physics.arcade.overlap(
      this.player, this.enemyPool, this.playerHit, null, this
    );
  },

  quitGame: function (pointer) {

    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');
  },

  enemyHit: function(bullet, enemy) {
    bullet.kill();
    enemy.kill();
    var explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
    explosion.anchor.setTo(0.5,0.5);
    explosion.animations.add('boom');
    explosion.play('boom', 15, false,true);
  },

  playerHit: function (player, enemy){
    enemy.kill();
    var explosion = this.add.sprite(player.x, player.y, 'explosion');
    explosion.anchor.setTo(0.5, 0.5);
    explosion.animations.add('boom');
    explosion.play('boom', 15, false, true);
    player.kill();
  },

  fire: function() {
    if (!this.player.alive || this.nextShotAt > this.time.now) {
      return;
    }
    if (this.bulletPool.countDead() === 0) {return;}

    this.nextShotAt = this.time.now + this.shotDelay;

    var bullet = this.bulletPool.getFirstExists(false);
    bullet.reset(this.player.x, this.player.y - 20);
    bullet.body.velocity.y = -300;
    // var bullet = this.add.sprite(this.player.x, this.player.y - 20, 'bullet');
    // bullet.anchor.setTo(0.5,0.5);
    // this.physics.enable(bullet, Phaser.Physics.ARCADE);
    // bullet.body.velocity.y = -300;
    // this.bullets.push(bullet);
  }

};
