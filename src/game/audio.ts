import type { MagicalCreatureKind } from './types';
import type { WeatherWeights } from './world';

const PENTATONIC_NOTES = [
  261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99,
];

interface LofiChordBar {
  notes: number[];
  melodyA: number;
  melodyB: number;
  sparkle: number;
}

// Gentle 72 BPM chill progression: Fmaj7 -> Em7 -> Dm9 -> Cmaj7
const LOFI_PROGRESSION: LofiChordBar[] = [
  { notes: [174.61, 220.0, 261.63, 329.63], melodyA: 523.25, melodyB: 440.0, sparkle: 659.25 },
  { notes: [164.81, 196.0, 246.94, 293.66], melodyA: 493.88, melodyB: 392.0, sparkle: 587.33 },
  { notes: [146.83, 220.0, 261.63, 329.63], melodyA: 440.0, melodyB: 349.23, sparkle: 523.25 },
  { notes: [130.81, 196.0, 246.94, 329.63], melodyA: 392.0, melodyB: 493.88, sparkle: 659.25 },
];

const DEFAULT_WEIGHTS: WeatherWeights = {
  leaves: 1,
  rain: 0,
  flurry: 0,
  snow: 0,
  underwater: 0,
};

class ForestAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private musicVolume = 1.0;
  private sfxVolume = 0.72;
  private ambientStarted = false;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private rainWarmGain: GainNode | null = null;
  private musicMasterGain: GainNode | null = null;
  private sfxMasterGain: GainNode | null = null;
  private musicLowpass: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private weatherWeights: WeatherWeights = { ...DEFAULT_WEIGHTS };
  private lofiStep = 0;
  private nextStepTime = 0;
  private schedulerId: number | null = null;

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('whispering_grove_audio_v1');
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        enabled?: boolean;
        musicVolume?: number;
        sfxVolume?: number;
      };
      if (typeof parsed.enabled === 'boolean') this.enabled = parsed.enabled;
      if (typeof parsed.musicVolume === 'number' && Number.isFinite(parsed.musicVolume)) {
        this.musicVolume = Math.max(0, Math.min(1, parsed.musicVolume));
      }
      if (typeof parsed.sfxVolume === 'number' && Number.isFinite(parsed.sfxVolume)) {
        this.sfxVolume = Math.max(0, Math.min(1, parsed.sfxVolume));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        'whispering_grove_audio_v1',
        JSON.stringify({
          enabled: this.enabled,
          musicVolume: this.musicVolume,
          sfxVolume: this.sfxVolume,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }

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
    this.noiseBuffer = noiseBuffer;

    // Gentle forest wind
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = noiseBuffer;
    windSrc.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 340;
    this.windFilter.Q.value = 1.4;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = this.enabled ? 0.024 : 0;

    windSrc.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    windSrc.start();

    // Soft lofi rain layers (crisp patter + cozy warm mid-patter)
    const rainBuffer = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
    const rData = rainBuffer.getChannelData(0);
    for (let i = 0; i < rData.length; i++) {
      rData[i] = (Math.random() * 2 - 1) * 0.35;
    }
    const rainSrc = this.ctx.createBufferSource();
    rainSrc.buffer = rainBuffer;
    rainSrc.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 2100;
    rainFilter.Q.value = 0.7;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0;

    rainSrc.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ctx.destination);

    const rainWarmFilter = this.ctx.createBiquadFilter();
    rainWarmFilter.type = 'bandpass';
    rainWarmFilter.frequency.value = 720;
    rainWarmFilter.Q.value = 0.8;

    this.rainWarmGain = this.ctx.createGain();
    this.rainWarmGain.gain.value = 0;

    rainSrc.connect(rainWarmFilter);
    rainWarmFilter.connect(this.rainWarmGain);
    this.rainWarmGain.connect(this.ctx.destination);
    rainSrc.start();

    // Soft Lofi Chill Music Master Bus (warm low-pass filtered Rhodes & brush texture)
    this.musicLowpass = this.ctx.createBiquadFilter();
    this.musicLowpass.type = 'lowpass';
    this.musicLowpass.frequency.value = 1600;
    this.musicLowpass.Q.value = 0.65;

    this.musicMasterGain = this.ctx.createGain();
    this.musicMasterGain.gain.value = this.enabled ? 0.14 * this.musicVolume : 0;

    this.musicLowpass.connect(this.musicMasterGain);
    this.musicMasterGain.connect(this.ctx.destination);

    // Master Sound Effects Bus (slightly softer by default: 0.72)
    this.sfxMasterGain = this.ctx.createGain();
    this.sfxMasterGain.gain.value = this.enabled ? this.sfxVolume : 0;
    this.sfxMasterGain.connect(this.ctx.destination);

    this.nextStepTime = this.ctx.currentTime + 0.08;
    if (this.schedulerId === null) {
      this.schedulerId = window.setInterval(() => this.scheduleLofiLookahead(), 110);
    }
    this.applyWeatherAudioTargets();
  }

  private scheduleLofiLookahead(): void {
    if (!this.ctx || !this.musicLowpass) return;
    if (this.ctx.state !== 'running') return;

    const stepDuration = 60 / 72 / 2; // 72 BPM eighth-note (~0.4167s)
    // Recover gracefully if tab was backgrounded
    if (this.nextStepTime < this.ctx.currentTime - 0.5) {
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }

    while (this.nextStepTime < this.ctx.currentTime + 0.2) {
      this.scheduleLofiStep(this.nextStepTime, this.lofiStep);
      this.nextStepTime += stepDuration;
      this.lofiStep = (this.lofiStep + 1) % 32;
    }
  }

  private scheduleRhodesVoice(
    time: number,
    freq: number,
    duration: number,
    peakGain: number
  ): void {
    if (!this.ctx || !this.musicLowpass) return;
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    // Gentle lofi tape warmth wobble
    osc.detune.setValueAtTime((Math.random() - 0.5) * 7, time);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 2, time);

    const overGain = this.ctx.createGain();
    overGain.gain.setValueAtTime(0.16, time);
    overGain.gain.exponentialRampToValueAtTime(0.02, time + Math.min(duration * 0.55, 0.9));

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peakGain, time + 0.028);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    overtone.connect(overGain);
    overGain.connect(gain);
    gain.connect(this.musicLowpass);

    osc.start(time);
    overtone.start(time);
    osc.stop(time + duration + 0.05);
    overtone.stop(time + duration + 0.05);
  }

  private scheduleSoftKick(time: number): void {
    if (!this.ctx || !this.musicLowpass) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(98, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.14);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.11, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    osc.connect(gain);
    gain.connect(this.musicLowpass);
    osc.start(time);
    osc.stop(time + 0.24);
  }

  private scheduleSoftBrush(time: number, accent: boolean): void {
    if (!this.ctx || !this.musicLowpass || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(accent ? 1350 : 2100, time);
    filter.Q.value = 1.1;

    const gain = this.ctx.createGain();
    const peak = accent ? 0.038 : 0.016;
    const dur = accent ? 0.095 : 0.055;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicLowpass);
    src.start(time, Math.random() * 1.4, dur + 0.03);
  }

  private scheduleLofiStep(time: number, step: number): void {
    const bar = LOFI_PROGRESSION[Math.floor(step / 8)];
    const stepInBar = step % 8;
    const w = this.weatherWeights;

    // 1. Warm strummed Rhodes chord at the start of every bar
    if (stepInBar === 0) {
      bar.notes.forEach((freq, idx) => {
        this.scheduleRhodesVoice(time + idx * 0.038, freq, 2.85, idx === 0 ? 0.16 : 0.11);
      });
    }

    // 2. Gentle sparse lofi melody & weather-specific harmonic textures
    if (stepInBar === 3) {
      this.scheduleRhodesVoice(time, bar.melodyA, 1.35, 0.075);
    } else if (stepInBar === 6) {
      this.scheduleRhodesVoice(time, bar.melodyB, 1.45, 0.07);
    }

    // Rain weather: soft raindrop fifths
    if (w.rain > 0.2 && (stepInBar === 2 || stepInBar === 5)) {
      this.scheduleRhodesVoice(time + 0.02, bar.sparkle * 1.5, 0.9, 0.032 * w.rain);
    }

    // Snow weather: delicate winter celesta bell sparkles
    if (w.snow > 0.2 && (stepInBar === 1 || stepInBar === 4 || stepInBar === 7)) {
      const bellFreq = stepInBar === 4 ? bar.sparkle * 2 : bar.melodyA * 2;
      this.scheduleRhodesVoice(time, bellFreq, 1.1, 0.026 * w.snow);
    }

    // Underwater weather: soft bubbly kalimba plucks
    if (w.underwater > 0.2 && (stepInBar === 2 || stepInBar === 4 || stepInBar === 6)) {
      this.scheduleRhodesVoice(time, bar.notes[(stepInBar / 2) % bar.notes.length] * 2, 0.5, 0.065 * w.underwater);
    }

    // Starlight flurry weather: shimmering high 9th chord chimes
    if (w.flurry > 0.2 && (stepInBar === 1 || stepInBar === 5)) {
      this.scheduleRhodesVoice(time, bar.sparkle * 2, 1.25, 0.028 * w.flurry);
    }

    // 3. Soft lofi groove (muted kick + subtle brush texture, softer underwater)
    const drumDamp = 1 - w.underwater * 0.5;
    if (stepInBar === 0 || stepInBar === 4) {
      if (drumDamp > 0.3) this.scheduleSoftKick(time);
    }
    if (stepInBar === 2 || stepInBar === 6) {
      this.scheduleSoftBrush(time, true);
    } else if (stepInBar % 2 === 1) {
      this.scheduleSoftBrush(time, false);
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.saveSettings();
    if (!this.ctx) return;
    if (this.sfxMasterGain) {
      this.sfxMasterGain.gain.setTargetAtTime(on ? this.sfxVolume : 0, this.ctx.currentTime, 0.06);
    }
    if (this.musicMasterGain) {
      this.musicMasterGain.gain.setTargetAtTime(
        on ? 0.14 * this.musicVolume : 0,
        this.ctx.currentTime,
        0.18
      );
    }
    if (!on) {
      if (this.windGain) this.windGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      if (this.rainGain) this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
      if (this.rainWarmGain) this.rainWarmGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
    } else {
      this.applyWeatherAudioTargets();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    if (!this.ctx) return;
    if (this.musicMasterGain) {
      this.musicMasterGain.gain.setTargetAtTime(
        this.enabled ? 0.14 * this.musicVolume : 0,
        this.ctx.currentTime,
        0.08
      );
    }
    this.applyWeatherAudioTargets();
  }

  setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.saveSettings();
    if (!this.ctx || !this.sfxMasterGain) return;
    this.sfxMasterGain.gain.setTargetAtTime(
      this.enabled ? this.sfxVolume : 0,
      this.ctx.currentTime,
      0.06
    );
  }

  updateRainIntensity(rainWeight: number): void {
    this.updateWeatherAudio({ ...this.weatherWeights, rain: rainWeight });
  }

  updateWeatherAudio(weights: WeatherWeights): void {
    this.weatherWeights = weights;
    this.applyWeatherAudioTargets();
  }

  private applyWeatherAudioTargets(): void {
    if (!this.ctx) return;
    const w = this.weatherWeights;
    const now = this.ctx.currentTime;
    const mVol = this.enabled ? this.musicVolume : 0;

    if (this.rainGain) {
      const targetRain = mVol * Math.max(0, Math.min(1, w.rain)) * 0.042;
      this.rainGain.gain.setTargetAtTime(targetRain, now, 0.35);
    }
    if (this.rainWarmGain) {
      const targetWarm = mVol * Math.max(0, Math.min(1, w.rain)) * 0.036;
      this.rainWarmGain.gain.setTargetAtTime(targetWarm, now, 0.35);
    }
    if (this.windFilter && this.windGain) {
      // Crisp alpine hush in snow, deep muffled rumble underwater, gentle breeze in forest
      const windFreq = 340 + w.snow * 170 - w.underwater * 180;
      this.windFilter.frequency.setTargetAtTime(windFreq, now, 0.45);
      const windLevel = mVol * Math.max(0, 0.022 + w.snow * 0.012 - w.underwater * 0.008);
      this.windGain.gain.setTargetAtTime(windLevel, now, 0.4);
    }
    if (this.musicLowpass) {
      // Underwater gets cozy submerged lofi cutoff (~540Hz); rain gets warm cozy ~1220Hz; open woods ~1650Hz
      const targetCutoff =
        1650 - w.underwater * 1110 - w.rain * 430 - w.snow * 140 + w.flurry * 180;
      this.musicLowpass.frequency.setTargetAtTime(Math.max(460, targetCutoff), now, 0.5);
    }
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
    gain.connect(this.sfxMasterGain ?? this.ctx.destination);
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
    gain.connect(this.sfxMasterGain ?? this.ctx.destination);
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
    gain.connect(this.sfxMasterGain ?? this.ctx.destination);
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
    gain.connect(this.sfxMasterGain ?? this.ctx.destination);
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

  playStarSeed(): void {
    [587.33, 783.99, 987.77, 1174.66].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 0.95, 0.045, 'sine'), i * 50);
    });
  }

  playSkyRing(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.28);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    osc.connect(gain);
    gain.connect(this.sfxMasterGain ?? this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
    this.playTone(783.99, 0.7, 0.04, 'triangle');
  }

  playPurchase(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 0.5, 0.045, 'sine'), i * 55);
    });
  }

  playEquip(): void {
    this.playTone(440.0, 0.28, 0.045, 'triangle');
    window.setTimeout(() => this.playTone(659.25, 0.35, 0.04, 'sine'), 55);
  }

  playCreaturePop(kind: MagicalCreatureKind): void {
    if (!this.enabled || !this.ctx) return;
    if (kind === 'mermaid') {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        window.setTimeout(() => this.playTone(f, 0.55, 0.036, 'sine'), i * 55);
      });
    } else if (kind === 'fairy') {
      this.playTone(880.0, 0.32, 0.032, 'sine');
      window.setTimeout(() => this.playTone(1174.66, 0.42, 0.028, 'sine'), 50);
    } else {
      this.playTone(440.0, 0.35, 0.034, 'triangle');
      window.setTimeout(() => this.playTone(587.33, 0.4, 0.03, 'sine'), 65);
    }
  }

  playCreatureBless(): void {
    [587.33, 783.99, 987.77].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 0.65, 0.042, 'sine'), i * 55);
    });
  }

  playHighJump(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.24);
    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxMasterGain ?? this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
    this.playTone(987.77, 0.35, 0.032, 'triangle');
  }

  playFlyActivate(): void {
    [440.0, 587.33, 783.99, 1046.5].forEach((f, i) => {
      window.setTimeout(() => this.playTone(f, 0.8, 0.048, 'sine'), i * 48);
    });
  }

  playBaddiePop(): void {
    this.playTone(196.0, 0.18, 0.042, 'triangle');
    window.setTimeout(() => this.playTone(155.56, 0.22, 0.036, 'sawtooth'), 55);
  }

  playStomp(): void {
    this.playTone(293.66, 0.18, 0.06, 'triangle');
    window.setTimeout(() => this.playTone(587.33, 0.32, 0.045, 'sine'), 45);
  }

  playAnimalHealed(): void {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
      window.setTimeout(() => {
        this.playTone(f, 0.9, 0.055, 'sine');
        if (i >= 2) this.playTone(f * 1.5, 0.55, 0.024, 'triangle');
      }, i * 52);
    });
  }

  playTrashPickup(): void {
    this.playTone(440.0, 0.24, 0.045, 'triangle');
    window.setTimeout(() => this.playTone(659.25, 0.32, 0.045, 'sine'), 48);
  }
}

export const audioEngine = new ForestAudioEngine();
