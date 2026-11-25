import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GameModals } from './components/GameModals';
import { PortraitPrompt } from './components/PortraitPrompt';
import { TouchControls } from './components/TouchControls';
import { audioEngine } from './game/audio';
import { ForestGameEngine } from './game/engine';
import type { HudSnapshot } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  phase: 'TITLE_MENU',
  levelId: 1,
  levelName: 'Whispering Woods',
  orbsCollected: 0,
  orbsTotal: 24,
  blossomsCollected: 0,
  blossomsTotal: 6,
  crystalsCollected: 0,
  crystalsTotal: 5,
  lanternsLit: 0,
  lanternsTotal: 8,
  petals: 3,
  maxPetals: 3,
  biomeName: 'Emerald Sunbeam Glade',
  weatherLabel: 'Drifting Leaves',
  elapsedSeconds: 0,
  progressPct: 0,
  crystalBoostActive: false,
};

function detectCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

function detectPortraitViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ForestGameEngine | null>(null);
  const autoPausedByPortraitRef = useRef(false);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(detectCoarsePointer);
  const [isPortrait, setIsPortrait] = useState<boolean>(detectPortraitViewport);
  const [portraitDismissed, setPortraitDismissed] = useState(false);

  const showPortraitPrompt = isTouchDevice && isPortrait && !portraitDismissed;

  const handleToggleMute = useCallback(() => {
    audioEngine.init();
    const nextEnabled = !audioEngine.isEnabled();
    audioEngine.setEnabled(nextEnabled);
    setMuted(!nextEnabled);
  }, []);

  const handleDismissPortrait = useCallback(() => {
    setPortraitDismissed(true);
    if (autoPausedByPortraitRef.current) {
      autoPausedByPortraitRef.current = false;
      engineRef.current?.resumeGame();
    }
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (showPortraitPrompt && hud.phase === 'PLAYING') {
      autoPausedByPortraitRef.current = true;
      engine.pauseGame();
    } else if (!isPortrait && autoPausedByPortraitRef.current) {
      autoPausedByPortraitRef.current = false;
      engine.resumeGame();
    }
  }, [showPortraitPrompt, isPortrait, hud.phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new ForestGameEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;
    engine.start();

    const pointerQuery = window.matchMedia('(pointer: coarse)');
    const handlePointerMediaChange = (ev: MediaQueryListEvent) => {
      setIsTouchDevice(ev.matches);
    };
    const handleFirstTouch = () => {
      setIsTouchDevice(true);
    };

    const syncOrientation = () => {
      const portraitNow = window.innerHeight > window.innerWidth;
      setIsPortrait(portraitNow);
      if (!portraitNow) {
        setPortraitDismissed(false);
      }
      engine.resize();
    };

    const handleBlur = () => engine.clearHeldInputs();
    const handleVisibility = () => {
      if (document.hidden) {
        engine.clearHeldInputs();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Escape' && !e.repeat) {
        engine.togglePause();
        return;
      }

      if (e.code === 'KeyM' && !e.repeat) {
        audioEngine.init();
        const nextEnabled = !audioEngine.isEnabled();
        audioEngine.setEnabled(nextEnabled);
        setMuted(!nextEnabled);
        return;
      }

      if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) {
        setHud((curr) => {
          if (curr.phase === 'TITLE_MENU') {
            engine.startNewGame();
          }
          return curr;
        });
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        engine.input.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        engine.input.right = true;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!e.repeat) engine.triggerJump();
        engine.input.jumpHeld = true;
      }
      if (
        (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') &&
        !e.repeat
      ) {
        engine.triggerPulse();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        engine.input.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        engine.input.right = false;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        engine.releaseJump();
      }
    };

    pointerQuery.addEventListener('change', handlePointerMediaChange);
    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    window.addEventListener('resize', syncOrientation);
    window.addEventListener('orientationchange', syncOrientation);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      pointerQuery.removeEventListener('change', handlePointerMediaChange);
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('resize', syncOrientation);
      window.removeEventListener('orientationchange', syncOrientation);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#050d14]">
      <canvas ref={canvasRef} className="block h-full w-full" />

      <GameHUD
        hud={hud}
        muted={muted}
        isTouchDevice={isTouchDevice}
        onToggleMute={handleToggleMute}
        onPause={() => engineRef.current?.pauseGame()}
      />

      <GameModals
        hud={hud}
        muted={muted}
        isTouchDevice={isTouchDevice}
        onSelectLevel={(lvl) => engineRef.current?.selectLevel(lvl)}
        onStart={() => engineRef.current?.startNewGame()}
        onNextLevel={() => engineRef.current?.startNextLevel()}
        onResume={() => engineRef.current?.resumeGame()}
        onRestart={() => engineRef.current?.startNewGame()}
        onRespawn={() => engineRef.current?.respawnAtLantern()}
        onToggleMute={handleToggleMute}
      />

      <TouchControls
        visible={hud.phase === 'PLAYING' && isTouchDevice && !showPortraitPrompt}
        onLeftChange={(held) => {
          if (engineRef.current) engineRef.current.input.left = held;
        }}
        onRightChange={(held) => {
          if (engineRef.current) engineRef.current.input.right = held;
        }}
        onJumpDown={() => engineRef.current?.triggerJump()}
        onJumpUp={() => engineRef.current?.releaseJump()}
        onPulse={() => engineRef.current?.triggerPulse()}
      />

      <PortraitPrompt
        visible={showPortraitPrompt}
        onContinueAnyway={handleDismissPortrait}
      />
    </main>
  );
}
