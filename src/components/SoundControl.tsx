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

  return (
    <div ref={rootRef} className="relative pointer-events-auto shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Open sound controls"
        className={`min-h-[40px] flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7cfce7] ${
          open
            ? 'border-[#56e3cc] bg-[#0e2d3b]/90 text-[#b4fff1]'
            : muted
              ? 'border-[#ff9bb8]/40 bg-[#210d1a]/80 text-[#ffd2e0] hover:border-[#ff9bb8]/75'
              : 'border-[#8cf8e8]/25 bg-[#06131a]/75 text-[#dcf7f3] hover:border-[#8cf8e8]/55 hover:bg-[#0c2330]/90'
        }`}
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" aria-hidden="true" /> : <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />}
        <span>{muted ? 'Muted' : 'Sound'}</span>
      </button>

      {open && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute top-full mt-2 z-40 w-60 rounded-xl border border-[#8cf8e8]/28 bg-[#071923]/88 p-3.5 text-[#eafbf8] shadow-2xl backdrop-blur-md ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="region"
          aria-label="Sound volume controls"
        >
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#8cf8e8]/15">
            <span className="text-xs font-semibold text-[#cdeee8]">
              {muted ? 'Audio Muted' : 'Audio Playing'}
            </span>
            <button
              type="button"
              onClick={onToggleMute}
              className={`min-h-[34px] flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                muted
                  ? 'bg-[#56e3cc] text-[#041b1f] hover:bg-[#73f5df]'
                  : 'border border-[#8cf8e8]/30 bg-[#0d2734] text-[#e6fffb] hover:bg-[#14394c]'
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
