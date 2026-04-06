"""
AI Player Agent for Farcaster Miniapp MMORPG
Connects via WebSocket as a player, auto-fights enemies, collects loot.
Observe -> Decide -> Act loop.
"""
import json
import time
import websocket  # pip install websocket-client
import threading

# ─── Config ──────────────────────────────────────
SERVER_URL = "ws://localhost:3001"
PLAYER_NAME = "HermesAgent"
TICK_INTERVAL = 0.050  # 50ms to match server

class AIPlayer:
    def __init__(self):
        self.ws = None
        self.player_id = None
        self.game_state = {}
        self.my_entity = None
        self.connected = False
        self.target_enemy_id = None
        self.last_attack_time = 0
        self.attack_cooldown = 0.5  # 500ms
        # Stats tracking
        self.level = 1
        self.gold = 0
        self.xp = 0
        self.max_hp = 100
        self.hp = 100

    def on_open(self, ws):
        self.connected = True
        print(f"[{PLAYER_NAME}] Connected to game server!")

    def on_close(self, ws, code, reason):
        self.connected = False
        print(f"[{PLAYER_NAME}] Disconnected: {reason}")

    def on_error(self, ws, error):
        print(f"[{PLAYER_NAME}] Error: {error}")

    def on_message(self, ws, message):
        try:
            msg = json.loads(message)
        except json.JSONDecodeError:
            return

        # Handle initialization
        if msg.get('type') == 'init':
            self.player_id = msg.get('playerId')
            self.game_state = msg.get('state', {})
            print(f"[{PLAYER_NAME}] Initialized as {self.player_id}")
            return

        # Handle state updates
        if msg.get('type') == 'state':
            self.game_state = msg
            return

        # Handle combat events
        if msg.get('type') == 'damage':
            entity = msg.get('entity', {})
            target = msg.get('target')
            amount = msg.get('amount', 0)
            # If this entity is AI or enemy attacking us
            if target == self.player_id:
                print(f"[{PLAYER_NAME}] 💔 Taking {amount} damage from {entity.get('name', '?')}!")

        # Handle loot drops
        if msg.get('type') == 'loot':
            entity = msg.get('entity', {})
            gold = msg.get('gold', 0)
            if entity.get('id') == self.player_id:
                print(f"[{PLAYER_NAME}] 💰 Picked up {gold} gold!")

        # Handle level up
        if msg.get('type') == 'levelUp':
            entity = msg.get('entity', {})
            new_level = msg.get('newLevel', 1)
            if entity.get('id') == self.player_id:
                print(f"[{PLAYER_NAME}] 🎉 Leveled up to {new_level}!")

    def connect(self):
        self.ws = websocket.WebSocketApp(
            SERVER_URL,
            on_open=self.on_open,
            on_close=self.on_close,
            on_message=self.on_message,
            on_error=self.on_error
        )
        # Run in background thread
        self.ws_thread = threading.Thread(target=self.ws.run_forever, daemon=True)
        self.ws_thread.start()
        # Wait for connection
        for _ in range(50):
            if self.connected:
                break
            time.sleep(0.1)

    def send_move(self, x, y):
        if self.ws and self.connected:
            msg = json.dumps({
                'type': 'move',
                'action': {'x': x, 'y': y}
            })
            self.ws.send(msg)

    def send_attack(self, target_id):
        if self.ws and self.connected:
            msg = json.dumps({
                'type': 'attack',
                'targetId': target_id
            })
            self.ws.send(msg)

    def find_nearest_enemy(self):
        entities = self.game_state.get('entities', [])
        my_pos = None
        nearest_enemy = None
        nearest_dist = float('inf')

        # Find myself
        for e in entities:
            if e.get('id') == self.player_id:
                my_pos = e
                self.my_entity = e
                break

        if not my_pos:
            return None

        # Find nearest living enemy
        for e in entities:
            if e.get('type') == 'enemy' and e.get('hp', 0) > 0:
                dx = e.get('x', 0) - my_pos.get('x', 0)
                dy = e.get('y', 0) - my_pos.get('y', 0)
                d = (dx ** 2 + dy ** 2) ** 0.5
                if d < nearest_dist:
                    nearest_dist = d
                    nearest_enemy = e

        return nearest_enemy, nearest_dist

    def think(self):
        """Observe -> Decide -> Act"""
        nearest_enemy, dist = self.find_nearest_enemy()

        if not nearest_enemy:
            # Wander randomly
            import random
            self.send_move(
                random.uniform(-0.5, 0.5),
                random.uniform(-0.5, 0.5)
            )
            return

        enemy_id = nearest_enemy.get('id')
        name = nearest_enemy.get('name', '?')
        hp = nearest_enemy.get('hp', 0)

        # Update my stats from my entity
        if self.my_entity:
            self.hp = self.my_entity.get('hp', self.hp)
            self.level = self.my_entity.get('level', self.level)
            self.gold = self.my_entity.get('gold', self.gold)
            self.xp = self.my_entity.get('xp', self.xp)

        now = time.time()

        if dist <= 50:
            # In attack range - attack!
            if now - self.last_attack_time >= self.attack_cooldown:
                self.last_attack_time = now
                self.send_attack(enemy_id)
                print(f"  ⚔️  Attacked {name}! (HP: {hp}, Dist: {dist:.0f})")
        else:
            # Move toward enemy
            if self.my_entity:
                dx = nearest_enemy.get('x', 0) - self.my_entity.get('x', 0)
                dy = nearest_enemy.get('y', 0) - self.my_entity.get('y', 0)
                # Normalize and send movement
                if dist > 0:
                    self.send_move(dx / dist, dy / dist)
                print(f"  🏃 Moving to {name} (Dist: {dist:.0f})")

    def run(self):
        print(f"[{PLAYER_NAME}] Starting AI Player Agent...")
        print(f"[{PLAYER_NAME}] Connecting to {SERVER_URL}")
        self.connect()

        if not self.connected:
            print(f"[{PLAYER_NAME}] Failed to connect!")
            return

        print(f"[{PLAYER_NAME}] Auto-grinding started! Observe->Decide->Act loop.")
        print()

        try:
            while self.connected:
                self.think()
                time.sleep(TICK_INTERVAL)
                # Print status every 10 ticks
                if int(time.time()) % 10 == 0 and self.my_entity:
                    print(f"[📊 Lv.{self.level} | HP: {self.hp}/{self.my_entity.get('maxHp', 100)} | XP: {self.xp} | Gold: {self.gold}]")
        except KeyboardInterrupt:
            print(f"\n[{PLAYER_NAME}] Shutting down gracefully.")
            if self.ws:
                self.ws.close()

if __name__ == "__main__":
    agent = AIPlayer()
    agent.run()
