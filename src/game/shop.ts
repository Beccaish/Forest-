export type ShopCategory = 'power' | 'hat' | 'cloak' | 'charm';

export type ShopItemId =
  | 'moss_crown'
  | 'moon_halo'
  | 'frost_antlers'
  | 'sunflower_crown'
  | 'coral_tiara'
  | 'astral_wizard'
  | 'sunset_ember'
  | 'starweave_mantle'
  | 'prism_aurora'
  | 'sakura_petal'
  | 'ocean_tide'
  | 'shadow_velvet'
  | 'firefly_sprite'
  | 'wind_boots'
  | 'sanctuary_heart'
  | 'mini_owl'
  | 'super_sky_leap'
  | 'super_nova_pulse'
  | 'super_star_magnet'
  | 'super_phoenix_wings';

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
  power: ShopItemId | null;
}

export interface SavedShopProgress {
  dewdrops: number;
  ownedIds: ShopItemId[];
  equipped: PlayerLoadout;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Super Powers
  {
    id: 'super_sky_leap',
    name: 'Skybound Triple Leap',
    category: 'power',
    price: 130,
    description: 'Super Power: Permanent triple jump and +15% jump height with glowing wind rings.',
    accentColor: '#7cfce7',
  },
  {
    id: 'super_nova_pulse',
    name: 'Solar Nova Pulse',
    category: 'power',
    price: 170,
    description: 'Super Power: Huge golden Spirit Pulse that pulls nearby items and stuns baddies longer.',
    accentColor: '#ffd86b',
  },
  {
    id: 'super_star_magnet',
    name: 'Cosmic Magnet Aura',
    category: 'power',
    price: 210,
    description: 'Super Power: Pulls all treasures from 245px away and extends Flying Flowers to 7.5s.',
    accentColor: '#ff9ee8',
  },
  {
    id: 'super_phoenix_wings',
    name: 'Phoenix Wing Glide',
    category: 'power',
    price: 280,
    description: 'Super Power: Fiery wings for soaring low-sink glides and slow Spirit Petal healing.',
    accentColor: '#ff935c',
  },

  // Headwear
  {
    id: 'moss_crown',
    name: 'Moss Blossom Crown',
    category: 'hat',
    price: 50,
    description: 'Woven emerald leaves crowned with sunlit woodland buds.',
    accentColor: '#69f0bd',
  },
  {
    id: 'sunflower_crown',
    name: 'Sunpetal Tiara',
    category: 'hat',
    price: 85,
    description: 'Radiant golden petals woven around a warm amber sunstone.',
    accentColor: '#ffd666',
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
    id: 'coral_tiara',
    name: 'Coral Mermaid Crest',
    category: 'hat',
    price: 145,
    description: 'Shimmering lagoon-pearl crest gifted by deep-water mermaids.',
    accentColor: '#5ef2ff',
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
    id: 'astral_wizard',
    name: 'Starlight Witch Hat',
    category: 'hat',
    price: 210,
    description: 'Pointed enchanted woodland cap with a glowing celestial star.',
    accentColor: '#d8a6ff',
  },

  // Cloaks
  {
    id: 'sunset_ember',
    name: 'Sunset Ember Cloak',
    category: 'cloak',
    price: 70,
    description: 'Warm amber-coral mantle with a glowing autumn scarf.',
    accentColor: '#ffb86c',
  },
  {
    id: 'sakura_petal',
    name: 'Blossom Wing Shroud',
    category: 'cloak',
    price: 105,
    description: 'Rosy petal-soft mantle edged with golden dawn embroidery.',
    accentColor: '#ff9ee4',
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
    id: 'ocean_tide',
    name: 'Tideweave Lagoon Cape',
    category: 'cloak',
    price: 175,
    description: 'Sapphire and seafoam cape shimmering like underwater light.',
    accentColor: '#48e5ff',
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
    id: 'shadow_velvet',
    name: 'Nightshade Royal Cape',
    category: 'cloak',
    price: 250,
    description: 'Velvet midnight-plum cloak trimmed with luminous royal violet.',
    accentColor: '#c28cff',
  },

  // Relics & Gear
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
    id: 'mini_owl',
    name: 'Starlight Owlet',
    category: 'charm',
    price: 195,
    description: 'A loyal glowing owlet companion that grants +40% bonus Dewdrops.',
    accentColor: '#a8ebff',
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
    power: null,
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
        power: eq?.power && ownedSet.has(eq.power) ? eq.power : null,
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
