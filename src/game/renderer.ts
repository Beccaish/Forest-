import { backdropCache, drawParallaxBackdrop } from './backgrounds';
import type {
  CollectibleItem,
  GlowMushroom,
  LevelId,
  Particle,
  Platform,
  PlayerState,
  PulseRing,
  SpiritLantern,
  StoneArch,
  ThornWisp,
  WindStream,
  WoodlandButterfly,
} from './types';
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
  } else {
    drawLevel2Celestials(ctx, world, centerWorldX, cameraX, viewW, viewH, time);
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
    if (levelId === 2) {
      ctx.moveTo(mx, base);
      ctx.lineTo(mx + m.w * 0.48, base - m.h * 0.85);
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
    ctx.beginPath();
    ctx.moveTo(tx - t.w * 0.5, base);
    ctx.lineTo(tx - t.w * 0.22 + t.lean, base - t.h * 0.82);
    ctx.lineTo(tx + t.w * 0.22 + t.lean, base - t.h * 0.82);
    ctx.lineTo(tx + t.w * 0.5, base);
    ctx.closePath();
    ctx.fill();
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

  // 7. Near-Ground Trees (0.72x parallax)
  ctx.save();
  ctx.globalAlpha = imgA ? 0.72 : 1;
  drawNearTrees(ctx, world, levelId, b, cameraX, viewW, viewH);
  ctx.restore();

  // ============================================================
  // WORLD-SPACE PLAYABLE LAYER (1.0x * worldScale + camera shake)
  // ============================================================
  ctx.save();
  ctx.scale(worldScale, worldScale);
  ctx.translate(-cameraX + shakeX, -cameraY + shakeY);

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

  for (const l of world.lanterns) {
    if (l.x + 120 < cameraX || l.x - 120 > cameraX + virtualW) continue;
    drawLantern(ctx, l);
  }

  for (const m of world.mushrooms) {
    if (m.x + 80 < cameraX || m.x - 80 > cameraX + virtualW) continue;
    drawMushroom(ctx, m);
  }

  drawTerrain(ctx, levelId, groundTop, groundBot, rimCol, cameraX, cameraY, virtualW, virtualH);
  drawGrassAndFlowers(ctx, world, levelId, cameraX, virtualW);

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

  drawPlayer(ctx, player, time);

  for (const p of particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

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

  ctx.fillStyle = 'rgba(4, 10, 16, 0.7)';
  for (const fg of world.fgSilhouettes) {
    const fx = fg.x - cameraX * 1.28;
    if (fx + 140 < 0 || fx - 140 > viewW) continue;
    ctx.beginPath();
    ctx.moveTo(fx - fg.w * 0.6, viewH + 20);
    ctx.lineTo(fx - fg.w * 0.32 + fg.lean, -20);
    ctx.lineTo(fx + fg.w * 0.32 + fg.lean, -20);
    ctx.lineTo(fx + fg.w * 0.6, viewH + 20);
    ctx.closePath();
    ctx.fill();
  }

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

function drawWaterfalls(
  ctx: CanvasRenderingContext2D,
  world: WorldData,
  levelId: LevelId,
  cameraX: number,
  viewW: number,
  viewH: number,
  time: number
): void {
  const tint = levelId === 1 ? '145, 252, 245' : '212, 175, 255';
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

    ctx.fillStyle = midCol;
    ctx.beginPath();
    ctx.moveTo(tx - t.w * 0.55, base);
    ctx.quadraticCurveTo(tx - t.w * 0.2, base - t.h * 0.5, tx - t.w * 0.2 + t.lean, base - t.h);
    ctx.lineTo(tx + t.w * 0.2 + t.lean, base - t.h);
    ctx.quadraticCurveTo(tx + t.w * 0.25, base - t.h * 0.5, tx + t.w * 0.55, base);
    ctx.closePath();
    ctx.fill();

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
        levelId === 1 ? 'rgba(90, 210, 185, 0.28)' : 'rgba(230, 165, 130, 0.28)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.quadraticCurveTo(vx + sway * 0.5, vy + vLen * 0.5, vx + sway, vy + vLen);
      ctx.stroke();

      ctx.fillStyle = rimCol;
      ctx.globalAlpha = 0.65;
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
      ? lerpColor('#07171a', '#06081a', b.mix > 0 ? 0.5 : 0)
      : lerpColor('#170b0f', '#0d071c', b.mix > 0 ? 0.5 : 0);
  for (const t of world.nearTrees) {
    const tx = t.x - cameraX * 0.72;
    if (tx + 120 < 0 || tx - 120 > viewW) continue;
    const base = viewH + 20;

    ctx.fillStyle = trunkCol;
    ctx.beginPath();
    ctx.moveTo(tx - t.w * 0.7, base);
    ctx.quadraticCurveTo(tx - t.w * 0.25, base - t.h * 0.5, tx - t.w * 0.28 + t.lean, base - t.h);
    ctx.lineTo(tx + t.w * 0.28 + t.lean, base - t.h);
    ctx.quadraticCurveTo(tx + t.w * 0.25, base - t.h * 0.5, tx + t.w * 0.7, base);
    ctx.closePath();
    ctx.fill();

    if (t.hasHollow) {
      const hx = tx + t.lean * 0.35;
      const hy = base - t.hollowY;
      const hGlow = ctx.createRadialGradient(hx, hy, 2, hx, hy, 22);
      hGlow.addColorStop(
        0,
        levelId === 1 ? 'rgba(130, 255, 225, 0.85)' : 'rgba(255, 200, 130, 0.85)'
      );
      hGlow.addColorStop(1, 'rgba(130, 255, 225, 0)');
      ctx.fillStyle = hGlow;
      ctx.beginPath();
      ctx.arc(hx, hy, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawStoneArch(ctx: CanvasRenderingContext2D, a: StoneArch, levelId: LevelId): void {
  ctx.save();
  ctx.fillStyle = levelId === 1 ? '#182b36' : '#2b1c2e';
  ctx.strokeStyle =
    levelId === 1
      ? `rgba(120, 245, 225, ${0.25 + a.glow * 0.6})`
      : `rgba(255, 195, 125, ${0.25 + a.glow * 0.6})`;
  ctx.lineWidth = 2;

  ctx.fillRect(a.x - a.w * 0.5, a.y - a.h + 25, 24, a.h - 15);
  ctx.fillRect(a.x + a.w * 0.5 - 24, a.y - a.h + 25, 24, a.h - 15);

  ctx.beginPath();
  ctx.arc(a.x, a.y - a.h + 32, a.w * 0.5, Math.PI, 0);
  ctx.lineTo(a.x + a.w * 0.5 - 22, a.y - a.h + 32);
  ctx.arc(a.x, a.y - a.h + 32, a.w * 0.5 - 22, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle =
    levelId === 1
      ? `rgba(130, 255, 232, ${0.3 + a.glow * 0.7})`
      : `rgba(255, 210, 140, ${0.3 + a.glow * 0.7})`;
  for (let r = 0; r < 3; r++) {
    ctx.beginPath();
    ctx.arc(a.x - a.w * 0.5 + 12, a.y - 40 - r * 32, 3, 0, Math.PI * 2);
    ctx.arc(a.x + a.w * 0.5 - 12, a.y - 40 - r * 32, 3, 0, Math.PI * 2);
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
  const rgb = levelId === 1 ? '155, 255, 240' : '255, 210, 165';
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
  if (p.type === 'branch') {
    ctx.fillStyle = levelId === 1 ? '#183333' : '#36211e';
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, 16, 8);
    ctx.fill();
    ctx.fillStyle = levelId === 1 ? '#38a68a' : '#d98448';
    ctx.beginPath();
    ctx.roundRect(p.x + 4, p.y, p.w - 8, 5, 3);
    ctx.fill();
  } else if (p.type === 'stone') {
    ctx.fillStyle = levelId === 1 ? '#243c4a' : '#34244a';
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, 18, 6);
    ctx.fill();
    ctx.strokeStyle =
      levelId === 1 ? 'rgba(130, 245, 225, 0.45)' : 'rgba(220, 175, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.fillStyle =
      levelId === 1
        ? `rgba(98, 245, 225, ${0.18 + p.glow * 0.28})`
        : `rgba(255, 200, 130, ${0.18 + p.glow * 0.28})`;
    ctx.strokeStyle =
      levelId === 1
        ? `rgba(165, 255, 242, ${0.5 + p.glow * 0.5})`
        : `rgba(255, 224, 158, ${0.5 + p.glow * 0.5})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = levelId === 1 ? '#6fffe9' : '#ffd085';
    ctx.shadowBlur = 14 * p.glow;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, 12, 6);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawMushroom(ctx: CanvasRenderingContext2D, m: GlowMushroom): void {
  const squashY = 1 - m.bounce * 0.35;
  const stretchX = 1 + m.bounce * 0.28;
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.scale(stretchX, squashY);

  ctx.fillStyle = '#d7ecea';
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.quadraticCurveTo(-5, -m.h * 0.6, -6, -m.h + 6);
  ctx.lineTo(6, -m.h + 6);
  ctx.quadraticCurveTo(5, -m.h * 0.6, 7, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = m.hue;
  ctx.shadowBlur = 18;
  ctx.fillStyle = m.hue;
  ctx.beginPath();
  ctx.ellipse(0, -m.h + 4, m.r, m.r * 0.55, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.beginPath();
  ctx.arc(-m.r * 0.38, -m.h - 2, 3.2, 0, Math.PI * 2);
  ctx.arc(m.r * 0.25, -m.h - 5, 4, 0, Math.PI * 2);
  ctx.arc(m.r * 0.52, -m.h + 1, 2.3, 0, Math.PI * 2);
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
        : 'rgba(255, 195, 140, 0.3)'
  );
  aura.addColorStop(1, 'rgba(115, 255, 235, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(tx, ty - 130, auraR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = levelId === 1 ? '#d7f3f0' : '#f7dfd4';
  ctx.beginPath();
  ctx.moveTo(tx - 38, ty + 8);
  ctx.quadraticCurveTo(tx - 16, ty - 90, tx - 18, ty - 190);
  ctx.lineTo(tx + 18, ty - 190);
  ctx.quadraticCurveTo(tx + 16, ty - 90, tx + 38, ty + 8);
  ctx.closePath();
  ctx.fill();

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
    } else {
      ctx.fillStyle = sanctuaryAwakened
        ? idx % 2 === 0
          ? 'rgba(255, 215, 130, 0.88)'
          : 'rgba(255, 155, 195, 0.88)'
        : 'rgba(245, 175, 140, 0.58)';
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
  const startX = Math.floor((cameraX - 40) / 24) * 24;
  const endX = cameraX + viewW + 60;
  const bottomY = cameraY + viewH + 120;

  const gGrad = ctx.createLinearGradient(0, BASE_GROUND_Y - 70, 0, bottomY);
  gGrad.addColorStop(0, groundTop);
  gGrad.addColorStop(0.28, groundBot);
  gGrad.addColorStop(1, '#03080d');

  ctx.fillStyle = gGrad;
  ctx.beginPath();
  ctx.moveTo(startX, bottomY);
  for (let x = startX; x <= endX; x += 24) {
    ctx.lineTo(x, getTerrainY(x, levelId));
  }
  ctx.lineTo(endX, bottomY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = rimCol;
  ctx.lineWidth = 2.4;
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
  const bladeColor = levelId === 1 ? '#3dc79f' : '#c9794b';
  for (const g of world.grassTufts) {
    if (g.x < cameraX - 20 || g.x > cameraX + viewW + 20) continue;
    const tipX = g.x + g.bend * g.h;
    const tipY = g.y - g.h;
    ctx.strokeStyle = bladeColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y + 2);
    ctx.quadraticCurveTo(g.x + g.bend * 5, g.y - g.h * 0.5, tipX, tipY);
    ctx.stroke();

    if (g.hasFlower) {
      ctx.fillStyle = g.flowerHue;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2.6, 0, Math.PI * 2);
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
  } else {
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

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number): void {
  if (player.invulnTimer > 0 && Math.floor(time * 18) % 2 === 0) {
    return;
  }

  ctx.save();

  const boosted = player.crystalBoostTimer > 0;
  ctx.strokeStyle = boosted ? '#ffe08c' : '#7bfce6';
  ctx.lineCap = 'round';
  ctx.shadowColor = boosted ? '#ffd266' : '#6fffe9';
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
  const aura = ctx.createRadialGradient(player.x, bodyY, 4, player.x, bodyY, boosted ? 56 : 44);
  aura.addColorStop(0, boosted ? 'rgba(255, 224, 140, 0.42)' : 'rgba(140, 255, 238, 0.36)');
  aura.addColorStop(1, 'rgba(140, 255, 238, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(player.x, bodyY, boosted ? 56 : 44, 0, Math.PI * 2);
  ctx.fill();

  if (player.gliding) {
    ctx.fillStyle = boosted ? 'rgba(255, 226, 155, 0.78)' : 'rgba(145, 255, 235, 0.72)';
    ctx.beginPath();
    ctx.ellipse(player.x, bodyY - 20, 22, 7, 0, Math.PI, 0);
    ctx.fill();
  }

  ctx.translate(player.x, player.y);
  ctx.scale(player.facing * (2 - player.squash), player.squash);

  const stride = player.onGround && Math.abs(player.vx) > 25 ? Math.sin(player.runPhase) * 4 : 0;

  ctx.strokeStyle = '#dcfcf7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.lineTo(-4 + stride, 0);
  ctx.moveTo(4, -10);
  ctx.lineTo(4 - stride, 0);
  ctx.stroke();

  ctx.fillStyle = '#e8fffb';
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.quadraticCurveTo(-7, -26, 0, -28);
  ctx.quadraticCurveTo(9, -25, 10, -8);
  ctx.quadraticCurveTo(0, -5, -10, -8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(1, -29, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-3, -36);
  ctx.quadraticCurveTo(-11, -46, -6, -32);
  ctx.moveTo(3, -36);
  ctx.quadraticCurveTo(9, -46, 7, -33);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#09343b';
  ctx.beginPath();
  ctx.arc(5, -29, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
