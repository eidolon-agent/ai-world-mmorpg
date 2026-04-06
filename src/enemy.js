// src/enemy.js

var ENEMY_COUNTER = 0;

var ENEMY_TYPES = {
  slime:  { hp: 30, speed: 30, xp: 20, gold: 5 },
  goblin: { hp: 50, speed: 50, xp: 40, gold: 12 },
  bat:    { hp: 20, speed: 70, xp: 15, gold: 3 }
};

class Enemy {
  constructor(scene, type, x, y) {
    var def = ENEMY_TYPES[type];
    this.id = type + '-' + ENEMY_COUNTER++;
    this.scene = scene;
    this.type = type;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.speed = def.speed;
    this.xpReward = def.xp;
    this.goldReward = def.gold;
    this.alive = true;
    this.sprite = null;
    this.position = { x: x, y: y };
    this.targetPos = { x: x, y: y };
    this.patrolTimer = 0;
    this.flashTimer = 0;
    this.respawnTimer = 0;
  }

  createSprite() {
    var key = 'enemy_' + this.type;
    this.sprite = this.scene.physics.add.sprite(
      this.position.x, this.position.y, key);
    this.sprite.setScale(1);
    this.sprite.setDepth(3);
    this.alive = true;
  }

  patrol(delta) {
    if (!this.alive) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        this._respawn();
      }
      return;
    }

    if (!this.sprite || !this.sprite.active || !this.sprite.body) {
      this.createSprite();
    }

    this.flashTimer -= delta;
    if (this.flashTimer <= 0 && this.sprite && this.sprite.clearTint) {
      this.sprite.clearTint();
    }

    // Pick new patrol target periodically
    this.patrolTimer -= delta;
    if (this.patrolTimer <= 0) {
      this.targetPos.x = Phaser.Math.Between(32, this.scene.mapWidth - 32);
      this.targetPos.y = Phaser.Math.Between(32, this.scene.mapHeight - 32);
      this.patrolTimer = Phaser.Math.Between(2000, 4000);
    }

    // Chase player if nearby
    var ps = this.scene.playerSprite;
    if (ps && ps.active) {
      var playerDx = ps.x - this.position.x;
      var playerDy = ps.y - this.position.y;
      var playerDist = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
      if (playerDist < 120) {
        this.targetPos.x = ps.x;
        this.targetPos.y = ps.y;
      }
    }

    // Move toward target
    var mx = this.targetPos.x - this.position.x;
    var my = this.targetPos.y - this.position.y;
    var d = Math.sqrt(mx * mx + my * my);
    if (d > 2) {
      var spd = this.speed * (delta / 1000);
      this.position.x += (mx / d) * spd;
      this.position.y += (my / d) * spd;
      this.sprite.x = this.position.x;
      this.sprite.y = this.position.y;
    }
  }

  _respawn() {
    this.hp = this.maxHp;
    this.alive = true;
    this.position.x = Phaser.Math.Between(32, this.scene.mapWidth - 32);
    this.position.y = Phaser.Math.Between(32, this.scene.mapHeight - 32);
    this.targetPos.x = this.position.x;
    this.targetPos.y = this.position.y;
    var key = 'enemy_' + this.type;
    this.sprite = this.scene.physics.add.sprite(
      this.position.x, this.position.y, key);
    this.sprite.setDepth(3);
  }

  takeDamage(amount, source) {
    if (!this.alive) return false;
    this.hp -= amount;

    // Flash white
    if (this.sprite && this.sprite.setTint) {
      this.sprite.setTint(0xffffff);
      this.flashTimer = 150;
    }

    // Show damage number
    if (this.scene.showDamageNumber) {
      this.scene.showDamageNumber(this.position.x, this.position.y - 10, amount);
    }

    if (this.hp <= 0) {
      this.alive = false;
      this.respawnTimer = 5000;
      if (this.sprite && this.sprite.setActive) {
        this.sprite.setActive(false).setVisible(false);
      }
      return true;
    }
    return false;
  }
}

if (typeof window !== 'undefined') window.Enemy = Enemy;
