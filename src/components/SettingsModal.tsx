import React from 'react';
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
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#040b12]/88 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5 overflow-y-auto backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grove-settings-title"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md max-h-full overflow-y-auto rounded-2xl border border-[#7cfce7]/28 bg-[#071822]/96 p-4 sm:p-6 text-[#eafbf8] shadow-2xl my-auto">
        <div className="flex items-center justify-between gap-3 border-b border-[#7cfce7]/18 pb-3">
          <h2 id="grove-settings-title" className="font-display text-xl font-semibold text-[#f0fffc]">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-md border border-[#8cf8e8]/30 bg-[#0d2734] px-4 py-1.5 text-xs font-semibold text-[#e6fffb] transition-colors hover:bg-[#143a4c] focus-visible:outline-2 focus-visible:outline-[#7cfce7]"
          >
            Done
          </button>
        </div>

        {/* Mobile Controls Style */}
        <div className="mt-4">
          <div className="text-sm font-semibold text-[#dffaf5]">Mobile Controls</div>
          <p className="mt-0.5 text-xs text-[#a5d3cc]">
            Choose how movement controls look and feel on touch screens.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChangeMobileControlStyle('arrows')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                mobileControlStyle === 'arrows'
                  ? 'border-[#56e3cc] bg-[#103642] text-[#f0fffc]'
                  : 'border-[#8cf8e8]/20 bg-[#081d29] text-[#bfe5df] hover:border-[#8cf8e8]/45'
              }`}
            >
              <div className="flex h-10 w-24 items-center justify-center rounded-full border border-[#8cf8e8]/45 bg-[#06141c] text-sm font-bold text-[#7cfce7]">
                ◀ &nbsp;|&nbsp; ▶
              </div>
              <div>
                <div className="text-xs font-semibold">Arrows (Default)</div>
                <div className="mt-0.5 text-[11px] text-[#9ecbc4]">Left / right bar</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onChangeMobileControlStyle('joystick')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                mobileControlStyle === 'joystick'
                  ? 'border-[#56e3cc] bg-[#103642] text-[#f0fffc]'
                  : 'border-[#8cf8e8]/20 bg-[#081d29] text-[#bfe5df] hover:border-[#8cf8e8]/45'
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#8cf8e8]/45 bg-[#06141c]">
                <div className="h-5 w-5 rounded-full border border-[#7cfce7] bg-[#56e3cc]/65" />
              </div>
              <div>
                <div className="text-xs font-semibold">Round Stick</div>
                <div className="mt-0.5 text-[11px] text-[#9ecbc4]">Draggable thumbstick</div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Controls Side Selector */}
        <div className="mt-4 border-t border-[#7cfce7]/18 pt-4">
          <div className="text-sm font-semibold text-[#dffaf5]">Controls Side</div>
          <p className="mt-0.5 text-xs text-[#a5d3cc]">
            Swap which side of the screen Move and Jump sit on.
          </p>

          <div className="mt-2.5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChangeMobileHandedness('move-left')}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                mobileHandedness === 'move-left'
                  ? 'border-[#56e3cc] bg-[#103642] text-[#f0fffc]'
                  : 'border-[#8cf8e8]/20 bg-[#081d29] text-[#bfe5df] hover:border-[#8cf8e8]/45'
              }`}
            >
              <div className="flex w-full items-center justify-between px-2 text-xs font-semibold text-[#7cfce7]">
                <span>Move</span>
                <span className="text-[#9ecbc4]">·</span>
                <span>Jump ▲</span>
              </div>
              <div className="text-[11px] text-[#9ecbc4]">Move Left · Jump Right</div>
            </button>

            <button
              type="button"
              onClick={() => onChangeMobileHandedness('move-right')}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-[#7cfce7] ${
                mobileHandedness === 'move-right'
                  ? 'border-[#56e3cc] bg-[#103642] text-[#f0fffc]'
                  : 'border-[#8cf8e8]/20 bg-[#081d29] text-[#bfe5df] hover:border-[#8cf8e8]/45'
              }`}
            >
              <div className="flex w-full items-center justify-between px-2 text-xs font-semibold text-[#7cfce7]">
                <span>▲ Jump</span>
                <span className="text-[#9ecbc4]">·</span>
                <span>Move</span>
              </div>
              <div className="text-[11px] text-[#9ecbc4]">Jump Left · Move Right</div>
            </button>
          </div>
        </div>

        {/* Audio Quick Controls */}
        <div className="mt-5 border-t border-[#7cfce7]/18 pt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[#dffaf5]">Sound</span>
            <button
              type="button"
              onClick={onToggleMute}
              className={`min-h-[36px] rounded-md px-3.5 py-1 text-xs font-semibold transition-colors ${
                muted
                  ? 'bg-[#56e3cc] text-[#041b1f] hover:bg-[#73f5df]'
                  : 'border border-[#8cf8e8]/30 bg-[#0d2734] text-[#e6fffb] hover:bg-[#14394c]'
              }`}
            >
              {muted ? 'Play Sound' : 'Mute Sound'}
            </button>
          </div>

          <label className="block">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#cbeae5]">Music Volume</span>
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
              <span className="text-[#cbeae5]">Effects Volume</span>
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
    </div>
  );
};
