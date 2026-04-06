// src/scene.js

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    // Player sprite
    this.load.image('player', 'assets/sprites/player.png');
    // Enemy sprites
    this.load.image('enemy_slime', 'assets/sprites/slime.png');
    this.load.image('enemy_goblin', 'assets/sprites/goblin.png');
    this.load.image('enemy_bat', 'assets/sprites/bat.png');
    // Tilesets (optional, have fallback)
    this.load.image('tiles_forest', 'assets/tilesets/tiles_forest.png');
    this.load.image('tiles_dungeon', 'assets/tilesets/tiles_dungeon.png');

    // Effects (optional)
    this.load.image('slash', 'assets/effects/slash.png');
    this.load.image('heal', 'assets/effects/heal.png');
    this.load.image('hit', 'assets/effects/hit.png');
    this.load.image('gold', 'assets/effects/gold.png');
    this.load.image('item', 'assets/effects/item.png');
  }

  create() {
    var W = this.scale.width;
    var H = this.scale.height;
    this.mapWidth = 800;
    this.mapHeight = 960;
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);

    // Background
    this.createBackground();

    // Player
    this.playerSprite = this.physics.add.sprite(W / 2, H / 2, 'player');
    this.playerSprite.setScale(1.5);
    this.playerSprite.setDepth(10);
    this.cameras.main.startFollow(this.playerSprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.2);

    // Player state
    this.playerHp = 100;
    this.playerMaxHp = 100;
    this.playerXp = 0;
    this.playerMaxXp = 100;
    this.playerLevel = 1;
    this.playerGold = 0;

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    // Move timer for server sync
    this.sendTimer = 0;

    // Enemies
    this.enemies = [];
    this.spawnEnemies();

    // AI agents
    this.aiAgents = [];
    this.spawnAIAgents();

    // UI
    createUI(this);
    this.updatePlayerUI();

    // Touch handling for joystick and attack
    this.touchJoystick = null;
    this.setupTouchInput();

    // WebSocket
    this.ws = null;
    this.connectWebSocket();

    // Click to attack (only if not joystick area)
    this.input.on('pointerdown', function(pointer) {
      if (pointer.y < H - 200 || pointer.x > 160) {
        this.tryAttack();
      }
    }.bind(this));
  }

  createBackground() {
    // Try tileset first, else colored rectangles
    if (this.textures.exists('tiles_forest')) {
      this.add.image(this.mapWidth / 2, this.mapHeight / 2, 'tiles_forest')
        .setDepth(0).setScale(3);
    } else {
      var tileSize = 32;
      var cols = Math.ceil(this.mapWidth / tileSize);
      var rows = Math.ceil(this.mapHeight / tileSize);

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var isPath = (r + c) % 7 < 2;
          var color = isPath ? 0x2a3a2a : 0x1a2e1a;
          var tile = this.add.rectangle(
            c * tileSize + tileSize / 2,
            r * tileSize + tileSize / 2,
            tileSize, tileSize, color
          );
          tile.setDepth(0);
        }
      }
      // Decorations
      for (var i = 0; i < 40; i++) {
        this.add.circle(
          Phaser.Math.Between(16, this.mapWidth - 16),
          Phaser.Math.Between(16, this.mapHeight - 16),
          Phaser.Math.Between(3, 8), 0x0d3315, 0.5
        ).setDepth(1);
      }
    }
  }

  spawnEnemies() {
    // 5 Slimes
    for (var i = 0; i < 5; i++) {
      var e = new Enemy(this, 'slime',
        Phaser.Math.Between(60, this.mapWidth - 60),
        Phaser.Math.Between(60, this.mapHeight - 60));
      e.createSprite();
      this.enemies.push(e);
    }
    // 3 Goblins
    for (var j = 0; j < 3; j++) {
      var e2 = new Enemy(this, 'goblin',
        Phaser.Math.Between(60, this.mapWidth - 60),
        Phaser.Math.Between(60, this.mapHeight - 60));
      e2.createSprite();
      this.enemies.push(e2);
    }
    // 4 Bats
    for (var k = 0; k < 4; k++) {
      var e3 = new Enemy(this, 'bat',
        Phaser.Math.Between(60, this.mapWidth - 60),
        Phaser.Math.Between(60, this.mapHeight - 60));
      e3.createSprite();
      this.enemies.push(e3);
    }
  }

  spawnAIAgents() {
    var names = ['NousBot', 'AlphaAgent', 'SynthMind', 'NeuralX', 'DataRunner'];
    for (var i = 0; i < 5; i++) {
      var agent = new AIAgent(i, names[i],
        Phaser.Math.Between(80, this.mapWidth - 80),
        Phaser.Math.Between(80, this.mapHeight - 80));
      agent.createSprite(this);
      this.aiAgents.push(agent);
    }
  }

  setupTouchInput() {
    this.input.on('pointerdown', function(pointer) {
      if (pointer.y > this.scale.height - 200 && pointer.x < 160) {
        this.touchJoystick = {
          startX: pointer.x,
          startY: pointer.y,
          dx: 0,
          dy: 0,
          active: true
        };
      }
    }.bind(this));

    this.input.on('pointermove', function(pointer) {
      if (this.touchJoystick && this.touchJoystick.active) {
        var dx = (pointer.x - this.touchJoystick.startX) / 50;
        var dy = (pointer.y - this.touchJoystick.startY) / 50;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var clamped = Math.min(len, 1);
        this.touchJoystick.dx = (dx / len) * clamped;
        this.touchJoystick.dy = (dy / len) * clamped;
      }
    }.bind(this));

    this.input.on('pointerup', function() {
      this.touchJoystick = null;
    }.bind(this));
  }

  connectWebSocket() {
    var self = this;
    // Auto-detect: try Vercel's deployed URL first, fallback to local
    var wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    var wsUrl = wsProto + '//' + window.location.host;
    console.log('[WS] connecting to', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = function() {
        console.log('Connected to game server');
      };

      this.ws.onclose = function() {
        console.log('Disconnected, retrying in 3s...');
        setTimeout(function() { self.connectWebSocket(); }, 3000);
      };

      this.ws.onerror = function(err) {
        // Silently ignore connection errors (server might not be running)
      };

      this.ws.onmessage = function(event) {
        self.handleServerMessage(event.data);
      };
    } catch (e) {
      // WebSocket not available, game still works locally
    }
  }

  handleServerMessage(data) {
    // Server sends game state updates — we use local AI for now
    // This is a placeholder for future multiplayer sync
  }

  tryAttack() {
    // Attack nearest alive enemy
    var ps = this.playerSprite;
    if (!ps) return;

    var range = 64;
    var hit = false;

    this.enemies.forEach(function(e) {
      if (!e.alive) return;
      var d = Phaser.Math.Distance.Between(
        ps.x, ps.y, e.position.x, e.position.y);
      if (d < range) {
        var dmg = 18 + Math.floor(Math.random() * 8);
        var killed = e.takeDamage(dmg, 'player');
        hit = true;

        // Attack particle
        var p = this.add.circle(ps.x, ps.y, 8, 0xffaa00, 0.7).setDepth(50);
        this.tweens.add({
          targets: p, scale: 2.5, alpha: 0, duration: 300,
          onComplete: function() { p.destroy(); }
        }.bind(this));

        if (killed) {
          var gold = Phaser.Math.Between(5, 20);
          var xp = Phaser.Math.Between(20, 40);
          this.playerGold += gold;
          this.playerXp += xp;
          this.updatePlayerUI();
          if (this.showLootPopup) {
            this.showLootPopup(e.position.x, e.position.y - 20, gold);
          }
        }
      }
    }.bind(this));
  }

  updatePlayerUI() {
    this.playerHp = Math.max(0, this.playerHp);

    // Level up check
    if (this.playerXp >= this.playerMaxXp) {
      this.playerXp -= this.playerMaxXp;
      this.playerLevel++;
      this.playerMaxHp += 20;
      this.playerMaxXp = Math.floor(this.playerMaxXp * 1.5);
      this.playerHp = this.playerMaxHp;
      if (this.levelLabel) {
        this.levelLabel.setText('Lv.' + this.playerLevel);
      }
    }

    // Update bars
    if (window.updateHpBar) updateHpBar(this, this.playerHp / this.playerMaxHp);
    if (window.updateXpBar) updateXpBar(this, this.playerXp / this.playerMaxXp);
    if (this.goldCounter) this.goldCounter.setText('\u{1FA99} ' + this.playerGold);
  }

  update(time, delta) {
    var speed = 180;
    var vx = 0;
    var vy = 0;

    // Keyboard input
    if (this.cursors && this.cursors.left.isDown) { vx -= speed; }
    if (this.cursors && this.cursors.right.isDown) { vx += speed; }
    if (this.cursors && this.cursors.up.isDown) { vy -= speed; }
    if (this.cursors && this.cursors.down.isDown) { vy += speed; }

    if (this.wasd) {
      if (this.wasd.A.isDown) { vx -= speed; }
      if (this.wasd.D.isDown) { vx += speed; }
      if (this.wasd.W.isDown) { vy -= speed; }
      if (this.wasd.S.isDown) { vy += speed; }
    }

    // Touch joystick
    if (this.touchJoystick && this.touchJoystick.active) {
      vx += this.touchJoystick.dx * speed;
      vy += this.touchJoystick.dy * speed;
    }

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      var n = 1 / Math.sqrt(2);
      vx *= n;
      vy *= n;
    }

    // Apply movement
    if (vx !== 0 || vy !== 0) {
      var newX = this.playerSprite.x + vx * (delta / 1000);
      var newY = this.playerSprite.y + vy * (delta / 1000);
      this.playerSprite.x = Phaser.Math.Clamp(newX, 16, this.mapWidth - 16);
      this.playerSprite.y = Phaser.Math.Clamp(newY, 16, this.mapHeight - 16);
    }

    // Sync position to server
    this.sendTimer += delta;
    if (this.sendTimer >= 100 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendTimer = 0;
      this.ws.send(JSON.stringify({
        type: 'move',
        action: { x: this.playerSprite.x, y: this.playerSprite.y }
      }));
    }

    // Tick enemies
    for (var i = 0; i < this.enemies.length; i++) {
      this.enemies[i].patrol(delta);
    }

    // Update AI agents
    for (var j = 0; j < this.aiAgents.length; j++) {
      this.aiAgents[j].update(delta, this.enemies, this);
      this.aiAgents[j].updateNameTag();
    }
  }
}

if (typeof window !== 'undefined') window.GameScene = GameScene;
