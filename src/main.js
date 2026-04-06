// src/main.js

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [GameScene],
  backgroundColor: '#1a1a2e'
};

const game = new Phaser.Game(config);
