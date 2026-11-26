import React, { useEffect, useRef, useState } from 'react';

export type MobileControlStyle = 'arrows' | 'joystick';

interface TouchControlsProps {
  visible: boolean;
  controlStyle: MobileControlStyle;
  flyingFlowers: number;
  onLeftChange: (held: boolean) => void;
  onRightChange: (held: boolean) => void;
  onJumpDown: () => void;
  onJumpUp: () => void;
  onPulse: () => void;
  onFly: () => void;
}

const JOYSTICK_MAX_RADIUS = 36;
const JOYSTICK_DEADZONE = 9;

export const TouchControls: React.FC<TouchControlsProps> = ({
  visible,
  controlStyle,
  flyingFlowers,
  onLeftChange,
  onRightChange,
  onJumpDown,
  onJumpUp,
  onPulse,
  onFly,
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef<HTMLDivElement | null>(null);
  const movePointerId = useRef<number | null>(null);
  const jumpPointerId = useRef<number | null>(null);

  const [activeDir, setActiveDir] = useState<'left' | 'right' | null>(null);
  const [stickOffset, setStickOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [jumpActive, setJumpActive] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [flyActive, setFlyActive] = useState(false);

  useEffect(() => {
    if (!visible) {
      movePointerId.current = null;
      jumpPointerId.current = null;
      setActiveDir(null);
      setStickOffset({ x: 0, y: 0 });
      setJumpActive(false);
      onLeftChange(false);
      onRightChange(false);
    }
  }, [visible, controlStyle, onLeftChange, onRightChange]);

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

  const updateStickFromPointer = (clientX: number, clientY: number) => {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_MAX_RADIUS) {
      const scale = JOYSTICK_MAX_RADIUS / dist;
      dx *= scale;
      dy *= scale;
    }
    setStickOffset({ x: dx, y: dy });

    if (dx < -JOYSTICK_DEADZONE) {
      setActiveDir('left');
      onLeftChange(true);
      onRightChange(false);
    } else if (dx > JOYSTICK_DEADZONE) {
      setActiveDir('right');
      onLeftChange(false);
      onRightChange(true);
    } else {
      setActiveDir(null);
      onLeftChange(false);
      onRightChange(false);
    }
  };

  const clearMove = () => {
    movePointerId.current = null;
    setActiveDir(null);
    setStickOffset({ x: 0, y: 0 });
    onLeftChange(false);
    onRightChange(false);
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-15 flex items-end justify-between px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ touchAction: 'none' }}
      onTouchStart={(e) => e.preventDefault()}
      onTouchEnd={(e) => e.preventDefault()}
      onDoubleClick={(e) => e.preventDefault()}
    >
      {/* Left Thumb: Either Classic Arrows Rocker (Default) OR Minecraft-style Round Thumbstick */}
      {controlStyle === 'joystick' ? (
        <div
          ref={stickRef}
          role="slider"
          aria-label="Movement Thumbstick"
          aria-valuetext={activeDir ?? 'center'}
          onPointerDown={(e) => {
            e.preventDefault();
            movePointerId.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateStickFromPointer(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (movePointerId.current !== e.pointerId) return;
            e.preventDefault();
            updateStickFromPointer(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            if (movePointerId.current !== e.pointerId) return;
            e.preventDefault();
            clearMove();
          }}
          onPointerCancel={(e) => {
            if (movePointerId.current !== e.pointerId) return;
            clearMove();
          }}
          className="pointer-events-auto relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#8cf8e8]/38 bg-[#061620]/58 shadow-lg backdrop-blur-sm"
          style={{ touchAction: 'none' }}
        >
          {/* Subtle directional guide ticks */}
          <span
            aria-hidden="true"
            className={`absolute left-2.5 text-[11px] font-bold transition-colors ${
              activeDir === 'left' ? 'text-[#7cfce7]' : 'text-[#8cf8e8]/45'
            }`}
          >
            ◀
          </span>
          <span
            aria-hidden="true"
            className={`absolute right-2.5 text-[11px] font-bold transition-colors ${
              activeDir === 'right' ? 'text-[#7cfce7]' : 'text-[#8cf8e8]/45'
            }`}
          >
            ▶
          </span>
          <span
            aria-hidden="true"
            className="absolute top-2 text-[10px] text-[#8cf8e8]/30"
          >
            ▲
          </span>
          <span
            aria-hidden="true"
            className="absolute bottom-2 text-[10px] text-[#8cf8e8]/30"
          >
            ▼
          </span>

          {/* Inner Draggable Round Thumb Knob */}
          <div
            style={{
              transform: `translate3d(${stickOffset.x}px, ${stickOffset.y}px, 0)`,
            }}
            className={`h-12 w-12 rounded-full border-2 shadow-md transition-colors ${
              activeDir
                ? 'border-[#e6fffb] bg-[#56e3cc]/75'
                : 'border-[#8cf8e8]/65 bg-[#123747]/85'
            }`}
          />
        </div>
      ) : (
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
            clearMove();
          }}
          onPointerCancel={(e) => {
            if (movePointerId.current !== e.pointerId) return;
            clearMove();
          }}
          className="pointer-events-auto grid h-14 w-36 grid-cols-2 overflow-hidden rounded-full border border-[#8cf8e8]/35 bg-[#06141c]/78 shadow-lg"
          style={{ touchAction: 'none' }}
        >
          <div
            className={`flex items-center justify-center border-r border-[#8cf8e8]/20 text-lg transition-colors ${
              activeDir === 'left' ? 'bg-[#56e3cc]/40 text-white' : 'text-[#dcf7f3]'
            }`}
            aria-label="Move Left"
          >
            ◀
          </div>
          <div
            className={`flex items-center justify-center text-lg transition-colors ${
              activeDir === 'right' ? 'bg-[#56e3cc]/40 text-white' : 'text-[#dcf7f3]'
            }`}
            aria-label="Move Right"
          >
            ▶
          </div>
        </div>
      )}

      {/* Right Thumb: Fly (when collected) + Pulse + Jump/Glide */}
      <div className="pointer-events-auto flex items-end gap-3" style={{ touchAction: 'none' }}>
        {flyingFlowers > 0 && (
          <button
            type="button"
            aria-label="Activate Flying Flower"
            onPointerDown={(e) => {
              e.preventDefault();
              setFlyActive(true);
              onFly();
            }}
            onPointerUp={() => setFlyActive(false)}
            onPointerCancel={() => setFlyActive(false)}
            onTouchStart={(e) => e.preventDefault()}
            onTouchEnd={(e) => e.preventDefault()}
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border border-[#ff9ce3]/60 text-[#ffd6f4] shadow-lg transition-transform ${
              flyActive ? 'scale-95 bg-[#ff9ce3]/30' : 'bg-[#2a0b28]/82'
            }`}
            style={{ touchAction: 'none' }}
          >
            <span className="text-sm leading-none">✿</span>
            <span className="mt-0.5 text-[10px] font-medium tracking-wide text-[#ffd6f4] tabular-nums">
              Fly×{flyingFlowers}
            </span>
          </button>
        )}

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
          onTouchStart={(e) => e.preventDefault()}
          onTouchEnd={(e) => e.preventDefault()}
          className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border border-[#ffe194]/45 text-[#ffe194] shadow-lg transition-transform ${
            pulseActive ? 'scale-95 bg-[#ffe194]/30' : 'bg-[#06141c]/78'
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
          onTouchStart={(e) => e.preventDefault()}
          onTouchEnd={(e) => e.preventDefault()}
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border border-[#8cf8e8]/45 text-[#e8fcf9] shadow-lg transition-transform ${
            jumpActive ? 'scale-95 bg-[#56e3cc]/40' : 'bg-[#06141c]/80'
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
