import React, { useEffect, useMemo, useState } from 'react';
import forestBackdropImg from '../assets/images/l1_emerald_glade_1795615998066.jpg';
import {
  SHOP_ITEMS,
  type PlayerLoadout,
  type SavedShopProgress,
  type ShopCategory,
  type ShopItem,
  type ShopItemId,
} from '../game/shop';

interface ShopModalProps {
  visible: boolean;
  progress: SavedShopProgress;
  onBuy: (id: ShopItemId) => void;
  onToggleEquip: (id: ShopItemId) => void;
  onClose: () => void;
}

type CategoryFilter = 'all' | ShopCategory;

const CATEGORY_TABS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'hat', label: 'Headwear' },
  { id: 'cloak', label: 'Cloaks' },
  { id: 'charm', label: 'Relics & Gear' },
];

const CLOAK_PALETTES: Record<
  string,
  { fill: string; highlight: string; scarf: string }
> = {
  default: { fill: '#226d68', highlight: '#7cfce7', scarf: '#7cfce7' },
  sunset_ember: { fill: '#a14328', highlight: '#ffb86c', scarf: '#ff9654' },
  starweave_mantle: { fill: '#3b4291', highlight: '#b8beff', scarf: '#98a2ff' },
  prism_aurora: { fill: '#197b84', highlight: '#94ffe6', scarf: '#e4b3ff' },
};

const DewdropIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 2.2C13.4 6.3 15.8 9.6 15.8 12.6C15.8 15.8 13.2 18 10 18C6.8 18 4.2 15.8 4.2 12.6C4.2 9.6 6.6 6.3 10 2.2Z"
      fill="#7cfce7"
      fillOpacity="0.4"
      stroke="#ffe194"
      strokeWidth="1.4"
    />
    <circle cx="8.4" cy="11.8" r="1.5" fill="#ffffff" />
  </svg>
);

const ItemIcon: React.FC<{ id: ShopItemId }> = ({ id }) => {
  switch (id) {
    case 'moss_crown':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M6 21C8 14 11 11 16 11C21 11 24 14 26 21"
            stroke="#59d99a"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path d="M10 15L8 10L13 12Z" fill="#7cfce7" />
          <path d="M22 15L24 10L19 12Z" fill="#7cfce7" />
          <circle cx="16" cy="10.5" r="2.6" fill="#ffd97d" />
        </svg>
      );
    case 'moon_halo':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <ellipse cx="16" cy="14" rx="9" ry="3.6" stroke="#9ef4ff" strokeWidth="2" />
          <path
            d="M16 5.5C13.5 7 13.5 10.5 16 12C13.2 11.8 11.4 10 11.4 8.2C11.4 6.5 13.4 5.4 16 5.5Z"
            fill="#e6fcff"
          />
        </svg>
      );
    case 'frost_antlers':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M11 24C9.5 18 7.5 14 6 8M9.5 16L6 14M10 12L12.5 9"
            stroke="#c7b8ff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M21 24C22.5 18 24.5 14 26 8M22.5 16L26 14M22 12L19.5 9"
            stroke="#c7b8ff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="16" cy="22" r="2.3" fill="#b4f5ff" />
        </svg>
      );
    case 'sunset_ember':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M10 8L22 8L25 24C20 26 12 26 7 24L10 8Z"
            fill="#a3422a"
            stroke="#ffb86c"
            strokeWidth="1.6"
          />
          <path d="M9 11H23" stroke="#ff9654" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );
    case 'starweave_mantle':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M10 8L22 8L25 24C20 26 12 26 7 24L10 8Z"
            fill="#384291"
            stroke="#a6a8ff"
            strokeWidth="1.6"
          />
          <circle cx="14" cy="16" r="1.2" fill="#e8ecff" />
          <circle cx="19" cy="20" r="1.2" fill="#e8ecff" />
          <circle cx="17" cy="13" r="1" fill="#e8ecff" />
        </svg>
      );
    case 'prism_aurora':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M10 8L22 8L25 24C20 26 12 26 7 24L10 8Z"
            fill="#1a7680"
            stroke="#7cfce7"
            strokeWidth="1.6"
          />
          <path d="M10 15C14 13 18 17 22 14" stroke="#ffe194" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M9 20C13 18 18 22 23 19" stroke="#e4b3ff" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'firefly_sprite':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="8" fill="#ffe18c" fillOpacity="0.28" />
          <ellipse cx="12.5" cy="13" rx="3.4" ry="2" transform="rotate(-25 12.5 13)" fill="#d9fff8" fillOpacity="0.9" />
          <ellipse cx="19.5" cy="13" rx="3.4" ry="2" transform="rotate(25 19.5 13)" fill="#d9fff8" fillOpacity="0.9" />
          <circle cx="16" cy="17" r="3.6" fill="#ffe18c" />
        </svg>
      );
    case 'wind_boots':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M8 18C12 18 15 15 18 11C18 15 16 19 12 21M12 22C17 22 21 19 24 14C23 19 20 23 14 25"
            stroke="#8cf8e8"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <circle cx="22" cy="11" r="2" fill="#ffe194" />
        </svg>
      );
    case 'sanctuary_heart':
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 25C16 25 7.5 19.4 7.5 13C7.5 9.8 10 7.5 12.8 7.5C14.5 7.5 15.5 8.4 16 9.5C16.5 8.4 17.5 7.5 19.2 7.5C22 7.5 24.5 9.8 24.5 13C24.5 19.4 16 25 16 25Z"
            fill="#ff9ec7"
            fillOpacity="0.4"
            stroke="#ff9ec7"
            strokeWidth="1.8"
          />
          <circle cx="16" cy="15" r="2.2" fill="#fff0f6" />
        </svg>
      );
  }
};

const AvatarPreviewSvg: React.FC<{ loadout: PlayerLoadout }> = ({ loadout }) => {
  const cloakPalette = CLOAK_PALETTES[loadout.cloak ?? 'default'] ?? CLOAK_PALETTES.default;
  const hat = loadout.hat;
  const charm = loadout.charm;

  return (
    <svg
      viewBox="0 0 180 180"
      className="h-36 w-36 sm:h-44 sm:w-44 rounded-lg border border-[#7cfce7]/25"
      role="img"
      aria-label="Spirit avatar preview with equipped or tried-on wearables and relics"
    >
      <defs>
        <linearGradient id="forestStageSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0e2a3f" />
          <stop offset="52%" stopColor="#1b545a" />
          <stop offset="100%" stopColor="#266b5c" />
        </linearGradient>
        <linearGradient id="sunbeamStage" x1="25%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#ffe59e" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#7cfce7" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="previewGlow" cx="50%" cy="54%" r="48%">
          <stop offset="0%" stopColor={cloakPalette.highlight} stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0c2630" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Enchanted Forest Stage Backdrop */}
      <rect x="0" y="0" width="180" height="180" rx="10" fill="url(#forestStageSky)" />
      <polygon points="36,0 82,0 138,160 66,160" fill="url(#sunbeamStage)" />

      {/* Distant tree silhouettes */}
      <path d="M10 155V55Q20 40 30 55V155Z" fill="#10383a" opacity="0.65" />
      <path d="M148 155V48Q160 32 172 48V155Z" fill="#10383a" opacity="0.65" />
      <circle cx="22" cy="52" r="24" fill="#184b49" opacity="0.7" />
      <circle cx="158" cy="46" r="26" fill="#184b49" opacity="0.7" />

      {/* Ambient stars & fireflies */}
      <circle cx="44" cy="30" r="1.6" fill="#ffe89e" opacity="0.85" />
      <circle cx="132" cy="26" r="1.8" fill="#a8fff0" opacity="0.85" />
      <circle cx="28" cy="96" r="1.4" fill="#ff9ee8" opacity="0.75" />
      <circle cx="152" cy="108" r="1.5" fill="#ffe89e" opacity="0.8" />

      <circle cx="90" cy="96" r="72" fill="url(#previewGlow)" />

      {/* Glowing mossy meadow knoll & flowers */}
      <path d="M0 146Q90 132 180 146V180H0Z" fill="#174d45" />
      <path d="M0 148Q90 135 180 148" stroke="#69f0bd" strokeOpacity="0.45" strokeWidth="1.6" fill="none" />
      <ellipse cx="90" cy="145" rx="34" ry="4.5" fill={cloakPalette.highlight} fillOpacity="0.22" />
      <circle cx="32" cy="154" r="2.6" fill="#ffd67a" />
      <circle cx="48" cy="158" r="2.2" fill="#ff9ee8" />
      <circle cx="136" cy="156" r="2.6" fill="#7cfce7" />
      <circle cx="149" cy="152" r="2.2" fill="#ffd67a" />

      {/* Flowing scarf */}
      <path
        d="M80 94C64 96 50 105 38 100C46 112 63 110 82 102Z"
        fill={cloakPalette.scarf}
        fillOpacity="0.92"
      />

      {/* Sanctuary Heart aura if active */}
      {charm === 'sanctuary_heart' && (
        <g>
          <circle
            cx="90"
            cy="96"
            r="46"
            stroke="#ff9ec7"
            strokeOpacity="0.6"
            strokeWidth="1.6"
            strokeDasharray="4 4"
            fill="none"
          />
          <path
            d="M142 66C142 66 135 61.5 135 56.5C135 54 137 52.2 139.2 52.2C140.5 52.2 141.5 53 142 54C142.5 53 143.5 52.2 144.8 52.2C147 52.2 149 54 149 56.5C149 61.5 142 66 142 66Z"
            fill="#ff9ec7"
          />
        </g>
      )}

      {/* Firefly companion if active */}
      {charm === 'firefly_sprite' && (
        <g>
          <circle cx="44" cy="64" r="12" fill="#ffe18c" fillOpacity="0.3" />
          <ellipse cx="40" cy="60" rx="4" ry="2.2" transform="rotate(-24 40 60)" fill="#dffff8" />
          <ellipse cx="48" cy="60" rx="4" ry="2.2" transform="rotate(24 48 60)" fill="#dffff8" />
          <circle cx="44" cy="64" r="3.8" fill="#ffe18c" />
        </g>
      )}

      {/* Spirit legs & boots */}
      <line x1="82" y1="120" x2="80" y2="141" stroke="#c8fff8" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="98" y1="120" x2="100" y2="141" stroke="#c8fff8" strokeWidth="3.5" strokeLinecap="round" />
      {charm === 'wind_boots' && (
        <g>
          <path d="M76 136L67 131L74 140Z" fill="#8cf8e8" />
          <path d="M104 136L113 131L106 140Z" fill="#8cf8e8" />
        </g>
      )}

      {/* Cloak body */}
      <path
        d="M74 88C74 79 106 79 106 88L114 126C101 131 79 131 66 126Z"
        fill={cloakPalette.fill}
        stroke={cloakPalette.highlight}
        strokeWidth="1.6"
      />
      {loadout.cloak === 'starweave_mantle' && (
        <g fill="#eef1ff">
          <circle cx="84" cy="105" r="1.4" />
          <circle cx="97" cy="112" r="1.5" />
          <circle cx="91" cy="119" r="1.2" />
        </g>
      )}
      {loadout.cloak === 'prism_aurora' && (
        <path
          d="M72 112C82 108 96 116 108 110"
          stroke="#ffe194"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Spirit Head & Hood */}
      <circle cx="90" cy="74" r="17" fill="#e9fffc" />
      <path
        d="M72 76C72 58 108 58 108 76C103 68 77 68 72 76Z"
        fill={cloakPalette.fill}
        stroke={cloakPalette.highlight}
        strokeWidth="1.4"
      />
      {/* Eyes */}
      <ellipse cx="85" cy="76" rx="2.3" ry="3.2" fill="#092129" />
      <ellipse cx="96" cy="76" rx="2.3" ry="3.2" fill="#092129" />
      <circle cx="85.8" cy="75" r="0.8" fill="#ffffff" />
      <circle cx="96.8" cy="75" r="0.8" fill="#ffffff" />

      {/* Headwear */}
      {hat === 'moss_crown' && (
        <g>
          <path
            d="M74 62C78 55 102 55 106 62"
            stroke="#5ce09e"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M78 58L74 51L82 55Z" fill="#7cfce7" />
          <path d="M102 58L106 51L98 55Z" fill="#7cfce7" />
          <circle cx="90" cy="54" r="3" fill="#ffd97d" />
        </g>
      )}
      {hat === 'moon_halo' && (
        <g>
          <ellipse cx="90" cy="49" rx="16" ry="4.5" stroke="#9ef4ff" strokeWidth="2.2" fill="none" />
          <path
            d="M90 36C86.5 38.5 86.5 43.5 90 46C85.8 45.6 83 43.2 83 40.8C83 38.2 86 36.2 90 36Z"
            fill="#e9fcff"
          />
        </g>
      )}
      {hat === 'frost_antlers' && (
        <g stroke="#c7b8ff" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M81 59C77 50 73 43 68 35M76 49L69 47M78 44L83 40" />
          <path d="M99 59C103 50 107 43 112 35M104 49L111 47M102 44L97 40" />
        </g>
      )}
    </svg>
  );
};

export const ShopModal: React.FC<ShopModalProps> = ({
  visible,
  progress,
  onBuy,
  onToggleEquip,
  onClose,
}) => {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [previewLoadout, setPreviewLoadout] = useState<PlayerLoadout | null>(null);

  useEffect(() => {
    if (!visible) {
      setPreviewLoadout(null);
    }
  }, [visible]);

  const itemsById = useMemo(() => {
    const map = new Map<ShopItemId, ShopItem>();
    for (const item of SHOP_ITEMS) map.set(item.id, item);
    return map;
  }, []);

  if (!visible) return null;

  const displayedLoadout: PlayerLoadout = previewLoadout ?? progress.equipped;
  const isPreviewDirty =
    previewLoadout !== null &&
    (previewLoadout.hat !== progress.equipped.hat ||
      previewLoadout.cloak !== progress.equipped.cloak ||
      previewLoadout.charm !== progress.equipped.charm);

  const ownedSet = new Set(progress.ownedIds);
  const filteredItems =
    category === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter((item) => item.category === category);

  const handleTryOn = (item: ShopItem) => {
    setPreviewLoadout((curr) => {
      const base = curr ?? { ...progress.equipped };
      const nextValue = base[item.category] === item.id ? null : item.id;
      return {
        ...base,
        [item.category]: nextValue,
      };
    });
  };

  const handleEquipClick = (item: ShopItem) => {
    const nextEquipped = progress.equipped[item.category] === item.id ? null : item.id;
    onToggleEquip(item.id);
    setPreviewLoadout((curr) => (curr ? { ...curr, [item.category]: nextEquipped } : null));
  };

  const handleBuyClick = (item: ShopItem) => {
    onBuy(item.id);
    setPreviewLoadout((curr) => (curr ? { ...curr, [item.category]: item.id } : null));
  };

  const formatSlotLabel = (slot: ShopCategory, fallback: string) => {
    const id = displayedLoadout[slot];
    const name = id ? itemsById.get(id)?.name ?? fallback : fallback;
    const differsFromEquipped = id !== progress.equipped[slot];
    return { name, differsFromEquipped };
  };

  const hatInfo = formatSlotLabel('hat', 'None');
  const cloakInfo = formatSlotLabel('cloak', 'Default');
  const charmInfo = formatSlotLabel('charm', 'None');

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#040c14]/82 p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grove-shop-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-xl border border-[#7cfce7]/32 bg-[#0a212b] shadow-2xl overflow-hidden">
        {/* Soft illustrated forest backdrop wash */}
        <img
          src={forestBackdropImg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-22"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0b2733]/90 via-[#0d2236]/86 to-[#1a1836]/92"
        />

        {/* Header Bar */}
        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-[#7cfce7]/22 bg-[#081c26]/72 px-4 py-3 sm:px-6 sm:py-4 shrink-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <h2
              id="grove-shop-title"
              className="font-display text-lg sm:text-2xl font-semibold text-[#f0fffc]"
            >
              Grove Shop
            </h2>
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-[#ffe194]">
              <DewdropIcon size={17} />
              <span className="tabular-nums">{progress.dewdrops}</span>
              <span className="text-xs font-normal text-[#c2ebe4]">Dewdrops</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/35 bg-[#0f2c38] px-4 py-2 text-xs sm:text-sm font-medium text-[#e9fbf8] transition-colors hover:border-[#7cfce7]/70 hover:bg-[#163d4d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
          >
            Close
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="relative z-10 overflow-y-auto p-4 sm:p-6" style={{ touchAction: 'pan-y' }}>
          <div className="grid grid-cols-1 md:grid-cols-[232px_1fr] gap-4 sm:gap-6 items-start">
            {/* Left Column: Avatar Preview & Try-On Loadout */}
            <div className="rounded-lg border border-[#7cfce7]/24 bg-[#081b25]/88 p-4 flex flex-row md:flex-col items-center md:items-stretch gap-4">
              <div className="flex justify-center shrink-0">
                <AvatarPreviewSvg loadout={displayedLoadout} />
              </div>
              <div className="flex-1 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#ffe194] tracking-wide">
                    {isPreviewDirty ? 'Trying On' : 'Active Loadout'}
                  </span>
                  {isPreviewDirty && (
                    <button
                      type="button"
                      onClick={() => setPreviewLoadout(null)}
                      className="min-h-[32px] whitespace-nowrap shrink-0 rounded px-2.5 py-1 text-[11px] font-medium text-[#8cf8e8] border border-[#8cf8e8]/35 bg-[#0f2f3c] hover:bg-[#164252]"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex justify-between gap-2 border-t border-[#7cfce7]/14 pt-2">
                  <span className="text-[#9fd1c9]">Headwear</span>
                  <span
                    className={`font-medium text-right ${
                      hatInfo.differsFromEquipped ? 'text-[#ffd884]' : 'text-[#e9fbf8]'
                    }`}
                  >
                    {hatInfo.name}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-t border-[#7cfce7]/14 pt-2">
                  <span className="text-[#9fd1c9]">Cloak</span>
                  <span
                    className={`font-medium text-right ${
                      cloakInfo.differsFromEquipped ? 'text-[#ffd884]' : 'text-[#e9fbf8]'
                    }`}
                  >
                    {cloakInfo.name}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-t border-[#7cfce7]/14 pt-2">
                  <span className="text-[#9fd1c9]">Relic</span>
                  <span
                    className={`font-medium text-right ${
                      charmInfo.differsFromEquipped ? 'text-[#ffd884]' : 'text-[#e9fbf8]'
                    }`}
                  >
                    {charmInfo.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Filter Tabs & Colorful Forest Catalog */}
            <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_TABS.map((tab) => {
                  const active = category === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategory(tab.id)}
                      className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                        active
                          ? 'bg-gradient-to-r from-[#56e3cc] to-[#8cf8e8] text-[#041b1f] font-semibold'
                          : 'border border-[#7cfce7]/25 bg-[#0c2633]/85 text-[#d7f5f0] hover:border-[#7cfce7]/55 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item) => {
                  const owned = ownedSet.has(item.id);
                  const equipped = progress.equipped[item.category] === item.id;
                  const tryingOn = displayedLoadout[item.category] === item.id;
                  const affordable = progress.dewdrops >= item.price;
                  const shortfall = Math.max(0, item.price - progress.dewdrops);

                  return (
                    <div
                      key={item.id}
                      style={{
                        borderColor: tryingOn
                          ? item.accentColor
                          : equipped
                            ? 'rgba(86, 227, 204, 0.7)'
                            : `${item.accentColor}44`,
                        background: tryingOn
                          ? `linear-gradient(145deg, rgba(16, 48, 60, 0.94), rgba(20, 32, 58, 0.94))`
                          : `linear-gradient(145deg, rgba(12, 34, 46, 0.88), rgba(16, 26, 46, 0.88))`,
                      }}
                      className="rounded-lg border p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          style={{
                            borderColor: `${item.accentColor}66`,
                            backgroundColor: '#071922',
                          }}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border"
                        >
                          <ItemIcon id={item.id} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="text-sm font-semibold text-[#f0fffc] leading-snug">
                              {item.name}
                            </h3>
                            <span className="flex items-center gap-1 text-xs font-semibold text-[#ffe194] shrink-0 tabular-nums">
                              <DewdropIcon size={12} />
                              {item.price}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#c2ebe4] leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleTryOn(item)}
                          style={
                            tryingOn
                              ? {
                                  borderColor: item.accentColor,
                                  color: item.accentColor,
                                }
                              : undefined
                          }
                          className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7] ${
                            tryingOn
                              ? 'border bg-[#0c2b36] font-semibold'
                              : 'border border-[#7cfce7]/28 bg-[#09202b] text-[#d7f5f0] hover:border-[#7cfce7]/60 hover:bg-[#10303f]'
                          }`}
                        >
                          {tryingOn ? 'Trying' : 'Try On'}
                        </button>

                        {owned ? (
                          <button
                            type="button"
                            onClick={() => handleEquipClick(item)}
                            className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7] ${
                              equipped
                                ? 'border border-[#56e3cc] bg-[#56e3cc]/22 text-[#8cf8e8] hover:bg-[#56e3cc]/32'
                                : 'border border-[#7cfce7]/35 bg-[#0d2836] text-[#f0fffc] hover:border-[#7cfce7]/65 hover:bg-[#14394c]'
                            }`}
                          >
                            {equipped ? 'Equipped' : 'Equip'}
                          </button>
                        ) : affordable ? (
                          <button
                            type="button"
                            onClick={() => handleBuyClick(item)}
                            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md bg-gradient-to-r from-[#56e3cc] to-[#8cf8e8] px-4 py-2 text-xs font-semibold text-[#041b1f] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
                          >
                            Buy
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/18 bg-[#081822] px-3.5 py-2 text-xs font-medium text-[#8cb5ae] opacity-80 cursor-not-allowed tabular-nums"
                          >
                            Need {shortfall}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
