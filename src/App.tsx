import { Component, type ErrorInfo, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GameModals } from './components/GameModals';
import { PortraitPrompt } from './components/PortraitPrompt';
import { ShopModal } from './components/ShopModal';
import { TouchControls } from './components/TouchControls';
import { audioEngine } from './game/audio';
import { ForestGameEngine } from './game/engine';
import { loadShopProgress, type SavedShopProgress, type ShopItemId } from './game/shop';
import type { HudSnapshot } from './game/types';

class GameErrorBoundary extends Component<
  { children: ReactNode },
  { errorMessage: string | null }
> {
  state = { errorMessage: null as string | null };

  static getDerivedStateFromError(err: Error) {
    return { errorMessage: err?.message || 'Unexpected rendering error' };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('Whispering Grove runtime error:', err, info);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <main className="flex h-dvh w-screen flex-col items-center justify-center bg-[#050d14] px-6 text-center text-[#eafbf8]">
          <h1 className="font-display text-2xl font-semibold mb-2">Whispering Grove</h1>
          <p className="max-w-md text-sm text-[#b6ddd7] mb-5">{this.state.errorMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] rounded-md bg-[#56e3cc] px-6 py-2.5 text-sm font-semibold text-[#041b1f]"
          >
            Reload Game
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

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
  starseedsCollected: 0,
  starseedsTotal: 3,
  lanternsLit: 0,
  lanternsTotal: 8,
  petals: 3,
  maxPetals: 3,
  biomeName: 'Emerald Sunbeam Glade',
  weatherLabel: 'Drifting Leaves',
  elapsedSeconds: 0,
  progressPct: 0,
  crystalBoostActive: false,
  tripleJumpActive: false,
  dewdrops: 60,
  equipped: { hat: null, cloak: null, charm: null },
};

function detectCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

function detectPortraitViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
}

function ForestGameView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ForestGameEngine | null>(null);
  const autoPausedByPortraitRef = useRef(false);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopProgress, setShopProgress] = useState<SavedShopProgress>(loadShopProgress);
  const shopOpenRef = useRef(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(detectCoarsePointer);
  const [isPortrait, setIsPortrait] = useState<boolean>(detectPortraitViewport);
  const [portraitDismissed, setPortraitDismissed] = useState(false);

  const showPortraitPrompt = isTouchDevice && isPortrait && !portraitDismissed;

  useEffect(() => {
    shopOpenRef.current = shopOpen;
  }, [shopOpen]);

  const handleOpenShop = useCallback(() => {
    if (engineRef.current) {
      setShopProgress(engineRef.current.getShopProgress());
    }
    setShopOpen(true);
  }, []);

  const handleCloseShop = useCallback(() => {
    setShopOpen(false);
  }, []);

  const handleBuyItem = useCallback((itemId: ShopItemId) => {
    if (!engineRef.current) return;
    setShopProgress(engineRef.current.buyShopItem(itemId));
  }, []);

  const handleToggleEquipItem = useCallback((itemId: ShopItemId) => {
    if (!engineRef.current) return;
    setShopProgress(engineRef.current.toggleEquipShopItem(itemId));
  }, []);

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

    const pointerQuery =
      typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)') : null;
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
        if (shopOpenRef.current) {
          setShopOpen(false);
          return;
        }
        engine.togglePause();
        return;
      }

      if (shopOpenRef.current) {
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

    if (pointerQuery) {
      if (typeof pointerQuery.addEventListener === 'function') {
        pointerQuery.addEventListener('change', handlePointerMediaChange);
      } else if (typeof pointerQuery.addListener === 'function') {
        pointerQuery.addListener(handlePointerMediaChange);
      }
    }
    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    window.addEventListener('resize', syncOrientation);
    window.addEventListener('orientationchange', syncOrientation);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (pointerQuery) {
        if (typeof pointerQuery.removeEventListener === 'function') {
          pointerQuery.removeEventListener('change', handlePointerMediaChange);
        } else if (typeof pointerQuery.removeListener === 'function') {
          pointerQuery.removeListener(handlePointerMediaChange);
        }
      }
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
    <main className="relative h-dvh w-screen overflow-hidden bg-[#050d14]">
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
        onOpenShop={handleOpenShop}
      />

      <ShopModal
        visible={shopOpen}
        progress={shopProgress}
        onBuy={handleBuyItem}
        onToggleEquip={handleToggleEquipItem}
        onClose={handleCloseShop}
      />

      <TouchControls
        visible={hud.phase === 'PLAYING' && isTouchDevice && !showPortraitPrompt && !shopOpen}
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

export default function App() {
  return (
    <GameErrorBoundary>
      <ForestGameView />
    </GameErrorBoundary>
  );
}
