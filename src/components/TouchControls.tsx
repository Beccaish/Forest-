import React, { useRef, useState } from 'react';

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
  const padRef = useRef<HTMLDivElement | null>(null);
  const movePointerId = useRef<number | null>(null);
  const jumpPointerId = useRef<number | null>(null);

  const [activeDir, setActiveDir] = useState<'left' | 'right' | null>(null);
  const [jumpActive, setJumpActive] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);

  if (!visible) return null;

  const updateDirFromClientX = (clientX: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mid = rect.left + rect.width * 0.5;
    if (clientX < mid) {
      setActiveDir('left');
      onLeftChange(true);
      onRightChange(false);
    } else {
      setActiveDir('right');
      onLeftChange(false);
      onRightChange(true);
    }
  };

  const clearDir = () => {
    movePointerId.current = null;
    setActiveDir(null);
    onLeftChange(false);
    onRightChange(false);
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-15 flex items-end justify-between px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ touchAction: 'none' }}
    >
      {/* Left Thumb: Slide-friendly Left / Right Directional Rocker */}
      <div
        ref={padRef}
        role="group"
        aria-label="Movement Controls"
        onPointerDown={(e) => {
          e.preventDefault();
          movePointerId.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateDirFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (movePointerId.current !== e.pointerId) return;
          e.preventDefault();
          updateDirFromClientX(e.clientX);
        }}
        onPointerUp={(e) => {
          if (movePointerId.current !== e.pointerId) return;
          e.preventDefault();
          clearDir();
        }}
        onPointerCancel={(e) => {
          if (movePointerId.current !== e.pointerId) return;
          clearDir();
        }}
        className="pointer-events-auto grid h-14 w-36 grid-cols-2 overflow-hidden rounded-full border border-[#8cf8e8]/35 bg-[#06141c]/78 shadow-lg"
        style={{ touchAction: 'none' }}
      >
        <div
          className={`flex items-center justify-center border-r border-[#8cf8e8]/20 text-lg transition-colors ${
            activeDir === 'left'
              ? 'bg-[#56e3cc]/40 text-white'
              : 'text-[#dcf7f3]'
          }`}
          aria-label="Move Left"
        >
          ◀
        </div>
        <div
          className={`flex items-center justify-center text-lg transition-colors ${
            activeDir === 'right'
              ? 'bg-[#56e3cc]/40 text-white'
              : 'text-[#dcf7f3]'
          }`}
          aria-label="Move Right"
        >
          ▶
        </div>
      </div>

      {/* Right Thumb: Pulse + Jump/Glide */}
      <div className="pointer-events-auto flex items-end gap-3" style={{ touchAction: 'none' }}>
        <button
          type="button"
          aria-label="Spirit Pulse"
          onPointerDown={(e) => {
            e.preventDefault();
            setPulseActive(true);
            onPulse();
          }}
          onPointerUp={() => setPulseActive(false)}
          onPointerCancel={() => setPulseActive(false)}
          className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border border-[#ffe194]/45 text-[#ffe194] shadow-lg transition-transform ${
            pulseActive
              ? 'scale-95 bg-[#ffe194]/30'
              : 'bg-[#06141c]/78'
          }`}
          style={{ touchAction: 'none' }}
        >
          <span className="text-base leading-none">✦</span>
          <span className="mt-0.5 text-[10px] font-medium tracking-wide text-[#f7e7ba]">
            Pulse
          </span>
        </button>

        <button
          type="button"
          aria-label="Jump or Hold to Glide"
          onPointerDown={(e) => {
            e.preventDefault();
            jumpPointerId.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            setJumpActive(true);
            onJumpDown();
          }}
          onPointerUp={(e) => {
            if (jumpPointerId.current !== e.pointerId) return;
            e.preventDefault();
            jumpPointerId.current = null;
            setJumpActive(false);
            onJumpUp();
          }}
          onPointerCancel={(e) => {
            if (jumpPointerId.current !== e.pointerId) return;
            jumpPointerId.current = null;
            setJumpActive(false);
            onJumpUp();
          }}
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border border-[#8cf8e8]/45 text-[#e8fcf9] shadow-lg transition-transform ${
            jumpActive
              ? 'scale-95 bg-[#56e3cc]/40'
              : 'bg-[#06141c]/80'
          }`}
          style={{ touchAction: 'none' }}
        >
          <span className="text-lg leading-none">▲</span>
          <span className="mt-0.5 text-[10px] font-medium tracking-wide text-[#c8efe9]">
            Jump
          </span>
        </button>
      </div>
    </div>
  );
};
