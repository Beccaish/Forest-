import React, { Component, Suspense, lazy, type ReactNode, useEffect, useMemo, useState } from 'react';
import meadowBackdropImg from '../assets/images/shop_meadow_backdrop_1795684177280.jpg';
import {
  SHOP_ITEMS,
  type PlayerLoadout,
  type SavedShopProgress,
  type ShopCategory,
  type ShopItem,
  type ShopItemId,
} from '../game/shop';

const LazyShopSpirit3DPreview = lazy(() =>
  import('./ShopSpirit3DPreview').then((mod) => ({ default: mod.ShopSpirit3DPreview }))
);

class PreviewErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[260px] sm:h-[300px] w-full items-center justify-center rounded-xl border-2 border-[#9cd3b2] bg-[#e8f6ec] p-4 text-center text-sm font-medium text-[#11352a]">
          3D preview unavailable on this device — you can still try on, buy, and equip all items.
        </div>
      );
    }
    return this.props.children;
  }
}

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
  { id: 'power', label: 'Super Powers' },
  { id: 'hat', label: 'Headwear' },
  { id: 'cloak', label: 'Cloaks' },
  { id: 'charm', label: 'Relics & Gear' },
];

const CATEGORY_LABELS: Record<ShopCategory, string> = {
  power: 'Super Power',
  hat: 'Headwear',
  cloak: 'Cloak',
  charm: 'Relic',
};

const DewdropIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 2.2C13.4 6.3 15.8 9.6 15.8 12.6C15.8 15.8 13.2 18 10 18C6.8 18 4.2 15.8 4.2 12.6C4.2 9.6 6.6 6.3 10 2.2Z"
      fill="#38d9c0"
      fillOpacity="0.6"
      stroke="#b4690e"
      strokeWidth="1.5"
    />
    <circle cx="8.4" cy="11.8" r="1.6" fill="#ffffff" />
  </svg>
);

const ItemIcon: React.FC<{ id: ShopItemId; size?: number }> = ({ id, size = 48 }) => {
  switch (id) {
    case 'super_sky_leap':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 4L23 14H18.5V23H13.5V14H9L16 4Z" fill="#0ea58a" stroke="#085f50" strokeWidth="1" />
          <ellipse cx="16" cy="25.5" rx="10" ry="2.8" stroke="#d97706" strokeWidth="2" />
        </svg>
      );
    case 'super_nova_pulse':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="10.5" stroke="#d97706" strokeWidth="2" strokeDasharray="3 3" />
          <path
            d="M16 5L19 13L27 16L19 19L16 27L13 19L5 16L13 13L16 5Z"
            fill="#fbbf24"
            stroke="#92400e"
            strokeWidth="1"
          />
        </svg>
      );
    case 'super_star_magnet':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="10.5" stroke="#d946ef" strokeWidth="2" strokeDasharray="4 3" />
          <circle cx="16" cy="16" r="5" fill="#ec4899" />
          <circle cx="8.5" cy="9.5" r="2.2" fill="#f59e0b" />
          <circle cx="24" cy="22" r="2.2" fill="#14b8a6" />
        </svg>
      );
    case 'super_phoenix_wings':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 18C12 11 5.5 8 3.5 10.5C5.5 16.5 10 20 15 22C16 22 16 22 17 22C22 20 26.5 16.5 28.5 10.5C26.5 8 20 11 16 18Z"
            fill="#f97316"
            stroke="#b45309"
            strokeWidth="1.3"
          />
          <circle cx="16" cy="18" r="2.8" fill="#fde047" />
        </svg>
      );
    case 'super_dragon_wings':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M15 21L3.5 9.5L7 19.5L12.5 22.5Z"
            fill="#0f9d76"
            stroke="#c2410c"
            strokeWidth="1.4"
          />
          <path
            d="M17 21L28.5 9.5L25 19.5L19.5 22.5Z"
            fill="#0f9d76"
            stroke="#c2410c"
            strokeWidth="1.4"
          />
          <circle cx="16" cy="20.5" r="2.6" fill="#f59e0b" />
        </svg>
      );
    case 'super_fairy_sparkle':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 4.5L18.5 12L26 14.5L18.5 17L16 24.5L13.5 17L6 14.5L13.5 12Z"
            fill="#ec4899"
            stroke="#9d174d"
            strokeWidth="1"
          />
          <circle cx="8.5" cy="8" r="2.2" fill="#f59e0b" />
          <circle cx="24" cy="23.5" r="2.3" fill="#14b8a6" />
        </svg>
      );
    case 'moss_crown':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M5.5 21.5C7.5 14 11 11 16 11C21 11 24.5 14 26.5 21.5"
            stroke="#10b981"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path d="M9.5 15.5L7 9.5L13 12Z" fill="#059669" />
          <path d="M22.5 15.5L25 9.5L19 12Z" fill="#059669" />
          <circle cx="16" cy="10.5" r="3" fill="#f59e0b" />
        </svg>
      );
    case 'sunflower_crown':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M6 21.5C8 14 24 14 26 21.5" stroke="#d97706" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="9.5" cy="14" r="3.4" fill="#facc15" stroke="#ca8a04" strokeWidth="0.9" />
          <circle cx="16" cy="10.8" r="4" fill="#facc15" stroke="#ca8a04" strokeWidth="0.9" />
          <circle cx="22.5" cy="14" r="3.4" fill="#facc15" stroke="#ca8a04" strokeWidth="0.9" />
          <circle cx="16" cy="10.8" r="1.8" fill="#9a3412" />
        </svg>
      );
    case 'moon_halo':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <ellipse cx="16" cy="15.5" rx="10" ry="4" stroke="#0284c7" strokeWidth="2.4" />
          <path
            d="M17 5.5C14 7.5 14 11.5 17 13.2C13.6 13 11.4 10.8 11.4 8.6C11.4 6.6 13.8 5.4 17 5.5Z"
            fill="#38bdf8"
            stroke="#0369a1"
            strokeWidth="1"
          />
        </svg>
      );
    case 'coral_tiara':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M6.5 22.5L4.5 11.5L12 17L16 7.5L20 17L27.5 11.5L25.5 22.5Z"
            fill="#ec4899"
            stroke="#9d174d"
            strokeWidth="1.2"
          />
          <circle cx="16" cy="17.5" r="2.6" fill="#2dd4bf" />
        </svg>
      );
    case 'frost_antlers':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M11 24.5C9.5 18 7.5 14 5.5 7.5M9.5 16L5.5 14M10 12L12.5 8.5"
            stroke="#4f46e5"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M21 24.5C22.5 18 24.5 14 26.5 7.5M22.5 16L26.5 14M22 12L19.5 8.5"
            stroke="#4f46e5"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="16" cy="22" r="2.6" fill="#0ea5e9" />
        </svg>
      );
    case 'astral_wizard':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <ellipse cx="16" cy="23.5" rx="11.5" ry="3.2" fill="#5b21b6" stroke="#c084fc" strokeWidth="1.5" />
          <path d="M8.5 22.5L17 6.5L23.5 22.5Z" fill="#5b21b6" stroke="#c084fc" strokeWidth="1.5" />
          <circle cx="17" cy="6.5" r="2.6" fill="#facc15" />
        </svg>
      );
    case 'sunset_ember':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M10 7.5L22 7.5L25.5 24.5C20 26.8 12 26.8 6.5 24.5L10 7.5Z"
            fill="#c2410c"
            stroke="#fdba74"
            strokeWidth="1.6"
          />
          <path d="M9 11H23" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'sakura_petal':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M10 7.5L22 7.5L25.5 24.5C20 26.8 12 26.8 6.5 24.5L10 7.5Z"
            fill="#be185d"
            stroke="#f9a8d4"
            strokeWidth="1.6"
          />
          <circle cx="16" cy="16" r="2.6" fill="#fde047" />
        </svg>
      );
    case 'starweave_mantle':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M10 7.5L22 7.5L25.5 24.5C20 26.8 12 26.8 6.5 24.5L10 7.5Z"
            fill="#3730a3"
            stroke="#a5b4fc"
            strokeWidth="1.6"
          />
          <circle cx="13.5" cy="15.5" r="1.5" fill="#ffffff" />
          <circle cx="19" cy="20" r="1.5" fill="#ffffff" />
          <circle cx="17" cy="12.5" r="1.2" fill="#ffffff" />
        </svg>
      );
    case 'ocean_tide':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M10 7.5L22 7.5L25.5 24.5C20 26.8 12 26.8 6.5 24.5L10 7.5Z"
            fill="#0369a1"
            stroke="#67e8f9"
            strokeWidth="1.6"
          />
          <path d="M9 17C13 15 19 19 23 17" stroke="#cffafe" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'prism_aurora':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M10 7.5L22 7.5L25.5 24.5C20 26.8 12 26.8 6.5 24.5L10 7.5Z"
            fill="#0f766e"
            stroke="#5eead4"
            strokeWidth="1.6"
          />
          <path d="M10 15C14 13 18 17 22 14" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 20C13 18 18 22 23 19" stroke="#e9d5ff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'shadow_velvet':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M10 7.5L22 7.5L25.5 24.5C20 26.8 12 26.8 6.5 24.5L10 7.5Z"
            fill="#4c1d95"
            stroke="#c4b5fd"
            strokeWidth="1.6"
          />
          <circle cx="16" cy="11.5" r="2.2" fill="#fde047" />
        </svg>
      );
    case 'firefly_sprite':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="9.5" fill="#fde68a" fillOpacity="0.6" />
          <ellipse cx="12" cy="12.5" rx="3.8" ry="2.2" transform="rotate(-25 12 12.5)" fill="#a7f3d0" stroke="#047857" strokeWidth="0.9" />
          <ellipse cx="20" cy="12.5" rx="3.8" ry="2.2" transform="rotate(25 20 12.5)" fill="#a7f3d0" stroke="#047857" strokeWidth="0.9" />
          <circle cx="16" cy="17.5" r="4" fill="#f59e0b" />
        </svg>
      );
    case 'wind_boots':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M7.5 18C12 18 15 15 18 10.5C18 15 16 19 12 21M12 22.5C17 22.5 21 19 24.5 13.5C23.5 19 20 23.5 14 25.5"
            stroke="#0d9488"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="22.5" cy="10.5" r="2.4" fill="#f59e0b" />
        </svg>
      );
    case 'mini_owl':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <ellipse cx="16" cy="17" rx="7.5" ry="9" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.6" />
          <circle cx="13.2" cy="14.5" r="1.7" fill="#0f172a" />
          <circle cx="18.8" cy="14.5" r="1.7" fill="#0f172a" />
          <path d="M14.5 17L17.5 17L16 19.6Z" fill="#f59e0b" />
        </svg>
      );
    case 'ranger_hood':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M6.5 22.5C6.5 12 13 7.5 21.5 7.5C23.5 13 24.5 18 25.5 22.5L16 19Z" fill="#15803d" stroke="#86efac" strokeWidth="1.6" />
          <circle cx="19" cy="18" r="2.2" fill="#facc15" />
        </svg>
      );
    case 'knight_helm':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M8.5 24.5V16C8.5 10.5 11.8 7.5 16 7.5C20.2 7.5 23.5 10.5 23.5 16V24.5Z" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
          <rect x="13" y="15" width="7.5" height="2.6" fill="#0f172a" />
          <path d="M16 7.5C13 4.5 8.5 5.5 6.5 9C10.5 9 13 9 16 7.5Z" fill="#10b981" />
        </svg>
      );
    case 'fairy_sparkle_tiara':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M5.5 21.5C8.5 14 23.5 14 26.5 21.5" stroke="#d946ef" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="16" cy="11.5" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.9" />
          <circle cx="10" cy="15" r="2" fill="#f472b6" />
          <circle cx="22" cy="15" r="2" fill="#f472b6" />
        </svg>
      );
    case 'ranger_cape':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M10 7.5L22 7.5L25.5 24.5L16 21L6.5 24.5Z" fill="#166534" stroke="#86efac" strokeWidth="1.6" />
          <circle cx="16" cy="11" r="2.2" fill="#f59e0b" />
        </svg>
      );
    case 'dragonscale_cloak':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M10 7.5L22 7.5L25.5 24.5C20 26.8 12 26.8 6.5 24.5Z" fill="#b91c1c" stroke="#fb923c" strokeWidth="1.6" />
          <path d="M11 15L16 18.5L21 15" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'fairy_gossamer':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M10 7.5L22 7.5L25.5 24.5C20 26.8 12 26.8 6.5 24.5Z" fill="#a21caf" stroke="#f0abfc" strokeWidth="1.6" />
          <circle cx="13.5" cy="15" r="1.6" fill="#fde047" />
          <circle cx="19" cy="19.5" r="1.6" fill="#fde047" />
        </svg>
      );
    case 'fairy_sparkle_wand':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <line x1="8.5" y1="24.5" x2="20" y2="12" stroke="#d97706" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M21 5.5L22.6 10L27 11.6L22.6 13.2L21 17.5L19.4 13.2L15 11.6L19.4 10Z" fill="#ec4899" />
        </svg>
      );
    case 'knight_crest':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M8.5 7.5H23.5V17C23.5 22.5 16 26.5 16 26.5C16 26.5 8.5 22.5 8.5 17Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.6" />
          <path d="M16 11V22M12 16H20" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'sanctuary_heart':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 25.5C16 25.5 7 19.6 7 13C7 9.6 9.6 7.2 12.6 7.2C14.4 7.2 15.5 8.2 16 9.4C16.5 8.2 17.6 7.2 19.4 7.2C22.4 7.2 25 9.6 25 13C25 19.6 16 25.5 16 25.5Z"
            fill="#f43f5e"
            fillOpacity="0.82"
            stroke="#9f1239"
            strokeWidth="1.6"
          />
          <circle cx="16" cy="15" r="2.4" fill="#fff1f2" />
        </svg>
      );
  }
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
  const [flyingActive, setFlyingActive] = useState(false);
  const [demoNonce, setDemoNonce] = useState(0);

  useEffect(() => {
    if (!visible) {
      setPreviewLoadout(null);
      setFlyingActive(false);
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
      previewLoadout.charm !== progress.equipped.charm ||
      previewLoadout.power !== progress.equipped.power);

  const ownedSet = new Set(progress.ownedIds);
  const filteredItems =
    category === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter((item) => item.category === category);

  const handleTryOn = (item: ShopItem) => {
    const nextValue = displayedLoadout[item.category] === item.id ? null : item.id;
    setPreviewLoadout((curr) => {
      const base = curr ?? { ...progress.equipped };
      return {
        ...base,
        [item.category]: nextValue,
      };
    });

    if (item.category === 'power') {
      if (nextValue === 'super_phoenix_wings' || nextValue === 'super_dragon_wings') {
        setFlyingActive(true);
        setDemoNonce((n) => n + 1);
      } else {
        setFlyingActive(false);
        if (nextValue) {
          setDemoNonce((n) => n + 1);
        }
      }
    }
  };

  const handleEquipClick = (item: ShopItem) => {
    const nextEquipped = progress.equipped[item.category] === item.id ? null : item.id;
    onToggleEquip(item.id);
    setPreviewLoadout((curr) => (curr ? { ...curr, [item.category]: nextEquipped } : null));
    if (item.category === 'power') {
      if (nextEquipped === 'super_phoenix_wings' || nextEquipped === 'super_dragon_wings') {
        setFlyingActive(true);
        setDemoNonce((n) => n + 1);
      } else {
        setFlyingActive(false);
        if (nextEquipped) setDemoNonce((n) => n + 1);
      }
    }
  };

  const handleBuyClick = (item: ShopItem) => {
    onBuy(item.id);
    setPreviewLoadout((curr) => (curr ? { ...curr, [item.category]: item.id } : null));
    if (item.category === 'power') {
      if (item.id === 'super_phoenix_wings' || item.id === 'super_dragon_wings') {
        setFlyingActive(true);
      } else {
        setFlyingActive(false);
      }
      setDemoNonce((n) => n + 1);
    }
  };

  const formatSlotLabel = (slot: ShopCategory, fallback: string) => {
    const id = displayedLoadout[slot];
    const name = id ? itemsById.get(id)?.name ?? fallback : fallback;
    const differsFromEquipped = id !== progress.equipped[slot];
    return { name, differsFromEquipped };
  };

  const powerInfo = formatSlotLabel('power', 'None');
  const hatInfo = formatSlotLabel('hat', 'None');
  const cloakInfo = formatSlotLabel('cloak', 'Default');
  const charmInfo = formatSlotLabel('charm', 'None');

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f2b21]/58 p-2.5 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grove-shop-title"
    >
      <div className="relative w-full max-w-6xl max-h-[93vh] max-h-[93dvh] flex flex-col rounded-2xl border-2 border-[#8ec8a7] bg-[#f4fbf5] shadow-2xl overflow-hidden">
        {/* Bright sunlit enchanted meadow wash */}
        <img
          src={meadowBackdropImg}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-28"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f6fcf6]/92 via-[#edf8ef]/88 to-[#e4f5ea]/90"
        />

        {/* Header Bar */}
        <div className="relative z-10 flex items-center justify-between gap-4 border-b border-[#b9dfc7] bg-white/88 px-4 py-3 sm:px-6 sm:py-3.5 shrink-0">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <h2
              id="grove-shop-title"
              className="font-display text-xl sm:text-2xl font-bold text-[#0f2f25]"
            >
              Grove Shop
            </h2>
            <div className="flex items-center gap-2 rounded-lg border border-[#e7c572] bg-[#fff7dc] px-3 py-1.5 text-sm sm:text-base font-bold text-[#7c4a03]">
              <DewdropIcon size={18} />
              <span className="tabular-nums">{progress.dewdrops}</span>
              <span className="text-xs sm:text-sm font-semibold text-[#945c0c]">Dewdrops</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] whitespace-nowrap shrink-0 rounded-lg border border-[#8ec8a7] bg-white px-5 py-2 text-sm font-semibold text-[#103429] transition-colors hover:bg-[#e5f5eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]"
          >
            Close
          </button>
        </div>

        {/* Scrollable Two-Column Workspace */}
        <div className="relative z-10 overflow-y-auto p-4 sm:p-6" style={{ touchAction: 'pan-y' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5 sm:gap-6 items-start">
            {/* Left Column: 3D Forest Turntable & Try-On Status */}
            <div className="rounded-xl border border-[#b6dec4] bg-white/90 p-4 shadow-sm flex flex-col gap-4">
              <PreviewErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex h-[260px] sm:h-[300px] w-full items-center justify-center rounded-xl border-2 border-[#9cd3b2] bg-[#e2f4e8] text-sm font-semibold text-[#11352a]">
                      Loading 3D forest stage...
                    </div>
                  }
                >
                  <LazyShopSpirit3DPreview
                    loadout={displayedLoadout}
                    flyingActive={flyingActive}
                    demoNonce={demoNonce}
                    onToggleFly={() => setFlyingActive((v) => !v)}
                    onTriggerDemo={() => setDemoNonce((n) => n + 1)}
                  />
                </Suspense>
              </PreviewErrorBoundary>

              {/* Clean Active / Trying Loadout Summary */}
              <div className="border-t border-[#d6ecde] pt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#0f2f25]">
                    {isPreviewDirty ? 'Trying On Preview' : 'Wearing Now'}
                  </span>
                  {isPreviewDirty && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewLoadout(null);
                        setFlyingActive(false);
                      }}
                      className="min-h-[34px] whitespace-nowrap shrink-0 rounded-md border border-[#96cfad] bg-[#eef9f2] px-3 py-1 text-xs font-semibold text-[#0d5442] hover:bg-[#dcf3e6]"
                    >
                      Reset Try-On
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <div className="text-xs font-medium text-[#477365]">Super Power</div>
                    <div
                      className={`font-semibold truncate ${
                        powerInfo.differsFromEquipped ? 'text-[#b45309]' : 'text-[#103429]'
                      }`}
                    >
                      {powerInfo.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#477365]">Headwear</div>
                    <div
                      className={`font-semibold truncate ${
                        hatInfo.differsFromEquipped ? 'text-[#b45309]' : 'text-[#103429]'
                      }`}
                    >
                      {hatInfo.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#477365]">Cloak</div>
                    <div
                      className={`font-semibold truncate ${
                        cloakInfo.differsFromEquipped ? 'text-[#b45309]' : 'text-[#103429]'
                      }`}
                    >
                      {cloakInfo.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#477365]">Relic</div>
                    <div
                      className={`font-semibold truncate ${
                        charmInfo.differsFromEquipped ? 'text-[#b45309]' : 'text-[#103429]'
                      }`}
                    >
                      {charmInfo.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Big, Clear Sunlit Forest Item Grid */}
            <div className="flex flex-col gap-4 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORY_TABS.map((tab) => {
                  const active = category === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategory(tab.id)}
                      className={`min-h-[42px] whitespace-nowrap shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#0f766e] ${
                        active
                          ? 'bg-[#0f8c71] text-white shadow-sm'
                          : 'border border-[#b2dbc2] bg-white/95 text-[#143d31] hover:bg-[#e7f6ec]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            ? '#0f9d76'
                            : '#c5e3cf',
                      }}
                      className={`rounded-xl border-2 p-4 sm:p-5 flex flex-col justify-between gap-4 transition-colors shadow-sm ${
                        tryingOn ? 'bg-[#f8fffb]' : 'bg-white/95'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          style={{
                            borderColor: `${item.accentColor}55`,
                            backgroundColor: `${item.accentColor}18`,
                          }}
                          className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border-2"
                        >
                          <ItemIcon id={item.id} size={50} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-[#0e2d23] leading-snug">
                              {item.name}
                            </h3>
                            <span className="flex items-center gap-1 text-base font-bold text-[#8a5100] shrink-0 tabular-nums">
                              <DewdropIcon size={15} />
                              {item.price}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-[#2c5749] leading-snug">
                            {item.shortPerk}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-[#e2f1e7] pt-3">
                        <span className="text-xs font-semibold text-[#527d6f]">
                          {CATEGORY_LABELS[item.category]}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTryOn(item)}
                            style={
                              tryingOn
                                ? {
                                    borderColor: item.accentColor,
                                    color: '#0e2d23',
                                    backgroundColor: `${item.accentColor}22`,
                                  }
                                : undefined
                            }
                            className={`min-h-[42px] whitespace-nowrap shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e] ${
                              tryingOn
                                ? 'border-2'
                                : 'border border-[#b2dbc2] bg-[#f4fbf6] text-[#12382c] hover:bg-[#e3f4e9]'
                            }`}
                          >
                            {tryingOn ? 'Trying' : 'Try On'}
                          </button>

                          {owned ? (
                            <button
                              type="button"
                              onClick={() => handleEquipClick(item)}
                              className={`min-h-[42px] whitespace-nowrap shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e] ${
                                equipped
                                  ? 'border-2 border-[#0f8c71] bg-[#d8f6ea] text-[#084d3d] hover:bg-[#c5f0df]'
                                  : 'bg-[#144436] text-white hover:bg-[#1a5745]'
                              }`}
                            >
                              {equipped ? 'Equipped' : 'Equip'}
                            </button>
                          ) : affordable ? (
                            <button
                              type="button"
                              onClick={() => handleBuyClick(item)}
                              className="min-h-[42px] whitespace-nowrap shrink-0 rounded-lg bg-[#0f8c71] px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0c7860] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f766e]"
                            >
                              Buy
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="min-h-[42px] whitespace-nowrap shrink-0 rounded-lg border border-[#d6e7dc] bg-[#f0f6f2] px-4 py-2 text-sm font-semibold text-[#5b7d72] cursor-not-allowed tabular-nums"
                            >
                              Need {shortfall}
                            </button>
                          )}
                        </div>
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
