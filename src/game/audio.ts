import type { LevelId, MagicalCreatureKind } from './types';
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

interface LofiLevelTheme {
  bpm: number;
  progression: LofiChordBar[];
  strumDelay: number;
  chordDuration: number;
  kickSteps: number[];
  kickPitchStart: number;
  kickPitchEnd: number;
  accentBrushSteps: number[];
  softBrushSteps: number[];
  overtoneType: OscillatorType;
  overtoneRatio: number;
  overtoneGain: number;
  baseCutoff: number;
  melodyPattern: 'classic' | 'syncopated' | 'arp' | 'winter';
}

const LEVEL_LOFI_THEMES: Record<LevelId, LofiLevelTheme> = {
  // Level 1 · Whispering Woods: Warm 72 BPM emerald forest Rhodes (Fmaj7 -> Em7 -> Dm9 -> Cmaj7)
  1: {
    bpm: 72,
    progression: [
      { notes: [174.61, 220.0, 261.63, 329.63], melodyA: 523.25, melodyB: 440.0, sparkle: 659.25 },
      { notes: [164.81, 196.0, 246.94, 293.66], melodyA: 493.88, melodyB: 392.0, sparkle: 587.33 },
      { notes: [146.83, 220.0, 261.63, 329.63], melodyA: 440.0, melodyB: 349.23, sparkle: 523.25 },
      { notes: [130.81, 196.0, 246.94, 329.63], melodyA: 392.0, melodyB: 493.88, sparkle: 659.25 },
    ],
    strumDelay: 0.038,
    chordDuration: 2.85,
    kickSteps: [0, 4],
    kickPitchStart: 98,
    kickPitchEnd: 42,
    accentBrushSteps: [2, 6],
    softBrushSteps: [1, 3, 5, 7],
    overtoneType: 'triangle',
    overtoneRatio: 2,
    overtoneGain: 0.16,
    baseCutoff: 1650,
    melodyPattern: 'classic',
  },
  // Level 2 · Amber & Crystal Hollows: Deep cozy 66 BPM autumn felt-piano groove (Cmaj7 -> Bm7 -> Am9 -> Gmaj7)
  2: {
    bpm: 66,
    progression: [
      { notes: [130.81, 164.81, 196.0, 246.94], melodyA: 493.88, melodyB: 392.0, sparkle: 587.33 },
      { notes: [123.47, 146.83, 185.0, 220.0], melodyA: 440.0, melodyB: 369.99, sparkle: 587.33 },
      { notes: [110.0, 164.81, 196.0, 246.94], melodyA: 392.0, melodyB: 493.88, sparkle: 659.25 },
      { notes: [146.83, 196.0, 246.94, 369.99], melodyA: 392.0, melodyB: 369.99, sparkle: 587.33 },
    ],
    strumDelay: 0.048,
    chordDuration: 3.1,
    kickSteps: [0, 3, 4],
    kickPitchStart: 86,
    kickPitchEnd: 38,
    accentBrushSteps: [2, 6],
    softBrushSteps: [1, 5, 7],
    overtoneType: 'sine',
    overtoneRatio: 1.5,
    overtoneGain: 0.19,
    baseCutoff: 1380,
    melodyPattern: 'syncopated',
  },
  // Level 3 · Frostbloom Skywoods: Airy 78 BPM floating harp-rhodes (Gmaj9 -> F#m7 -> Em9 -> Dmaj7)
  3: {
    bpm: 78,
    progression: [
      { notes: [196.0, 246.94, 293.66, 369.99], melodyA: 587.33, melodyB: 440.0, sparkle: 739.99 },
      { notes: [185.0, 220.0, 277.18, 329.63], melodyA: 554.37, melodyB: 440.0, sparkle: 659.25 },
      { notes: [164.81, 246.94, 293.66, 369.99], melodyA: 493.88, melodyB: 587.33, sparkle: 739.99 },
      { notes: [146.83, 220.0, 277.18, 369.99], melodyA: 440.0, melodyB: 554.37, sparkle: 659.25 },
    ],
    strumDelay: 0.068,
    chordDuration: 2.6,
    kickSteps: [0, 5],
    kickPitchStart: 92,
    kickPitchEnd: 44,
    accentBrushSteps: [2, 6],
    softBrushSteps: [1, 3, 4, 7],
    overtoneType: 'triangle',
    overtoneRatio: 2,
    overtoneGain: 0.14,
    baseCutoff: 1850,
    melodyPattern: 'arp',
  },
  // Level 4 · Frozen Pine Peaks: Serene 62 BPM winter celesta & aurora lofi (Abmaj7 -> Gm7 -> Fm9 -> Ebmaj7)
  4: {
    bpm: 62,
    progression: [
      { notes: [207.65, 261.63, 311.13, 392.0], melodyA: 622.25, melodyB: 523.25, sparkle: 783.99 },
      { notes: [196.0, 233.08, 293.66, 349.23], melodyA: 587.33, melodyB: 466.16, sparkle: 698.46 },
      { notes: [174.61, 207.65, 261.63, 349.23], melodyA: 523.25, melodyB: 466.16, sparkle: 783.99 },
      { notes: [155.56, 196.0, 233.08, 293.66], melodyA: 466.16, melodyB: 587.33, sparkle: 698.46 },
    ],
    strumDelay: 0.055,
    chordDuration: 3.35,
    kickSteps: [0, 4],
    kickPitchStart: 80,
    kickPitchEnd: 36,
    accentBrushSteps: [2, 6],
    softBrushSteps: [3, 7],
    overtoneType: 'sine',
    overtoneRatio: 3,
    overtoneGain: 0.13,
    baseCutoff: 1520,
    melodyPattern: 'winter',
  },
};

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
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private musicLowpass: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private weatherWeights: WeatherWeights = { ...DEFAULT_WEIGHTS };
  private levelId: LevelId = 1;
  private lofiStep = 0;
  private nextStepTime = 0;
  private schedulerId: number | null = null;
  private gestureListenersAttached = false;
  private iosSessionUnlocked = false;
  private silentWavEl: HTMLAudioElement | null = null;
  private silentWavUrl: string | null = null;

  constructor() {
    this.loadSettings();
    this.attachUnlockListeners();
  }

  private isTouchViewport(): boolean {
    if (typeof window === 'undefined') return false;
    const coarse =
      typeof window.matchMedia === 'function' && Boolean(window.matchMedia('(pointer: coarse)')?.matches);
    const hasTouch = 'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
    return coarse || hasTouch;
  }

  private getMasterOutputLevel(): number {
    // Mobile phone speakers need extra gain headroom while keeping desktop soft and relaxing
    return this.isTouchViewport() ? 2.1 : 1.15;
  }

  private ensureSilentWavElement(): HTMLAudioElement | null {
    if (typeof document === 'undefined' || typeof Audio === 'undefined') return null;
    if (this.silentWavEl) return this.silentWavEl;
    try {
      // Build a 50ms silent 16-bit mono PCM WAV in memory so iOS Safari switches out of the mute-obedient 'ambient' session
      const numSamples = 2205;
      const dataSize = numSamples * 2;
      const buffer = new ArrayBuffer(44 + dataSize);
      const view = new DataView(buffer);
      const writeAscii = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
      };
      writeAscii(0, 'RIFF');
      view.setUint32(4, 36 + dataSize, true);
      writeAscii(8, 'WAVE');
      writeAscii(12, 'fmt ');
      view.setUint32(16, 16, true); // PCM chunk size
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, 44100, true); // Sample rate
      view.setUint32(28, 88200, true); // Byte rate
      view.setUint16(32, 2, true); // Block align
      view.setUint16(34, 16, true); // Bits per sample
      writeAscii(36, 'data');
      view.setUint32(40, dataSize, true);

      const blob = new Blob([buffer], { type: 'audio/wav' });
      this.silentWavUrl = URL.createObjectURL(blob);
      const audio = new Audio(this.silentWavUrl);
      audio.setAttribute('playsinline', '');
      audio.preload = 'auto';
      audio.volume = 1;
      // On older iOS without navigator.audioSession, keeping the silent track looping prevents reverting to 'ambient' (muted by ringer switch)
      if (typeof navigator !== 'undefined' && !('audioSession' in navigator)) {
        audio.loop = true;
      }
      this.silentWavEl = audio;
      return audio;
    } catch {
      return null;
    }
  }

  private configureMobileAudioSession(): void {
    if (typeof navigator === 'undefined') return;
    try {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession && nav.audioSession.type !== 'playback') {
        nav.audioSession.type = 'playback';
      }
    } catch {
      // Ignore if audioSession API is unavailable or restricted
    }
  }

  private attachUnlockListeners(): void {
    if (typeof window === 'undefined' || this.gestureListenersAttached) return;
    this.gestureListenersAttached = true;

    try {
      const handleUserGesture = () => {
        this.unlock();
      };
      const handleVisibilityResume = () => {
        if (typeof document !== 'undefined' && !document.hidden) {
          this.resumeIfNeeded();
        }
      };

      // Capture phase ensures unlocking runs even if an inner control calls stopPropagation/preventDefault
      window.addEventListener('touchend', handleUserGesture, { capture: true, passive: true });
      window.addEventListener('pointerup', handleUserGesture, { capture: true, passive: true });
      window.addEventListener('click', handleUserGesture, { capture: true, passive: true });
      window.addEventListener('keydown', handleUserGesture, { capture: true, passive: true });
      window.addEventListener('touchstart', handleUserGesture, { capture: true, passive: true });
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityResume);
      }
      window.addEventListener('pageshow', handleVisibilityResume);
      window.addEventListener('focus', handleVisibilityResume);
    } catch {
      // Ignore listener attachment errors in restricted environments
    }
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

  unlock(): void {
    this.configureMobileAudioSession();
    this.init();
    if (!this.ctx) return;

    if (!this.iosSessionUnlocked) {
      const wav = this.ensureSilentWavElement();
      if (wav) {
        try {
          wav.currentTime = 0;
          const p = wav.play();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              this.iosSessionUnlocked = true;
            }).catch(() => {
              // Will retry on next user activation (e.g., touchend/click)
            });
          } else {
            this.iosSessionUnlocked = true;
          }
        } catch {
          // Retry on next gesture
        }
      }
    }

    // Play a 1-sample silent Web Audio buffer inside the gesture to wake iOS/Android audio hardware
    try {
      const unlockBuffer = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = unlockBuffer;
      src.connect(this.ctx.destination);
      src.start(0);
    } catch {
      // Ignore if context cannot start yet
    }

    this.resumeIfNeeded();
  }

  private resumeIfNeeded(): void {
    if (!this.ctx) return;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.getMasterOutputLevel(), this.ctx.currentTime, 0.05);
    }
    if (this.ctx.state !== 'running') {
      void this.ctx
        .resume()
        .then(() => {
          if (!this.ctx) return;
          this.nextStepTime = Math.max(this.nextStepTime, this.ctx.currentTime + 0.04);
          this.applyWeatherAudioTargets();
          this.syncBusVolumes();
          this.scheduleLofiLookahead();
        })
        .catch(() => {
          // Ignore resume rejection until next user gesture
        });
    }
  }

  private syncBusVolumes(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.sfxMasterGain) {
      this.sfxMasterGain.gain.setTargetAtTime(this.enabled ? this.sfxVolume : 0, now, 0.04);
    }
    if (this.musicMasterGain) {
      this.musicMasterGain.gain.setTargetAtTime(
        this.enabled ? 0.16 * this.musicVolume : 0,
        now,
        0.12
      );
    }
  }

  init(): void {
    this.configureMobileAudioSession();
    if (this.ctx) {
      this.resumeIfNeeded();
      return;
    }
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.ctx.onstatechange = () => {
        if (this.ctx && this.ctx.state === 'running') {
          this.nextStepTime = Math.max(this.nextStepTime, this.ctx.currentTime + 0.04);
          this.applyWeatherAudioTargets();
          this.syncBusVolumes();
          this.scheduleLofiLookahead();
        }
      };
      this.startAmbientLayers();
      this.resumeIfNeeded();
    } catch {
      this.ctx = null;
    }
  }

  private startAmbientLayers(): void {
    if (!this.ctx || this.ambientStarted) return;
    this.ambientStarted = true;

    // Protective soft compressor + master gain so mobile phone speakers stay clear without clipping
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -16;
    this.masterCompressor.knee.value = 18;
    this.masterCompressor.ratio.value = 3.5;
    this.masterCompressor.attack.value = 0.008;
    this.masterCompressor.release.value = 0.22;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.getMasterOutputLevel();

    this.masterCompressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

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
    this.windGain.connect(this.masterCompressor);
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
    this.rainGain.connect(this.masterCompressor);

    const rainWarmFilter = this.ctx.createBiquadFilter();
    rainWarmFilter.type = 'bandpass';
    rainWarmFilter.frequency.value = 720;
    rainWarmFilter.Q.value = 0.8;

    this.rainWarmGain = this.ctx.createGain();
    this.rainWarmGain.gain.value = 0;

    rainSrc.connect(rainWarmFilter);
    rainWarmFilter.connect(this.rainWarmGain);
    this.rainWarmGain.connect(this.masterCompressor);
    rainSrc.start();

    // Soft Lofi Chill Music Master Bus (warm low-pass filtered Rhodes & brush texture)
    this.musicLowpass = this.ctx.createBiquadFilter();
    this.musicLowpass.type = 'lowpass';
    this.musicLowpass.frequency.value = 1600;
    this.musicLowpass.Q.value = 0.65;

    this.musicMasterGain = this.ctx.createGain();
    this.musicMasterGain.gain.value = this.enabled ? 0.16 * this.musicVolume : 0;

    this.musicLowpass.connect(this.musicMasterGain);
    this.musicMasterGain.connect(this.masterCompressor);

    // Master Sound Effects Bus (slightly softer by default: 0.72)
    this.sfxMasterGain = this.ctx.createGain();
    this.sfxMasterGain.gain.value = this.enabled ? this.sfxVolume : 0;
    this.sfxMasterGain.connect(this.masterCompressor);

    this.nextStepTime = this.ctx.currentTime + 0.08;
    if (this.schedulerId === null) {
      this.schedulerId = window.setInterval(() => this.scheduleLofiLookahead(), 110);
    }
    this.applyWeatherAudioTargets();
  }

  setLevel(levelId: LevelId): void {
    if (this.levelId === levelId) return;
    this.levelId = levelId;
    this.lofiStep = 0;
    if (this.ctx) {
      this.nextStepTime = Math.max(this.nextStepTime, this.ctx.currentTime + 0.06);
      this.applyWeatherAudioTargets();
    }
  }

  private scheduleLofiLookahead(): void {
    if (!this.ctx || !this.musicLowpass) return;
    if (this.ctx.state !== 'running') return;

    const theme = LEVEL_LOFI_THEMES[this.levelId];
    const stepDuration = 60 / theme.bpm / 2; // Eighth-note pulse for the current level's BPM
    // Recover gracefully if tab was backgrounded
    if (this.nextStepTime < this.ctx.currentTime - 0.5) {
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }

    while (this.nextStepTime < this.ctx.currentTime + 0.2) {
      this.scheduleLofiStep(this.nextStepTime, this.lofiStep, theme);
      this.nextStepTime += stepDuration;
      this.lofiStep = (this.lofiStep + 1) % 32;
    }
  }

  private scheduleRhodesVoice(
    time: number,
    freq: number,
    duration: number,
    peakGain: number,
    overtoneType: OscillatorType = 'triangle',
    overtoneRatio = 2,
    overtoneGain = 0.16
  ): void {
    if (!this.ctx || !this.musicLowpass) return;
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    // Gentle lofi tape warmth wobble
    osc.detune.setValueAtTime((Math.random() - 0.5) * 7, time);

    overtone.type = overtoneType;
    overtone.frequency.setValueAtTime(freq * overtoneRatio, time);

    const overGain = this.ctx.createGain();
    overGain.gain.setValueAtTime(overtoneGain, time);
    overGain.gain.exponentialRampToValueAtTime(0.018, time + Math.min(duration * 0.55, 0.9));

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

  private scheduleSoftKick(time: number, startHz = 98, endHz = 42): void {
    if (!this.ctx || !this.musicLowpass) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startHz, time);
    osc.frequency.exponentialRampToValueAtTime(endHz, time + 0.14);
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

  private scheduleLofiStep(time: number, step: number, theme: LofiLevelTheme): void {
    const bar = theme.progression[Math.floor(step / 8)];
    const stepInBar = step % 8;
    const w = this.weatherWeights;

    // 1. Warm strummed chord at the start of every bar
    if (stepInBar === 0) {
      bar.notes.forEach((freq, idx) => {
        this.scheduleRhodesVoice(
          time + idx * theme.strumDelay,
          freq,
          theme.chordDuration,
          idx === 0 ? 0.16 : 0.105,
          theme.overtoneType,
          theme.overtoneRatio,
          theme.overtoneGain
        );
      });
    }

    // 2. Realm-specific gentle lofi melody pattern
    if (theme.melodyPattern === 'classic') {
      if (stepInBar === 3) {
        this.scheduleRhodesVoice(time, bar.melodyA, 1.35, 0.075);
      } else if (stepInBar === 6) {
        this.scheduleRhodesVoice(time, bar.melodyB, 1.45, 0.07);
      }
    } else if (theme.melodyPattern === 'syncopated') {
      // Amber & Crystal Hollows: cozy lantern syncopation + deep crystal drop
      if (stepInBar === 2) {
        this.scheduleRhodesVoice(time, bar.melodyA, 1.25, 0.072, 'sine', 1.5, 0.16);
      } else if (stepInBar === 5) {
        this.scheduleRhodesVoice(time, bar.melodyB, 1.1, 0.065, 'sine', 1.5, 0.16);
        this.scheduleRhodesVoice(time + 0.08, bar.sparkle, 0.9, 0.036, 'sine', 2, 0.12);
      }
    } else if (theme.melodyPattern === 'arp') {
      // Frostbloom Skywoods: airy floating harp arpeggio notes
      if (stepInBar === 2 || stepInBar === 4 || stepInBar === 7) {
        const note =
          stepInBar === 2 ? bar.melodyB : stepInBar === 4 ? bar.melodyA : bar.sparkle;
        this.scheduleRhodesVoice(time, note, 1.3, 0.06, 'triangle', 2, 0.13);
      }
    } else {
      // Frozen Pine Peaks: delicate sparse winter celesta bells
      if (stepInBar === 1 || stepInBar === 3 || stepInBar === 6) {
        const note =
          stepInBar === 1 ? bar.sparkle : stepInBar === 3 ? bar.melodyA : bar.melodyB;
        this.scheduleRhodesVoice(time, note, 1.55, 0.056, 'sine', 3, 0.12);
      }
    }

    // Rain weather: soft raindrop fifths
    if (w.rain > 0.2 && (stepInBar === 2 || stepInBar === 5)) {
      this.scheduleRhodesVoice(time + 0.02, bar.sparkle * 1.5, 0.9, 0.032 * w.rain);
    }

    // Snow weather: delicate winter celesta bell sparkles
    if (w.snow > 0.2 && (stepInBar === 1 || stepInBar === 4 || stepInBar === 7)) {
      const bellFreq = stepInBar === 4 ? bar.sparkle * 2 : bar.melodyA * 2;
      this.scheduleRhodesVoice(time, bellFreq, 1.1, 0.024 * w.snow, 'sine', 2, 0.1);
    }

    // Underwater weather: soft bubbly kalimba plucks
    if (w.underwater > 0.2 && (stepInBar === 2 || stepInBar === 4 || stepInBar === 6)) {
      this.scheduleRhodesVoice(time, bar.notes[(stepInBar / 2) % bar.notes.length] * 2, 0.5, 0.065 * w.underwater);
    }

    // Starlight flurry weather: shimmering high 9th chord chimes
    if (w.flurry > 0.2 && (stepInBar === 1 || stepInBar === 5)) {
      this.scheduleRhodesVoice(time, bar.sparkle * 2, 1.25, 0.028 * w.flurry);
    }

    // 3. Soft realm-specific lofi groove (muted kick + subtle brush texture, softer underwater)
    const drumDamp = 1 - w.underwater * 0.5;
    if (drumDamp > 0.3 && theme.kickSteps.includes(stepInBar)) {
      this.scheduleSoftKick(time, theme.kickPitchStart, theme.kickPitchEnd);
    }
    if (theme.accentBrushSteps.includes(stepInBar)) {
      this.scheduleSoftBrush(time, true);
    } else if (theme.softBrushSteps.includes(stepInBar)) {
      this.scheduleSoftBrush(time, false);
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.saveSettings();
    if (on) {
      this.unlock();
    } else {
      this.iosSessionUnlocked = false;
      if (this.silentWavEl) {
        try {
          this.silentWavEl.pause();
        } catch {
          // Ignore pause errors
        }
      }
    }
    if (!this.ctx) return;
    if (this.sfxMasterGain) {
      this.sfxMasterGain.gain.setTargetAtTime(on ? this.sfxVolume : 0, this.ctx.currentTime, 0.06);
    }
    if (this.musicMasterGain) {
      this.musicMasterGain.gain.setTargetAtTime(
        on ? 0.16 * this.musicVolume : 0,
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
        this.enabled ? 0.16 * this.musicVolume : 0,
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
      // Base warmth filter per level, then blended with dynamic weather cutoffs
      const baseCutoff = LEVEL_LOFI_THEMES[this.levelId].baseCutoff;
      const targetCutoff =
        baseCutoff - w.underwater * 980 - w.rain * 380 - w.snow * 140 + w.flurry * 180;
      this.musicLowpass.frequency.setTargetAtTime(Math.max(460, targetCutoff), now, 0.5);
    }
  }

  playTone(freq: number, duration = 0.7, volume = 0.08, type: OscillatorType = 'sine'): void {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state !== 'running') this.resumeIfNeeded();
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
    if (this.ctx.state !== 'running') this.resumeIfNeeded();
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
    if (this.ctx.state !== 'running') this.resumeIfNeeded();
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
