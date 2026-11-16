// Emberfall — glowing particle bursts for catches and ember trails.
export class Particles {
  constructor(rng) {
    this.rng = rng;
    this.list = [];
  }

  burst(x, y, color, count, speed = 160) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2;
      const v = speed * (0.3 + this.rng() * 0.9);
      this.list.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        life: 0.45 + this.rng() * 0.4,
        age: 0,
        size: 1.5 + this.rng() * 3.5,
        color,
      });
    }
  }

  spark(x, y, color) {
    this.list.push({
      x,
      y,
      vx: (this.rng() - 0.5) * 30,
      vy: 20 + this.rng() * 40,
      life: 0.35 + this.rng() * 0.25,
      age: 0,
      size: 1 + this.rng() * 2,
      color,
    });
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.list.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      p.vx *= 1 - 1.5 * dt;
    }
    if (this.list.length > 420) this.list.splice(0, this.list.length - 420);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.list) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = k;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * k + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear() {
    this.list.length = 0;
  }
}
