import type { LevelId } from './types';
import type { BiomeBlend } from './world';
import { clamp, getTerrainY } from './world';

interface FallingLeaf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotSpeed: number;
  swayPhase: number;
  swayFreq: number;
  colorIndex: number;
}

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
}

interface RainSplash {
  active: boolean;
  x: number;
  y: number;
  r: number;
  alpha: number;
}

interface StarFlake {
  x: number;
  y: number;
  r: number;
  vy: number;
  swayPhase: number;
  twinklePhase: number;
  colorIndex: number;
}

interface SnowParticle {
  x: number;
  y: number;
  r: number;
  vy: number;
  swayPhase: number;
  swayAmp: number;
  alpha: number;
}

interface WaterBubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  swayPhase: number;
  alpha: number;
}

const LEAF_PALETTES: Record<LevelId, string[]> = {
  1: ['#f5b855', '#e88b48', '#d96b43', '#8fd68f', '#ffd97d'],
  2: ['#ff7b54', '#ffb26b', '#d94854', '#f2a65a', '#ffe08a'],
  3: ['#d6f8ff', '#94e8ff', '#eefbff', '#a8d8ff', '#c7fff0'],
  4: ['#e6faff', '#b8eeff', '#ffffff', '#94dcff', '#d4f6ff'],
};

const FLURRY_PALETTES: Record<LevelId, string[]> = {
  1: ['#e6fcff', '#a7fff2', '#fff0b3', '#d0e7ff'],
  2: ['#ffe2a8', '#ffc4d6', '#fff5cc', '#e5b8ff'],
  3: ['#ffffff', '#c9f6ff', '#e3baff', '#ffe6a3'],
  4: ['#ffffff', '#b8f4ff', '#8fffe6', '#e0c7ff'],
};

export class DynamicWeatherSystem {
  private leaves: FallingLeaf[] = [];
  private raindrops: RainDrop[] = [];
  private splashes: RainSplash[] = [];
  private flakes: StarFlake[] = [];
  private snow: SnowParticle[] = [];
  private bubbles: WaterBubble[] = [];
  private viewW = 1280;
  private viewH = 720;

  constructor() {
    this.initPools();
  }

  private initPools(): void {
    this.leaves = Array.from({ length: 18 }, (_, i) => ({
      x: Math.random() * 1800,
      y: Math.random() * 900,
      vx: 14 + Math.random() * 22,
      vy: 24 + Math.random() * 28,
      size: 3.5 + Math.random() * 3.2,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2.6,
      swayPhase: Math.random() * Math.PI * 2,
      swayFreq: 1.3 + Math.random() * 1.2,
      colorIndex: i % 5,
    }));

    this.raindrops = Array.from({ length: 48 }, () => ({
      x: Math.random() * 1800,
      y: Math.random() * 900,
      len: 10 + Math.random() * 14,
      speed: 500 + Math.random() * 220,
      alpha: 0.1 + Math.random() * 0.18,
    }));

    this.splashes = Array.from({ length: 12 }, () => ({
      active: false,
      x: 0,
      y: 0,
      r: 1,
      alpha: 0,
    }));

    this.flakes = Array.from({ length: 26 }, (_, i) => ({
      x: Math.random() * 1800,
      y: Math.random() * 900,
      r: 1.2 + Math.random() * 2,
      vy: 20 + Math.random() * 24,
      swayPhase: Math.random() * Math.PI * 2,
      twinklePhase: Math.random() * Math.PI * 2,
      colorIndex: i % 4,
    }));

    this.snow = Array.from({ length: 42 }, () => ({
      x: Math.random() * 1800,
      y: Math.random() * 900,
      r: 1.4 + Math.random() * 2.2,
      vy: 30 + Math.random() * 34,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: 14 + Math.random() * 20,
      alpha: 0.32 + Math.random() * 0.34,
    }));

    this.bubbles = Array.from({ length: 24 }, () => ({
      x: Math.random() * 1800,
      y: Math.random() * 900,
      r: 2 + Math.random() * 4,
      vy: 28 + Math.random() * 36,
      swayPhase: Math.random() * Math.PI * 2,
      alpha: 0.2 + Math.random() * 0.3,
    }));
  }

  resize(w: number, h: number): void {
    this.viewW = w;
    this.viewH = h;
  }

  update(
    dt: number,
    time: number,
    cameraX: number,
    cameraY: number,
    blend: BiomeBlend,
    levelId: LevelId = 1,
    worldScale = 1
  ): void {
    const breeze = Math.sin(time * 0.35) * 22 + 12;
    const { leaves: leafW, rain: rainW, flurry: flurryW, snow: snowW, underwater: waterW } =
      blend.weights;

    if (leafW > 0.01) {
      for (const l of this.leaves) {
        const flutter = Math.sin(time * l.swayFreq + l.swayPhase) * 26;
        l.x += (l.vx + breeze * 0.7 + flutter) * dt;
        l.y += l.vy * dt;
        l.rot += l.rotSpeed * dt;

        if (l.y > this.viewH + 30) {
          l.y = -25 - Math.random() * 40;
          l.x = Math.random() * (this.viewW + 160) - 80;
        }
        if (l.x > this.viewW + 60) l.x = -40;
        if (l.x < -60) l.x = this.viewW + 40;
      }
    }

    if (rainW > 0.01) {
      const windX = -105 + breeze * 0.6;
      for (const d of this.raindrops) {
        d.x += windX * dt;
        d.y += d.speed * dt;

        const worldX = cameraX + d.x / worldScale;
        const groundScreenY = (getTerrainY(worldX, levelId) - cameraY) * worldScale;

        if (d.y >= groundScreenY && d.y <= groundScreenY + 28) {
          this.spawnSplash(d.x, groundScreenY);
          d.y = -20 - Math.random() * 80;
          d.x = Math.random() * (this.viewW + 220) - 40;
        } else if (d.y > this.viewH + 20) {
          d.y = -20 - Math.random() * 80;
          d.x = Math.random() * (this.viewW + 220) - 40;
        }
        if (d.x < -60) d.x += this.viewW + 120;
      }
    }

    for (const sp of this.splashes) {
      if (!sp.active) continue;
      sp.r += 26 * dt;
      sp.alpha -= 2.4 * dt;
      if (sp.alpha <= 0) sp.active = false;
    }

    if (flurryW > 0.01) {
      for (const f of this.flakes) {
        const drift = Math.sin(time * 1.3 + f.swayPhase) * 20;
        f.x += (drift + breeze * 0.35) * dt;
        f.y += f.vy * dt;

        if (f.y > this.viewH + 20) {
          f.y = -15 - Math.random() * 35;
          f.x = Math.random() * this.viewW;
        }
        if (f.x > this.viewW + 20) f.x = -20;
        if (f.x < -20) f.x = this.viewW + 20;
      }
    }

    if (snowW > 0.01) {
      for (const s of this.snow) {
        const sway = Math.sin(time * 1.6 + s.swayPhase) * s.swayAmp;
        s.x += (sway + breeze * 0.45) * dt;
        s.y += s.vy * dt;

        if (s.y > this.viewH + 20) {
          s.y = -18 - Math.random() * 36;
          s.x = Math.random() * (this.viewW + 80) - 40;
        }
        if (s.x > this.viewW + 30) s.x = -25;
        if (s.x < -30) s.x = this.viewW + 25;
      }
    }

    if (waterW > 0.01) {
      for (const b of this.bubbles) {
        const wobble = Math.sin(time * 2.3 + b.swayPhase) * 18;
        b.x += wobble * dt;
        b.y -= b.vy * dt;

        if (b.y < -24) {
          b.y = this.viewH + 20 + Math.random() * 30;
          b.x = Math.random() * this.viewW;
        }
        if (b.x > this.viewW + 24) b.x = -20;
        if (b.x < -24) b.x = this.viewW + 20;
      }
    }
  }

  private spawnSplash(x: number, y: number): void {
    for (const sp of this.splashes) {
      if (!sp.active) {
        sp.active = true;
        sp.x = x;
        sp.y = y;
        sp.r = 1.5;
        sp.alpha = 0.45;
        return;
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    time: number,
    blend: BiomeBlend,
    levelId: LevelId = 1
  ): void {
    const swell = 0.72 + 0.28 * Math.sin(time * 0.16);
    const { leaves: leafW, rain: rainW, flurry: flurryW, snow: snowW, underwater: waterW } =
      blend.weights;
    const leafPalette = LEAF_PALETTES[levelId];
    const flurryPalette = FLURRY_PALETTES[levelId];

    if (leafW > 0.02) {
      const count = Math.ceil(this.leaves.length * clamp(leafW * swell, 0.15, 1));
      ctx.save();
      for (let i = 0; i < count; i++) {
        const l = this.leaves[i];
        const flip = 0.4 + 0.6 * Math.abs(Math.cos(time * 2.2 + l.swayPhase));
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.scale(1, flip);
        ctx.globalAlpha = 0.56 * leafW;
        ctx.fillStyle = leafPalette[l.colorIndex];
        ctx.beginPath();
        ctx.moveTo(-l.size, 0);
        ctx.quadraticCurveTo(0, -l.size * 0.72, l.size, 0);
        ctx.quadraticCurveTo(0, l.size * 0.72, -l.size, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    if (rainW > 0.02) {
      const count = Math.ceil(this.raindrops.length * clamp(rainW * swell, 0.2, 1));
      const rainRgb =
        levelId === 1
          ? '176, 232, 255'
          : levelId === 2
            ? '216, 186, 255'
            : levelId === 3
              ? '195, 238, 255'
              : '215, 246, 255';
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < count; i++) {
        const d = this.raindrops[i];
        ctx.strokeStyle = `rgba(${rainRgb}, ${d.alpha * rainW})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.19, d.y + d.len);
        ctx.stroke();
      }

      for (const sp of this.splashes) {
        if (!sp.active) continue;
        ctx.strokeStyle = `rgba(${rainRgb}, ${sp.alpha * rainW})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, sp.r * 1.6, sp.r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (flurryW > 0.02) {
      const count = Math.ceil(this.flakes.length * clamp(flurryW * swell, 0.2, 1));
      ctx.save();
      for (let i = 0; i < count; i++) {
        const f = this.flakes[i];
        const twinkle = 0.45 + 0.55 * Math.sin(time * 2.8 + f.twinklePhase);
        ctx.globalAlpha = twinkle * 0.55 * flurryW;
        ctx.fillStyle = flurryPalette[f.colorIndex];
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (snowW > 0.02) {
      const count = Math.ceil(this.snow.length * clamp(snowW * (0.85 + 0.15 * swell), 0.25, 1));
      ctx.save();
      for (let i = 0; i < count; i++) {
        const s = this.snow[i];
        ctx.globalAlpha = s.alpha * snowW;
        ctx.fillStyle = '#f2fbff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 3.1) {
          ctx.strokeStyle = `rgba(215, 248, 255, ${0.38 * snowW})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(s.x - s.r - 1.5, s.y);
          ctx.lineTo(s.x + s.r + 1.5, s.y);
          ctx.moveTo(s.x, s.y - s.r - 1.5);
          ctx.lineTo(s.x, s.y + s.r + 1.5);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    if (waterW > 0.02) {
      const count = Math.ceil(this.bubbles.length * clamp(waterW, 0.25, 1));
      ctx.save();
      for (let i = 0; i < count; i++) {
        const b = this.bubbles[i];
        const alpha = b.alpha * waterW;
        ctx.fillStyle = `rgba(145, 248, 255, ${alpha * 0.22})`;
        ctx.strokeStyle = `rgba(210, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.32, b.y - b.r * 0.32, Math.max(0.9, b.r * 0.26), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
