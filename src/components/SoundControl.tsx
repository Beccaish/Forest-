import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundControlProps {
  muted: boolean;
  musicVolume: number;
  sfxVolume: number;
  onToggleMute: () => void;
  onMusicVolumeChange: (val: number) => void;
  onSfxVolumeChange: (val: number) => void;
  onPreviewSfx?: () => void;
  align?: 'right' | 'left';
  variant?: 'default' | 'woodland';
  ornate?: boolean;
}

export const SoundControl: React.FC<SoundControlProps> = ({
  muted,
  musicVolume,
  sfxVolume,
  onToggleMute,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onPreviewSfx,
  align = 'right',
  variant = 'default',
  ornate = false,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const buttonClasses =
    variant === 'woodland'
      ? open
        ? 'border-[#e6c888] bg-gradient-to-b from-[#664933] to-[#422c1d] text-[#fff8e6] shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(28,18,10,0.72),inset_0_0_0_3px_rgba(232,202,140,0.34)]'
        : muted
          ? 'border-[#e29aa8]/80 bg-gradient-to-b from-[#542c33] to-[#32171c] text-[#ffe1e8] shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,10,12,0.7)] hover:brightness-110'
          : 'border-[#c9a66b]/90 bg-gradient-to-b from-[#5b412c] to-[#342316] text-[#f7eed7] shadow-[0_4px_12px_rgba(0,0,0,0.55),inset_0_0_0_2px_rgba(24,14,7,0.72),inset_0_0_0_3px_rgba(225,192,130,0.28)] hover:brightness-110'
      : open
        ? 'border-[#56e3cc] bg-[#0e2d3b]/90 text-[#b4fff1]'
        : muted
          ? 'border-[#ff9bb8]/40 bg-[#210d1a]/80 text-[#ffd2e0] hover:border-[#ff9bb8]/75'
          : 'border-[#8cf8e8]/25 bg-[#06131a]/75 text-[#dcf7f3] hover:border-[#8cf8e8]/55 hover:bg-[#0c2330]/90';

  const popoverFrameClasses =
    variant === 'woodland'
      ? 'border-[2px] border-[#c4a16a] bg-[#0b1f1c]/95 shadow-[0_14px_32px_rgba(0,0,0,0.68),inset_0_0_0_2px_rgba(24,14,7,0.85),inset_0_0_0_3px_rgba(225,192,130,0.28)]'
      : 'border border-[#8cf8e8]/28 bg-[#071923]/88 shadow-2xl';

  return (
    <div ref={rootRef} className="relative pointer-events-auto shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Open sound controls"
        className={`relative min-h-[38px] flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-3 sm:px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5de9d] ${buttonClasses}`}
      >
        {ornate && (
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
        )}
        {muted ? <VolumeX className="h-3.5 w-3.5 text-[#f5b7c5]" aria-hidden="true" /> : <Volume2 className="h-3.5 w-3.5 text-[#ebd094]" aria-hidden="true" />}
        <span>{muted ? 'Muted' : 'Sound'}</span>
      </button>

      {open && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute top-full mt-2 z-40 w-60 rounded-xl p-3.5 text-[#eafbf8] backdrop-blur-md ${popoverFrameClasses} ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="region"
          aria-label="Sound volume controls"
        >
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#c9a66b]/25">
            <span className="text-xs font-semibold text-[#f3e6c8]">
              {muted ? 'Audio Muted' : 'Audio Playing'}
            </span>
            <button
              type="button"
              onClick={onToggleMute}
              className={`min-h-[34px] flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                muted
                  ? 'border border-[#8de2c7] bg-gradient-to-b from-[#237a66] to-[#134c3f] text-white'
                  : 'border border-[#c4a16a]/85 bg-gradient-to-b from-[#553d2b] to-[#342317] text-[#f5ead4] hover:brightness-110'
              }`}
            >
              {muted ? (
                <>
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Play</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Mute</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <label className="block">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#cbeae5]">Music</span>
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
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-[#cbeae5]">Effects</span>
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
                onPointerUp={() => onPreviewSfx?.()}
                onKeyUp={() => onPreviewSfx?.()}
                className="w-full h-2 cursor-pointer accent-[#7cfce7]"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
