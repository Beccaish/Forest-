import type { PlayerLoadout } from './shop';
import type { SavedGameSummary } from './save';

export type GamePhase = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

export type LevelId = 1 | 2 | 3 | 4 | 5;

export type WeatherKind =
  | 'DRIFTING_LEAVES'
  | 'SOFT_RAIN'
  | 'STARLIGHT_FLURRY'
  | 'SNOW'
  | 'UNDERWATER';

export type CollectibleKind =
  | 'orb'
  | 'blossom'
  | 'crystal'
  | 'starseed'
  | 'highjump'
  | 'flyingflower';

export interface HudSnapshot {
  phase: GamePhase;
  levelId: LevelId;
  levelName: string;
  orbsCollected: number;
  orbsTotal: number;
  blossomsCollected: number;
  blossomsTotal: number;
  crystalsCollected: number;
  crystalsTotal: number;
  starseedsCollected: number;
  starseedsTotal: number;
  lanternsLit: number;
  lanternsTotal: number;
  animalsHelped: number;
  animalsTotal: number;
  trashCollected: number;
  trashTotal: number;
  wardShieldLeft: number;
  petals: number;
  maxPetals: number;
  biomeName: string;
  weatherLabel: string;
  elapsedSeconds: number;
  progressPct: number;
  crystalBoostActive: boolean;
  tripleJumpActive: boolean;
  highJumpCharges: number;
  flyingFlowers: number;
  flyingTimeLeft: number;
  underwaterActive: boolean;
  dewdrops: number;
  equipped: PlayerLoadout;
  savedGame: SavedGameSummary | null;
}

export interface BiomeConfig {
  name: string;
  weatherLabel: string;
  weatherKind: WeatherKind;
  skyTop: string;
  skyMid: string;
  skyBot: string;
  mountain: string;
  farTree: string;
  midTree: string;
  groundTop: string;
  groundBot: string;
  rim: string;
  particle: string;
  mist: string;
}

export interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

export interface SkyLantern {
  x: number;
  y: number;
  r: number;
  vy: number;
  swayPhase: number;
  hue: string;
}

export interface Mountain {
  x: number;
  w: number;
  h: number;
}

export interface FarTree {
  x: number;
  w: number;
  h: number;
  canopyR: number;
  lean: number;
}

export interface MidTree {
  x: number;
  w: number;
  h: number;
  canopyR: number;
  lean: number;
  vines: number;
  vineSeed: number;
}

export interface NearTree {
  x: number;
  w: number;
  h: number;
  lean: number;
  hasHollow: boolean;
  hollowY: number;
}

export interface FgSilhouette {
  x: number;
  w: number;
  lean: number;
}

export interface Waterfall {
  x: number;
  w: number;
  topY: number;
}

export interface StoneArch {
  x: number;
  y: number;
  w: number;
  h: number;
  glow: number;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  type: 'branch' | 'stone' | 'spirit' | 'ice';
  glow: number;
}

export interface MovingPlatform {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  w: number;
  dx: number;
  dy: number;
  speed: number;
  phase: number;
}

export interface SkyRing {
  x: number;
  y: number;
  r: number;
  cooldown: number;
  phase: number;
}

export interface GlowMushroom {
  x: number;
  y: number;
  r: number;
  h: number;
  bounce: number;
  hue: string;
}

export interface WindStream {
  x: number;
  yTop: number;
  yBot: number;
  w: number;
  phase: number;
}

export interface SpiritLantern {
  x: number;
  y: number;
  lit: boolean;
  glow: number;
}

export interface CollectibleItem {
  x: number;
  y: number;
  baseY: number;
  kind: CollectibleKind;
  collected: boolean;
  phase: number;
}

export interface GrassTuft {
  x: number;
  y: number;
  h: number;
  bend: number;
  bendVel: number;
  hasFlower: boolean;
  flowerHue: string;
}

export interface FloatingSpore {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  depth: number;
}

export interface ThornWisp {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  patrolRange: number;
  speed: number;
  phase: number;
  telegraphTimer: number;
  stunnedTimer: number;
}

export interface WoodlandButterfly {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  phase: number;
  color: string;
}

export type MagicalCreatureKind = 'fairy' | 'mermaid' | 'fox' | 'owl';

export interface MagicalCreature {
  id: number;
  kind: MagicalCreatureKind;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  emerge: number;
  emergedOnce: boolean;
  blessed: boolean;
  blessTimer: number;
  phase: number;
  facing: number;
  huePrimary: string;
  hueAccent: string;
}

export type ForestBaddieKind = 'gnome' | 'bramble_imp';

export interface ForestBaddie {
  id: number;
  kind: ForestBaddieKind;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  patrolRange: number;
  speed: number;
  emerge: number;
  emergedOnce: boolean;
  stunnedTimer: number;
  pacifiedOnce: boolean;
  phase: number;
  facing: number;
}

export type SickAnimalKind = 'hedgehog' | 'fawn' | 'bunny' | 'bird' | 'otter';

export interface SickAnimal {
  id: number;
  kind: SickAnimalKind;
  name: string;
  x: number;
  y: number;
  helped: boolean;
  healAnimTimer: number;
  phase: number;
  facing: number;
}

export type TrashKind = 'bottle' | 'can' | 'wrapper' | 'cup';

export interface TrashItem {
  id: number;
  kind: TrashKind;
  x: number;
  y: number;
  collected: boolean;
  phase: number;
  rot: number;
}

export interface FloatingPopup {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  color: string;
  kind?: 'dust' | 'glitter';
  twinklePhase?: number;
  drag?: number;
  gravity?: number;
}

export interface PulseRing {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
}

export interface ScarfNode {
  x: number;
  y: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  onGround: boolean;
  coyoteTime: number;
  jumpBuffer: number;
  jumpsLeft: number;
  gliding: boolean;
  pulseCooldown: number;
  crystalBoostTimer: number;
  extraAirJumpTimer: number;
  highJumpCharges: number;
  flyingFlowers: number;
  flyingTimer: number;
  invulnTimer: number;
  wardShieldTimer: number;
  glitterBurstTimer: number;
  petals: number;
  maxPetals: number;
  checkpointX: number;
  checkpointY: number;
  scarf: ScarfNode[];
  runPhase: number;
  squash: number;
}
