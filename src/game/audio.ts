const PENTATONIC_NOTES = [
  261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99,
];

class ForestAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private ambientStarted = false;
  private windGain: GainNode | null = null;
  private rainGain: GainNode | null = null;

  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.startAmbientLayers();
  }

  private startAmbientLayers(): void {
    if (!this.ctx || this.ambientStarted) return;
    this.ambientStarted = true;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.2;
    }

    // Gentle forest wind
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = noiseBuffer;
    windSrc.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 340;
    windFilter.Q.value = 1.4;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = this.enabled ? 0.032 : 0;

    windSrc.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    windSrc.start();

    // Soft rain shimmer layer (modulated dynamically by rain weather weight)
    const rainBuffer = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
    const rData = rainBuffer.getChannelData(0);
    for (let i = 0; i < rData.length; i++) {
      rData[i] = (Math.random() * 2 - 1) * 0.35;
    }
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = rainBuffer;
    rainSrc.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'highpass';
    rainFilter.frequency.value = 1850;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;

    rainSrc.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);
    rainSrc.start();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.windGain && this.ctx) {
      this.windGain.gain.setTargetAtTime(on ? 0.032 : 0, this.ctx.currentTime, 0.15);
    }
    if (this.rainGain && this.ctx && !on) {
      this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  updateRainIntensity(rainWeight: number): void {
    if (!this.rainGain || !this.ctx) return;
    const target = this.enabled ? Math.max(0, Math.min(1, rainWeight)) * 0.028 : 0;
    this.rainGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.3);
  }

  playTone(freq: number, duration = 0.7, volume = 0.08, type: OscillatorType = 'sine'): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  playChime(indexShift = 0): void {
    const idx = Math.min(
      PENTATONIC_NOTES.length - 1,
      Math.max(0, Math.floor(Math.random() * 5) + indexShift)
    );
    const f = PENTATONIC_NOTES[idx];
    this.playTone(f, 1.05, 0.08, 'sine');
    this.playTone(f * 1.5, 0.85, 0.03, 'triangle');
  }

  playJump(isDouble = false): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startF = isDouble ? 390 : 250;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(startF * 1.6, now + 0.16);
    gain.gain.setValueAtTime(0.048, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playBounce(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(430, now + 0.24);
    gain.gain.setValueAtTime(0.085, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
    this.playTone(523.25, 0.55, 0.038, 'sine');
  }

  playPulse(): void {
    this.playTone(293.66, 1.3, 0.055, 'sine');
    window.setTimeout(() => this.playTone(440.0, 1.2, 0.045, 'sine'), 65);
    window.setTimeout(() => this.playTone(659.25, 1.3, 0.035, 'triangle'), 130);
  }

  playLantern(): void {
    [261.63, 329.63, 392.0, 523.25].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 1.2, 0.055, 'sine'), i * 85);
    });
  }

  playHit(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(175, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.22);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.27);
  }

  playBlossom(): void {
    [392.0, 493.88, 587.33, 783.99].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 0.9, 0.055, 'sine'), i * 55);
    });
  }

  playCrystal(): void {
    [523.25, 659.25, 987.77].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 1.0, 0.045, 'triangle'), i * 65);
    });
  }
}

export const audioEngine = new ForestAudioEngine();
