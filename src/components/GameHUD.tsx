import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Menu, Volume2, VolumeX, X } from 'lucide-react';
import type { HudSnapshot } from '../game/types';
import { SoundControl } from './SoundControl';
import { ParchmentScrollBanner } from './ParchmentScrollBanner';

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
  onMobileNavOpenChange?: (open: boolean) => void;
}

const ButtonFiligree: React.FC = () => (
  <>
    <svg
      aria-hidden="true"
      width="32"
      height="6"
      viewBox="0 0 32 6"
      fill="none"
      className="pointer-events-none absolute -top-[4px] left-1/2 -translate-x-1/2"
    >
      <path d="M2 5C7 1.5 11 1.5 16 4.5C21 1.5 25 1.5 30 5" stroke="#dfb973" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="2.2" r="1.4" fill="#f3d893" />
    </svg>
    <svg
      aria-hidden="true"
      width="28"
      height="6"
      viewBox="0 0 28 6"
      fill="none"
      className="pointer-events-none absolute -bottom-[4px] left-1/2 -translate-x-1/2"
    >
      <path d="M2 1C7 4.5 11 4.5 14 2C17 4.5 21 4.5 26 1" stroke="#dfb973" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  </>
);

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
  onMobileNavOpenChange,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pointsExpanded, setPointsExpanded] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const mobilePointsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onMobileNavOpenChange?.(mobileNavOpen);
  }, [mobileNavOpen, onMobileNavOpenChange]);

  useEffect(() => {
    if (hud.phase !== 'PLAYING') {
      setMobileNavOpen(false);
      setPointsExpanded(false);
    }
  }, [hud.phase]);

  useEffect(() => {
    if (!mobileNavOpen && !pointsExpanded) return;
    const handleOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (mobileNavOpen && mobileNavRef.current && !mobileNavRef.current.contains(target)) {
        setMobileNavOpen(false);
      }
      if (pointsExpanded && mobilePointsRef.current && !mobilePointsRef.current.contains(target)) {
        setPointsExpanded(false);
      }
    };
    window.addEventListener('pointerdown', handleOutside);
    return () => window.removeEventListener('pointerdown', handleOutside);
  }, [mobileNavOpen, pointsExpanded]);

  if (hud.phase !== 'PLAYING') return null;

  const hasActiveBuffs =
    hud.wardShieldLeft > 0 ||
    hud.crystalBoostActive ||
    hud.tripleJumpActive ||
    hud.highJumpCharges > 0 ||
    hud.flyingTimeLeft > 0 ||
    hud.flyingFlowers > 0 ||
    Boolean(hud.equipped.power);

  const powerLabel =
    hud.equipped.power === 'super_sky_leap'
      ? 'Skybound Leap'
      : hud.equipped.power === 'super_nova_pulse'
        ? 'Solar Nova'
        : hud.equipped.power === 'super_star_magnet'
          ? 'Cosmic Magnet'
          : hud.equipped.power === 'super_fairy_sparkle'
            ? 'Archfey Aura'
            : hud.equipped.power === 'super_dragon_wings'
              ? 'Dragon Wings'
              : hud.equipped.power
                ? 'Phoenix Wings'
                : null;

  if (isTouchDevice) {
    return (
      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.6rem,env(safe-area-inset-left))] pr-[max(0.6rem,env(safe-area-inset-right))]">
        <div className="flex items-start justify-between gap-2">
          {/* Mobile Horizontal Top Points Bar — Tap to Expand with Full Labels */}
          <div ref={mobilePointsRef} className="pointer-events-auto relative min-w-0 max-w-[calc(100%-175px)]">
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                setPointsExpanded((v) => !v);
              }}
              aria-expanded={pointsExpanded}
              aria-label={pointsExpanded ? 'Collapse score details' : 'Expand score details'}
              className="w-full text-left rounded-xl border-[2px] border-[#c4a16a] bg-[#071a18]/78 px-2.5 py-1.5 text-[#eefcf9] shadow-[0_8px_20px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,14,7,0.78),inset_0_0_0_3px_rgba(232,202,140,0.26)] backdrop-blur-md transition-all hover:border-[#e0c082] focus-visible:outline-2 focus-visible:outline-[#7cfce7]"
            >
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                {/* Petals */}
                <div className="flex items-center gap-0.5 shrink-0" aria-label={`Vitality ${hud.petals} of ${hud.maxPetals}`}>
                  {Array.from({ length: hud.maxPetals }).map((_, idx) => {
                    const active = idx < hud.petals;
                    return (
                      <svg key={idx} width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path
                          d="M10 2C13.5 5.5 16 9.2 16 12.5C16 15.8 13.3 18 10 18C6.7 18 4 15.8 4 12.5C4 9.2 6.5 5.5 10 2Z"
                          fill={active ? '#7cfce7' : 'rgba(124,252,231,0.16)'}
                          stroke={active ? '#e6fffb' : 'rgba(124,252,231,0.35)'}
                          strokeWidth="1.5"
                        />
                      </svg>
                    );
                  })}
                </div>

                <span className="font-semibold text-[#ffe29a] tabular-nums shrink-0">
                  L{hud.levelId} · {hud.progressPct}%
                </span>

                <span className="flex items-center gap-1 tabular-nums shrink-0">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="6" fill="#82ffeb" fillOpacity="0.4" />
                    <circle cx="10" cy="10" r="3.6" fill="#ffffff" />
                  </svg>
                  <span className="font-semibold">{hud.orbsCollected}/{hud.orbsTotal}</span>
                </span>

                <span className="flex items-center gap-1 tabular-nums shrink-0">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="5.5" r="2.8" fill="#ffd67a" />
                    <circle cx="14.2" cy="9" r="2.8" fill="#ffae94" />
                    <circle cx="12.5" cy="14" r="2.8" fill="#ffd67a" />
                    <circle cx="7.5" cy="14" r="2.8" fill="#ffae94" />
                    <circle cx="5.8" cy="9" r="2.8" fill="#ffd67a" />
                  </svg>
                  <span className="font-semibold">{hud.blossomsCollected}/{hud.blossomsTotal}</span>
                </span>

                <span className="flex items-center gap-1 tabular-nums shrink-0">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 2L15.5 10L10 18L4.5 10L10 2Z" fill="#b4f5ff" stroke="#ffffff" strokeWidth="1.2" />
                  </svg>
                  <span className="font-semibold">{hud.crystalsCollected}/{hud.crystalsTotal}</span>
                </span>

                <span className="flex items-center gap-1 tabular-nums shrink-0">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 1.8L12.1 7.9L18.2 10L12.1 12.1L10 18.2L7.9 12.1L1.8 10L7.9 7.9L10 1.8Z" fill="#d9f4ff" stroke="#ffffff" strokeWidth="1" />
                  </svg>
                  <span className="font-semibold">{hud.starseedsCollected}/{hud.starseedsTotal}</span>
                </span>

                <span className="flex items-center gap-1 tabular-nums shrink-0">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect x="6" y="4" width="8" height="11" rx="2" fill="#ffe399" stroke="#ffd166" strokeWidth="1.4" />
                  </svg>
                  <span className="font-semibold">{hud.lanternsLit}/{hud.lanternsTotal}</span>
                </span>

                <span className="flex items-center gap-1 font-bold text-[#ffe194] tabular-nums shrink-0">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 2.2C13.4 6.3 15.8 9.6 15.8 12.6C15.8 15.8 13.2 18 10 18C6.8 18 4.2 15.8 4.2 12.6C4.2 9.6 6.6 6.3 10 2.2Z" fill="#7cfce7" fillOpacity="0.45" stroke="#ffe194" strokeWidth="1.5" />
                  </svg>
                  <span>{hud.dewdrops}</span>
                </span>

                {hud.wardShieldLeft > 0 && (
                  <span className="font-semibold text-[#ffe896] tabular-nums shrink-0">
                    Safe {hud.wardShieldLeft.toFixed(1)}s
                  </span>
                )}

                {hud.flyingTimeLeft > 0 && (
                  <span className="font-semibold text-[#ff9ce3] tabular-nums shrink-0">
                    Fly {hud.flyingTimeLeft.toFixed(1)}s
                  </span>
                )}

                <span className="ml-auto flex items-center text-[#9fece0] shrink-0" aria-hidden="true">
                  {pointsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </div>
            </button>

            {/* Expanded Details Card (shows words like desktop when tapped) */}
            {pointsExpanded && (
              <div
                onClick={() => setPointsExpanded(false)}
                className="absolute left-0 top-full mt-1.5 z-40 w-[245px] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-xl border-[2px] border-[#c4a16a] bg-[#081c19]/92 p-3 text-[#eafbf9] shadow-[0_14px_30px_rgba(0,0,0,0.68),inset_0_0_0_2px_rgba(24,14,7,0.82),inset_0_0_0_3px_rgba(232,202,140,0.25)] backdrop-blur-md"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#c5ede6]">
                    Vitality {hud.petals}/{hud.maxPetals}
                  </span>
                  <span className="font-semibold text-[#ffe29a] tabular-nums">
                    L{hud.levelId} · {hud.progressPct}%
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#bfe6df]">
                  {hud.biomeName} · {hud.weatherLabel}
                </p>

                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-[#8cf8e8]/15 pt-2 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-[#bce4dd]">Lumina</span>
                    <span className="font-semibold tabular-nums">{hud.orbsCollected}/{hud.orbsTotal}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-[#bce4dd]">Blossoms</span>
                    <span className="font-semibold tabular-nums">{hud.blossomsCollected}/{hud.blossomsTotal}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-[#bce4dd]">Crystals</span>
                    <span className="font-semibold tabular-nums">{hud.crystalsCollected}/{hud.crystalsTotal}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-[#bce4dd]">Stars</span>
                    <span className="font-semibold tabular-nums">{hud.starseedsCollected}/{hud.starseedsTotal}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-[#bce4dd]">Lanterns</span>
                    <span className="font-semibold tabular-nums">{hud.lanternsLit}/{hud.lanternsTotal}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-[#ffe194]">Dewdrops</span>
                    <span className="font-bold text-[#ffe194] tabular-nums">{hud.dewdrops}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-[#ffb8d8]">Animals</span>
                    <span className="font-semibold text-[#ffd6eb] tabular-nums">{hud.animalsHelped}/{hud.animalsTotal}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-[#9effef]">Trash</span>
                    <span className="font-semibold text-[#b8fff2] tabular-nums">{hud.trashCollected}/{hud.trashTotal}</span>
                  </div>
                </div>

                {hasActiveBuffs && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-[#8cf8e8]/15 pt-1.5 text-[11px] font-medium">
                    {hud.wardShieldLeft > 0 && (
                      <span className="text-[#ffe896] tabular-nums">Safe Shield {hud.wardShieldLeft.toFixed(1)}s</span>
                    )}
                    {powerLabel && <span className="text-[#ffe39a]">{powerLabel}</span>}
                    {hud.highJumpCharges > 0 && (
                      <span className="text-[#7cfce7] tabular-nums">Jump ×{hud.highJumpCharges}</span>
                    )}
                    {hud.flyingFlowers > 0 && (
                      <span className="text-[#ffb4ea] tabular-nums">Flower ×{hud.flyingFlowers}</span>
                    )}
                    {hud.crystalBoostActive && <span className="text-[#ffe18c]">Prism Surge</span>}
                    {hud.tripleJumpActive && <span className="text-[#c7b8ff]">Triple Jump</span>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Top-Right Carved Wood Save & Pause + Hidden Nav Bar Toggle */}
          <div ref={mobileNavRef} className="pointer-events-auto relative flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onSaveGame}
              className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_0_0_2px_rgba(20,12,6,0.72)] transition-all focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                justSaved
                  ? 'border-[#8de2c7] bg-gradient-to-b from-[#237a66] to-[#134c3f] text-[#b4fff1]'
                  : 'border-[#c9a66b]/90 bg-gradient-to-b from-[#5b412c] to-[#342316] text-[#f7eed7] hover:brightness-110'
              }`}
            >
              {justSaved ? 'Saved!' : 'Save'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                setPointsExpanded(false);
                onPause();
              }}
              className="min-h-[40px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/90 bg-gradient-to-b from-[#5b412c] to-[#342316] px-3 py-2 text-xs font-semibold text-[#f7eed7] shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_0_0_2px_rgba(20,12,6,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[#7cfce7]"
            >
              Pause
            </button>

            <button
              type="button"
              onClick={() => {
                setPointsExpanded(false);
                setMobileNavOpen((v) => !v);
              }}
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? 'Close navigation bar' : 'Open navigation bar'}
              className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border px-2.5 py-2 text-xs font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_0_0_2px_rgba(20,12,6,0.72)] transition-all focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                mobileNavOpen
                  ? 'border-[#e6c888] bg-gradient-to-b from-[#664933] to-[#422c1d] text-[#fff8e6]'
                  : 'border-[#c9a66b]/90 bg-gradient-to-b from-[#5b412c] to-[#342316] text-[#f7eed7] hover:brightness-110'
              }`}
            >
              {mobileNavOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>

            {/* Collapsible Mobile-Only Nav Bar */}
            {mobileNavOpen && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 z-40 w-64 max-h-[calc(100dvh-4.5rem)] overflow-y-auto rounded-xl border-[2px] border-[#c4a16a] bg-[#081c19]/95 p-3 text-[#eafbf8] shadow-[0_14px_32px_rgba(0,0,0,0.68),inset_0_0_0_2px_rgba(24,14,7,0.82),inset_0_0_0_3px_rgba(232,202,140,0.25)] backdrop-blur-md"
                role="region"
                aria-label="Mobile menu"
              >
                <div className="mb-2.5 border-b border-[#8cf8e8]/15 pb-2">
                  <div className="text-[11px] font-medium text-[#b5dfd8] truncate">
                    {hud.biomeName} · {hud.weatherLabel}
                  </div>
                  {hasActiveBuffs && (
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] font-medium">
                      {powerLabel && <span className="text-[#ffe39a]">{powerLabel}</span>}
                      {hud.highJumpCharges > 0 && (
                        <span className="text-[#7cfce7] tabular-nums">Jump ×{hud.highJumpCharges}</span>
                      )}
                      {hud.crystalBoostActive && <span className="text-[#ffe18c]">Prism Surge</span>}
                      {hud.tripleJumpActive && <span className="text-[#c7b8ff]">Triple Jump</span>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      onOpenShop();
                    }}
                    className="min-h-[40px] rounded-lg border border-[#ffe194]/45 bg-[#0c2330] px-3 py-2 text-xs font-semibold text-[#ffe194] tabular-nums hover:bg-[#133345]"
                  >
                    Shop · {hud.dewdrops}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      onOpenSettings();
                    }}
                    className="min-h-[40px] rounded-lg border border-[#8cf8e8]/30 bg-[#0c2330] px-3 py-2 text-xs font-semibold text-[#dcf7f3] hover:bg-[#133345]"
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      onGoHome();
                    }}
                    className="min-h-[40px] rounded-lg border border-[#8cf8e8]/25 bg-[#0c2330] px-3 py-2 text-xs font-medium text-[#dcf7f3] hover:bg-[#133345]"
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className={`min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      muted
                        ? 'border-[#56e3cc] bg-[#56e3cc] text-[#041b1f]'
                        : 'border-[#8cf8e8]/30 bg-[#0c2330] text-[#dcf7f3]'
                    }`}
                  >
                    {muted ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    <span>{muted ? 'Play Sound' : 'Mute Sound'}</span>
                  </button>
                  {hud.flyingFlowers > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileNavOpen(false);
                        onFly();
                      }}
                      className="col-span-2 min-h-[40px] rounded-lg border border-[#ff9ce3]/55 bg-[#2e0c2b]/85 px-3 py-2 text-xs font-semibold text-[#ffd6f4] tabular-nums"
                    >
                      Activate Fly · {hud.flyingFlowers}
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2 border-t border-[#8cf8e8]/15 pt-2.5">
                  <label className="block">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#cbeae5]">Music</span>
                      <span className="tabular-nums font-semibold text-[#ffe194]">
                        {Math.round(musicVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(musicVolume * 100)}
                      onChange={(e) => onMusicVolumeChange(Number(e.target.value) / 100)}
                      className="w-full h-2 cursor-pointer accent-[#56e3cc]"
                    />
                  </label>
                  <label className="block">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#cbeae5]">Effects</span>
                      <span className="tabular-nums font-semibold text-[#7cfce7]">
                        {Math.round(sfxVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(sfxVolume * 100)}
                      onChange={(e) => onSfxVolumeChange(Number(e.target.value) / 100)}
                      onPointerUp={() => onPreviewSfx()}
                      onKeyUp={() => onPreviewSfx()}
                      className="w-full h-2 cursor-pointer accent-[#7cfce7]"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between pt-[max(0.65rem,env(safe-area-inset-top))] pb-[max(0.45rem,env(safe-area-inset-bottom))] pl-[max(0.65rem,env(safe-area-inset-left))] pr-[max(0.65rem,env(safe-area-inset-right))] sm:px-3.5 sm:pt-3 sm:pb-2">
      <div className="flex items-start justify-between gap-3">
        {/* Ornate Storybook Carved-Bronze & Gem Crest Left Stats Plaque (Desktop) */}
        <div className="relative mt-1.5 mb-5 w-[238px] sm:w-[264px] rounded-xl border-[2px] border-[#d3ae6a] bg-[#161b18]/78 px-3.5 pt-3.5 pb-3 text-[#eefcf9] shadow-[0_14px_30px_rgba(0,0,0,0.62),inset_0_0_0_2px_rgba(24,14,7,0.84),inset_0_0_0_3px_rgba(232,202,140,0.3)] backdrop-blur-md">
          {/* Top Centered Turquoise Teardrop Crest */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center"
          >
            <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
              <path
                d="M2 15C8 15 12 8 18 2C24 8 28 15 34 15"
                stroke="#d8b470"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M18 3.5C21 7.6 22.8 10.6 22.8 13.4C22.8 16.2 20.6 18.2 18 18.2C15.4 18.2 13.2 16.2 13.2 13.4C13.2 10.6 15 7.6 18 3.5Z"
                fill="#5eead4"
                stroke="#f5de9d"
                strokeWidth="1.5"
              />
              <circle cx="16.8" cy="11.5" r="1.4" fill="#ffffff" />
            </svg>
          </div>

          {/* Antique Gold Corner Filigree Flourishes */}
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" className="pointer-events-none absolute top-0.5 left-0.5 opacity-90">
            <path d="M2 14V5C2 3.3 3.3 2 5 2H14" stroke="#e4c280" strokeWidth="1.4" />
            <circle cx="5.5" cy="5.5" r="1.4" fill="#e4c280" />
          </svg>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" className="pointer-events-none absolute top-0.5 right-0.5 opacity-90">
            <path d="M20 14V5C20 3.3 18.7 2 17 2H8" stroke="#e4c280" strokeWidth="1.4" />
            <circle cx="16.5" cy="5.5" r="1.4" fill="#e4c280" />
          </svg>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" className="pointer-events-none absolute bottom-0.5 left-0.5 opacity-90">
            <path d="M2 8V17C2 18.7 3.3 20 5 20H14" stroke="#e4c280" strokeWidth="1.4" />
            <circle cx="5.5" cy="16.5" r="1.4" fill="#e4c280" />
          </svg>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" className="pointer-events-none absolute bottom-0.5 right-0.5 opacity-90">
            <path d="M20 8V17C20 18.7 18.7 20 17 20H8" stroke="#e4c280" strokeWidth="1.4" />
            <circle cx="16.5" cy="16.5" r="1.4" fill="#e4c280" />
          </svg>

          {/* Bottom Centered Hanging Bronze & Glowing Dewdrop Medallion */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-[2px] border-[#d6b26f] bg-gradient-to-b from-[#5b412c] to-[#2e1d10] shadow-[0_4px_10px_rgba(0,0,0,0.65)]">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2.2C13.4 6.3 15.8 9.6 15.8 12.6C15.8 15.8 13.2 18 10 18C6.8 18 4.2 15.8 4.2 12.6C4.2 9.6 6.6 6.3 10 2.2Z"
                  fill="#7cfce7"
                  stroke="#ffe194"
                  strokeWidth="1.4"
                />
                <circle cx="8.5" cy="11.5" r="1.4" fill="#ffffff" />
              </svg>
            </div>
          </div>

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

            <div className="flex items-center justify-between gap-1" aria-label={`Animals helped ${hud.animalsHelped} of ${hud.animalsTotal}`}>
              <span className="flex items-center gap-1.5 text-[#ffb8d8]">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 17C10 17 3.5 12.5 3.5 7.8C3.5 5.4 5.4 3.6 7.7 3.6C9 3.6 9.6 4.3 10 5C10.4 4.3 11 3.6 12.3 3.6C14.6 3.6 16.5 5.4 16.5 7.8C16.5 12.5 10 17 10 17Z"
                    fill="#ff9ec7"
                    fillOpacity="0.7"
                    stroke="#ffd6eb"
                    strokeWidth="1.2"
                  />
                </svg>
                <span className="text-[11px]">Animals</span>
              </span>
              <span className="font-semibold text-[#ffd6eb] tabular-nums">
                {hud.animalsHelped}/{hud.animalsTotal}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1" aria-label={`Trash cleaned ${hud.trashCollected} of ${hud.trashTotal}`}>
              <span className="flex items-center gap-1.5 text-[#9effef]">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M5 7H15L13.8 16.5H6.2L5 7ZM8 4H12M3.8 7H16.2"
                    stroke="#7cfce7"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[11px]">Trash</span>
              </span>
              <span className="font-semibold text-[#b8fff2] tabular-nums">
                {hud.trashCollected}/{hud.trashTotal}
              </span>
            </div>
          </div>

          {hasActiveBuffs && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-[#8cf8e8]/15 pt-1.5 text-[11px] font-medium">
              {hud.wardShieldLeft > 0 && (
                <span className="text-[#ffe896] tabular-nums">Safe Shield {hud.wardShieldLeft.toFixed(1)}s</span>
              )}
              {powerLabel && <span className="text-[#ffe39a]">{powerLabel}</span>}
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

        {/* Top-Right Carved Wood & Antique Bronze Ornate Filigree Nav Bar (Desktop) */}
        <div className="pointer-events-auto flex flex-wrap justify-end shrink-0 items-center gap-1.5 sm:gap-2 pt-1">
          {hud.flyingFlowers > 0 && (
            <button
              type="button"
              onClick={onFly}
              className="relative min-h-[38px] whitespace-nowrap shrink-0 rounded-lg border border-[#f2a6d8] bg-gradient-to-b from-[#5e2752] to-[#36122f] px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-[#ffe0f7] shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,10,20,0.72),inset_0_0_0_3px_rgba(242,166,216,0.28)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9ce3] tabular-nums"
            >
              <ButtonFiligree />
              Fly · {hud.flyingFlowers}
            </button>
          )}
          <button
            type="button"
            onClick={onOpenShop}
            className="relative min-h-[38px] whitespace-nowrap shrink-0 rounded-lg border border-[#d9b676] bg-gradient-to-b from-[#66492e] to-[#3c2817] px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-[#ffe6a3] shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,14,7,0.72),inset_0_0_0_3px_rgba(232,202,140,0.3)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe194]"
          >
            <ButtonFiligree />
            Shop
          </button>
          <button
            type="button"
            onClick={onSaveGame}
            className={`relative min-h-[38px] whitespace-nowrap shrink-0 rounded-lg border px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,14,7,0.72),inset_0_0_0_3px_rgba(225,192,130,0.26)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d] ${
              justSaved
                ? 'border-[#8de2c7] bg-gradient-to-b from-[#237a66] to-[#134c3f] text-[#d1fae5] font-semibold'
                : 'border-[#c9a66b]/90 bg-gradient-to-b from-[#5b412c] to-[#342316] text-[#f7eed7]'
            }`}
          >
            <ButtonFiligree />
            {justSaved ? 'Saved!' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="relative min-h-[38px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/90 bg-gradient-to-b from-[#5b412c] to-[#342316] px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-[#f7eed7] shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,14,7,0.72),inset_0_0_0_3px_rgba(225,192,130,0.26)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
          >
            <ButtonFiligree />
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
            variant="woodland"
            ornate
          />

          <button
            type="button"
            onClick={onOpenSettings}
            className="relative min-h-[38px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/90 bg-gradient-to-b from-[#5b412c] to-[#342316] px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-[#f7eed7] shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,14,7,0.72),inset_0_0_0_3px_rgba(225,192,130,0.26)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
          >
            <ButtonFiligree />
            Settings
          </button>

          <button
            type="button"
            onClick={onPause}
            className="relative min-h-[38px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/90 bg-gradient-to-b from-[#5b412c] to-[#342316] px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-[#f7eed7] shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,14,7,0.72),inset_0_0_0_3px_rgba(225,192,130,0.26)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
          >
            <ButtonFiligree />
            Pause
          </button>
        </div>
      </div>

      {/* Bottom Weathered Parchment Scroll Control Banner (Desktop PC) */}
      <div className="flex justify-center pt-1 pb-1">
        <ParchmentScrollBanner singleLine>
          A-D Move &nbsp;·&nbsp; Space Jump &amp; Glide &nbsp;·&nbsp; E Pulse &nbsp;·&nbsp; H Help Animal &nbsp;·&nbsp; F Fly &nbsp;·&nbsp; M Mute &nbsp;·&nbsp; Esc Pause
        </ParchmentScrollBanner>
      </div>
    </div>
  );
};
