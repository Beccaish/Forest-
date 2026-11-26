import { audioEngine } from './audio';
import { backdropCache } from './backgrounds';
import { renderForestScene } from './renderer';
import { getSavedGameSummary, loadGameState, saveGameState } from './save';
import {
  SHOP_ITEMS,
  cloneProgress,
  loadShopProgress,
  saveShopProgress,
  type SavedShopProgress,
  type ShopItemId,
} from './shop';
import type {
  FloatingPopup,
  GamePhase,
  HudSnapshot,
  LevelId,
  MagicalCreature,
  Particle,
  PlayerState,
  PulseRing,
  SickAnimal,
  SpiritLantern,
  TrashItem,
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
  private floatingPopups: FloatingPopup[] = [];

  private phase: GamePhase = 'TITLE_MENU';
  private time = 0;
  private elapsedSeconds = 0;
  private orbsCollected = 0;
  private blossomsCollected = 0;
  private crystalsCollected = 0;
  private starseedsCollected = 0;
  private sanctuaryAwakened = false;
  private shopProgress: SavedShopProgress = loadShopProgress();

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
  private phoenixRegenTimer = 0;
  private shieldCooldown = 0;
  private onIcePlatform = false;
  private onSnowGround = false;

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

    backdropCache.preloadLevel(this.levelId);
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
    const hasHeart = this.shopProgress?.equipped.charm === 'sanctuary_heart';
    const maxPetals = hasHeart ? 4 : 3;
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
      highJumpCharges: 0,
      flyingFlowers: 0,
      flyingTimer: 0,
      invulnTimer: 0,
      wardShieldTimer: 0,
      glitterBurstTimer: 0,
      petals: maxPetals,
      maxPetals,
      checkpointX: startX,
      checkpointY: startY,
      scarf: Array.from({ length: 10 }, () => ({ x: startX, y: startY - 24 })),
      runPhase: 0,
      squash: 1,
    };
  }

  getShopProgress(): SavedShopProgress {
    return cloneProgress(this.shopProgress);
  }

  buyShopItem(itemId: ShopItemId): SavedShopProgress {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return this.getShopProgress();
    if (this.shopProgress.ownedIds.includes(itemId)) {
      return this.toggleEquipShopItem(itemId);
    }
    if (this.shopProgress.dewdrops < item.price) {
      return this.getShopProgress();
    }

    audioEngine.init();
    audioEngine.playPurchase();
    this.shopProgress.dewdrops -= item.price;
    this.shopProgress.ownedIds.push(itemId);
    this.shopProgress.equipped[item.category] = itemId;
    this.syncEquippedPlayerPerks();
    saveShopProgress(this.shopProgress);
    this.emitHudSnapshot();
    return this.getShopProgress();
  }

  toggleEquipShopItem(itemId: ShopItemId): SavedShopProgress {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item || !this.shopProgress.ownedIds.includes(itemId)) {
      return this.getShopProgress();
    }

    audioEngine.init();
    audioEngine.playEquip();
    const currentlyEquipped = this.shopProgress.equipped[item.category] === itemId;
    this.shopProgress.equipped[item.category] = currentlyEquipped ? null : itemId;
    this.syncEquippedPlayerPerks();
    saveShopProgress(this.shopProgress);
    this.emitHudSnapshot();
    return this.getShopProgress();
  }

  private syncEquippedPlayerPerks(): void {
    const targetMax = this.shopProgress.equipped.charm === 'sanctuary_heart' ? 4 : 3;
    const prevMax = this.player.maxPetals;
    this.player.maxPetals = targetMax;
    if (targetMax > prevMax) {
      this.player.petals = Math.min(targetMax, this.player.petals + (targetMax - prevMax));
    } else if (this.player.petals > targetMax) {
      this.player.petals = targetMax;
    }
  }

  private earnDewdrops(amount: number): void {
    let mult = 1;
    if (this.shopProgress.equipped.charm === 'mini_owl') mult += 0.4;
    if (this.shopProgress.equipped.power === 'super_fairy_sparkle') mult += 0.5;
    const total = Math.round(amount * mult);
    this.shopProgress.dewdrops += total;
    saveShopProgress(this.shopProgress);
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
    const next: LevelId =
      this.levelId === 1 ? 2 : this.levelId === 2 ? 3 : this.levelId === 3 ? 4 : 1;
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

  goHome(): void {
    this.clearHeldInputs();
    this.phase = 'TITLE_MENU';
    this.emitHudSnapshot();
  }

  saveGame(): boolean {
    if (this.phase !== 'PLAYING' && this.phase !== 'PAUSED') return false;
    audioEngine.init();
    const collectedIndices: number[] = [];
    this.world.collectibles.forEach((c, idx) => {
      if (c.collected) collectedIndices.push(idx);
    });
    const litLanternIndices: number[] = [];
    this.world.lanterns.forEach((l, idx) => {
      if (l.lit) litLanternIndices.push(idx);
    });
    const blessedCreatureIds = this.world.creatures.filter((c) => c.blessed).map((c) => c.id);
    const pacifiedBaddieIds = this.world.baddies.filter((b) => b.pacifiedOnce).map((b) => b.id);
    const helpedAnimalIds = this.world.sickAnimals.filter((a) => a.helped).map((a) => a.id);
    const collectedTrashIds = this.world.trashItems.filter((t) => t.collected).map((t) => t.id);

    const ok = saveGameState({
      version: 1,
      savedAt: Date.now(),
      levelId: this.levelId,
      playerX: this.player.x,
      playerY: this.player.y,
      checkpointX: this.player.checkpointX,
      checkpointY: this.player.checkpointY,
      petals: this.player.petals,
      highJumpCharges: this.player.highJumpCharges,
      flyingFlowers: this.player.flyingFlowers,
      elapsedSeconds: this.elapsedSeconds,
      orbsCollected: this.orbsCollected,
      blossomsCollected: this.blossomsCollected,
      crystalsCollected: this.crystalsCollected,
      starseedsCollected: this.starseedsCollected,
      collectedIndices,
      litLanternIndices,
      blessedCreatureIds,
      pacifiedBaddieIds,
      helpedAnimalIds,
      collectedTrashIds,
    });
    saveShopProgress(this.shopProgress);
    if (ok) {
      audioEngine.playChime(2);
      this.spawnDust(this.player.x, this.player.y - 24, '#8cf8e8', 16);
    }
    this.emitHudSnapshot();
    return ok;
  }

  loadSavedGame(): boolean {
    const saved = loadGameState();
    if (!saved) return false;
    audioEngine.init();
    this.levelId = saved.levelId;
    this.resetWorldState(saved.levelId);

    const collectedSet = new Set(saved.collectedIndices);
    this.world.collectibles.forEach((item, idx) => {
      if (collectedSet.has(idx)) item.collected = true;
    });

    const litSet = new Set(saved.litLanternIndices);
    this.world.lanterns.forEach((l, idx) => {
      if (litSet.has(idx)) {
        l.lit = true;
        l.glow = 1;
      }
    });

    const blessedSet = new Set(saved.blessedCreatureIds);
    for (const c of this.world.creatures) {
      if (blessedSet.has(c.id)) {
        c.blessed = true;
      }
    }

    const pacifiedSet = new Set(saved.pacifiedBaddieIds);
    for (const b of this.world.baddies) {
      if (pacifiedSet.has(b.id)) {
        b.pacifiedOnce = true;
      }
    }

    const helpedSet = new Set(saved.helpedAnimalIds ?? []);
    for (const a of this.world.sickAnimals) {
      if (helpedSet.has(a.id)) {
        a.helped = true;
      }
    }

    const trashSet = new Set(saved.collectedTrashIds ?? []);
    for (const t of this.world.trashItems) {
      if (trashSet.has(t.id)) {
        t.collected = true;
      }
    }

    this.player.x = saved.playerX;
    this.player.y = saved.playerY;
    this.player.checkpointX = saved.checkpointX;
    this.player.checkpointY = saved.checkpointY;
    this.player.petals = clamp(saved.petals, 1, this.player.maxPetals);
    this.player.highJumpCharges = saved.highJumpCharges;
    this.player.flyingFlowers = saved.flyingFlowers;
    this.player.scarf.forEach((n) => {
      n.x = this.player.x;
      n.y = this.player.y - 24;
    });

    this.elapsedSeconds = saved.elapsedSeconds;
    this.orbsCollected = saved.orbsCollected;
    this.blossomsCollected = saved.blossomsCollected;
    this.crystalsCollected = saved.crystalsCollected;
    this.starseedsCollected = saved.starseedsCollected;

    const virtualW = this.viewW / this.worldScale;
    const virtualH = this.viewH / this.worldScale;
    this.cameraX = clamp(this.player.x - virtualW * 0.38, 0, Math.max(0, 11400 - virtualW));
    this.cameraY = this.player.y - virtualH * 0.68;

    this.phase = 'PLAYING';
    audioEngine.playChime(3);
    this.emitHudSnapshot();
    return true;
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
    backdropCache.preloadLevel(levelId);
    this.world = generateWorld(levelId);
    this.player = this.createInitialPlayer(levelId);
    this.particles = [];
    this.pulses = [];
    this.floatingPopups = [];
    this.orbsCollected = 0;
    this.blossomsCollected = 0;
    this.crystalsCollected = 0;
    this.starseedsCollected = 0;
    this.elapsedSeconds = 0;
    this.sanctuaryAwakened = false;
    this.hitstopTimer = 0;
    this.shakeTimer = 0;
    this.onIcePlatform = false;
    this.onSnowGround = false;
    this.cameraX = 0;
    this.cameraY = this.player.y - (this.viewH / this.worldScale) * 0.65;
  }

  private screenToWorld(clientX: number, clientY: number): { wx: number; wy: number } {
    const rect = this.canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      wx: sx / this.worldScale + this.cameraX,
      wy: sy / this.worldScale + this.cameraY,
    };
  }

  private findClickableAnimalAt(wx: number, wy: number): SickAnimal | null {
    const virtualW = this.viewW / this.worldScale;
    let best: SickAnimal | null = null;
    let bestDist = Infinity;
    for (const a of this.world.sickAnimals) {
      if (a.helped) continue;
      if (a.x < this.cameraX - 60 || a.x > this.cameraX + virtualW + 60) continue;
      // Cover both the animal sprite and the floating "Click to Help" tag right above it
      const dx = Math.abs(wx - a.x);
      const dy = wy - (a.y - 26);
      const dist = Math.hypot(dx, dy);
      if (dist <= 56 && dist < bestDist) {
        bestDist = dist;
        best = a;
      }
    }
    return best;
  }

  private findClickableTrashAt(wx: number, wy: number): TrashItem | null {
    const virtualW = this.viewW / this.worldScale;
    let best: TrashItem | null = null;
    let bestDist = Infinity;
    for (const t of this.world.trashItems) {
      if (t.collected) continue;
      if (t.x < this.cameraX - 50 || t.x > this.cameraX + virtualW + 50) continue;
      const dist = Math.hypot(wx - t.x, wy - (t.y - 12));
      if (dist <= 42 && dist < bestDist) {
        bestDist = dist;
        best = t;
      }
    }
    return best;
  }

  isInteractivePointAt(clientX: number, clientY: number): boolean {
    if (this.phase !== 'PLAYING') return false;
    const { wx, wy } = this.screenToWorld(clientX, clientY);
    return Boolean(this.findClickableAnimalAt(wx, wy) || this.findClickableTrashAt(wx, wy));
  }

  handleCanvasPointerDown(clientX: number, clientY: number): boolean {
    if (this.phase !== 'PLAYING') return false;
    const { wx, wy } = this.screenToWorld(clientX, clientY);
    const animal = this.findClickableAnimalAt(wx, wy);
    if (animal) {
      audioEngine.init();
      this.helpSickAnimal(animal);
      return true;
    }
    const trash = this.findClickableTrashAt(wx, wy);
    if (trash) {
      audioEngine.init();
      this.collectTrashItem(trash);
      return true;
    }
    return false;
  }

  private helpSickAnimal(animal: SickAnimal): void {
    if (animal.helped) return;
    animal.helped = true;
    animal.healAnimTimer = 2.0;

    // 5 seconds immunity from all bad guys & 2 seconds glitter burst!
    this.player.wardShieldTimer = 5.0;
    this.player.glitterBurstTimer = 2.0;

    this.earnDewdrops(35);
    let healedPetal = false;
    if (this.player.petals < this.player.maxPetals) {
      this.player.petals++;
      healedPetal = true;
    }

    audioEngine.playAnimalHealed();
    this.spawnGlitterBurst(animal.x, animal.y - 24, 58, 2.0);
    this.spawnGlitterBurst(this.player.x, this.player.y - 22, 34, 2.0);
    this.pulses.push({
      x: animal.x,
      y: animal.y - 20,
      r: 8,
      maxR: 135,
      alpha: 0.9,
    });

    this.floatingPopups.push({
      x: animal.x,
      y: animal.y - 52,
      vy: -38,
      text: healedPetal ? '+1 Petal · +35 Dew · 5s Safe!' : '+35 Dew · 5s Safe Shield!',
      color: '#ffe896',
      life: 2.1,
      maxLife: 2.1,
    });

    this.emitHudSnapshot();
  }

  private collectTrashItem(t: TrashItem): void {
    if (t.collected) return;
    t.collected = true;
    this.earnDewdrops(15);
    audioEngine.playTrashPickup();
    this.spawnDust(t.x, t.y - 10, '#8cf8e8', 16);
    this.floatingPopups.push({
      x: t.x,
      y: t.y - 28,
      vy: -36,
      text: '+15 Dew · Clean Forest!',
      color: '#9effef',
      life: 1.5,
      maxLife: 1.5,
    });
    this.emitHudSnapshot();
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

  activateFlyingFlower(): void {
    if (this.phase !== 'PLAYING') return;
    const p = this.player;
    if (p.flyingFlowers <= 0 || p.flyingTimer > 0.25) return;
    audioEngine.init();
    p.flyingFlowers--;
    const baseFly = this.shopProgress.equipped.power === 'super_star_magnet' ? 7.5 : 5.0;
    const wandBonus = this.shopProgress.equipped.charm === 'fairy_sparkle_wand' ? 2.5 : 0;
    p.flyingTimer = baseFly + wandBonus;
    p.onGround = false;
    p.vy = -260;
    p.squash = 1.24;
    audioEngine.playFlyActivate();
    this.spawnDust(p.x, p.y - 20, '#ffb8ec', 26);
    this.emitHudSnapshot();
  }

  triggerPulse(): void {
    if (this.phase !== 'PLAYING' || this.player.pulseCooldown > 0) return;
    audioEngine.init();
    const boosted = this.player.crystalBoostTimer > 0;
    const hasHeart = this.shopProgress.equipped.charm === 'sanctuary_heart';
    const hasNova = this.shopProgress.equipped.power === 'super_nova_pulse';
    const pulseMaxR = (boosted ? 380 : 265) + (hasNova ? 120 : 0);
    this.player.pulseCooldown = hasNova ? 0.26 : boosted ? 0.3 : hasHeart ? 0.38 : 0.55;
    audioEngine.playPulse();

    this.pulses.push({
      x: this.player.x,
      y: this.player.y - 22,
      r: 10,
      maxR: pulseMaxR,
      alpha: 1,
    });

    const pCount = hasNova ? 34 : 22;
    for (let i = 0; i < pCount; i++) {
      const ang = (Math.PI * 2 * i) / pCount + Math.random() * 0.2;
      const spd = (hasNova ? 110 : 70) + Math.random() * 160;
      this.particles.push({
        x: this.player.x,
        y: this.player.y - 22,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        r: (hasNova ? 2.6 : 2) + Math.random() * 2.5,
        life: 0.9 + Math.random() * 0.5,
        maxLife: 1.4,
        color: hasNova || boosted || i % 2 === 1 ? '#ffe399' : '#85ffea',
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
        w.stunnedTimer = hasNova ? 9.0 : boosted ? 6.5 : 4.5;
        this.spawnDust(w.x, w.y, hasNova ? '#ffe08a' : '#9ef7ff', 10);
      }
    }
    for (const c of this.world.creatures) {
      if (Math.hypot(c.homeX - this.player.x, c.homeY - (this.player.y - 22)) < pulseMaxR) {
        c.emerge = Math.max(c.emerge, 0.72);
        this.blessCreature(c);
      }
    }
    if (hasNova) {
      for (const item of this.world.collectibles) {
        if (item.collected) continue;
        const dx = this.player.x - item.x;
        const dy = this.player.y - 20 - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist < pulseMaxR && dist > 1) {
          const pull = Math.min(dist - 12, 165);
          item.x += (dx / dist) * pull;
          item.baseY += (dy / dist) * pull;
        }
      }
    }
    let baddiePacified = false;
    for (const b of this.world.baddies) {
      if (Math.hypot(b.x - this.player.x, b.y - 18 - (this.player.y - 22)) < pulseMaxR) {
        b.emerge = Math.max(b.emerge, 0.75);
        b.stunnedTimer = hasNova ? 9.5 : boosted ? 7.5 : 5.5;
        if (!b.pacifiedOnce) {
          b.pacifiedOnce = true;
          this.earnDewdrops(15);
          baddiePacified = true;
        }
        this.spawnDust(b.x, b.y - 20, hasNova ? '#ffe08a' : '#8cf8e8', 14);
      }
    }
    if (baddiePacified) {
      this.emitHudSnapshot();
    }
  }

  private blessCreature(c: MagicalCreature): void {
    if (c.blessed) return;
    c.blessed = true;
    c.blessTimer = 2.2;
    const reward = c.kind === 'mermaid' ? 15 : 10;
    this.earnDewdrops(reward);
    if (c.kind === 'mermaid' && this.player.petals < this.player.maxPetals) {
      this.player.petals++;
    }
    audioEngine.playCreatureBless();
    this.spawnDust(c.x, c.y - 22, c.hueAccent, 18);
    this.emitHudSnapshot();
  }

  private awakenLantern(l: SpiritLantern): void {
    if (!l.lit) {
      l.lit = true;
      audioEngine.playLantern();
      this.earnDewdrops(25);
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
    audioEngine.updateWeatherAudio(blend.weights);

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
      const drag = p.drag ?? 0.96;
      p.vx *= Math.pow(drag, dt * 60);
      p.vy *= Math.pow(drag, dt * 60);
      if (p.gravity) p.vy += p.gravity * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingPopups.length - 1; i >= 0; i--) {
      const fp = this.floatingPopups[i];
      fp.y += fp.vy * dt;
      fp.life -= dt;
      if (fp.life <= 0) this.floatingPopups.splice(i, 1);
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
    p.flyingTimer = Math.max(0, p.flyingTimer - dt);
    p.coyoteTime = Math.max(0, p.coyoteTime - dt);
    p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.wardShieldTimer = Math.max(0, p.wardShieldTimer - dt);
    p.glitterBurstTimer = Math.max(0, p.glitterBurstTimer - dt);
    p.squash = lerp(p.squash, 1, Math.min(1, dt * 12));

    for (const a of this.world.sickAnimals) {
      if (a.healAnimTimer > 0) {
        a.healAnimTimer = Math.max(0, a.healAnimTimer - dt);
      }
    }

    if (p.glitterBurstTimer > 0 && Math.random() < 0.7) {
      const colors = ['#ffe885', '#ff9ee8', '#8cf8e8', '#ffffff', '#d8b4ff'];
      const ang = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * 75;
      this.particles.push({
        x: p.x + (Math.random() - 0.5) * 24,
        y: p.y - 18 + (Math.random() - 0.5) * 24,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 24,
        r: 2.4 + Math.random() * 2.4,
        life: 0.75 + Math.random() * 0.45,
        maxLife: 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        kind: 'glitter',
        twinklePhase: Math.random() * Math.PI * 2,
        drag: 0.97,
        gravity: 28,
      });
    }

    const playerBlend = getBiomeBlend(p.x, this.levelId);
    const isUnderwater = playerBlend.weights.underwater > 0.45;
    const isFlying = p.flyingTimer > 0;

    // Update drifting skywood / cloud moving platforms
    for (const mp of this.world.movingPlatforms) {
      mp.prevX = mp.x;
      mp.prevY = mp.y;
      mp.x = mp.baseX + Math.sin(this.time * mp.speed + mp.phase) * mp.dx;
      mp.y = mp.baseY + Math.cos(this.time * mp.speed + mp.phase) * mp.dy;
    }

    const moveDir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const hasBoots = this.shopProgress.equipped.charm === 'wind_boots';
    const hasPixieLantern = this.shopProgress.equipped.charm === 'fairy_sparkle_wand';
    const hasShield = this.shopProgress.equipped.charm === 'knight_crest';
    const equippedPower = this.shopProgress.equipped.power;
    const hasSkyLeap = equippedPower === 'super_sky_leap';
    const hasPhoenix = equippedPower === 'super_phoenix_wings';
    const hasDragonWings = equippedPower === 'super_dragon_wings';
    const hasFairyAura = equippedPower === 'super_fairy_sparkle';

    if (this.shieldCooldown > 0) {
      this.shieldCooldown = Math.max(0, this.shieldCooldown - dt);
    }

    if (hasPhoenix && p.petals < p.maxPetals) {
      this.phoenixRegenTimer += dt;
      if (this.phoenixRegenTimer >= 18) {
        this.phoenixRegenTimer = 0;
        p.petals = Math.min(p.maxPetals, p.petals + 1);
        this.spawnDust(p.x, p.y - 22, '#ff9c64', 18);
        audioEngine.playBlossom();
        this.emitHudSnapshot();
      }
    } else {
      this.phoenixRegenTimer = 0;
    }

    const baseSpeed = hasBoots ? 345 : 300;
    const maxSpeed =
      baseSpeed +
      (p.crystalBoostTimer > 0 ? 45 : 0) +
      (isFlying ? 85 : 0) +
      (hasPhoenix && !p.onGround ? 55 : 0) +
      (hasDragonWings ? 60 : 0);
    const isSlipperyIce = p.onGround && this.onIcePlatform;
    const isSnowyGround = p.onGround && !this.onIcePlatform && this.onSnowGround;
    const accel = p.onGround
      ? isSlipperyIce
        ? hasBoots
          ? 1040
          : 880
        : isSnowyGround
          ? hasBoots
            ? 1480
            : 1280
          : hasBoots
            ? 2150
            : 1950
      : hasBoots
        ? 1420
        : 1280;
    const decel = p.onGround
      ? isSlipperyIce
        ? 215
        : isSnowyGround
          ? 490
          : 1800
      : 540;

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

    // Frost skid sparks when sliding on ice platforms or snowy Frozen Pine Peaks trails
    if (
      p.onGround &&
      (isSlipperyIce || isSnowyGround) &&
      Math.abs(p.vx) > 65 &&
      (moveDir === 0 || Math.sign(p.vx) !== moveDir) &&
      Math.random() < (isSlipperyIce ? 0.55 : 0.25)
    ) {
      this.particles.push({
        x: p.x + (Math.random() - 0.5) * 10,
        y: p.y - 2,
        vx: -p.vx * 0.22 + (Math.random() - 0.5) * 28,
        vy: -18 - Math.random() * 24,
        r: 1.4 + Math.random() * 1.4,
        life: 0.38,
        maxLife: 0.38,
        color: '#e8fbff',
      });
    }

    const hasTripleJump = p.extraAirJumpTimer > 0 || hasSkyLeap;
    const jumpMult = hasSkyLeap ? 1.12 : hasFairyAura ? 1.1 : 1;

    if (p.jumpBuffer > 0 && !isFlying) {
      if (p.coyoteTime > 0) {
        const useHigh = p.highJumpCharges > 0;
        if (useHigh) {
          p.highJumpCharges--;
          this.emitHudSnapshot();
        }
        p.vy = (useHigh ? -645 : -515) * jumpMult;
        p.onGround = false;
        p.coyoteTime = 0;
        p.jumpBuffer = 0;
        p.jumpsLeft = hasTripleJump ? 2 : 1;
        p.squash = useHigh ? 1.32 : 1.24;
        if (useHigh || hasSkyLeap) audioEngine.playHighJump();
        else audioEngine.playJump(false);
        this.spawnDust(p.x, p.y, useHigh ? '#ffe28a' : '#88f7df', useHigh ? 14 : 7);
      } else if (p.jumpsLeft > 0) {
        const useHigh = p.highJumpCharges > 0;
        if (useHigh) {
          p.highJumpCharges--;
          this.emitHudSnapshot();
        }
        p.vy = (useHigh ? -585 : -465) * jumpMult;
        p.jumpsLeft--;
        p.jumpBuffer = 0;
        p.squash = useHigh ? 1.28 : 1.2;
        if (useHigh) audioEngine.playHighJump();
        else audioEngine.playJump(true);
        this.spawnDust(
          p.x,
          p.y - 6,
          useHigh ? '#ffe28a' : hasTripleJump ? '#c7b8ff' : '#ffe49e',
          useHigh ? 15 : 10
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

    p.gliding = !isFlying && !p.onGround && this.input.jumpHeld && (p.vy > 20 || inWind);

    if (isFlying) {
      const targetVy = this.input.jumpHeld
        ? -295
        : Math.sin(this.time * 5.4) * 28;
      p.vy = lerp(p.vy, targetVy, Math.min(1, dt * 7.2));
      p.onGround = false;
      p.jumpBuffer = 0;
      if (Math.random() < 0.45) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 24,
          y: p.y - 16 + (Math.random() - 0.5) * 14,
          vx: -p.vx * 0.2 + (Math.random() - 0.5) * 30,
          vy: 25 + Math.random() * 35,
          r: 1.8 + Math.random() * 2,
          life: 0.55,
          maxLife: 0.55,
          color: Math.random() > 0.5 ? '#ffb5e8' : '#ffe494',
        });
      }
    } else if (inWind && (p.gliding || this.input.jumpHeld)) {
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
      const gravityBase = isUnderwater ? 820 : 1220;
      const glideGrav = isUnderwater ? 140 : hasPhoenix ? 95 : hasDragonWings ? 105 : hasBoots ? 210 : 260;
      const gravity = p.gliding ? glideGrav : gravityBase;
      const glideCap = isUnderwater ? 60 : hasPhoenix ? 38 : hasDragonWings ? 44 : hasBoots ? 78 : 105;
      p.vy += gravity * dt;
      if (p.gliding && p.vy > glideCap) p.vy = glideCap;
      else if (p.vy > (isUnderwater ? 460 : 780)) p.vy = isUnderwater ? 460 : 780;
    }

    const prevY = p.y;
    p.x = clamp(p.x + p.vx * dt, 30, WORLD_WIDTH - 40);
    p.y = Math.max(getTerrainY(p.x, this.levelId) - 430, p.y + p.vy * dt);

    let landedThisFrame = false;
    let landedOnIce = false;
    let landedOnSnow = false;

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
          landedOnIce = plat.type === 'ice';
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
            landedOnIce = this.levelId === 4;
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
      landedOnSnow = this.levelId === 4 || playerBlend.weights.snow > 0.45;
    }

    if (landedThisFrame) {
      if (!p.onGround) {
        p.squash = 0.78;
        this.spawnDust(p.x, p.y, landedOnIce ? '#d6faff' : '#7debd3', 5);
      }
      p.onGround = true;
      this.onIcePlatform = landedOnIce;
      this.onSnowGround = landedOnSnow;
      p.coyoteTime = 0.12;
      p.jumpsLeft = hasTripleJump ? 3 : 2;
    } else {
      p.onGround = false;
      this.onIcePlatform = false;
      this.onSnowGround = false;
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

    if ((Math.abs(p.vx) > 90 || p.crystalBoostTimer > 0 || hasFairyAura || hasPixieLantern) && Math.random() < (hasFairyAura ? 0.55 : 0.3)) {
      this.particles.push({
        x: p.x + (Math.random() - 0.5) * 16,
        y: p.y - 6 - Math.random() * 20,
        vx: -p.vx * 0.15,
        vy: -15 - Math.random() * 22,
        r: 1.4 + Math.random() * 1.6,
        life: 0.5,
        maxLife: 0.5,
        color: hasFairyAura || hasPixieLantern ? (Math.random() > 0.5 ? '#ff9ef0' : '#ffe399') : p.crystalBoostTimer > 0 ? '#ffe18c' : '#7cfce7',
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

    // Fairies, Mermaids, Spirit Foxes, and Starlight Owls that pop up as you play
    for (const c of this.world.creatures) {
      const distHome = Math.hypot(c.homeX - p.x, c.homeY - (p.y - 20));
      const wantEmerge = distHome < 310 || (c.emergedOnce && distHome < 540) ? 1 : 0;
      c.emerge = lerp(c.emerge, wantEmerge, Math.min(1, dt * 4.2));
      if (c.blessTimer > 0) c.blessTimer = Math.max(0, c.blessTimer - dt);

      if (!c.emergedOnce && c.emerge > 0.28) {
        c.emergedOnce = true;
        audioEngine.playCreaturePop(c.kind);
        this.spawnDust(c.homeX, c.homeY - 18, c.huePrimary, 12);
      }

      c.facing = p.x >= c.homeX ? 1 : -1;
      if (c.kind === 'fairy') {
        c.x = c.homeX + Math.sin(this.time * 1.9 + c.phase) * 26;
        c.y = c.homeY + (1 - c.emerge) * 34 + Math.cos(this.time * 2.6 + c.phase) * 12;
      } else if (c.kind === 'mermaid') {
        c.x = c.homeX;
        c.y =
          c.homeY +
          (1 - c.emerge) * 46 -
          c.emerge * (6 + Math.sin(this.time * 2.4 + c.phase) * 3.5);
      } else if (c.kind === 'fox') {
        const hop =
          c.blessTimer > 0
            ? Math.abs(Math.sin(this.time * 9)) * 12
            : Math.max(0, Math.sin(this.time * 3.1 + c.phase)) * 4;
        c.x = c.homeX + Math.sin(this.time * 0.9 + c.phase) * 12 * c.emerge;
        c.y = c.homeY + (1 - c.emerge) * 28 - hop;
      } else {
        c.x = c.homeX;
        c.y = c.homeY + (1 - c.emerge) * 22 + Math.sin(this.time * 2.1 + c.phase) * 5;
      }

      if (!c.blessed && c.emerge > 0.55 && Math.hypot(c.x - p.x, c.y - (p.y - 20)) < 58) {
        this.blessCreature(c);
      }
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

      if (distToPlayer < 34 && p.wardShieldTimer > 0) {
        w.stunnedTimer = 3.5;
        this.spawnDust(w.x, w.y, '#ffe896', 12);
        continue;
      }

      if (distToPlayer < 26 && p.invulnTimer <= 0 && p.wardShieldTimer <= 0) {
        if (hasShield && this.shieldCooldown <= 0) {
          this.shieldCooldown = 22;
          p.invulnTimer = 1.25;
          w.stunnedTimer = 5;
          this.triggerShake(4.5, 0.16);
          audioEngine.playPulse();
          this.spawnDust(p.x, p.y - 20, '#9ed4ff', 22);
          continue;
        }
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

    // Pop-up Forest Bad Guys (Shadow Gnomes & Bramble Imps): defeat via Spirit Pulse or jumping on them!
    for (const b of this.world.baddies) {
      const distHome = Math.hypot(b.homeX - p.x, b.homeY - (p.y - 20));
      const wantEmerge = distHome < 300 || (b.emergedOnce && distHome < 540) ? 1 : 0;
      b.emerge = lerp(b.emerge, wantEmerge, Math.min(1, dt * 5));

      if (!b.emergedOnce && b.emerge > 0.3) {
        b.emergedOnce = true;
        audioEngine.playBaddiePop();
        this.spawnDust(b.homeX, b.homeY - 12, '#ff8aa8', 10);
      }

      if (b.stunnedTimer > 0) {
        b.stunnedTimer = Math.max(0, b.stunnedTimer - dt);
        continue;
      }

      const prevBx = b.x;
      b.x = b.homeX + Math.sin(this.time * b.speed + b.phase) * b.patrolRange * b.emerge;
      b.y = b.homeY + (1 - b.emerge) * 36;
      if (Math.abs(b.x - prevBx) > 0.05) {
        b.facing = b.x >= prevBx ? 1 : -1;
      }

      if (b.emerge < 0.55) continue;

      // Dragon Wings aerial dash knockback
      if (
        hasDragonWings &&
        (!p.onGround || Math.abs(p.vx) > 250) &&
        Math.hypot(b.x - p.x, b.y - 18 - (p.y - 20)) < 46
      ) {
        b.stunnedTimer = 6.5;
        if (!b.pacifiedOnce) {
          b.pacifiedOnce = true;
          this.earnDewdrops(15);
          this.emitHudSnapshot();
        }
        audioEngine.playStomp();
        this.spawnDust(b.x, b.y - 20, '#ff8654', 16);
        continue;
      }

      // Jump / Stomp defeat check
      if (
        p.vy > 0 &&
        Math.abs(p.x - b.x) < 28 &&
        prevY <= b.y - 12 &&
        p.y >= b.y - 34
      ) {
        p.vy = -505;
        p.onGround = false;
        p.jumpsLeft = Math.max(p.jumpsLeft, 1);
        p.squash = 1.28;
        b.stunnedTimer = 6.0;
        if (!b.pacifiedOnce) {
          b.pacifiedOnce = true;
          this.earnDewdrops(15);
          this.emitHudSnapshot();
        }
        this.hitstopTimer = 0.035;
        this.triggerShake(4, 0.14);
        audioEngine.playStomp();
        this.spawnDust(b.x, b.y - 22, '#ffe194', 18);
        continue;
      }

      // Protected 5-second Safe Shield repels baddies cleanly
      if (Math.hypot(b.x - p.x, b.y - 16 - (p.y - 20)) < 34 && p.wardShieldTimer > 0) {
        b.stunnedTimer = 3.5;
        this.spawnDust(b.x, b.y - 18, '#ffe896', 14);
        continue;
      }

      // Side collision check
      if (
        Math.hypot(b.x - p.x, b.y - 16 - (p.y - 20)) < 25 &&
        p.invulnTimer <= 0 &&
        p.wardShieldTimer <= 0
      ) {
        if (hasShield && this.shieldCooldown <= 0) {
          this.shieldCooldown = 22;
          p.invulnTimer = 1.25;
          b.stunnedTimer = 5;
          this.triggerShake(4.5, 0.16);
          audioEngine.playPulse();
          this.spawnDust(p.x, p.y - 20, '#9ed4ff', 22);
          continue;
        }
        p.petals = Math.max(0, p.petals - 1);
        p.invulnTimer = 1.4;
        p.vx = Math.sign(p.x - b.x || -1) * 260;
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

    // Pick up Trash / Litter along the route
    for (const trash of this.world.trashItems) {
      if (trash.collected) continue;
      if (Math.hypot(trash.x - p.x, trash.y - 10 - (p.y - 16)) < 38) {
        this.collectTrashItem(trash);
      }
    }

    // Collect Lumina Orbs, Sun Blossoms, Prism Crystals, Star Seeds, High Jumps & Flying Flowers
    const hasFirefly = this.shopProgress.equipped.charm === 'firefly_sprite';
    const hasCosmicMagnet = equippedPower === 'super_star_magnet';
    const magnetRange = Math.max(isFlying ? 200 : 0, hasCosmicMagnet ? 245 : 0, hasFirefly ? 125 : 0);
    const magnetPull = hasCosmicMagnet ? 460 : isFlying ? 440 : 280;
    for (const item of this.world.collectibles) {
      if (item.collected) continue;
      if (magnetRange > 0) {
        const dx = p.x - item.x;
        const dy = p.y - 20 - item.y;
        const dist = Math.hypot(dx, dy);
        if (dist < magnetRange && dist > 1) {
          const pull = magnetPull * dt;
          item.x += (dx / dist) * pull;
          item.baseY += (dy / dist) * pull;
        }
      }
      item.y = item.baseY + Math.sin(this.time * 2.8 + item.phase) * 7;
      if (Math.hypot(item.x - p.x, item.y - (p.y - 20)) < 34) {
        item.collected = true;
        if (item.kind === 'orb') {
          this.orbsCollected++;
          this.earnDewdrops(5);
          audioEngine.playChime(this.orbsCollected % 4);
          this.spawnDust(item.x, item.y, '#9effef', 16);
        } else if (item.kind === 'blossom') {
          this.blossomsCollected++;
          this.earnDewdrops(15);
          if (p.petals < p.maxPetals) p.petals++;
          audioEngine.playBlossom();
          this.spawnDust(item.x, item.y, '#ffd87a', 22);
        } else if (item.kind === 'crystal') {
          this.crystalsCollected++;
          this.earnDewdrops(20);
          p.crystalBoostTimer = 6.5 + (hasPixieLantern ? 2.5 : 0);
          audioEngine.playCrystal();
          this.spawnDust(item.x, item.y, '#cfa6ff', 24);
        } else if (item.kind === 'starseed') {
          this.starseedsCollected++;
          this.earnDewdrops(30);
          p.extraAirJumpTimer = 10;
          p.jumpsLeft = Math.max(p.jumpsLeft, 2);
          audioEngine.playStarSeed();
          this.spawnDust(item.x, item.y, '#d4f4ff', 26);
        } else if (item.kind === 'highjump') {
          p.highJumpCharges = Math.min(15, p.highJumpCharges + 5);
          this.earnDewdrops(20);
          audioEngine.playHighJump();
          this.spawnDust(item.x, item.y, '#9efce7', 22);
        } else {
          p.flyingFlowers++;
          this.earnDewdrops(25);
          audioEngine.playFlyActivate();
          this.spawnDust(item.x, item.y, '#ffb8ec', 24);
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
      this.earnDewdrops(100);
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
      floatingPopups: this.floatingPopups,
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
      equipped: this.shopProgress.equipped,
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

  private spawnGlitterBurst(x: number, y: number, count: number, duration = 2.0): void {
    const glitterColors = ['#ffe985', '#ff9ee8', '#8cf8e8', '#ffffff', '#c7b8ff', '#ffd078'];
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const spd = 38 + Math.random() * 145;
      const life = duration * (0.85 + Math.random() * 0.25);
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 55,
        r: 2.6 + Math.random() * 3.0,
        life,
        maxLife: life,
        color: glitterColors[i % glitterColors.length],
        kind: 'glitter',
        twinklePhase: Math.random() * Math.PI * 2,
        drag: 0.968,
        gravity: 36,
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
    const animalsHelped = this.world.sickAnimals.filter((a) => a.helped).length;
    const trashCollected = this.world.trashItems.filter((t) => t.collected).length;
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
      animalsHelped,
      animalsTotal: this.world.sickAnimals.length,
      trashCollected,
      trashTotal: this.world.trashItems.length,
      wardShieldLeft: Math.max(0, Math.round(this.player.wardShieldTimer * 10) / 10),
      petals: this.player.petals,
      maxPetals: this.player.maxPetals,
      biomeName: biome.name,
      weatherLabel: biome.weatherLabel,
      elapsedSeconds: Math.floor(this.elapsedSeconds),
      progressPct,
      crystalBoostActive: this.player.crystalBoostTimer > 0,
      tripleJumpActive: this.player.extraAirJumpTimer > 0,
      highJumpCharges: this.player.highJumpCharges,
      flyingFlowers: this.player.flyingFlowers,
      flyingTimeLeft: Math.max(0, Math.round(this.player.flyingTimer * 10) / 10),
      underwaterActive: blend.weights.underwater > 0.45,
      dewdrops: this.shopProgress.dewdrops,
      equipped: { ...this.shopProgress.equipped },
      savedGame: getSavedGameSummary(),
    });
  }
}
