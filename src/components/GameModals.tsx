import React from 'react';
import type { HudSnapshot, LevelId } from '../game/types';

interface GameModalsProps {
  hud: HudSnapshot;
  muted: boolean;
  onSelectLevel: (levelId: LevelId) => void;
  onStart: () => void;
  onNextLevel: () => void;
  onResume: () => void;
  onRestart: () => void;
  onRespawn: () => void;
  onToggleMute: () => void;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const GameModals: React.FC<GameModalsProps> = ({
  hud,
  muted,
  onSelectLevel,
  onStart,
  onNextLevel,
  onResume,
  onRestart,
  onRespawn,
  onToggleMute,
}) => {
  if (hud.phase === 'PLAYING') return null;

  if (hud.phase === 'TITLE_MENU') {
    return (
      <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 sm:p-12 bg-gradient-to-r from-[#040c13]/82 via-[#040c13]/42 to-transparent">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onToggleMute}
            className="min-h-[40px] whitespace-nowrap shrink-0 rounded-md border border-[#8cf8e8]/25 bg-[#06131a]/80 px-4 py-2 text-xs font-medium text-[#dcf7f3] transition-colors hover:border-[#8cf8e8]/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        <div className="max-w-xl my-auto">
          <svg
            viewBox="0 0 480 118"
            className="w-full max-w-[440px] h-auto mb-4"
            role="img"
            aria-label="Whispering Grove"
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
              Whispering Grove
            </text>
            <text
              x="14"
              y="104"
              fill="#b4ded8"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="13.5"
              letterSpacing="2.4"
            >
              TWO REALMS · DYNAMIC WEATHER · LUMINA &amp; RELICS
            </text>
          </svg>

          <p className="mb-6 text-base leading-relaxed text-[#cceae5] max-w-md">
            Gather Lumina Orbs, Sun Blossoms, and Prism Crystals across shifting forest realms and awaken each ancient sanctuary.
          </p>

          {/* Interactive Level Selector */}
          <div className="mb-6 inline-flex flex-wrap gap-2 rounded-lg bg-[#06131a]/75 p-1.5 border border-[#8cf8e8]/20">
            <button
              type="button"
              onClick={() => onSelectLevel(1)}
              className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
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
              className={`min-h-[40px] whitespace-nowrap shrink-0 rounded-md px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                hud.levelId === 2
                  ? 'bg-[#ffb86c] text-[#1f0d05] font-semibold'
                  : 'text-[#cbeae5] hover:text-white'
              }`}
            >
              Level 2 · Amber &amp; Crystal Hollows
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onStart}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md bg-[#56e3cc] px-7 py-3 text-sm font-semibold text-[#041b1f] transition-transform duration-150 hover:bg-[#73f5df] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
            >
              Start Game
            </button>
          </div>
        </div>

        <p className="text-xs tracking-wide text-[#b9dfd9]/90">
          A D Move · Space Jump &amp; Glide · E Spirit Pulse · Esc Pause
        </p>
      </div>
    );
  }

  if (hud.phase === 'PAUSED') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040b12]/72 p-5">
        <div className="w-full max-w-sm rounded-xl border border-[#7cfce7]/22 bg-[#07151d]/95 p-7 text-center shadow-2xl">
          <h2 className="font-display text-2xl font-semibold text-[#e9fbf8] mb-1">
            Journey Paused
          </h2>
          <p className="text-xs font-medium text-[#ffe194] mb-1">
            Level {hud.levelId} · {hud.levelName}
          </p>
          <p className="text-sm text-[#a6d1cb] mb-6">
            {hud.biomeName} · {hud.weatherLabel}
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onResume}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md bg-[#56e3cc] px-5 py-2.5 text-sm font-semibold text-[#041b1f] transition-colors hover:bg-[#73f5df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onNextLevel}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 bg-transparent px-5 py-2.5 text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
            >
              {hud.levelId === 1 ? 'Switch to Level 2' : 'Switch to Level 1'}
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 bg-transparent px-5 py-2.5 text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
            >
              {muted ? 'Unmute Sound' : 'Mute Sound'}
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 bg-transparent px-5 py-2.5 text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
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
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040b12]/76 p-5">
        <div className="w-full max-w-md rounded-xl border border-[#ff7ea8]/30 bg-[#08131c]/95 p-8 text-center shadow-2xl">
          <h2 className="font-display text-2xl font-semibold text-[#f7e9ef] mb-2">
            Spirit Faded
          </h2>
          <p className="text-sm text-[#bdd8d6] mb-6">
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
              onClick={onRestart}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/25 px-5 py-2.5 text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040b12]/74 p-5">
      <div className="w-full max-w-lg rounded-xl border border-[#7cfce7]/28 bg-[#07151d]/95 p-8 text-center shadow-2xl">
        <p className="text-xs font-medium text-[#ffe194] mb-1">
          Level {hud.levelId} Complete · {hud.levelName}
        </p>
        <h2 className="font-display text-3xl font-semibold text-[#e9fbf8] mb-2">
          Sanctuary Awakened
        </h2>
        <p className="text-sm leading-relaxed text-[#b2dcd6] mb-6">
          {hud.levelId === 1
            ? 'You awakened the Starlit Spirit Tree. Ready to journey into the Amber & Crystal Hollows?'
            : 'You conquered the Amber & Crystal Hollows and awakened the Golden Elder Blossom Tree.'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-[#7cfce7]/15 py-4 mb-7">
          <div>
            <div className="text-lg font-semibold text-[#7cfce7] tabular-nums">
              {hud.orbsCollected}/{hud.orbsTotal}
            </div>
            <div className="text-xs text-[#9ac7c1]">Lumina</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-[#ffd67a] tabular-nums">
              {hud.blossomsCollected}/{hud.blossomsTotal}
            </div>
            <div className="text-xs text-[#9ac7c1]">Blossoms</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-[#b4f5ff] tabular-nums">
              {hud.crystalsCollected}/{hud.crystalsTotal}
            </div>
            <div className="text-xs text-[#9ac7c1]">Crystals</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-[#e9fbf8] tabular-nums">
              {hud.lanternsLit}/{hud.lanternsTotal} · {formatTime(hud.elapsedSeconds)}
            </div>
            <div className="text-xs text-[#9ac7c1]">Lanterns · Time</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {hud.levelId === 1 ? (
            <button
              type="button"
              onClick={onNextLevel}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md bg-[#ffb86c] px-7 py-3 text-sm font-semibold text-[#1f0d05] transition-colors hover:bg-[#ffc98f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fff0d6]"
            >
              Next Level
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextLevel}
              className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md border border-[#7cfce7]/30 px-6 py-3 text-sm font-medium text-[#dcf7f3] transition-colors hover:bg-[#0e2430] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7]"
            >
              Play Level 1
            </button>
          )}
          <button
            type="button"
            onClick={onRestart}
            className="min-h-[44px] whitespace-nowrap shrink-0 rounded-md bg-[#56e3cc] px-7 py-3 text-sm font-semibold text-[#041b1f] transition-colors hover:bg-[#73f5df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6fffb]"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
