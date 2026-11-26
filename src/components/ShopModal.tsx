import React, { Component, Suspense, lazy, type ReactNode, useEffect, useMemo, useState } from 'react';
import shopStoneWallImg from '../assets/images/shop_stone_wall_1795702807514.jpg';
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
        <div className="flex h-[250px] sm:h-[285px] w-full items-center justify-center rounded-2xl border-2 border-[#8a552b] bg-[#2a170b] p-4 text-center text-sm font-medium text-[#fff3dc]">
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

const DewdropIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 2.2C13.4 6.3 15.8 9.6 15.8 12.6C15.8 15.8 13.2 18 10 18C6.8 18 4.2 15.8 4.2 12.6C4.2 9.6 6.6 6.3 10 2.2Z"
      fill="#2dd4bf"
      stroke="#134e4a"
      strokeWidth="1.4"
    />
    <path
      d="M10 4.2C12.4 7.5 14.2 10.2 14.2 12.6C14.2 15 12.2 16.5 10 16.5C7.8 16.5 5.8 15 5.8 12.6C5.8 10.2 7.6 7.5 10 4.2Z"
      fill="#5eead4"
      fillOpacity="0.75"
    />
    <circle cx="8" cy="11.2" r="1.5" fill="#ffffff" />
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
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-[#07130d]/80 backdrop-blur-md p-1.5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:p-5 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grove-shop-title"
    >
      <div className="relative w-full max-w-6xl h-full sm:h-auto sm:max-h-[92vh] sm:max-h-[92dvh] flex flex-col rounded-2xl sm:rounded-3xl border-4 border-[#3b2716] bg-[#1a281e] shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,230,180,0.15)] overflow-hidden">
        {/* Ancient Temple Mossy Stone Wall Background */}
        <img
          src={shopStoneWallImg}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-65"
        />
        {/* Ambient magical sunlight & vignette overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1b2f23]/80 via-[#132219]/75 to-[#0b1710]/90"
        />

        {/* Floating Golden Fireflies / Spore motes */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-1 overflow-hidden">
          <div className="absolute top-8 left-12 w-2 h-2 rounded-full bg-[#fde047] opacity-60 shadow-[0_0_8px_#fde047]" />
          <div className="absolute top-1/4 right-20 w-2.5 h-2.5 rounded-full bg-[#86efac] opacity-50 shadow-[0_0_10px_#86efac]" />
          <div className="absolute bottom-16 left-1/3 w-2 h-2 rounded-full bg-[#facc15] opacity-55 shadow-[0_0_8px_#facc15]" />
          <div className="absolute top-2/3 right-1/4 w-3 h-3 rounded-full bg-[#67e8f9] opacity-45 shadow-[0_0_10px_#67e8f9]" />
        </div>

        {/* Top Parchment Scroll Header Bar */}
        <div className="relative z-10 flex items-center justify-between gap-3 px-3 py-2 sm:px-6 sm:py-3 shrink-0">
          {/* Parchment Scroll Plaque */}
          <div className="relative flex-1 max-w-2xl flex items-center justify-between gap-3 rounded-xl border-y-2 border-[#b88c52] bg-gradient-to-b from-[#fbf4e4] via-[#f5ebcf] to-[#ece0be] px-4 py-2 sm:px-6 sm:py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.7)]">
            {/* Left scroll curl edge */}
            <div aria-hidden="true" className="absolute -left-2 top-0 bottom-0 w-3 rounded-l-md bg-gradient-to-r from-[#cf9d56] to-[#ebcb8d] border-l-2 border-y-2 border-[#8f5a2b] shadow" />
            {/* Right scroll curl edge */}
            <div aria-hidden="true" className="absolute -right-2 top-0 bottom-0 w-3 rounded-r-md bg-gradient-to-l from-[#cf9d56] to-[#ebcb8d] border-r-2 border-y-2 border-[#8f5a2b] shadow" />

            <div className="flex items-center gap-3 sm:gap-6">
              <h2
                id="grove-shop-title"
                className="font-serif text-xl sm:text-2xl md:text-3xl font-black text-[#361e0b] tracking-wide drop-shadow-sm flex items-center gap-2"
              >
                <span>Grove Shop</span>
              </h2>

              {/* Dewdrops Plaque */}
              <div className="flex items-center gap-1.5 rounded-xl border border-[#d6af74] bg-[#fbf5e5] px-2.5 py-1 sm:px-3 sm:py-1 shadow-[inset_0_1px_3px_rgba(160,110,40,0.15)] text-sm sm:text-base font-bold text-[#3f2711]">
                <DewdropIcon size={18} />
                <span className="tabular-nums font-black text-[#2e1909]">{progress.dewdrops}</span>
                <span className="text-xs sm:text-sm font-semibold text-[#5a3a1d]">Dewdrops</span>
              </div>
            </div>
          </div>

          {/* Carved Wood Leaf / Pebble Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] sm:min-h-[44px] whitespace-nowrap shrink-0 rounded-2xl border-2 border-[#9b6339] bg-gradient-to-b from-[#7a441e] via-[#5c3115] to-[#42210d] px-5 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base font-serif font-bold text-[#fef5e1] shadow-[0_4px_10px_rgba(0,0,0,0.4),0_2px_0_#281206] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_1px_0_#281206] transition-all focus-visible:outline-2 focus-visible:outline-[#86efac]"
          >
            Close
          </button>
        </div>

        {/* Scrollable Two-Column Workspace */}
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto p-3 sm:p-5" style={{ touchAction: 'pan-y' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr] gap-4 sm:gap-5 items-start">
            {/* Left Column: 3D Forest Turntable & Wearing Now Drawer */}
            <div className="flex flex-col gap-3">
              <PreviewErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex h-[250px] sm:h-[285px] w-full items-center justify-center rounded-2xl border-2 border-[#8a552b] bg-[#2a170b] text-sm font-semibold text-[#fff3dc]">
                      Loading 3D forest glade...
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

              {/* "Wearing Now" Carved Wooden Drawer Panel */}
              <div className="relative rounded-2xl border-2 border-[#683f1d] bg-gradient-to-b from-[#3a200e] via-[#2d180a] to-[#201007] p-3 sm:p-3.5 shadow-[0_6px_16px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,220,160,0.1)] flex flex-col gap-2.5">
                {/* Brass Lock Plate Accent Centered */}
                <div aria-hidden="true" className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="w-6 h-3 rounded-t-sm bg-gradient-to-b from-[#f59e0b] to-[#b45309] border border-[#78350f] shadow flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#451a03]" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="font-serif text-sm font-bold tracking-wide text-[#fdecd0]">
                    {isPreviewDirty ? 'Trying On Preview' : 'Wearing Now'}
                  </span>
                  {isPreviewDirty && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewLoadout(null);
                        setFlyingActive(false);
                      }}
                      className="min-h-[28px] whitespace-nowrap shrink-0 rounded-lg border border-[#a3e635]/60 bg-[#1e3d16] px-2.5 py-0.5 text-xs font-bold text-[#d9f99d] hover:bg-[#27501c] transition-colors"
                    >
                      Reset Try-On
                    </button>
                  )}
                </div>

                {/* Recessed carved wood slot trays */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-[#4d2a12] bg-[#160a04]/90 p-2 shadow-inner">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[#a8825c]">Super Power</div>
                    <div className={`font-bold truncate mt-0.5 ${powerInfo.differsFromEquipped ? 'text-[#facc15]' : 'text-[#f5ede2]'}`}>
                      {powerInfo.name}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#4d2a12] bg-[#160a04]/90 p-2 shadow-inner">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[#a8825c]">Headwear</div>
                    <div className={`font-bold truncate mt-0.5 ${hatInfo.differsFromEquipped ? 'text-[#facc15]' : 'text-[#f5ede2]'}`}>
                      {hatInfo.name}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#4d2a12] bg-[#160a04]/90 p-2 shadow-inner">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[#a8825c]">Cloak</div>
                    <div className={`font-bold truncate mt-0.5 ${cloakInfo.differsFromEquipped ? 'text-[#facc15]' : 'text-[#f5ede2]'}`}>
                      {cloakInfo.name}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#4d2a12] bg-[#160a04]/90 p-2 shadow-inner">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[#a8825c]">Relic</div>
                    <div className={`font-bold truncate mt-0.5 ${charmInfo.differsFromEquipped ? 'text-[#facc15]' : 'text-[#f5ede2]'}`}>
                      {charmInfo.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Category Shelf + Parchment Item Cards with Moss */}
            <div className="flex flex-col gap-3 min-w-0">
              {/* Category River Stone Tabs on Wooden Mossy Shelf */}
              <div className="relative rounded-2xl border-2 border-[#683f1d] bg-gradient-to-r from-[#4d2c14] via-[#5c3519] to-[#4d2c14] p-1.5 sm:p-2 shadow-md flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
                {/* Top moss sprig trim */}
                <div aria-hidden="true" className="pointer-events-none absolute -top-2 left-4 right-4 flex justify-between">
                  <div className="w-8 h-2 bg-[#65a30d] rounded-t-full opacity-70" />
                  <div className="w-12 h-2.5 bg-[#4d7c0f] rounded-t-full opacity-80" />
                  <div className="w-10 h-2 bg-[#65a30d] rounded-t-full opacity-70" />
                </div>

                {CATEGORY_TABS.map((tab) => {
                  const active = category === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategory(tab.id)}
                      className={`min-h-[38px] whitespace-nowrap shrink-0 rounded-xl px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-[#86efac] ${
                        active
                          ? 'bg-gradient-to-b from-[#a3e635] via-[#84cc16] to-[#65a30d] border-2 border-[#d9f99d] text-[#143807] font-black shadow-[0_3px_0_#365314,0_4px_10px_rgba(0,0,0,0.35)] scale-[1.02]'
                          : 'bg-gradient-to-b from-[#4d6b53] to-[#364e3c] hover:from-[#5b7d62] hover:to-[#425e49] border-2 border-[#688a6f] text-[#f4faf2] shadow-[0_2px_0_#1f3024]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* 2-Column Parchment Item Cards Grid with Moss Borders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {filteredItems.map((item) => {
                  const owned = ownedSet.has(item.id);
                  const equipped = progress.equipped[item.category] === item.id;
                  const tryingOn = displayedLoadout[item.category] === item.id;
                  const affordable = progress.dewdrops >= item.price;
                  const shortfall = Math.max(0, item.price - progress.dewdrops);

                  return (
                    <div
                      key={item.id}
                      className={`relative rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-[0_6px_18px_rgba(15,8,3,0.35)] transition-all ${
                        tryingOn
                          ? 'border-[3px] border-[#a3e635] ring-2 ring-[#a3e635]/50 bg-gradient-to-b from-[#fefcee] via-[#f7f5dc] to-[#edf0cf]'
                          : 'border-[3px] border-[#689334] bg-gradient-to-b from-[#fbf5e7] via-[#f6eed9] to-[#efe3c8]'
                      }`}
                    >
                      {/* Corner Moss Decals */}
                      <div aria-hidden="true" className="pointer-events-none absolute -top-1 -left-1">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                          <path d="M0 0C8 0 16 4 16 14C11 14 7 10 0 8V0Z" fill="#588b2b" />
                          <circle cx="14" cy="12" r="1.5" fill="#a3e635" />
                        </svg>
                      </div>
                      <div aria-hidden="true" className="pointer-events-none absolute -bottom-1 -right-1">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M20 20C12 20 4 16 4 6C9 6 13 10 20 12V20Z" fill="#588b2b" />
                          <circle cx="6" cy="8" r="1.5" fill="#a3e635" />
                        </svg>
                      </div>

                      {/* Top Section: Icon + Title + Price + Perk */}
                      <div className="flex items-start gap-3">
                        {/* Icon frame */}
                        <div
                          style={{
                            borderColor: `${item.accentColor}99`,
                          }}
                          className="flex h-[66px] w-[66px] sm:h-[74px] sm:w-[74px] shrink-0 items-center justify-center rounded-2xl border-2 border-[#668b36] bg-[#f0f9ed] p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]"
                        >
                          <ItemIcon id={item.id} size={46} />
                        </div>

                        {/* Title + Price + Description */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <h3 className="font-serif text-base sm:text-lg font-bold text-[#2a1708] leading-tight line-clamp-1">
                              {item.name}
                            </h3>
                            <span className="flex items-center gap-1 text-sm sm:text-base font-black text-[#2b5120] shrink-0 tabular-nums">
                              <DewdropIcon size={16} />
                              {item.price}
                            </span>
                          </div>
                          <p className="mt-1 text-xs sm:text-sm font-medium text-[#5a422d] leading-snug line-clamp-2">
                            {item.shortPerk}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Bar: Category Tag + Buttons */}
                      <div className="flex items-center justify-between gap-2 border-t border-[#d8be97] pt-2.5">
                        <span className="text-xs font-bold text-[#71543b]">
                          {CATEGORY_LABELS[item.category]}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Try On Button */}
                          <button
                            type="button"
                            onClick={() => handleTryOn(item)}
                            className={`min-h-[36px] whitespace-nowrap shrink-0 rounded-xl px-3 py-1 text-xs sm:text-sm font-bold shadow-[0_2px_0_#2b1305,0_3px_6px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-[0_1px_0_#2b1305] transition-all focus-visible:outline-2 focus-visible:outline-[#86efac] ${
                              tryingOn
                                ? 'border-2 border-[#a3e635] bg-[#3a200e] text-[#bef264]'
                                : 'border-2 border-[#7c4820] bg-gradient-to-b from-[#6b3a16] to-[#4e260c] text-[#fdf2d9] hover:brightness-110'
                            }`}
                          >
                            {tryingOn ? 'Trying' : 'Try On'}
                          </button>

                          {/* Buy / Equip / Equipped Button */}
                          {owned ? (
                            <button
                              type="button"
                              onClick={() => handleEquipClick(item)}
                              className={`min-h-[36px] whitespace-nowrap shrink-0 rounded-xl px-3.5 py-1 text-xs sm:text-sm font-bold shadow-[0_2px_0_#1c380f,0_3px_6px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-[0_1px_0_#1c380f] transition-all focus-visible:outline-2 focus-visible:outline-[#86efac] ${
                                equipped
                                  ? 'border-2 border-[#a3e635] bg-[#294c1a] text-[#d9f99d]'
                                  : 'border-2 border-[#548a33] bg-gradient-to-b from-[#46782a] to-[#32581c] text-[#f5ffec] hover:brightness-110'
                              }`}
                            >
                              {equipped ? 'Equipped ✓' : 'Equip'}
                            </button>
                          ) : affordable ? (
                            <button
                              type="button"
                              onClick={() => handleBuyClick(item)}
                              className="min-h-[36px] whitespace-nowrap shrink-0 rounded-xl border-2 border-[#8c5222] bg-gradient-to-b from-[#7c431a] to-[#592b0c] px-4 py-1 text-xs sm:text-sm font-bold text-[#fff6e0] shadow-[0_2px_0_#2b1305,0_3px_6px_rgba(0,0,0,0.25)] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_1px_0_#2b1305] transition-all focus-visible:outline-2 focus-visible:outline-[#86efac]"
                            >
                              Buy
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="min-h-[36px] whitespace-nowrap shrink-0 rounded-xl border-2 border-[#6d5138] bg-[#423020] px-3 py-1 text-xs font-semibold text-[#c9b49f] cursor-not-allowed tabular-nums"
                            >
                              Need {shortfall} 💧
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
