import React, { Component, Suspense, lazy, type ReactNode, useEffect, useMemo, useState } from 'react';
import cardBgArchfeyImg from '../assets/images/card_bg_archfey_nebula_1795774783780.jpg';
import cardBgCosmicImg from '../assets/images/card_bg_cosmic_nebula_1795774782497.jpg';
import cardBgSapphireImg from '../assets/images/card_bg_sapphire_nebula_1795774785238.jpg';
import cardBgSolarImg from '../assets/images/card_bg_solar_nebula_1795774782066.jpg';
import cardBgTealImg from '../assets/images/card_bg_teal_nebula_1795774781657.jpg';
import shopTwilightForestImg from '../assets/images/shop_twilight_forest_bg_1795774785244.jpg';
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
        <div className="flex h-[250px] sm:h-[285px] w-full items-center justify-center rounded-xl border border-[#9a7c5e]/80 bg-[#0d2420] p-4 text-center text-sm font-medium text-[#e9f5f1]">
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
      fill="#3ee2c8"
      stroke="#14584e"
      strokeWidth="1.3"
    />
    <path
      d="M10 4.2C12.4 7.5 14.2 10.2 14.2 12.6C14.2 15 12.2 16.5 10 16.5C7.8 16.5 5.8 15 5.8 12.6C5.8 10.2 7.6 7.5 10 4.2Z"
      fill="#7ff5e3"
      fillOpacity="0.8"
    />
    <circle cx="8" cy="11.2" r="1.5" fill="#ffffff" />
  </svg>
);

interface CardAtmosphere {
  bgImage: string;
  bgClassName: string;
  cardBg: string;
  scrimBg: string;
  iconBg: string;
  iconBorder: string;
  iconGlow: string;
  isDarkTile: boolean;
}

function getCardAtmosphere(accentColor: string): CardAtmosphere {
  switch (accentColor.toLowerCase()) {
    case '#e59a1a':
    case '#eab308':
    case '#d97706':
    case '#f97316':
    case '#ea580c':
      return {
        bgImage: cardBgSolarImg,
        bgClassName: 'object-cover object-top scale-115 opacity-90',
        cardBg: 'linear-gradient(145deg, #5c380e 0%, #3d2409 52%, #241404 100%)',
        scrimBg:
          'linear-gradient(180deg, rgba(66,38,8,0.28) 0%, rgba(44,24,5,0.58) 55%, rgba(28,15,3,0.88) 100%)',
        iconBg: 'linear-gradient(180deg, #fffaf0 0%, #fcedcf 100%)',
        iconBorder: '#f6d594',
        iconGlow: '0 0 20px rgba(251, 191, 36, 0.42), inset 0 1px 0 rgba(255,255,255,0.9)',
        isDarkTile: false,
      };
    case '#d946ef':
    case '#8b5cf6':
    case '#6366f1':
    case '#4f46e5':
    case '#7c3aed':
      return {
        bgImage: cardBgCosmicImg,
        bgClassName: 'object-cover object-center opacity-92',
        cardBg: 'linear-gradient(145deg, #321d4f 0%, #1f1639 54%, #120d26 100%)',
        scrimBg:
          'linear-gradient(180deg, rgba(28,18,52,0.25) 0%, rgba(22,14,42,0.48) 58%, rgba(14,9,28,0.82) 100%)',
        iconBg: 'linear-gradient(145deg, #43226b 0%, #261243 100%)',
        iconBorder: 'rgba(192, 132, 252, 0.72)',
        iconGlow: '0 0 18px rgba(192, 132, 252, 0.36), inset 0 1px 1px rgba(255,255,255,0.16)',
        isDarkTile: true,
      };
    case '#ec4899':
    case '#c026d3':
    case '#dc2626':
    case '#e11d48':
      return {
        bgImage: cardBgArchfeyImg,
        bgClassName: 'object-cover object-top opacity-92',
        cardBg: 'linear-gradient(145deg, #69254e 0%, #461936 52%, #290e20 100%)',
        scrimBg:
          'linear-gradient(180deg, rgba(84,25,62,0.22) 0%, rgba(56,16,42,0.48) 58%, rgba(34,10,25,0.82) 100%)',
        iconBg: 'linear-gradient(180deg, #fff5fa 0%, #fbd7ea 100%)',
        iconBorder: '#f9a8d4',
        iconGlow: '0 0 20px rgba(244, 114, 182, 0.45), inset 0 1px 0 rgba(255,255,255,0.9)',
        isDarkTile: false,
      };
    case '#0ea5e9':
    case '#3b82f6':
    case '#0284c7':
    case '#2563eb':
      return {
        bgImage: cardBgSapphireImg,
        bgClassName: 'object-cover object-top opacity-92',
        cardBg: 'linear-gradient(145deg, #16405d 0%, #0e2b42 54%, #081a2a 100%)',
        scrimBg:
          'linear-gradient(180deg, rgba(16,46,74,0.24) 0%, rgba(11,32,54,0.5) 58%, rgba(7,20,34,0.84) 100%)',
        iconBg: 'linear-gradient(180deg, #f3faff 0%, #dcf0fd 100%)',
        iconBorder: '#93c5fd',
        iconGlow: '0 0 20px rgba(56, 189, 248, 0.4), inset 0 1px 0 rgba(255,255,255,0.9)',
        isDarkTile: false,
      };
    default:
      return {
        bgImage: cardBgTealImg,
        bgClassName: 'object-cover object-center opacity-88',
        cardBg: 'linear-gradient(145deg, #1a4b52 0%, #11353b 54%, #0a2227 100%)',
        scrimBg:
          'linear-gradient(180deg, rgba(19,60,66,0.28) 0%, rgba(12,42,47,0.52) 58%, rgba(7,26,30,0.84) 100%)',
        iconBg: 'linear-gradient(180deg, #f3fbf9 0%, #dcf3ee 100%)',
        iconBorder: '#99f6e4',
        iconGlow: '0 0 20px rgba(45, 212, 191, 0.38), inset 0 1px 0 rgba(255,255,255,0.9)',
        isDarkTile: false,
      };
  }
}

const ItemIcon: React.FC<{ id: ShopItemId; size?: number }> = ({ id, size = 48 }) => {
  switch (id) {
    case 'super_sky_leap':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 3.5L23.5 13.5H18.8V22.5H13.2V13.5H8.5L16 3.5Z"
            fill="#0d9e83"
            stroke="#064e40"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <ellipse cx="16" cy="25.5" rx="10.2" ry="2.7" stroke="#e07a18" strokeWidth="2.2" />
        </svg>
      );
    case 'super_nova_pulse':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle
            cx="16"
            cy="16"
            r="11"
            stroke="#d97706"
            strokeWidth="2"
            strokeDasharray="3.2 2.6"
          />
          <path
            d="M16 4.5L19.2 12.8L27.5 16L19.2 19.2L16 27.5L12.8 19.2L4.5 16L12.8 12.8L16 4.5Z"
            fill="#fbbf24"
            stroke="#92400e"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'super_star_magnet':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <circle
            cx="16"
            cy="16"
            r="10.5"
            stroke="#e879f9"
            strokeWidth="3.1"
            strokeDasharray="4.6 3.4"
            strokeLinecap="round"
          />
          <circle cx="16" cy="16" r="5.2" fill="#ec4899" stroke="#f9a8d4" strokeWidth="0.9" />
          <circle cx="7.5" cy="9" r="1.8" fill="#fde047" />
          <circle cx="24.5" cy="22.5" r="1.8" fill="#5eead4" />
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
            d="M16 4.2L19 12.5L27.3 15.5L19 18.5L16 26.8L13 18.5L4.7 15.5L13 12.5Z"
            fill="#ec4899"
            stroke="#831843"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M8 6.5L9.1 8.8L11.4 9.9L9.1 11L8 13.3L6.9 11L4.6 9.9L6.9 8.8Z" fill="#14b8a6" />
          <circle cx="24" cy="24" r="2.3" fill="#f59e0b" />
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
            stroke="#bae6fd"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M21 24.5C22.5 18 24.5 14 26.5 7.5M22.5 16L26.5 14M22 12L19.5 8.5"
            stroke="#bae6fd"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="16" cy="22" r="2.6" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="0.9" />
        </svg>
      );
    case 'astral_wizard':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <ellipse cx="16" cy="23.5" rx="11.5" ry="3.2" fill="#7c3aed" stroke="#e9d5ff" strokeWidth="1.5" />
          <path d="M8.5 22.5L17 6.5L23.5 22.5Z" fill="#7c3aed" stroke="#e9d5ff" strokeWidth="1.5" />
          <circle cx="17" cy="6.5" r="2.6" fill="#fde047" />
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
          <path d="M5.5 21.5C8.5 14 23.5 14 26.5 21.5" stroke="#f0abfc" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="16" cy="11.5" r="3" fill="#fde047" stroke="#f59e0b" strokeWidth="0.9" />
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
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-[#041210] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grove-shop-title"
    >
      <div className="relative w-full h-full flex flex-col bg-[#08221e] overflow-hidden">
        {/* Painterly Twilight Enchanted Forest Backdrop */}
        <img
          src={shopTwilightForestImg}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-85"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(20,76,68,0.42)_0%,rgba(6,28,25,0.72)_62%,rgba(3,15,14,0.88)_100%)]"
        />

        {/* Delicate Gold Filigree Corner & Perimeter Flourishes */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-1.5 sm:inset-2.5 z-20 rounded-xl border border-[#d6b879]/30">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="absolute -top-0.5 -left-0.5 opacity-80">
            <path d="M2 44V12C2 6.5 6.5 2 12 2H44" stroke="#dfbe7b" strokeWidth="1.4" />
            <path d="M7 24C7 13 13 7 24 7" stroke="#dfbe7b" strokeWidth="1.1" strokeOpacity="0.7" />
            <circle cx="11" cy="11" r="2" fill="#dfbe7b" />
          </svg>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="absolute -top-0.5 -right-0.5 opacity-80">
            <path d="M54 44V12C54 6.5 49.5 2 44 2H12" stroke="#dfbe7b" strokeWidth="1.4" />
            <path d="M49 24C49 13 43 7 32 7" stroke="#dfbe7b" strokeWidth="1.1" strokeOpacity="0.7" />
            <circle cx="45" cy="11" r="2" fill="#dfbe7b" />
          </svg>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="absolute -bottom-0.5 -right-0.5 opacity-80">
            <path d="M54 12V44C54 49.5 49.5 54 44 54H12" stroke="#dfbe7b" strokeWidth="1.4" />
            <path d="M49 32C49 43 43 49 32 49" stroke="#dfbe7b" strokeWidth="1.1" strokeOpacity="0.7" />
            <circle cx="45" cy="45" r="2" fill="#dfbe7b" />
          </svg>
        </div>

        {/* Ambient Stardust Motes */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-1 overflow-hidden">
          <div className="absolute top-14 left-1/3 w-1.5 h-1.5 rounded-full bg-[#fde68a] opacity-55" />
          <div className="absolute top-1/4 right-16 w-1.5 h-1.5 rounded-full bg-[#99f6e4] opacity-50" />
          <div className="absolute top-20 left-1/2 w-1 h-1 rounded-full bg-[#fef08a] opacity-60" />
          <div className="absolute bottom-24 left-1/2 w-1.5 h-1.5 rounded-full bg-[#fef08a] opacity-45" />
        </div>

        {/* Centered Responsive Container inside Full-Screen Canvas */}
        <div className="relative z-10 flex-1 min-h-0 w-full max-w-[1380px] mx-auto flex flex-col px-3 sm:px-7 pt-3 sm:pt-4 pb-2 sm:pb-4">
          {/* Open Seamless Header Row with Subtle Horizon Rule */}
          <div className="flex items-center justify-between gap-3 border-b border-[#70b8a4]/25 pb-3 sm:pb-3.5 shrink-0">
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-5">
              <h2
                id="grove-shop-title"
                className="font-display text-2xl sm:text-[30px] font-medium text-[#f5eedc] tracking-tight"
              >
                Grove Shop
              </h2>

              {/* Brushed Warm Gold Dewdrops Plaque */}
              <div className="flex items-center gap-2 rounded-md border border-[#e5c782] bg-gradient-to-b from-[#f9edd0] via-[#ecd69e] to-[#dab970] px-3.5 py-1.5 shadow-[0_3px_10px_rgba(0,0,0,0.4),inset_0_0_0_2px_rgba(92,68,26,0.2),inset_0_1px_0_rgba(255,255,255,0.75)] text-sm sm:text-base font-semibold text-[#2d1e0a]">
                <DewdropIcon size={17} />
                <span className="tabular-nums font-bold">{progress.dewdrops}</span>
                <span className="font-medium">Dewdrops</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#cbb789]/85 bg-gradient-to-b from-[#395d58] to-[#233d3a] px-5 py-1.5 text-sm font-medium text-[#eef4f1] shadow-[0_3px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(12,28,26,0.72),inset_0_0_0_3px_rgba(220,205,165,0.28)] hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-[#5eead4]"
            >
              Close
            </button>
          </div>

          {/* Workspace: Mobile scrolls together; Desktop (lg+) pins Left Try-On & Tabs while ONLY Item Cards scroll */}
          <div
            className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:flex lg:flex-col pt-3.5 sm:pt-4 pr-0.5 lg:pr-0"
            style={{ touchAction: 'pan-y' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[410px_1fr] xl:grid-cols-[435px_1fr] gap-4 sm:gap-6 items-start lg:items-stretch lg:flex-1 lg:min-h-0 pb-2 lg:pb-0">
              {/* Left Column: 3D Stage + Wearing Now Bronze Panel (Pinned on Desktop) */}
              <div className="flex flex-col gap-3 lg:max-h-full lg:overflow-y-auto lg:pr-0.5">
                <PreviewErrorBoundary>
                  <Suspense
                    fallback={
                      <div className="flex h-[265px] sm:h-[300px] w-full items-center justify-center rounded-xl border border-[#b59272]/80 bg-[#0d2420] text-sm font-medium text-[#e9f5f1]">
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

                {/* Wearing Now Warm Walnut & Brushed Gold-Bronze Plaque Panel */}
                <div className="rounded-xl border border-[#dfc080]/90 bg-gradient-to-b from-[#3a2a1e]/96 to-[#221710]/98 p-3.5 sm:p-4 shadow-[0_12px_28px_rgba(0,0,0,0.58),inset_0_0_0_2px_rgba(24,15,9,0.75),inset_0_0_0_3px_rgba(223,192,128,0.28)] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-[15px] font-medium text-[#f5ecda]">
                      {isPreviewDirty ? 'Trying On Preview' : 'Wearing Now'}
                    </span>
                    {isPreviewDirty && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewLoadout(null);
                          setFlyingActive(false);
                        }}
                        className="min-h-[28px] whitespace-nowrap shrink-0 rounded-md border border-[#72c9b4]/70 bg-[#17423a] px-2.5 py-0.5 text-xs font-medium text-[#d1fae5] hover:bg-[#1e544a] transition-colors"
                      >
                        Reset Try-On
                      </button>
                    )}
                  </div>

                  {/* Brushed Champagne-Bronze Metallic Loadout Slots */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div
                      style={{
                        background:
                          'linear-gradient(125deg, #625033 0%, #9b8153 48%, #b99b66 72%, #725c39 100%)',
                      }}
                      className="rounded-md border border-[#e0c489]/75 px-3 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,248,225,0.28)]"
                    >
                      <div className="text-[11px] font-medium text-[#f2e4c7]">Super Power</div>
                      <div
                        className={`text-xs sm:text-sm font-semibold truncate mt-0.5 ${
                          powerInfo.differsFromEquipped ? 'text-[#fef08a]' : 'text-white'
                        }`}
                      >
                        {powerInfo.name}
                      </div>
                    </div>

                    <div
                      style={{
                        background:
                          'linear-gradient(125deg, #625033 0%, #9b8153 48%, #b99b66 72%, #725c39 100%)',
                      }}
                      className="rounded-md border border-[#e0c489]/75 px-3 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,248,225,0.28)]"
                    >
                      <div className="text-[11px] font-medium text-[#f2e4c7]">Headwear</div>
                      <div
                        className={`text-xs sm:text-sm font-semibold truncate mt-0.5 ${
                          hatInfo.differsFromEquipped ? 'text-[#fef08a]' : 'text-white'
                        }`}
                      >
                        {hatInfo.name}
                      </div>
                    </div>

                    <div
                      style={{
                        background:
                          'linear-gradient(125deg, #625033 0%, #9b8153 48%, #b99b66 72%, #725c39 100%)',
                      }}
                      className="rounded-md border border-[#e0c489]/75 px-3 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,248,225,0.28)]"
                    >
                      <div className="text-[11px] font-medium text-[#f2e4c7]">Cloak</div>
                      <div
                        className={`text-xs sm:text-sm font-semibold truncate mt-0.5 ${
                          cloakInfo.differsFromEquipped ? 'text-[#fef08a]' : 'text-white'
                        }`}
                      >
                        {cloakInfo.name}
                      </div>
                    </div>

                    <div
                      style={{
                        background:
                          'linear-gradient(125deg, #625033 0%, #9b8153 48%, #b99b66 72%, #725c39 100%)',
                      }}
                      className="rounded-md border border-[#e0c489]/75 px-3 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,248,225,0.28)]"
                    >
                      <div className="text-[11px] font-medium text-[#f2e4c7]">Relic</div>
                      <div
                        className={`text-xs sm:text-sm font-semibold truncate mt-0.5 ${
                          charmInfo.differsFromEquipped ? 'text-[#fef08a]' : 'text-white'
                        }`}
                      >
                        {charmInfo.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Category Tabs (Pinned on Desktop) & Independently Scrollable Item Cards */}
              <div className="flex flex-col gap-4 min-w-0 lg:h-full lg:min-h-0">
                {/* Beveled Stone-Emerald Category Tabs */}
                <div className="flex flex-wrap items-center gap-2.5 pb-2.5 border-b border-[#5fa38f]/20 shrink-0">
                  {CATEGORY_TABS.map((tab) => {
                    const active = category === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCategory(tab.id)}
                        className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-4 sm:px-5 py-1.5 text-xs sm:text-sm transition-all focus-visible:outline-2 focus-visible:outline-[#5eead4] ${
                          active
                            ? 'border border-[#8de2c7] bg-gradient-to-b from-[#1f705d] to-[#114539] text-white font-semibold shadow-[0_3px_12px_rgba(18,125,98,0.4),inset_0_0_0_2px_rgba(10,36,30,0.6),inset_0_0_0_3px_rgba(165,243,225,0.3)]'
                            : 'border border-[#82a39b]/75 bg-gradient-to-b from-[#456461] to-[#2b4240] text-[#e4f0ec] font-medium shadow-[0_2px_6px_rgba(0,0,0,0.35),inset_0_0_0_2px_rgba(15,29,27,0.62),inset_0_0_0_3px_rgba(220,240,235,0.18)] hover:brightness-110'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* 2-Column Atmospheric Gold-Framed Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-2 lg:pb-4 lg:content-start">
                  {filteredItems.map((item) => {
                    const owned = ownedSet.has(item.id);
                    const equipped = progress.equipped[item.category] === item.id;
                    const tryingOn = displayedLoadout[item.category] === item.id;
                    const affordable = progress.dewdrops >= item.price;
                    const shortfall = Math.max(0, item.price - progress.dewdrops);
                    const atmosphere = getCardAtmosphere(item.accentColor);

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: atmosphere.cardBg,
                        }}
                        className={`relative overflow-hidden rounded-xl p-4 sm:p-5 min-h-[172px] flex flex-col justify-between gap-4 transition-all ${
                          tryingOn
                            ? 'border border-[#82e6ca] ring-2 ring-[#5eead4]/45 shadow-[0_12px_28px_rgba(0,0,0,0.52),inset_0_0_0_3px_rgba(10,20,18,0.52),inset_0_0_0_4px_rgba(130,230,202,0.4)]'
                            : equipped
                              ? 'border border-[#86efac]/85 shadow-[0_10px_24px_rgba(0,0,0,0.48),inset_0_0_0_3px_rgba(10,20,18,0.52),inset_0_0_0_4px_rgba(134,239,172,0.3)]'
                              : 'border border-[#d4b679]/85 shadow-[0_10px_24px_rgba(0,0,0,0.48),inset_0_0_0_3px_rgba(8,14,14,0.55),inset_0_0_0_4px_rgba(225,195,132,0.32)]'
                        }`}
                      >
                        {/* Painterly Nebula Texture + Legibility Contrast Scrim */}
                        <img
                          src={atmosphere.bgImage}
                          alt=""
                          aria-hidden="true"
                          referrerPolicy="no-referrer"
                          className={`pointer-events-none absolute inset-0 h-full w-full ${atmosphere.bgClassName}`}
                        />
                        <div
                          aria-hidden="true"
                          style={{ background: atmosphere.scrimBg }}
                          className="pointer-events-none absolute inset-0"
                        />

                        {/* Top Section: Luminous Icon Tile + Title + Price + Short Perk */}
                        <div className="relative z-10 flex items-start gap-3.5">
                          <div
                            style={{
                              background: atmosphere.iconBg,
                              borderColor: atmosphere.iconBorder,
                              boxShadow: atmosphere.iconGlow,
                            }}
                            className="relative flex h-[70px] w-[70px] sm:h-[74px] sm:w-[74px] shrink-0 items-center justify-center rounded-xl border overflow-hidden"
                          >
                            {atmosphere.isDarkTile && (
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(232,121,249,0.22),transparent_65%)]"
                              />
                            )}
                            <ItemIcon id={item.id} size={46} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-base sm:text-[17px] font-semibold text-white leading-snug">
                                {item.name}
                              </h3>
                              <span className="flex items-center gap-1 text-sm sm:text-base font-semibold text-[#f5eed8] shrink-0 tabular-nums">
                                <DewdropIcon size={15} />
                                {item.price}
                              </span>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-[#e4efeb]/92 leading-snug">
                              {item.shortPerk}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Bar: Quiet Category Label + Beveled Double-Bordered Gold-Trimmed Action Buttons */}
                        <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs sm:text-sm font-normal text-[#d4e2dd]">
                            {CATEGORY_LABELS[item.category]}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTryOn(item)}
                              className={`min-h-[38px] whitespace-nowrap shrink-0 rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-semibold shadow-[0_3px_8px_rgba(0,0,0,0.42),inset_0_0_0_2px_rgba(10,20,18,0.6),inset_0_0_0_3px_rgba(255,240,200,0.2)] hover:brightness-110 active:translate-y-px transition-all focus-visible:outline-2 focus-visible:outline-[#5eead4] ${
                                tryingOn
                                  ? 'border border-[#7ee2c6] bg-gradient-to-b from-[#25695b] to-[#17463c] text-[#ffffff]'
                                  : 'border border-[#cbb07a] bg-gradient-to-b from-[#495f56] to-[#2c3b35] text-[#f6f0e2]'
                              }`}
                            >
                              {tryingOn ? 'Trying' : 'Try On'}
                            </button>

                            {owned ? (
                              <button
                                type="button"
                                onClick={() => handleEquipClick(item)}
                                className={`min-h-[38px] whitespace-nowrap shrink-0 rounded-md px-4 py-1.5 text-xs sm:text-sm font-semibold shadow-[0_3px_8px_rgba(0,0,0,0.42),inset_0_0_0_2px_rgba(8,28,24,0.6),inset_0_0_0_3px_rgba(255,240,200,0.24)] hover:brightness-110 active:translate-y-px transition-all focus-visible:outline-2 focus-visible:outline-[#5eead4] ${
                                  equipped
                                    ? 'border border-[#7ee2c6] bg-gradient-to-b from-[#2c8c76] to-[#185c4d] text-[#ffffff]'
                                    : 'border border-[#d6ba7d] bg-gradient-to-b from-[#1f7563] to-[#124b40] text-[#fff9eb]'
                                }`}
                              >
                                {equipped ? 'Equipped' : 'Equip'}
                              </button>
                            ) : affordable ? (
                              <button
                                type="button"
                                onClick={() => handleBuyClick(item)}
                                className="min-h-[38px] whitespace-nowrap shrink-0 rounded-md border border-[#d6ba7d] bg-gradient-to-b from-[#1f7563] to-[#124b40] px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#fff9eb] shadow-[0_3px_8px_rgba(0,0,0,0.42),inset_0_0_0_2px_rgba(8,28,24,0.6),inset_0_0_0_3px_rgba(255,240,200,0.24)] hover:brightness-110 active:translate-y-px transition-all focus-visible:outline-2 focus-visible:outline-[#5eead4]"
                              >
                                Buy
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="min-h-[38px] whitespace-nowrap shrink-0 rounded-md border border-[#72857f]/65 bg-[#1a2b28]/90 px-3 py-1.5 text-xs font-medium text-[#a3b7b1] cursor-not-allowed tabular-nums shadow-[inset_0_0_0_2px_rgba(10,20,18,0.55)]"
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
    </div>
  );
};
