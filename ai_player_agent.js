/**
 * AI Player Agent for Farcaster Miniapp MMORPG
 * Connects via WebSocket as a player, auto-fights enemies, collects loot.
 * Observe -> Decide -> Act loop.
 */
const WebSocket = require('ws');

const SERVER_URL = 'ws://localhost:3001';
const PLAYER_NAME = 'HermesAgent';
const TICK_MS = 50;

class AIPlayer {
  constructor() {
    this.ws = null;
    this.playerId = null;
    this.gameState = {};
    this.myEntity = null;
    this.connected = false;
    this.lastAttackTime = 0;
    this.attackCooldown = 500; // 500ms
    this.stats = { level: 1, gold: 0, xp: 0, hp: 100, maxHp: 100 };
  }

  connect() {
    this.ws = new WebSocket(SERVER_URL);

    this.ws.on('open', () => {
      this.connected = true;
      console.log(`[${PLAYER_NAME}] Connected to game server!\n`);
    });

    this.ws.on('close', () => {
      this.connected = false;
      console.log(`[${PLAYER_NAME}] Disconnected! Reconnecting in 2s...`);
      setTimeout(() => this.connect(), 2000);
    });

    this.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        this.onMessage(msg);
      } catch (e) { /* ignore parse errors */ }
    });
  }

  onMessage(msg) {
    if (msg.type === 'init') {
      this.playerId = msg.playerId;
      this.gameState = msg.state || {};
      console.log(`[${PLAYER_NAME}] Initialized as ${this.playerId} 🎮`);
      return;
    }

    if (msg.type === 'state') {
      this.gameState = msg;
      return;
    }

    if (msg.type === 'damage') {
      if (msg.target === this.playerId) {
        const attacker = msg.entity?.name || '?';
        console.log(`  💔 Hit by ${attacker} for ${msg.amount} dmg!`);
      }
    }

    if (msg.type === 'loot' && msg.entity?.id === this.playerId) {
      console.log(`  💰 Collected ${msg.gold} gold!`);
    }

    if (msg.type === 'levelUp' && msg.entity?.id === this.playerId) {
      console.log(`  🎉 Leveled up to Lv.${msg.newLevel}!`);
    }
  }

  sendMove(x, y) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'move',
        action: { x, y }
      }));
    }
  }

  sendAttack(targetId) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'attack',
        targetId
      }));
    }
  }

  findNearestEnemy() {
    const entities = this.gameState.entities || [];
    let myPos = null;

    for (const e of entities) {
      if (e.id === this.playerId) {
        myPos = e;
        this.stats.hp = e.hp;
        this.stats.maxHp = e.maxHp;
        this.stats.level = e.level;
        this.stats.gold = e.gold;
        this.stats.xp = e.xp;
        break;
      }
    }

    if (!myPos) return null;

    let nearest = null;
    let nearestDist = Infinity;

    for (const e of entities) {
      if (e.type === 'enemy' && e.hp > 0) {
        const dx = e.x - myPos.x;
        const dy = e.y - myPos.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = e;
        }
      }
    }

    return nearest ? { enemy: nearest, dist: nearestDist, myPos } : null;
  }

  tick() {
    const result = this.findNearestEnemy();

    if (!result) {
      // Wander
      this.sendMove(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      return;
    }

    const { enemy, dist, myPos } = result;
    const now = Date.now();

    if (dist <= 50) {
      // Attack!
      if (now - this.lastAttackTime >= this.attackCooldown) {
        this.lastAttackTime = now;
        this.sendAttack(enemy.id);
        console.log(`⚔️  Attacked ${enemy.name} (HP:${enemy.hp}, Dist:${dist.toFixed(0)})`);
      }
    } else {
      // Move toward enemy
      const dx = enemy.x - myPos.x;
      const dy = enemy.y - myPos.y;
      this.sendMove(dx / dist, dy / dist);
    }
  }

  run() {
    console.log(`[${PLAYER_NAME}] Starting AI Player Agent...`);
    console.log(`[${PLAYER_NAME}] Connecting to ${SERVER_URL}\n`);
    this.connect();

    // Wait for connection, then start AI loop
    const startLoop = () => {
      if (!this.connected) {
        setTimeout(startLoop, 100);
        return;
      }

      console.log(`[${PLAYER_NAME}] Auto-grinding started! Observe->Decide->Act 🤖\n`);

      let tickCount = 0;
      setInterval(() => {
        this.tick();
        tickCount++;

        // Status print every 20 ticks (~1 second)
        if (tickCount % 20 === 0) {
          const s = this.stats;
          process.stdout.write(`[📊 Lv.${s.level} | HP: ${s.hp}/${s.maxHp} | XP: ${s.xp} | Gold: ${s.gold}]\n`);
        }
      }, TICK_MS);
    };

    startLoop();
  }
}

const agent = new AIPlayer();
agent.run();
