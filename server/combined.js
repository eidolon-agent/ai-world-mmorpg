// server/index.js - Combined: serve frontend + WebSocket
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

// ─── Config ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const MAP_W = 800;
const MAP_H = 960;
const TICK_MS = 50;
const XP_THRESHOLDS = [100, 250, 500, 1000];
const ENEMY_RESPAWN = 10000;

// ─── Static File Server ─────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
};

function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  });
}

// ─── Helpers ─────────────────────────────────────────────
function rand(a, b) { return Math.random() * (b - a) + a; }
function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rpos() { return { x: rand(40, MAP_W - 40), y: rand(40, MAP_H - 40) }; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function moveToward(e, tx, ty, speed) {
  const dx = tx - e.x, dy = ty - e.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 1) return;
  const s = Math.min(speed, d);
  e.x = clamp(e.x + (dx / d) * s, 16, MAP_W - 16);
  e.y = clamp(e.y + (dy / d) * s, 16, MAP_H - 16);
}

function nearest(from, list) {
  let best = null, bd = Infinity;
  for (const e of list) {
    if (e.hp > 0) {
      const d2 = dist(from, e);
      if (d2 < bd) { bd = d2; best = e; }
    }
  }
  return best;
}

// ─── State ─────────────────────────────────────────────────
const players = new Map();
let tick = 0;
let enemies = [];
let aiAgents = [];
let now = Date.now();

// ─── Init Enemies ────────────────────────────────────────
function initEnemies() {
  const defs = [
    ...Array(5).fill(null).map(() => ({ enemyType: 'slime', hp: 30, maxHp: 30, speed: 30, dmg: 5, xp: 20, gold: 5 })),
    ...Array(3).fill(null).map(() => ({ enemyType: 'goblin', hp: 50, maxHp: 50, speed: 50, dmg: 10, xp: 40, gold: 12 })),
    ...Array(4).fill(null).map(() => ({ enemyType: 'bat', hp: 20, maxHp: 20, speed: 70, dmg: 8, xp: 15, gold: 3 })),
  ];
  enemies = defs.map((d, i) => {
    const p = rpos();
    return { ...d, id: `enemy-${i}`, x: p.x, y: p.y, dead: false, respawnAt: 0, patrol: rpos(), patrolSince: Date.now(), lastAttack: 0 };
  });
}

// ─── Init AI Agents ──────────────────────────────────────
function initAI() {
  aiAgents = [1, 2, 3, 4, 5].map(i => {
    const p = rpos();
    return { id: `ai-bot-${i}`, name: `AI-Bot-${i}`, type: 'ai', x: p.x, y: p.y, hp: 100, maxHp: 100, speed: 60, dmg: 15, xp: 0, level: 1, gold: 0, lastAttack: 0 };
  });
}

// ─── Level Up ────────────────────────────────────────────
function xpForLevel(lv) { return XP_THRESHOLDS[Math.min(lv - 1, XP_THRESHOLDS.length - 1)] || 9999; }

function checkLevel(entity) {
  const needed = xpForLevel(entity.level);
  if (entity.xp >= needed) {
    entity.xp -= needed;
    entity.level++;
    entity.maxHp += 20;
    entity.hp = Math.min(entity.hp + 30, entity.maxHp);
    entity.dmg += 3;
    broadcast({ type: 'levelUp', name: entity.name || entity.id, level: entity.level });
    console.log(`  UP ${entity.name || entity.id} -> Lv ${entity.level}`);
    checkLevel(entity);
  }
}

// ─── Broadcast ───────────────────────────────────────────
function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const [ws] of players) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

// ─── Game Tick ───────────────────────────────────────────
function gameLoop() {
  tick++;
  now = Date.now();

  // -- AI agents: find enemy, move, attack --
  for (const ai of aiAgents) {
    if (ai.hp <= 0) continue;
    ai.dmg = 15 + (ai.level - 1) * 3;
    ai.maxHp = 100 + (ai.level - 1) * 20;
    const target = nearest(ai, enemies);
    if (!target) continue;
    const dd = dist(ai, target);
    if (dd <= 30) {
      if (now - ai.lastAttack >= 1000) {
        ai.lastAttack = now;
        target.hp -= ai.dmg;
        broadcast({ type: 'damage', target: target.id, amount: ai.dmg, name: ai.name });
        if (target.hp <= 0) {
          target.dead = true;
          target.respawnAt = now + ENEMY_RESPAWN;
          ai.gold += target.gold;
          ai.xp += target.xp;
          console.log(`  ${ai.name} killed ${target.enemyType} (+${target.xp}xp +${target.gold}g)`);
          broadcast({ type: 'loot', x: target.x, y: target.y, gold: target.gold, name: ai.name });
          checkLevel(ai);
        }
      }
    } else {
      moveToward(ai, target.x, target.y, ai.speed * 0.05);
    }
  }

  // -- Enemies: patrol or chase --
  for (const en of enemies) {
    if (en.dead) {
      if (now >= en.respawnAt) {
        const rp = rpos();
        Object.assign(en, { x: rp.x, y: rp.y, hp: en.maxHp, dead: false, patrol: rpos(), patrolSince: now });
      }
      continue;
    }

    let chaseTarget = null, chaseDist = 100;
    for (const [, p] of players) {
      if (p.hp > 0) { const d3 = dist(en, p); if (d3 < chaseDist) { chaseDist = d3; chaseTarget = p; } }
    }
    for (const ai of aiAgents) {
      if (ai.hp > 0) { const d4 = dist(en, ai); if (d4 < chaseDist) { chaseDist = d4; chaseTarget = ai; } }
    }

    if (chaseTarget) {
      const cd = dist(en, chaseTarget);
      if (cd <= 20) {
        if (now - en.lastAttack >= 800) {
          en.lastAttack = now;
          chaseTarget.hp -= en.dmg;
          broadcast({ type: 'damage', target: chaseTarget.id, amount: en.dmg, name: en.enemyType });
          if (chaseTarget.hp <= 0) {
            chaseTarget.deathTime = now;
            if (players.has(chaseTarget.ws)) {
              broadcast({ type: 'player_killed', playerId: chaseTarget.id });
            }
          }
        }
      } else {
        moveToward(en, chaseTarget.x, chaseTarget.y, en.speed * 0.05);
      }
    } else {
      if (now - en.patrolSince > 3000) { en.patrol = rpos(); en.patrolSince = now; }
      moveToward(en, en.patrol.x, en.patrol.y, en.speed * 0.025);
    }
  }

  // -- Player input --
  for (const [ws, p] of players) {
    if (p._input) {
      const inp = p._input;
      if (inp.x && inp.y) {
        p.x = clamp(inp.x, 16, MAP_W - 16);
        p.y = clamp(inp.y, 16, MAP_H - 16);
      }
      p._input = null;
    }
    if (p.hp <= 0 && p.deathTime && now - p.deathTime > 5000) {
      const rp2 = rpos();
      Object.assign(p, { x: rp2.x, y: rp2.y, hp: p.maxHp, deathTime: null });
    }
  }

  // -- Broadcast state --
  if (tick % 2 === 0) {
    const entities = [];
    for (const [, p] of players) {
      entities.push({ id: p.id, type: 'player', x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp, name: p.name, level: p.level, xp: p.xp });
    }
    for (const a of aiAgents) {
      entities.push({ id: a.id, type: 'ai', x: a.x, y: a.y, hp: a.hp, maxHp: a.maxHp, name: a.name, level: a.level });
    }
    for (const e of enemies) {
      if (!e.dead) entities.push({ id: e.id, type: 'enemy', x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, enemyType: e.enemyType });
    }
    broadcast({ type: 'state', entities, tick });
  }

  if (tick % 400 === 0) {
    const alive = enemies.filter(e => !e.dead).length;
    console.log(`[game] tick=${tick} players=${players.size} alive=${alive}`);
  }
}

// ─── HTTP Server (serve frontend) ──────────────────────
const baseDir = __dirname;
// Find project root: try 3 levels up for Railway, fallback to parent
const projectRoot = (() => {
  if (process.env.NODE_ENV === 'production') {
    // Railway deploys to /app, server/combined.js is at /app/server/combined.js
    // But also check if we're directly at /app
    if (fs.existsSync('/app/index.html')) return '/app';
    return path.join(baseDir, '..');
  }
  return path.join(baseDir, '..');
})();
const frontendBase = path.resolve(projectRoot);

function findMimeType(fp) {
  const ext = path.extname(fp).toLowerCase();
  const types = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.png': 'image/png', '.json': 'application/json',
  };
  return types[ext] || 'application/octet-stream';
}

const httpServer = http.createServer((req, res) => {
  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', players: players.size, tick }));
    return;
  }

  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '/index.html') {
    urlPath = '/index.html';
  }

  let filePath = path.join(frontendBase, urlPath);
  // Security: prevent directory traversal
  if (!filePath.startsWith(frontendBase)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  serveStaticFile(res, filePath);
});

// ─── WebSocket Server ──────────────────────────────────
const wss = new WebSocket.Server({ server: httpServer });
console.log(`\n  AI World - Game Server`);
console.log(`  Port: ${PORT}`);
console.log(`  Frontend: served from ${frontendBase}`);
console.log(`  Game Tick: 20fps\\n`);

let counter = 0;
wss.on('connection', (ws) => {
  counter++;
  const pid = `player-${counter}`;
  const pos = rpos();
  const player = {
    ws, id: pid, type: 'player', name: pid,
    x: pos.x, y: pos.y, hp: 100, maxHp: 100, xp: 0, level: 1, gold: 0,
    dmg: 20, deathTime: null, _input: null
  };
  players.set(ws, player);
  console.log(`  + ${pid} (total: ${players.size})`);
  ws.send(JSON.stringify({ type: 'init', playerId: pid }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'move' && msg.action) {
        player._input = { x: msg.action.x, y: msg.action.y };
      }
    } catch (e) { /* ignore */ }
  });

  ws.on('close', () => {
    players.delete(ws);
    console.log(`  - ${pid} (total: ${players.size})`);
  });
});

// ─── Start ─────────────────────────────────────────────
initEnemies();
initAI();
setInterval(gameLoop, TICK_MS);

httpServer.listen(PORT, () => {
  console.log(`  HTTP+WS server listening on ${PORT}`);
});

module.exports = { wss, httpServer };
