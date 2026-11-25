import type { LevelId } from './types';
import { LEVEL_NAMES, SANCTUARY_X, clamp } from './world';

export interface SavedGameState {
  version: 1;
  savedAt: number;
  levelId: LevelId;
  playerX: number;
  playerY: number;
  checkpointX: number;
  checkpointY: number;
  petals: number;
  highJumpCharges: number;
  flyingFlowers: number;
  elapsedSeconds: number;
  orbsCollected: number;
  blossomsCollected: number;
  crystalsCollected: number;
  starseedsCollected: number;
  collectedIndices: number[];
  litLanternIndices: number[];
  blessedCreatureIds: number[];
  pacifiedBaddieIds: number[];
}

export interface SavedGameSummary {
  levelId: LevelId;
  levelName: string;
  progressPct: number;
  savedAt: number;
}

const SAVE_STORAGE_KEY = 'whispering_grove_save_v1';

export function saveGameState(state: SavedGameState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadGameState(): SavedGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedGameState>;
    if (
      parsed.version !== 1 ||
      (parsed.levelId !== 1 && parsed.levelId !== 2 && parsed.levelId !== 3) ||
      typeof parsed.playerX !== 'number' ||
      typeof parsed.playerY !== 'number'
    ) {
      return null;
    }
    return {
      version: 1,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
      levelId: parsed.levelId,
      playerX: parsed.playerX,
      playerY: parsed.playerY,
      checkpointX: typeof parsed.checkpointX === 'number' ? parsed.checkpointX : parsed.playerX,
      checkpointY: typeof parsed.checkpointY === 'number' ? parsed.checkpointY : parsed.playerY,
      petals: typeof parsed.petals === 'number' ? Math.max(1, Math.floor(parsed.petals)) : 3,
      highJumpCharges:
        typeof parsed.highJumpCharges === 'number' ? Math.max(0, Math.floor(parsed.highJumpCharges)) : 0,
      flyingFlowers:
        typeof parsed.flyingFlowers === 'number' ? Math.max(0, Math.floor(parsed.flyingFlowers)) : 0,
      elapsedSeconds:
        typeof parsed.elapsedSeconds === 'number' ? Math.max(0, parsed.elapsedSeconds) : 0,
      orbsCollected:
        typeof parsed.orbsCollected === 'number' ? Math.max(0, Math.floor(parsed.orbsCollected)) : 0,
      blossomsCollected:
        typeof parsed.blossomsCollected === 'number' ? Math.max(0, Math.floor(parsed.blossomsCollected)) : 0,
      crystalsCollected:
        typeof parsed.crystalsCollected === 'number' ? Math.max(0, Math.floor(parsed.crystalsCollected)) : 0,
      starseedsCollected:
        typeof parsed.starseedsCollected === 'number' ? Math.max(0, Math.floor(parsed.starseedsCollected)) : 0,
      collectedIndices: Array.isArray(parsed.collectedIndices)
        ? parsed.collectedIndices.filter((n): n is number => typeof n === 'number')
        : [],
      litLanternIndices: Array.isArray(parsed.litLanternIndices)
        ? parsed.litLanternIndices.filter((n): n is number => typeof n === 'number')
        : [],
      blessedCreatureIds: Array.isArray(parsed.blessedCreatureIds)
        ? parsed.blessedCreatureIds.filter((n): n is number => typeof n === 'number')
        : [],
      pacifiedBaddieIds: Array.isArray(parsed.pacifiedBaddieIds)
        ? parsed.pacifiedBaddieIds.filter((n): n is number => typeof n === 'number')
        : [],
    };
  } catch {
    return null;
  }
}

export function getSavedGameSummary(): SavedGameSummary | null {
  const saved = loadGameState();
  if (!saved) return null;
  return {
    levelId: saved.levelId,
    levelName: LEVEL_NAMES[saved.levelId],
    progressPct: clamp(Math.round(((saved.playerX - 130) / (SANCTUARY_X - 130)) * 100), 0, 100),
    savedAt: saved.savedAt,
  };
}
