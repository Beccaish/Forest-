import React, { useId } from 'react';

interface ParchmentScrollBannerProps {
  children: React.ReactNode;
  singleLine?: boolean;
  className?: string;
}

export const ParchmentScrollBanner: React.FC<ParchmentScrollBannerProps> = ({
  children,
  singleLine = false,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const rollGradId = `scrollRoll_${uid}`;
  const sheetGradId = `scrollSheet_${uid}`;
  const sideShadowLId = `scrollShadowL_${uid}`;
  const sideShadowRId = `scrollShadowR_${uid}`;

  return (
    <div
      className={`pointer-events-none relative inline-flex items-stretch max-w-[min(96vw,920px)] drop-shadow-[0_6px_14px_rgba(0,0,0,0.68)] ${className}`}
    >
      {/* Left Rolled Scroll Cylinder */}
      <svg
        aria-hidden="true"
        viewBox="0 0 30 60"
        preserveAspectRatio="none"
        className="relative z-20 -mr-[4px] -my-[5px] w-[22px] sm:w-[26px] shrink-0"
      >
        <defs>
          <linearGradient id={rollGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7a5327" />
            <stop offset="22%" stopColor="#d9ba7f" />
            <stop offset="48%" stopColor="#f9ecd0" />
            <stop offset="78%" stopColor="#d4b072" />
            <stop offset="100%" stopColor="#855a2b" />
          </linearGradient>
        </defs>

        {/* Subtle outer lip shadow */}
        <path
          d="M6 7 C6 3, 21 3, 24 7 L24 53 C21 57, 6 57, 6 53 Z"
          fill="#2d1a09"
          fillOpacity="0.35"
          transform="translate(1.2, 1.4)"
        />

        {/* Main rolled parchment tube */}
        <path
          d="M5 7 C5 2.5, 22 2.5, 24 7.5 L24 52.5 C22 57.5, 5 57.5, 5 53 Z"
          fill={`url(#${rollGradId})`}
          stroke="#5f3d1c"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />

        {/* Top spiral curl opening */}
        <path
          d="M9 7.2 C10.5 4.6, 19.5 4.8, 21 7.8 C19.5 10.2, 12 10.2, 11.5 8.1 C11.2 6.8, 15.8 6.4, 17.2 7.5"
          fill="#4a2e13"
          fillOpacity="0.82"
          stroke="#6b4622"
          strokeWidth="1"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Bottom rolled spiral crease */}
        <path
          d="M8.5 52.5 C11 55.2, 19.5 55.2, 21.5 52.2 C19.2 50.4, 12.2 50.6, 11.5 52.2"
          fill="#5c3918"
          fillOpacity="0.72"
          stroke="#5f3d1c"
          strokeWidth="1"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Inner vertical curl crease where sheet emerges */}
        <path
          d="M23.5 9.5 C27 10.5, 28 12, 28 14 L28 46 C28 48, 27 49.5, 23.5 50.5 Z"
          fill="#b6894b"
          fillOpacity="0.6"
        />
        <line
          x1="23.8"
          y1="8"
          x2="23.8"
          y2="52"
          stroke="#6a4521"
          strokeWidth="1.1"
          strokeOpacity="0.85"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Center Unrolled Weathered Parchment Sheet */}
      <div className="relative z-10 flex items-center justify-center px-4 sm:px-7 py-1.5 sm:py-2 min-w-0">
        <svg
          aria-hidden="true"
          viewBox="0 0 800 50"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id={sheetGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f5e6c2" />
              <stop offset="14%" stopColor="#eed9a8" />
              <stop offset="58%" stopColor="#e3c68b" />
              <stop offset="90%" stopColor="#cfa968" />
              <stop offset="100%" stopColor="#b58b4b" />
            </linearGradient>
            <linearGradient id={sideShadowLId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4c2d11" stopOpacity="0.46" />
              <stop offset="35%" stopColor="#6a421b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6a421b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={sideShadowRId} x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#4c2d11" stopOpacity="0.46" />
              <stop offset="35%" stopColor="#6a421b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6a421b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Organic deckled parchment sheet silhouette */}
          <path
            d="M0 3.2
               C85 1.4, 165 4.2, 250 2.6
               L254 4.8 L258 2.5
               C350 1.3, 470 4.0, 585 2.4
               L589 4.5 L593 2.5
               C670 1.6, 740 3.8, 800 3.0
               L800 47.0
               C725 48.2, 650 45.8, 560 47.5
               L556 45.2 L552 47.6
               C430 48.6, 305 45.6, 175 47.5
               L170 44.8 L166 47.4
               C105 48.2, 48 46.2, 0 47.0 Z"
            fill={`url(#${sheetGradId})`}
            stroke="#6d4821"
            strokeWidth="1.4"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Left and right inward roll shading */}
          <rect x="0" y="3" width="38" height="44" fill={`url(#${sideShadowLId})`} />
          <rect x="762" y="3" width="38" height="44" fill={`url(#${sideShadowRId})`} />

          {/* Subtle top paper sheen */}
          <path
            d="M10 5.5 C160 4.2, 340 5.8, 520 4.6 C640 4.0, 730 5.4, 790 5.0"
            fill="none"
            stroke="#fff7e2"
            strokeOpacity="0.55"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <p
          className={`relative z-10 font-display text-center text-[11px] sm:text-xs font-semibold tracking-wide text-[#2d1c0c] leading-snug drop-shadow-[0_1px_0_rgba(255,248,228,0.55)] ${
            singleLine ? 'whitespace-nowrap' : ''
          }`}
        >
          {children}
        </p>
      </div>

      {/* Right Rolled Scroll Cylinder */}
      <svg
        aria-hidden="true"
        viewBox="0 0 30 60"
        preserveAspectRatio="none"
        className="relative z-20 -ml-[4px] -my-[5px] w-[22px] sm:w-[26px] shrink-0"
      >
        <defs>
          <linearGradient id={`${rollGradId}_r`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#855a2b" />
            <stop offset="22%" stopColor="#d4b072" />
            <stop offset="52%" stopColor="#f9ecd0" />
            <stop offset="78%" stopColor="#d9ba7f" />
            <stop offset="100%" stopColor="#7a5327" />
          </linearGradient>
        </defs>

        {/* Subtle outer lip shadow */}
        <path
          d="M6 7 C9 3, 24 3, 24 7 L24 53 C24 57, 9 57, 6 53 Z"
          fill="#2d1a09"
          fillOpacity="0.35"
          transform="translate(1.2, 1.4)"
        />

        {/* Main rolled parchment tube */}
        <path
          d="M6 7.5 C8 2.5, 25 2.5, 25 7 L25 53 C25 57.5, 8 57.5, 6 52.5 Z"
          fill={`url(#${rollGradId}_r)`}
          stroke="#5f3d1c"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />

        {/* Top spiral curl opening */}
        <path
          d="M21 7.2 C19.5 4.6, 10.5 4.8, 9 7.8 C10.5 10.2, 18 10.2, 18.5 8.1 C18.8 6.8, 14.2 6.4, 12.8 7.5"
          fill="#4a2e13"
          fillOpacity="0.82"
          stroke="#6b4622"
          strokeWidth="1"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Bottom rolled spiral crease */}
        <path
          d="M21.5 52.5 C19 55.2, 10.5 55.2, 8.5 52.2 C10.8 50.4, 17.8 50.6, 18.5 52.2"
          fill="#5c3918"
          fillOpacity="0.72"
          stroke="#5f3d1c"
          strokeWidth="1"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Inner vertical curl crease where sheet emerges */}
        <path
          d="M6.5 9.5 C3 10.5, 2 12, 2 14 L2 46 C2 48, 3 49.5, 6.5 50.5 Z"
          fill="#b6894b"
          fillOpacity="0.6"
        />
        <line
          x1="6.2"
          y1="8"
          x2="6.2"
          y2="52"
          stroke="#6a4521"
          strokeWidth="1.1"
          strokeOpacity="0.85"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};
