// Emberfall — synthesized sound bank. Every sound is a WebAudio oscillator
// built on the fly; the game ships no audio files at all.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Browsers only let audio start after a user gesture, so this runs on the
  // first key press or click and does nothing before that.
  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (err) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  _blip(freq, endFreq, dur, type, vol, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), t0 + dur);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // The catch blip climbs in pitch with the combo, so a streak sounds
  // like it is rising.
  catchNote(combo) {
    const step = Math.min(combo, 12);
    const base = 520 * Math.pow(2, step / 12);
    this._blip(base, base * 1.5, 0.09, 'sine', 0.16);
  }

  goldNote() {
    this._blip(880, 880, 0.12, 'sine', 0.18);
    this._blip(1318, 1318, 0.18, 'sine', 0.14, 0.07);
    this._blip(1760, 1760, 0.22, 'sine', 0.10, 0.14);
  }

  // Frost: a cold shimmer — two high notes a fifth apart, the second
  // hanging a little longer, like ice catching light.
  frostNote() {
    this._blip(1568, 1568, 0.16, 'sine', 0.14);
    this._blip(2093, 2093, 0.26, 'sine', 0.10, 0.08);
  }

  ashThud() {
    this._blip(160, 55, 0.28, 'sawtooth', 0.20);
    this._blip(90, 40, 0.32, 'triangle', 0.16, 0.02);
  }

  flareWhoosh() {
    this._blip(220, 880, 0.35, 'sawtooth', 0.10);
    this._blip(440, 1760, 0.30, 'sine', 0.08, 0.05);
  }

  levelUp() {
    this._blip(523, 523, 0.10, 'square', 0.08);
    this._blip(659, 659, 0.10, 'square', 0.08, 0.09);
    this._blip(784, 784, 0.16, 'square', 0.08, 0.18);
  }

  gameOver() {
    this._blip(392, 392, 0.22, 'triangle', 0.16);
    this._blip(311, 311, 0.22, 'triangle', 0.16, 0.20);
    this._blip(233, 180, 0.5, 'triangle', 0.16, 0.40);
  }

  click() {
    this._blip(660, 660, 0.06, 'sine', 0.10);
  }
}
