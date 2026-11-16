// Emberfall — game loop, state machine, input, and the deterministic
// ?shot= modes the screenshots are taken from. The loop is the only file
// that knows the rules; drawing lives in player.js, embers.js, particles.js
// and hud.js, sound in audio.js.
import { SoundBank } from './audio.js';
import { Particles } from './particles.js';
import { Brazier } from './player.js';
import { EmberField } from './embers.js';
import { drawHud, drawTitle, drawGameOver } from './hud.js';

export const W = 1280;
export const H = 720;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seedParam = params.get('seed');
const seed = seedParam === null ? (Math.random() * 0x7fffffff) | 0 : Number(seedParam) >>> 0;

// Small seeded RNG (mulberry32): every random choice in the game flows
// through it, so a ?seed= run replays the exact same sky.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(seed);
const sounds = new SoundBank();
const particles = new Particles(rng);
const brazier = new Brazier(W, H);
const field = new EmberField(W, H, rng);

// Stars for the night sky, fixed at load from the same seeded rng.
const stars = [];
for (let i = 0; i < 130; i++) {
  stars.push({
    x: rng() * W,
    y: rng() * H * 0.62,
    r: 0.6 + rng() * 1.7,
    p: rng() * Math.PI * 2,
  });
}

const state = {
  mode: 'title', // 'title' | 'playing' | 'gameover'
  score: 0,
  best: 0,
  combo: 0,
  comboT: 0,
  mult: 1,
  lives: 3,
  maxLives: 3,
  level: 1,
  flares: 1,
  maxFlares: 3,
  message: '',
  messageT: 0,
  messageColor: '#ffd94d',
  muted: false,
  time: 0,
  shakeT: 0,
  overLockT: 0,
};

function levelFor(score) {
  return 1 + Math.floor(score / 300);
}

function flash(text, color = '#ffd94d') {
  state.message = text;
  state.messageT = 1.6;
  state.messageColor = color;
}

function addScore(base) {
  state.score += base * state.mult;
  const next = levelFor(state.score);
  if (next > state.level) {
    state.level = next;
    state.flares = Math.min(state.flares + 1, state.maxFlares);
    field.setLevel(state.level);
    flash(`LEVEL ${state.level} — FASTER!`, '#7fd4ff');
    sounds.levelUp();
  }
}

function onCatch(item) {
  if (item.type === 'ash') {
    state.lives -= 1;
    state.combo = 0;
    state.comboT = 0;
    state.mult = 1;
    state.shakeT = 0.35;
    particles.burst(item.x, item.y, '#8a8fa8', 26, 200);
    sounds.ashThud();
    flash('ASH! A FLAME GOES OUT', '#ff7a5c');
    if (state.lives <= 0) endGame();
    return;
  }
  state.combo += 1;
  state.comboT = 1.2;
  state.mult = Math.min(1 + Math.floor(state.combo / 4), 5);
  const color = item.type === 'gold' ? '#ffd94d' : '#ff9a3c';
  particles.burst(item.x, item.y, color, item.type === 'gold' ? 30 : 14, 170);
  if (item.type === 'gold') {
    addScore(50);
    sounds.goldNote();
  } else {
    addScore(10);
    sounds.catchNote(state.combo);
  }
}

function onGround(item) {
  if (item.type === 'ember' || item.type === 'gold') {
    // Letting an ember hit the ground breaks the combo.
    if (state.combo >= 2) flash('COMBO LOST', '#cdd3ff');
    state.combo = 0;
    state.comboT = 0;
    state.mult = 1;
  }
  particles.burst(item.x, H - 16, item.type === 'ash' ? '#565b6e' : '#ff9a3c', 6, 60);
}

function useFlare() {
  if (state.mode !== 'playing' || state.flares <= 0) return;
  state.flares -= 1;
  const cleared = field.clearAll();
  for (const it of cleared) particles.burst(it.x, it.y, '#7fd4ff', 10, 220);
  sounds.flareWhoosh();
  flash('FLARE!', '#7fd4ff');
}

function startGame() {
  state.mode = 'playing';
  state.score = 0;
  state.combo = 0;
  state.comboT = 0;
  state.mult = 1;
  state.lives = state.maxLives;
  state.level = 1;
  state.flares = 1;
  state.message = '';
  state.messageT = 0;
  field.setLevel(1);
  field.reset();
  particles.clear();
  brazier.reset();
  sounds.click();
}

function endGame() {
  state.mode = 'gameover';
  state.best = Math.max(state.best, state.score);
  state.overLockT = 0.7;
  sounds.gameOver();
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a0e2a');
  g.addColorStop(0.55, '#141038');
  g.addColorStop(1, '#241233');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Stars, twinkling.
  ctx.save();
  for (const s of stars) {
    ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(state.time * 0.9 + s.p));
    ctx.fillStyle = '#dfe6ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Moon, top center — kept clear of both HUD corners.
  const mg = ctx.createRadialGradient(640, 78, 6, 640, 78, 90);
  mg.addColorStop(0, 'rgba(255, 246, 214, 0.95)');
  mg.addColorStop(0.25, 'rgba(255, 246, 214, 0.28)');
  mg.addColorStop(1, 'rgba(255, 246, 214, 0)');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(640, 78, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6d6';
  ctx.beginPath();
  ctx.arc(640, 78, 30, 0, Math.PI * 2);
  ctx.fill();

  // Distant hills.
  ctx.fillStyle = '#0d0a24';
  ctx.beginPath();
  ctx.moveTo(0, H - 14);
  ctx.quadraticCurveTo(W * 0.25, H - 120, W * 0.5, H - 40);
  ctx.quadraticCurveTo(W * 0.75, H - 110, W, H - 30);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Warm line along the ground.
  ctx.fillStyle = 'rgba(255, 150, 50, 0.14)';
  ctx.fillRect(0, H - 16, W, 4);
}

function drawFrame() {
  ctx.save();
  if (state.shakeT > 0) {
    const k = state.shakeT * 14;
    ctx.translate((rng() - 0.5) * k, (rng() - 0.5) * k);
  }
  drawBackground();
  field.draw(ctx, state.time);
  particles.draw(ctx);
  if (state.mode === 'playing' || state.mode === 'gameover') brazier.draw(ctx);
  if (state.mode === 'playing') {
    drawHud(ctx, { ...state, w: W, h: H });
  } else if (state.mode === 'title') {
    drawTitle(ctx, W, H, state.time);
  } else if (state.mode === 'gameover') {
    drawGameOver(ctx, W, H, state.score, state.best, state.time);
  }
  ctx.restore();
}

function tick(dt) {
  state.time += dt;
  if (state.messageT > 0) state.messageT -= dt;
  if (state.shakeT > 0) state.shakeT -= dt;
  if (state.overLockT > 0) state.overLockT -= dt;
  // Off-game screens show a warm ambient sky instead of the real mix.
  field.ambient = state.mode !== 'playing';

  if (state.mode === 'playing') {
    if (state.comboT > 0) {
      state.comboT -= dt;
      if (state.comboT <= 0) {
        state.combo = 0;
        state.mult = 1;
      }
    }
    brazier.update(dt);
    field.update(dt, brazier, { onCatch, onGround });
    particles.update(dt);
  } else {
    // Title and game-over screens keep embers drifting behind them.
    field.update(dt, null, null);
    particles.update(dt);
    brazier.update(dt);
  }
}

// ---- Input ----
const keys = { left: false, right: false };
function syncKeys() {
  brazier.setKeys(keys.left, keys.right);
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  sounds.ensure();
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = true;
    syncKeys();
    e.preventDefault();
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = true;
    syncKeys();
    e.preventDefault();
  } else if (e.key === ' ') {
    useFlare();
    e.preventDefault();
  } else if (e.key === 'Enter') {
    if (state.mode === 'title' || state.mode === 'gameover') startGame();
  } else if (e.key === 'r' || e.key === 'R') {
    if (state.mode === 'gameover' || state.mode === 'playing') startGame();
  } else if (e.key === 'm' || e.key === 'M') {
    state.muted = !state.muted;
    sounds.setMuted(state.muted);
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = false;
    syncKeys();
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = false;
    syncKeys();
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * W;
  brazier.setTarget(x);
});

canvas.addEventListener('mousedown', () => {
  sounds.ensure();
  if (state.mode === 'title') startGame();
  else if (state.mode === 'gameover' && state.overLockT <= 0) startGame();
});

// ---- Deterministic shot modes (what shots.json points at) ----
// Each shot runs a fixed number of 60 Hz ticks from ?seed=, draws one
// frame and stops, so the screenshot is the same on every run.
function simulate(ticks, autoPlay) {
  const dt = 1 / 60;
  for (let i = 0; i < ticks; i++) {
    if (autoPlay) {
      // Steer under the lowest falling ember, and dodge ash that is
      // about to land on the brazier.
      let target = null;
      let lowestY = -1;
      for (const it of field.items) {
        if (it.type !== 'ash' && it.y > lowestY) {
          lowestY = it.y;
          target = it;
        }
      }
      for (const it of field.items) {
        if (it.type === 'ash' && it.y > brazier.rimY - 170 && Math.abs(it.x - brazier.x) < 100) {
          target = { x: brazier.x + (it.x < brazier.x ? 130 : -130) };
          break;
        }
      }
      if (target) brazier.setTarget(target.x);
    }
    tick(dt);
  }
}

if (shot === 'start') {
  state.mode = 'title';
  simulate(150, false);
  drawFrame();
  window.__emberfallReady = true;
} else if (shot === 'play') {
  startGame();
  state.score = 180;
  state.combo = 6;
  state.mult = 2;
  state.level = 2;
  state.flares = 2;
  field.setLevel(2);
  simulate(300, true);
  drawFrame();
  window.__emberfallReady = true;
} else if (shot === 'end') {
  state.mode = 'gameover';
  state.score = 1240;
  state.best = 1240;
  state.level = 4;
  simulate(150, false);
  drawFrame();
  window.__emberfallReady = true;
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    tick(dt);
    drawFrame();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
