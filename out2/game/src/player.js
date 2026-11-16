// Emberfall — the brazier the player slides along the bottom to catch embers.
// The mouse sets a target and the brazier eases toward it; the arrow keys (or
// A/D) push the target instead, so both controls feel the same.
export class Brazier {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.x = w / 2;
    this.targetX = w / 2;
    this.width = 150;
    this.keys = { left: false, right: false };
    this.flicker = 0;
  }

  get rimY() {
    return this.h - 72;
  }

  setTarget(x) {
    this.targetX = Math.max(this.width / 2, Math.min(this.w - this.width / 2, x));
  }

  setKeys(left, right) {
    this.keys.left = left;
    this.keys.right = right;
  }

  update(dt) {
    const speed = 620;
    if (this.keys.left) this.targetX -= speed * dt;
    if (this.keys.right) this.targetX += speed * dt;
    this.targetX = Math.max(this.width / 2, Math.min(this.w - this.width / 2, this.targetX));
    // Ease toward the target so mouse play feels smooth, not snappy.
    const dx = this.targetX - this.x;
    this.x += dx * Math.min(1, dt * 18);
    this.flicker += dt;
  }

  reset() {
    this.x = this.w / 2;
    this.targetX = this.w / 2;
  }

  draw(ctx) {
    const x = this.x;
    const rimY = this.rimY;
    const half = this.width / 2;

    // Warm glow pooling under the brazier.
    const glow = ctx.createRadialGradient(x, rimY + 26, 8, x, rimY + 26, 130);
    glow.addColorStop(0, 'rgba(255, 150, 50, 0.30)');
    glow.addColorStop(1, 'rgba(255, 150, 50, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 130, rimY - 104, 260, 260);

    // Bowl.
    ctx.beginPath();
    ctx.moveTo(x - half, rimY);
    ctx.lineTo(x - half + 18, rimY + 46);
    ctx.quadraticCurveTo(x, rimY + 58, x + half - 18, rimY + 46);
    ctx.lineTo(x + half, rimY);
    ctx.closePath();
    const bowl = ctx.createLinearGradient(x, rimY, x, rimY + 56);
    bowl.addColorStop(0, '#4a3226');
    bowl.addColorStop(1, '#241610');
    ctx.fillStyle = bowl;
    ctx.fill();
    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Legs.
    ctx.strokeStyle = '#3a2618';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x - half + 26, rimY + 50);
    ctx.lineTo(x - half + 18, rimY + 68);
    ctx.moveTo(x + half - 26, rimY + 50);
    ctx.lineTo(x + half - 18, rimY + 68);
    ctx.stroke();

    // Flames licking out of the bowl.
    const flames = 5;
    for (let i = 0; i < flames; i++) {
      const fx = x - half + 22 + (i * (this.width - 44)) / (flames - 1);
      const wob = Math.sin(this.flicker * 7 + i * 1.7) * 5;
      const fh = 26 + Math.sin(this.flicker * 9 + i * 2.3) * 9;
      const grad = ctx.createLinearGradient(0, rimY, 0, rimY - fh);
      grad.addColorStop(0, 'rgba(255, 200, 80, 0.95)');
      grad.addColorStop(1, 'rgba(255, 90, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(fx - 11, rimY + 2);
      ctx.quadraticCurveTo(fx + wob, rimY - fh * 0.7, fx + wob * 0.5, rimY - fh);
      ctx.quadraticCurveTo(fx - wob, rimY - fh * 0.7, fx + 11, rimY + 2);
      ctx.closePath();
      ctx.fill();
    }
  }
}
