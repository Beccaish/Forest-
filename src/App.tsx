import { Component, Suspense, lazy, type ErrorInfo, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GameModals } from './components/GameModals';
import type { Level5ViewportHandle } from './components/Level5Viewport';
import { PortraitPrompt } from './components/PortraitPrompt';
import { SettingsModal } from './components/SettingsModal';
import { type MobileControlHandedness, type MobileControlStyle, TouchControls } from './components/TouchControls';
import { audioEngine } from './game/audio';
import { ForestGameEngine } from './game/engine';
import { getSavedGameSummary } from './game/save';
import { loadShopProgress, type SavedShopProgress, type ShopItemId } from './game/shop';
import type { GamePhase, HudSnapshot } from './game/types';

const LazyShopModal = lazy(() =>
  import('./components/ShopModal').then((mod) => ({ default: mod.ShopModal }))
);
const LazyLevel5Viewport = lazy(() =>
  import('./components/Level5Viewport').then((mod) => ({ default: mod.Level5Viewport }))
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
  animalsHelped: 0,
  animalsTotal: 8,
  trashCollected: 0,
  trashTotal: 15,
  wardShieldLeft: 0,
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
  const level5Ref = useRef<Level5ViewportHandle | null>(null);
  const pendingLevel5SaveRef = useRef(false);
  const autoPausedByPortraitRef = useRef(false);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const hudRef = useRef<HudSnapshot>(INITIAL_HUD);
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
  const [canvasCursorPointer, setCanvasCursorPointer] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);

  const showPortraitPrompt = isTouchDevice && isPortrait && !portraitDismissed;
  const isLevel5Active = hud.levelId === 5 && hud.phase !== 'TITLE_MENU';

  useEffect(() => {
    hudRef.current = hud;
  }, [hud]);

  useEffect(() => {
    shopOpenRef.current = shopOpen;
  }, [shopOpen]);

  useEffect(() => {
    settingsOpenRef.current = settingsOpen;
  }, [settingsOpen]);

  useEffect(() => {
    engineRef.current?.setIsTouchDevice(isTouchDevice);
  }, [isTouchDevice]);

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
    const ok =
      hudRef.current.levelId === 5 && hudRef.current.phase !== 'TITLE_MENU'
        ? Boolean(level5Ref.current?.saveGame())
        : Boolean(engineRef.current?.saveGame());
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
    pendingLevel5SaveRef.current = false;
    setShopOpen(false);
    setSettingsOpen(false);
    level5Ref.current?.clearHeldInputs();
    engineRef.current?.goHome();
  }, []);

  const handleContinueSaved = useCallback(() => {
    const summary = getSavedGameSummary();
    if (summary?.levelId === 5) {
      pendingLevel5SaveRef.current = true;
      engineRef.current?.startNewGame(5);
      return;
    }
    pendingLevel5SaveRef.current = false;
    engineRef.current?.loadSavedGame();
  }, []);

  const handleRestartLevel = useCallback(() => {
    if (hudRef.current.levelId === 5 && hudRef.current.phase !== 'TITLE_MENU') {
      level5Ref.current?.restartLevel();
      engineRef.current?.setPhaseExternal('PLAYING');
      return;
    }
    engineRef.current?.startNewGame();
  }, []);

  const handleRespawnAtLantern = useCallback(() => {
    if (hudRef.current.levelId === 5 && hudRef.current.phase !== 'TITLE_MENU') {
      level5Ref.current?.respawnAtLantern();
      engineRef.current?.setPhaseExternal('PLAYING');
      return;
    }
    engineRef.current?.respawnAtLantern();
  }, []);

  const handleLevel5Mount = useCallback((instance: Level5ViewportHandle | null) => {
    level5Ref.current = instance;
    if (instance && pendingLevel5SaveRef.current) {
      pendingLevel5SaveRef.current = false;
      instance.loadFromSaved();
    }
  }, []);

  const handleLevel5HudUpdate = useCallback((snapshot: HudSnapshot) => {
    hudRef.current = snapshot;
    setHud(snapshot);
  }, []);

  const handleLevel5EarnDewdrops = useCallback((baseAmount: number) => {
    if (!engineRef.current) return;
    const next = engineRef.current.grantDewdrops(baseAmount);
    setShopProgress(next);
    setHud((curr) => (curr.levelId === 5 ? { ...curr, dewdrops: next.dewdrops } : curr));
  }, []);

  const handleLevel5PhaseChange = useCallback((nextPhase: GamePhase) => {
    engineRef.current?.setPhaseExternal(nextPhase);
    setHud((curr) => ({ ...curr, phase: nextPhase }));
  }, []);

  const handleTouchLeft = useCallback((held: boolean) => {
    if (hudRef.current.levelId === 5 && hudRef.current.phase !== 'TITLE_MENU') {
      if (level5Ref.current) level5Ref.current.input.left = held;
      return;
    }
    if (engineRef.current) engineRef.current.input.left = held;
  }, []);

  const handleTouchRight = useCallback((held: boolean) => {
    if (hudRef.current.levelId === 5 && hudRef.current.phase !== 'TITLE_MENU') {
      if (level5Ref.current) level5Ref.current.input.right = held;
      return;
    }
    if (engineRef.current) engineRef.current.input.right = held;
  }, []);

  const handleTouchForward = useCallback((held: boolean) => {
    if (level5Ref.current) level5Ref.current.input.forward = held;
  }, []);

  const handleTouchBackward = useCallback((held: boolean) => {
    if (level5Ref.current) level5Ref.current.input.backward = held;
  }, []);

  const handleTouchJumpDown = useCallback(() => {
    if (hudRef.current.levelId === 5 && hudRef.current.phase !== 'TITLE_MENU') {
      level5Ref.current?.triggerJump();
      return;
    }
    engineRef.current?.triggerJump();
  }, []);

  const handleTouchJumpUp = useCallback(() => {
    if (hudRef.current.levelId === 5 && hudRef.current.phase !== 'TITLE_MENU') {
      level5Ref.current?.releaseJump();
      return;
    }
    engineRef.current?.releaseJump();
  }, []);

  const handleTouchPulse = useCallback(() => {
    if (hudRef.current.levelId === 5 && hudRef.current.phase !== 'TITLE_MENU') {
      level5Ref.current?.triggerPulse();
      return;
    }
    engineRef.current?.triggerPulse();
  }, []);

  const handleTouchFly = useCallback(() => {
    if (hudRef.current.levelId === 5 && hudRef.current.phase !== 'TITLE_MENU') {
      level5Ref.current?.activateFlyingFlower();
      return;
    }
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
    audioEngine.unlock();
    const nextEnabled = !audioEngine.isEnabled();
    audioEngine.setEnabled(nextEnabled);
    setMuted(!nextEnabled);
  }, []);

  const handleMusicVolumeChange = useCallback((val: number) => {
    audioEngine.unlock();
    audioEngine.setMusicVolume(val);
    setMusicVolume(val);
  }, []);

  const handleSfxVolumeChange = useCallback((val: number) => {
    audioEngine.unlock();
    audioEngine.setSfxVolume(val);
    setSfxVolume(val);
  }, []);

  const handlePreviewSfx = useCallback(() => {
    audioEngine.unlock();
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
        setHud((prev) => {
          const next =
            prev.levelId === 5 &&
            prev.phase !== 'TITLE_MENU' &&
            snapshot.levelId === 5 &&
            snapshot.phase !== 'TITLE_MENU' &&
            (snapshot.phase === 'PAUSED' || snapshot.phase === 'PLAYING' || snapshot.phase === 'GAME_OVER' || snapshot.phase === 'VICTORY')
              ? {
                  ...prev,
                  phase: snapshot.phase,
                  dewdrops: snapshot.dewdrops,
                  equipped: snapshot.equipped,
                  savedGame: snapshot.savedGame,
                }
              : snapshot;
          hudRef.current = next;
          return next;
        });
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
      audioEngine.unlock();
    };

    const syncOrientation = () => {
      const portraitNow = window.innerHeight > window.innerWidth;
      setIsPortrait(portraitNow);
      if (!portraitNow) {
        setPortraitDismissed(false);
      }
      engine.resize();
    };

    const handleBlur = () => {
      engine.clearHeldInputs();
      level5Ref.current?.clearHeldInputs();
    };
    const handleVisibility = () => {
      if (document.hidden) {
        engine.clearHeldInputs();
        level5Ref.current?.clearHeldInputs();
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
        if (hudRef.current.phase === 'TITLE_MENU') {
          engine.startNewGame();
          return;
        }
      }

      const inLevel5 = hudRef.current.levelId === 5 && hudRef.current.phase !== 'TITLE_MENU';

      if (inLevel5) {
        const l5 = level5Ref.current;
        if (!l5) return;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          l5.input.left = true;
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          l5.input.right = true;
        }
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          l5.input.forward = true;
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          l5.input.backward = true;
        }
        if (e.code === 'Space') {
          if (!e.repeat) l5.triggerJump();
          l5.input.jumpHeld = true;
        }
        if (
          (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') &&
          !e.repeat
        ) {
          l5.triggerPulse();
        }
        if (e.code === 'KeyF' && !e.repeat) {
          l5.activateFlyingFlower();
        }
        if (e.code === 'KeyH' && !e.repeat) {
          l5.helpNearbyAnimal();
        }
        return;
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
      if (e.code === 'KeyH' && !e.repeat) {
        engine.helpNearbyAnimal();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        engine.input.left = false;
        if (level5Ref.current) level5Ref.current.input.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        engine.input.right = false;
        if (level5Ref.current) level5Ref.current.input.right = false;
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        engine.releaseJump();
        if (level5Ref.current) level5Ref.current.input.forward = false;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (level5Ref.current) level5Ref.current.input.backward = false;
      }
      if (e.code === 'Space') {
        engine.releaseJump();
        level5Ref.current?.releaseJump();
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
    <main className="fixed inset-0 h-full w-full overflow-hidden bg-[#050d14]" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className={`block h-full w-full ${isLevel5Active ? 'hidden' : ''} ${canvasCursorPointer ? 'cursor-pointer' : ''}`}
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          audioEngine.unlock();
          if (e.pointerType !== 'mouse') {
            engineRef.current?.handleCanvasPointerDown(e.clientX, e.clientY);
          }
        }}
        onPointerMove={(e) => {
          if (canvasCursorPointer && e.pointerType === 'mouse') {
            setCanvasCursorPointer(false);
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {isLevel5Active && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-0 flex items-center justify-center bg-[#0f2414] text-sm font-semibold text-[#eafbf8]">
              Entering Sunbeam Dessert Glade (3D)...
            </div>
          }
        >
          <LazyLevel5Viewport
            ref={handleLevel5Mount}
            phase={hud.phase}
            shopProgress={shopProgress}
            isTouchDevice={isTouchDevice}
            onHudUpdate={handleLevel5HudUpdate}
            onEarnDewdrops={handleLevel5EarnDewdrops}
            onPhaseChange={handleLevel5PhaseChange}
          />
        </Suspense>
      )}

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
        onFly={handleTouchFly}
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
        onContinueSaved={handleContinueSaved}
        onNextLevel={() => engineRef.current?.startNextLevel()}
        onResume={() => engineRef.current?.resumeGame()}
        onSaveGame={handleSaveGame}
        onGoHome={handleGoHome}
        onRestart={handleRestartLevel}
        onRespawn={handleRespawnAtLantern}
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
        mode3d={hud.levelId === 5}
        flyingFlowers={hud.flyingFlowers}
        onLeftChange={handleTouchLeft}
        onRightChange={handleTouchRight}
        onForwardChange={handleTouchForward}
        onBackwardChange={handleTouchBackward}
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
