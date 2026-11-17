// Emberfall — falling embers, gold embers, frost embers and ash the field
// throws at the player. Every random choice comes from the injected rng,
// so a seeded run (the ?shot= modes) replays exactly the same sky.
const EMBER_COLOR = '#ff9a3c';
const GOLD_COLOR = '#ffd94d';
const FROST_COLOR = '#7fd4ff';
const ASH_COLOR = '#9aa0b5';

// Frost embers are the field's kind gift: catching one slows every falling
// item to less than half speed for a few seconds, so a crowded sky becomes
// catchable again. They only start appearing from level 2, once the sky
// is busy enough for the slow-down to matter.
const FROST_MIN_LEVEL = 2;
const FROST_CHANCE = 0.05;
const SLOW_FACTOR = 0.45;

export class EmberField {
  constructor(w, h, rng) {
    this.w = w;
    this.h = h;
    this.rng = rng;
    this.items = [];
    this.spawnTimer = 0.4;
    this.level = 1;
    // While a frost slow-down is running, every falling item drifts at
    // SLOW_FACTOR speed. The main loop sets this from the game state.
    this.slowT = 0;
    // Ambient mode (title / game-over backdrops): only orange embers fall,
    // so the menu screens read warm instead of grey.
    this.ambient = false;
  }

  reset() {
    this.items.length = 0;
    this.spawnTimer = 0.35;
  }

  setLevel(level) {
    this.level = level;
  }

  spawnOne(forceType = null) {
    const roll = this.rng();
    let type = forceType;
    if (!type) {
      const ashChance = Math.min(0.10 + this.level * 0.035, 0.34);
      const goldChance = 0.06;
      const frostChance = this.level >= FROST_MIN_LEVEL ? FROST_CHANCE : 0;
      if (roll < ashChance) type = 'ash';
      else if (roll < ashChance + goldChance) type = 'gold';
      else if (roll < ashChance + goldChance + frostChance) type = 'frost';
      else type = 'ember';
    }
    const speed = 130 + this.level * 26 + this.rng() * 60;
    this.items.push({
      x: 30 + this.rng() * (this.w - 60),
      y: -24,
      vy: type === 'gold' ? speed * 0.85 : type === 'ash' ? speed * 1.12 : type === 'frost' ? speed * 0.9 : speed,
      vx: 0,
      type,
      r: type === 'gold' ? 13 : type === 'ash' ? 11 : type === 'frost' ? 11 : 10,
      phase: this.rng() * Math.PI * 2,
      amp: 14 + this.rng() * 26,
      trail: [],
      spin: (this.rng() - 0.5) * 2,
      rot: this.rng() * Math.PI * 2,
    });
  }

  // A burst of fresh embers at spread heights, for the play and flare
  // screenshots: the same spawn path as real play, just called several
  // times at once so the frame reads crowded and alive.
  burstSky(count) {
    for (let i = 0; i < count; i++) {
      this.spawnOne();
      const it = this.items[this.items.length - 1];
      it.y = 60 + this.rng() * (this.h * 0.62);
    }
    return this.items;
  }

  // The Flare power-up: hand every falling item back so the caller can
  // burst it into particles.
  clearAll() {
    return this.items.splice(0, this.items.length);
  }

  update(dt, brazier, events) {
    if (this.slowT > 0) this.slowT -= dt;
    // Spawn faster and denser as the level climbs.
    this.spawnTimer -= dt;
    const interval = Math.max(0.34, 0.92 - this.level * 0.075);
    if (this.spawnTimer <= 0) {
      this.spawnOne(this.ambient ? 'ember' : null);
      if (this.level >= 3 && this.rng() < 0.35) this.spawnOne();
      this.spawnTimer = interval * (0.75 + this.rng() * 0.5);
    }
    const groundY = this.h - 14;
    const slow = this.slowT > 0 ? SLOW_FACTOR : 1;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.phase += dt * 2.2;
      it.x += Math.sin(it.phase) * it.amp * dt + it.vx * dt;
      it.y += it.vy * slow * dt;
      it.rot += it.spin * dt;
      it.trail.push({ x: it.x, y: it.y });
      if (it.trail.length > 9) it.trail.shift();

      // Caught by the brazier?
      if (brazier && it.y + it.r >= brazier.rimY - 4 && it.y < brazier.rimY + 30) {
        if (Math.abs(it.x - brazier.x) <= brazier.width / 2 + it.r * 0.4) {
          this.items.splice(i, 1);
          if (events && events.onCatch) events.onCatch(it);
          continue;
        }
      }

      // Hit the ground uncaught.
      if (it.y - it.r > groundY) {
        this.items.splice(i, 1);
        if (events && events.onGround) events.onGround(it);
      }
    }
  }

  draw(ctx, time) {
    // While frost slows the fall, the whole sky takes on a cold tint.
    if (this.slowT > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(127, 212, 255, 0.07)';
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.restore();
    }
    for (const it of this.items) {
      const color =
        it.type === 'ash'
          ? ASH_COLOR
          : it.type === 'gold'
            ? GOLD_COLOR
            : it.type === 'frost'
              ? FROST_COLOR
              : EMBER_COLOR;

      // Fading trail behind the fall.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let t = 0; t < it.trail.length; t++) {
        const p = it.trail[t];
        const k = (t + 1) / it.trail.length;
        ctx.globalAlpha = k * 0.35;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, it.r * k * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Halo glow.
      const glowR = it.r * 2.6;
      const g = ctx.createRadialGradient(it.x, it.y, 1, it.x, it.y, glowR);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = it.type === 'ash' ? 0.35 : 0.8;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(it.x, it.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Body.
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      if (it.type === 'ash') {
        ctx.fillStyle = '#6d7286';
        ctx.beginPath();
        ctx.arc(0, 0, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#565b6e';
        ctx.beginPath();
        ctx.arc(-3, -2, it.r * 0.45, 0, Math.PI * 2);
        ctx.arc(4, 3, it.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (it.type === 'frost') {
        // Icy crystal: pale core with a snowflake cross, so it reads
        // cold blue at a glance and never mixes up with gold.
        const body = ctx.createRadialGradient(-it.r * 0.3, -it.r * 0.3, 1, 0, 0, it.r);
        body.addColorStop(0, '#ffffff');
        body.addColorStop(0.45, '#bfe9ff');
        body.addColorStop(1, '#2b7fb8');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 1.5;
        const s = it.r * 0.85;
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.lineTo(s, 0);
        ctx.moveTo(-s * 0.5, -s * 0.85);
        ctx.lineTo(s * 0.5, s * 0.85);
        ctx.moveTo(s * 0.5, -s * 0.85);
        ctx.lineTo(-s * 0.5, s * 0.85);
        ctx.stroke();
      } else {
        const body = ctx.createRadialGradient(-it.r * 0.3, -it.r * 0.3, 1, 0, 0, it.r);
        body.addColorStop(0, '#fff6d8');
        body.addColorStop(0.45, color);
        body.addColorStop(1, it.type === 'gold' ? '#b8860b' : '#c33d00');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, it.r, 0, Math.PI * 2);
        ctx.fill();
        if (it.type === 'gold') {
          // Sparkle cross so gold embers read at a glance.
          ctx.strokeStyle = 'rgba(255,255,255,0.9)';
          ctx.lineWidth = 1.5;
          const s = it.r * 0.8;
          ctx.beginPath();
          ctx.moveTo(-s, 0);
          ctx.lineTo(s, 0);
          ctx.moveTo(0, -s);
          ctx.lineTo(0, s);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}
