import React from 'react';

interface TouchControlsProps {
  visible: boolean;
  onLeftChange: (held: boolean) => void;
  onRightChange: (held: boolean) => void;
  onJumpDown: () => void;
  onJumpUp: () => void;
  onPulse: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  visible,
  onLeftChange,
  onRightChange,
  onJumpDown,
  onJumpUp,
  onPulse,
}) => {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-5 z-15 flex justify-between sm:hidden">
      <div className="pointer-events-auto flex gap-3">
        <button
          type="button"
          aria-label="Move Left"
          onTouchStart={(e) => {
            e.preventDefault();
            onLeftChange(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onLeftChange(false);
          }}
          onTouchCancel={() => onLeftChange(false)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#8cf8e8]/35 bg-[#07161e]/80 text-lg text-[#e4fbf7] active:bg-[#4cdbc5]/35"
        >
          ◀
        </button>
        <button
          type="button"
          aria-label="Move Right"
          onTouchStart={(e) => {
            e.preventDefault();
            onRightChange(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onRightChange(false);
          }}
          onTouchCancel={() => onRightChange(false)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#8cf8e8]/35 bg-[#07161e]/80 text-lg text-[#e4fbf7] active:bg-[#4cdbc5]/35"
        >
          ▶
        </button>
      </div>

      <div className="pointer-events-auto flex gap-3">
        <button
          type="button"
          aria-label="Spirit Pulse"
          onTouchStart={(e) => {
            e.preventDefault();
            onPulse();
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#8cf8e8]/35 bg-[#07161e]/80 text-base text-[#ffe194] active:bg-[#4cdbc5]/35"
        >
          ✦
        </button>
        <button
          type="button"
          aria-label="Jump or Glide"
          onTouchStart={(e) => {
            e.preventDefault();
            onJumpDown();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onJumpUp();
          }}
          onTouchCancel={onJumpUp}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#8cf8e8]/35 bg-[#07161e]/80 text-lg text-[#e4fbf7] active:bg-[#4cdbc5]/35"
        >
          ▲
        </button>
      </div>
    </div>
  );
};
