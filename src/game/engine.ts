import { audioEngine } from './audio';
import { backdropCache } from './backgrounds';
import { renderForestScene } from './renderer';
import type {
  GamePhase,
  HudSnapshot,
  LevelId,
  Particle,
  PlayerState,
  PulseRing,
  SpiritLantern,
} from './types';
import { DynamicWeatherSystem } from './weather';
import {
  LEVEL_BIOMES,
  LEVEL_NAMES,
  SANCTUARY_X,
  WORLD_WIDTH,
  clamp,
  generateWorld,
  getBiomeBlend,
  getTerrainY,
  lerp,
  type WorldData,
} from './world';

export interface InputState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
}

export class ForestGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHudUpdate: (snapshot: HudSnapshot) => void;

  private levelId: LevelId = 1;
  private world: WorldData;
  private weather: DynamicWeatherSystem;
  private player: PlayerState;
  private particles: Particle[] = [];
  private pulses: PulseRing[] = [];

  private phase: GamePhase = 'TITLE_MENU';
  private time = 0;
  private elapsedSeconds = 0;
  private orbsCollected = 0;
  private blossomsCollected = 0;
  private crystalsCollected = 0;
  private starseedsCollected = 0;
  private sanctuaryAwakened = false;

  private cameraX = 0;
  private cameraY = 0;
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private hitstopTimer = 0;

  private viewW = 1280;
  private viewH = 720;
  private worldScale = 1;
  private dpr = 1;
  private rafId: number | null = null;
  private lastFrameMs = 0;
  private hudSyncTimer = 0;

  public input: InputState = {
    left: false,
    right: false,
    jumpHeld: false,
  };

  constructor(canvas: HTMLCanvasElement, onHudUpdate: (snapshot: HudSnapshot) => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not acquire 2D canvas context');
    this.ctx = context;
    this.onHudUpdate = onHudUpdate;

    backdropCache.preloadAll();
    this.world = generateWorld(this.levelId);
    this.weather = new DynamicWeatherSystem();
    this.player = this.createInitialPlayer(this.levelId);

    this.resize();
    this.cameraX = 0;
    this.cameraY = this.player.y - (this.viewH / this.worldScale) * 0.65;
    this.emitHudSnapshot();
  }

  private createInitialPlayer(levelId: LevelId): PlayerState {
    const startX = 130;
    const startY = getTerrainY(startX, levelId);
    return {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: true,
      coyoteTime: 0.12,
      jumpBuffer: 0,
      jumpsLeft: 2,
      gliding: false,
      pulseCooldown: 0,
      crystalBoostTimer: 0,
      extraAirJumpTimer: 0,
      invulnTimer: 0,
      petals: 3,
      maxPetals: 3,
      checkpointX: startX,
      checkpointY: startY,
      scarf: Array.from({ length: 10 }, () => ({ x: startX, y: startY - 24 })),
      runPhase: 0,
      squash: 1,
    };
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastFrameMs = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastFrameMs) / 1000;
      this.lastFrameMs = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      this.update(dt);
      this.render();
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  destroy(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resize(): void {
    this.viewW = Math.max(1, window.innerWidth || 1280);
    this.viewH = Math.max(1, window.innerHeight || 720);
    this.worldScale = this.viewH < 640 ? clamp(this.viewH / 640, 0.54, 1) : 1;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.viewW * this.dpr);
    this.canvas.height = Math.floor(this.viewH * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.weather.resize(this.viewW, this.viewH);
  }

  clearHeldInputs(): void {
    this.input.left = false;
    this.input.right = false;
    this.input.jumpHeld = false;
  }

  selectLevel(levelId: LevelId): void {
    this.levelId = levelId;
    this.resetWorldState(levelId);
    this.emitHudSnapshot();
  }

  startNewGame(levelId?: LevelId): void {
    audioEngine.init();
    const targetLevel = levelId ?? this.levelId;
    this.levelId = targetLevel;
    this.resetWorldState(targetLevel);
    this.phase = 'PLAYING';
    this.emitHudSnapshot();
  }

  startNextLevel(): void {
    const next: LevelId = this.levelId === 1 ? 2 : this.levelId === 2 ? 3 : 1;
    this.startNewGame(next);
  }

  resumeGame(): void {
    if (this.phase === 'PAUSED') {
      audioEngine.init();
      this.phase = 'PLAYING';
      this.emitHudSnapshot();
    }
  }

  pauseGame(): void {
    if (this.phase === 'PLAYING') {
      this.clearHeldInputs();
      this.phase = 'PAUSED';
      this.emitHudSnapshot();
    }
  }

  togglePause(): void {
    if (this.phase === 'PLAYING') this.pauseGame();
    else if (this.phase === 'PAUSED') this.resumeGame();
  }

  respawnAtLantern(): void {
    audioEngine.init();
    this.player.x = this.player.checkpointX;
    this.player.y = this.player.checkpointY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.petals = this.player.maxPetals;
    this.player.invulnTimer = 1.5;
    this.player.scarf.forEach((n) => {
      n.x = this.player.x;
      n.y = this.player.y - 24;
    });
    this.phase = 'PLAYING';
    this.spawnDust(this.player.x, this.player.y - 20, '#85ffea', 20);
    this.emitHudSnapshot();
  }

  private resetWorldState(levelId: LevelId): void {
    this.world = generateWorld(levelId);
    this.player = this.createInitialPlayer(levelId);
    this.particles = [];
    this.pulses = [];
    this.orbsCollected = 0;
    this.blossomsCollected = 0;
    this.crystalsCollected = 0;
    this.starseedsCollected = 0;
    this.elapsedSeconds = 0;
    this.sanctuaryAwakened = false;
    this.hitstopTimer = 0;
    this.shakeTimer = 0;
    this.cameraX = 0;
    this.cameraY = this.player.y - (this.viewH / this.worldScale) * 0.65;
  }

  triggerJump(): void {
    if (this.phase !== 'PLAYING') return;
    audioEngine.init();
    this.input.jumpHeld = true;
    this.player.jumpBuffer = 0.13;
  }

  releaseJump(): void {
    this.input.jumpHeld = false;
  }

  triggerPulse(): void {
    if (this.phase !== 'PLAYING' || this.player.pulseCooldown > 0) return;
    audioEngine.init();
    const boosted = this.player.crystalBoostTimer > 0;
    const pulseMaxR = boosted ? 380 : 265;
    this.player.pulseCooldown = boosted ? 0.35 : 0.55;
    audioEngine.playPulse();

    this.pulses.push({
      x: this.player.x,
      y: this.player.y - 22,
      r: 10,
      maxR: pulseMaxR,
      alpha: 1,
    });

    for (let i = 0; i < 22; i++) {
      const ang = (Math.PI * 2 * i) / 22 + Math.random() * 0.2;
      const spd = 70 + Math.random() * 140;
      this.particles.push({
        x: this.player.x,
        y: this.player.y - 22,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        r: 2 + Math.random() * 2.5,
        life: 0.9 + Math.random() * 0.5,
        maxLife: 1.4,
        color: boosted || i % 2 === 1 ? '#ffe399' : '#85ffea',
      });
    }

    for (const l of this.world.lanterns) {
      if (Math.hypot(l.x - this.player.x, l.y - 28 - (this.player.y - 22)) < pulseMaxR) {
        this.awakenLantern(l);
      }
    }
    for (const p of this.world.platforms) {
      if (
        p.type === 'spirit' &&
        Math.hypot(p.x + p.w * 0.5 - this.player.x, p.y - this.player.y) < pulseMaxR + 40
      ) {
        p.glow = 1;
      }
    }
    for (const a of this.world.stoneArches) {
      if (Math.abs(a.x - this.player.x) < pulseMaxR) a.glow = 1;
    }
    for (const w of this.world.thornWisps) {
      if (Math.hypot(w.x - this.player.x, w.y - (this.player.y - 22)) < pulseMaxR) {
        w.stunnedTimer = boosted ? 6.5 : 4.5;
        this.spawnDust(w.x, w.y, '#9ef7ff', 10);
      }
    }
  }

  private awakenLantern(l: SpiritLantern): void {
    if (!l.lit) {
      l.lit = true;
      audioEngine.playLantern();
      this.player.checkpointX = l.x;
      this.player.checkpointY = l.y;
      this.player.petals = this.player.maxPetals;
      for (let i = 0; i < 24; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 30 + Math.random() * 110;
        this.particles.push({
          x: l.x,
          y: l.y - 42,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 45,
          r: 1.8 + Math.random() * 2.6,
          life: 1.1 + Math.random() * 0.6,
          maxLife: 1.7,
          color: i % 2 === 0 ? '#ffd884' : '#79ffe8',
        });
      }
      this.emitHudSnapshot();
    }
  }

  private triggerShake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  private update(dt: number): void {
    if (this.phase === 'PAUSED') return;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      return;
    }

    this.time += dt;
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    }

    const virtualW = this.viewW / this.worldScale;
    const virtualH = this.viewH / this.worldScale;
    const blend = getBiomeBlend(this.cameraX + virtualW * 0.5, this.levelId);
    audioEngine.updateRainIntensity(blend.weights.rain);

    for (const s of this.world.floatingSpores) {
      s.x += (s.vx + Math.sin(this.time * 0.7 + s.phase) * 10) * dt;
      s.y += s.vy * dt;
      if (s.y < -20) {
        s.y = this.viewH + 20;
        s.x = Math.random() * this.viewW;
      }
      if (s.x < -20) s.x = this.viewW + 20;
      if (s.x > this.viewW + 20) s.x = -20;
    }

    this.weather.update(
      dt,
      this.time,
      this.cameraX,
      this.cameraY,
      blend,
      this.levelId,
      this.worldScale
    );

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pu = this.pulses[i];
      pu.r += 420 * dt;
      pu.alpha = clamp(1 - pu.r / pu.maxR, 0, 1);
      if (pu.r >= pu.maxR) this.pulses.splice(i, 1);
    }

    if (this.phase === 'TITLE_MENU') {
      this.cameraX = 320 + Math.sin(this.time * 0.11) * 280;
      this.cameraY =
        getTerrainY(this.cameraX + virtualW * 0.4, this.levelId) - virtualH * 0.67;
      return;
    }

    if (this.phase !== 'PLAYING') return;

    this.elapsedSeconds += dt;
    const p = this.player;

    p.pulseCooldown = Math.max(0, p.pulseCooldown - dt);
    p.crystalBoostTimer = Math.max(0, p.crystalBoostTimer - dt);
    p.extraAirJumpTimer = Math.max(0, p.extraAirJumpTimer - dt);
    p.coyoteTime = Math.max(0, p.coyoteTime - dt);
    p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.squash = lerp(p.squash, 1, Math.min(1, dt * 12));

    // Update drifting skywood / cloud moving platforms
    for (const mp of this.world.movingPlatforms) {
      mp.prevX = mp.x;
      mp.prevY = mp.y;
      mp.x = mp.baseX + Math.sin(this.time * mp.speed + mp.phase) * mp.dx;
      mp.y = mp.baseY + Math.cos(this.time * mp.speed + mp.phase) * mp.dy;
    }

    const moveDir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const maxSpeed = p.crystalBoostTimer > 0 ? 345 : 300;
    const accel = p.onGround ? 1950 : 1280;
    const decel = p.onGround ? 1800 : 540;

    if (moveDir !== 0) {
      p.vx += moveDir * accel * dt;
      p.vx = clamp(p.vx, -maxSpeed, maxSpeed);
      p.facing = moveDir;
      if (p.onGround) p.runPhase += dt * 11;
    } else if (Math.abs(p.vx) <= decel * dt) {
      p.vx = 0;
    } else {
      p.vx -= Math.sign(p.vx) * decel * dt;
    }

    if (p.jumpBuffer > 0) {
      if (p.coyoteTime > 0) {
        p.vy = -515;
        p.onGround = false;
        p.coyoteTime = 0;
        p.jumpBuffer = 0;
        p.jumpsLeft = p.extraAirJumpTimer > 0 ? 2 : 1;
        p.squash = 1.24;
        audioEngine.playJump(false);
        this.spawnDust(p.x, p.y, '#88f7df', 7);
      } else if (p.jumpsLeft > 0) {
        p.vy = -465;
        p.jumpsLeft--;
        p.jumpBuffer = 0;
        p.squash = 1.2;
        audioEngine.playJump(true);
        this.spawnDust(
          p.x,
          p.y - 6,
          p.extraAirJumpTimer > 0 ? '#c7b8ff' : '#ffe49e',
          10
        );
      }
    }

    let inWind = false;
    for (const w of this.world.windStreams) {
      if (Math.abs(p.x - w.x) < w.w * 0.55 && p.y > w.yTop && p.y < w.yBot) {
        inWind = true;
        break;
      }
    }

    p.gliding = !p.onGround && this.input.jumpHeld && (p.vy > 20 || inWind);

    if (inWind && (p.gliding || this.input.jumpHeld)) {
      p.vy = lerp(p.vy, -245, dt * 5.2);
      if (Math.random() < 0.35) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 26,
          y: p.y - 10,
          vx: (Math.random() - 0.5) * 20,
          vy: -90 - Math.random() * 60,
          r: 1.5 + Math.random() * 1.5,
          life: 0.6,
          maxLife: 0.6,
          color: '#a7fff0',
        });
      }
    } else {
      const gravity = p.gliding ? 260 : 1220;
      p.vy += gravity * dt;
      if (p.gliding && p.vy > 105) p.vy = 105;
      else if (p.vy > 780) p.vy = 780;
    }

    const prevY = p.y;
    p.x = clamp(p.x + p.vx * dt, 30, WORLD_WIDTH - 40);
    p.y += p.vy * dt;

    let landedThisFrame = false;

    if (p.vy >= 0) {
      for (const plat of this.world.platforms) {
        if (
          p.x >= plat.x - 10 &&
          p.x <= plat.x + plat.w + 10 &&
          prevY <= plat.y + 10 &&
          p.y >= plat.y
        ) {
          p.y = plat.y;
          p.vy = 0;
          landedThisFrame = true;
          if (plat.type === 'spirit') plat.glow = Math.max(plat.glow, 0.85);
          break;
        }
      }

      if (!landedThisFrame) {
        for (const mp of this.world.movingPlatforms) {
          if (
            p.x >= mp.x - 10 &&
            p.x <= mp.x + mp.w + 10 &&
            prevY <= mp.prevY + 12 &&
            p.y >= mp.y - 2
          ) {
            p.x = clamp(p.x + (mp.x - mp.prevX), 30, WORLD_WIDTH - 40);
            p.y = mp.y;
            p.vy = 0;
            landedThisFrame = true;
            break;
          }
        }
      }
    }

    // Aerial Spirit Ring Boosters
    for (const ring of this.world.skyRings) {
      if (ring.cooldown > 0) {
        ring.cooldown = Math.max(0, ring.cooldown - dt);
      } else if (Math.hypot(p.x - ring.x, p.y - 20 - ring.y) < ring.r + 14) {
        ring.cooldown = 0.85;
        p.vy = -565;
        p.vx = p.facing * 395;
        p.onGround = false;
        p.jumpsLeft = p.extraAirJumpTimer > 0 ? 2 : 1;
        p.squash = 1.28;
        this.hitstopTimer = 0.025;
        this.triggerShake(4, 0.16);
        audioEngine.playSkyRing();
        this.spawnDust(ring.x, ring.y, '#9ef4ff', 18);
      }
    }

    for (const m of this.world.mushrooms) {
      m.bounce = Math.max(0, m.bounce - dt * 3.8);
      const capY = m.y - m.h;
      if (
        p.vy >= 0 &&
        Math.abs(p.x - m.x) < m.r + 12 &&
        prevY <= capY + 16 &&
        p.y >= capY - 2
      ) {
        p.y = capY;
        p.vy = this.input.jumpHeld ? -710 : -610;
        p.onGround = false;
        p.jumpsLeft = p.extraAirJumpTimer > 0 ? 2 : 1;
        p.squash = 1.32;
        m.bounce = 1;
        this.hitstopTimer = 0.032;
        this.triggerShake(3.5, 0.14);
        audioEngine.playBounce();
        this.spawnDust(m.x, capY, m.hue, 14);
      }
    }

    const groundY = getTerrainY(p.x, this.levelId);
    if (p.y >= groundY) {
      p.y = groundY;
      p.vy = 0;
      landedThisFrame = true;
    }

    if (landedThisFrame) {
      if (!p.onGround) {
        p.squash = 0.78;
        this.spawnDust(p.x, p.y, '#7debd3', 5);
      }
      p.onGround = true;
      p.coyoteTime = 0.12;
      p.jumpsLeft = p.extraAirJumpTimer > 0 ? 3 : 2;
    } else {
      p.onGround = false;
    }

    p.scarf[0].x = p.x - p.facing * 4;
    p.scarf[0].y = p.y - 25 * p.squash;
    for (let i = 1; i < p.scarf.length; i++) {
      const prev = p.scarf[i - 1];
      const cur = p.scarf[i];
      cur.x -= p.facing * 18 * dt;
      cur.y += Math.sin(this.time * 7 + i * 0.7) * 16 * dt + 8 * dt;
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const segLen = 5.2;
      if (dist > segLen) {
        cur.x = prev.x + (dx / dist) * segLen;
        cur.y = prev.y + (dy / dist) * segLen;
      }
    }

    if ((Math.abs(p.vx) > 90 || p.crystalBoostTimer > 0) && Math.random() < 0.3) {
      this.particles.push({
        x: p.x + (Math.random() - 0.5) * 10,
        y: p.y - 6 - Math.random() * 14,
        vx: -p.vx * 0.15,
        vy: -15 - Math.random() * 20,
        r: 1.3 + Math.random() * 1.4,
        life: 0.45,
        maxLife: 0.45,
        color: p.crystalBoostTimer > 0 ? '#ffe18c' : '#7cfce7',
      });
    }

    for (const g of this.world.grassTufts) {
      const dist = Math.abs(g.x - p.x);
      if (dist < 28 && Math.abs(g.y - p.y) < 35) {
        const push = (p.vx !== 0 ? Math.sign(p.vx) : p.facing) * 0.9;
        g.bendVel += push * 28 * dt;
      }
      const windTarget = Math.sin(this.time * 2.1 + g.x * 0.025) * 0.22;
      g.bendVel += (windTarget - g.bend) * 38 * dt;
      g.bendVel *= Math.pow(0.08, dt);
      g.bend += g.bendVel * dt;
    }

    for (const bf of this.world.butterflies) {
      const d = Math.hypot(bf.x - p.x, bf.y - (p.y - 20));
      if (d < 80) {
        bf.vx += Math.sign(bf.x - p.x || 1) * 90 * dt;
        bf.vy -= 55 * dt;
      } else {
        bf.vx += (bf.homeX + Math.sin(this.time * 1.2 + bf.phase) * 28 - bf.x) * 1.8 * dt;
        bf.vy += (bf.homeY + Math.cos(this.time * 1.6 + bf.phase) * 14 - bf.y) * 1.8 * dt;
      }
      bf.vx *= 0.95;
      bf.vy *= 0.95;
      bf.x += bf.vx * dt;
      bf.y += bf.vy * dt;
    }

    for (const w of this.world.thornWisps) {
      if (w.stunnedTimer > 0) {
        w.stunnedTimer = Math.max(0, w.stunnedTimer - dt);
        continue;
      }
      w.x = w.baseX + Math.sin(this.time * w.speed + w.phase) * w.patrolRange;
      w.y = w.baseY + Math.cos(this.time * 2.1 + w.phase) * 14;

      const distToPlayer = Math.hypot(w.x - p.x, w.y - (p.y - 20));
      if (distToPlayer < 140) {
        w.telegraphTimer = Math.min(1, w.telegraphTimer + dt * 2.2);
      } else {
        w.telegraphTimer = Math.max(0, w.telegraphTimer - dt * 1.5);
      }

      if (distToPlayer < 26 && p.invulnTimer <= 0) {
        p.petals = Math.max(0, p.petals - 1);
        p.invulnTimer = 1.4;
        p.vx = Math.sign(p.x - w.x || -1) * 260;
        p.vy = -310;
        p.onGround = false;
        this.hitstopTimer = 0.055;
        this.triggerShake(7.5, 0.25);
        audioEngine.playHit();
        this.spawnDust(p.x, p.y - 20, '#ff73a3', 16);
        this.emitHudSnapshot();

        if (p.petals <= 0) {
          this.clearHeldInputs();
          this.phase = 'GAME_OVER';
          this.emitHudSnapshot();
          return;
        }
      }
    }

    // Collect Lumina Orbs, Sun Blossoms, Prism Crystals & Astral Star Seeds
    for (const item of this.world.collectibles) {
      if (item.collected) continue;
      item.y = item.baseY + Math.sin(this.time * 2.8 + item.phase) * 7;
      if (Math.hypot(item.x - p.x, item.y - (p.y - 20)) < 34) {
        item.collected = true;
        if (item.kind === 'orb') {
          this.orbsCollected++;
          audioEngine.playChime(this.orbsCollected % 4);
          this.spawnDust(item.x, item.y, '#9effef', 16);
        } else if (item.kind === 'blossom') {
          this.blossomsCollected++;
          if (p.petals < p.maxPetals) p.petals++;
          audioEngine.playBlossom();
          this.spawnDust(item.x, item.y, '#ffd87a', 22);
        } else if (item.kind === 'crystal') {
          this.crystalsCollected++;
          p.crystalBoostTimer = 6.5;
          audioEngine.playCrystal();
          this.spawnDust(item.x, item.y, '#cfa6ff', 24);
        } else {
          this.starseedsCollected++;
          p.extraAirJumpTimer = 10;
          p.jumpsLeft = Math.max(p.jumpsLeft, 2);
          audioEngine.playStarSeed();
          this.spawnDust(item.x, item.y, '#d4f4ff', 26);
        }
        this.emitHudSnapshot();
      }
    }

    for (const l of this.world.lanterns) {
      if (l.lit) {
        l.glow = lerp(l.glow, 1, dt * 3);
      } else if (Math.hypot(l.x - p.x, l.y - 28 - (p.y - 20)) < 48) {
        this.awakenLantern(l);
      }
    }

    for (const plat of this.world.platforms) {
      if (plat.type === 'spirit') plat.glow = Math.max(0.32, plat.glow - dt * 0.08);
    }
    for (const a of this.world.stoneArches) {
      a.glow = Math.max(0.25, a.glow - dt * 0.12);
    }

    if (!this.sanctuaryAwakened && Math.abs(p.x - SANCTUARY_X) < 88) {
      this.sanctuaryAwakened = true;
      audioEngine.playLantern();
      window.setTimeout(() => audioEngine.playPulse(), 320);
      this.spawnDust(SANCTUARY_X, getTerrainY(SANCTUARY_X, this.levelId) - 90, '#ffe696', 45);
      this.triggerShake(4, 0.3);
      window.setTimeout(() => {
        if (this.phase === 'PLAYING') {
          this.clearHeldInputs();
          this.phase = 'VICTORY';
          this.emitHudSnapshot();
        }
      }, 1500);
    }

    const targetCamX = clamp(
      p.x - virtualW * 0.38 + p.vx * 0.25,
      0,
      Math.max(0, WORLD_WIDTH - virtualW)
    );
    const targetCamY = p.y - virtualH * 0.68;
    this.cameraX = lerp(this.cameraX, targetCamX, Math.min(1, dt * 5.2));
    this.cameraY = lerp(this.cameraY, targetCamY, Math.min(1, dt * 4.5));

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.12) {
      this.hudSyncTimer = 0;
      this.emitHudSnapshot();
    }
  }

  private render(): void {
    const shakeMag = this.shakeTimer > 0 ? this.shakeIntensity * (this.shakeTimer / 0.25) : 0;
    const shakeX = shakeMag > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;
    const shakeY = shakeMag > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;

    renderForestScene(this.ctx, {
      world: this.world,
      player: this.player,
      particles: this.particles,
      pulses: this.pulses,
      weather: this.weather,
      cameraX: this.cameraX,
      cameraY: this.cameraY,
      shakeX,
      shakeY,
      viewW: this.viewW,
      viewH: this.viewH,
      worldScale: this.worldScale,
      time: this.time,
      sanctuaryAwakened: this.sanctuaryAwakened,
    });
  }

  private spawnDust(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * 95;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        r: 1.5 + Math.random() * 2.5,
        life: 0.55 + Math.random() * 0.45,
        maxLife: 1.0,
        color,
      });
    }
  }

  private emitHudSnapshot(): void {
    const blend = getBiomeBlend(this.player.x, this.levelId);
    const biome = LEVEL_BIOMES[this.levelId][blend.mainIndex];
    const lanternsLit = this.world.lanterns.filter((l) => l.lit).length;
    const orbsTotal = this.world.collectibles.filter((c) => c.kind === 'orb').length;
    const blossomsTotal = this.world.collectibles.filter((c) => c.kind === 'blossom').length;
    const crystalsTotal = this.world.collectibles.filter((c) => c.kind === 'crystal').length;
    const starseedsTotal = this.world.collectibles.filter((c) => c.kind === 'starseed').length;
    const progressPct = clamp(
      Math.round(((this.player.x - 130) / (SANCTUARY_X - 130)) * 100),
      0,
      100
    );

    this.onHudUpdate({
      phase: this.phase,
      levelId: this.levelId,
      levelName: LEVEL_NAMES[this.levelId],
      orbsCollected: this.orbsCollected,
      orbsTotal,
      blossomsCollected: this.blossomsCollected,
      blossomsTotal,
      crystalsCollected: this.crystalsCollected,
      crystalsTotal,
      starseedsCollected: this.starseedsCollected,
      starseedsTotal,
      lanternsLit,
      lanternsTotal: this.world.lanterns.length,
      petals: this.player.petals,
      maxPetals: this.player.maxPetals,
      biomeName: biome.name,
      weatherLabel: biome.weatherLabel,
      elapsedSeconds: Math.floor(this.elapsedSeconds),
      progressPct,
      crystalBoostActive: this.player.crystalBoostTimer > 0,
      tripleJumpActive: this.player.extraAirJumpTimer > 0,
    });
  }
}
