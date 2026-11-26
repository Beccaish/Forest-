import { Component, Suspense, lazy, type ErrorInfo, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GameModals } from './components/GameModals';
import { PortraitPrompt } from './components/PortraitPrompt';
import { SettingsModal } from './components/SettingsModal';
import { type MobileControlHandedness, type MobileControlStyle, TouchControls } from './components/TouchControls';
import { audioEngine } from './game/audio';
import { ForestGameEngine } from './game/engine';
import { getSavedGameSummary } from './game/save';
import { loadShopProgress, type SavedShopProgress, type ShopItemId } from './game/shop';
import type { HudSnapshot } from './game/types';

const LazyShopModal = lazy(() =>
  import('./components/ShopModal').then((mod) => ({ default: mod.ShopModal }))
);

class GameErrorBoundary extends Component<
  { children: ReactNode },
  { errorMessage: string | null }
> {
  state = { errorMessage: null as string | null };

  static getDerivedStateFromError(err: Error) {
    return { errorMessage: err?.message || 'Unexpected rendering error' };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('Whispering Forest runtime error:', err, info);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <main className="flex h-full w-full flex-col items-center justify-center bg-[#050d14] px-6 text-center text-[#eafbf8]">
          <h1 className="font-display text-2xl font-semibold mb-2">Whispering Forest</h1>
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
  highJumpCharges: 0,
  flyingFlowers: 0,
  flyingTimeLeft: 0,
  underwaterActive: false,
  dewdrops: 60,
  equipped: { hat: null, cloak: null, charm: null, power: null },
  savedGame: getSavedGameSummary(),
};

function detectCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return Boolean(window.matchMedia('(pointer: coarse)')?.matches);
}

function detectPortraitViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
}

const MOBILE_CONTROLS_KEY = 'whispering_grove_mobile_controls_v1';
const MOBILE_HANDEDNESS_KEY = 'whispering_grove_mobile_handedness_v1';

function loadMobileControlStyle(): MobileControlStyle {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(MOBILE_CONTROLS_KEY);
      if (saved === 'joystick' || saved === 'arrows') {
        return saved;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return 'arrows';
}

function loadMobileHandedness(): MobileControlHandedness {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(MOBILE_HANDEDNESS_KEY);
      if (saved === 'move-right' || saved === 'move-left') {
        return saved;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return 'move-left';
}

function ForestGameView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ForestGameEngine | null>(null);
  const autoPausedByPortraitRef = useRef(false);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState(() => !audioEngine.isEnabled());
  const [musicVolume, setMusicVolume] = useState(() => audioEngine.getMusicVolume());
  const [sfxVolume, setSfxVolume] = useState(() => audioEngine.getSfxVolume());
  const [shopOpen, setShopOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileControlStyle, setMobileControlStyle] = useState<MobileControlStyle>(loadMobileControlStyle);
  const [mobileHandedness, setMobileHandedness] = useState<MobileControlHandedness>(loadMobileHandedness);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const saveFeedbackTimerRef = useRef<number | null>(null);
  const pausedByShopRef = useRef(false);
  const pausedBySettingsRef = useRef(false);
  const [shopProgress, setShopProgress] = useState<SavedShopProgress>(loadShopProgress);
  const shopOpenRef = useRef(false);
  const settingsOpenRef = useRef(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(detectCoarsePointer);
  const [isPortrait, setIsPortrait] = useState<boolean>(detectPortraitViewport);
  const [portraitDismissed, setPortraitDismissed] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);

  const showPortraitPrompt = isTouchDevice && isPortrait && !portraitDismissed;

  useEffect(() => {
    shopOpenRef.current = shopOpen;
  }, [shopOpen]);

  useEffect(() => {
    settingsOpenRef.current = settingsOpen;
  }, [settingsOpen]);

  useEffect(() => {
    return () => {
      if (saveFeedbackTimerRef.current !== null) {
        window.clearTimeout(saveFeedbackTimerRef.current);
      }
    };
  }, []);

  const handleOpenShop = useCallback(() => {
    if (engineRef.current) {
      if (hud.phase === 'PLAYING') {
        pausedByShopRef.current = true;
        engineRef.current.pauseGame();
      } else {
        pausedByShopRef.current = false;
      }
      setShopProgress(engineRef.current.getShopProgress());
    }
    setShopOpen(true);
  }, [hud.phase]);

  const handleCloseShop = useCallback(() => {
    setShopOpen(false);
    if (pausedByShopRef.current) {
      pausedByShopRef.current = false;
      engineRef.current?.resumeGame();
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    if (engineRef.current) {
      if (hud.phase === 'PLAYING') {
        pausedBySettingsRef.current = true;
        engineRef.current.pauseGame();
      } else {
        pausedBySettingsRef.current = false;
      }
    }
    setSettingsOpen(true);
  }, [hud.phase]);

  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
    if (pausedBySettingsRef.current) {
      pausedBySettingsRef.current = false;
      engineRef.current?.resumeGame();
    }
  }, []);

  const handleChangeMobileControlStyle = useCallback((style: MobileControlStyle) => {
    setMobileControlStyle(style);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(MOBILE_CONTROLS_KEY, style);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleChangeMobileHandedness = useCallback((side: MobileControlHandedness) => {
    setMobileHandedness(side);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(MOBILE_HANDEDNESS_KEY, side);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleSaveGame = useCallback(() => {
    const ok = engineRef.current?.saveGame();
    if (!ok) return;
    setJustSaved(true);
    if (saveFeedbackTimerRef.current !== null) {
      window.clearTimeout(saveFeedbackTimerRef.current);
    }
    saveFeedbackTimerRef.current = window.setTimeout(() => {
      setJustSaved(false);
    }, 2000);
  }, []);

  const handleGoHome = useCallback(() => {
    pausedByShopRef.current = false;
    pausedBySettingsRef.current = false;
    setShopOpen(false);
    setSettingsOpen(false);
    engineRef.current?.goHome();
  }, []);

  const handleTouchLeft = useCallback((held: boolean) => {
    if (engineRef.current) engineRef.current.input.left = held;
  }, []);

  const handleTouchRight = useCallback((held: boolean) => {
    if (engineRef.current) engineRef.current.input.right = held;
  }, []);

  const handleTouchJumpDown = useCallback(() => {
    engineRef.current?.triggerJump();
  }, []);

  const handleTouchJumpUp = useCallback(() => {
    engineRef.current?.releaseJump();
  }, []);

  const handleTouchPulse = useCallback(() => {
    engineRef.current?.triggerPulse();
  }, []);

  const handleTouchFly = useCallback(() => {
    engineRef.current?.activateFlyingFlower();
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

  const handleMusicVolumeChange = useCallback((val: number) => {
    audioEngine.init();
    audioEngine.setMusicVolume(val);
    setMusicVolume(val);
  }, []);

  const handleSfxVolumeChange = useCallback((val: number) => {
    audioEngine.init();
    audioEngine.setSfxVolume(val);
    setSfxVolume(val);
  }, []);

  const handlePreviewSfx = useCallback(() => {
    audioEngine.init();
    audioEngine.playChime(2);
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

    let engine: ForestGameEngine;
    try {
      engine = new ForestGameEngine(canvas, (snapshot) => {
        setHud(snapshot);
      });
      engineRef.current = engine;
      engine.start();
    } catch (err) {
      setEngineError(err instanceof Error ? err.message : 'Unable to start forest canvas');
      return;
    }

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
        if (settingsOpenRef.current) {
          setSettingsOpen(false);
          if (pausedBySettingsRef.current) {
            pausedBySettingsRef.current = false;
            engine.resumeGame();
          }
          return;
        }
        if (shopOpenRef.current) {
          setShopOpen(false);
          if (pausedByShopRef.current) {
            pausedByShopRef.current = false;
            engine.resumeGame();
          }
          return;
        }
        engine.togglePause();
        return;
      }

      if (shopOpenRef.current || settingsOpenRef.current) {
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
      if (e.code === 'KeyF' && !e.repeat) {
        engine.activateFlyingFlower();
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

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };
    const preventMultiTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const preventCtrlWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    const preventDblClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    if (pointerQuery) {
      if (typeof pointerQuery.addEventListener === 'function') {
        pointerQuery.addEventListener('change', handlePointerMediaChange);
      } else if (typeof pointerQuery.addListener === 'function') {
        pointerQuery.addListener(handlePointerMediaChange);
      }
    }
    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    document.addEventListener('touchmove', preventMultiTouchMove, { passive: false });
    window.addEventListener('wheel', preventCtrlWheel, { passive: false });
    document.addEventListener('dblclick', preventDblClick);
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
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchmove', preventMultiTouchMove);
      window.removeEventListener('wheel', preventCtrlWheel);
      document.removeEventListener('dblclick', preventDblClick);
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

  if (engineError) {
    return (
      <main className="flex h-full w-full flex-col items-center justify-center bg-[#050d14] px-6 text-center text-[#eafbf8]">
        <h1 className="font-display text-2xl font-semibold mb-2">Whispering Forest</h1>
        <p className="max-w-md text-sm text-[#b6ddd7] mb-5">{engineError}</p>
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

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#050d14]" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ touchAction: 'none' }}
        onTouchStart={(e) => e.preventDefault()}
      />

      <GameHUD
        hud={hud}
        muted={muted}
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
        isTouchDevice={isTouchDevice}
        justSaved={justSaved}
        onToggleMute={handleToggleMute}
        onMusicVolumeChange={handleMusicVolumeChange}
        onSfxVolumeChange={handleSfxVolumeChange}
        onPreviewSfx={handlePreviewSfx}
        onPause={() => engineRef.current?.pauseGame()}
        onFly={() => engineRef.current?.activateFlyingFlower()}
        onSaveGame={handleSaveGame}
        onOpenShop={handleOpenShop}
        onOpenSettings={handleOpenSettings}
        onGoHome={handleGoHome}
        onMobileNavOpenChange={setMobileNavOpen}
      />

      <GameModals
        hud={hud}
        muted={muted}
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
        isTouchDevice={isTouchDevice}
        justSaved={justSaved}
        onSelectLevel={(lvl) => engineRef.current?.selectLevel(lvl)}
        onStart={() => engineRef.current?.startNewGame()}
        onContinueSaved={() => engineRef.current?.loadSavedGame()}
        onNextLevel={() => engineRef.current?.startNextLevel()}
        onResume={() => engineRef.current?.resumeGame()}
        onSaveGame={handleSaveGame}
        onGoHome={handleGoHome}
        onRestart={() => engineRef.current?.startNewGame()}
        onRespawn={() => engineRef.current?.respawnAtLantern()}
        onToggleMute={handleToggleMute}
        onMusicVolumeChange={handleMusicVolumeChange}
        onSfxVolumeChange={handleSfxVolumeChange}
        onPreviewSfx={handlePreviewSfx}
        onOpenShop={handleOpenShop}
        onOpenSettings={handleOpenSettings}
      />

      {shopOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2b21]/60 text-sm font-semibold text-[#eafbf8]">
              Opening Grove Shop...
            </div>
          }
        >
          <LazyShopModal
            visible={shopOpen}
            progress={shopProgress}
            onBuy={handleBuyItem}
            onToggleEquip={handleToggleEquipItem}
            onClose={handleCloseShop}
          />
        </Suspense>
      )}

      <SettingsModal
        visible={settingsOpen}
        mobileControlStyle={mobileControlStyle}
        mobileHandedness={mobileHandedness}
        muted={muted}
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
        onChangeMobileControlStyle={handleChangeMobileControlStyle}
        onChangeMobileHandedness={handleChangeMobileHandedness}
        onToggleMute={handleToggleMute}
        onMusicVolumeChange={handleMusicVolumeChange}
        onSfxVolumeChange={handleSfxVolumeChange}
        onPreviewSfx={handlePreviewSfx}
        onClose={handleCloseSettings}
      />

      <TouchControls
        visible={
          hud.phase === 'PLAYING' &&
          isTouchDevice &&
          !showPortraitPrompt &&
          !shopOpen &&
          !settingsOpen &&
          !mobileNavOpen
        }
        controlStyle={mobileControlStyle}
        handedness={mobileHandedness}
        flyingFlowers={hud.flyingFlowers}
        onLeftChange={handleTouchLeft}
        onRightChange={handleTouchRight}
        onJumpDown={handleTouchJumpDown}
        onJumpUp={handleTouchJumpUp}
        onPulse={handleTouchPulse}
        onFly={handleTouchFly}
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
