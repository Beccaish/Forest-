export type ShopCategory = 'power' | 'hat' | 'cloak' | 'charm';

export type ShopItemId =
  | 'moss_crown'
  | 'moon_halo'
  | 'frost_antlers'
  | 'sunflower_crown'
  | 'coral_tiara'
  | 'astral_wizard'
  | 'knight_helm'
  | 'ranger_hood'
  | 'fairy_sparkle_tiara'
  | 'sunset_ember'
  | 'starweave_mantle'
  | 'prism_aurora'
  | 'sakura_petal'
  | 'ocean_tide'
  | 'shadow_velvet'
  | 'ranger_cape'
  | 'dragonscale_cloak'
  | 'fairy_gossamer'
  | 'firefly_sprite'
  | 'wind_boots'
  | 'sanctuary_heart'
  | 'mini_owl'
  | 'fairy_sparkle_wand'
  | 'knight_crest'
  | 'super_sky_leap'
  | 'super_nova_pulse'
  | 'super_star_magnet'
  | 'super_phoenix_wings'
  | 'super_dragon_wings'
  | 'super_fairy_sparkle';

export interface ShopItem {
  id: ShopItemId;
  name: string;
  category: ShopCategory;
  price: number;
  shortPerk: string;
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
    shortPerk: 'Triple jump + glowing wind rings',
    description: 'Super Power: Permanent triple jump and +12% jump height with glowing wind rings.',
    accentColor: '#14b89a',
  },
  {
    id: 'super_nova_pulse',
    name: 'Solar Nova Pulse',
    category: 'power',
    price: 170,
    shortPerk: 'Huge golden pulse + longer stun',
    description: 'Super Power: Huge golden Spirit Pulse that pulls nearby items and stuns baddies longer.',
    accentColor: '#e59a1a',
  },
  {
    id: 'super_star_magnet',
    name: 'Cosmic Magnet Aura',
    category: 'power',
    price: 210,
    shortPerk: 'Pulls treasures + 7.5s flower flight',
    description: 'Super Power: Pulls all treasures from 245px away and extends Flying Flowers to 7.5s.',
    accentColor: '#d946ef',
  },
  {
    id: 'super_fairy_sparkle',
    name: 'Archfey Sparkle Aura',
    category: 'power',
    price: 245,
    shortPerk: 'Boosted jumps + 50% Dewdrops',
    description: 'Super Power: Swirling fairy dust boosts jump height and grants +50% bonus Dewdrops.',
    accentColor: '#ec4899',
  },
  {
    id: 'super_phoenix_wings',
    name: 'Phoenix Wing Glide',
    category: 'power',
    price: 280,
    shortPerk: 'Fiery wing flight + slow heal',
    description: 'Super Power: Fiery wings for soaring low-sink glides and slow Spirit Petal healing.',
    accentColor: '#ea580c',
  },
  {
    id: 'super_dragon_wings',
    name: 'Emerald Dragon Wings',
    category: 'power',
    price: 295,
    shortPerk: 'Drake flight + 20% speed',
    description: 'Super Power: Mighty drake wings for +20% speed, soaring glide, and dash-knockback.',
    accentColor: '#0f9d76',
  },

  // Headwear
  {
    id: 'moss_crown',
    name: 'Moss Blossom Crown',
    category: 'hat',
    price: 50,
    shortPerk: 'Emerald leaves + woodland buds',
    description: 'Woven emerald leaves crowned with sunlit woodland buds.',
    accentColor: '#10b981',
  },
  {
    id: 'sunflower_crown',
    name: 'Sunpetal Tiara',
    category: 'hat',
    price: 85,
    shortPerk: 'Golden petals + amber sunstone',
    description: 'Radiant golden petals woven around a warm amber sunstone.',
    accentColor: '#eab308',
  },
  {
    id: 'moon_halo',
    name: 'Moonpetal Halo',
    category: 'hat',
    price: 110,
    shortPerk: 'Floating silver crescent circlet',
    description: 'A floating crescent circlet humming with silver moonlight.',
    accentColor: '#0ea5e9',
  },
  {
    id: 'ranger_hood',
    name: 'Woodland Ranger Hood',
    category: 'hat',
    price: 120,
    shortPerk: 'Forest scout hood + oak pin',
    description: 'Pointed forest-scout hood fastened with a golden oak-leaf pin.',
    accentColor: '#16a34a',
  },
  {
    id: 'coral_tiara',
    name: 'Coral Mermaid Crest',
    category: 'hat',
    price: 145,
    shortPerk: 'Lagoon pearl crown',
    description: 'Shimmering lagoon-pearl crest gifted by deep-water mermaids.',
    accentColor: '#ec4899',
  },
  {
    id: 'fairy_sparkle_tiara',
    name: 'Pixie Prism Circlet',
    category: 'hat',
    price: 155,
    shortPerk: 'Pink-gold fairy stardust tiara',
    description: 'Gossamer fairy circlet crowned with floating pink-gold stardust.',
    accentColor: '#d946ef',
  },
  {
    id: 'knight_helm',
    name: 'Silverwood Knight Helm',
    category: 'hat',
    price: 165,
    shortPerk: 'Silver visor + emerald plume',
    description: 'Gleaming forest knight visor topped with a windswept emerald plume.',
    accentColor: '#3b82f6',
  },
  {
    id: 'frost_antlers',
    name: 'Frost Crystal Antlers',
    category: 'hat',
    price: 180,
    shortPerk: 'Crystalline skywood antlers',
    description: 'Crystalline skywood antlers forged from eternal frost.',
    accentColor: '#6366f1',
  },
  {
    id: 'astral_wizard',
    name: 'Starlight Mage Hat',
    category: 'hat',
    price: 210,
    shortPerk: 'Enchanted cap + glowing star',
    description: 'Pointed enchanted woodland cap with a glowing celestial star.',
    accentColor: '#8b5cf6',
  },

  // Cloaks
  {
    id: 'sunset_ember',
    name: 'Sunset Ember Cloak',
    category: 'cloak',
    price: 70,
    shortPerk: 'Warm amber mantle + scarf',
    description: 'Warm amber-coral mantle with a glowing autumn scarf.',
    accentColor: '#f97316',
  },
  {
    id: 'sakura_petal',
    name: 'Blossom Wing Shroud',
    category: 'cloak',
    price: 105,
    shortPerk: 'Rosy petal cloak + gold trim',
    description: 'Rosy petal-soft mantle edged with golden dawn embroidery.',
    accentColor: '#ec4899',
  },
  {
    id: 'ranger_cape',
    name: 'Forest Ranger Mantle',
    category: 'cloak',
    price: 130,
    shortPerk: 'Moss trailblazer cape + clasp',
    description: 'Moss-green trailblazer cloak pinned with a weathered bronze clasp.',
    accentColor: '#15803d',
  },
  {
    id: 'starweave_mantle',
    name: 'Starweave Mantle',
    category: 'cloak',
    price: 140,
    shortPerk: 'Indigo cloak + woven stars',
    description: 'Deep twilight cloak threaded with shimmering indigo starlight.',
    accentColor: '#4f46e5',
  },
  {
    id: 'ocean_tide',
    name: 'Tideweave Lagoon Cape',
    category: 'cloak',
    price: 175,
    shortPerk: 'Sapphire seafoam wave cape',
    description: 'Sapphire and seafoam cape shimmering like underwater light.',
    accentColor: '#0284c7',
  },
  {
    id: 'fairy_gossamer',
    name: 'Starlight Fairy Shroud',
    category: 'cloak',
    price: 190,
    shortPerk: 'Iridescent pixie dust cape',
    description: 'Iridescent gossamer cape dusted with sparkling pixie stardust.',
    accentColor: '#c026d3',
  },
  {
    id: 'prism_aurora',
    name: 'Prism Aurora Cape',
    category: 'cloak',
    price: 220,
    shortPerk: 'Northern aurora color-shift cape',
    description: 'Iridescent spirit cloak that trails northern aurora light.',
    accentColor: '#0d9488',
  },
  {
    id: 'dragonscale_cloak',
    name: 'Ember Dragonscale Cape',
    category: 'cloak',
    price: 235,
    shortPerk: 'Crimson scaled drake cape',
    description: 'Crimson scaled drake cape rimmed with molten golden armor trim.',
    accentColor: '#dc2626',
  },
  {
    id: 'shadow_velvet',
    name: 'Nightshade Royal Cape',
    category: 'cloak',
    price: 250,
    shortPerk: 'Midnight plum royal cape',
    description: 'Velvet midnight-plum cloak trimmed with luminous royal violet.',
    accentColor: '#7c3aed',
  },

  // Relics & Gear
  {
    id: 'firefly_sprite',
    name: 'Firefly Companion',
    category: 'charm',
    price: 90,
    shortPerk: 'Orbiting buddy draws gems in',
    description: 'Orbits beside you and draws nearby Lumina & Star Seeds in.',
    accentColor: '#d97706',
  },
  {
    id: 'wind_boots',
    name: 'Windweaver Anklets',
    category: 'charm',
    price: 160,
    shortPerk: '+15% run speed + soft glide',
    description: 'Winged ribbons granting +15% run speed and gentler gliding.',
    accentColor: '#0d9488',
  },
  {
    id: 'fairy_sparkle_wand',
    name: 'Pixie Dust Lantern',
    category: 'charm',
    price: 175,
    shortPerk: 'Sparkles + longer flight boosts',
    description: 'Trails fairy sparkles and extends Crystal Boost & Flying Flower duration +2.5s.',
    accentColor: '#c026d3',
  },
  {
    id: 'mini_owl',
    name: 'Starlight Owlet',
    category: 'charm',
    price: 195,
    shortPerk: 'Owlet buddy (+40% Dewdrops)',
    description: 'A loyal glowing owlet companion that grants +40% bonus Dewdrops.',
    accentColor: '#0284c7',
  },
  {
    id: 'knight_crest',
    name: 'Verdant Knight Shield',
    category: 'charm',
    price: 205,
    shortPerk: 'Blocks 1 hit every 22s',
    description: 'Orbiting enchanted shield that blocks 1 enemy hit every 22 seconds.',
    accentColor: '#2563eb',
  },
  {
    id: 'sanctuary_heart',
    name: 'Sanctuary Heart Charm',
    category: 'charm',
    price: 240,
    shortPerk: '+1 max Petal & faster pulse',
    description: 'Grants +1 max Spirit Petal (4 total) and faster Pulse recharge.',
    accentColor: '#e11d48',
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
