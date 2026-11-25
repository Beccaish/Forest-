import React from 'react';
import type { HudSnapshot } from '../game/types';

interface GameHUDProps {
  hud: HudSnapshot;
  muted: boolean;
  isTouchDevice: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  muted,
  isTouchDevice,
  onToggleMute,
  onPause,
}) => {
  if (hud.phase !== 'PLAYING') return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:p-6">
      {/* Top Perimeter Strip — unboxed typographic clusters, zero pills */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
          {/* Row 1: Petals, Lumina Orbs, Blossoms, Crystals, Lanterns */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-medium text-[#e9fbf8]">
            {/* Spirit Petals */}
            <div className="flex items-center gap-1" aria-label={`Vitality ${hud.petals} of ${hud.maxPetals}`}>
              {Array.from({ length: hud.maxPetals }).map((_, idx) => {
                const active = idx < hud.petals;
                return (
                  <svg
                    key={idx}
                    width="15"
                    height="15"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 2C13.5 5.5 16 9.2 16 12.5C16 15.8 13.3 18 10 18C6.7 18 4 15.8 4 12.5C4 9.2 6.5 5.5 10 2Z"
                      fill={active ? '#7cfce7' : 'rgba(124,252,231,0.16)'}
                      stroke={active ? '#e6fffb' : 'rgba(124,252,231,0.35)'}
                      strokeWidth="1.4"
                    />
                  </svg>
                );
              })}
              <span className="ml-0.5 text-xs text-[#b8e2dc] tabular-nums">
                {hud.petals}/{hud.maxPetals}
              </span>
            </div>

            <span className="text-white/30" aria-hidden="true">·</span>

            {/* Lumina Orbs */}
            <div className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="6" fill="#82ffeb" fillOpacity="0.3" />
                <circle cx="10" cy="10" r="3.8" fill="#ffffff" />
              </svg>
              <span className="tabular-nums">
                {hud.orbsCollected}/{hud.orbsTotal}
              </span>
              <span className="hidden sm:inline text-xs text-[#b8e2dc]">Lumina</span>
            </div>

            <span className="text-white/30" aria-hidden="true">·</span>

            {/* Sun Blossoms */}
            <div className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="5.5" r="2.6" fill="#ffd67a" />
                <circle cx="14.2" cy="9" r="2.6" fill="#ffae94" />
                <circle cx="12.5" cy="14" r="2.6" fill="#ffd67a" />
                <circle cx="7.5" cy="14" r="2.6" fill="#ffae94" />
                <circle cx="5.8" cy="9" r="2.6" fill="#ffd67a" />
                <circle cx="10" cy="10" r="2.2" fill="#fffbe0" />
              </svg>
              <span className="tabular-nums">
                {hud.blossomsCollected}/{hud.blossomsTotal}
              </span>
              <span className="hidden sm:inline text-xs text-[#b8e2dc]">Blossoms</span>
            </div>

            <span className="text-white/30" aria-hidden="true">·</span>

            {/* Prism Crystals */}
            <div className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 2L15.5 10L10 18L4.5 10L10 2Z"
                  fill="#b4f5ff"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
              </svg>
              <span className="tabular-nums">
                {hud.crystalsCollected}/{hud.crystalsTotal}
              </span>
              <span className="hidden sm:inline text-xs text-[#b8e2dc]">Crystals</span>
            </div>

            <span className="text-white/30" aria-hidden="true">·</span>

            {/* Awakened Lanterns */}
            <div className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect
                  x="6"
                  y="4"
                  width="8"
                  height="11"
                  rx="2"
                  fill="#ffe399"
                  fillOpacity="0.88"
                  stroke="#ffd166"
                  strokeWidth="1.3"
                />
                <path d="M10 1.5V4M7 17H13" stroke="#b8e2dc" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="tabular-nums">
                {hud.lanternsLit}/{hud.lanternsTotal}
              </span>
              <span className="hidden sm:inline text-xs text-[#b8e2dc]">Lanterns</span>
            </div>
          </div>

          {/* Row 2: Level, Active Biome & Weather */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#b5dfd9]">
            <span className="font-semibold text-[#ffe29a]">L{hud.levelId}</span>
            <span className="text-white/35" aria-hidden="true">·</span>
            <span className="font-medium text-[#e3faf7]">{hud.biomeName}</span>
            <span className="text-white/35" aria-hidden="true">·</span>
            <span>{hud.weatherLabel}</span>
            <span className="text-white/35" aria-hidden="true">·</span>
            <span className="tabular-nums">{hud.progressPct}%</span>
            {hud.crystalBoostActive && (
              <>
                <span className="text-white/35" aria-hidden="true">·</span>
                <span className="font-medium text-[#ffe18c]">Prism Surge</span>
              </>
            )}
          </div>
        </div>

        {/* Top-Right Interactive Actions */}
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#8cf8e8]/25 bg-[#06131a]/75 px-3 py-2 text-xs font-medium text-[#dcf7f3] transition-colors hover:border-[#8cf8e8]/55 hover:bg-[#0c2330]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <button
            type="button"
            onClick={onPause}
            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#8cf8e8]/25 bg-[#06131a]/75 px-3 py-2 text-xs font-medium text-[#dcf7f3] transition-colors hover:border-[#8cf8e8]/55 hover:bg-[#0c2330]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
          >
            Pause
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line (Desktop PC only) */}
      {!isTouchDevice && (
        <div className="flex justify-center">
          <p className="text-xs tracking-wide text-[#cbeae5]/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            A D Move · Space Jump &amp; Glide · E Pulse · M Mute · Esc Pause
          </p>
        </div>
      )}
    </div>
  );
};
