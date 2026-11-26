import React from 'react';
import type { HudSnapshot, LevelId } from '../game/types';
import { SoundControl } from './SoundControl';

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
    return (
      <div className="fixed inset-0 z-20 flex flex-col justify-between overflow-y-auto pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:p-10 bg-gradient-to-r from-[#040c13]/84 via-[#040c13]/45 to-transparent">
        <div className="flex justify-end items-center gap-2">
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
            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#8cf8e8]/25 bg-[#06131a]/80 px-3.5 py-2 text-xs font-medium text-[#dcf7f3] transition-colors hover:border-[#8cf8e8]/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
          >
            Settings
          </button>
        </div>

        <div className="max-w-xl my-auto py-2">
          <svg
            viewBox="0 0 510 118"
            className="w-full max-w-[335px] sm:max-w-[465px] h-auto mb-2 sm:mb-4"
            role="img"
            aria-label="Whispering Forest"
          >
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f0fffc" />
                <stop offset="58%" stopColor="#89f7e3" />
                <stop offset="100%" stopColor="#ffe194" />
              </linearGradient>
            </defs>
            <path
              d="M14 28 C28 14, 52 14, 66 28 C52 34, 28 34, 14 28 Z"
              fill="#7cfce7"
              fillOpacity="0.28"
              stroke="#7cfce7"
              strokeWidth="1.2"
            />
            <path
              d="M78 28 H220"
              stroke="#7cfce7"
              strokeOpacity="0.45"
              strokeWidth="1"
            />
            <circle cx="40" cy="28" r="2.6" fill="#ffe194" />
            <text
              x="12"
              y="78"
              fill="url(#titleGrad)"
              fontFamily="Fraunces, Georgia, serif"
              fontSize="48"
              fontWeight="600"
              letterSpacing="0.5"
            >
              Whispering Forest
            </text>
            <text
              x="14"
              y="104"
              fill="#b4ded8"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="13.5"
              letterSpacing="2.4"
            >
              FOUR REALMS · DYNAMIC WEATHER · LUMINA &amp; RELICS
            </text>
          </svg>

          <p className="mb-3 sm:mb-5 text-sm sm:text-base leading-relaxed text-[#cceae5] max-w-md">
            Gather Lumina Orbs, Sun Blossoms, Prism Crystals, and Star Seeds across four forest realms and awaken each ancient sanctuary.
          </p>

          {/* Interactive Level Selector */}
          <div className="mb-4 sm:mb-6 inline-flex flex-wrap gap-2 rounded-lg bg-[#06131a]/75 p-1.5 border border-[#8cf8e8]/20">
            <button
              type="button"
              onClick={() => onSelectLevel(1)}
              className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                hud.levelId === 1
                  ? 'bg-[#56e3cc] text-[#041b1f] font-semibold'
                  : 'text-[#cbeae5] hover:text-white'
              }`}
            >
              Level 1 · Whispering Woods
            </button>
            <button
              type="button"
              onClick={() => onSelectLevel(2)}
              className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                hud.levelId === 2
                  ? 'bg-[#ffb86c] text-[#1f0d05] font-semibold'
                  : 'text-[#cbeae5] hover:text-white'
              }`}
            >
              Level 2 · Amber &amp; Crystal Hollows
            </button>
            <button
              type="button"
              onClick={() => onSelectLevel(3)}
              className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                hud.levelId === 3
                  ? 'bg-[#94e8ff] text-[#051829] font-semibold'
                  : 'text-[#cbeae5] hover:text-white'
              }`}
            >
              Level 3 · Frostbloom Skywoods
            </button>
            <button
              type="button"
              onClick={() => onSelectLevel(4)}
              className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                hud.levelId === 4
                  ? 'bg-[#bfefff] text-[#041929] font-semibold'
                  : 'text-[#cbeae5] hover:text-white'
              }`}
            >
              Level 4 · Frozen Pine Peaks
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md bg-[#56e3cc] px-7 py-2.5 sm:py-3 text-sm font-semibold text-[#041b1f] transition-transform duration-150 hover:bg-[#73f5df] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
            >
              Start Game
            </button>
            {hud.savedGame && (
              <button
                type="button"
                onClick={onContinueSaved}
                className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#8cf8e8]/45 bg-[#0b2733]/90 px-5 py-2.5 sm:py-3 text-sm font-semibold text-[#b8fff2] transition-colors hover:border-[#8cf8e8] hover:bg-[#113746] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8cf8e8] tabular-nums"
              >
                Continue L{hud.savedGame.levelId} · {hud.savedGame.progressPct}%
              </button>
            )}
            <button
              type="button"
              onClick={onOpenShop}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#ffe194]/40 bg-[#081720]/85 px-5 py-2.5 sm:py-3 text-sm font-semibold text-[#ffe194] transition-colors hover:border-[#ffe194]/75 hover:bg-[#102633] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe194] tabular-nums"
            >
              Shop · {hud.dewdrops}
            </button>
          </div>
        </div>

        <p className="text-xs tracking-wide text-[#b9dfd9]/90 pt-2">
          {isTouchDevice
            ? 'Move & Jump · Tap Sick Animals to Help (5s Safe Shield!) · Pick Up Trash'
            : 'A D Move · Space Jump · E Pulse · Click Sick Animals to Help (5s Safe!) · Pick Up Trash'}
        </p>
      </div>
    );
  }

  if (hud.phase === 'PAUSED') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040b12]/72 p-4 overflow-y-auto">
        <div className="w-full max-w-sm rounded-xl border border-[#7cfce7]/22 bg-[#07151d]/95 p-5 sm:p-7 text-center shadow-2xl my-auto">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#e9fbf8] mb-1">
            Journey Paused
          </h2>
          <p className="text-xs font-medium text-[#ffe194] mb-1">
            Level {hud.levelId} · {hud.levelName}
          </p>
          <p className="text-xs sm:text-sm text-[#a6d1cb] mb-4 sm:mb-6">
            {hud.biomeName} · {hud.weatherLabel}
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onResume}
              className="col-span-2 min-h-[44px] whitespace-nowrap shrink-0 rounded-md bg-[#56e3cc] px-5 py-2.5 text-sm font-semibold text-[#041b1f] transition-colors hover:bg-[#73f5df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onSaveGame}
              className={`min-h-[44px] whitespace-nowrap shrink-0 rounded-md border px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7] ${
                justSaved
                  ? 'border-[#56e3cc] bg-[#56e3cc]/25 text-[#9effef]'
                  : 'border-[#7cfce7]/35 bg-transparent text-[#9effef] hover:bg-[#0e2430]'
              }`}
            >
              {justSaved ? 'Saved!' : 'Save Game'}
            </button>
            <button
              type="button"
              onClick={onOpenShop}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#ffe194]/40 bg-transparent px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#ffe194] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe194] tabular-nums"
            >
              Shop · {hud.dewdrops}
            </button>
            <button
              type="button"
              onClick={onGoHome}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 bg-transparent px-4 py-2.5 text-xs sm:text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
            >
              Home
            </button>
            <button
              type="button"
              onClick={onNextLevel}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 bg-transparent px-4 py-2.5 text-xs sm:text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
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
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 bg-transparent px-4 py-2.5 text-xs sm:text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
            >
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 bg-transparent px-4 py-2.5 text-xs sm:text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 bg-transparent px-4 py-2.5 text-xs sm:text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
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
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040b12]/76 p-4 overflow-y-auto">
        <div className="w-full max-w-md rounded-xl border border-[#ff7ea8]/30 bg-[#08131c]/95 p-6 sm:p-8 text-center shadow-2xl my-auto">
          <h2 className="font-display text-2xl font-semibold text-[#f7e9ef] mb-2">
            Spirit Faded
          </h2>
          <p className="text-sm text-[#bdd8d6] mb-5 sm:mb-6">
            The shadow wisps scattered your light. Return to your last awakened lantern or begin anew.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onRespawn}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md bg-[#56e3cc] px-6 py-2.5 text-sm font-semibold text-[#041b1f] transition-colors hover:bg-[#73f5df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
            >
              Continue from Lantern
            </button>
            <button
              type="button"
              onClick={onOpenShop}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#ffe194]/45 px-5 py-2.5 text-sm font-semibold text-[#ffe194] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe194] tabular-nums"
            >
              Shop · {hud.dewdrops}
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 px-5 py-2.5 text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
            >
              Restart
            </button>
            <button
              type="button"
              onClick={onGoHome}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 px-5 py-2.5 text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040b12]/74 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-[#7cfce7]/28 bg-[#07151d]/95 p-6 sm:p-8 text-center shadow-2xl my-auto">
        <p className="text-xs font-medium text-[#ffe194] mb-1">
          Level {hud.levelId} Complete · {hud.levelName}
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#e9fbf8] mb-2">
          Sanctuary Awakened
        </h2>
        <p className="text-xs sm:text-sm leading-relaxed text-[#b2dcd6] mb-4 sm:mb-6">
          {hud.levelId === 1
            ? 'You awakened the Starlit Spirit Tree. Ready to journey into the Amber & Crystal Hollows?'
            : hud.levelId === 2
              ? 'You conquered the Amber & Crystal Hollows. Soar onward into the Frostbloom Skywoods!'
              : hud.levelId === 3
                ? 'You soared through the Frostbloom Skywoods. Brave the icy ledges of Frozen Pine Peaks next!'
                : 'You mastered the slippery ice ridges of Frozen Pine Peaks and awakened the Aurora Summit Sanctuary!'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-y border-[#7cfce7]/15 py-3 sm:py-4 mb-5 sm:mb-7">
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
              className={`min-h-[44px] whitespace-nowrap shrink-0 rounded-md px-7 py-2.5 sm:py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff0d6] ${
                hud.levelId === 1
                  ? 'bg-[#ffb86c] text-[#1f0d05] hover:bg-[#ffc98f]'
                  : hud.levelId === 2
                    ? 'bg-[#94e8ff] text-[#051829] hover:bg-[#b5f0ff]'
                    : 'bg-[#bfefff] text-[#041929] hover:bg-[#dcf6ff]'
              }`}
            >
              Next Level
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextLevel}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/30 px-6 py-2.5 sm:py-3 text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
            >
              Play Level 1
            </button>
          )}
          <button
            type="button"
            onClick={onRestart}
            className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md bg-[#56e3cc] px-7 py-2.5 sm:py-3 text-sm font-semibold text-[#041b1f] transition-colors hover:bg-[#73f5df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onOpenShop}
            className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#ffe194]/45 px-5 py-2.5 sm:py-3 text-sm font-semibold text-[#ffe194] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe194] tabular-nums"
          >
            Shop · {hud.dewdrops}
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/30 px-5 py-2.5 sm:py-3 text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
