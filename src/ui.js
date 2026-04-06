// src/ui.js

function createUI(scene) {
  var m = 8;

  // HP Bar
  scene.add.rectangle(m + 50, m + 12, 104, 14, 0x333333)
    .setOrigin(0, 0.5).setDepth(900).setScrollFactor(0);
  scene.hpBar = scene.add.rectangle(m + 52, m + 12, 100, 10, 0x44ff44)
    .setOrigin(0, 0.5).setDepth(901).setScrollFactor(0);
  scene.add.text(m, m + 5, 'HP', { fontSize: '10px', color: '#fff', fontFamily: 'monospace' })
    .setDepth(902).setScrollFactor(0);

  // XP Bar
  scene.add.rectangle(m + 50, m + 30, 104, 14, 0x333333)
    .setOrigin(0, 0.5).setDepth(900).setScrollFactor(0);
  scene.xpBar = scene.add.rectangle(m + 52, m + 30, 100, 10, 0x4488ff)
    .setOrigin(0, 0.5).setDepth(901).setScrollFactor(0);
  scene.add.text(m, m + 23, 'XP', { fontSize: '10px', color: '#fff', fontFamily: 'monospace' })
    .setDepth(902).setScrollFactor(0);

  // Level label
  scene.levelLabel = scene.add.text(m, m + 42, 'Lv.1', {
    fontSize: '11px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold'
  }).setDepth(903).setScrollFactor(0);

  // Gold counter
  scene.goldCounter = scene.add.text(scene.scale.width - m, m + 10, '\u{1FA99} 0', {
    fontSize: '12px', color: '#ffdd44', fontFamily: 'monospace', fontStyle: 'bold'
  }).setOrigin(1, 0).setDepth(903).setScrollFactor(0);

  // Zone name
  scene.zoneLabel = scene.add.text(scene.scale.width / 2, m + 8, 'Forest', {
    fontSize: '14px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold'
  }).setOrigin(0.5, 0).setDepth(903).setScrollFactor(0);

  // Expose globally
  window.updateHpBar = updateHpBar;
  window.updateXpBar = updateXpBar;
  window.showDamageNumber = showDamageNumber;
  window.showLootPopup = showLootPopup;
  window.hitFlash = hitFlash;
  window.createSkillParticles = createSkillParticles;
}

function updateHpBar(scene, ratio) {
  ratio = Math.max(0, Math.min(1, ratio));
  if (!scene.hpBar) return;
  scene.hpBar.width = 100 * ratio;
  if (ratio > 0.5) scene.hpBar.setFillStyle(0x44ff44);
  else if (ratio > 0.25) scene.hpBar.setFillStyle(0xffaa00);
  else scene.hpBar.setFillStyle(0xff4444);
}

function updateXpBar(scene, ratio) {
  ratio = Math.max(0, Math.min(1, ratio));
  if (scene.xpBar) scene.xpBar.width = 100 * ratio;
}

function showDamageNumber(scene, x, y, amount) {
  var txt = scene.add.text(x, y, '-' + amount, {
    fontSize: '16px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
    stroke: '#000', strokeThickness: 3
  }).setOrigin(0.5).setDepth(800);
  scene.tweens.add({
    targets: txt, y: y - 40, alpha: 0, duration: 800, ease: 'Power1',
    onComplete: function() { txt.destroy(); }
  });
}

function showLootPopup(scene, x, y, gold) {
  var txt = scene.add.text(x, y, '+' + gold + 'g', {
    fontSize: '14px', color: '#ffdd44', fontFamily: 'monospace', fontStyle: 'bold',
    stroke: '#000', strokeThickness: 3
  }).setOrigin(0.5).setDepth(800);
  scene.tweens.add({
    targets: txt, y: y - 30, alpha: 0, duration: 1000, ease: 'Power1',
    onComplete: function() { txt.destroy(); }
  });
}

function hitFlash(scene, sprite) {
  if (!sprite) return;
  sprite.setTint(0xffffff);
  scene.time.delayedCall(80, function() { if (sprite) sprite.clearTint(); });
}

function createSkillParticles(scene, x, y) {
  for (var i = 0; i < 6; i++) {
    var angle = (Math.PI * 2 / 6) * i;
    var p = scene.add.circle(x, y, 4, 0x44ff88, 0.8).setDepth(800);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * 20,
      y: y + Math.sin(angle) * 20,
      alpha: 0, scale: 0.3,
      duration: 400, ease: 'Power1',
      onComplete: function() { p.destroy(); }
    });
  }
}
