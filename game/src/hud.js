// Emberfall — every word and panel the player reads: the HUD, the title
// screen and the game-over screen. Nothing here touches game logic.
export function drawHud(ctx, s) {
  const w = s.w;
  ctx.save();
  ctx.textBaseline = 'alphabetic';

  // Score, top left.
  ctx.fillStyle = '#fff3d6';
  ctx.font = '700 34px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 28, 44);
  ctx.font = '800 52px system-ui, sans-serif';
  ctx.fillText(String(s.score), 28, 96);

  // Combo multiplier, under the score.
  if (s.combo >= 2) {
    const multColor = s.mult >= 4 ? '#ffd94d' : s.mult >= 3 ? '#ff9a3c' : '#ffb347';
    ctx.fillStyle = multColor;
    ctx.font = '800 30px system-ui, sans-serif';
    ctx.fillText(`COMBO x${s.mult}  (${s.combo})`, 28, 134);
  }

  // Lives as flame icons, top right.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff3d6';
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillText('LIVES', w - 28, 40);
  for (let i = 0; i < s.maxLives; i++) {
    const fx = w - 44 - i * 40;
    drawFlameIcon(ctx, fx, 66, i < s.lives);
  }

  // Level and Flare charges, top right under the lives.
  ctx.fillStyle = '#cdd3ff';
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillText(`LEVEL ${s.level}`, w - 28, 116);
  ctx.fillStyle = s.flares > 0 ? '#7fd4ff' : '#5a6080';
  const dots = '●'.repeat(s.flares) + '○'.repeat(Math.max(0, s.maxFlares - s.flares));
  ctx.fillText(`FLARE ${dots}  [SPACE]`, w - 28, 146);

  // Mute hint, bottom right.
  ctx.fillStyle = 'rgba(205,211,255,0.55)';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText(s.muted ? 'MUTED  [M]' : 'SOUND ON  [M]', w - 28, s.h - 18);

  // Center flash message (level up, flare, ash hit...).
  if (s.message && s.messageT > 0) {
    ctx.globalAlpha = Math.min(1, s.messageT * 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = s.messageColor || '#ffd94d';
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.fillText(s.message, w / 2, 210);
  }
  ctx.restore();
}

function drawFlameIcon(ctx, x, y, lit) {
  ctx.save();
  ctx.translate(x, y);
  if (!lit) {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#8a8fa8';
  } else {
    const g = ctx.createLinearGradient(0, -12, 0, 10);
    g.addColorStop(0, '#ffd94d');
    g.addColorStop(1, '#ff5a14');
    ctx.fillStyle = g;
  }
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(9, -2, 7, 6);
  ctx.quadraticCurveTo(4, 11, 0, 11);
  ctx.quadraticCurveTo(-4, 11, -7, 6);
  ctx.quadraticCurveTo(-9, -2, 0, -13);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawTitle(ctx, w, h, time) {
  ctx.save();
  ctx.textAlign = 'center';

  // Glowing title.
  ctx.shadowColor = 'rgba(255, 140, 40, 0.8)';
  ctx.shadowBlur = 34;
  ctx.fillStyle = '#ffb347';
  ctx.font = '900 110px system-ui, sans-serif';
  ctx.fillText('EMBERFALL', w / 2, 210);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff3d6';
  ctx.font = '600 26px system-ui, sans-serif';
  ctx.fillText('Catch the falling embers. Dodge the ash.', w / 2, 262);

  // How-to-play card.
  const cw = 660;
  const ch = 210;
  const cx = w / 2 - cw / 2;
  const cy = 300;
  ctx.fillStyle = 'rgba(10, 14, 40, 0.72)';
  ctx.strokeStyle = 'rgba(255, 179, 71, 0.45)';
  ctx.lineWidth = 2;
  roundRect(ctx, cx, cy, cw, ch, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8ecff';
  ctx.font = '600 22px system-ui, sans-serif';
  const lines = [
    'Ember  +10   ·   Gold ember  +50   ·   streaks build your multiplier',
    'Ash puts out a flame — catch one and you lose a life',
    'SPACE unleashes a Flare: clears the sky (limited charges)',
    'Move with MOUSE or Left / Right arrows or A D  ·  M mutes  ·  R restarts',
  ];
  lines.forEach((line, i) => ctx.fillText(line, w / 2, cy + 48 + i * 38));

  // Start prompt, pulsing.
  const pulse = 0.65 + Math.sin(time * 3) * 0.35;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd94d';
  ctx.font = '800 34px system-ui, sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO START', w / 2, 580);
  ctx.restore();
}

export function drawGameOver(ctx, w, h, score, best, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 7, 20, 0.62)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff7a5c';
  ctx.font = '900 84px system-ui, sans-serif';
  ctx.fillText('THE FIRE IS OUT', w / 2, 240);

  ctx.fillStyle = '#fff3d6';
  ctx.font = '700 28px system-ui, sans-serif';
  ctx.fillText('FINAL SCORE', w / 2, 310);

  ctx.fillStyle = '#ffd94d';
  ctx.font = '900 96px system-ui, sans-serif';
  ctx.fillText(String(score), w / 2, 410);

  ctx.fillStyle = '#cdd3ff';
  ctx.font = '600 24px system-ui, sans-serif';
  ctx.fillText(`Best this session: ${best}`, w / 2, 458);

  const pulse = 0.65 + Math.sin(time * 3) * 0.35;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd94d';
  ctx.font = '800 30px system-ui, sans-serif';
  ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', w / 2, 540);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
