import l1EmeraldGlade from '../assets/images/l1_emerald_glade_1795615998066.jpg';
import l1MoonpetalWoods from '../assets/images/l1_moonpetal_woods_1795615998830.jpg';
import l1StarlitSanctuary from '../assets/images/l1_starlit_sanctuary_1795615999076.jpg';
import l2AmberDusk from '../assets/images/l2_amber_dusk_1795615999375.jpg';
import l2CrystalHollow from '../assets/images/l2_crystal_hollow_1795615999652.jpg';
import l2GoldenSummit from '../assets/images/l2_golden_summit_1795616001942.jpg';
import l3SilverFrostwood from '../assets/images/l3_silver_frostwood_1795619149378.jpg';
import l3FloatingIsles from '../assets/images/l3_floating_isles_1795619149741.jpg';
import l3PrismHeartwood from '../assets/images/l3_prism_heartwood_1795619149796.jpg';
import l4FrozenPines from '../assets/images/l4_frozen_pines_1795683611656.jpg';
import l4IcyPeaks from '../assets/images/l4_icy_peaks_1795683612387.jpg';
import l4FrostSanctuary from '../assets/images/l4_frost_sanctuary_1795683613317.jpg';
import type { LevelId } from './types';

const BACKDROP_PATHS: Record<LevelId, [string, string, string]> = {
  1: [l1EmeraldGlade, l1MoonpetalWoods, l1StarlitSanctuary],
  2: [l2AmberDusk, l2CrystalHollow, l2GoldenSummit],
  3: [l3SilverFrostwood, l3FloatingIsles, l3PrismHeartwood],
  4: [l4FrozenPines, l4IcyPeaks, l4FrostSanctuary],
};

class BackdropCache {
  private images = new Map<string, HTMLImageElement>();

  preloadAll(): void {
    ([1, 2, 3, 4] as LevelId[]).forEach((lvl) => {
      BACKDROP_PATHS[lvl].forEach((src) => {
        if (!this.images.has(src)) {
          const img = new Image();
          img.referrerPolicy = 'no-referrer';
          img.src = src;
          this.images.set(src, img);
        }
      });
    });
  }

  getImage(levelId: LevelId, biomeIdx: number): HTMLImageElement | null {
    const paths = BACKDROP_PATHS[levelId];
    const mappedIdx = biomeIdx <= 0 ? 0 : biomeIdx >= 3 ? 2 : 1;
    const src = paths[mappedIdx];
    let img = this.images.get(src);
    if (!img) {
      img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = src;
      this.images.set(src, img);
    }
    if (img.complete && img.naturalWidth > 0) {
      return img;
    }
    return null;
  }
}

export const backdropCache = new BackdropCache();

/**
 * Draws a landscape forest backdrop image with smooth cover scaling and
 * seamless mirrored horizontal parallax scrolling.
 */
export function drawParallaxBackdrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cameraX: number,
  viewW: number,
  viewH: number,
  alpha: number
): void {
  if (alpha <= 0.005) return;

  const scale = Math.max(viewW / img.naturalWidth, viewH / img.naturalHeight) * 1.06;
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const drawY = (viewH - drawH) * 0.42;

  const parallaxX = cameraX * 0.14;
  const period = drawW * 2;
  const baseOffset = ((parallaxX % period) + period) % period;

  ctx.save();
  ctx.globalAlpha = alpha;

  for (let tile = -1; tile <= 2; tile++) {
    const xPos = tile * drawW - (baseOffset % drawW);
    if (xPos + drawW < -2 || xPos > viewW + 2) continue;

    const tileIndex = Math.floor(parallaxX / drawW) + tile;
    const mirrored = Math.abs(tileIndex) % 2 === 1;

    if (mirrored) {
      ctx.save();
      ctx.translate(xPos + drawW, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, drawW + 1, drawH);
      ctx.restore();
    } else {
      ctx.drawImage(img, xPos, drawY, drawW + 1, drawH);
    }
  }

  ctx.restore();
}
