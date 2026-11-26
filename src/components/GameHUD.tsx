import React from 'react';
import type { HudSnapshot } from '../game/types';
import { SoundControl } from './SoundControl';

interface GameHUDProps {
  hud: HudSnapshot;
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  isTouchDevice: boolean;
  justSaved: boolean;
  onToggleMute: () => void;
  onMusicVolumeChange: (val: number) => void;
  onSfxVolumeChange: (val: number) => void;
  onPreviewSfx: () => void;
  onPause: () => void;
  onFly: () => void;
  onSaveGame: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onGoHome: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  muted,
  musicVolume,
  sfxVolume,
  isTouchDevice,
  justSaved,
  onToggleMute,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onPreviewSfx,
  onPause,
  onFly,
  onSaveGame,
  onOpenShop,
  onOpenSettings,
  onGoHome,
}) => {
  if (hud.phase !== 'PLAYING') return null;

  const hasActiveBuffs =
    hud.crystalBoostActive ||
    hud.tripleJumpActive ||
    hud.highJumpCharges > 0 ||
    hud.flyingTimeLeft > 0 ||
    hud.flyingFlowers > 0 ||
    Boolean(hud.equipped.power);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        {/* Compact Vertical 2-Column Glassy Left Stats Card */}
        <div className="w-[224px] sm:w-[252px] rounded-xl border border-[#8cf8e8]/22 bg-[#061822]/46 px-3 py-2.5 text-[#eefcf9] shadow-lg backdrop-blur-md">
          {/* Top line: Petals + Level Progress */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1" aria-label={`Vitality ${hud.petals} of ${hud.maxPetals}`}>
              {Array.from({ length: hud.maxPetals }).map((_, idx) => {
                const active = idx < hud.petals;
                return (
                  <svg
                    key={idx}
                    width="14"
                    height="14"
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
              <span className="ml-0.5 text-[11px] font-semibold text-[#c5ede6] tabular-nums">
                {hud.petals}/{hud.maxPetals}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-[#ffe29a] tabular-nums shrink-0">
              L{hud.levelId} · {hud.progressPct}%
            </span>
          </div>

          <p className="mt-0.5 truncate text-[11px] text-[#bfe6df]">
            {hud.biomeName} · {hud.weatherLabel}
          </p>

          {/* 2-Column Compact Counters */}
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-[#8cf8e8]/15 pt-2 text-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 text-[#bce4dd]">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="6" fill="#82ffeb" fillOpacity="0.35" />
                  <circle cx="10" cy="10" r="3.6" fill="#ffffff" />
                </svg>
                <span className="text-[11px]">Lumina</span>
              </span>
              <span className="font-semibold tabular-nums">
                {hud.orbsCollected}/{hud.orbsTotal}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 text-[#bce4dd]">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="5.5" r="2.6" fill="#ffd67a" />
                  <circle cx="14.2" cy="9" r="2.6" fill="#ffae94" />
                  <circle cx="12.5" cy="14" r="2.6" fill="#ffd67a" />
                  <circle cx="7.5" cy="14" r="2.6" fill="#ffae94" />
                  <circle cx="5.8" cy="9" r="2.6" fill="#ffd67a" />
                  <circle cx="10" cy="10" r="2.2" fill="#fffbe0" />
                </svg>
                <span className="text-[11px]">Blossom</span>
              </span>
              <span className="font-semibold tabular-nums">
                {hud.blossomsCollected}/{hud.blossomsTotal}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 text-[#bce4dd]">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 2L15.5 10L10 18L4.5 10L10 2Z"
                    fill="#b4f5ff"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                </svg>
                <span className="text-[11px]">Crystals</span>
              </span>
              <span className="font-semibold tabular-nums">
                {hud.crystalsCollected}/{hud.crystalsTotal}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 text-[#bce4dd]">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 1.8L12.1 7.9L18.2 10L12.1 12.1L10 18.2L7.9 12.1L1.8 10L7.9 7.9L10 1.8Z"
                    fill="#d9f4ff"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </svg>
                <span className="text-[11px]">Stars</span>
              </span>
              <span className="font-semibold tabular-nums">
                {hud.starseedsCollected}/{hud.starseedsTotal}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 text-[#bce4dd]">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect
                    x="6"
                    y="4"
                    width="8"
                    height="11"
                    rx="2"
                    fill="#ffe399"
                    fillOpacity="0.9"
                    stroke="#ffd166"
                    strokeWidth="1.3"
                  />
                  <path d="M10 1.5V4M7 17H13" stroke="#b8e2dc" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span className="text-[11px]">Lanterns</span>
              </span>
              <span className="font-semibold tabular-nums">
                {hud.lanternsLit}/{hud.lanternsTotal}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1" aria-label={`Dewdrops ${hud.dewdrops}`}>
              <span className="flex items-center gap-1.5 text-[#ffe194]">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 2.2C13.4 6.3 15.8 9.6 15.8 12.6C15.8 15.8 13.2 18 10 18C6.8 18 4.2 15.8 4.2 12.6C4.2 9.6 6.6 6.3 10 2.2Z"
                    fill="#7cfce7"
                    fillOpacity="0.38"
                    stroke="#ffe194"
                    strokeWidth="1.3"
                  />
                  <circle cx="8.4" cy="11.8" r="1.4" fill="#ffffff" />
                </svg>
                <span className="text-[11px]">Dew</span>
              </span>
              <span className="font-bold text-[#ffe194] tabular-nums">{hud.dewdrops}</span>
            </div>
          </div>

          {hasActiveBuffs && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-[#8cf8e8]/15 pt-1.5 text-[11px] font-medium">
              {hud.equipped.power && (
                <span className="text-[#ffe39a]">
                  {hud.equipped.power === 'super_sky_leap'
                    ? 'Skybound Leap'
                    : hud.equipped.power === 'super_nova_pulse'
                      ? 'Solar Nova'
                      : hud.equipped.power === 'super_star_magnet'
                        ? 'Cosmic Magnet'
                        : hud.equipped.power === 'super_fairy_sparkle'
                          ? 'Archfey Aura'
                          : hud.equipped.power === 'super_dragon_wings'
                            ? 'Dragon Wings'
                            : 'Phoenix Wings'}
                </span>
              )}
              {hud.highJumpCharges > 0 && (
                <span className="text-[#7cfce7] tabular-nums">Jump ×{hud.highJumpCharges}</span>
              )}
              {hud.flyingTimeLeft > 0 ? (
                <span className="text-[#ff9ce3] tabular-nums">Fly {hud.flyingTimeLeft.toFixed(1)}s</span>
              ) : (
                hud.flyingFlowers > 0 && (
                  <span className="text-[#ffb4ea] tabular-nums">Flower ×{hud.flyingFlowers}</span>
                )
              )}
              {hud.crystalBoostActive && <span className="text-[#ffe18c]">Prism Surge</span>}
              {hud.tripleJumpActive && <span className="text-[#c7b8ff]">Triple Jump</span>}
            </div>
          )}
        </div>

        {/* Top-Right Interactive Actions + Expandable Sound Bar */}
        <div className="pointer-events-auto flex flex-wrap justify-end shrink-0 items-center gap-1.5 sm:gap-2">
          {hud.flyingFlowers > 0 && (
            <button
              type="button"
              onClick={onFly}
              className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#ff9ce3]/55 bg-[#2e0c2b]/80 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold text-[#ffd6f4] transition-colors hover:border-[#ff9ce3] hover:bg-[#461341]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9ce3] tabular-nums"
            >
              Fly · {hud.flyingFlowers}
            </button>
          )}
          <button
            type="button"
            onClick={onOpenShop}
            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#ffe194]/45 bg-[#081b24]/80 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold text-[#ffe194] transition-colors hover:border-[#ffe194]/80 hover:bg-[#102d3b]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe194]"
          >
            Shop
          </button>
          <button
            type="button"
            onClick={onSaveGame}
            className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md border px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7] ${
              justSaved
                ? 'border-[#56e3cc] bg-[#56e3cc]/25 text-[#9effef] font-semibold'
                : 'border-[#8cf8e8]/25 bg-[#06131a]/75 text-[#dcf7f3] hover:border-[#8cf8e8]/55 hover:bg-[#0c2330]/90'
            }`}
          >
            {justSaved ? 'Saved!' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#8cf8e8]/25 bg-[#06131a]/75 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium text-[#dcf7f3] transition-colors hover:border-[#8cf8e8]/55 hover:bg-[#0c2330]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
          >
            Home
          </button>

          <SoundControl
            muted={muted}
            musicVolume={musicVolume}
            sfxVolume={sfxVolume}
            onToggleMute={onToggleMute}
            onMusicVolumeChange={onMusicVolumeChange}
            onSfxVolumeChange={onSfxVolumeChange}
            onPreviewSfx={onPreviewSfx}
            align="right"
          />

          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#8cf8e8]/25 bg-[#06131a]/75 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium text-[#dcf7f3] transition-colors hover:border-[#8cf8e8]/55 hover:bg-[#0c2330]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
          >
            Settings
          </button>

          <button
            type="button"
            onClick={onPause}
            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#8cf8e8]/25 bg-[#06131a]/75 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium text-[#dcf7f3] transition-colors hover:border-[#8cf8e8]/55 hover:bg-[#0c2330]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
          >
            Pause
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line (Desktop PC only) */}
      {!isTouchDevice && (
        <div className="flex justify-center">
          <p className="text-xs tracking-wide text-[#cbeae5]/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            A D Move · Space Jump &amp; Glide · E Pulse · F Fly · M Mute · Esc Pause
          </p>
        </div>
      )}
    </div>
  );
};
