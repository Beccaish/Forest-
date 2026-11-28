import * as THREE from 'three';
import type { PlayerLoadout, ShopItemId } from './shop';

export interface CloakStyle {
  main: number;
  highlight: number;
  scarf: number;
  trim: number;
  roughness: number;
  metalness: number;
}

export const CLOAK_STYLES: Record<string, CloakStyle> = {
  default: { main: 0x226d68, highlight: 0x7cfce7, scarf: 0x7cfce7, trim: 0x9efcf0, roughness: 0.55, metalness: 0.08 },
  sunset_ember: { main: 0xa14328, highlight: 0xffb86c, scarf: 0xff9654, trim: 0xffc87a, roughness: 0.52, metalness: 0.1 },
  sakura_petal: { main: 0xb24b88, highlight: 0xff9ee4, scarf: 0xffd68a, trim: 0xffdf9e, roughness: 0.45, metalness: 0.12 },
  ranger_cape: { main: 0x2c6b45, highlight: 0x65d68a, scarf: 0xd9b26f, trim: 0xd9b26f, roughness: 0.68, metalness: 0.08 },
  starweave_mantle: { main: 0x3b4291, highlight: 0xb8beff, scarf: 0x98a2ff, trim: 0xdce2ff, roughness: 0.42, metalness: 0.2 },
  ocean_tide: { main: 0x14698a, highlight: 0x48e5ff, scarf: 0x7cfce7, trim: 0xaaf7ff, roughness: 0.36, metalness: 0.22 },
  fairy_gossamer: { main: 0x9f4e9e, highlight: 0xffb8f2, scarf: 0xffe28a, trim: 0xffe599, roughness: 0.34, metalness: 0.25 },
  prism_aurora: { main: 0x197b84, highlight: 0x94ffe6, scarf: 0xe4b3ff, trim: 0x94ffe6, roughness: 0.3, metalness: 0.32 },
  dragonscale_cloak: { main: 0x781f24, highlight: 0xff7a52, scarf: 0xffc857, trim: 0xffc857, roughness: 0.42, metalness: 0.38 },
  shadow_velvet: { main: 0x45286e, highlight: 0xc28cff, scarf: 0xffe18c, trim: 0xffe18c, roughness: 0.58, metalness: 0.16 },
};

const _tmpColorA = new THREE.Color();
const _tmpColorB = new THREE.Color();

export function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => m.dispose());
    } else if (mat) {
      mat.dispose();
    }
  });
}

export function buildHeadwearGroup(hatId: ShopItemId | null): THREE.Group {
  const g = new THREE.Group();
  if (!hatId) return g;

  if (hatId === 'moss_crown') {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.026, 10, 28),
      new THREE.MeshStandardMaterial({ color: 0x35c988, roughness: 0.55 })
    );
    band.rotation.x = Math.PI / 2 - 0.12;
    band.position.set(0, 1.38, 0);
    g.add(band);

    const leafMat = new THREE.MeshStandardMaterial({ color: 0x62f2b8, roughness: 0.45 });
    const budMat = new THREE.MeshStandardMaterial({
      color: 0xffde73,
      emissive: 0xd99b26,
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI * 2) / 6;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 5), leafMat);
      leaf.position.set(Math.sin(ang) * 0.27, 1.43, Math.cos(ang) * 0.27);
      leaf.rotation.z = -Math.sin(ang) * 0.35;
      leaf.rotation.x = Math.cos(ang) * 0.35;
      g.add(leaf);
    }
    const frontBud = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), budMat);
    frontBud.position.set(0, 1.44, 0.27);
    g.add(frontBud);
  } else if (hatId === 'sunflower_crown') {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.275, 0.024, 10, 28),
      new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.4, metalness: 0.2 })
    );
    band.rotation.x = Math.PI / 2 - 0.12;
    band.position.set(0, 1.38, 0);
    g.add(band);

    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xffe46b,
      emissive: 0x9c6d08,
      emissiveIntensity: 0.2,
      roughness: 0.35,
    });
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xa64a17, roughness: 0.55 });
    const offsets = [-0.18, 0, 0.18];
    offsets.forEach((ox, idx) => {
      const scale = idx === 1 ? 1.25 : 0.9;
      const z = Math.sqrt(Math.max(0.01, 0.27 * 0.27 - ox * ox));
      const flower = new THREE.Mesh(new THREE.CylinderGeometry(0.068 * scale, 0.068 * scale, 0.025, 10), petalMat);
      flower.rotation.x = Math.PI / 2 - 0.2;
      flower.position.set(ox, 1.44 + (idx === 1 ? 0.03 : 0), z);
      g.add(flower);

      const core = new THREE.Mesh(new THREE.SphereGeometry(0.034 * scale, 10, 10), centerMat);
      core.position.set(ox, 1.445 + (idx === 1 ? 0.03 : 0), z + 0.015);
      g.add(core);
    });
  } else if (hatId === 'moon_halo') {
    const haloGroup = new THREE.Group();
    haloGroup.name = 'moonHalo';
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.02, 12, 36),
      new THREE.MeshStandardMaterial({
        color: 0xb6f7ff,
        emissive: 0x5cd8ff,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.4,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 1.59, 0);
    haloGroup.add(ring);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 14, 14),
      new THREE.MeshStandardMaterial({
        color: 0xfff5c0,
        emissive: 0xffe073,
        emissiveIntensity: 0.85,
        roughness: 0.15,
      })
    );
    orb.position.set(0.24, 1.64, 0.18);
    haloGroup.add(orb);
    g.add(haloGroup);
  } else if (hatId === 'ranger_hood') {
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x2d6e46,
      roughness: 0.72,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x6ee79c, roughness: 0.45 });
    const hoodDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.66),
      hoodMat
    );
    hoodDome.position.set(0, 1.19, -0.04);
    hoodDome.rotation.x = -0.32;
    g.add(hoodDome);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 14), hoodMat);
    tail.position.set(0, 1.32, -0.26);
    tail.rotation.x = -1.15;
    g.add(tail);

    const browTrim = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.02, 10, 28, Math.PI * 1.15), trimMat);
    browTrim.position.set(0, 1.24, 0.08);
    browTrim.rotation.x = -0.3;
    browTrim.rotation.z = -0.2;
    g.add(browTrim);

    const pin = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.048, 0),
      new THREE.MeshStandardMaterial({ color: 0xffd67a, metalness: 0.75, roughness: 0.2 })
    );
    pin.position.set(0.23, 1.26, 0.17);
    g.add(pin);
  } else if (hatId === 'coral_tiara') {
    const coralMat = new THREE.MeshStandardMaterial({
      color: 0xff7eb6,
      roughness: 0.3,
      metalness: 0.2,
    });
    const pearlMat = new THREE.MeshStandardMaterial({
      color: 0x9effef,
      emissive: 0x26c7b5,
      emissiveIntensity: 0.3,
      roughness: 0.15,
      metalness: 0.3,
    });
    const base = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.022, 10, 28), coralMat);
    base.rotation.x = Math.PI / 2 - 0.12;
    base.position.set(0, 1.39, 0);
    g.add(base);

    const spikes = [
      { ang: 0, h: 0.22 },
      { ang: 0.45, h: 0.16 },
      { ang: -0.45, h: 0.16 },
      { ang: 0.9, h: 0.12 },
      { ang: -0.9, h: 0.12 },
    ];
    for (const sp of spikes) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.036, sp.h, 8), coralMat);
      cone.position.set(Math.sin(sp.ang) * 0.25, 1.41 + sp.h * 0.45, Math.cos(sp.ang) * 0.25);
      g.add(cone);
    }
    const centerPearl = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 14), pearlMat);
    centerPearl.position.set(0, 1.44, 0.265);
    g.add(centerPearl);
  } else if (hatId === 'fairy_sparkle_tiara') {
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xff9ee8,
      emissive: 0xc23ab3,
      emissiveIntensity: 0.25,
      metalness: 0.6,
      roughness: 0.22,
    });
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffe885,
      emissive: 0xffc633,
      emissiveIntensity: 0.7,
      roughness: 0.18,
    });
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.018, 10, 28), bandMat);
    band.rotation.x = Math.PI / 2 - 0.12;
    band.position.set(0, 1.39, 0);
    g.add(band);

    const centerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.062, 0), starMat);
    centerGem.position.set(0, 1.48, 0.24);
    g.add(centerGem);

    for (const sx of [-0.15, 0.15]) {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.036, 0), starMat);
      gem.position.set(sx, 1.44, 0.22);
      g.add(gem);
    }
  } else if (hatId === 'knight_helm') {
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xc8daea,
      metalness: 0.85,
      roughness: 0.22,
    });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x162636, roughness: 0.6, metalness: 0.4 });
    const plumeMat = new THREE.MeshStandardMaterial({
      color: 0x45e3c6,
      emissive: 0x148270,
      emissiveIntensity: 0.25,
      roughness: 0.45,
    });

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.62),
      steelMat
    );
    dome.position.set(0, 1.2, 0);
    g.add(dome);

    const brow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.31, 0.14, 24, 1, true, -Math.PI * 0.68, Math.PI * 1.36),
      steelMat
    );
    brow.position.set(0, 1.15, 0);
    g.add(brow);

    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.048, 0.06), visorMat);
    slit.position.set(0, 1.19, 0.295);
    g.add(slit);

    const plumeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.52, 0.1),
      new THREE.Vector3(0, 1.62, -0.05),
      new THREE.Vector3(0, 1.53, -0.25),
      new THREE.Vector3(0, 1.32, -0.4),
    ]);
    const plume = new THREE.Mesh(new THREE.TubeGeometry(plumeCurve, 18, 0.055, 10, false), plumeMat);
    g.add(plume);
  } else if (hatId === 'frost_antlers') {
    const iceMat = new THREE.MeshPhysicalMaterial({
      color: 0xc2e9ff,
      emissive: 0x5eb8ff,
      emissiveIntensity: 0.35,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1,
    });
    for (const side of [-1, 1]) {
      const mainCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.12, 1.4, 0.02),
        new THREE.Vector3(side * 0.24, 1.58, -0.02),
        new THREE.Vector3(side * 0.36, 1.76, -0.06),
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 12, 0.026, 8, false), iceMat));

      const tine1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.22, 1.55, -0.01),
        new THREE.Vector3(side * 0.34, 1.61, 0.09),
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(tine1, 6, 0.018, 8, false), iceMat));

      const tine2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.27, 1.63, -0.03),
        new THREE.Vector3(side * 0.2, 1.77, 0.04),
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(tine2, 6, 0.018, 8, false), iceMat));
    }
  } else if (hatId === 'astral_wizard') {
    const hatMat = new THREE.MeshStandardMaterial({
      color: 0x4e2978,
      roughness: 0.5,
      metalness: 0.15,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd8a6ff,
      emissive: 0x8942d6,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    });

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.03, 28), hatMat);
    brim.position.set(0, 1.39, -0.02);
    brim.rotation.x = -0.1;
    g.add(brim);

    const brimRim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.016, 10, 32), trimMat);
    brimRim.rotation.x = Math.PI / 2 - 0.1;
    brimRim.position.set(0, 1.395, -0.02);
    g.add(brimRim);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.56, 20), hatMat);
    cone.position.set(0, 1.64, -0.05);
    cone.rotation.x = -0.2;
    g.add(cone);

    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.055, 0),
      new THREE.MeshStandardMaterial({
        color: 0xffe58f,
        emissive: 0xffcc4d,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      })
    );
    star.position.set(0, 1.9, -0.11);
    g.add(star);
  }

  return g;
}

export function buildCloakDetailsGroup(cloakId: ShopItemId | null, style: CloakStyle): THREE.Group {
  const g = new THREE.Group();
  const claspMat = new THREE.MeshStandardMaterial({
    color: style.trim,
    emissive: style.highlight,
    emissiveIntensity: 0.25,
    metalness: 0.65,
    roughness: 0.25,
  });

  const clasp = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), claspMat);
  clasp.position.set(0, 0.85, 0.24);
  g.add(clasp);

  if (cloakId === 'starweave_mantle') {
    const starMat = new THREE.MeshBasicMaterial({ color: 0xe8ecff });
    const stars = [
      [0, 0.62, -0.29],
      [-0.14, 0.48, -0.29],
      [0.15, 0.53, -0.28],
      [-0.08, 0.34, -0.33],
      [0.11, 0.31, -0.33],
    ];
    for (const [sx, sy, sz] of stars) {
      const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.028, 0), starMat);
      st.position.set(sx, sy, sz);
      g.add(st);
    }
  } else if (cloakId === 'dragonscale_cloak') {
    const scaleMat = new THREE.MeshStandardMaterial({
      color: 0xffc857,
      metalness: 0.72,
      roughness: 0.25,
    });
    for (let row = 0; row < 3; row++) {
      const y = 0.66 - row * 0.14;
      const z = -0.26 - row * 0.045;
      const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.09, 4), scaleMat);
      ridge.position.set(0, y, z);
      ridge.rotation.x = -Math.PI * 0.45;
      g.add(ridge);
    }
  } else if (cloakId === 'prism_aurora' || cloakId === 'ocean_tide') {
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: style.highlight,
      emissive: style.highlight,
      emissiveIntensity: 0.4,
      roughness: 0.25,
    });
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.016, 8, 28, Math.PI * 1.15), ribbonMat);
    rib.rotation.x = Math.PI / 2 + 0.15;
    rib.rotation.z = Math.PI * 0.92;
    rib.position.set(0, 0.44, 0);
    g.add(rib);
  } else if (cloakId === 'fairy_gossamer' || cloakId === 'sakura_petal') {
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xffe48f,
      emissive: 0xffbe55,
      emissiveIntensity: 0.55,
      roughness: 0.2,
    });
    for (const ang of [Math.PI * 0.75, Math.PI, Math.PI * 1.25]) {
      const gem = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), gemMat);
      gem.position.set(Math.sin(ang) * 0.3, 0.52, Math.cos(ang) * 0.3);
      g.add(gem);
    }
  }

  return g;
}

export function buildCharmGroup(charmId: ShopItemId | null): THREE.Group {
  const g = new THREE.Group();
  if (!charmId) return g;

  if (charmId === 'firefly_sprite') {
    const orbiter = new THREE.Group();
    orbiter.name = 'orbitCharm';

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 14, 14),
      new THREE.MeshStandardMaterial({
        color: 0xfff3a8,
        emissive: 0xffc83d,
        emissiveIntensity: 1.0,
        roughness: 0.2,
      })
    );
    orbiter.add(body);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xd9fff8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const lw = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), wingMat);
    lw.scale.set(1.2, 0.65, 1);
    lw.position.set(-0.07, 0.04, 0);
    lw.rotation.set(0.4, 0.3, 0.4);
    lw.name = 'charmWingL';
    orbiter.add(lw);

    const rw = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), wingMat);
    rw.scale.set(1.2, 0.65, 1);
    rw.position.set(0.07, 0.04, 0);
    rw.rotation.set(0.4, -0.3, -0.4);
    rw.name = 'charmWingR';
    orbiter.add(rw);

    orbiter.position.set(-0.56, 1.18, 0.16);
    g.add(orbiter);
  } else if (charmId === 'mini_owl') {
    const owl = new THREE.Group();
    owl.name = 'orbitCharm';

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdcf7ff, roughness: 0.55 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x8be0ff, roughness: 0.5 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x102436 });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xffcc66, roughness: 0.4 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 14), bodyMat);
    body.scale.set(0.92, 1.15, 0.9);
    owl.add(body);

    const lw = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), wingMat);
    lw.scale.set(0.45, 1.0, 0.7);
    lw.position.set(-0.1, 0, 0);
    lw.name = 'charmWingL';
    owl.add(lw);

    const rw = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), wingMat);
    rw.scale.set(0.45, 1.0, 0.7);
    rw.position.set(0.1, 0, 0);
    rw.name = 'charmWingR';
    owl.add(rw);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
    eyeL.position.set(-0.04, 0.04, 0.095);
    owl.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
    eyeR.position.set(0.04, 0.04, 0.095);
    owl.add(eyeR);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.045, 6), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.005, 0.115);
    owl.add(beak);

    owl.position.set(-0.6, 1.24, 0.15);
    g.add(owl);
  } else if (charmId === 'fairy_sparkle_wand') {
    const lantern = new THREE.Group();
    lantern.name = 'orbitCharm';

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffd275, metalness: 0.75, roughness: 0.25 });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffb6f6,
      emissive: 0xff6ee6,
      emissiveIntensity: 0.9,
      roughness: 0.15,
    });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), crystalMat);
    lantern.add(gem);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.014, 8, 22), frameMat);
    ring.rotation.x = Math.PI / 3;
    lantern.add(ring);

    lantern.position.set(-0.56, 1.15, 0.18);
    g.add(lantern);
  } else if (charmId === 'knight_crest') {
    const shieldGroup = new THREE.Group();
    shieldGroup.name = 'orbitCharm';

    const shape = new THREE.Shape();
    shape.moveTo(-0.12, 0.14);
    shape.lineTo(0.12, 0.14);
    shape.lineTo(0.12, -0.02);
    shape.lineTo(0, -0.16);
    shape.lineTo(-0.12, -0.02);
    shape.closePath();

    const shieldGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.012,
      bevelSegments: 2,
    });
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x3b76a3,
      metalness: 0.7,
      roughness: 0.25,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shieldGroup.add(shield);

    const crossMat = new THREE.MeshStandardMaterial({
      color: 0x7cfce7,
      emissive: 0x35e0c3,
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.2, 0.055), crossMat);
    vBar.position.set(0, 0, 0.012);
    shieldGroup.add(vBar);
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.055), crossMat);
    hBar.position.set(0, 0.03, 0.012);
    shieldGroup.add(hBar);

    shieldGroup.position.set(0.54, 0.78, 0.22);
    g.add(shieldGroup);
  } else if (charmId === 'sanctuary_heart') {
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xff82b8,
      emissive: 0xff4291,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.2,
    });
    const amulet = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), heartMat);
    amulet.position.set(0, 0.72, 0.29);
    g.add(amulet);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.014, 10, 36),
      new THREE.MeshBasicMaterial({ color: 0xff9ec7, transparent: true, opacity: 0.55 })
    );
    ring.rotation.x = Math.PI / 2 - 0.18;
    ring.position.y = 0.65;
    ring.name = 'heartAuraRing';
    g.add(ring);
  } else if (charmId === 'wind_boots') {
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x7dfae7,
      emissive: 0x2fd6bf,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), wingMat);
      wing.position.set(side * 0.17, 0.14, -0.05);
      wing.rotation.z = side * -1.1;
      wing.rotation.x = -0.3;
      wing.name = side < 0 ? 'bootWingL' : 'bootWingR';
      g.add(wing);
    }
  }

  return g;
}

export function buildPowerGroup(powerId: ShopItemId | null): THREE.Group {
  const g = new THREE.Group();
  if (!powerId) return g;

  if (powerId === 'super_phoenix_wings') {
    const featherMat = new THREE.MeshStandardMaterial({
      color: 0xff7b3d,
      emissive: 0xe64a19,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      side: THREE.DoubleSide,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffe07d,
      emissive: 0xffaa2b,
      emissiveIntensity: 0.5,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });

    for (const side of [-1, 1]) {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(side * 0.12, 0.78, -0.2);
      wingPivot.name = side < 0 ? 'wingL' : 'wingR';

      const featherLengths = [0.68, 0.56, 0.44];
      featherLengths.forEach((len, idx) => {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.085, len, 5), idx === 0 ? goldMat : featherMat);
        blade.rotation.z = side * -(1.25 + idx * 0.26);
        blade.rotation.x = -0.18;
        blade.position.set(side * (len * 0.44), 0.12 - idx * 0.11, -0.05 - idx * 0.02);
        wingPivot.add(blade);
      });

      g.add(wingPivot);
    }
  } else if (powerId === 'super_dragon_wings') {
    const membraneMat = new THREE.MeshStandardMaterial({
      color: 0x1e8f70,
      emissive: 0x0c5944,
      emissiveIntensity: 0.3,
      roughness: 0.45,
      side: THREE.DoubleSide,
    });
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0xff9f52,
      emissive: 0xc25418,
      emissiveIntensity: 0.25,
      metalness: 0.4,
      roughness: 0.35,
    });

    for (const side of [-1, 1]) {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(side * 0.12, 0.78, -0.22);
      wingPivot.name = side < 0 ? 'wingL' : 'wingR';

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(side * 0.78, 0.36);
      shape.lineTo(side * 0.64, -0.06);
      shape.lineTo(side * 0.42, -0.2);
      shape.lineTo(side * 0.18, -0.22);
      shape.closePath();

      const webGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.018, bevelEnabled: false });
      const web = new THREE.Mesh(webGeo, membraneMat);
      wingPivot.add(web);

      const topBoneCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0.01),
        new THREE.Vector3(side * 0.4, 0.24, 0.01),
        new THREE.Vector3(side * 0.8, 0.38, 0.01),
      ]);
      const bone = new THREE.Mesh(new THREE.TubeGeometry(topBoneCurve, 10, 0.022, 8, false), spineMat);
      wingPivot.add(bone);

      g.add(wingPivot);
    }
  } else if (powerId === 'super_sky_leap') {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x7cfce7,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.02, 10, 36), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    ring.name = 'windBaseRing';
    g.add(ring);
  } else if (powerId === 'super_nova_pulse') {
    const novaRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.022, 12, 42),
      new THREE.MeshBasicMaterial({ color: 0xffd86b, transparent: true, opacity: 0.65 })
    );
    novaRing.rotation.x = Math.PI / 2 - 0.2;
    novaRing.position.y = 0.72;
    novaRing.name = 'novaOrbitRing';
    g.add(novaRing);
  } else if (powerId === 'super_star_magnet') {
    const magRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.65, 0.018, 10, 42),
      new THREE.MeshBasicMaterial({ color: 0xff7ee8, transparent: true, opacity: 0.72 })
    );
    magRing1.position.y = 0.74;
    magRing1.rotation.set(Math.PI / 2 - 0.35, 0.3, 0);
    magRing1.name = 'magRing1';
    g.add(magRing1);

    const magRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.016, 10, 42),
      new THREE.MeshBasicMaterial({ color: 0x7cfce7, transparent: true, opacity: 0.68 })
    );
    magRing2.position.y = 0.74;
    magRing2.rotation.set(Math.PI / 2 + 0.35, -0.4, 0);
    magRing2.name = 'magRing2';
    g.add(magRing2);
  } else if (powerId === 'super_fairy_sparkle') {
    const sparkleGroup = new THREE.Group();
    sparkleGroup.name = 'fairySwirl';
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI * 2) / 8;
      const mote = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.042, 0),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0xff9ef0 : 0xffe494,
          emissive: i % 2 === 0 ? 0xff5ce6 : 0xffbe33,
          emissiveIntensity: 0.8,
          roughness: 0.2,
        })
      );
      mote.position.set(Math.cos(ang) * 0.56, 0.35 + (i % 4) * 0.26, Math.sin(ang) * 0.56);
      sparkleGroup.add(mote);
    }
    g.add(sparkleGroup);
  }

  return g;
}

export interface SpiritCharacterRig {
  root: THREE.Group;
  headGroup: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  cloakMat: THREE.MeshPhysicalMaterial;
  cloakHemMat: THREE.MeshStandardMaterial;
  scarfMat: THREE.MeshStandardMaterial;
  scarfTailSegments: THREE.Mesh[];
  hatSlot: THREE.Group;
  cloakDetailSlot: THREE.Group;
  charmSlot: THREE.Group;
  powerSlot: THREE.Group;
  wardShieldDome: THREE.Mesh;
  applyLoadout: (loadout: PlayerLoadout) => void;
}

export function createSpiritCharacterRig(
  initialLoadout: PlayerLoadout,
  castShadow = false
): SpiritCharacterRig {
  const root = new THREE.Group();

  const legMat = new THREE.MeshStandardMaterial({ color: 0xe6fff9, roughness: 0.45 });
  const legGeo = new THREE.CapsuleGeometry(0.045, 0.18, 6, 10);
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.1, 0.16, 0);
  legL.castShadow = castShadow;
  root.add(legL);

  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.1, 0.16, 0);
  legR.castShadow = castShadow;
  root.add(legR);

  const cloakProfile = [
    new THREE.Vector2(0.001, 0.88),
    new THREE.Vector2(0.18, 0.87),
    new THREE.Vector2(0.24, 0.72),
    new THREE.Vector2(0.32, 0.44),
    new THREE.Vector2(0.38, 0.25),
    new THREE.Vector2(0.35, 0.24),
  ];
  const cloakGeo = new THREE.LatheGeometry(cloakProfile, 28);
  const cloakMat = new THREE.MeshPhysicalMaterial({
    color: 0x226d68,
    roughness: 0.55,
    metalness: 0.08,
    clearcoat: 0.25,
    side: THREE.DoubleSide,
  });
  const cloakMesh = new THREE.Mesh(cloakGeo, cloakMat);
  cloakMesh.castShadow = castShadow;
  root.add(cloakMesh);

  const cloakHemGeo = new THREE.TorusGeometry(0.365, 0.022, 10, 32);
  const cloakHemMat = new THREE.MeshStandardMaterial({
    color: 0x9efcf0,
    roughness: 0.3,
    metalness: 0.4,
  });
  const cloakHem = new THREE.Mesh(cloakHemGeo, cloakHemMat);
  cloakHem.rotation.x = Math.PI / 2;
  cloakHem.position.y = 0.255;
  root.add(cloakHem);

  const scarfMat = new THREE.MeshStandardMaterial({
    color: 0x7cfce7,
    emissive: 0x28a894,
    emissiveIntensity: 0.25,
    roughness: 0.45,
  });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.048, 10, 24), scarfMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.9;
  root.add(collar);

  const scarfTailSegments: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(0.024, 0.055 - i * 0.006), 10, 10),
      scarfMat
    );
    seg.position.set(0, 0.87 - i * 0.06, -0.22 - i * 0.11);
    root.add(seg);
    scarfTailSegments.push(seg);
  }

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4fffd,
    emissive: 0xa2f5e6,
    emissiveIntensity: 0.12,
    roughness: 0.32,
    clearcoat: 0.2,
  });
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.18;
  root.add(headGroup);

  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.26, 26, 22), skinMat);
  headSphere.castShadow = castShadow;
  headGroup.add(headSphere);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.26, 10), skinMat);
    ear.position.set(side * 0.17, 0.23, -0.02);
    ear.rotation.z = side * -0.45;
    ear.rotation.x = -0.1;
    headGroup.add(ear);
  }

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x09242b, roughness: 0.15, metalness: 0.1 });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 12), eyeMat);
    eye.scale.set(0.85, 1.25, 0.7);
    eye.position.set(side * 0.095, -0.01, 0.235);
    headGroup.add(eye);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), glintMat);
    glint.position.set(side * 0.095 + 0.012, 0.012, 0.26);
    headGroup.add(glint);
  }

  const wardShieldDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 22, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffe485,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
      depthWrite: false,
    })
  );
  wardShieldDome.position.y = 0.78;
  wardShieldDome.visible = false;
  root.add(wardShieldDome);

  const hatSlot = new THREE.Group();
  const cloakDetailSlot = new THREE.Group();
  const charmSlot = new THREE.Group();
  const powerSlot = new THREE.Group();
  root.add(hatSlot, cloakDetailSlot, charmSlot, powerSlot);

  const applyLoadout = (loadout: PlayerLoadout) => {
    const style = CLOAK_STYLES[loadout.cloak ?? 'default'] ?? CLOAK_STYLES.default;
    cloakMat.color.setHex(style.main);
    cloakMat.roughness = style.roughness;
    cloakMat.metalness = style.metalness;
    cloakHemMat.color.setHex(style.trim);
    scarfMat.color.setHex(style.scarf);
    scarfMat.emissive.setHex(style.highlight);

    while (hatSlot.children.length > 0) {
      const c = hatSlot.children[0];
      hatSlot.remove(c);
      disposeObject3D(c);
    }
    hatSlot.add(buildHeadwearGroup(loadout.hat));

    while (cloakDetailSlot.children.length > 0) {
      const c = cloakDetailSlot.children[0];
      cloakDetailSlot.remove(c);
      disposeObject3D(c);
    }
    cloakDetailSlot.add(buildCloakDetailsGroup(loadout.cloak, style));

    while (charmSlot.children.length > 0) {
      const c = charmSlot.children[0];
      charmSlot.remove(c);
      disposeObject3D(c);
    }
    charmSlot.add(buildCharmGroup(loadout.charm));

    while (powerSlot.children.length > 0) {
      const c = powerSlot.children[0];
      powerSlot.remove(c);
      disposeObject3D(c);
    }
    powerSlot.add(buildPowerGroup(loadout.power));
  };

  applyLoadout(initialLoadout);

  return {
    root,
    headGroup,
    legL,
    legR,
    cloakMat,
    cloakHemMat,
    scarfMat,
    scarfTailSegments,
    hatSlot,
    cloakDetailSlot,
    charmSlot,
    powerSlot,
    wardShieldDome,
    applyLoadout,
  };
}

export function animateSpiritAccessories(
  rig: SpiritCharacterRig,
  loadout: PlayerLoadout,
  dt: number,
  elapsed: number,
  options: {
    isFlying?: boolean;
    isMoving?: boolean;
    movePhase?: number;
    hasDemo?: boolean;
    wardShieldActive?: boolean;
  } = {}
): void {
  const isFlying = Boolean(options.isFlying);
  const isMoving = Boolean(options.isMoving);
  const hasDemo = Boolean(options.hasDemo);
  const movePhase = options.movePhase ?? elapsed * 10;

  if (loadout.cloak === 'prism_aurora') {
    const shift = 0.5 + 0.5 * Math.sin(elapsed * 2.5);
    _tmpColorA.setHex(0x197b84);
    _tmpColorB.setHex(0x633899);
    _tmpColorA.lerp(_tmpColorB, shift);
    rig.cloakMat.color.copy(_tmpColorA);
  }

  // Leg stride animation
  if (isMoving && !isFlying) {
    const stride = Math.sin(movePhase) * 0.55;
    rig.legL.rotation.x = stride;
    rig.legR.rotation.x = -stride;
    rig.legL.position.y = 0.16 + Math.max(0, Math.sin(movePhase) * 0.05);
    rig.legR.position.y = 0.16 + Math.max(0, -Math.sin(movePhase) * 0.05);
  } else {
    rig.legL.rotation.x = THREE.MathUtils.lerp(rig.legL.rotation.x, 0, Math.min(1, dt * 12));
    rig.legR.rotation.x = THREE.MathUtils.lerp(rig.legR.rotation.x, 0, Math.min(1, dt * 12));
    rig.legL.position.y = 0.16;
    rig.legR.position.y = 0.16;
  }

  // Billowing scarf tail
  const waveSpeed = isFlying ? 7.5 : isMoving ? 6.2 : 3.2;
  for (let i = 0; i < rig.scarfTailSegments.length; i++) {
    const seg = rig.scarfTailSegments[i];
    const amp = (isFlying || isMoving ? 0.048 : 0.025) * (i + 1);
    seg.position.x = Math.sin(elapsed * waveSpeed - i * 0.65) * amp;
    seg.position.y = 0.87 - i * 0.055 + Math.cos(elapsed * waveSpeed - i * 0.5) * 0.025;
  }

  // Wing & Power animations
  const wingL = rig.powerSlot.getObjectByName('wingL');
  const wingR = rig.powerSlot.getObjectByName('wingR');
  if (wingL && wingR) {
    const flapSpeed = isFlying || hasDemo ? 11.5 : isMoving ? 6.5 : 3.8;
    const flapAmp = isFlying || hasDemo ? 0.46 : isMoving ? 0.25 : 0.16;
    const flapAngle = Math.sin(elapsed * flapSpeed) * flapAmp;
    wingL.rotation.y = -0.18 + flapAngle;
    wingR.rotation.y = 0.18 - flapAngle;
  }

  const windBaseRing = rig.powerSlot.getObjectByName('windBaseRing');
  if (windBaseRing) {
    const s = 1 + Math.sin(elapsed * 5) * 0.07;
    windBaseRing.scale.set(s, s, 1);
  }

  const novaOrbitRing = rig.powerSlot.getObjectByName('novaOrbitRing');
  if (novaOrbitRing) {
    novaOrbitRing.rotation.z += dt * 1.4;
  }

  const magRing1 = rig.powerSlot.getObjectByName('magRing1');
  const magRing2 = rig.powerSlot.getObjectByName('magRing2');
  if (magRing1 && magRing2) {
    magRing1.rotation.z += dt * 1.8;
    magRing2.rotation.z -= dt * 1.5;
  }

  const fairySwirl = rig.powerSlot.getObjectByName('fairySwirl');
  if (fairySwirl) {
    fairySwirl.rotation.y += dt * 1.9;
  }

  const moonHalo = rig.hatSlot.getObjectByName('moonHalo');
  if (moonHalo) {
    moonHalo.position.y = Math.sin(elapsed * 3.2) * 0.03;
  }

  const orbitCharm = rig.charmSlot.getObjectByName('orbitCharm');
  if (orbitCharm) {
    const ang = elapsed * 1.45;
    orbitCharm.position.x = Math.cos(ang) * 0.58;
    orbitCharm.position.z = Math.sin(ang) * 0.58;
    orbitCharm.position.y = 1.08 + Math.sin(elapsed * 3.5) * 0.07;
    orbitCharm.rotation.y = -ang + Math.PI / 2;

    const cWingL = orbitCharm.getObjectByName('charmWingL');
    const cWingR = orbitCharm.getObjectByName('charmWingR');
    if (cWingL && cWingR) {
      const wFlap = Math.sin(elapsed * 14) * 0.35;
      cWingL.rotation.z = 0.3 + wFlap;
      cWingR.rotation.z = -0.3 - wFlap;
    }
  }

  const bootWingL = rig.charmSlot.getObjectByName('bootWingL');
  const bootWingR = rig.charmSlot.getObjectByName('bootWingR');
  if (bootWingL && bootWingR) {
    const bFlap = Math.sin(elapsed * 9) * 0.22;
    bootWingL.rotation.z = 1.1 + bFlap;
    bootWingR.rotation.z = -1.1 - bFlap;
  }

  rig.wardShieldDome.visible = Boolean(options.wardShieldActive);
  if (rig.wardShieldDome.visible) {
    rig.wardShieldDome.rotation.y += dt * 1.4;
    const pulseScale = 1 + Math.sin(elapsed * 6) * 0.04;
    rig.wardShieldDome.scale.setScalar(pulseScale);
  }
}
