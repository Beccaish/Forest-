import type {
  BiomeConfig,
  CollectibleItem,
  FarTree,
  FgSilhouette,
  FloatingSpore,
  GlowMushroom,
  GrassTuft,
  LevelId,
  MagicalCreature,
  MidTree,
  Mountain,
  MovingPlatform,
  NearTree,
  Platform,
  SkyLantern,
  SkyRing,
  SpiritLantern,
  Star,
  StoneArch,
  ThornWisp,
  Waterfall,
  WindStream,
  WoodlandButterfly,
} from './types';

export const WORLD_WIDTH = 7800;
export const BASE_GROUND_Y = 560;
export const SANCTUARY_X = 7380;

export const LEVEL_NAMES: Record<LevelId, string> = {
  1: 'Whispering Woods',
  2: 'Amber & Crystal Hollows',
  3: 'Frostbloom Skywoods',
};

export const LEVEL_BIOMES: Record<LevelId, BiomeConfig[]> = {
  1: [
    {
      name: 'Emerald Sunbeam Glade',
      weatherLabel: 'Drifting Leaves',
      weatherKind: 'DRIFTING_LEAVES',
      skyTop: '#0d2633',
      skyMid: '#19494f',
      skyBot: '#427c69',
      mountain: '#13353c',
      farTree: '#0e2c30',
      midTree: '#0a2224',
      groundTop: '#215b4b',
      groundBot: '#091619',
      rim: '#69f0bd',
      particle: '#ffd889',
      mist: '#75e6c8',
    },
    {
      name: 'Moonpetal Biolume Woods',
      weatherLabel: 'Soft Silver Rain',
      weatherKind: 'SOFT_RAIN',
      skyTop: '#090c24',
      skyMid: '#181945',
      skyBot: '#2f2766',
      mountain: '#14173c',
      farTree: '#101233',
      midTree: '#0a0b24',
      groundTop: '#262b63',
      groundBot: '#070817',
      rim: '#6fffe9',
      particle: '#ff8fe8',
      mist: '#7d8eff',
    },
    {
      name: 'Starlit Spirit Sanctuary',
      weatherLabel: 'Starlight Flurry',
      weatherKind: 'STARLIGHT_FLURRY',
      skyTop: '#040a18',
      skyMid: '#0b2239',
      skyBot: '#184b61',
      mountain: '#0d2336',
      farTree: '#091b2b',
      midTree: '#06121f',
      groundTop: '#1b5063',
      groundBot: '#050c14',
      rim: '#a6fff8',
      particle: '#ffe694',
      mist: '#88f7ff',
    },
  ],
  2: [
    {
      name: 'Amber Dusk Grove',
      weatherLabel: 'Crimson Maple Drift',
      weatherKind: 'DRIFTING_LEAVES',
      skyTop: '#261224',
      skyMid: '#5c2635',
      skyBot: '#b56345',
      mountain: '#3a1b2b',
      farTree: '#2d1422',
      midTree: '#200e18',
      groundTop: '#5e3528',
      groundBot: '#14090c',
      rim: '#ffb86c',
      particle: '#ffd285',
      mist: '#f29572',
    },
    {
      name: 'Crystal Cavern Hollow',
      weatherLabel: 'Amethyst Mist Rain',
      weatherKind: 'SOFT_RAIN',
      skyTop: '#110821',
      skyMid: '#251447',
      skyBot: '#462673',
      mountain: '#1e113b',
      farTree: '#160d2e',
      midTree: '#0f0821',
      groundTop: '#35225c',
      groundBot: '#090514',
      rim: '#d49eff',
      particle: '#99f3ff',
      mist: '#b58eff',
    },
    {
      name: 'Golden Crown Summit',
      weatherLabel: 'Golden Blossom Flurry',
      weatherKind: 'STARLIGHT_FLURRY',
      skyTop: '#0b0e26',
      skyMid: '#261e4a',
      skyBot: '#613c61',
      mountain: '#1b1638',
      farTree: '#14102b',
      midTree: '#0d0a1f',
      groundTop: '#473157',
      groundBot: '#080512',
      rim: '#ffe18c',
      particle: '#ffd6a5',
      mist: '#f5b8da',
    },
  ],
  3: [
    {
      name: 'Silver Frostwood',
      weatherLabel: 'Frost Leaf Drift',
      weatherKind: 'DRIFTING_LEAVES',
      skyTop: '#122238',
      skyMid: '#244566',
      skyBot: '#537ea3',
      mountain: '#1d3652',
      farTree: '#162b42',
      midTree: '#0f1f30',
      groundTop: '#2e5778',
      groundBot: '#08121c',
      rim: '#9ef5ff',
      particle: '#d9fbff',
      mist: '#a1e1ff',
    },
    {
      name: 'Celestial Skywood Isles',
      weatherLabel: 'Cloudburst Mist Rain',
      weatherKind: 'SOFT_RAIN',
      skyTop: '#1c1842',
      skyMid: '#433878',
      skyBot: '#8c699e',
      mountain: '#2c2559',
      farTree: '#221c47',
      midTree: '#171333',
      groundTop: '#3f3d75',
      groundBot: '#0d0b1f',
      rim: '#a6e9ff',
      particle: '#ffe3a8',
      mist: '#d5b8ff',
    },
    {
      name: 'Astral Heartwood Grove',
      weatherLabel: 'Astral Blossom Snow',
      weatherKind: 'STARLIGHT_FLURRY',
      skyTop: '#050b1f',
      skyMid: '#12244d',
      skyBot: '#293e73',
      mountain: '#101d3d',
      farTree: '#0c1630',
      midTree: '#080e21',
      groundTop: '#203c63',
      groundBot: '#050914',
      rim: '#c7b8ff',
      particle: '#9cfaff',
      mist: '#9ed6ff',
    },
  ],
};

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const smoothstep = (t: number): number => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};

function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export interface BiomeBlend {
  idxA: number;
  idxB: number;
  a: BiomeConfig;
  b: BiomeConfig;
  mix: number;
  mainIndex: number;
  weights: {
    leaves: number;
    rain: number;
    flurry: number;
  };
}

export function getBiomeBlend(x: number, levelId: LevelId = 1): BiomeBlend {
  const biomes = LEVEL_BIOMES[levelId];
  const t1Start = 2050;
  const t1End = 2950;
  const t2Start = 4750;
  const t2End = 5650;

  let idxA = 0;
  let idxB = 0;
  let mix = 0;

  if (x < t1Start) {
    idxA = idxB = 0;
    mix = 0;
  } else if (x < t1End) {
    idxA = 0;
    idxB = 1;
    mix = smoothstep((x - t1Start) / (t1End - t1Start));
  } else if (x < t2Start) {
    idxA = idxB = 1;
    mix = 0;
  } else if (x < t2End) {
    idxA = 1;
    idxB = 2;
    mix = smoothstep((x - t2Start) / (t2End - t2Start));
  } else {
    idxA = idxB = 2;
    mix = 0;
  }

  let leaves = 0;
  let rain = 0;
  let flurry = 0;

  if (idxA === 0 && idxB === 0) leaves = 1;
  else if (idxA === 0 && idxB === 1) {
    leaves = 1 - mix;
    rain = mix;
  } else if (idxA === 1 && idxB === 1) rain = 1;
  else if (idxA === 1 && idxB === 2) {
    rain = 1 - mix;
    flurry = mix;
  } else {
    flurry = 1;
  }

  return {
    idxA,
    idxB,
    a: biomes[idxA],
    b: biomes[idxB],
    mix,
    mainIndex: mix > 0.5 ? idxB : idxA,
    weights: { leaves, rain, flurry },
  };
}

export function getTerrainY(x: number, levelId: LevelId = 1): number {
  const startFlat = clamp((x - 180) / 300, 0, 1);
  const endFlat = clamp((7250 - x) / 380, 0, 1);
  const hillScale = startFlat * endFlat;

  if (levelId === 3) {
    const wave =
      Math.sin(x * 0.0029 + 1.1) * 62 +
      Math.sin(x * 0.0071 + 0.4) * 28 +
      Math.cos(x * 0.014) * 12;
    return BASE_GROUND_Y + wave * hillScale;
  }

  if (levelId === 2) {
    const wave =
      Math.sin(x * 0.0026 + 0.6) * 58 +
      Math.cos(x * 0.0061) * 32 +
      Math.sin(x * 0.013 + 1.5) * 14;
    return BASE_GROUND_Y + wave * hillScale;
  }

  const wave =
    Math.sin(x * 0.0022) * 52 +
    Math.sin(x * 0.0053 + 1.2) * 26 +
    Math.cos(x * 0.011 + 0.4) * 10;

  return BASE_GROUND_Y + wave * hillScale;
}

export interface WorldData {
  levelId: LevelId;
  stars: Star[];
  skyLanterns: SkyLantern[];
  mountains: Mountain[];
  farTrees: FarTree[];
  midTrees: MidTree[];
  nearTrees: NearTree[];
  fgSilhouettes: FgSilhouette[];
  waterfalls: Waterfall[];
  stoneArches: StoneArch[];
  platforms: Platform[];
  movingPlatforms: MovingPlatform[];
  skyRings: SkyRing[];
  mushrooms: GlowMushroom[];
  windStreams: WindStream[];
  lanterns: SpiritLantern[];
  collectibles: CollectibleItem[];
  grassTufts: GrassTuft[];
  floatingSpores: FloatingSpore[];
  thornWisps: ThornWisp[];
  butterflies: WoodlandButterfly[];
  creatures: MagicalCreature[];
}

export function generateWorld(levelId: LevelId = 1): WorldData {
  const seed = levelId === 1 ? 20261125 : levelId === 2 ? 88442211 : 73915523;
  const rng = createRng(seed);

  const stars: Star[] = [];
  for (let i = 0; i < 195; i++) {
    stars.push({
      x: rng() * 2000,
      y: rng() * 0.62,
      r: 0.7 + rng() * 1.9,
      phase: rng() * Math.PI * 2,
      speed: 0.8 + rng() * 2.2,
    });
  }

  const skyLanterns: SkyLantern[] = [];
  if (levelId === 2 || levelId === 3) {
    for (let i = 0; i < 24; i++) {
      skyLanterns.push({
        x: rng() * 1800,
        y: 80 + rng() * 560,
        r: 4 + rng() * 5,
        vy: 12 + rng() * 16,
        swayPhase: rng() * Math.PI * 2,
        hue:
          levelId === 2
            ? i % 2 === 0
              ? '#ffd082'
              : '#ff9eb5'
            : i % 2 === 0
              ? '#9ef5ff'
              : '#d5b8ff',
      });
    }
  }

  const mountains: Mountain[] = [];
  for (let x = -200; x < 1750; x += 130 + rng() * 110) {
    mountains.push({
      x,
      w: levelId === 1 ? 260 + rng() * 260 : 190 + rng() * 210,
      h: levelId === 1 ? 180 + rng() * 190 : 220 + rng() * 230,
    });
  }

  const farTrees: FarTree[] = [];
  for (let x = -150; x < WORLD_WIDTH * 0.3 + 700; x += 55 + rng() * 45) {
    farTrees.push({
      x,
      w: 18 + rng() * 26,
      h: 220 + rng() * 240,
      canopyR: 48 + rng() * 56,
      lean: (rng() - 0.5) * 18,
    });
  }

  const midTrees: MidTree[] = [];
  for (let x = -100; x < WORLD_WIDTH * 0.55 + 700; x += 110 + rng() * 85) {
    midTrees.push({
      x,
      w: 28 + rng() * 34,
      h: 320 + rng() * 260,
      canopyR: 75 + rng() * 75,
      lean: (rng() - 0.5) * 26,
      vines: Math.floor(rng() * 4),
      vineSeed: rng() * 100,
    });
  }

  const nearTrees: NearTree[] = [];
  for (let x = 80; x < WORLD_WIDTH * 0.8 + 600; x += 210 + rng() * 160) {
    nearTrees.push({
      x,
      w: 44 + rng() * 38,
      h: 420 + rng() * 240,
      lean: (rng() - 0.5) * 24,
      hasHollow: rng() > 0.52,
      hollowY: 120 + rng() * 90,
    });
  }

  const fgSilhouettes: FgSilhouette[] = [];
  for (let x = 350; x < WORLD_WIDTH * 1.32; x += 520 + rng() * 420) {
    fgSilhouettes.push({
      x,
      w: 55 + rng() * 50,
      lean: (rng() - 0.5) * 40,
    });
  }

  const waterfallXs =
    levelId === 1
      ? [720, 1820, 3150, 4420, 5880]
      : levelId === 2
        ? [920, 2240, 3680, 5040, 6240]
        : [810, 2080, 3440, 4880, 6160];
  const waterfalls: Waterfall[] = waterfallXs.map((wx) => ({
    x: wx,
    w: 48 + rng() * 38,
    topY: 130 + rng() * 70,
  }));

  const archXs =
    levelId === 1
      ? [620, 2480, 4950, 6820]
      : levelId === 2
        ? [540, 2620, 4780, 6780]
        : [580, 2420, 4690, 6840];
  const stoneArches: StoneArch[] = archXs.map((ax) => ({
    x: ax,
    y: getTerrainY(ax, levelId),
    w: 135,
    h: 165,
    glow: 0.25,
  }));

  const platformDefs: Array<{
    x: number;
    dy: number;
    w: number;
    type: 'branch' | 'stone' | 'spirit';
  }> =
    levelId === 1
      ? [
          { x: 430, dy: -115, w: 145, type: 'branch' },
          { x: 640, dy: -195, w: 150, type: 'branch' },
          { x: 960, dy: -130, w: 165, type: 'stone' },
          { x: 1230, dy: -220, w: 150, type: 'branch' },
          { x: 1510, dy: -145, w: 160, type: 'spirit' },
          { x: 1860, dy: -160, w: 170, type: 'branch' },
          { x: 2150, dy: -245, w: 140, type: 'spirit' },
          { x: 2660, dy: -135, w: 155, type: 'stone' },
          { x: 2940, dy: -230, w: 160, type: 'branch' },
          { x: 3250, dy: -155, w: 145, type: 'spirit' },
          { x: 3560, dy: -250, w: 175, type: 'branch' },
          { x: 3890, dy: -175, w: 160, type: 'stone' },
          { x: 4240, dy: -265, w: 150, type: 'spirit' },
          { x: 4580, dy: -150, w: 170, type: 'branch' },
          { x: 5120, dy: -140, w: 150, type: 'stone' },
          { x: 5410, dy: -240, w: 165, type: 'spirit' },
          { x: 5750, dy: -175, w: 175, type: 'branch' },
          { x: 6080, dy: -275, w: 160, type: 'spirit' },
          { x: 6420, dy: -165, w: 170, type: 'stone' },
        ]
      : levelId === 2
        ? [
            { x: 390, dy: -120, w: 150, type: 'branch' },
            { x: 630, dy: -215, w: 150, type: 'stone' },
            { x: 920, dy: -145, w: 155, type: 'spirit' },
            { x: 1180, dy: -255, w: 160, type: 'branch' },
            { x: 1520, dy: -160, w: 150, type: 'stone' },
            { x: 1840, dy: -250, w: 155, type: 'spirit' },
            { x: 2210, dy: -145, w: 165, type: 'branch' },
            { x: 2540, dy: -240, w: 150, type: 'spirit' },
            { x: 2890, dy: -165, w: 160, type: 'stone' },
            { x: 3240, dy: -275, w: 165, type: 'spirit' },
            { x: 3580, dy: -155, w: 155, type: 'branch' },
            { x: 3940, dy: -245, w: 160, type: 'stone' },
            { x: 4290, dy: -170, w: 155, type: 'spirit' },
            { x: 4650, dy: -265, w: 165, type: 'branch' },
            { x: 5060, dy: -150, w: 160, type: 'stone' },
            { x: 5390, dy: -255, w: 160, type: 'spirit' },
            { x: 5740, dy: -190, w: 170, type: 'branch' },
            { x: 6110, dy: -285, w: 155, type: 'spirit' },
            { x: 6470, dy: -175, w: 165, type: 'stone' },
          ]
        : [
            { x: 410, dy: -125, w: 150, type: 'stone' },
            { x: 670, dy: -220, w: 150, type: 'spirit' },
            { x: 960, dy: -150, w: 155, type: 'branch' },
            { x: 1510, dy: -250, w: 160, type: 'spirit' },
            { x: 1860, dy: -165, w: 155, type: 'stone' },
            { x: 2180, dy: -275, w: 150, type: 'spirit' },
            { x: 2560, dy: -155, w: 165, type: 'branch' },
            { x: 3160, dy: -265, w: 160, type: 'spirit' },
            { x: 3540, dy: -170, w: 155, type: 'stone' },
            { x: 3920, dy: -275, w: 165, type: 'spirit' },
            { x: 4320, dy: -160, w: 160, type: 'branch' },
            { x: 4920, dy: -255, w: 160, type: 'spirit' },
            { x: 5280, dy: -175, w: 160, type: 'stone' },
            { x: 5690, dy: -290, w: 160, type: 'spirit' },
            { x: 6080, dy: -190, w: 170, type: 'branch' },
            { x: 6480, dy: -270, w: 165, type: 'spirit' },
          ];

  const platforms: Platform[] = platformDefs.map((p) => {
    const gy = getTerrainY(p.x + p.w * 0.5, levelId);
    return {
      x: p.x,
      y: gy + p.dy,
      w: p.w,
      type: p.type,
      glow: p.type === 'spirit' ? 0.35 : 0.65,
    };
  });

  // Drifting Skywood / Cloud Platforms (featured heavily in Level 3 + bonus in Level 2)
  const movingDefs: Array<{
    x: number;
    dy: number;
    w: number;
    dx: number;
    ampY: number;
    speed: number;
  }> =
    levelId === 3
      ? [
          { x: 1220, dy: -175, w: 130, dx: 95, ampY: 0, speed: 1.3 },
          { x: 2860, dy: -215, w: 135, dx: 0, ampY: 65, speed: 1.4 },
          { x: 3740, dy: -225, w: 135, dx: 105, ampY: 18, speed: 1.2 },
          { x: 4540, dy: -215, w: 140, dx: 95, ampY: 0, speed: 1.35 },
          { x: 5500, dy: -235, w: 135, dx: 0, ampY: 70, speed: 1.4 },
          { x: 6280, dy: -235, w: 140, dx: 100, ampY: 0, speed: 1.25 },
        ]
      : levelId === 2
        ? [
            { x: 2040, dy: -195, w: 130, dx: 85, ampY: 0, speed: 1.15 },
            { x: 4460, dy: -205, w: 130, dx: 0, ampY: 55, speed: 1.2 },
          ]
        : [];

  const movingPlatforms: MovingPlatform[] = movingDefs.map((mp, idx) => {
    const baseY = getTerrainY(mp.x, levelId) + mp.dy;
    return {
      baseX: mp.x,
      baseY,
      x: mp.x,
      y: baseY,
      prevX: mp.x,
      prevY: baseY,
      w: mp.w,
      dx: mp.dx,
      dy: mp.ampY,
      speed: mp.speed,
      phase: idx * 1.1,
    };
  });

  // Aerial Spirit Ring Boosters (signature Level 3 skyward mechanic + bonus in Level 2)
  const skyRingDefs: Array<[number, number]> =
    levelId === 3
      ? [
          [1060, -255],
          [1980, -270],
          [2720, -290],
          [3420, -295],
          [4210, -290],
          [5120, -295],
          [5940, -305],
        ]
      : levelId === 2
        ? [
            [1720, -275],
            [4150, -295],
          ]
        : [];

  const skyRings: SkyRing[] = skyRingDefs.map(([rx, dy], idx) => ({
    x: rx,
    y: getTerrainY(rx, levelId) + dy,
    r: 32,
    cooldown: 0,
    phase: idx * 0.9,
  }));

  const mushXs =
    levelId === 1
      ? [370, 860, 1160, 1740, 2360, 2860, 3460, 4120, 4790, 5330, 5980, 6620]
      : levelId === 2
        ? [330, 820, 1120, 1720, 2380, 2810, 3490, 4160, 4860, 5310, 6010, 6680]
        : [350, 880, 1410, 1790, 2380, 2980, 3660, 4190, 4810, 5420, 5960, 6640];
  const mushrooms: GlowMushroom[] = mushXs.map((mx, i) => ({
    x: mx,
    y: getTerrainY(mx, levelId),
    r: 28 + (i % 2) * 6,
    h: 34 + (i % 3) * 6,
    bounce: 0,
    hue:
      levelId === 1
        ? i % 2 === 0
          ? '#5cf7d8'
          : '#ff8be6'
        : levelId === 2
          ? i % 2 === 0
            ? '#ffb36b'
            : '#d18cff'
          : i % 2 === 0
            ? '#8cecff'
            : '#d7a8ff',
  }));

  const windXs =
    levelId === 1
      ? [1410, 3140, 4440, 5620, 6280]
      : levelId === 2
        ? [1370, 2720, 3810, 4960, 5920, 6360]
        : [1640, 2740, 3880, 5140, 6240];
  const windStreams: WindStream[] = windXs.map((wx) => {
    const gy = getTerrainY(wx, levelId);
    return {
      x: wx,
      yTop: gy - 350,
      yBot: gy - 15,
      w: 88,
      phase: rng() * Math.PI * 2,
    };
  });

  const lanternXs =
    levelId === 1
      ? [820, 1680, 2540, 3380, 4300, 5180, 6020, 6940]
      : levelId === 2
        ? [760, 1650, 2480, 3390, 4240, 5190, 6080, 6940]
        : [790, 1690, 2510, 3370, 4280, 5210, 6120, 6960];
  const lanterns: SpiritLantern[] = lanternXs.map((lx) => ({
    x: lx,
    y: getTerrainY(lx, levelId),
    lit: false,
    glow: 0,
  }));

  const orbSpots: Array<[number, number]> =
    levelId === 1
      ? [
          [290, -45], [500, -165], [715, -245], [1040, -180],
          [1305, -270], [1450, -305], [1590, -195], [1945, -210],
          [2220, -295], [2735, -185], [3020, -280], [3180, -320],
          [3320, -205], [3645, -300], [3970, -225], [4315, -315],
          [4480, -330], [4665, -200], [5195, -190], [5490, -290],
          [5660, -315], [5835, -225], [6160, -325], [6505, -215],
        ]
      : levelId === 2
        ? [
            [260, -45], [465, -170], [705, -265], [995, -195],
            [1260, -305], [1410, -325], [1595, -210], [1915, -300],
            [2290, -195], [2615, -290], [2970, -215], [3320, -325],
            [3655, -205], [4020, -295], [4365, -220], [4730, -315],
            [4985, -310], [5140, -200], [5470, -305], [5825, -240],
            [6185, -335], [6390, -315], [6550, -225], [6850, -135],
            [7040, -65], [7160, -110],
          ]
        : [
            [270, -50], [485, -175], [745, -270], [1035, -200],
            [1285, -225], [1590, -300], [1935, -215], [2255, -325],
            [2640, -205], [2925, -275], [3240, -315], [3615, -220],
            [3995, -325], [4395, -210], [4605, -265], [4995, -305],
            [5355, -225], [5565, -295], [5765, -340], [6155, -240],
            [6345, -285], [6555, -320], [6845, -145], [7060, -70],
          ];

  const blossomSpots: Array<[number, number]> =
    levelId === 1
      ? [
          [620, -120], [1860, -230], [2480, -125], [3560, -315],
          [4950, -125], [6080, -340],
        ]
      : levelId === 2
        ? [
            [540, -125], [1180, -320], [2620, -125], [3240, -340],
            [4650, -330], [4780, -125], [6110, -350], [6780, -125],
          ]
        : [
            [580, -125], [1510, -305], [2420, -125], [3160, -320],
            [4690, -125], [5690, -345], [6480, -325], [6840, -125],
          ];

  const crystalSpots: Array<[number, number]> =
    levelId === 1
      ? [
          [1410, -325], [2150, -310], [3140, -345], [4440, -350], [5620, -335],
        ]
      : levelId === 2
        ? [
            [1370, -345], [1840, -315], [2720, -345], [3810, -340],
            [4960, -345], [5920, -340], [6360, -355],
          ]
        : [
            [1640, -345], [2180, -335], [2740, -350], [3880, -350],
            [5140, -355], [6240, -350],
          ];

  const starseedSpots: Array<[number, number]> =
    levelId === 1
      ? [
          [1230, -285], [3560, -310], [6080, -340],
        ]
      : levelId === 2
        ? [
            [1720, -340], [3240, -345], [4150, -355], [6110, -350],
          ]
        : [
            [1060, -315], [1980, -330], [2720, -350], [3420, -355],
            [4210, -350], [5120, -355], [5940, -365],
          ];

  const collectibles: CollectibleItem[] = [
    ...orbSpots.map(([ox, dy], idx) => {
      const y = getTerrainY(ox, levelId) + dy;
      return { x: ox, y, baseY: y, kind: 'orb' as const, collected: false, phase: idx * 0.7 };
    }),
    ...blossomSpots.map(([bx, dy], idx) => {
      const y = getTerrainY(bx, levelId) + dy;
      return { x: bx, y, baseY: y, kind: 'blossom' as const, collected: false, phase: idx * 1.1 };
    }),
    ...crystalSpots.map(([cx, dy], idx) => {
      const y = getTerrainY(cx, levelId) + dy;
      return { x: cx, y, baseY: y, kind: 'crystal' as const, collected: false, phase: idx * 1.3 };
    }),
    ...starseedSpots.map(([sx, dy], idx) => {
      const y = getTerrainY(sx, levelId) + dy;
      return { x: sx, y, baseY: y, kind: 'starseed' as const, collected: false, phase: idx * 1.5 };
    }),
  ];

  const grassTufts: GrassTuft[] = [];
  for (let x = 20; x < WORLD_WIDTH - 20; x += 14 + rng() * 14) {
    const gy = getTerrainY(x, levelId);
    grassTufts.push({
      x,
      y: gy,
      h: 12 + rng() * 20,
      bend: 0,
      bendVel: 0,
      hasFlower: rng() > 0.75,
      flowerHue:
        levelId === 1
          ? rng() > 0.5
            ? '#7cfce6'
            : rng() > 0.5
              ? '#ffd485'
              : '#ff9ee8'
          : levelId === 2
            ? rng() > 0.5
              ? '#ffc478'
              : rng() > 0.5
                ? '#e09eff'
                : '#ff8da1'
            : rng() > 0.5
              ? '#9ef5ff'
              : rng() > 0.5
                ? '#d6b8ff'
                : '#ffffff',
    });
  }

  const floatingSpores: FloatingSpore[] = [];
  for (let i = 0; i < 85; i++) {
    floatingSpores.push({
      x: rng() * 1600,
      y: rng() * 900,
      r: 1.2 + rng() * 2.4,
      vx: -10 + rng() * 20,
      vy: -14 - rng() * 14,
      phase: rng() * Math.PI * 2,
      depth: 0.4 + rng() * 0.9,
    });
  }

  const wispXs =
    levelId === 1
      ? [2320, 3040, 3760, 4520, 5260, 5940, 6540]
      : levelId === 2
        ? [1480, 2120, 2980, 3690, 4460, 5280, 6040, 6640]
        : [1320, 2060, 2820, 3580, 4440, 5340, 6180, 6720];
  const thornWisps: ThornWisp[] = wispXs.map((wx, idx) => {
    const gy = getTerrainY(wx, levelId);
    return {
      x: wx,
      y: gy - 44,
      baseX: wx,
      baseY: gy - 44,
      patrolRange: 75 + (idx % 2) * 35,
      speed: (levelId >= 2 ? 1.08 : 0.9) + (idx % 3) * 0.22,
      phase: idx * 1.4,
      telegraphTimer: 0,
      stunnedTimer: 0,
    };
  });

  const butterflies: WoodlandButterfly[] = [];
  for (let x = 320; x < 7000; x += 480 + rng() * 340) {
    const gy = getTerrainY(x, levelId) - 55 - rng() * 70;
    butterflies.push({
      x,
      y: gy,
      homeX: x,
      homeY: gy,
      vx: 0,
      vy: 0,
      phase: rng() * Math.PI * 2,
      color:
        levelId === 1
          ? rng() > 0.5
            ? '#96fff0'
            : '#ffd889'
          : levelId === 2
            ? rng() > 0.5
              ? '#ffd485'
              : '#e0a8ff'
            : rng() > 0.5
              ? '#9ef5ff'
              : '#ffd1f3',
    });
  }

  const creatures: MagicalCreature[] = [];
  let creatureId = 1;

  const fairyConfigs: Array<[number, number]> =
    levelId === 1
      ? [
          [410, -72], [1160, -90], [1980, -82], [2820, -95],
          [3640, -88], [4620, -96], [5540, -84], [6620, -92],
        ]
      : levelId === 2
        ? [
            [460, -80], [1240, -98], [2020, -85], [2880, -94],
            [3840, -90], [4720, -96], [5680, -88], [6680, -95],
          ]
        : [
            [440, -84], [1180, -95], [1940, -92], [2780, -96],
            [3680, -90], [4580, -98], [5520, -90], [6640, -95],
          ];

  for (const [fx, dy] of fairyConfigs) {
    const gy = getTerrainY(fx, levelId) + dy;
    const isAlt = creatureId % 2 === 0;
    creatures.push({
      id: creatureId++,
      kind: 'fairy',
      x: fx,
      y: gy,
      homeX: fx,
      homeY: gy,
      emerge: 0,
      emergedOnce: false,
      blessed: false,
      blessTimer: 0,
      phase: rng() * Math.PI * 2,
      facing: isAlt ? -1 : 1,
      huePrimary:
        levelId === 1
          ? isAlt
            ? '#7cfce7'
            : '#ff9ee8'
          : levelId === 2
            ? isAlt
              ? '#ffd67a'
              : '#ff94c2'
            : isAlt
              ? '#9ef5ff'
              : '#d5b8ff',
      hueAccent: levelId === 1 ? '#ffe89c' : levelId === 2 ? '#ffe6a8' : '#ffffff',
    });
  }

  const mermaidXs =
    levelId === 1
      ? [740, 1840, 3160, 4430, 5880]
      : levelId === 2
        ? [920, 2240, 3680, 5040, 6240]
        : [810, 2080, 3440, 4880, 6160];

  for (const mx of mermaidXs) {
    const gy = getTerrainY(mx, levelId);
    const isAlt = creatureId % 2 === 0;
    creatures.push({
      id: creatureId++,
      kind: 'mermaid',
      x: mx,
      y: gy,
      homeX: mx,
      homeY: gy,
      emerge: 0,
      emergedOnce: false,
      blessed: false,
      blessTimer: 0,
      phase: rng() * Math.PI * 2,
      facing: -1,
      huePrimary:
        levelId === 1
          ? isAlt
            ? '#4ee6cf'
            : '#6bb8ff'
          : levelId === 2
            ? isAlt
              ? '#d48cff'
              : '#ff8ea8'
            : isAlt
              ? '#78e3ff'
              : '#b8a6ff',
      hueAccent: '#fff0c4',
    });
  }

  const foxXs =
    levelId === 1
      ? [980, 2520, 4120, 6280]
      : levelId === 2
        ? [680, 2580, 4280, 6460]
        : [1040, 2560, 4160, 6420];

  for (const fxx of foxXs) {
    const gy = getTerrainY(fxx, levelId);
    creatures.push({
      id: creatureId++,
      kind: 'fox',
      x: fxx,
      y: gy,
      homeX: fxx,
      homeY: gy,
      emerge: 0,
      emergedOnce: false,
      blessed: false,
      blessTimer: 0,
      phase: rng() * Math.PI * 2,
      facing: creatureId % 2 === 0 ? 1 : -1,
      huePrimary:
        levelId === 1 ? '#ffd085' : levelId === 2 ? '#ff9d76' : '#c2efff',
      hueAccent:
        levelId === 1 ? '#7cfce7' : levelId === 2 ? '#ffe399' : '#c7b8ff',
    });
  }

  const owlSpots: Array<[number, number]> =
    levelId === 1
      ? [
          [620, -145], [2480, -145], [4950, -145], [6820, -145],
        ]
      : levelId === 2
        ? [
            [540, -145], [2620, -145], [4780, -145], [6780, -145],
          ]
        : [
            [580, -145], [2420, -145], [4690, -145], [6840, -145],
          ];

  for (const [ox, ody] of owlSpots) {
    const oy = getTerrainY(ox, levelId) + ody;
    creatures.push({
      id: creatureId++,
      kind: 'owl',
      x: ox,
      y: oy,
      homeX: ox,
      homeY: oy,
      emerge: 0,
      emergedOnce: false,
      blessed: false,
      blessTimer: 0,
      phase: rng() * Math.PI * 2,
      facing: -1,
      huePrimary:
        levelId === 1 ? '#cbe8ff' : levelId === 2 ? '#e5c4ff' : '#e6f9ff',
      hueAccent: '#ffe299',
    });
  }

  return {
    levelId,
    stars,
    skyLanterns,
    mountains,
    farTrees,
    midTrees,
    nearTrees,
    fgSilhouettes,
    waterfalls,
    stoneArches,
    platforms,
    movingPlatforms,
    skyRings,
    mushrooms,
    windStreams,
    lanterns,
    collectibles,
    grassTufts,
    floatingSpores,
    thornWisps,
    butterflies,
    creatures,
  };
}
