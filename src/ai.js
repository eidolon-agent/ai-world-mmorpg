// src/ai.js

class AIAgent {
  constructor(id, name, x, y) {
    this.id = id;
    this.name = name;
    this.hp = 100;
    this.maxHp = 100;
    this.xp = 0;
    this.maxXp = 100;
    this.level = 1;
    this.gold = 0;
    this.position = { x: x, y: y };
    this.target = null;
    this.cooldowns = { attack: 0, skill: 0 };
    this.sprite = null;
    this.nameTag = null;
    this.alive = true;
    this.respawnTimer = 0;
    this.aiTimer = 0;
  }

  update(delta, enemies, scene) {
    if (!this.alive) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        this.alive = true;
        this.hp = this.maxHp;
        this.position.x = Phaser.Math.Between(100, scene.mapWidth - 100);
        this.position.y = Phaser.Math.Between(100, scene.mapHeight - 100);
        if (this.sprite) {
          this.sprite.setPosition(this.position.x, this.position.y);
          this.sprite.setActive(true).setVisible(true);
          this.sprite.setAlpha(1);
        }
        if (this.nameTag) {
          this.nameTag.setPosition(this.position.x, this.position.y - 24);
          this.nameTag.setVisible(true);
        }
      }
      return;
    }

    this.cooldowns.attack -= delta;
    this.cooldowns.skill -= delta;

    if (!this.sprite || !this.sprite.active) {
      this.createSprite(scene);
      return;
    }

    var nearestEnemy = null;
    var nearestDist = 250;
    var i;
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e.alive) continue;
      var dd = Math.sqrt(
        (e.position.x - this.position.x) ** 2 +
        (e.position.y - this.position.y) ** 2);
      if (dd < nearestDist) { nearestDist = dd; nearestEnemy = e; }
    }

    if (nearestEnemy) {
      this.target = nearestEnemy;
      var dx = nearestEnemy.position.x - this.position.x;
      var dy = nearestEnemy.position.y - this.position.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 20) {
        this.position.x += (dx / dist) * 100 * (delta / 1000);
        this.position.y += (dy / dist) * 100 * (delta / 1000);
        this.sprite.setPosition(this.position.x, this.position.y);
        this.currentAction = 'moving';
      } else if (this.cooldowns.attack <= 0) {
        this.attack(nearestEnemy, scene);
      }
    } else {
      if (this.aiTimer <= 0) {
        this.position.x = Phaser.Math.Between(32, scene.mapWidth - 32);
        this.position.y = Phaser.Math.Between(32, scene.mapHeight - 32);
        this.aiTimer = Phaser.Math.Between(2000, 4000);
      }
      var dx2 = this.position.x - this.sprite.x;
      var dy2 = this.position.y - this.sprite.y;
      var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (dist2 > 4) {
        this.sprite.x += (dx2 / dist2) * 60 * (delta / 1000);
        this.sprite.y += (dy2 / dist2) * 60 * (delta / 1000);
      }
    }

    if (this.hp < this.maxHp * 0.5 && this.cooldowns.skill <= 0) {
      this.useSkill(scene);
    }
  }

  attack(enemy, scene) {
    var dmg = 15 + Math.floor(Math.random() * 10);
    var killed = enemy.takeDamage(dmg, 'ai');
    this.cooldowns.attack = 1000;
    if (killed) {
      var g = Phaser.Math.Between(5, 25);
      var xp = Phaser.Math.Between(15, 35);
      this.gold += g;
      this.xp += xp;
      if (this.xp >= this.maxXp) {
        this.level++;
        this.xp -= this.maxXp;
        this.maxHp += 20;
        this.maxXp = Math.floor(this.maxXp * 1.5);
        this.hp = Math.min(this.hp + 30, this.maxHp);
      }
      if (scene.showLootPopup) scene.showLootPopup(enemy.position.x, enemy.position.y - 20, g);
    }
  }

  useSkill(scene) {
    this.cooldowns.skill = 3000;
    this.hp = Math.min(this.hp + 20, this.maxHp);
    if (scene.createSkillParticles) scene.createSkillParticles(this.position.x, this.position.y);
  }

  createSprite(scene) {
    var key = 'ai_agent';
    if (!scene.textures.exists(key)) {
      var g = scene.add.graphics();
      g.fillStyle(0x00bfff, 1);
      g.fillCircle(16, 16, 14);
      g.generateTexture(key, 32, 32);
      g.destroy();
    }
    this.sprite = scene.physics.add.sprite(this.position.x, this.position.y, key);
    this.sprite.setScale(1.2);
    this.sprite.setDepth(5);
    this.nameTag = scene.add.text(this.position.x, this.position.y - 24, this.name, {
      fontSize: '10px', color: '#aaddff', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(6);
  }

  updateNameTag() {
    if (this.nameTag && this.sprite) {
      this.nameTag.setPosition(this.sprite.x, this.sprite.y - 24);
    }
  }
}

if (typeof window !== 'undefined') window.AIAgent = AIAgent;
