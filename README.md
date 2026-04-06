# AI World — Farcaster MMORPG Miniapp 🎮

> AI agents auto-grind & fight while human players join the fun. A 2.0 showcase MVP.

## Features
- 🗺️ 2 Zones: Forest + Dungeon (tilemaps)
- 🤖 5 AI Agents per zone — auto-grind, fight, loot, level up
- 👾 3 Enemy types: Slime, Goblin, Bat
- ⚔️ Combat visuals: damage numbers, hit flash, skill effects
- 📊 XP tracking, leveling, gold loot system
- 🌐 WebSocket multiplayer (Node.js + ws)
- 📱 Farcaster miniapp compatible (480x640, <5MB assets)
- 🔮 Web3 ready: placeholder for NFT/ERC20 integration

## Quick Start
```bash
# Install backend dependency
npm install

# Start the WebSocket game server (port 3001)
npm start

# In another terminal, serve the frontend (port 3000)
npx serve . -l 3000

# Or just open index.html in your browser
```

## Play in Farcaster
1. Deploy to any static host (Vercel, Netlify, GitHub Pages)
2. Set the URL as your miniapp endpoint in Farcaster
3. Open in Farcaster app → tap the miniapp → play!

## Controls
- **WASD / Arrow Keys**: Move player
- **Click/Tap Enemy**: Attack
- **Touch Joystick**: Mobile movement

## Architecture
- Frontend: Phaser 3 (480x640, pixel art, mobile-first)
- Backend: Node.js + WebSocket (tick-based 20fps game loop)
- AI Agents: Server-authoritative Observe→Decide→Act loop
- State: In-memory (Redis-ready for scale)

## File Structure
```
mmorpg-farcaster-mini2/
├── assets/
│   ├── sprites/
│   │   ├── player.png    (chibi character)
│   │   ├── slime.png     (green blob)
│   │   ├── goblin.png    (green humanoid)
│   │   └── bat.png       (purple bat)
│   └── tilesets/
│       ├── tiles_forest.png
│       └── tiles_dungeon.png
├── src/
│   ├── main.js           (Phaser game config)
│   ├── scene.js          (GameScene — preload, create, update)
│   ├── player.js         (PlayerMovement class)
│   ├── enemy.js          (Enemy class + patrol/chase)
│   ├── ai.js             (AIAgent class + AI loop)
│   └── ui.js             (HP/XP bars, damage numbers, joystick)
├── server/
│   └── index.js          (WebSocket + game tick loop)
├── index.html            (Entry point)
├── package.json
└── README.md
```

## Future Roadmap
- [ ] NFT weapon/armor integration
- [ ] ERC20 token rewards for kills
- [ ] Farcaster wallet authentication
- [ ] More zones (Cave, Lava, Sky)
- [ ] Boss enemies (Dragon, Ogre)
- [ ] Guild/clan system
- [ ] Leaderboard with on-chain scores

## License
MIT — Built by AI, for the people. 🤖
