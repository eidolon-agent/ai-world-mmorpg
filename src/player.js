// src/player.js

class PlayerMovement {
  constructor() {
    this.velocity = { x: 0, y: 0 };
    this.direction = 'down';
    this.isMoving = false;
  }

  handleInput(cursors, touchInput) {
    var speed = 180;
    var vx = 0;
    var vy = 0;
    this.isMoving = false;

    // Keyboard input
    if (cursors.left.isDown) { vx -= speed; this.direction = 'left'; this.isMoving = true; }
    if (cursors.right.isDown) { vx += speed; this.direction = 'right'; this.isMoving = true; }
    if (cursors.up.isDown) { vy -= speed; this.direction = 'up'; this.isMoving = true; }
    if (cursors.down.isDown) { vy += speed; this.direction = 'down'; this.isMoving = true; }

    // Touch joystick input
    if (touchInput) {
      vx += touchInput.dx * speed;
      vy += touchInput.dy * speed;
      this.isMoving = true;
      if (Math.abs(vx) > Math.abs(vy)) {
        this.direction = vx > 0 ? 'right' : 'left';
      } else {
        this.direction = vy > 0 ? 'down' : 'up';
      }
    }

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      var factor = 1 / Math.SQRT2;
      vx *= factor;
      vy *= factor;
    }

    this.velocity.x = vx;
    this.velocity.y = vy;
    return this.velocity;
  }

  clampToMapBounds(x, y, mapWidth, mapHeight) {
    return {
      x: Phaser.Math.Clamp(x, 16, mapWidth - 16),
      y: Phaser.Math.Clamp(y, 16, mapHeight - 16)
    };
  }
}

if (typeof window !== 'undefined') window.PlayerMovement = PlayerMovement;
