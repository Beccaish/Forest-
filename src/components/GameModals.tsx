import React from 'react';
import { Settings } from 'lucide-react';
import homeHeroForestImg from '../assets/images/home_hero_enchanted_forest_1795774948240.jpg';
import realmAmberImg from '../assets/images/realm_card_amber_hollows_1795774948730.jpg';
import realmFrostbloomImg from '../assets/images/realm_card_frostbloom_skywoods_1795774949730.jpg';
import realmFrozenImg from '../assets/images/realm_card_frozen_peaks_1795774949945.jpg';
import realmWhisperingImg from '../assets/images/realm_card_whispering_woods_1795774948723.jpg';
import type { HudSnapshot, LevelId } from '../game/types';
import { SoundControl } from './SoundControl';
import { ParchmentScrollBanner } from './ParchmentScrollBanner';

interface GameModalsProps {
  hud: HudSnapshot;
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  isTouchDevice: boolean;
  justSaved: boolean;
  onSelectLevel: (levelId: LevelId) => void;
  onStart: () => void;
  onContinueSaved: () => void;
  onNextLevel: () => void;
  onResume: () => void;
  onSaveGame: () => void;
  onGoHome: () => void;
  onRestart: () => void;
  onRespawn: () => void;
  onToggleMute: () => void;
  onMusicVolumeChange: (val: number) => void;
  onSfxVolumeChange: (val: number) => void;
  onPreviewSfx: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const GameModals: React.FC<GameModalsProps> = ({
  hud,
  muted,
  musicVolume,
  sfxVolume,
  isTouchDevice,
  justSaved,
  onSelectLevel,
  onStart,
  onContinueSaved,
  onNextLevel,
  onResume,
  onSaveGame,
  onGoHome,
  onRestart,
  onRespawn,
  onToggleMute,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onPreviewSfx,
  onOpenShop,
  onOpenSettings,
}) => {
  if (hud.phase === 'PLAYING') return null;

  if (hud.phase === 'TITLE_MENU') {
    const realms: {
      id: LevelId;
      title: string;
      img: string;
      activeBorder: string;
      idleBorder: string;
      scrim: string;
      glowColor: string;
    }[] = [
      {
        id: 1,
        title: 'Level 1 · Whispering Woods',
        img: realmWhisperingImg,
        activeBorder: 'border-[#73e7c4] ring-2 ring-[#56e3cc]/45',
        idleBorder: 'border-[#6d8e78]/75 hover:border-[#99d8b5]',
        scrim: 'linear-gradient(180deg, rgba(14,34,25,0.45) 0%, rgba(10,28,20,0.72) 100%)',
        glowColor: 'rgba(86, 227, 204, 0.25)',
      },
      {
        id: 2,
        title: 'Level 2 · Amber & Crystal Hollows',
        img: realmAmberImg,
        activeBorder: 'border-[#ffc574] ring-2 ring-[#ffb86c]/45',
        idleBorder: 'border-[#9d7c54]/75 hover:border-[#f3be7a]',
        scrim: 'linear-gradient(180deg, rgba(40,24,11,0.42) 0%, rgba(28,16,8,0.74) 100%)',
        glowColor: 'rgba(255, 184, 108, 0.25)',
      },
      {
        id: 3,
        title: 'Level 3 · Frostbloom Skywoods',
        img: realmFrostbloomImg,
        activeBorder: 'border-[#94e8ff] ring-2 ring-[#94e8ff]/45',
        idleBorder: 'border-[#6f92a3]/75 hover:border-[#aee8fa]',
        scrim: 'linear-gradient(180deg, rgba(13,30,42,0.44) 0%, rgba(8,22,34,0.74) 100%)',
        glowColor: 'rgba(148, 232, 255, 0.25)',
      },
      {
        id: 4,
        title: 'Level 4 · Frozen Pine Peaks',
        img: realmFrozenImg,
        activeBorder: 'border-[#ccefff] ring-2 ring-[#bfefff]/45',
        idleBorder: 'border-[#7893a6]/75 hover:border-[#cdeeff]',
        scrim: 'linear-gradient(180deg, rgba(15,28,44,0.44) 0%, rgba(9,20,36,0.76) 100%)',
        glowColor: 'rgba(191, 239, 255, 0.25)',
      },
    ];

    return (
      <div className="fixed inset-0 z-20 flex flex-col justify-between overflow-hidden bg-[#04100e]">
        {/* Full-Bleed Enchanted Woodland Hero Art */}
        <img
          src={homeHeroForestImg}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right sm:object-center"
        />
        {/* Left-to-Right Soft Readability Vignette keeping Right Mushroom Hollow Luminous */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,16,14,0.88)_0%,rgba(6,22,19,0.74)_38%,rgba(6,22,19,0.28)_66%,rgba(4,14,12,0.12)_100%)]"
        />

        {/* Top Bar: Top-Right Rustic Carved Bronze Sound & Settings Plaques */}
        <div className="relative z-10 flex justify-end items-center gap-2 pt-[max(0.85rem,env(safe-area-inset-top))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:px-8 sm:pt-5 shrink-0">
          <div className="relative flex items-center gap-2">
            {/* Subtle Carved Botanical Leaf/Gear Accent behind Sound & Settings */}
            <svg
              aria-hidden="true"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              className="pointer-events-none -mr-4 -mt-3 opacity-85 hidden sm:block"
            >
              <circle cx="14" cy="14" r="7" fill="#6b4e33" stroke="#d1ae70" strokeWidth="1.2" />
              <circle cx="14" cy="14" r="3" fill="#2d1e12" />
              <path d="M5 23C6 17 9 14 13 13" stroke="#6d9354" strokeWidth="2.2" strokeLinecap="round" />
            </svg>

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
            />

            <button
              type="button"
              onClick={onOpenSettings}
              className="min-h-[40px] flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-[#c4a16a]/85 bg-gradient-to-b from-[#553d2b] to-[#342317] px-3 sm:px-3.5 py-2 text-xs font-medium text-[#f5ead4] shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_0_0_2px_rgba(24,15,9,0.65),inset_0_1px_0_rgba(255,228,175,0.22)] hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
            >
              <Settings className="h-3.5 w-3.5 text-[#e6c888]" aria-hidden="true" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Center-Left Hero Content Stack */}
        <div
          className="relative z-10 flex-1 min-h-0 overflow-y-auto flex items-center pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:px-10 lg:px-14 py-2"
          style={{ touchAction: 'pan-y' }}
        >
          <div className="w-full max-w-[610px] my-auto">
            {/* Ornate Golden Serif Title + Botanical Tree Emblem + Vine Scrollwork */}
            <svg
              viewBox="0 0 560 132"
              className="w-full max-w-[360px] sm:max-w-[520px] h-auto mb-1.5 sm:mb-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.75)]"
              role="img"
              aria-label="Whispering Forest"
            >
              <defs>
                <linearGradient id="titleGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fff7d9" />
                  <stop offset="52%" stopColor="#f3d893" />
                  <stop offset="100%" stopColor="#cfa75c" />
                </linearGradient>
                <radialGradient id="fireflyOrb" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="45%" stopColor="#ffe598" />
                  <stop offset="100%" stopColor="#ffe598" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Top-left delicate botanical vine swirl */}
              <path
                d="M14 54 C6 34, 24 22, 46 28 C58 31, 66 24, 72 18"
                fill="none"
                stroke="#d6b26f"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path d="M22 36 C18 28, 25 22, 32 25 C28 31, 26 34, 22 36Z" fill="#d6b26f" />
              <path d="M44 27 C43 20, 50 17, 55 21 C51 25, 48 27, 44 27Z" fill="#d6b26f" />

              {/* Title Typography */}
              <text
                x="24"
                y="76"
                fill="url(#titleGoldGrad)"
                fontFamily="Fraunces, Georgia, serif"
                fontSize="50"
                fontWeight="600"
                letterSpacing="-0.5"
              >
                Whispering Forest
              </text>

              {/* Right Golden Stylized Tree Emblem */}
              <g transform="translate(466, 20)">
                <path
                  d="M24 58 C24 46, 25 38, 26 28 M25 42 C18 37, 13 33, 9 27 M26 39 C33 34, 38 30, 41 24 M25 56 C19 60, 14 62, 8 63 M26 56 C32 60, 38 62, 44 63"
                  fill="none"
                  stroke="url(#titleGoldGrad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                {/* Delicate Golden Leaf Canopy */}
                <ellipse cx="14" cy="20" rx="5.5" ry="3.2" transform="rotate(-25 14 20)" fill="#f0d38b" />
                <ellipse cx="25" cy="12" rx="6" ry="3.5" fill="#fff1bf" />
                <ellipse cx="37" cy="18" rx="5.5" ry="3.2" transform="rotate(25 37 18)" fill="#f0d38b" />
                <ellipse cx="9" cy="30" rx="4.5" ry="2.8" transform="rotate(-40 9 30)" fill="#dfb96d" />
                <ellipse cx="42" cy="28" rx="4.5" ry="2.8" transform="rotate(40 42 28)" fill="#dfb96d" />
                <ellipse cx="21" cy="24" rx="5" ry="3" transform="rotate(-15 21 24)" fill="#f4da97" />
                <ellipse cx="31" cy="24" rx="5" ry="3" transform="rotate(15 31 24)" fill="#f4da97" />
              </g>

              {/* Bottom Arching Botanical Vine Scrollwork Meeting Dual Firefly Orbs */}
              <path
                d="M18 78 C55 112, 135 114, 212 104"
                fill="none"
                stroke="#d6b26f"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M492 84 C450 112, 345 114, 260 104"
                fill="none"
                stroke="#d6b26f"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Vine leaves along bottom curve */}
              <path d="M58 97 C54 90, 62 85, 68 90 C64 95, 62 97, 58 97Z" fill="#d6b26f" />
              <path d="M108 108 C106 100, 114 97, 119 102 C115 106, 112 108, 108 108Z" fill="#d6b26f" />
              <path d="M164 109 C163 102, 171 99, 175 104 C171 108, 168 109, 164 109Z" fill="#d6b26f" />
              <path d="M312 109 C308 104, 315 99, 322 104 C318 108, 315 109, 312 109Z" fill="#d6b26f" />
              <path d="M378 107 C374 102, 381 97, 388 102 C384 106, 381 107, 378 107Z" fill="#d6b26f" />
              <path d="M440 97 C436 92, 444 87, 450 92 C446 96, 443 97, 440 97Z" fill="#d6b26f" />

              {/* Glowing Center Firefly Orbs */}
              <circle cx="228" cy="103" r="10" fill="url(#fireflyOrb)" />
              <circle cx="244" cy="103" r="7.5" fill="url(#fireflyOrb)" />
            </svg>

            <p className="mb-2.5 sm:mb-3 text-[11px] sm:text-xs font-medium tracking-[0.2em] text-[#d6ebe4] uppercase">
              Four Realms · Dynamic Weather · Lumina &amp; Relics
            </p>

            <p className="mb-4 sm:mb-5 text-sm sm:text-[15px] leading-relaxed text-[#eef7f4] max-w-md drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
              Gather Lumina Orbs, Sun Blossoms, Prism Crystals, and Star Seeds across four forest realms and awaken each ancient sanctuary.
            </p>

            {/* Illustrated 4-Realm Selector Plaques */}
            <div className="mb-4 sm:mb-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-[590px]">
              {realms.map((realm) => {
                const selected = hud.levelId === realm.id;
                return (
                  <button
                    key={realm.id}
                    type="button"
                    onClick={() => onSelectLevel(realm.id)}
                    style={{
                      boxShadow: selected
                        ? `0 6px 20px rgba(0,0,0,0.55), 0 0 16px ${realm.glowColor}`
                        : '0 4px 14px rgba(0,0,0,0.48)',
                    }}
                    className={`group relative overflow-hidden min-h-[54px] rounded-lg border px-3.5 py-2.5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d] ${
                      selected ? realm.activeBorder : realm.idleBorder
                    }`}
                  >
                    <img
                      src={realm.img}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div
                      aria-hidden="true"
                      style={{ background: realm.scrim }}
                      className="pointer-events-none absolute inset-0"
                    />
                    {/* Subtle Double Inner Trim */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-[3px] rounded-[5px] border border-white/15"
                    />
                    <span
                      className={`relative z-10 block text-xs sm:text-[13px] leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] ${
                        selected ? 'font-semibold text-white' : 'font-medium text-[#e9f4ef]'
                      }`}
                    >
                      {realm.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Ornate Carved Wood, Ocean Teal & Hanging Shop Action Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Start Game — Rustic Carved Wood Plaque with Glowing Turquoise Gems */}
              <button
                type="button"
                onClick={onStart}
                className="relative min-h-[46px] whitespace-nowrap shrink-0 rounded-md border border-[#b59360] bg-gradient-to-b from-[#5d4330] to-[#372518] px-7 py-2.5 text-sm font-semibold text-[#fdf6e4] shadow-[0_6px_16px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,15,9,0.65),inset_0_1px_0_rgba(255,228,175,0.28)] hover:brightness-110 active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-[#5eead4] border border-[#134e4a] shadow-[0_0_6px_#5eead4]"
                />
                <span>Start Game</span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-[#5eead4] border border-[#134e4a] shadow-[0_0_6px_#5eead4]"
                />
              </button>

              {/* Continue — Deep Ocean-Teal Beveled Plaque with Gold Trim */}
              {hud.savedGame && (
                <button
                  type="button"
                  onClick={onContinueSaved}
                  className="relative min-h-[46px] whitespace-nowrap shrink-0 rounded-md border border-[#d6b779] bg-gradient-to-b from-[#1e605b] to-[#103836] px-6 py-2.5 text-sm font-semibold text-[#f5f2e6] shadow-[0_6px_16px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(9,28,27,0.68),inset_0_0_0_3px_rgba(214,183,121,0.3)] hover:brightness-110 active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7] tabular-nums"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[#e8cb8b]"
                  >
                    ◆
                  </span>
                  <span>
                    Continue L{hud.savedGame.levelId} · {hud.savedGame.progressPct}%
                  </span>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#e8cb8b]"
                  >
                    ◆
                  </span>
                </button>
              )}

              {/* Shop — Hanging Carved Bronze Tavern Sign Plaque */}
              <button
                type="button"
                onClick={onOpenShop}
                className="relative min-h-[46px] whitespace-nowrap shrink-0 rounded-md border border-[#ba955e] bg-gradient-to-b from-[#513a28] to-[#2e1e13] px-6 py-2.5 text-sm font-semibold text-[#f6ebd3] shadow-[0_6px_16px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,15,9,0.68),inset_0_1px_0_rgba(255,228,175,0.22)] hover:brightness-110 active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe194] tabular-nums"
              >
                <span>Shop · {hud.dewdrops}</span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 bg-[#5eead4] border border-[#134e4a] shadow-[0_0_6px_#5eead4]"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Floating Illustrated Parchment Scroll Control Banner */}
        <div className="relative z-10 pointer-events-none flex justify-center items-center px-3 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shrink-0">
          <ParchmentScrollBanner>
            {isTouchDevice
              ? 'Move & Jump  |  Tap Sick Animals to Help (5s Safe Shield!)  |  Pick Up Trash'
              : 'A-D Move  |  Space Jump  |  E Pulse  |  H Help Sick Animals (5s Safe!)  |  Walk Over Trash'}
          </ParchmentScrollBanner>
        </div>
      </div>
    );
  }

  if (hud.phase === 'PAUSED') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#030d0b]/76 p-4 overflow-y-auto backdrop-blur-[2px]">
        <div className="relative w-full max-w-sm rounded-2xl border-[2px] border-[#c4a16a] bg-gradient-to-b from-[#0b231e]/96 to-[#061412]/98 p-5 sm:p-7 text-center shadow-[0_22px_54px_rgba(0,0,0,0.75),inset_0_0_0_2px_rgba(24,14,7,0.85),inset_0_0_0_3px_rgba(232,202,140,0.3)] my-auto">
          {/* Top Turquoise Gem Crest */}
          <div aria-hidden="true" className="pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2">
            <svg width="42" height="24" viewBox="0 0 36 22" fill="none">
              <path d="M2 15C8 15 12 8 18 2C24 8 28 15 34 15" stroke="#d8b470" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M18 3.5C21 7.6 22.8 10.6 22.8 13.4C22.8 16.2 20.6 18.2 18 18.2C15.4 18.2 13.2 16.2 13.2 13.4C13.2 10.6 15 7.6 18 3.5Z" fill="#5eead4" stroke="#f5de9d" strokeWidth="1.5" />
              <circle cx="16.8" cy="11.5" r="1.4" fill="#ffffff" />
            </svg>
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#f5eedc] mb-1">
            Journey Paused
          </h2>
          <p className="text-xs font-medium text-[#ffe194] mb-1">
            Level {hud.levelId} · {hud.levelName}
          </p>
          <p className="text-xs sm:text-sm text-[#bfe3da] mb-4 sm:mb-6">
            {hud.biomeName} · {hud.weatherLabel}
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onResume}
              className="col-span-2 min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#8de2c7] bg-gradient-to-b from-[#237a66] to-[#134c3f] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(9,32,27,0.68),inset_0_0_0_3px_rgba(165,243,225,0.3)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onSaveGame}
              className={`min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7] ${
                justSaved
                  ? 'border-[#8de2c7] bg-gradient-to-b from-[#237a66] to-[#134c3f] text-[#b4fff1]'
                  : 'border-[#c9a66b]/90 bg-gradient-to-b from-[#5b412c] to-[#342316] text-[#f7eed7]'
              }`}
            >
              {justSaved ? 'Saved!' : 'Save Game'}
            </button>
            <button
              type="button"
              onClick={onOpenShop}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#d9b676] bg-gradient-to-b from-[#66492e] to-[#3c2817] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#ffe6a3] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe194] tabular-nums"
            >
              Shop · {hud.dewdrops}
            </button>
            <button
              type="button"
              onClick={onGoHome}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/85 bg-gradient-to-b from-[#553d2b] to-[#312014] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#f5ead4] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
            >
              Home
            </button>
            <button
              type="button"
              onClick={onNextLevel}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/85 bg-gradient-to-b from-[#553d2b] to-[#312014] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#f5ead4] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
            >
              {hud.levelId === 1
                ? 'Level 2'
                : hud.levelId === 2
                  ? 'Level 3'
                  : hud.levelId === 3
                    ? 'Level 4'
                    : 'Level 1'}
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/85 bg-gradient-to-b from-[#553d2b] to-[#312014] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#f5ead4] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
            >
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/85 bg-gradient-to-b from-[#553d2b] to-[#312014] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#f5ead4] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="col-span-2 min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/85 bg-gradient-to-b from-[#553d2b] to-[#312014] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#f5ead4] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hud.phase === 'GAME_OVER') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#030d0b]/78 p-4 overflow-y-auto backdrop-blur-[2px]">
        <div className="relative w-full max-w-md rounded-2xl border-[2px] border-[#c4a16a] bg-gradient-to-b from-[#17121b]/96 to-[#0a1414]/98 p-6 sm:p-8 text-center shadow-[0_22px_54px_rgba(0,0,0,0.78),inset_0_0_0_2px_rgba(24,14,7,0.85),inset_0_0_0_3px_rgba(232,202,140,0.28)] my-auto">
          <h2 className="font-display text-2xl font-semibold text-[#f7e9ef] mb-2">
            Spirit Faded
          </h2>
          <p className="text-sm text-[#c7dcd8] mb-5 sm:mb-6">
            The shadow wisps scattered your light. Return to your last awakened lantern or begin anew.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onRespawn}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#8de2c7] bg-gradient-to-b from-[#237a66] to-[#134c3f] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(9,32,27,0.68),inset_0_0_0_3px_rgba(165,243,225,0.3)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
            >
              Continue from Lantern
            </button>
            <button
              type="button"
              onClick={onOpenShop}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#d9b676] bg-gradient-to-b from-[#66492e] to-[#3c2817] px-5 py-2.5 text-sm font-semibold text-[#ffe6a3] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe194] tabular-nums"
            >
              Shop · {hud.dewdrops}
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/85 bg-gradient-to-b from-[#553d2b] to-[#312014] px-5 py-2.5 text-sm font-medium text-[#f5ead4] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={onGoHome}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/85 bg-gradient-to-b from-[#553d2b] to-[#312014] px-5 py-2.5 text-sm font-medium text-[#f5ead4] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#030d0b]/76 p-4 overflow-y-auto backdrop-blur-[2px]">
      <div className="relative w-full max-w-lg rounded-2xl border-[2px] border-[#c4a16a] bg-gradient-to-b from-[#0b231e]/96 to-[#061412]/98 p-6 sm:p-8 text-center shadow-[0_22px_54px_rgba(0,0,0,0.75),inset_0_0_0_2px_rgba(24,14,7,0.85),inset_0_0_0_3px_rgba(232,202,140,0.3)] my-auto">
        <div aria-hidden="true" className="pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2">
          <svg width="42" height="24" viewBox="0 0 36 22" fill="none">
            <path d="M2 15C8 15 12 8 18 2C24 8 28 15 34 15" stroke="#d8b470" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M18 3.5C21 7.6 22.8 10.6 22.8 13.4C22.8 16.2 20.6 18.2 18 18.2C15.4 18.2 13.2 16.2 13.2 13.4C13.2 10.6 15 7.6 18 3.5Z" fill="#5eead4" stroke="#f5de9d" strokeWidth="1.5" />
            <circle cx="16.8" cy="11.5" r="1.4" fill="#ffffff" />
          </svg>
        </div>

        <p className="text-xs font-medium text-[#ffe194] mb-1">
          Level {hud.levelId} Complete · {hud.levelName}
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#f5eedc] mb-2">
          Sanctuary Awakened
        </h2>
        <p className="text-xs sm:text-sm leading-relaxed text-[#bfe3da] mb-4 sm:mb-6">
          {hud.levelId === 1
            ? 'You awakened the Starlit Spirit Tree. Ready to journey into the Amber & Crystal Hollows?'
            : hud.levelId === 2
              ? 'You conquered the Amber & Crystal Hollows. Soar onward into the Frostbloom Skywoods!'
              : hud.levelId === 3
                ? 'You soared through the Frostbloom Skywoods. Brave the icy ledges of Frozen Pine Peaks next!'
                : 'You mastered the slippery ice ridges of Frozen Pine Peaks and awakened the Aurora Summit Sanctuary!'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-y border-[#c4a16a]/30 py-3 sm:py-4 mb-5 sm:mb-7">
          <div>
            <div className="text-base sm:text-lg font-semibold text-[#7cfce7] tabular-nums">
              {hud.orbsCollected}/{hud.orbsTotal}
            </div>
            <div className="text-[11px] sm:text-xs text-[#9ac7c1]">Lumina</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-semibold text-[#ffd67a] tabular-nums">
              {hud.blossomsCollected}/{hud.blossomsTotal}
            </div>
            <div className="text-[11px] sm:text-xs text-[#9ac7c1]">Blossoms</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-semibold text-[#b4f5ff] tabular-nums">
              {hud.crystalsCollected}/{hud.crystalsTotal}
            </div>
            <div className="text-[11px] sm:text-xs text-[#9ac7c1]">Crystals</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-semibold text-[#d5b8ff] tabular-nums">
              {hud.starseedsCollected}/{hud.starseedsTotal}
            </div>
            <div className="text-[11px] sm:text-xs text-[#9ac7c1]">Star Seeds</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-semibold text-[#ff9ec7] tabular-nums">
              {hud.animalsHelped}/{hud.animalsTotal}
            </div>
            <div className="text-[11px] sm:text-xs text-[#9ac7c1]">Animals Helped</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-semibold text-[#8cf8e8] tabular-nums">
              {hud.trashCollected}/{hud.trashTotal}
            </div>
            <div className="text-[11px] sm:text-xs text-[#9ac7c1]">Trash Cleaned</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-semibold text-[#ffe194] tabular-nums">
              {hud.lanternsLit}/{hud.lanternsTotal}
            </div>
            <div className="text-[11px] sm:text-xs text-[#9ac7c1]">Lanterns</div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-semibold text-[#e9fbf8] tabular-nums">
              {formatTime(hud.elapsedSeconds)}
            </div>
            <div className="text-[11px] sm:text-xs text-[#9ac7c1]">Time</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {hud.levelId < 4 ? (
            <button
              type="button"
              onClick={onNextLevel}
              className={`min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border px-7 py-2.5 sm:py-3 text-sm font-semibold shadow-[0_6px_14px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.3)] transition-all hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff0d6] ${
                hud.levelId === 1
                  ? 'border-[#ffe2a3] bg-[#ffb86c] text-[#1f0d05]'
                  : hud.levelId === 2
                    ? 'border-[#d6f6ff] bg-[#94e8ff] text-[#051829]'
                    : 'border-[#e6f9ff] bg-[#bfefff] text-[#041929]'
              }`}
            >
              Next Level
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextLevel}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/85 bg-gradient-to-b from-[#553d2b] to-[#312014] px-6 py-2.5 sm:py-3 text-sm font-medium text-[#f5ead4] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
            >
              Play Level 1
            </button>
          )}
          <button
            type="button"
            onClick={onRestart}
            className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#8de2c7] bg-gradient-to-b from-[#237a66] to-[#134c3f] px-7 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(9,32,27,0.68),inset_0_0_0_3px_rgba(165,243,225,0.3)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onOpenShop}
            className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#d9b676] bg-gradient-to-b from-[#66492e] to-[#3c2817] px-5 py-2.5 sm:py-3 text-sm font-semibold text-[#ffe6a3] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe194] tabular-nums"
          >
            Shop · {hud.dewdrops}
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[44px] whitespace-nowrap shrink-0 rounded-lg border border-[#c9a66b]/85 bg-gradient-to-b from-[#553d2b] to-[#312014] px-5 py-2.5 sm:py-3 text-sm font-medium text-[#f5ead4] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(24,14,7,0.72)] transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d]"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
