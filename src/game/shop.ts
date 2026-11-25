export type ShopCategory = 'hat' | 'cloak' | 'charm';

export type ShopItemId =
  | 'moss_crown'
  | 'moon_halo'
  | 'frost_antlers'
  | 'sunset_ember'
  | 'starweave_mantle'
  | 'prism_aurora'
  | 'firefly_sprite'
  | 'wind_boots'
  | 'sanctuary_heart';

export interface ShopItem {
  id: ShopItemId;
  name: string;
  category: ShopCategory;
  price: number;
  description: string;
  accentColor: string;
}

export interface PlayerLoadout {
  hat: ShopItemId | null;
  cloak: ShopItemId | null;
  charm: ShopItemId | null;
}

export interface SavedShopProgress {
  dewdrops: number;
  ownedIds: ShopItemId[];
  equipped: PlayerLoadout;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'moss_crown',
    name: 'Moss Blossom Crown',
    category: 'hat',
    price: 50,
    description: 'Woven emerald leaves crowned with sunlit woodland buds.',
    accentColor: '#69f0bd',
  },
  {
    id: 'moon_halo',
    name: 'Moonpetal Halo',
    category: 'hat',
    price: 110,
    description: 'A floating crescent circlet humming with silver moonlight.',
    accentColor: '#9ef4ff',
  },
  {
    id: 'frost_antlers',
    name: 'Frost Crystal Antlers',
    category: 'hat',
    price: 180,
    description: 'Crystalline skywood antlers forged from eternal frost.',
    accentColor: '#c7b8ff',
  },
  {
    id: 'sunset_ember',
    name: 'Sunset Ember Cloak',
    category: 'cloak',
    price: 70,
    description: 'Warm amber-coral mantle with a glowing autumn scarf.',
    accentColor: '#ffb86c',
  },
  {
    id: 'starweave_mantle',
    name: 'Starweave Mantle',
    category: 'cloak',
    price: 140,
    description: 'Deep twilight cloak threaded with shimmering indigo starlight.',
    accentColor: '#a6a8ff',
  },
  {
    id: 'prism_aurora',
    name: 'Prism Aurora Cape',
    category: 'cloak',
    price: 220,
    description: 'Iridescent spirit cloak that trails northern aurora light.',
    accentColor: '#7cfce7',
  },
  {
    id: 'firefly_sprite',
    name: 'Firefly Companion',
    category: 'charm',
    price: 90,
    description: 'Orbits beside you and draws nearby Lumina & Star Seeds in.',
    accentColor: '#ffe18c',
  },
  {
    id: 'wind_boots',
    name: 'Windweaver Anklets',
    category: 'charm',
    price: 160,
    description: 'Winged ribbons granting +15% run speed and gentler gliding.',
    accentColor: '#8cf8e8',
  },
  {
    id: 'sanctuary_heart',
    name: 'Sanctuary Heart Charm',
    category: 'charm',
    price: 240,
    description: 'Grants +1 max Spirit Petal (4 total) and faster Pulse recharge.',
    accentColor: '#ff9ec7',
  },
];

const STORAGE_KEY = 'whispering_grove_shop_v1';

const DEFAULT_PROGRESS: SavedShopProgress = {
  dewdrops: 60,
  ownedIds: [],
  equipped: {
    hat: null,
    cloak: null,
    charm: null,
  },
};

export function loadShopProgress(): SavedShopProgress {
  if (typeof window === 'undefined') return cloneProgress(DEFAULT_PROGRESS);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneProgress(DEFAULT_PROGRESS);
    const parsed = JSON.parse(raw) as Partial<SavedShopProgress>;
    const validIds = new Set(SHOP_ITEMS.map((item) => item.id));
    const ownedIds = Array.isArray(parsed.ownedIds)
      ? parsed.ownedIds.filter((id): id is ShopItemId => validIds.has(id))
      : [];
    const ownedSet = new Set(ownedIds);
    const eq = parsed.equipped;
    return {
      dewdrops:
        typeof parsed.dewdrops === 'number' && Number.isFinite(parsed.dewdrops)
          ? Math.max(0, Math.floor(parsed.dewdrops))
          : DEFAULT_PROGRESS.dewdrops,
      ownedIds,
      equipped: {
        hat: eq?.hat && ownedSet.has(eq.hat) ? eq.hat : null,
        cloak: eq?.cloak && ownedSet.has(eq.cloak) ? eq.cloak : null,
        charm: eq?.charm && ownedSet.has(eq.charm) ? eq.charm : null,
      },
    };
  } catch {
    return cloneProgress(DEFAULT_PROGRESS);
  }
}

export function saveShopProgress(progress: SavedShopProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota or private-mode errors gracefully
  }
}

export function cloneProgress(p: SavedShopProgress): SavedShopProgress {
  return {
    dewdrops: p.dewdrops,
    ownedIds: [...p.ownedIds],
    equipped: { ...p.equipped },
  };
}
