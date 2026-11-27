import React, { useId } from 'react';
import type { MobileControlHandedness, MobileControlStyle } from './TouchControls';

interface SettingsModalProps {
  visible: boolean;
  mobileControlStyle: MobileControlStyle;
  mobileHandedness: MobileControlHandedness;
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  onChangeMobileControlStyle: (style: MobileControlStyle) => void;
  onChangeMobileHandedness: (side: MobileControlHandedness) => void;
  onToggleMute: () => void;
  onMusicVolumeChange: (val: number) => void;
  onSfxVolumeChange: (val: number) => void;
  onPreviewSfx: () => void;
  onClose: () => void;
}

const CornerMoss: React.FC<{
  position: 'tl' | 'tr' | 'bl' | 'br';
  withMushrooms?: boolean;
  size?: 'sm' | 'lg';
}> = ({ position, withMushrooms = true, size = 'lg' }) => {
  const posClass =
    position === 'tl'
      ? '-top-2 -left-2'
      : position === 'tr'
        ? '-top-2 -right-2 -scale-x-100'
        : position === 'bl'
          ? '-bottom-2 -left-2 -scale-y-100'
          : '-bottom-2 -right-2 scale-x-[-1] scale-y-[-1]';

  const dims = size === 'lg' ? 'w-20 h-16' : 'w-14 h-10';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 84 64"
      fill="none"
      className={`pointer-events-none absolute z-30 ${dims} ${posClass}`}
    >
      {/* Golden curling botanical vine */}
      <path
        d="M8 54 C6 36, 12 20, 26 12 C42 4, 60 8, 78 6"
        stroke="#c99b49"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M14 42 C18 32, 24 26, 33 22"
        stroke="#dfb96d"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse cx="44" cy="7" rx="5.5" ry="2.6" transform="rotate(-14 44 7)" fill="#dfb96d" />
      <ellipse cx="64" cy="7" rx="5" ry="2.4" transform="rotate(10 64 7)" fill="#c99b49" />
      <ellipse cx="10" cy="36" rx="2.6" ry="5" transform="rotate(-12 10 36)" fill="#dfb96d" />

      {/* Lush layered green moss tuft */}
      <path
        d="M3 22 C1 12, 7 3, 18 3 C25 2, 33 4, 38 9 C35 14, 28 16, 20 17 C16 22, 11 28, 5 29 Z"
        fill="#4f6d24"
        stroke="#2f4212"
        strokeWidth="1.2"
      />
      <path
        d="M5 18 C5 10, 11 5, 20 5 C26 5, 31 7, 34 10 C29 13, 23 13, 17 15 C14 19, 10 23, 6 24 Z"
        fill="#7da13b"
      />
      <circle cx="15" cy="9" r="3.4" fill="#9cc24c" />
      <circle cx="24" cy="8.5" r="2.6" fill="#a8cf55" />

      {/* Tiny woodland mushrooms */}
      {withMushrooms && (
        <g transform="translate(22, 11) rotate(10)">
          <rect x="3.4" y="6" width="2.4" height="5.5" rx="1" fill="#f3e6c8" />
          <path d="M0 6.5 C1 2, 8 2, 9 6.5 Z" fill="#e69a5c" stroke="#7c4119" strokeWidth="0.9" />
          <circle cx="3" cy="4.8" r="0.8" fill="#fff5e0" />
          <circle cx="6" cy="5.1" r="0.7" fill="#fff5e0" />
          <g transform="translate(8, 3)">
            <rect x="2.2" y="4" width="1.8" height="4" rx="0.8" fill="#f3e6c8" />
            <path d="M0 4.5 C0.8 1.4, 5.5 1.4, 6.2 4.5 Z" fill="#f1b672" stroke="#7c4119" strokeWidth="0.8" />
          </g>
        </g>
      )}

      {/* Firefly sparkles */}
      <circle cx="18" cy="4" r="1.5" fill="#fff3b0" />
      <circle cx="38" cy="14" r="1.2" fill="#ffe68c" />
    </svg>
  );
};

const WoodGrainPattern: React.FC<{ id: string }> = ({ id }) => (
  <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-35">
    <defs>
      <pattern id={id} width="160" height="40" patternUnits="userSpaceOnUse">
        <path
          d="M0 9 Q40 5 80 10 T160 8 M0 22 Q45 26 95 20 T160 23 M0 34 Q55 30 110 35 T160 33"
          fill="none"
          stroke="#2c190c"
          strokeWidth="1.2"
        />
        <path
          d="M0 15 Q50 18 100 13 T160 16"
          fill="none"
          stroke="#a87c51"
          strokeWidth="0.8"
          strokeOpacity="0.45"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
);

const CarvedArrowsArtwork: React.FC = () => (
  <svg width="118" height="48" viewBox="0 0 118 48" fill="none" aria-hidden="true" className="drop-shadow-[0_3px_5px_rgba(0,0,0,0.45)]">
    <defs>
      <linearGradient id="woodArrowGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c59764" />
        <stop offset="55%" stopColor="#9d6f42" />
        <stop offset="100%" stopColor="#724c28" />
      </linearGradient>
    </defs>
    {/* Left Carved Wooden Arrow */}
    <path
      d="M5 24 L27 7 L27 15 L52 15 C54.5 15 56 16.5 56 19 L56 29 C56 31.5 54.5 33 52 33 L27 33 L27 41 Z"
      fill="url(#woodArrowGrad)"
      stroke="#3c220f"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M11 24 L25 12.5 L25 18 L51.5 18 L51.5 30 L25 30 L25 35.5 Z"
      fill="none"
      stroke="#e2bc8b"
      strokeOpacity="0.45"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
    {/* Recessed left triangle */}
    <path d="M26 24 L37 18.5 L37 29.5 Z" fill="#523319" stroke="#d9ae77" strokeWidth="0.9" strokeLinejoin="round" />

    {/* Right Carved Wooden Arrow */}
    <path
      d="M113 24 L91 7 L91 15 L66 15 C63.5 15 62 16.5 62 19 L62 29 C62 31.5 63.5 33 66 33 L91 33 L91 41 Z"
      fill="url(#woodArrowGrad)"
      stroke="#3c220f"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M107 24 L93 12.5 L93 18 L66.5 18 L66.5 30 L93 30 L93 35.5 Z"
      fill="none"
      stroke="#e2bc8b"
      strokeOpacity="0.45"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
    {/* Recessed right triangle */}
    <path d="M92 24 L81 18.5 L81 29.5 Z" fill="#523319" stroke="#d9ae77" strokeWidth="0.9" strokeLinejoin="round" />
  </svg>
);

const RoundStickArtwork: React.FC = () => (
  <svg width="64" height="54" viewBox="0 0 64 54" fill="none" aria-hidden="true" className="drop-shadow-[0_3px_5px_rgba(0,0,0,0.48)]">
    <defs>
      <linearGradient id="stickWoodGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c79966" />
        <stop offset="60%" stopColor="#8f6239" />
        <stop offset="100%" stopColor="#5d3b1e" />
      </linearGradient>
      <radialGradient id="stickGemGrad" cx="38%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#d8fff6" />
        <stop offset="38%" stopColor="#43e5c5" />
        <stop offset="100%" stopColor="#0e6e5c" />
      </radialGradient>
    </defs>
    {/* Wooden circular base */}
    <ellipse cx="32" cy="40" rx="22" ry="11" fill="#4f321a" stroke="#2d190a" strokeWidth="1.8" />
    <ellipse cx="32" cy="38.2" rx="19" ry="8.8" fill="url(#stickWoodGrad)" stroke="#3b2210" strokeWidth="1.4" />
    <ellipse cx="32" cy="36.5" rx="13" ry="5.5" fill="#462b15" />
    {/* Front base diamond gem */}
    <path d="M32 42.5 L35.5 45 L32 47.5 L28.5 45 Z" fill="#5eead4" stroke="#184e45" strokeWidth="0.9" />

    {/* Stalk */}
    <path d="M27 36 L28.5 23 L35.5 23 L37 36 Z" fill="#6b4626" stroke="#331d0c" strokeWidth="1.4" />

    {/* Top knob head */}
    <ellipse cx="32" cy="14" rx="14.5" ry="11.5" fill="url(#stickWoodGrad)" stroke="#331d0c" strokeWidth="1.8" />
    <ellipse cx="32" cy="11.5" rx="11.5" ry="7.8" fill="#b48352" stroke="#e4c290" strokeOpacity="0.45" strokeWidth="1" />
    {/* Glowing turquoise cabochon gem */}
    <ellipse cx="32" cy="11" rx="7.6" ry="5.5" fill="url(#stickGemGrad)" stroke="#234d44" strokeWidth="1.2" />
    <ellipse cx="29.6" cy="9.4" rx="2.4" ry="1.3" fill="#ffffff" fillOpacity="0.82" />
  </svg>
);

const AcornArtwork: React.FC<{ pointRight: boolean }> = ({ pointRight }) => (
  <svg
    width="38"
    height="32"
    viewBox="0 0 40 32"
    fill="none"
    aria-hidden="true"
    className={`shrink-0 transition-transform duration-200 drop-shadow-[0_3px_5px_rgba(0,0,0,0.6)] ${
      pointRight ? '-scale-x-100' : ''
    }`}
  >
    <defs>
      <linearGradient id="acornBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ebc36e" />
        <stop offset="55%" stopColor="#bd8734" />
        <stop offset="100%" stopColor="#7a4e16" />
      </linearGradient>
      <linearGradient id="acornCap" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8d6237" />
        <stop offset="100%" stopColor="#4c3017" />
      </linearGradient>
    </defs>
    {/* Stem */}
    <path d="M31 16 C35 16, 37 14, 38 11" stroke="#4a2e14" strokeWidth="2.8" strokeLinecap="round" />
    {/* Acorn nut pointing left */}
    <path
      d="M23 7 C14 7, 5 11.5, 3 16 C5 20.5, 14 25, 23 25 Z"
      fill="url(#acornBody)"
      stroke="#3f240b"
      strokeWidth="1.6"
    />
    <ellipse cx="14" cy="12.5" rx="5.5" ry="2" fill="#fff2c2" fillOpacity="0.45" />
    {/* Textured acorn cap on right */}
    <path
      d="M21 5.5 C27 4.5, 33 9.5, 33 16 C33 22.5, 27 27.5, 21 26.5 C19.5 21, 19.5 11, 21 5.5 Z"
      fill="url(#acornCap)"
      stroke="#2c190a"
      strokeWidth="1.6"
    />
    <path d="M23 9 L29 13 M23 15 L30 19 M23 21 L28 24 M28 9 L22 14 M29 15 L22 20" stroke="#351f0d" strokeWidth="1" strokeOpacity="0.7" />
  </svg>
);

const BranchVolumeSlider: React.FC<{
  label: string;
  value: number;
  variant: 'music' | 'effects';
  muted: boolean;
  onChange: (val: number) => void;
  onPreview?: () => void;
}> = ({ label, value, variant, muted, onChange, onPreview }) => {
  const pct = Math.round(value * 100);
  const uid = useId().replace(/:/g, '');
  const isMusic = variant === 'music';

  return (
    <div className="block select-none">
      <div className="flex items-center justify-between text-xs sm:text-[13px] mb-1">
        <span className="font-semibold text-[#3a2411]">{label}</span>
        <span className="tabular-nums font-bold text-[#3a2411]">{pct}%</span>
      </div>

      <div className="relative h-7">
        {/* Gnarled Wooden Branch Track Artwork */}
        <svg
          aria-hidden="true"
          viewBox="0 0 460 32"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.28)]"
        >
          <defs>
            <linearGradient id={`bark_${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94673f" />
              <stop offset="45%" stopColor="#6c4727" />
              <stop offset="100%" stopColor="#462b15" />
            </linearGradient>
          </defs>
          {/* Decorative little branch twigs */}
          <path d="M22 10 C15 6, 10 4, 5 5" stroke="#5d3c20" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M38 22 C45 26, 50 28, 56 26" stroke="#5d3c20" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M285 9 C292 5, 299 3, 306 5" stroke="#5d3c20" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M312 22 C305 26, 298 28, 290 27" stroke="#5d3c20" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M438 11 C444 7, 450 6, 455 8" stroke="#5d3c20" strokeWidth="2.2" strokeLinecap="round" />

          {/* Main branch casing */}
          <rect
            x="4"
            y="8"
            width="452"
            height="16"
            rx="8"
            fill={`url(#bark_${uid})`}
            stroke="#361f0d"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
          />
          {/* Inner recessed groove */}
          <rect
            x="10"
            y="11.5"
            width="440"
            height="9"
            rx="4.5"
            fill="#341e0d"
            stroke="#241407"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Glowing Magic Stream Fill */}
        <div className="pointer-events-none absolute inset-x-[12px] top-1/2 -translate-y-1/2 h-[8px] overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-[width] duration-75 relative"
            style={{
              width: `${pct}%`,
              opacity: muted ? 0.45 : 1,
              background: isMusic
                ? 'linear-gradient(90deg, #169a8d 0%, #44ebd7 58%, #b3fff6 100%)'
                : 'linear-gradient(90deg, #4b8730 0%, #83c954 62%, #c9f79c 100%)',
              boxShadow: isMusic
                ? '0 0 10px rgba(72, 240, 220, 0.75)'
                : '0 0 10px rgba(145, 215, 95, 0.65)',
            }}
          >
            {/* Tiny fairy sparkle specks along active stream */}
            {pct > 8 && (
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-85"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 12% 45%, #ffffff 1px, transparent 1.4px), radial-gradient(circle at 34% 60%, #e2fffb 1px, transparent 1.4px), radial-gradient(circle at 58% 38%, #ffffff 1.2px, transparent 1.6px), radial-gradient(circle at 82% 55%, #ffffff 1px, transparent 1.4px)',
                }}
              />
            )}
          </div>
        </div>

        {/* Crystal Dewdrop / Moss Berry Orb Thumb */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-6 w-6 rounded-full"
          style={{
            left: `calc(14px + (100% - 28px) * ${pct / 100})`,
            background: isMusic
              ? 'radial-gradient(circle at 35% 30%, #ffffff 0%, #b5fff5 32%, #4adbc8 72%, #147a70 100%)'
              : 'radial-gradient(circle at 35% 30%, #f2ffe3 0%, #b8e386 35%, #6aa141 74%, #31541a 100%)',
            border: isMusic ? '1.5px solid #e6fffc' : '1.5px solid #2b4717',
            boxShadow: isMusic
              ? '0 0 12px rgba(96, 252, 235, 0.85), 0 2px 5px rgba(0,0,0,0.45)'
              : '0 0 10px rgba(146, 209, 88, 0.65), 0 2px 5px rgba(0,0,0,0.45)',
          }}
        >
          <span className="absolute left-1.5 top-1 h-1.5 w-2 rounded-full bg-white/85 rotate-[-20deg]" />
        </div>

        {/* Accessible Invisible Native Range Input */}
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          onPointerUp={onPreview}
          onKeyUp={onPreview}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0 focus-visible:opacity-100"
        />
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  mobileControlStyle,
  mobileHandedness,
  muted,
  musicVolume,
  sfxVolume,
  onChangeMobileControlStyle,
  onChangeMobileHandedness,
  onToggleMute,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onPreviewSfx,
  onClose,
}) => {
  const uid = useId().replace(/:/g, '');
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04100d]/82 p-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grove-settings-title"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Subtle Magical Forest Firefly Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 24%, rgba(255,214,120,0.5) 0 2px, transparent 10px), radial-gradient(circle at 86% 22%, rgba(255,220,130,0.45) 0 2px, transparent 12px), radial-gradient(circle at 10% 78%, rgba(110,248,224,0.45) 0 2.5px, transparent 16px), radial-gradient(circle at 90% 82%, rgba(110,248,224,0.55) 0 3px, transparent 18px)',
        }}
      />

      {/* Outer Carved Walnut & Botanical Moss Frame */}
      <div className="relative my-auto w-full max-w-[520px] rounded-[20px] border-[5px] border-[#5b3c22] bg-gradient-to-b from-[#f5e7c7] via-[#ebd4a4] to-[#d9b97e] shadow-[0_26px_64px_rgba(0,0,0,0.82),0_0_0_2px_#2d1a0b,inset_0_0_0_2px_#8c6239,inset_0_0_18px_rgba(120,78,30,0.28)]">
        {/* Corner Botanical Moss & Golden Vines */}
        <CornerMoss position="tl" withMushrooms size="lg" />
        <CornerMoss position="tr" withMushrooms={false} size="lg" />
        <CornerMoss position="bl" withMushrooms={false} size="lg" />
        <CornerMoss position="br" withMushrooms size="lg" />

        {/* Top Center Subtle Golden Vine Filigree */}
        <svg
          aria-hidden="true"
          viewBox="0 0 240 16"
          fill="none"
          className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 w-48 sm:w-56 h-4"
        >
          <path
            d="M8 9 C52 3, 88 12, 120 7 C152 12, 188 3, 232 9"
            stroke="#cfa150"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="120" cy="7" r="2.5" fill="#f7de94" />
        </svg>

        {/* Parchment Interior (fits viewport cleanly, scrolls invisibly only on tiny landscape screens) */}
        <div className="relative max-h-[calc(100dvh-1.25rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 py-3.5 sm:px-6 sm:py-4 text-[#3a2411]">
          {/* Header Row: Gold Serif Title + Carved Wooden Leaf "Done" Button */}
          <div className="flex items-center justify-between gap-3 pb-2">
            <h2
              id="grove-settings-title"
              className="font-display text-2xl sm:text-[26px] font-semibold tracking-tight text-[#8b622c] drop-shadow-[0_1px_0_rgba(255,252,240,0.85)]"
            >
              Settings
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="group relative flex min-h-[38px] min-w-[92px] items-center justify-center px-5 py-1.5 transition-transform hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#7cfce7]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 112 48"
                className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_3px_6px_rgba(0,0,0,0.38)]"
              >
                <defs>
                  <linearGradient id={`leafDone_${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b98654" />
                    <stop offset="52%" stopColor="#8f6137" />
                    <stop offset="100%" stopColor="#654121" />
                  </linearGradient>
                </defs>
                {/* Oak/Forest Leaf Silhouette */}
                <path
                  d="M6 24 C20 12, 42 5, 68 7 C84 8, 96 14, 102 22 L108 24 L102 26 C96 34, 84 40, 68 41 C42 43, 20 36, 6 24 Z"
                  fill={`url(#leafDone_${uid})`}
                  stroke="#42260f"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Leaf central rib and side veins */}
                <path
                  d="M14 24 L100 24 M36 24 L46 15 M56 24 L67 13 M77 24 L86 16 M36 24 L47 33 M58 24 L69 35 M79 24 L87 32"
                  stroke="#533217"
                  strokeOpacity="0.65"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M14 22 C30 12, 56 8, 86 12"
                  fill="none"
                  stroke="#e3be8d"
                  strokeOpacity="0.45"
                  strokeWidth="1.1"
                />
              </svg>
              <span className="relative z-10 font-display text-sm font-semibold text-[#fdf6e4] drop-shadow-[0_1px_2px_rgba(32,16,6,0.9)]">
                Done
              </span>
            </button>
          </div>

          {/* Section 1: Mobile Controls */}
          <div className="mt-0.5">
            <h3 className="text-[14px] sm:text-[15px] font-bold text-[#3b2511]">Mobile Controls</h3>
            <p className="mt-0.5 text-[11px] sm:text-xs text-[#593b1f]">
              Choose how movement controls look and feel on touch screens.
            </p>

            <div className="mt-2 grid grid-cols-2 gap-3">
              {/* Arrows (Default) Card */}
              <button
                type="button"
                onClick={() => onChangeMobileControlStyle('arrows')}
                className={`relative flex flex-col items-center justify-between gap-1.5 rounded-xl border-2 px-2.5 py-2.5 text-center transition-all focus-visible:outline-2 focus-visible:outline-[#ffd978] ${
                  mobileControlStyle === 'arrows'
                    ? 'border-[#ffe187] bg-gradient-to-b from-[#745136] via-[#5c3e27] to-[#452c1a] shadow-[0_0_16px_rgba(255,212,96,0.72),inset_0_0_0_1.5px_rgba(255,241,179,0.85)]'
                    : 'border-[#382110] bg-gradient-to-b from-[#66462e] via-[#513521] to-[#3c2616] opacity-95 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,224,175,0.2)] hover:brightness-105'
                }`}
              >
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px]">
                  <WoodGrainPattern id={`card1_${uid}`} />
                </div>
                <CornerMoss position="tl" withMushrooms={false} size="sm" />
                <CornerMoss position="br" withMushrooms size="sm" />

                <div className="relative z-10 flex h-10 items-center justify-center">
                  <CarvedArrowsArtwork />
                </div>
                <div className="relative z-10">
                  <div className="text-[12px] sm:text-[13px] font-bold text-[#fff8e6] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                    Arrows (Default)
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#e7d4b6]">Left / right bar</div>
                </div>
              </button>

              {/* Round Stick Card */}
              <button
                type="button"
                onClick={() => onChangeMobileControlStyle('joystick')}
                className={`relative flex flex-col items-center justify-between gap-1.5 rounded-xl border-2 px-2.5 py-2.5 text-center transition-all focus-visible:outline-2 focus-visible:outline-[#ffd978] ${
                  mobileControlStyle === 'joystick'
                    ? 'border-[#ffe187] bg-gradient-to-b from-[#745136] via-[#5c3e27] to-[#452c1a] shadow-[0_0_16px_rgba(255,212,96,0.72),inset_0_0_0_1.5px_rgba(255,241,179,0.85)]'
                    : 'border-[#382110] bg-gradient-to-b from-[#66462e] via-[#513521] to-[#3c2616] opacity-95 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,224,175,0.2)] hover:brightness-105'
                }`}
              >
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px]">
                  <WoodGrainPattern id={`card2_${uid}`} />
                </div>
                <CornerMoss position="tl" withMushrooms={false} size="sm" />
                <CornerMoss position="br" withMushrooms size="sm" />

                <div className="relative z-10 flex h-10 items-center justify-center">
                  <RoundStickArtwork />
                </div>
                <div className="relative z-10">
                  <div className="text-[12px] sm:text-[13px] font-bold text-[#fff8e6] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                    Round Stick
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#e7d4b6]">Draggable thumbstick</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Controls Side (Carved Wood Plaque + Center Acorn) */}
          <div className="relative mt-3.5 rounded-xl border-2 border-[#3b2311] bg-gradient-to-b from-[#704e34] via-[#583b25] to-[#422a19] p-2.5 sm:p-3 text-[#f8eedb] shadow-[0_6px_14px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,228,185,0.22)]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px]">
              <WoodGrainPattern id={`sideBoard_${uid}`} />
            </div>
            <CornerMoss position="tl" withMushrooms={false} size="sm" />
            <CornerMoss position="tr" withMushrooms={false} size="sm" />
            <CornerMoss position="bl" withMushrooms={false} size="sm" />
            <CornerMoss position="br" withMushrooms={false} size="sm" />

            <div className="relative z-10 px-1">
              <h3 className="text-[14px] sm:text-[15px] font-bold text-[#fff6e3] drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
                Controls Side
              </h3>
              <p className="mt-0.5 text-[11px] sm:text-xs text-[#e5d1b1]">
                Swap which side of the screen Move and Jump sit on
              </p>
            </div>

            <div className="relative z-10 mt-2 flex items-center rounded-lg border border-[#2d1a0c] bg-[#3b2414]/80 p-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]">
              <button
                type="button"
                onClick={() => onChangeMobileHandedness('move-left')}
                className={`flex-1 min-w-0 rounded-md border px-2 py-1.5 text-center transition-all focus-visible:outline-2 focus-visible:outline-[#ffd978] ${
                  mobileHandedness === 'move-left'
                    ? 'border-[#ffe187] bg-gradient-to-b from-[#6e4c32] to-[#4f3420] shadow-[0_0_12px_rgba(255,214,102,0.58),inset_0_0_0_1px_rgba(255,239,179,0.7)]'
                    : 'border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-center gap-3 text-xs font-bold text-[#74f2d8]">
                  <span>Move</span>
                  <span className="text-[#c5b396]">·</span>
                  <span>Jump</span>
                </div>
                <div className="mt-0.5 text-[11px] text-[#f0dec2] truncate">Move Left / Jump Right</div>
              </button>

              <div className="relative z-20 -mx-2 flex items-center justify-center">
                <AcornArtwork pointRight={mobileHandedness === 'move-right'} />
              </div>

              <button
                type="button"
                onClick={() => onChangeMobileHandedness('move-right')}
                className={`flex-1 min-w-0 rounded-md border px-2 py-1.5 text-center transition-all focus-visible:outline-2 focus-visible:outline-[#ffd978] ${
                  mobileHandedness === 'move-right'
                    ? 'border-[#ffe187] bg-gradient-to-b from-[#6e4c32] to-[#4f3420] shadow-[0_0_12px_rgba(255,214,102,0.58),inset_0_0_0_1px_rgba(255,239,179,0.7)]'
                    : 'border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-center gap-3 text-xs font-bold text-[#74f2d8]">
                  <span>Jump</span>
                  <span className="text-[#c5b396]">·</span>
                  <span>Move</span>
                </div>
                <div className="mt-0.5 text-[11px] text-[#f0dec2] truncate">Jump Left / Move Right</div>
              </button>
            </div>
          </div>

          {/* Section 3: Sound Controls + Mossy Stone Mute Button + Branch Sliders */}
          <div className="mt-3.5 border-t border-[#9b7444]/35 pt-2.5 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-bold text-[#3b2511]">Sound</h3>

              <button
                type="button"
                onClick={onToggleMute}
                className={`relative min-h-[38px] min-w-[116px] rounded-xl border-2 px-4 py-1.5 text-xs font-bold tracking-wide transition-all hover:brightness-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                  muted
                    ? 'border-[#2d6255] bg-gradient-to-b from-[#2c7a69] to-[#1a4e42] text-[#e6fffb] shadow-[0_3px_8px_rgba(0,0,0,0.3)]'
                    : 'border-[#3d4632] bg-gradient-to-b from-[#8b927f] via-[#717764] to-[#565c4b] text-[#f5f3dc] shadow-[0_3px_8px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,240,0.28)]'
                }`}
              >
                {/* Moss cap crowning the stone button */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 116 14"
                  fill="none"
                  className="pointer-events-none absolute -top-[5px] left-1/2 -translate-x-1/2 w-[96%] h-3.5"
                >
                  <path
                    d="M4 11 C6 4, 16 1, 28 4 C38 0, 52 1, 64 4 C76 0, 92 2, 102 5 C109 6, 113 9, 113 12 C94 10, 74 12, 56 10 C38 12, 18 9, 4 11 Z"
                    fill="#6e9133"
                    stroke="#384a17"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M12 8 C22 3, 36 4, 48 6 C64 3, 82 4, 98 7"
                    stroke="#9bc24f"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Small corner leaf accent */}
                <svg
                  aria-hidden="true"
                  width="16"
                  height="12"
                  viewBox="0 0 16 12"
                  fill="none"
                  className="pointer-events-none absolute -bottom-1 -right-1.5"
                >
                  <path
                    d="M2 10 C4 3, 10 1, 15 2 C14 8, 9 11, 2 10 Z"
                    fill="#7da439"
                    stroke="#364a15"
                    strokeWidth="1.1"
                  />
                </svg>
                <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                  {muted ? 'Play Sound' : 'Mute Sound'}
                </span>
              </button>
            </div>

            <BranchVolumeSlider
              label="Music Volume"
              value={musicVolume}
              variant="music"
              muted={muted}
              onChange={onMusicVolumeChange}
            />

            <BranchVolumeSlider
              label="Effects Volume"
              value={sfxVolume}
              variant="effects"
              muted={muted}
              onChange={onSfxVolumeChange}
              onPreview={onPreviewSfx}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
