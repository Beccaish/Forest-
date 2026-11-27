import { backdropCache, drawParallaxBackdrop } from './backgrounds';
import type {
  CollectibleItem,
  FloatingPopup,
  ForestBaddie,
  GlowMushroom,
  LevelId,
  MagicalCreature,
  MovingPlatform,
  Particle,
  Platform,
  PlayerState,
  PulseRing,
  SickAnimal,
  SkyRing,
  SpiritLantern,
  StoneArch,
  ThornWisp,
  TrashItem,
  WindStream,
  WoodlandButterfly,
} from './types';
import type { PlayerLoadout } from './shop';
import type { DynamicWeatherSystem } from './weather';
import type { BiomeBlend, WorldData } from './world';
import {
  BASE_GROUND_Y,
  SANCTUARY_X,
  clamp,
  getBiomeBlend,
  getTerrainY,
  lerp,
} from './world';

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x: number,
    y: number,
    w: number,
    h: number,
    radii?: number | DOMPointInit | Iterable<number | DOMPointInit>
  ) {
    const rawR = typeof radii === 'number' ? radii : 0;
    const r = Math.max(0, Math.min(rawR, Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r}, ${g}, ${bl})`;
}

function lerpRgba(hexA: string, hexB: string, t: number, alpha: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
}

export interface RenderContextState {
  world: WorldData;
  player: PlayerState;
  particles: Particle[];
  pulses: PulseRing[];
  floatingPopups: FloatingPopup[];
  weather: DynamicWeatherSystem;
  cameraX: number;
  cameraY: number;
  shakeX: number;
  shakeY: number;
  viewW: number;
  viewH: number;
  worldScale: number;
  time: number;
  sanctuaryAwakened: boolean;
  equipped: PlayerLoadout;
  isTouchDevice?: boolean;
}

export function renderForestScene(
  ctx: CanvasRenderingContext2D,
  state: RenderContextState
): BiomeBlend {
  const {
    world,
    player,
    particles,
    pulses,
    floatingPopups,
    weather,
    cameraX,
    cameraY,
    shakeX,
    shakeY,
    viewW,
    viewH,
    worldScale,
    time,
    sanctuaryAwakened,
    equipped,
  } = state;

  const virtualW = viewW / worldScale;
  const virtualH = viewH / worldScale;
  const levelId = world.levelId;
  const centerWorldX = cameraX + virtualW * 0.5;
  const b = getBiomeBlend(centerWorldX, levelId);

  const skyTop = lerpColor(b.a.skyTop, b.b.skyTop, b.mix);
  const skyMid = lerpColor(b.a.skyMid, b.b.skyMid, b.mix);
  const skyBot = lerpColor(b.a.skyBot, b.b.skyBot, b.mix);
  const mtnCol = lerpColor(b.a.mountain, b.b.mountain, b.mix);
  const farCol = lerpColor(b.a.farTree, b.b.farTree, b.mix);
  const midCol = lerpColor(b.a.midTree, b.b.midTree, b.mix);
  const groundTop = lerpColor(b.a.groundTop, b.b.groundTop, b.mix);
  const groundBot = lerpColor(b.a.groundBot, b.b.groundBot, b.mix);
  const rimCol = lerpColor(b.a.rim, b.b.rim, b.mix);

  // 1. Sky Gradient Fallback
  const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(0.55, skyMid);
  skyGrad.addColorStop(1, skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewW, viewH);

  // 2. Illustrated Forest Scene Background Image (cross-fades per biome & level!)
  const imgA = backdropCache.getImage(levelId, b.idxA);
  const imgB = b.idxB !== b.idxA ? backdropCache.getImage(levelId, b.idxB) : null;
  if (imgA) {
    drawParallaxBackdrop(ctx, imgA, cameraX, viewW, viewH, 1);
  }
  if (imgB && b.mix > 0.01) {
    drawParallaxBackdrop(ctx, imgB, cameraX, viewW, viewH, b.mix);
  }

  // Subtle depth scrim over backdrop artwork so foreground gameplay & HUD stay crisp
  const depthVeil = ctx.createLinearGradient(0, 0, 0, viewH);
  depthVeil.addColorStop(0, 'rgba(4, 10, 18, 0.16)');
  depthVeil.addColorStop(0.6, 'rgba(4, 10, 18, 0.14)');
  depthVeil.addColorStop(1, 'rgba(4, 10, 18, 0.42)');
  ctx.fillStyle = depthVeil;
  ctx.fillRect(0, 0, viewW, viewH);

  // Enchanted Underwater Caustics & Bioluminescent Lagoon Wash
  if (b.weights.underwater > 0.02) {
    ctx.save();
    ctx.fillStyle = `rgba(12, 92, 118, ${0.26 * b.weights.underwater})`;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.globalAlpha = 0.22 * b.weights.underwater;
    for (let r = 0; r < 6; r++) {
      const rx = ((r * 260 + Math.sin(time * 0.7 + r) * 70 - cameraX * 0.12) % (viewW + 260)) - 80;
      const grad = ctx.createLinearGradient(rx, 0, rx + 90, viewH * 0.85);
      grad.addColorStop(0, '#9efffa');
      grad.addColorStop(1, 'rgba(120, 248, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 65, 0);
      ctx.lineTo(rx + 185, viewH * 0.9);
      ctx.lineTo(rx + 60, viewH * 0.9);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Twinkling Starfield Accent
  const starVis =
    levelId === 1
      ? clamp((centerWorldX - 1050) / 1400, 0.22, 1)
      : clamp((centerWorldX - 750) / 1300, 0.3, 1);
  for (const s of world.stars) {
    const sx = (((s.x - cameraX * 0.03) % viewW) + viewW) % viewW;
    const sy = s.y * viewH;
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * s.speed + s.phase));
    ctx.fillStyle = `rgba(235, 250, 255, ${tw * starVis * 0.8})`;
    ctx.beginPath();
    ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Celestial Accents (Sunbeams / Sky Lanterns / Auroras)
  if (levelId === 1) {
    drawLevel1Celestials(ctx, centerWorldX, cameraX, viewW, viewH, time);
  } else if (levelId === 2) {
    drawLevel2Celestials(ctx, world, centerWorldX, cameraX, viewW, viewH, time);
  } else if (levelId === 3) {
    drawLevel3Celestials(ctx, world, centerWorldX, cameraX, viewW, viewH, time);
  } else {
    drawLevel4Celestials(ctx, world, centerWorldX, cameraX, viewW, viewH, time);
  }

  // 5. Translucent Distant Silhouettes (adds extra depth without hiding the painted backdrop)
  ctx.save();
  ctx.globalAlpha = imgA ? 0.32 : 1;
  ctx.fillStyle = mtnCol;
  ctx.beginPath();
  for (const m of world.mountains) {
    const mx = m.x - cameraX * 0.1;
    if (mx + m.w < -50 || mx > viewW + 50) continue;
    const base = viewH * 0.9;
    if (levelId >= 2) {
      ctx.moveTo(mx, base);
      ctx.lineTo(mx + m.w * 0.48, base - m.h * (levelId === 4 ? 0.98 : 0.85));
      ctx.lineTo(mx + m.w, base);
      ctx.lineTo(mx + m.w, viewH);
      ctx.lineTo(mx, viewH);
    } else {
      ctx.moveTo(mx, base);
      ctx.quadraticCurveTo(mx + m.w * 0.5, base - m.h * 1.1, mx + m.w, base);
      ctx.lineTo(mx + m.w, viewH);
      ctx.lineTo(mx, viewH);
    }
  }
  ctx.fill();

  ctx.globalAlpha = imgA ? 0.38 : 1;
  ctx.fillStyle = farCol;
  for (const t of world.farTrees) {
    const tx = t.x - cameraX * 0.22;
    if (tx + 120 < 0 || tx - 120 > viewW) continue;
    const base = viewH * 0.94;
    if (levelId === 4) {
      // Conical pine silhouette
      ctx.beginPath();
      ctx.moveTo(tx, base - t.h * 0.95);
      ctx.lineTo(tx + t.canopyR * 0.68, base);
      ctx.lineTo(tx - t.canopyR * 0.68, base);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(tx - t.w * 0.5, base);
      ctx.lineTo(tx - t.w * 0.22 + t.lean, base - t.h * 0.82);
      ctx.lineTo(tx + t.w * 0.22 + t.lean, base - t.h * 0.82);
      ctx.lineTo(tx + t.w * 0.5, base);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  // Soft Atmospheric Mist Band
  const mistAlpha = 0.12 + b.weights.rain * 0.08;
  const mist1 = ctx.createLinearGradient(0, viewH * 0.44, 0, viewH * 0.96);
  mist1.addColorStop(0, 'rgba(0,0,0,0)');
  mist1.addColorStop(0.65, lerpRgba(b.a.mist, b.b.mist, b.mix, mistAlpha));
  mist1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mist1;
  ctx.fillRect(0, viewH * 0.44, viewW, viewH * 0.52);

  // 6. Midground Cascading Waterfalls & Translucent Canopy Trees (0.45x parallax)
  drawWaterfalls(ctx, world, levelId, cameraX, viewW, viewH, time);
  ctx.save();
  ctx.globalAlpha = imgA ? 0.55 : 1;
  drawMidTrees(ctx, world, levelId, midCol, rimCol, cameraX, viewW, viewH, time);
  ctx.restore();

  // 7. Near-Ground Trees (0.72x parallax) & Deep Background Silhouette Trunks (0.84x parallax, behind playable path)
  ctx.save();
  ctx.globalAlpha = imgA ? 0.72 : 1;
  drawNearTrees(ctx, world, levelId, b, cameraX, viewW, viewH);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(4, 10, 16, 0.36)';
  for (const fg of world.fgSilhouettes) {
    const fx = fg.x - cameraX * 0.84;
    if (fx + 140 < 0 || fx - 140 > viewW) continue;
    ctx.beginPath();
    ctx.moveTo(fx - fg.w * 0.6, viewH + 20);
    ctx.lineTo(fx - fg.w * 0.32 + fg.lean, -20);
    ctx.lineTo(fx + fg.w * 0.32 + fg.lean, -20);
    ctx.lineTo(fx + fg.w * 0.6, viewH + 20);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ============================================================
  // WORLD-SPACE PLAYABLE LAYER (1.0x * worldScale + camera shake)
  // ============================================================
  ctx.save();
  ctx.scale(worldScale, worldScale);
  ctx.translate(-cameraX + shakeX, -cameraY + shakeY);

  if (cameraX < 420) {
    drawSpiritHollow(ctx, levelId, time);
  }

  for (const a of world.stoneArches) {
    if (a.x + 180 < cameraX || a.x - 180 > cameraX + virtualW) continue;
    drawStoneArch(ctx, a, levelId);
  }

  if (SANCTUARY_X + 360 > cameraX && SANCTUARY_X - 360 < cameraX + virtualW) {
    drawSanctuaryTree(ctx, levelId, sanctuaryAwakened, time);
  }

  for (const w of world.windStreams) {
    if (w.x + 120 < cameraX || w.x - 120 > cameraX + virtualW) continue;
    drawWindStream(ctx, w, levelId, time);
  }

  for (const p of world.platforms) {
    if (p.x + p.w + 40 < cameraX || p.x - 40 > cameraX + virtualW) continue;
    drawPlatform(ctx, p, levelId);
  }

  for (const mp of world.movingPlatforms) {
    if (mp.x + mp.w + 50 < cameraX || mp.x - 50 > cameraX + virtualW) continue;
    drawMovingPlatform(ctx, mp, levelId, time);
  }

  for (const ring of world.skyRings) {
    if (ring.x + 80 < cameraX || ring.x - 80 > cameraX + virtualW) continue;
    drawSkyRing(ctx, ring, time);
  }

  for (const l of world.lanterns) {
    if (l.x + 120 < cameraX || l.x - 120 > cameraX + virtualW) continue;
    drawLantern(ctx, l);
  }

  for (const m of world.mushrooms) {
    if (m.x + 80 < cameraX || m.x - 80 > cameraX + virtualW) continue;
    drawMushroom(ctx, m);
  }

  drawTerrain(ctx, levelId, groundTop, groundBot, rimCol, cameraX, cameraY, virtualW, virtualH);

  for (const c of world.creatures) {
    if (c.kind !== 'mermaid' || c.homeX + 100 < cameraX || c.homeX - 100 > cameraX + virtualW) {
      continue;
    }
    drawMermaidPool(ctx, c, time);
  }

  drawGrassAndFlowers(ctx, world, levelId, cameraX, virtualW);

  for (const trash of world.trashItems) {
    if (trash.collected || trash.x + 50 < cameraX || trash.x - 50 > cameraX + virtualW) continue;
    drawTrashItem(ctx, trash, time);
  }

  for (const animal of world.sickAnimals) {
    if (animal.x + 90 < cameraX || animal.x - 90 > cameraX + virtualW) continue;
    drawSickAnimal(ctx, animal, time, player.x, player.y, Boolean(state.isTouchDevice));
  }

  for (const c of world.creatures) {
    if (c.homeX + 90 < cameraX || c.homeX - 90 > cameraX + virtualW) continue;
    if (c.emerge > 0.04) {
      drawMagicalCreature(ctx, c, time);
    }
  }

  for (const item of world.collectibles) {
    if (item.collected || item.x + 50 < cameraX || item.x - 50 > cameraX + virtualW) continue;
    drawCollectible(ctx, item, time);
  }

  for (const bf of world.butterflies) {
    if (bf.x + 40 < cameraX || bf.x - 40 > cameraX + virtualW) continue;
    drawButterfly(ctx, bf, time);
  }

  for (const wisp of world.thornWisps) {
    if (wisp.x + 80 < cameraX || wisp.x - 80 > cameraX + virtualW) continue;
    drawThornWisp(ctx, wisp, time);
  }

  for (const baddie of world.baddies) {
    if (baddie.homeX + 90 < cameraX || baddie.homeX - 90 > cameraX + virtualW) continue;
    if (baddie.emerge > 0.04) {
      drawForestBaddie(ctx, baddie, time);
    }
  }

  for (const pu of pulses) {
    ctx.save();
    ctx.strokeStyle =
      player.crystalBoostTimer > 0
        ? `rgba(255, 224, 145, ${pu.alpha * 0.9})`
        : `rgba(130, 255, 232, ${pu.alpha * 0.85})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = player.crystalBoostTimer > 0 ? '#ffe08a' : '#7cfce7';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(pu.x, pu.y, pu.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawPlayer(ctx, player, time, equipped);

  for (const p of particles) {
    const lifeNorm = clamp(p.life / p.maxLife, 0, 1);
    if (p.kind === 'glitter') {
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(time * 14 + (p.twinklePhase ?? 0)));
      const alpha = clamp(lifeNorm * 1.35, 0, 1) * twinkle;
      const size = p.r * (0.75 + 0.5 * twinkle);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(time * 2.5 + (p.twinklePhase ?? 0));
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      // 4-point star glitter mote
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? size * 1.45 : size * 0.38;
        const ang = (i * Math.PI) / 4;
        if (i === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.9, size * 0.34), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.globalAlpha = lifeNorm;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  for (const fp of floatingPopups) {
    const alpha = clamp(fp.life / Math.min(0.65, fp.maxLife), 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textW = ctx.measureText(fp.text).width + 16;
    ctx.fillStyle = 'rgba(5, 19, 28, 0.78)';
    ctx.beginPath();
    ctx.roundRect(fp.x - textW * 0.5, fp.y - 11, textW, 22, 11);
    ctx.fill();
    ctx.strokeStyle = fp.color;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = fp.color;
    ctx.fillText(fp.text, fp.x, fp.y + 0.5);
    ctx.restore();
  }

  ctx.restore();

  // ============================================================
  // SCREEN-SPACE AMBIENT SPORES, DYNAMIC WEATHER & FOREGROUND
  // ============================================================
  const sporeColor = lerpColor(b.a.particle, b.b.particle, b.mix);
  for (const s of world.floatingSpores) {
    const sx = (((s.x - cameraX * 0.15 * s.depth) % viewW) + viewW) % viewW;
    const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 2.4 + s.phase));
    ctx.globalAlpha = pulse * 0.68;
    ctx.fillStyle = sporeColor;
    ctx.beginPath();
    ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  weather.render(ctx, time, b, levelId);

  return b;
}

function drawLevel1Celestials(
  ctx: CanvasRenderingContext2D,
  centerWorldX: number,
  cameraX: number,
  viewW: number,
  viewH: number,
  time: number
): void {
  const sunVis = clamp(1 - (centerWorldX - 1500) / 1100, 0, 1);
  if (sunVis > 0.01) {
    ctx.save();
    ctx.globalAlpha = sunVis * 0.15;
    for (let i = 0; i < 5; i++) {
      const bx = ((i * 310 + 180 - cameraX * 0.08) % (viewW + 400)) - 120;
      const grad = ctx.createLinearGradient(bx, 0, bx + 180, viewH * 0.85);
      grad.addColorStop(0, '#ffeaa7');
      grad.addColorStop(1, 'rgba(255, 234, 167, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 90, 0);
      ctx.lineTo(bx + 320, viewH);
      ctx.lineTo(bx + 110, viewH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  const moonVis = clamp((centerWorldX - 1600) / 1000, 0, 1);
  if (moonVis > 0.01) {
    const mx = viewW * 0.76 - cameraX * 0.014;
    const my = viewH * 0.2;
    ctx.save();
    ctx.globalAlpha = moonVis;
    const halo = ctx.createRadialGradient(mx, my, 18, mx, my, 150);
    halo.addColorStop(0, 'rgba(180, 230, 255, 0.34)');
    halo.addColorStop(1, 'rgba(180, 230, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, my, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eaf7ff';
    ctx.beginPath();
    ctx.arc(mx, my, 42, -Math.PI * 0.38, Math.PI * 0.85, false);
    ctx.quadraticCurveTo(
      mx - 10,
      my - 10,
      mx + 42 * Math.cos(-Math.PI * 0.38),
      my + 42 * Math.sin(-Math.PI * 0.38)
    );
    ctx.fill();
    ctx.restore();
  }

  const aurVis = clamp((centerWorldX - 4300) / 1100, 0, 1);
  if (aurVis > 0.01) {
    ctx.save();
    ctx.globalAlpha = aurVis * 0.32;
    for (let r = 0; r < 2; r++) {
      const grad = ctx.createLinearGradient(0, viewH * 0.05, 0, viewH * 0.38);
      grad.addColorStop(0, 'rgba(80, 255, 220, 0)');
      grad.addColorStop(0.5, r === 0 ? '#5cffd6' : '#a88cff');
      grad.addColorStop(1, 'rgba(80, 255, 220, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, viewH * 0.32);
      for (let x = 0; x <= viewW + 40; x += 40) {
        const y = viewH * (0.14 + r * 0.06) + Math.sin(x * 0.005 + time * 0.6 + r * 2) * 32;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(viewW, viewH * 0.42);
      ctx.lineTo(0, viewH * 0.42);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawLevel2Celestials(
  ctx: CanvasRenderingContext2D,
  world: WorldData,
  centerWorldX: number,
  cameraX: number,
  viewW: number,
  viewH: number,
  time: number
): void {
  // Giant Harvest Sunset Sun in Biome 0
  const sunVis = clamp(1 - (centerWorldX - 1500) / 1100, 0, 1);
  if (sunVis > 0.01) {
    const sx = viewW * 0.68 - cameraX * 0.012;
    const sy = viewH * 0.46;
    ctx.save();
    ctx.globalAlpha = sunVis;
    const halo = ctx.createRadialGradient(sx, sy, 22, sx, sy, 210);
    halo.addColorStop(0, 'rgba(255, 215, 130, 0.62)');
    halo.addColorStop(0.45, 'rgba(255, 130, 85, 0.25)');
    halo.addColorStop(1, 'rgba(255, 110, 70, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, 210, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffe5a3';
    ctx.beginPath();
    ctx.arc(sx, sy, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Drifting Floating Sky Lanterns in Level 2 background
  ctx.save();
  for (const sl of world.skyLanterns) {
    const lx = (((sl.x - cameraX * 0.12 + Math.sin(time * 0.5 + sl.swayPhase) * 16) % viewW) + viewW) % viewW;
    const ly = (((sl.y - time * sl.vy) % (viewH * 0.78)) + viewH * 0.78) % (viewH * 0.78);
    const glow = ctx.createRadialGradient(lx, ly, 1, lx, ly, sl.r * 3.2);
    glow.addColorStop(0, sl.hue);
    glow.addColorStop(1, 'rgba(255, 190, 110, 0)');
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly, sl.r * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff3d1';
    ctx.fillRect(lx - sl.r * 0.45, ly - sl.r * 0.6, sl.r * 0.9, sl.r * 1.2);
  }
  ctx.restore();

  // Rose-Gold Summit Aurora & Shooting Stars in Biome 2
  const aurVis = clamp((centerWorldX - 4200) / 1100, 0, 1);
  if (aurVis > 0.01) {
    ctx.save();
    ctx.globalAlpha = aurVis * 0.34;
    for (let r = 0; r < 2; r++) {
      const grad = ctx.createLinearGradient(0, viewH * 0.04, 0, viewH * 0.36);
      grad.addColorStop(0, 'rgba(255, 200, 140, 0)');
      grad.addColorStop(0.5, r === 0 ? '#ffd085' : '#ff8fb8');
      grad.addColorStop(1, 'rgba(255, 200, 140, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, viewH * 0.32);
      for (let x = 0; x <= viewW + 40; x += 40) {
        const y = viewH * (0.13 + r * 0.06) + Math.sin(x * 0.0055 + time * 0.65 + r * 2) * 30;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(viewW, viewH * 0.42);
      ctx.lineTo(0, viewH * 0.42);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawLevel3Celestials(
  ctx: CanvasRenderingContext2D,
  world: WorldData,
  centerWorldX: number,
  cameraX: number,
  viewW: number,
  viewH: number,
  time: number
): void {
  // Winter Prism Halo Sun in Silver Frostwood (Biome 0)
  const sunVis = clamp(1 - (centerWorldX - 1500) / 1100, 0, 1);
  if (sunVis > 0.01) {
    const sx = viewW * 0.7 - cameraX * 0.012;
    const sy = viewH * 0.25;
    ctx.save();
    ctx.globalAlpha = sunVis * 0.88;
    const halo = ctx.createRadialGradient(sx, sy, 18, sx, sy, 185);
    halo.addColorStop(0, 'rgba(225, 252, 255, 0.56)');
    halo.addColorStop(0.5, 'rgba(135, 220, 255, 0.22)');
    halo.addColorStop(1, 'rgba(135, 220, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, 185, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#effcff';
    ctx.beginPath();
    ctx.arc(sx, sy, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Drifting Astral Sky Lanterns in Level 3
  ctx.save();
  for (const sl of world.skyLanterns) {
    const lx =
      (((sl.x - cameraX * 0.12 + Math.sin(time * 0.55 + sl.swayPhase) * 18) % viewW) + viewW) %
      viewW;
    const ly = (((sl.y - time * sl.vy) % (viewH * 0.78)) + viewH * 0.78) % (viewH * 0.78);
    const glow = ctx.createRadialGradient(lx, ly, 1, lx, ly, sl.r * 3.4);
    glow.addColorStop(0, sl.hue);
    glow.addColorStop(1, 'rgba(150, 230, 255, 0)');
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly, sl.r * 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#edfaff';
    ctx.beginPath();
    ctx.arc(lx, ly, sl.r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Celestial Astral Aurora in Biome 1-2
  const aurVis = clamp((centerWorldX - 3600) / 1100, 0.14, 1);
  if (aurVis > 0.01) {
    ctx.save();
    ctx.globalAlpha = aurVis * 0.34;
    for (let r = 0; r < 2; r++) {
      const grad = ctx.createLinearGradient(0, viewH * 0.03, 0, viewH * 0.38);
      grad.addColorStop(0, 'rgba(140, 240, 255, 0)');
      grad.addColorStop(0.5, r === 0 ? '#8ef5ff' : '#d2a8ff');
      grad.addColorStop(1, 'rgba(140, 240, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, viewH * 0.34);
      for (let x = 0; x <= viewW + 40; x += 40) {
        const y = viewH * (0.12 + r * 0.065) + Math.sin(x * 0.005 + time * 0.7 + r * 2.1) * 32;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(viewW, viewH * 0.44);
      ctx.lineTo(0, viewH * 0.44);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawLevel4Celestials(
  ctx: CanvasRenderingContext2D,
  world: WorldData,
  centerWorldX: number,
  cameraX: number,
  viewW: number,
  viewH: number,
  time: number
): void {
  // Crisp Frost Moon
  const mx = viewW * 0.74 - cameraX * 0.012;
  const my = viewH * 0.2;
  ctx.save();
  const halo = ctx.createRadialGradient(mx, my, 16, mx, my, 165);
  halo.addColorStop(0, 'rgba(210, 250, 255, 0.44)');
  halo.addColorStop(1, 'rgba(130, 230, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(mx, my, 165, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f2fcff';
  ctx.beginPath();
  ctx.arc(mx, my, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Drifting Frost-Star Lanterns
  ctx.save();
  for (const sl of world.skyLanterns) {
    const lx =
      (((sl.x - cameraX * 0.1 + Math.sin(time * 0.48 + sl.swayPhase) * 16) % viewW) + viewW) %
      viewW;
    const ly = (((sl.y - time * sl.vy * 0.85) % (viewH * 0.78)) + viewH * 0.78) % (viewH * 0.78);
    const glow = ctx.createRadialGradient(lx, ly, 1, lx, ly, sl.r * 3.1);
    glow.addColorStop(0, sl.hue);
    glow.addColorStop(1, 'rgba(140, 248, 255, 0)');
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly, sl.r * 3.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Alpine Aurora Borealis across peaks and summit
  const aurVis = clamp((centerWorldX - 2400) / 1400, 0.24, 1);
  ctx.save();
  ctx.globalAlpha = aurVis * 0.36;
  for (let r = 0; r < 2; r++) {
    const grad = ctx.createLinearGradient(0, viewH * 0.03, 0, viewH * 0.4);
    grad.addColorStop(0, 'rgba(110, 255, 220, 0)');
    grad.addColorStop(0.5, r === 0 ? '#69ffd9' : '#a8b8ff');
    grad.addColorStop(1, 'rgba(110, 255, 220, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, viewH * 0.34);
    for (let x = 0; x <= viewW + 40; x += 40) {
      const y = viewH * (0.11 + r * 0.065) + Math.sin(x * 0.0048 + time * 0.68 + r * 2.1) * 34;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(viewW, viewH * 0.45);
    ctx.lineTo(0, viewH * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawWaterfalls(
  ctx: CanvasRenderingContext2D,
  world: WorldData,
  levelId: LevelId,
  cameraX: number,
  viewW: number,
  viewH: number,
  time: number
): void {
  const tint =
    levelId === 1
      ? '145, 252, 245'
      : levelId === 2
        ? '212, 175, 255'
        : levelId === 3
          ? '165, 235, 255'
          : '195, 245, 255';
  for (const wf of world.waterfalls) {
    const wx = wf.x - cameraX * 0.45;
    if (wx + wf.w < -40 || wx - wf.w > viewW + 40) continue;
    const grad = ctx.createLinearGradient(wx, wf.topY, wx, viewH * 0.92);
    grad.addColorStop(0, `rgba(${tint}, 0.05)`);
    grad.addColorStop(0.4, `rgba(${tint}, 0.24)`);
    grad.addColorStop(1, `rgba(${tint}, 0.42)`);
    ctx.fillStyle = grad;
    ctx.fillRect(wx - wf.w * 0.5, wf.topY, wf.w, viewH * 0.92 - wf.topY);

    ctx.strokeStyle = 'rgba(245, 245, 255, 0.36)';
    ctx.lineWidth = 2;
    for (let s = 0; s < 4; s++) {
      const sx = wx - wf.w * 0.35 + s * (wf.w * 0.23);
      const offset = (time * 170 + s * 65) % 240;
      ctx.beginPath();
      ctx.moveTo(sx, wf.topY + offset);
      ctx.lineTo(sx, wf.topY + offset + 55);
      ctx.stroke();
    }

    const poolGrad = ctx.createRadialGradient(wx, viewH * 0.9, 5, wx, viewH * 0.9, wf.w * 1.4);
    poolGrad.addColorStop(0, `rgba(${tint}, 0.34)`);
    poolGrad.addColorStop(1, `rgba(${tint}, 0)`);
    ctx.fillStyle = poolGrad;
    ctx.beginPath();
    ctx.arc(wx, viewH * 0.9, wf.w * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMidTrees(
  ctx: CanvasRenderingContext2D,
  world: WorldData,
  levelId: LevelId,
  midCol: string,
  rimCol: string,
  cameraX: number,
  viewW: number,
  viewH: number,
  time: number
): void {
  for (const t of world.midTrees) {
    const tx = t.x - cameraX * 0.45;
    if (tx + 150 < 0 || tx - 150 > viewW) continue;
    const base = viewH * 0.95;

    if (levelId === 4) {
      // Tiered snow-laden pine silhouettes
      ctx.fillStyle = midCol;
      ctx.fillRect(tx - t.w * 0.16, base - t.h * 0.3, t.w * 0.32, t.h * 0.3);
      for (let tier = 0; tier < 3; tier++) {
        const tierBot = base - t.h * (0.2 + tier * 0.24);
        const tierTop = tierBot - t.h * 0.36;
        const halfW = t.canopyR * (0.72 - tier * 0.16);
        ctx.fillStyle = midCol;
        ctx.beginPath();
        ctx.moveTo(tx + t.lean * (tier * 0.25), tierTop);
        ctx.lineTo(tx + halfW, tierBot);
        ctx.lineTo(tx - halfW, tierBot);
        ctx.closePath();
        ctx.fill();

        // Frosted snow dusting on pine bough tips
        ctx.fillStyle = 'rgba(225, 248, 255, 0.36)';
        ctx.beginPath();
        ctx.moveTo(tx + t.lean * (tier * 0.25), tierTop);
        ctx.lineTo(tx + halfW * 0.55, tierTop + (tierBot - tierTop) * 0.42);
        ctx.lineTo(tx - halfW * 0.55, tierTop + (tierBot - tierTop) * 0.42);
        ctx.closePath();
        ctx.fill();
      }
      continue;
    }

    ctx.fillStyle = midCol;
    ctx.beginPath();
    ctx.moveTo(tx - t.w * 0.55, base);
    ctx.quadraticCurveTo(tx - t.w * 0.2, base - t.h * 0.5, tx - t.w * 0.2 + t.lean, base - t.h);
    ctx.lineTo(tx + t.w * 0.2 + t.lean, base - t.h);
    ctx.quadraticCurveTo(tx + t.w * 0.25, base - t.h * 0.5, tx + t.w * 0.55, base);
    ctx.closePath();
    ctx.fill();

    // Gnarled spreading storybook buttress roots
    ctx.fillStyle = midCol;
    ctx.beginPath();
    ctx.moveTo(tx - t.w * 0.85, base);
    ctx.quadraticCurveTo(tx - t.w * 0.42, base - 26, tx - t.w * 0.24, base - t.h * 0.35);
    ctx.lineTo(tx - t.w * 0.2 + t.lean, base - t.h);
    ctx.lineTo(tx + t.w * 0.2 + t.lean, base - t.h);
    ctx.lineTo(tx + t.w * 0.24, base - t.h * 0.35);
    ctx.quadraticCurveTo(tx + t.w * 0.42, base - 26, tx + t.w * 0.85, base);
    ctx.closePath();
    ctx.fill();

    // Organic curving storybook limbs
    ctx.strokeStyle = midCol;
    ctx.lineWidth = Math.max(5, t.w * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx + t.lean * 0.45, base - t.h * 0.65);
    ctx.quadraticCurveTo(tx + t.lean * 0.65 - t.canopyR * 0.55, base - t.h * 0.78, tx + t.lean - t.canopyR * 0.72, base - t.h * 0.92);
    ctx.moveTo(tx + t.lean * 0.45, base - t.h * 0.6);
    ctx.quadraticCurveTo(tx + t.lean * 0.65 + t.canopyR * 0.52, base - t.h * 0.74, tx + t.lean + t.canopyR * 0.68, base - t.h * 0.88);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tx + t.lean, base - t.h, t.canopyR, 0, Math.PI * 2);
    ctx.arc(tx + t.lean - t.canopyR * 0.6, base - t.h + 25, t.canopyR * 0.72, 0, Math.PI * 2);
    ctx.arc(tx + t.lean + t.canopyR * 0.6, base - t.h + 28, t.canopyR * 0.7, 0, Math.PI * 2);
    ctx.fill();

    for (let v = 0; v < t.vines; v++) {
      const vx = tx + t.lean - t.canopyR * 0.5 + v * 36;
      const vy = base - t.h + t.canopyR * 0.55;
      const vLen = 55 + ((v * 23) % 45);
      const sway = Math.sin(time * 1.4 + t.vineSeed + v) * 8;
      ctx.strokeStyle =
        levelId === 1
          ? 'rgba(90, 210, 185, 0.34)'
          : levelId === 2
            ? 'rgba(230, 165, 130, 0.34)'
            : 'rgba(155, 232, 255, 0.34)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.quadraticCurveTo(vx + sway * 0.5, vy + vLen * 0.5, vx + sway, vy + vLen);
      ctx.stroke();

      ctx.fillStyle = rimCol;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(vx + sway, vy + vLen, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

function drawNearTrees(
  ctx: CanvasRenderingContext2D,
  world: WorldData,
  levelId: LevelId,
  b: BiomeBlend,
  cameraX: number,
  viewW: number,
  viewH: number
): void {
  const trunkCol =
    levelId === 1
      ? lerpColor('#0c1f1a', '#070c1b', b.mix > 0 ? 0.5 : 0)
      : levelId === 2
        ? lerpColor('#1d0f0d', '#0f081c', b.mix > 0 ? 0.5 : 0)
        : lerpColor('#0e1c2e', '#0a1026', b.mix > 0 ? 0.5 : 0);
  const mossStrip =
    levelId === 1
      ? 'rgba(78, 168, 118, 0.28)'
      : levelId === 2
        ? 'rgba(218, 134, 72, 0.25)'
        : levelId === 3
          ? 'rgba(122, 214, 240, 0.25)'
          : 'rgba(220, 246, 255, 0.28)';

  for (const t of world.nearTrees) {
    const tx = t.x - cameraX * 0.72;
    if (tx + 140 < 0 || tx - 140 > viewW) continue;
    const base = viewH + 20;

    ctx.fillStyle = trunkCol;
    ctx.beginPath();
    ctx.moveTo(tx - t.w * 0.96, base);
    ctx.quadraticCurveTo(tx - t.w * 0.35, base - t.h * 0.28, tx - t.w * 0.28 + t.lean, base - t.h);
    ctx.lineTo(tx + t.w * 0.28 + t.lean, base - t.h);
    ctx.quadraticCurveTo(tx + t.w * 0.35, base - t.h * 0.28, tx + t.w * 0.96, base);
    ctx.closePath();
    ctx.fill();

    // Subtle bark & moss rib contour along tree side
    ctx.strokeStyle = mossStrip;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(tx - t.w * 0.62, base - 16);
    ctx.quadraticCurveTo(tx - t.w * 0.22, base - t.h * 0.45, tx - t.w * 0.15 + t.lean * 0.6, base - t.h * 0.88);
    ctx.stroke();

    if (t.hasHollow) {
      const hx = tx + t.lean * 0.35;
      const hy = base - t.hollowY;
      const hGlow = ctx.createRadialGradient(hx, hy, 2, hx, hy, 24);
      hGlow.addColorStop(
        0,
        levelId === 1
          ? 'rgba(130, 255, 225, 0.88)'
          : levelId === 2
            ? 'rgba(255, 200, 130, 0.88)'
            : 'rgba(160, 240, 255, 0.88)'
      );
      hGlow.addColorStop(1, 'rgba(130, 255, 225, 0)');
      ctx.fillStyle = hGlow;
      ctx.beginPath();
      ctx.arc(hx, hy, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSpiritHollow(ctx: CanvasRenderingContext2D, levelId: LevelId, time: number): void {
  const hx = 142;
  const hy = getTerrainY(hx, levelId);
  ctx.save();

  const barkDark =
    levelId === 1 ? '#261a11' : levelId === 2 ? '#341c17' : levelId === 3 ? '#1e2b3e' : '#1d2d40';
  const barkMid =
    levelId === 1 ? '#4a3322' : levelId === 2 ? '#613426' : levelId === 3 ? '#344c6b' : '#324d69';
  const barkHi =
    levelId === 1 ? '#78583c' : levelId === 2 ? '#8f523a' : levelId === 3 ? '#597ca6' : '#658eb8';
  const mossCol =
    levelId === 1 ? '#4eb56c' : levelId === 2 ? '#d68945' : levelId === 3 ? '#6ecfe8' : '#d6f4ff';
  const glowCol =
    levelId === 1
      ? 'rgba(116, 252, 232, 0.5)'
      : levelId === 2
        ? 'rgba(255, 198, 122, 0.5)'
        : 'rgba(150, 236, 255, 0.52)';
  const capA =
    levelId === 1 ? '#ffe49e' : levelId === 2 ? '#ffc878' : levelId === 3 ? '#9ef5ff' : '#d8f6ff';
  const capB =
    levelId === 1 ? '#64f5e4' : levelId === 2 ? '#ff937a' : levelId === 3 ? '#c8b4ff' : '#7ae8ff';

  // Soft enchanted sanctuary aura behind spawn alcove
  const aura = ctx.createRadialGradient(hx, hy - 56, 8, hx, hy - 56, 98);
  aura.addColorStop(0, glowCol);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(hx, hy - 56, 98, 0, Math.PI * 2);
  ctx.fill();

  // Wide sweeping carved left & right roots blending into ground path
  ctx.fillStyle = barkDark;
  ctx.beginPath();
  ctx.moveTo(hx - 118, hy + 28);
  ctx.quadraticCurveTo(hx - 78, hy - 22, hx - 58, hy - 96);
  ctx.quadraticCurveTo(hx - 34, hy - 148, hx, hy - 154);
  ctx.quadraticCurveTo(hx + 36, hy - 144, hx + 58, hy - 86);
  ctx.quadraticCurveTo(hx + 76, hy - 18, hx + 114, hy + 26);
  ctx.lineTo(hx - 118, hy + 28);
  ctx.closePath();
  ctx.fill();

  // Mid-tone bark sculptural ridges
  ctx.fillStyle = barkMid;
  ctx.beginPath();
  ctx.moveTo(hx - 90, hy + 20);
  ctx.quadraticCurveTo(hx - 58, hy - 48, hx - 32, hy - 122);
  ctx.quadraticCurveTo(hx, hy - 142, hx + 30, hy - 120);
  ctx.quadraticCurveTo(hx + 56, hy - 46, hx + 84, hy + 20);
  ctx.closePath();
  ctx.fill();

  // Luminous arched inner sanctuary recess
  const innerGrad = ctx.createLinearGradient(hx, hy - 116, hx, hy + 2);
  innerGrad.addColorStop(0, levelId === 2 ? '#4d2b33' : '#306a70');
  innerGrad.addColorStop(0.55, levelId === 2 ? '#2c1722' : '#163d45');
  innerGrad.addColorStop(1, levelId === 2 ? '#180c12' : '#081b1e');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.moveTo(hx - 36, hy + 4);
  ctx.quadraticCurveTo(hx - 34, hy - 80, hx - 2, hy - 112);
  ctx.quadraticCurveTo(hx + 34, hy - 78, hx + 36, hy + 4);
  ctx.closePath();
  ctx.fill();

  // Subtle rim highlight inside archway
  ctx.strokeStyle = glowCol;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Carved storybook spiral whorls & root ribs
  ctx.strokeStyle = barkHi;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx - 62, hy - 2);
  ctx.quadraticCurveTo(hx - 48, hy - 68, hx - 16, hy - 120);
  ctx.moveTo(hx + 58, hy - 2);
  ctx.quadraticCurveTo(hx + 46, hy - 66, hx + 18, hy - 116);
  ctx.moveTo(hx - 96, hy + 18);
  ctx.quadraticCurveTo(hx - 68, hy + 4, hx - 48, hy + 16);
  ctx.stroke();

  // Carved bark swirl spiral on left root base
  ctx.beginPath();
  ctx.arc(hx - 54, hy + 4, 8, 0, Math.PI * 1.75);
  ctx.arc(hx - 54, hy + 4, 4, 0.4, Math.PI * 1.9);
  ctx.stroke();

  // Plush moss crest along crown and shoulders
  ctx.fillStyle = mossCol;
  ctx.beginPath();
  ctx.ellipse(hx - 24, hy - 122, 20, 7, -0.32, 0, Math.PI * 2);
  ctx.ellipse(hx + 22, hy - 118, 18, 6.5, 0.3, 0, Math.PI * 2);
  ctx.ellipse(hx - 54, hy - 54, 14, 5.5, -0.6, 0, Math.PI * 2);
  ctx.fill();

  // Stacked glowing shelf mushrooms climbing the left & upper-right side of the hollow
  const pulse = 0.78 + 0.22 * Math.sin(time * 2.4);
  const shelves: Array<[number, number, number, number, string]> = [
    [-46, -118, 22, 9, capA],
    [-62, -96, 17, 7, capA],
    [-50, -76, 15, 6.5, capB],
    [42, -104, 16, 6.5, capB],
    [52, -82, 13, 5.5, capA],
    [46, -54, 11, 4.8, capB],
  ];
  for (const [dx, dy, rx, ry, col] of shelves) {
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(hx + dx, hy + dy, rx, ry, dx < 0 ? -0.14 : 0.14, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(hx + dx, hy + dy + 1, rx * 0.85, ry * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Glowing turquoise root crystal / lantern bud in lower root fold
  ctx.shadowColor = capB;
  ctx.shadowBlur = 14;
  ctx.fillStyle = capB;
  ctx.beginPath();
  ctx.ellipse(hx - 28, hy + 10, 5.5, 7.5, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStoneArch(ctx: CanvasRenderingContext2D, a: StoneArch, levelId: LevelId): void {
  ctx.save();
  const baseCol = levelId === 1 ? '#36271b' : levelId === 2 ? '#422620' : levelId === 3 ? '#253852' : '#22364f';
  const hiCol = levelId === 1 ? '#5c432d' : levelId === 2 ? '#6e4032' : levelId === 3 ? '#436187' : '#4a6e96';
  const trimCol = levelId === 1 ? '#52b86d' : levelId === 2 ? '#d48244' : levelId === 3 ? '#6ecfe8' : '#b8efff';
  const runeCol =
    levelId === 1
      ? `rgba(128, 255, 232, ${0.42 + a.glow * 0.58})`
      : levelId === 2
        ? `rgba(255, 202, 128, ${0.42 + a.glow * 0.58})`
        : `rgba(165, 240, 255, ${0.42 + a.glow * 0.58})`;

  // Gnarled intertwined wood-and-stone archway legs with flared mossy roots
  ctx.fillStyle = baseCol;
  ctx.beginPath();
  ctx.moveTo(a.x - a.w * 0.5 - 12, a.y + 10);
  ctx.quadraticCurveTo(a.x - a.w * 0.5 - 2, a.y - a.h * 0.45, a.x - a.w * 0.5 + 2, a.y - a.h + 32);
  ctx.lineTo(a.x - a.w * 0.5 + 24, a.y - a.h + 32);
  ctx.quadraticCurveTo(a.x - a.w * 0.5 + 20, a.y - a.h * 0.3, a.x - a.w * 0.5 + 30, a.y + 10);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(a.x + a.w * 0.5 + 12, a.y + 10);
  ctx.quadraticCurveTo(a.x + a.w * 0.5 + 2, a.y - a.h * 0.45, a.x + a.w * 0.5 - 2, a.y - a.h + 32);
  ctx.lineTo(a.x + a.w * 0.5 - 24, a.y - a.h + 32);
  ctx.quadraticCurveTo(a.x + a.w * 0.5 - 20, a.y - a.h * 0.3, a.x + a.w * 0.5 - 30, a.y + 10);
  ctx.closePath();
  ctx.fill();

  // Arch curve
  ctx.beginPath();
  ctx.arc(a.x, a.y - a.h + 34, a.w * 0.5, Math.PI, 0);
  ctx.lineTo(a.x + a.w * 0.5 - 22, a.y - a.h + 34);
  ctx.arc(a.x, a.y - a.h + 34, a.w * 0.5 - 22, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();

  // Bark grain contour along arch curve
  ctx.strokeStyle = hiCol;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(a.x, a.y - a.h + 34, a.w * 0.5 - 7, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  // Moss cushions & blossom clusters across arch crest & pillar bases
  ctx.fillStyle = trimCol;
  ctx.beginPath();
  ctx.ellipse(a.x - 18, a.y - a.h + 12, 16, 6, -0.22, 0, Math.PI * 2);
  ctx.ellipse(a.x + 15, a.y - a.h + 11, 17, 6, 0.22, 0, Math.PI * 2);
  ctx.ellipse(a.x - a.w * 0.5 + 10, a.y + 2, 14, 5, 0.1, 0, Math.PI * 2);
  ctx.ellipse(a.x + a.w * 0.5 - 10, a.y + 2, 14, 5, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Glowing spore/rune lights embedded along arch
  ctx.fillStyle = runeCol;
  for (let r = 0; r < 3; r++) {
    ctx.beginPath();
    ctx.arc(a.x - a.w * 0.5 + 13, a.y - 34 - r * 30, 3.2, 0, Math.PI * 2);
    ctx.arc(a.x + a.w * 0.5 - 13, a.y - 34 - r * 30, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWindStream(
  ctx: CanvasRenderingContext2D,
  w: WindStream,
  levelId: LevelId,
  time: number
): void {
  ctx.save();
  const rgb =
    levelId === 1 ? '155, 255, 240' : levelId === 2 ? '255, 210, 165' : '175, 235, 255';
  for (let i = 0; i < 4; i++) {
    const offset = (time * 95 + i * 75) % (w.yBot - w.yTop);
    const py = w.yBot - offset;
    const alpha = Math.sin((offset / (w.yBot - w.yTop)) * Math.PI) * 0.45;
    const sway = Math.sin(time * 3 + i + offset * 0.03) * 16;
    ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w.x + sway - 14, py + 24);
    ctx.quadraticCurveTo(w.x - sway, py, w.x + sway + 10, py - 24);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, levelId: LevelId): void {
  ctx.save();
  if (p.type === 'ice') {
    // Hanging crystalline icicles along underside
    const icicleCount = Math.max(3, Math.floor(p.w / 26));
    const step = (p.w - 18) / Math.max(1, icicleCount - 1);
    ctx.fillStyle = 'rgba(165, 240, 255, 0.76)';
    for (let i = 0; i < icicleCount; i++) {
      const ix = p.x + 9 + i * step;
      const ih = 9 + ((i * 7) % 10);
      ctx.beginPath();
      ctx.moveTo(ix - 4, p.y + 15);
      ctx.lineTo(ix + 4, p.y + 15);
      ctx.lineTo(ix, p.y + 15 + ih);
      ctx.closePath();
      ctx.fill();
    }

    // Glacial translucent ice slab body
    const iceGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 16);
    iceGrad.addColorStop(0, '#c8f8ff');
    iceGrad.addColorStop(0.45, '#5ec2eb');
    iceGrad.addColorStop(1, '#266996');
    ctx.shadowColor = '#8ef4ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = iceGrad;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, 16, 6);
    ctx.fill();

    // Crisp specular diagonal crystal sheen
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let sx = p.x + 16; sx < p.x + p.w - 18; sx += 34) {
      ctx.beginPath();
      ctx.moveTo(sx, p.y + 3);
      ctx.lineTo(sx + 8, p.y + 3);
      ctx.lineTo(sx + 2, p.y + 14);
      ctx.lineTo(sx - 6, p.y + 14);
      ctx.closePath();
      ctx.fill();
    }

    // Fresh white snow crest along top edge
    ctx.fillStyle = '#f2fcff';
    ctx.beginPath();
    ctx.roundRect(p.x + 2, p.y, p.w - 4, 4.5, 3);
    ctx.fill();

    ctx.strokeStyle = 'rgba(210, 252, 255, 0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, 16, 6);
    ctx.stroke();
  } else if (p.type === 'branch') {
    const barkDark =
      levelId === 1 ? '#291d14' : levelId === 2 ? '#3d2219' : levelId === 3 ? '#1e3045' : '#1b2c40';
    const barkMid =
      levelId === 1 ? '#4a3524' : levelId === 2 ? '#613829' : levelId === 3 ? '#314b68' : '#2e4963';
    const mossDeep =
      levelId === 1 ? '#2c7e5d' : levelId === 2 ? '#b86832' : levelId === 3 ? '#469fc2' : '#96d8ee';
    const mossBright =
      levelId === 1 ? '#64cc7b' : levelId === 2 ? '#eb9b4e' : levelId === 3 ? '#8be8ff' : '#e4fbff';

    // Subtle gnarled curved underside root/bough body
    const barkGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 22);
    barkGrad.addColorStop(0, barkMid);
    barkGrad.addColorStop(1, barkDark);
    ctx.fillStyle = barkGrad;
    ctx.beginPath();
    ctx.moveTo(p.x - 4, p.y + 4);
    ctx.quadraticCurveTo(p.x + p.w * 0.14, p.y + 22, p.x + p.w * 0.34, p.y + 18);
    ctx.quadraticCurveTo(p.x + p.w * 0.56, p.y + 24, p.x + p.w * 0.74, p.y + 17);
    ctx.quadraticCurveTo(p.x + p.w * 0.9, p.y + 20, p.x + p.w + 4, p.y + 4);
    ctx.lineTo(p.x + p.w - 2, p.y + 1);
    ctx.lineTo(p.x + 2, p.y + 1);
    ctx.closePath();
    ctx.fill();

    // Upturned gnarled storybook twig tips at both ends
    ctx.strokeStyle = barkMid;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x + 4, p.y + 8);
    ctx.quadraticCurveTo(p.x - 8, p.y + 2, p.x - 10, p.y - 6);
    ctx.moveTo(p.x + p.w - 4, p.y + 8);
    ctx.quadraticCurveTo(p.x + p.w + 8, p.y + 2, p.x + p.w + 10, p.y - 6);
    ctx.stroke();

    // Bark grain highlights along wood body
    ctx.strokeStyle = 'rgba(255, 228, 185, 0.16)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p.x + 14, p.y + 11);
    ctx.quadraticCurveTo(p.x + p.w * 0.45, p.y + 14, p.x + p.w - 16, p.y + 10);
    ctx.stroke();

    // Plush overhanging mossy cushion along walkable top surface
    ctx.fillStyle = mossDeep;
    ctx.beginPath();
    ctx.roundRect(p.x + 1, p.y, p.w - 2, 7.5, 4);
    ctx.fill();

    ctx.fillStyle = mossBright;
    ctx.beginPath();
    ctx.roundRect(p.x + 3, p.y, p.w - 6, 4, 2.5);
    ctx.fill();

    // Scalloped moss overhangs & subtle blossom dots
    const tuftStep = 22;
    for (let tx = p.x + 10; tx < p.x + p.w - 10; tx += tuftStep) {
      ctx.fillStyle = mossBright;
      ctx.beginPath();
      ctx.arc(tx, p.y + 5.5, 4.2, 0, Math.PI * 2);
      ctx.fill();
      if (((tx * 7) | 0) % 3 === 0) {
        ctx.fillStyle = levelId === 1 ? '#ffe694' : levelId === 2 ? '#ffd98a' : '#d6f9ff';
        ctx.beginPath();
        ctx.arc(tx + 4, p.y + 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (p.type === 'stone') {
    const stoneGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 20);
    stoneGrad.addColorStop(0, levelId === 1 ? '#2e4a52' : levelId === 2 ? '#443059' : '#2f496e');
    stoneGrad.addColorStop(1, levelId === 1 ? '#18282e' : levelId === 2 ? '#231730' : '#192942');
    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, 19, 6);
    ctx.fill();

    // Carved moss/frost overhang on stone top
    ctx.fillStyle = levelId === 1 ? '#4db88d' : levelId === 2 ? '#d9884a' : '#85dcf7';
    ctx.beginPath();
    ctx.roundRect(p.x + 4, p.y, p.w - 8, 4, 2.5);
    ctx.fill();

    ctx.strokeStyle =
      levelId === 1
        ? 'rgba(130, 245, 225, 0.5)'
        : levelId === 2
          ? 'rgba(235, 185, 255, 0.48)'
          : 'rgba(185, 244, 255, 0.58)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, 19, 6);
    ctx.stroke();
  } else {
    ctx.fillStyle =
      levelId === 1
        ? `rgba(98, 245, 225, ${0.18 + p.glow * 0.28})`
        : levelId === 2
          ? `rgba(255, 200, 130, ${0.18 + p.glow * 0.28})`
          : `rgba(170, 232, 255, ${0.22 + p.glow * 0.3})`;
    ctx.strokeStyle =
      levelId === 1
        ? `rgba(165, 255, 242, ${0.5 + p.glow * 0.5})`
        : levelId === 2
          ? `rgba(255, 224, 158, ${0.5 + p.glow * 0.5})`
          : `rgba(210, 248, 255, ${0.58 + p.glow * 0.42})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = levelId === 1 ? '#6fffe9' : levelId === 2 ? '#ffd085' : '#9ef0ff';
    ctx.shadowBlur = 14 * p.glow;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, 12, 6);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawMovingPlatform(
  ctx: CanvasRenderingContext2D,
  mp: MovingPlatform,
  levelId: LevelId,
  time: number
): void {
  ctx.save();
  const pulse = 0.72 + 0.28 * Math.sin(time * 2.8 + mp.phase);

  // Soft floating cloud / moss puffs beneath the moving ledge
  ctx.fillStyle =
    levelId >= 3
      ? `rgba(215, 246, 255, ${0.34 * pulse})`
      : `rgba(255, 224, 185, ${0.28 * pulse})`;
  ctx.beginPath();
  ctx.arc(mp.x + mp.w * 0.22, mp.y + 16, 13, 0, Math.PI * 2);
  ctx.arc(mp.x + mp.w * 0.5, mp.y + 18, 16, 0, Math.PI * 2);
  ctx.arc(mp.x + mp.w * 0.78, mp.y + 16, 13, 0, Math.PI * 2);
  ctx.fill();

  if (levelId === 4) {
    ctx.fillStyle = 'rgba(180, 242, 255, 0.72)';
    for (let i = 0; i < 4; i++) {
      const ix = mp.x + 14 + i * ((mp.w - 28) / 3);
      ctx.beginPath();
      ctx.moveTo(ix - 3.5, mp.y + 14);
      ctx.lineTo(ix + 3.5, mp.y + 14);
      ctx.lineTo(ix, mp.y + 24);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Luminous skywood / glacier gnarled platform deck
  ctx.shadowColor = levelId >= 3 ? '#94ecff' : '#ffd58c';
  ctx.shadowBlur = 14;
  ctx.fillStyle = levelId === 4 ? '#35749e' : levelId === 3 ? '#26446b' : levelId === 2 ? '#4d2b24' : '#3d2a1d';
  ctx.beginPath();
  ctx.roundRect(mp.x, mp.y, mp.w, 16, 7);
  ctx.fill();

  // Frost-moss / snow-crest top rim
  ctx.shadowBlur = 0;
  ctx.fillStyle = levelId === 4 ? '#eefcff' : levelId === 3 ? '#aef4ff' : levelId === 2 ? '#ffb86c' : '#6be09a';
  ctx.beginPath();
  ctx.roundRect(mp.x + 4, mp.y + 1, mp.w - 8, 5, 3);
  ctx.fill();

  ctx.restore();
}

function drawSkyRing(ctx: CanvasRenderingContext2D, ring: SkyRing, time: number): void {
  ctx.save();
  const ready = ring.cooldown <= 0;
  const pulse = ready ? 1 + Math.sin(time * 3.4 + ring.phase) * 0.08 : 0.85;
  const alpha = ready ? 0.92 : 0.35;

  ctx.translate(ring.x, ring.y);
  ctx.scale(pulse, pulse);

  const halo = ctx.createRadialGradient(0, 0, ring.r * 0.3, 0, 0, ring.r * 1.45);
  halo.addColorStop(0, `rgba(155, 245, 255, ${0.28 * alpha})`);
  halo.addColorStop(0.6, `rgba(255, 224, 145, ${0.2 * alpha})`);
  halo.addColorStop(1, 'rgba(155, 245, 255, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, ring.r * 1.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(160, 248, 255, ${alpha})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = '#94f2ff';
  ctx.shadowBlur = ready ? 16 : 4;
  ctx.beginPath();
  ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
  ctx.stroke();

  // Rotating orbital rune nodes around the ring
  ctx.rotate(time * 1.6 + ring.phase);
  ctx.strokeStyle = `rgba(255, 224, 148, ${alpha * 0.85})`;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.arc(0, 0, ring.r - 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = `rgba(255, 244, 198, ${alpha})`;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * ring.r, Math.sin(a) * ring.r, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMushroom(ctx: CanvasRenderingContext2D, m: GlowMushroom): void {
  const squashY = 1 - m.bounce * 0.35;
  const stretchX = 1 + m.bounce * 0.28;
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(stretchX, squashY);

  // Soft bioluminescent ground aura under mushroom
  const baseGlow = ctx.createRadialGradient(0, -m.h * 0.65, 2, 0, -m.h * 0.65, m.r * 1.9);
  baseGlow.addColorStop(0, `${m.hue}55`);
  baseGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = baseGlow;
  ctx.beginPath();
  ctx.arc(0, -m.h * 0.65, m.r * 1.9, 0, Math.PI * 2);
  ctx.fill();

  // Tapered storybook ivory stem with subtle under-cap shadow
  const stemGrad = ctx.createLinearGradient(0, -m.h, 0, 0);
  stemGrad.addColorStop(0, '#bfe0da');
  stemGrad.addColorStop(0.55, '#eef8f6');
  stemGrad.addColorStop(1, '#c8dcd6');
  ctx.fillStyle = stemGrad;
  ctx.beginPath();
  ctx.moveTo(-7.5, 1);
  ctx.quadraticCurveTo(-4.8, -m.h * 0.55, -5.8, -m.h + 5);
  ctx.lineTo(5.8, -m.h + 5);
  ctx.quadraticCurveTo(4.8, -m.h * 0.55, 7.5, 1);
  ctx.closePath();
  ctx.fill();

  // Glowing striated gills rim underneath cap
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, -m.h + 4.5, m.r * 0.94, m.r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Luminous domed storybook cap
  ctx.shadowColor = m.hue;
  ctx.shadowBlur = 22;
  ctx.fillStyle = m.hue;
  ctx.beginPath();
  ctx.ellipse(0, -m.h + 4, m.r, m.r * 0.62, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(-m.r * 0.4, -m.h - 2.5, 3.2, 0, Math.PI * 2);
  ctx.arc(m.r * 0.24, -m.h - 5.5, 4, 0, Math.PI * 2);
  ctx.arc(m.r * 0.54, -m.h + 0.5, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLantern(ctx: CanvasRenderingContext2D, l: SpiritLantern): void {
  ctx.save();
  ctx.strokeStyle = '#253d42';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(l.x, l.y + 4);
  ctx.quadraticCurveTo(l.x - 4, l.y - 36, l.x + 12, l.y - 48);
  ctx.stroke();

  const lx = l.x + 12;
  const ly = l.y - 40;
  if (l.lit) {
    const halo = ctx.createRadialGradient(lx, ly, 3, lx, ly, 72);
    halo.addColorStop(0, `rgba(255, 232, 145, ${0.55 * l.glow})`);
    halo.addColorStop(0.5, `rgba(110, 255, 225, ${0.22 * l.glow})`);
    halo.addColorStop(1, 'rgba(110, 255, 225, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(lx, ly, 72, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = l.lit ? '#fff4b8' : '#2a474f';
  ctx.strokeStyle = l.lit ? '#ffd36e' : '#538087';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(lx - 7, ly - 9, 14, 18, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSanctuaryTree(
  ctx: CanvasRenderingContext2D,
  levelId: LevelId,
  sanctuaryAwakened: boolean,
  time: number
): void {
  const tx = SANCTUARY_X;
  const ty = getTerrainY(tx, levelId);
  ctx.save();

  const pulse = 1 + Math.sin(time * 2.2) * 0.05;
  const auraR = (sanctuaryAwakened ? 350 : 200) * pulse;
  const aura = ctx.createRadialGradient(tx, ty - 130, 15, tx, ty - 130, auraR);
  aura.addColorStop(
    0,
    sanctuaryAwakened
      ? 'rgba(255, 240, 165, 0.58)'
      : levelId === 1
        ? 'rgba(115, 255, 235, 0.28)'
        : levelId === 2
          ? 'rgba(255, 195, 140, 0.3)'
          : 'rgba(160, 238, 255, 0.34)'
  );
  aura.addColorStop(1, 'rgba(115, 255, 235, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(tx, ty - 130, auraR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = levelId === 1 ? '#d7f3f0' : levelId === 2 ? '#f7dfd4' : '#e6f6ff';
  ctx.beginPath();
  ctx.moveTo(tx - 54, ty + 10);
  ctx.quadraticCurveTo(tx - 20, ty - 75, tx - 18, ty - 190);
  ctx.lineTo(tx + 18, ty - 190);
  ctx.quadraticCurveTo(tx + 20, ty - 75, tx + 54, ty + 10);
  ctx.closePath();
  ctx.fill();

  // Carved glowing heartwood spiral rune on Sanctuary trunk
  ctx.strokeStyle = sanctuaryAwakened ? 'rgba(255, 232, 148, 0.85)' : 'rgba(130, 245, 225, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(tx, ty - 95, 11, 0.2, Math.PI * 1.85);
  ctx.stroke();

  const blossoms: Array<[number, number, number]> = [
    [0, -215, 92],
    [-75, -185, 65],
    [75, -185, 65],
    [-45, -245, 60],
    [48, -242, 60],
  ];
  blossoms.forEach(([dx, dy, r], idx) => {
    if (levelId === 1) {
      ctx.fillStyle = sanctuaryAwakened
        ? idx % 2 === 0
          ? 'rgba(135, 255, 232, 0.85)'
          : 'rgba(255, 224, 145, 0.85)'
        : 'rgba(110, 225, 215, 0.55)';
    } else if (levelId === 2) {
      ctx.fillStyle = sanctuaryAwakened
        ? idx % 2 === 0
          ? 'rgba(255, 215, 130, 0.88)'
          : 'rgba(255, 155, 195, 0.88)'
        : 'rgba(245, 175, 140, 0.58)';
    } else if (levelId === 3) {
      ctx.fillStyle = sanctuaryAwakened
        ? idx % 2 === 0
          ? 'rgba(155, 246, 255, 0.9)'
          : 'rgba(210, 175, 255, 0.9)'
        : 'rgba(155, 218, 255, 0.6)';
    } else {
      ctx.fillStyle = sanctuaryAwakened
        ? idx % 2 === 0
          ? 'rgba(140, 255, 232, 0.9)'
          : 'rgba(255, 232, 158, 0.9)'
        : 'rgba(195, 245, 255, 0.65)';
    }
    ctx.beginPath();
    ctx.arc(tx + dx, ty + dy, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  levelId: LevelId,
  groundTop: string,
  groundBot: string,
  rimCol: string,
  cameraX: number,
  cameraY: number,
  viewW: number,
  viewH: number
): void {
  const startX = Math.floor((cameraX - 48) / 24) * 24;
  const endX = cameraX + viewW + 72;
  const bottomY = cameraY + viewH + 130;

  const barkDeep =
    levelId === 1 ? '#16110c' : levelId === 2 ? '#1e100d' : levelId === 3 ? '#0f1927' : '#0e1b29';
  const barkRoot =
    levelId === 1 ? '#362619' : levelId === 2 ? '#47251b' : levelId === 3 ? '#20344d' : '#1f3650';
  const barkHighlight =
    levelId === 1 ? '#61452d' : levelId === 2 ? '#784531' : levelId === 3 ? '#43658a' : '#4e769e';
  const mossTop =
    levelId === 1 ? '#45a860' : levelId === 2 ? '#cf7d3e' : levelId === 3 ? '#62c2e3' : '#d2f3ff';
  const floraA =
    levelId === 1 ? '#57fae3' : levelId === 2 ? '#ffbe6e' : levelId === 3 ? '#8ef3ff' : '#85f3ff';
  const floraB =
    levelId === 1 ? '#ff72dc' : levelId === 2 ? '#ff82b8' : levelId === 3 ? '#c8adff' : '#d8f8ff';

  // Softly blended forest earth & root bank so painted backdrop flora subtly harmonizes underneath
  const gGrad = ctx.createLinearGradient(0, BASE_GROUND_Y - 60, 0, bottomY);
  gGrad.addColorStop(0, groundTop);
  gGrad.addColorStop(0.22, barkDeep);
  gGrad.addColorStop(0.75, groundBot);
  gGrad.addColorStop(1, '#04090d');

  ctx.save();
  ctx.fillStyle = gGrad;
  ctx.beginPath();
  ctx.moveTo(startX, bottomY);
  for (let x = startX; x <= endX; x += 24) {
    ctx.lineTo(x, getTerrainY(x, levelId));
  }
  ctx.lineTo(endX, bottomY);
  ctx.closePath();
  ctx.fill();

  // Lush mossy crust hugging the walkable terrain rim
  ctx.fillStyle = mossTop;
  ctx.globalAlpha = 0.62;
  ctx.beginPath();
  ctx.moveTo(startX, bottomY);
  for (let x = startX; x <= endX; x += 24) {
    ctx.lineTo(x, getTerrainY(x, levelId));
  }
  for (let x = endX; x >= startX; x -= 24) {
    const wave = 6 + Math.sin(x * 0.045) * 2.5;
    ctx.lineTo(x, getTerrainY(x, levelId) + wave);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Delicate sweeping gnarled root contours, tucked glowing mushrooms & ferns below the ground line
  ctx.save();
  const rootStep = 168;
  const firstBucket = Math.floor((startX - 120) / rootStep) * rootStep;
  for (let rx = firstBucket; rx <= endX + 120; rx += rootStep) {
    const ry = getTerrainY(rx, levelId);
    const seed = Math.abs(Math.sin(rx * 0.0173)) * 1000;
    const tilt = (seed % 24) - 12;

    // Tapered sweeping root rib
    ctx.strokeStyle = barkRoot;
    ctx.lineWidth = 7 + (seed % 4);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rx - 18, ry + 11);
    ctx.bezierCurveTo(rx + 22, ry + 5 + tilt * 0.3, rx + 58, ry + 34, rx + 116, ry + 62);
    ctx.stroke();

    // Fine carved wood highlight along upper root ridge
    ctx.strokeStyle = barkHighlight;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(rx - 14, ry + 7);
    ctx.bezierCurveTo(rx + 22, ry + 2 + tilt * 0.3, rx + 58, ry + 29, rx + 112, ry + 56);
    ctx.stroke();

    // Secondary cross-root
    ctx.strokeStyle = barkRoot;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(rx + 36, ry + 58);
    ctx.quadraticCurveTo(rx + 84, ry + 24, rx + 144, ry + 38);
    ctx.stroke();

    // Small glowing botanical mushroom buds tucked neatly beneath root edge
    const mx = rx + 52;
    const my = ry + 48;
    const mCol = Math.floor(seed) % 3 === 0 ? floraB : floraA;

    const glow = ctx.createRadialGradient(mx, my - 6, 1, mx, my - 6, 18);
    glow.addColorStop(0, `${mCol}45`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my - 6, 18, 0, Math.PI * 2);
    ctx.fill();

    const buds: Array<[number, number, number, number]> = [
      [0, 0, 7.5, 11],
      [-8, 2, 5.2, 7.5],
      [7, 3, 4.4, 6],
    ];
    for (const [ox, oy, capR, stemH] of buds) {
      ctx.strokeStyle = '#d7efe9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx + ox, my + oy);
      ctx.quadraticCurveTo(mx + ox - 0.8, my + oy - stemH * 0.5, mx + ox, my + oy - stemH + 1);
      ctx.stroke();

      ctx.fillStyle = mCol;
      ctx.beginPath();
      ctx.ellipse(mx + ox, my + oy - stemH + 1.5, capR, capR * 0.56, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
    }

    // Fine glowing bioluminescent fern fronds & spore motes
    const fx = rx + 114;
    const fy = ry + 56;
    ctx.strokeStyle = floraA;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.3;
    for (let f = -1; f <= 1; f++) {
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(fx + f * 7, fy - 10, fx + f * 12, fy - 16 + Math.abs(f) * 3);
      ctx.stroke();
      ctx.fillStyle = floraA;
      ctx.beginPath();
      ctx.arc(fx + f * 12, fy - 16 + Math.abs(f) * 3, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (levelId === 4) {
      ctx.fillStyle = 'rgba(185, 244, 255, 0.6)';
      for (let ic = 0; ic < 2; ic++) {
        const ix = rx + 28 + ic * 28;
        const iy = ry + 20 + ic * 6;
        ctx.beginPath();
        ctx.moveTo(ix - 2.4, iy);
        ctx.lineTo(ix + 2.4, iy);
        ctx.lineTo(ix, iy + 8 + ic * 3);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // Crisp luminous ground rim highlight
  ctx.strokeStyle = rimCol;
  ctx.lineWidth = levelId === 4 ? 3.2 : 2.5;
  ctx.beginPath();
  for (let x = startX; x <= endX; x += 24) {
    const y = getTerrainY(x, levelId);
    if (x === startX) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawGrassAndFlowers(
  ctx: CanvasRenderingContext2D,
  world: WorldData,
  levelId: LevelId,
  cameraX: number,
  viewW: number
): void {
  const bladeColor =
    levelId === 1 ? '#4cd19b' : levelId === 2 ? '#d6854d' : levelId === 3 ? '#74d2ee' : '#9eeaff';
  for (const g of world.grassTufts) {
    if (g.x < cameraX - 24 || g.x > cameraX + viewW + 24) continue;
    const tipX = g.x + g.bend * g.h;
    const tipY = g.y - g.h;
    ctx.strokeStyle = bladeColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y + 3);
    ctx.quadraticCurveTo(g.x + g.bend * 5, g.y - g.h * 0.5, tipX, tipY);
    ctx.stroke();

    // Side frond blade for fuller mossy undergrowth
    ctx.beginPath();
    ctx.moveTo(g.x + 2, g.y + 3);
    ctx.quadraticCurveTo(g.x + 4 - g.bend * 3, g.y - g.h * 0.4, g.x + 4 - g.bend * g.h * 0.7, g.y - g.h * 0.72);
    ctx.stroke();

    if (g.hasFlower) {
      ctx.fillStyle = g.flowerHue;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff9d6';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCollectible(
  ctx: CanvasRenderingContext2D,
  item: CollectibleItem,
  time: number
): void {
  ctx.save();
  if (item.kind === 'orb') {
    const halo = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 26);
    halo.addColorStop(0, 'rgba(255, 255, 235, 0.95)');
    halo.addColorStop(0.4, 'rgba(105, 255, 232, 0.55)');
    halo.addColorStop(1, 'rgba(105, 255, 232, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(item.x, item.y, 5.2, 0, Math.PI * 2);
    ctx.fill();

    const wx = item.x + Math.cos(time * 3.5 + item.phase) * 11;
    const wy = item.y + Math.sin(time * 3.5 + item.phase) * 6;
    ctx.fillStyle = '#a3fff0';
    ctx.beginPath();
    ctx.arc(wx, wy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.kind === 'blossom') {
    // 5-petal Golden Sun Blossom (restores 1 Spirit Petal!)
    const halo = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 30);
    halo.addColorStop(0, 'rgba(255, 232, 160, 0.85)');
    halo.addColorStop(0.5, 'rgba(255, 165, 120, 0.32)');
    halo.addColorStop(1, 'rgba(255, 165, 120, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(item.x, item.y);
    ctx.rotate(Math.sin(time * 1.8 + item.phase) * 0.25);
    for (let i = 0; i < 5; i++) {
      const ang = (i * Math.PI * 2) / 5;
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = i % 2 === 0 ? '#ffd67a' : '#ffae94';
      ctx.beginPath();
      ctx.ellipse(0, -6.5, 3.6, 6.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#fffbe0';
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.kind === 'crystal') {
    // Rotating Faceted Prism Crystal (grants temporary Spirit Pulse boost!)
    const halo = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 30);
    halo.addColorStop(0, 'rgba(205, 175, 255, 0.85)');
    halo.addColorStop(0.5, 'rgba(115, 240, 255, 0.35)');
    halo.addColorStop(1, 'rgba(115, 240, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(item.x, item.y);
    const spinW = 0.65 + 0.35 * Math.abs(Math.cos(time * 2.4 + item.phase));
    ctx.scale(spinW, 1);
    ctx.fillStyle = '#b4f5ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(210, 130, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fill();
  } else if (item.kind === 'starseed') {
    // Rotating 4-Pointed Astral Star Seed (grants temporary Triple Jump!)
    const halo = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 32);
    halo.addColorStop(0, 'rgba(215, 245, 255, 0.92)');
    halo.addColorStop(0.45, 'rgba(175, 145, 255, 0.44)');
    halo.addColorStop(1, 'rgba(175, 145, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(item.x, item.y);
    ctx.rotate(time * 1.4 + item.phase);
    ctx.fillStyle = '#d9f4ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 12.5 : 4.2;
      const a = (i * Math.PI) / 4;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff5b8';
    ctx.beginPath();
    ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.kind === 'highjump') {
    // Sky-Spring Feather (grants +5 Higher Jumps!)
    const halo = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 32);
    halo.addColorStop(0, 'rgba(155, 255, 225, 0.9)');
    halo.addColorStop(0.5, 'rgba(255, 225, 130, 0.42)');
    halo.addColorStop(1, 'rgba(155, 255, 225, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(item.x, item.y);
    const bounce = Math.sin(time * 4 + item.phase) * 2.5;
    ctx.translate(0, bounce);

    ctx.fillStyle = '#8cf8e8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.quadraticCurveTo(9, -3, 0, 12);
    ctx.quadraticCurveTo(-9, -3, 0, -13);
    ctx.fill();
    ctx.stroke();

    // Upward golden chevron
    ctx.strokeStyle = '#ffe18c';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, 2);
    ctx.lineTo(0, -5);
    ctx.lineTo(5, 2);
    ctx.stroke();
  } else {
    // Collectible Flying Flower (activate for 5s of free flight & item magnet!)
    const halo = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 34);
    halo.addColorStop(0, 'rgba(255, 190, 240, 0.95)');
    halo.addColorStop(0.5, 'rgba(255, 225, 145, 0.45)');
    halo.addColorStop(1, 'rgba(255, 160, 225, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(item.x, item.y);
    const flutter = Math.sin(time * 6 + item.phase) * 0.16;
    ctx.rotate(flutter);
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6;
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = i % 2 === 0 ? '#ff9ee8' : '#ffe294';
      ctx.beginPath();
      ctx.ellipse(0, -7.5, 4.2, 6.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawButterfly(
  ctx: CanvasRenderingContext2D,
  bf: WoodlandButterfly,
  time: number
): void {
  const wing = Math.abs(Math.sin(time * 14 + bf.phase)) * 6 + 2;
  ctx.save();
  ctx.translate(bf.x, bf.y);
  ctx.fillStyle = bf.color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(-3, -2, wing, 3.2, -0.4, 0, Math.PI * 2);
  ctx.ellipse(3, -2, wing, 3.2, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMermaidPool(
  ctx: CanvasRenderingContext2D,
  c: MagicalCreature,
  time: number
): void {
  ctx.save();
  const px = c.homeX;
  const py = c.homeY + 4;

  const poolGlow = ctx.createRadialGradient(px, py, 6, px, py, 68);
  poolGlow.addColorStop(0, 'rgba(115, 250, 238, 0.55)');
  poolGlow.addColorStop(0.65, 'rgba(72, 185, 225, 0.25)');
  poolGlow.addColorStop(1, 'rgba(40, 110, 150, 0)');
  ctx.fillStyle = poolGlow;
  ctx.beginPath();
  ctx.ellipse(px, py, 68, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(28, 92, 122, 0.72)';
  ctx.beginPath();
  ctx.ellipse(px, py, 50, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Animated water ripples
  const rip = (time * 0.9 + c.phase) % 1;
  ctx.strokeStyle = `rgba(195, 255, 250, ${0.55 * (1 - rip)})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(px, py, 16 + rip * 34, 4 + rip * 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Floating bubbles over the pool
  for (let i = 0; i < 3; i++) {
    const bProgress = (time * 0.55 + i * 0.33 + c.phase) % 1;
    const bx = px + Math.sin(time * 2 + i * 2) * 18;
    const by = py - bProgress * 28;
    ctx.fillStyle = `rgba(215, 255, 255, ${0.5 * (1 - bProgress)})`;
    ctx.beginPath();
    ctx.arc(bx, by, 1.8 + (i % 2) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMagicalCreature(
  ctx: CanvasRenderingContext2D,
  c: MagicalCreature,
  time: number
): void {
  ctx.save();
  ctx.globalAlpha = clamp(c.emerge * 1.25, 0, 1);

  if (c.kind === 'mermaid') {
    // Clip just below the lagoon pool surface so she gracefully emerges out of water
    ctx.beginPath();
    ctx.rect(c.homeX - 80, c.homeY - 140, 160, 146);
    ctx.clip();

    const aura = ctx.createRadialGradient(c.x, c.y - 24, 3, c.x, c.y - 24, 38);
    aura.addColorStop(0, 'rgba(180, 255, 245, 0.55)');
    aura.addColorStop(1, 'rgba(120, 220, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 24, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(c.x, c.y);
    ctx.scale(c.facing, 1);

    // Shimmering curved mermaid tail & fluke
    const tailWag = Math.sin(time * 3.2 + c.phase) * 4;
    ctx.fillStyle = c.huePrimary;
    ctx.beginPath();
    ctx.moveTo(-6, -16);
    ctx.quadraticCurveTo(-14, -4, -18 + tailWag * 0.4, 7);
    ctx.quadraticCurveTo(-6, 12, 4, 4);
    ctx.quadraticCurveTo(6, -6, 5, -16);
    ctx.closePath();
    ctx.fill();

    // Fin fluke
    ctx.fillStyle = c.hueAccent;
    ctx.globalAlpha *= 0.9;
    ctx.beginPath();
    ctx.moveTo(-18 + tailWag * 0.4, 6);
    ctx.quadraticCurveTo(-30 + tailWag, 2, -26 + tailWag, 14);
    ctx.quadraticCurveTo(-18 + tailWag * 0.5, 11, -14 + tailWag * 0.4, 8);
    ctx.fill();
    ctx.globalAlpha = clamp(c.emerge * 1.25, 0, 1);

    // Flowing sea-hair
    ctx.fillStyle = c.huePrimary;
    ctx.beginPath();
    ctx.moveTo(-2, -39);
    ctx.quadraticCurveTo(-16, -34, -14 + Math.sin(time * 2.8) * 3, -15);
    ctx.quadraticCurveTo(-5, -20, -2, -31);
    ctx.fill();

    // Torso & shell bodice
    ctx.fillStyle = '#ffe9de';
    ctx.beginPath();
    ctx.ellipse(0, -24, 5.2, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.hueAccent;
    ctx.beginPath();
    ctx.ellipse(1, -24, 5.2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Waving arm
    const waveAng = Math.sin(time * 5 + c.phase) * 0.35;
    ctx.save();
    ctx.translate(4, -27);
    ctx.rotate(waveAng - 0.5);
    ctx.strokeStyle = '#ffe9de';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -6);
    ctx.stroke();
    ctx.restore();

    // Head & Pearl Crown
    ctx.fillStyle = '#ffe9de';
    ctx.beginPath();
    ctx.arc(1, -37, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff9d6';
    ctx.beginPath();
    ctx.arc(1, -43.5, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#123642';
    ctx.beginPath();
    ctx.arc(3.4, -37.2, 1.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (c.kind === 'fairy') {
    const aura = ctx.createRadialGradient(c.x, c.y - 10, 2, c.x, c.y - 10, 28);
    aura.addColorStop(0, 'rgba(255, 248, 210, 0.72)');
    aura.addColorStop(0.55, `${c.huePrimary}44`);
    aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 10, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(c.x, c.y - 10);
    ctx.scale(c.facing, 1);

    // Fluttering translucent fairy wings
    const wingBeat = 0.55 + 0.45 * Math.sin(time * 18 + c.phase);
    ctx.fillStyle = c.huePrimary;
    ctx.globalAlpha = clamp(c.emerge, 0, 1) * 0.75;
    ctx.beginPath();
    ctx.ellipse(-6, -4, 9 * wingBeat + 2, 4.5, -0.55, 0, Math.PI * 2);
    ctx.ellipse(-5, 3, 6.5 * wingBeat + 1.5, 3.2, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = clamp(c.emerge * 1.25, 0, 1);

    // Petal dress & luminous head
    ctx.fillStyle = c.huePrimary;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-5.5, 7);
    ctx.lineTo(5.5, 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff6ea';
    ctx.beginPath();
    ctx.arc(0.5, -9, 4.3, 0, Math.PI * 2);
    ctx.fill();

    // Glowing wand spark
    ctx.strokeStyle = '#ffeeb8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(3, -1);
    ctx.lineTo(10, -7);
    ctx.stroke();
    ctx.fillStyle = c.hueAccent;
    ctx.beginPath();
    ctx.arc(10.5, -7.5, 2.2 + Math.sin(time * 8) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (c.kind === 'fox') {
    const aura = ctx.createRadialGradient(c.x, c.y - 14, 2, c.x, c.y - 14, 30);
    aura.addColorStop(0, `${c.hueAccent}55`);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 14, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(c.x, c.y);
    ctx.scale(c.facing, 1);

    // Twin spirit tails
    const wag = Math.sin(time * 4.2 + c.phase) * 4;
    ctx.fillStyle = c.hueAccent;
    ctx.beginPath();
    ctx.moveTo(-6, -10);
    ctx.quadraticCurveTo(-22, -20 + wag, -20, -28 + wag);
    ctx.quadraticCurveTo(-12, -22, -4, -12);
    ctx.fill();

    ctx.fillStyle = c.huePrimary;
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.quadraticCurveTo(-20, -10 - wag * 0.6, -22, -18 - wag * 0.6);
    ctx.quadraticCurveTo(-12, -16, -4, -10);
    ctx.fill();

    // Body
    ctx.fillStyle = c.huePrimary;
    ctx.beginPath();
    ctx.ellipse(0, -10, 8.5, 10, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Chest fluff
    ctx.fillStyle = '#fff9eb';
    ctx.beginPath();
    ctx.ellipse(4, -10, 4, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head & pointed ears
    ctx.fillStyle = c.huePrimary;
    ctx.beginPath();
    ctx.arc(4, -22, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1, -26);
    ctx.lineTo(-4, -36);
    ctx.lineTo(3, -28);
    ctx.moveTo(4, -27);
    ctx.lineTo(7, -36);
    ctx.lineTo(9, -26);
    ctx.fill();

    // Bright eye & nose
    ctx.fillStyle = '#152530';
    ctx.beginPath();
    ctx.arc(7, -22.5, 1.3, 0, Math.PI * 2);
    ctx.arc(10.5, -20.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Starlight Owl
    const aura = ctx.createRadialGradient(c.x, c.y - 12, 2, c.x, c.y - 12, 28);
    aura.addColorStop(0, 'rgba(220, 245, 255, 0.45)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(c.x, c.y - 12, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(c.x, c.y - 12);
    const wingOpen = c.blessTimer > 0 ? Math.abs(Math.sin(time * 9)) * 7 + 4 : 1.5;

    // Wings
    ctx.fillStyle = c.huePrimary;
    ctx.beginPath();
    ctx.ellipse(-9 - wingOpen * 0.4, 0, 5 + wingOpen * 0.6, 8, 0.4, 0, Math.PI * 2);
    ctx.ellipse(9 + wingOpen * 0.4, 0, 5 + wingOpen * 0.6, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = c.huePrimary;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.5, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ear tufts
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(-9, -15);
    ctx.lineTo(-2, -10);
    ctx.moveTo(6, -8);
    ctx.lineTo(9, -15);
    ctx.lineTo(2, -10);
    ctx.fill();

    // Luminous starry eyes & beak
    ctx.fillStyle = c.hueAccent;
    ctx.beginPath();
    ctx.arc(-3.2, -4, 2.2, 0, Math.PI * 2);
    ctx.arc(3.2, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#132433';
    ctx.beginPath();
    ctx.arc(-3.2, -4, 1, 0, Math.PI * 2);
    ctx.arc(3.2, -4, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd27a';
    ctx.beginPath();
    ctx.moveTo(-1.8, -1.8);
    ctx.lineTo(1.8, -1.8);
    ctx.lineTo(0, 1.4);
    ctx.closePath();
    ctx.fill();
  }

  // Subtle unblessed sparkle hint or celebratory rising stars
  if (!c.blessed && c.emerge > 0.65) {
    const bob = Math.sin(time * 4 + c.phase) * 3;
    ctx.fillStyle = '#ffe99e';
    ctx.beginPath();
    ctx.arc(0, c.kind === 'fairy' ? -22 + bob : c.kind === 'owl' ? -24 + bob : -52 + bob, 2.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (c.blessTimer > 0) {
    const p = 1 - c.blessTimer / 2.2;
    ctx.fillStyle = `rgba(255, 232, 150, ${1 - p})`;
    ctx.beginPath();
    ctx.arc(-8, -32 - p * 26, 2.6, 0, Math.PI * 2);
    ctx.arc(8, -28 - p * 30, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawForestBaddie(ctx: CanvasRenderingContext2D, b: ForestBaddie, time: number): void {
  ctx.save();

  // Clip below terrain surface so they emerge smoothly out of the moss/earth
  ctx.beginPath();
  ctx.rect(b.x - 56, b.homeY - 96, 112, 98);
  ctx.clip();

  const stunned = b.stunnedTimer > 0;
  ctx.globalAlpha = Math.min(1, b.emerge * 1.15) * (stunned ? 0.55 : 1);

  // Subtle warning ground glow before fully popped up
  if (!stunned && b.emerge > 0.15) {
    const aura = ctx.createRadialGradient(b.x, b.y - 16, 2, b.x, b.y - 16, 28);
    aura.addColorStop(0, b.kind === 'gnome' ? 'rgba(255, 108, 120, 0.32)' : 'rgba(210, 96, 255, 0.32)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(b.x, b.y - 16, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.translate(b.x, b.y);
  ctx.scale(b.facing, stunned ? 0.82 : 1);
  const waddle = stunned ? 0 : Math.sin(time * 7 + b.phase) * 1.4;
  ctx.translate(0, waddle);

  if (b.kind === 'gnome') {
    // Little boots
    ctx.fillStyle = '#24172b';
    ctx.beginPath();
    ctx.ellipse(-5, -2.5, 4.2, 2.6, 0, 0, Math.PI * 2);
    ctx.ellipse(5, -2.5, 4.2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark shadow cloak
    ctx.fillStyle = '#281d38';
    ctx.beginPath();
    ctx.moveTo(-12, -3);
    ctx.quadraticCurveTo(-10, -21, 0, -23);
    ctx.quadraticCurveTo(10, -21, 12, -3);
    ctx.closePath();
    ctx.fill();

    // Pointy beard
    ctx.fillStyle = '#cfd9e8';
    ctx.beginPath();
    ctx.moveTo(-6, -15);
    ctx.quadraticCurveTo(0, -14, 7, -15);
    ctx.lineTo(1, -5);
    ctx.closePath();
    ctx.fill();

    // Face & mischievous yellow eyes
    ctx.fillStyle = '#3d2847';
    ctx.beginPath();
    ctx.ellipse(1, -18, 6.8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = stunned ? '#b5b8c9' : '#ffe36e';
    ctx.beginPath();
    ctx.arc(3.8, -18.5, 1.5, 0, Math.PI * 2);
    ctx.arc(0.4, -18.5, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Tall crimson mushroom-cap gnome hat with spotted dots
    ctx.fillStyle = '#c92e54';
    ctx.beginPath();
    ctx.moveTo(-13, -19);
    ctx.quadraticCurveTo(0, -23, 13, -19);
    ctx.quadraticCurveTo(8, -36, -1, -40);
    ctx.quadraticCurveTo(-10, -33, -13, -19);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff3d1';
    ctx.beginPath();
    ctx.arc(-4.5, -24.5, 1.9, 0, Math.PI * 2);
    ctx.arc(3.5, -26, 2.2, 0, Math.PI * 2);
    ctx.arc(-0.5, -32.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Bramble Imp: thorny violet body, jagged curved horns, glowing magenta eyes
    ctx.fillStyle = '#3b1c4f';
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(-14, -12);
    ctx.lineTo(-9, -15);
    ctx.lineTo(-11, -24);
    ctx.lineTo(0, -26);
    ctx.lineTo(11, -24);
    ctx.lineTo(9, -15);
    ctx.lineTo(14, -12);
    ctx.lineTo(12, -2);
    ctx.closePath();
    ctx.fill();

    // Bramble leaf/thorn collar
    ctx.strokeStyle = '#9b59d6';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-11, -14);
    ctx.lineTo(0, -10);
    ctx.lineTo(11, -14);
    ctx.stroke();

    // Curved jagged horns
    ctx.fillStyle = '#d1a8ff';
    ctx.beginPath();
    ctx.moveTo(-5, -24);
    ctx.quadraticCurveTo(-11, -34, -4, -37);
    ctx.quadraticCurveTo(-5, -30, -1, -25);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(5, -24);
    ctx.quadraticCurveTo(12, -34, 6, -37);
    ctx.quadraticCurveTo(6, -30, 2, -25);
    ctx.closePath();
    ctx.fill();

    // Glowing magenta eyes & grin
    ctx.fillStyle = stunned ? '#b5b8c9' : '#ff68cf';
    ctx.beginPath();
    ctx.arc(4.2, -17, 1.8, 0, Math.PI * 2);
    ctx.arc(-1.2, -17, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffd2ee';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(2, -13.5, 3.6, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  ctx.restore();

  // Dizzy stars overhead when stunned/defeated
  if (stunned) {
    ctx.save();
    for (let s = 0; s < 3; s++) {
      const ang = time * 5.2 + (s * Math.PI * 2) / 3;
      const sx = b.x + Math.cos(ang) * 14;
      const sy = b.y - 38 + Math.sin(ang) * 4;
      ctx.fillStyle = '#ffe58f';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawThornWisp(ctx: CanvasRenderingContext2D, w: ThornWisp, time: number): void {
  ctx.save();
  const stunned = w.stunnedTimer > 0;
  ctx.globalAlpha = stunned ? 0.35 : 1;

  if (!stunned && w.telegraphTimer > 0.15) {
    const ringR = 16 + w.telegraphTimer * 24;
    ctx.strokeStyle = `rgba(255, 118, 168, ${w.telegraphTimer * 0.75})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w.x, w.y, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }

  const aura = ctx.createRadialGradient(w.x, w.y, 3, w.x, w.y, 28);
  aura.addColorStop(0, stunned ? 'rgba(130, 175, 220, 0.5)' : 'rgba(255, 92, 148, 0.65)');
  aura.addColorStop(0.5, stunned ? 'rgba(65, 85, 130, 0.2)' : 'rgba(128, 36, 98, 0.35)');
  aura.addColorStop(1, 'rgba(30, 10, 40, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(w.x, w.y, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(w.x, w.y);
  ctx.rotate(time * (stunned ? 0.4 : 2.1));
  ctx.fillStyle = stunned ? '#6b7e99' : '#2a0f2e';
  ctx.strokeStyle = stunned ? '#9cb3cc' : '#ff6b9d';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const spikes = 6;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 12 : 6.5;
    const ang = (i * Math.PI) / spikes;
    if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number,
  equipped: PlayerLoadout
): void {
  if (player.invulnTimer > 0 && Math.floor(time * 18) % 2 === 0) {
    return;
  }

  ctx.save();

  const boosted = player.crystalBoostTimer > 0;
  const astralJump = player.extraAirJumpTimer > 0;

  let scarfColor = '#7bfce6';
  let cloakFill = '#e8fffb';
  let cloakTrim: string | null = null;
  if (equipped.cloak === 'sunset_ember') {
    scarfColor = '#ffb86c';
    cloakFill = '#ffe2c2';
    cloakTrim = '#ff866b';
  } else if (equipped.cloak === 'sakura_petal') {
    scarfColor = '#ff9ee4';
    cloakFill = '#ffe3f6';
    cloakTrim = '#ffd280';
  } else if (equipped.cloak === 'starweave_mantle') {
    scarfColor = '#a6a8ff';
    cloakFill = '#dcdbff';
    cloakTrim = '#6e72e8';
  } else if (equipped.cloak === 'ocean_tide') {
    scarfColor = '#48e5ff';
    cloakFill = '#d4fbff';
    cloakTrim = '#29b6f6';
  } else if (equipped.cloak === 'prism_aurora') {
    const hueShift = 0.5 + 0.5 * Math.sin(time * 3);
    scarfColor = hueShift > 0.5 ? '#7cfce7' : '#e0b3ff';
    cloakFill = '#ecfeff';
    cloakTrim = hueShift > 0.5 ? '#7cfce7' : '#c79eff';
  } else if (equipped.cloak === 'ranger_cape') {
    scarfColor = '#65d68a';
    cloakFill = '#2c6b45';
    cloakTrim = '#d9b26f';
  } else if (equipped.cloak === 'dragonscale_cloak') {
    scarfColor = '#ff7a52';
    cloakFill = '#781f24';
    cloakTrim = '#ffc857';
  } else if (equipped.cloak === 'fairy_gossamer') {
    scarfColor = '#ffb8f2';
    cloakFill = '#fce4ff';
    cloakTrim = '#ffd87a';
  } else if (equipped.cloak === 'shadow_velvet') {
    scarfColor = '#c28cff';
    cloakFill = '#48346e';
    cloakTrim = '#ffd87a';
  }

  if (boosted) scarfColor = '#ffe08c';
  else if (astralJump) scarfColor = '#c7b8ff';

  ctx.strokeStyle = scarfColor;
  ctx.lineCap = 'round';
  ctx.shadowColor = boosted ? '#ffd266' : astralJump ? '#c7b8ff' : scarfColor;
  ctx.shadowBlur = 12;
  for (let i = 0; i < player.scarf.length - 1; i++) {
    ctx.lineWidth = Math.max(1.5, 6.5 - i * 0.55);
    ctx.globalAlpha = 0.85 - i * 0.07;
    ctx.beginPath();
    ctx.moveTo(player.scarf[i].x, player.scarf[i].y);
    ctx.lineTo(player.scarf[i + 1].x, player.scarf[i + 1].y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const bodyY = player.y - 18 * player.squash;
  const auraR = boosted || astralJump ? 56 : 44;
  const aura = ctx.createRadialGradient(player.x, bodyY, 4, player.x, bodyY, auraR);
  aura.addColorStop(
    0,
    boosted
      ? 'rgba(255, 224, 140, 0.42)'
      : astralJump
        ? 'rgba(186, 165, 255, 0.42)'
        : 'rgba(140, 255, 238, 0.36)'
  );
  aura.addColorStop(1, 'rgba(140, 255, 238, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(player.x, bodyY, auraR, 0, Math.PI * 2);
  ctx.fill();

  if (astralJump) {
    ctx.save();
    ctx.strokeStyle = 'rgba(205, 190, 255, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(player.x, bodyY, 27 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Firefly Companion (orbits near the player in world space)
  if (equipped.charm === 'firefly_sprite') {
    const fx = player.x - player.facing * 24 + Math.cos(time * 3.1) * 8;
    const fy = bodyY - 14 + Math.sin(time * 4.4) * 7;
    const fHalo = ctx.createRadialGradient(fx, fy, 1, fx, fy, 16);
    fHalo.addColorStop(0, 'rgba(255, 240, 150, 0.95)');
    fHalo.addColorStop(1, 'rgba(255, 210, 90, 0)');
    ctx.fillStyle = fHalo;
    ctx.beginPath();
    ctx.arc(fx, fy, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Starlight Owlet companion orbiting beside player
  if (equipped.charm === 'mini_owl') {
    const ox = player.x - player.facing * 26 + Math.sin(time * 2.4) * 5;
    const oy = bodyY - 22 + Math.cos(time * 3.8) * 5;
    ctx.save();
    ctx.fillStyle = 'rgba(168, 235, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(ox, oy, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dff7ff';
    ctx.beginPath();
    ctx.ellipse(ox, oy, 5.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    const wingY = Math.sin(time * 12) * 2;
    ctx.fillStyle = '#99e2ff';
    ctx.beginPath();
    ctx.ellipse(ox - 5, oy + wingY * 0.4, 3, 4.5, 0.4, 0, Math.PI * 2);
    ctx.ellipse(ox + 5, oy + wingY * 0.4, 3, 4.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#122638';
    ctx.beginPath();
    ctx.arc(ox - 2, oy - 2, 1.1, 0, Math.PI * 2);
    ctx.arc(ox + 2, oy - 2, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Pixie Dust Lantern & Verdant Knight Shield charms
  if (equipped.charm === 'fairy_sparkle_wand') {
    const lx = player.x - player.facing * 23;
    const ly = bodyY - 12 + Math.sin(time * 4.2) * 5;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 182, 246, 0.35)';
    ctx.beginPath();
    ctx.arc(lx, ly, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd1fa';
    ctx.beginPath();
    ctx.arc(lx, ly, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (equipped.charm === 'knight_crest') {
    const sx = player.x + Math.cos(time * 2.5) * 26;
    const sy = bodyY - 4 + Math.sin(time * 2.5) * 6;
    ctx.save();
    ctx.fillStyle = '#3e6e94';
    ctx.strokeStyle = '#b8e0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy - 6);
    ctx.lineTo(sx + 5, sy - 6);
    ctx.lineTo(sx + 5, sy + 1);
    ctx.lineTo(sx, sy + 7);
    ctx.lineTo(sx - 5, sy + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Super Power Auras & Wings
  if (equipped.power === 'super_star_magnet') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 158, 232, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.arc(player.x, bodyY, 34 + Math.sin(time * 4) * 3, time * 1.4, time * 1.4 + Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (equipped.power === 'super_fairy_sparkle') {
    ctx.save();
    for (let s = 0; s < 5; s++) {
      const ang = time * 2.8 + (s * Math.PI * 2) / 5;
      const sx = player.x + Math.cos(ang) * 29;
      const sy = bodyY + Math.sin(ang * 1.3) * 16;
      ctx.fillStyle = s % 2 === 0 ? '#ff9ef0' : '#ffe494';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (equipped.power === 'super_nova_pulse') {
    ctx.save();
    const novaR = 32 + Math.sin(time * 5) * 3;
    ctx.strokeStyle = 'rgba(255, 216, 107, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, bodyY, novaR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (equipped.power === 'super_sky_leap') {
    ctx.save();
    ctx.strokeStyle = 'rgba(124, 252, 231, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(player.x, player.y - 4, 16 + Math.sin(time * 6) * 2, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (equipped.power === 'super_phoenix_wings') {
    const flap = Math.sin(time * (player.gliding || player.flyingTimer > 0 ? 13 : 5)) * 5;
    const span = player.gliding || player.flyingTimer > 0 ? 22 : 14;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 134, 72, 0.85)';
    ctx.strokeStyle = '#ffe082';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(player.x - span * 0.72, bodyY - 8 + flap * 0.4, span * 0.75, 6.5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(player.x + span * 0.72, bodyY - 8 + flap * 0.4, span * 0.75, 6.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (equipped.power === 'super_dragon_wings') {
    const flap = Math.sin(time * (player.gliding || player.flyingTimer > 0 ? 11 : 4.5)) * 6;
    const wSpan = player.gliding || player.flyingTimer > 0 ? 28 : 20;
    ctx.save();
    ctx.fillStyle = '#248f74';
    ctx.strokeStyle = '#ff9966';
    ctx.lineWidth = 1.6;
    // Left bat-like dragon wing
    ctx.beginPath();
    ctx.moveTo(player.x - 4, bodyY - 4);
    ctx.lineTo(player.x - wSpan, bodyY - 22 + flap);
    ctx.lineTo(player.x - wSpan * 0.78, bodyY - 6 + flap * 0.5);
    ctx.lineTo(player.x - wSpan * 0.4, bodyY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right dragon wing
    ctx.beginPath();
    ctx.moveTo(player.x + 4, bodyY - 4);
    ctx.lineTo(player.x + wSpan, bodyY - 22 + flap);
    ctx.lineTo(player.x + wSpan * 0.78, bodyY - 6 + flap * 0.5);
    ctx.lineTo(player.x + wSpan * 0.4, bodyY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (player.flyingTimer > 0) {
    const flap = Math.sin(time * 18) * 5;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 178, 236, 0.85)';
    ctx.strokeStyle = '#ffe399';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(player.x - 16, bodyY - 8 + flap * 0.4, 15, 7.5, -0.45, 0, Math.PI * 2);
    ctx.ellipse(player.x + 16, bodyY - 8 + flap * 0.4, 15, 7.5, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (player.gliding) {
    ctx.fillStyle = boosted
      ? 'rgba(255, 226, 155, 0.78)'
      : astralJump
        ? 'rgba(205, 190, 255, 0.78)'
        : 'rgba(145, 255, 235, 0.72)';
    ctx.beginPath();
    ctx.ellipse(player.x, bodyY - 20, 22, 7, 0, Math.PI, 0);
    ctx.fill();
  }

  ctx.translate(player.x, player.y);
  ctx.scale(player.facing * (2 - player.squash), player.squash);

  const stride = player.onGround && Math.abs(player.vx) > 25 ? Math.sin(player.runPhase) * 4 : 0;

  // Legs
  ctx.strokeStyle = '#dcfcf7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.lineTo(-4 + stride, 0);
  ctx.moveTo(4, -10);
  ctx.lineTo(4 - stride, 0);
  ctx.stroke();

  // Windweaver Anklets (winged ankle ribbons on feet)
  if (equipped.charm === 'wind_boots') {
    const flap = Math.sin(time * 10) * 2;
    ctx.fillStyle = '#8cf8e8';
    ctx.beginPath();
    ctx.ellipse(-7 + stride, -3 + flap * 0.4, 4.5, 2, -0.45, 0, Math.PI * 2);
    ctx.ellipse(1 - stride, -3 - flap * 0.4, 4.5, 2, -0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cloak / Body
  ctx.fillStyle = cloakFill;
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.quadraticCurveTo(-7, -26, 0, -28);
  ctx.quadraticCurveTo(9, -25, 10, -8);
  ctx.quadraticCurveTo(0, -5, -10, -8);
  ctx.closePath();
  ctx.fill();

  if (cloakTrim) {
    ctx.strokeStyle = cloakTrim;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-9.5, -8.5);
    ctx.quadraticCurveTo(0, -5.5, 9.5, -8.5);
    ctx.stroke();
  }

  // Sanctuary Heart Charm (petal amulet on chest)
  if (equipped.charm === 'sanctuary_heart') {
    ctx.fillStyle = '#ff9ec7';
    ctx.shadowColor = '#ff85ba';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(3, -17, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Head & Ears (always pure luminous spirit white)
  ctx.fillStyle = '#e8fffb';
  ctx.beginPath();
  ctx.arc(1, -29, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-3, -36);
  ctx.quadraticCurveTo(-11, -46, -6, -32);
  ctx.moveTo(3, -36);
  ctx.quadraticCurveTo(9, -46, 7, -33);
  ctx.fill();

  // Equipped Headwear
  if (equipped.hat === 'moss_crown') {
    ctx.strokeStyle = '#38d399';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(1, -33, 8.2, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.fillStyle = '#ffd87a';
    ctx.beginPath();
    ctx.arc(-4, -39, 2.2, 0, Math.PI * 2);
    ctx.arc(1, -41, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -39, 2.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (equipped.hat === 'sunflower_crown') {
    ctx.strokeStyle = '#ffbf3f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(1, -33, 8.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.fillStyle = '#ffe678';
    ctx.beginPath();
    ctx.arc(-5, -39, 2.5, 0, Math.PI * 2);
    ctx.arc(1, -42, 3, 0, Math.PI * 2);
    ctx.arc(7, -39, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b5541c';
    ctx.beginPath();
    ctx.arc(1, -42, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (equipped.hat === 'moon_halo') {
    const bob = Math.sin(time * 3.4) * 1.6;
    ctx.save();
    ctx.strokeStyle = '#9ef4ff';
    ctx.shadowColor = '#9ef4ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(1, -44 + bob, 9.5, 3, -0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff5b8';
    ctx.beginPath();
    ctx.arc(9, -46 + bob, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (equipped.hat === 'coral_tiara') {
    ctx.save();
    ctx.fillStyle = '#ff85b3';
    ctx.beginPath();
    ctx.moveTo(-6, -36);
    ctx.lineTo(-8, -45);
    ctx.lineTo(-2, -39);
    ctx.lineTo(1, -48);
    ctx.lineTo(4, -39);
    ctx.lineTo(10, -45);
    ctx.lineTo(7, -36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7cfce7';
    ctx.beginPath();
    ctx.arc(1, -40, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (equipped.hat === 'frost_antlers') {
    ctx.save();
    ctx.strokeStyle = '#c9f6ff';
    ctx.shadowColor = '#9ef0ff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Left antler branch
    ctx.moveTo(-3, -37);
    ctx.lineTo(-9, -47);
    ctx.lineTo(-13, -52);
    ctx.moveTo(-8, -45);
    ctx.lineTo(-5, -51);
    // Right antler branch
    ctx.moveTo(4, -37);
    ctx.lineTo(10, -47);
    ctx.lineTo(13, -53);
    ctx.moveTo(9, -45);
    ctx.lineTo(6, -51);
    ctx.stroke();
    ctx.restore();
  } else if (equipped.hat === 'ranger_hood') {
    ctx.save();
    ctx.fillStyle = '#2d6e46';
    ctx.strokeStyle = '#6ee79c';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-10, -29);
    ctx.quadraticCurveTo(-13, -44, -2, -46);
    ctx.quadraticCurveTo(9, -43, 10, -31);
    ctx.quadraticCurveTo(0, -35, -10, -29);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd67a';
    ctx.beginPath();
    ctx.arc(6, -34, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (equipped.hat === 'fairy_sparkle_tiara') {
    ctx.save();
    ctx.strokeStyle = '#ff9ee8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(1, -33, 8.6, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.fillStyle = '#ffe68c';
    ctx.beginPath();
    ctx.arc(1, -43, 2.5, 0, Math.PI * 2);
    ctx.arc(-5, -40, 1.6, 0, Math.PI * 2);
    ctx.arc(7, -40, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (equipped.hat === 'knight_helm') {
    ctx.save();
    ctx.fillStyle = '#b4c9de';
    ctx.strokeStyle = '#e6f4ff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(1, -30, 10.2, Math.PI * 0.9, Math.PI * 2.1);
    ctx.lineTo(11, -24);
    ctx.lineTo(-9, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Visor slit
    ctx.fillStyle = '#182b3d';
    ctx.fillRect(2, -30, 8, 2.5);
    // Emerald plume
    ctx.fillStyle = '#56e3cc';
    ctx.beginPath();
    ctx.quadraticCurveTo(-3, -46, -11, -40);
    ctx.quadraticCurveTo(-2, -37, 2, -40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (equipped.hat === 'astral_wizard') {
    ctx.save();
    ctx.fillStyle = '#47266b';
    ctx.strokeStyle = '#d8a6ff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(1, -36, 13, 3.2, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, -36);
    ctx.quadraticCurveTo(-2, -52, 4, -56);
    ctx.quadraticCurveTo(6, -44, 8, -36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe58f';
    ctx.beginPath();
    ctx.arc(4, -55, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#09343b';
  ctx.beginPath();
  ctx.arc(5, -29, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 5-second Safe Sanctuary Shield around Spirit after helping a sick animal
  if (player.wardShieldTimer > 0) {
    ctx.save();
    const shieldCenterY = player.y - 22;
    const pulseR = 34 + Math.sin(time * 7) * 2.5;
    const shieldGrad = ctx.createRadialGradient(
      player.x,
      shieldCenterY,
      10,
      player.x,
      shieldCenterY,
      pulseR + 8
    );
    shieldGrad.addColorStop(0, 'rgba(255, 238, 150, 0.05)');
    shieldGrad.addColorStop(0.7, 'rgba(130, 255, 230, 0.24)');
    shieldGrad.addColorStop(1, 'rgba(255, 232, 145, 0)');
    ctx.fillStyle = shieldGrad;
    ctx.beginPath();
    ctx.arc(player.x, shieldCenterY, pulseR + 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 232, 145, 0.88)';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#ffe48f';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(player.x, shieldCenterY, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    // Orbiting protective star crests
    for (let s = 0; s < 3; s++) {
      const ang = time * 3.4 + (s * Math.PI * 2) / 3;
      const sx = player.x + Math.cos(ang) * pulseR;
      const sy = shieldCenterY + Math.sin(ang) * pulseR;
      ctx.fillStyle = s % 2 === 0 ? '#ffe99e' : '#8cf8e8';
      ctx.beginPath();
      ctx.arc(sx, sy, 3.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawTrashItem(ctx: CanvasRenderingContext2D, t: TrashItem, time: number): void {
  ctx.save();
  const glint = 0.5 + 0.5 * Math.sin(time * 3.6 + t.phase);

  // Subtle eco-cleanup ring underneath so litter stands out cleanly on grass or snow
  ctx.fillStyle = `rgba(124, 252, 231, ${0.14 + glint * 0.14})`;
  ctx.beginPath();
  ctx.ellipse(t.x, t.y - 2, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(t.x, t.y - 8);
  ctx.scale(1.16, 1.16);
  ctx.rotate(t.rot);

  if (t.kind === 'bottle') {
    // Tilted plastic/glass bottle
    ctx.fillStyle = 'rgba(175, 232, 245, 0.85)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-8, -4.5, 13, 9, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff7b7b';
    ctx.fillRect(5, -2.5, 4, 5);
    // Label stripe
    ctx.fillStyle = '#56b4e9';
    ctx.fillRect(-4, -4, 5, 8);
  } else if (t.kind === 'can') {
    // Dented tin soda can
    ctx.fillStyle = '#d4e2eb';
    ctx.strokeStyle = '#708796';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-7, -5, 14, 10, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff6b78';
    ctx.fillRect(-3, -4.5, 6, 9);
  } else if (t.kind === 'wrapper') {
    // Crumpled bright snack wrapper
    ctx.fillStyle = '#ffd166';
    ctx.strokeStyle = '#d96b43';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, -4);
    ctx.lineTo(-4, -6);
    ctx.lineTo(4, -3);
    ctx.lineTo(9, -5);
    ctx.lineTo(7, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Discarded takeaway cup with lid & straw
    ctx.fillStyle = '#f5f7fa';
    ctx.strokeStyle = '#7a8e9c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.lineTo(6, -5);
    ctx.lineTo(4.5, 6);
    ctx.lineTo(-4.5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e76f51';
    ctx.fillRect(-7, -7, 14, 2.5);
    ctx.strokeStyle = '#56e3cc';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(2, -7);
    ctx.lineTo(5, -13);
    ctx.stroke();
  }

  // Tiny glint spark above litter
  ctx.rotate(-t.rot);
  ctx.fillStyle = `rgba(185, 255, 240, ${0.45 + glint * 0.5})`;
  ctx.beginPath();
  ctx.arc(0, -14 - glint * 2, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSickAnimal(
  ctx: CanvasRenderingContext2D,
  a: SickAnimal,
  time: number,
  playerX: number,
  playerY: number,
  isTouchDevice: boolean
): void {
  ctx.save();
  const helped = a.helped;
  const shiver = helped ? 0 : Math.sin(time * 22 + a.phase) * 1.1;
  const happyHop = helped ? Math.abs(Math.sin(time * 6.5 + a.phase)) * 6 : 0;

  // Soft aura behind animal (worried violet-blue when sick, warm gold-mint when helped)
  const auraR = helped && a.healAnimTimer > 0 ? 48 + (2 - a.healAnimTimer) * 14 : 34;
  const aura = ctx.createRadialGradient(a.x, a.y - 16, 3, a.x, a.y - 16, auraR);
  if (helped) {
    aura.addColorStop(0, 'rgba(255, 236, 150, 0.72)');
    aura.addColorStop(0.55, 'rgba(124, 252, 231, 0.3)');
    aura.addColorStop(1, 'rgba(124, 252, 231, 0)');
  } else {
    aura.addColorStop(0, 'rgba(165, 195, 255, 0.55)');
    aura.addColorStop(0.55, 'rgba(255, 145, 185, 0.25)');
    aura.addColorStop(1, 'rgba(145, 165, 255, 0)');
  }
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(a.x, a.y - 16, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Animated expanding glitter ring for 2 seconds right after helping!
  if (helped && a.healAnimTimer > 0) {
    const prog = 1 - a.healAnimTimer / 2.0;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 232, 145, ${(1 - prog) * 0.9})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(a.x, a.y - 18, 16 + prog * 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(a.x + shiver, a.y - happyHop);
  ctx.scale(a.facing, helped ? 1 : 0.93);

  if (a.kind === 'hedgehog') {
    // Spiny back
    ctx.fillStyle = '#6e4e42';
    ctx.beginPath();
    ctx.arc(-1, -10, 13, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Little spine tips
    ctx.fillStyle = '#8c695a';
    for (let s = -10; s <= 6; s += 4) {
      ctx.beginPath();
      ctx.moveTo(s - 3, -17);
      ctx.lineTo(s, -25);
      ctx.lineTo(s + 3, -17);
      ctx.closePath();
      ctx.fill();
    }
    // Cream belly & snout
    ctx.fillStyle = '#f5dec9';
    ctx.beginPath();
    ctx.ellipse(5, -7, 9, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tiny nose & eye
    ctx.fillStyle = '#241816';
    ctx.beginPath();
    ctx.arc(13.5, -7.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    if (helped) {
      ctx.fillStyle = '#1b1414';
      ctx.beginPath();
      ctx.arc(7.5, -9, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#3a2926';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(5.5, -9.5);
      ctx.lineTo(9.5, -8.5);
      ctx.stroke();
    }
  } else if (a.kind === 'fawn') {
    // Slender legs
    ctx.strokeStyle = '#c48352';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(-6, 0);
    ctx.moveTo(5, -8);
    ctx.lineTo(5, 0);
    ctx.stroke();
    // Warm fawn body + white spots
    ctx.fillStyle = '#d9955f';
    ctx.beginPath();
    ctx.ellipse(0, -12, 12, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3df';
    ctx.beginPath();
    ctx.arc(-5, -13, 1.6, 0, Math.PI * 2);
    ctx.arc(-1, -15, 1.5, 0, Math.PI * 2);
    ctx.arc(2, -12, 1.3, 0, Math.PI * 2);
    ctx.fill();
    // Neck & head (drooping slightly when sick)
    const headDrop = helped ? 0 : 4;
    ctx.fillStyle = '#d9955f';
    ctx.beginPath();
    ctx.ellipse(8, -19 + headDrop * 0.4, 4, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, -24 + headDrop, 6.2, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.beginPath();
    ctx.ellipse(6, -29 + headDrop, 2.4, 5, helped ? -0.3 : -1.1, 0, Math.PI * 2);
    ctx.fill();
    // Eye & nose
    ctx.fillStyle = '#241812';
    ctx.beginPath();
    ctx.arc(16.5, -23.5 + headDrop, 1.4, 0, Math.PI * 2);
    ctx.fill();
    if (helped) {
      ctx.beginPath();
      ctx.arc(12.2, -25 + headDrop, 1.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#2b1b14';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(10.5, -25 + headDrop);
      ctx.lineTo(13.8, -24.2 + headDrop);
      ctx.stroke();
    }
  } else if (a.kind === 'bunny') {
    // Fluffy tail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10, -7, 3.8, 0, Math.PI * 2);
    ctx.fill();
    // Plump body
    ctx.fillStyle = '#f2f7ff';
    ctx.beginPath();
    ctx.ellipse(-1, -10, 9.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.arc(7, -17, 6.2, 0, Math.PI * 2);
    ctx.fill();
    // Long ears (flopped down when sick, perked tall when helped!)
    ctx.fillStyle = '#e2edff';
    if (helped) {
      ctx.beginPath();
      ctx.ellipse(5, -28, 2.5, 7, -0.15, 0, Math.PI * 2);
      ctx.ellipse(8.5, -28, 2.5, 7, 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(2, -16, 2.4, 6.5, -1.2, 0, Math.PI * 2);
      ctx.ellipse(4, -14, 2.2, 6, -1.0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Pink nose & eye
    ctx.fillStyle = '#ff8eb3';
    ctx.beginPath();
    ctx.arc(12.8, -16.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f2836';
    if (helped) {
      ctx.beginPath();
      ctx.arc(9.2, -18, 1.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#334054';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(7.6, -18.3);
      ctx.lineTo(10.8, -17.5);
      ctx.stroke();
    }
  } else if (a.kind === 'bird') {
    // Little legs
    ctx.strokeStyle = '#ffb36b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.lineTo(-2, 0);
    ctx.moveTo(3, -6);
    ctx.lineTo(3, 0);
    ctx.stroke();
    // Robin/Songbird body & warm breast
    ctx.fillStyle = '#5c97c9';
    ctx.beginPath();
    ctx.ellipse(0, -11, 9.5, 7.5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff986e';
    ctx.beginPath();
    ctx.ellipse(4.5, -10, 5.2, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#5c97c9';
    ctx.beginPath();
    ctx.arc(6.5, -18, 5.4, 0, Math.PI * 2);
    ctx.fill();
    // Wing (drooping when sick, fluttering up when helped)
    ctx.fillStyle = '#3e73a3';
    const wingAngle = helped ? -0.45 + Math.sin(time * 16) * 0.25 : 0.35;
    ctx.beginPath();
    ctx.ellipse(-2, -11, 6.5, 3.6, wingAngle, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(11.5, -18.5);
    ctx.lineTo(16, -17);
    ctx.lineTo(11.5, -15.5);
    ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = '#152230';
    if (helped) {
      ctx.beginPath();
      ctx.arc(8.2, -19, 1.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#1d2d3d';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(6.8, -19);
      ctx.lineTo(9.8, -18.3);
      ctx.stroke();
    }
  } else {
    // River Otter
    // Long thick tail
    ctx.fillStyle = '#704f3d';
    ctx.beginPath();
    ctx.moveTo(-7, -6);
    ctx.quadraticCurveTo(-20, -4, -18, -11);
    ctx.quadraticCurveTo(-13, -10, -6, -9);
    ctx.fill();
    // Body
    ctx.fillStyle = '#855f4a';
    ctx.beginPath();
    ctx.ellipse(0, -10, 10.5, 8.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d0b8';
    ctx.beginPath();
    ctx.ellipse(4, -10, 5.2, 5.8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = '#855f4a';
    ctx.beginPath();
    ctx.arc(6.5, -19, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d0b8';
    ctx.beginPath();
    ctx.ellipse(9.5, -17.5, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tiny ears & nose
    ctx.fillStyle = '#614232';
    ctx.beginPath();
    ctx.arc(3.5, -24.5, 2.1, 0, Math.PI * 2);
    ctx.arc(12.2, -18.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
    if (helped) {
      ctx.fillStyle = '#1b1414';
      ctx.beginPath();
      ctx.arc(8.4, -20.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#241816';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(7, -20.8);
      ctx.lineTo(9.8, -20);
      ctx.stroke();
    }
  }

  // Little bandage patch when sick
  if (!helped) {
    ctx.fillStyle = '#fff5ea';
    ctx.strokeStyle = '#f28ca6';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.roundRect(-4, -13, 6.5, 3.2, 1);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();

  // Floating Interactive Prompt above animal
  // Mobile: unchanged "Help <Name>" tap badge; Desktop: clear [H] keycap badge + range highlight
  const bob = Math.sin(time * 3.8 + a.phase) * 2.5;
  if (!helped) {
    const tagY = a.y - 44 + bob;
    if (isTouchDevice) {
      const label = `Help ${a.name}`;
      ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textW = ctx.measureText(label).width;
      const boxW = textW + 26;

      ctx.fillStyle = 'rgba(7, 25, 36, 0.9)';
      ctx.strokeStyle = '#ff9ec7';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(a.x - boxW * 0.5, tagY - 12, boxW, 24, 12);
      ctx.fill();
      ctx.stroke();

      // Small coral heart/plus medical mark inside pill
      const iconX = a.x - boxW * 0.5 + 12;
      ctx.fillStyle = '#ff85b3';
      ctx.beginPath();
      ctx.arc(iconX, tagY, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(iconX - 2.4, tagY);
      ctx.lineTo(iconX + 2.4, tagY);
      ctx.moveTo(iconX, tagY - 2.4);
      ctx.lineTo(iconX, tagY + 2.4);
      ctx.stroke();

      ctx.fillStyle = '#fff2f8';
      ctx.fillText(label, a.x + 6, tagY + 0.5);
    } else {
      const inRange = Math.hypot(playerX - a.x, playerY - a.y) <= 220;
      const label = inRange ? `Press H · Help ${a.name}` : `Help ${a.name}`;
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.textBaseline = 'middle';
      const textW = ctx.measureText(label).width;
      const keyW = 18;
      const padX = 8;
      const gap = 6;
      const boxW = padX * 2 + keyW + gap + textW;
      const leftX = a.x - boxW * 0.5;

      if (inRange) {
        ctx.save();
        ctx.shadowColor = 'rgba(255, 226, 138, 0.55)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(11, 34, 46, 0.94)';
        ctx.strokeStyle = '#ffe28a';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.roundRect(leftX, tagY - 12, boxW, 24, 7);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(7, 25, 36, 0.88)';
        ctx.strokeStyle = '#ff9ec7';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(leftX, tagY - 12, boxW, 24, 7);
        ctx.fill();
        ctx.stroke();
      }

      // Crisp keyboard [H] keycap badge on the left
      const keyX = leftX + padX;
      ctx.fillStyle = inRange ? '#ffe28a' : '#ffd2e6';
      ctx.beginPath();
      ctx.roundRect(keyX, tagY - 8.5, keyW, 17, 4);
      ctx.fill();

      ctx.fillStyle = '#071924';
      ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('H', keyX + keyW * 0.5, tagY + 0.5);

      ctx.fillStyle = inRange ? '#fff9e2' : '#fff2f8';
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, keyX + keyW + gap, tagY + 0.5);
    }
  } else {
    // Happy glowing golden heart above healed animal
    const hy = a.y - 40 - happyHop + bob * 0.5;
    ctx.fillStyle = '#ffe28a';
    ctx.beginPath();
    ctx.arc(a.x - 2.2, hy - 1, 2.6, 0, Math.PI * 2);
    ctx.arc(a.x + 2.2, hy - 1, 2.6, 0, Math.PI * 2);
    ctx.moveTo(a.x - 4.7, hy);
    ctx.lineTo(a.x, hy + 5.2);
    ctx.lineTo(a.x + 4.7, hy);
    ctx.fill();
  }

  ctx.restore();
}
