import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { audioEngine } from '../game/audio';
import { getSavedGameSummary, loadGameState, saveGameState } from '../game/save';
import { saveShopProgress, type SavedShopProgress } from '../game/shop';
import {
  animateSpiritAccessories,
  createSpiritCharacterRig,
  detectSoftwareGl,
  disposeObject3D,
} from '../game/spirit3d';
import type { GamePhase, HudSnapshot, SickAnimalKind, TrashKind } from '../game/types';
import { clamp } from '../game/world';

export interface Level5Input {
  left: boolean;
  right: boolean;
  forward: boolean;
  backward: boolean;
  jumpHeld: boolean;
}

export interface Level5ViewportHandle {
  input: Level5Input;
  triggerJump: () => void;
  releaseJump: () => void;
  triggerPulse: () => void;
  activateFlyingFlower: () => boolean;
  helpNearbyAnimal: () => boolean;
  saveGame: () => boolean;
  respawnAtLantern: () => void;
  restartLevel: () => void;
  clearHeldInputs: () => void;
  loadFromSaved: () => boolean;
}

interface Level5ViewportProps {
  phase: GamePhase;
  shopProgress: SavedShopProgress;
  isTouchDevice: boolean;
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onEarnDewdrops: (amount: number) => void;
  onPhaseChange: (nextPhase: GamePhase) => void;
}

interface ProjectedPrompt {
  id: string;
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  kind: 'animal' | 'popup';
  color?: string;
  animalId?: number;
}

const TRAIL_LENGTH = 172;
const SANCTUARY_Z = -170;

function pathCenterX(z: number): number {
  const t = Math.max(0, -z);
  return Math.sin(t * 0.055) * 4.2 + Math.sin(t * 0.13 + 0.6) * 1.4;
}

function groundHeightAt(x: number, z: number): number {
  const cx = pathCenterX(z);
  const dist = Math.abs(x - cx);
  const t = Math.max(0, -z);
  const startFlat = clamp((t - 4) / 8, 0, 1);
  const endFlat = clamp((162 - t) / 14, 0, 1);
  const hillEnvelope = startFlat * endFlat;

  const trailWave = (Math.sin(t * 0.07) * 0.9 + Math.cos(t * 0.16) * 0.35) * hillEnvelope;
  const bankLift = Math.max(0, dist - 2.9) * 0.42;
  const microUndulation = Math.sin(x * 0.45) * Math.cos(z * 0.35) * 0.06;
  return trailWave + bankLift + microUndulation;
}

function createTrailGroundTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, '#1f4424');
  grad.addColorStop(0.26, '#366832');
  grad.addColorStop(0.38, '#7a633d');
  grad.addColorStop(0.5, '#a88754');
  grad.addColorStop(0.62, '#7a633d');
  grad.addColorStop(0.74, '#366832');
  grad.addColorStop(1.0, '#1f4424');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle dappled moss & sunlit pebble grain
  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const inTrail = Math.abs(x - 256) < 78;
    ctx.fillStyle = inTrail
      ? Math.random() > 0.5
        ? 'rgba(220, 194, 130, 0.25)'
        : 'rgba(84, 58, 32, 0.22)'
      : Math.random() > 0.45
        ? 'rgba(130, 198, 86, 0.24)'
        : 'rgba(24, 58, 28, 0.28)';
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + Math.random() * 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 18);
  tex.anisotropy = maxAniso;
  return tex;
}

function createMossyBarkTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#473322';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = i % 3 === 0 ? '#2b1c11' : i % 3 === 1 ? '#5d432c' : '#3a5d29';
    ctx.lineWidth = 2 + Math.random() * 5;
    ctx.beginPath();
    const x = Math.random() * 256;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (Math.random() - 0.5) * 24, 85, x + (Math.random() - 0.5) * 24, 170, x, 256);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

function createOmbreFrostingTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, '#ffd4e5');
  grad.addColorStop(0.45, '#f2b8d8');
  grad.addColorStop(0.68, '#b5e2f2');
  grad.addColorStop(1.0, '#5bb7db');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(130,235,245,0.16)';
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function buildCrystalFawnMesh(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xa2dcff,
    emissive: 0x3b82d6,
    emissiveIntensity: 0.3,
    roughness: 0.16,
    metalness: 0.15,
    clearcoat: 1,
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0xd9a8ff,
    emissive: 0x995ce6,
    emissiveIntensity: 0.45,
    roughness: 0.2,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16 * scale, 0.28 * scale, 6, 12), bodyMat);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.34 * scale, 0);
  g.add(body);

  for (const [lx, lz] of [
    [-0.09, 0.12],
    [0.09, 0.12],
    [-0.09, -0.14],
    [0.09, -0.14],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.024 * scale, 0.32 * scale, 8), bodyMat);
    leg.position.set(lx * scale, 0.16 * scale, lz * scale);
    g.add(leg);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065 * scale, 0.095 * scale, 0.24 * scale, 10), bodyMat);
  neck.position.set(0, 0.5 * scale, 0.18 * scale);
  neck.rotation.x = 0.3;
  g.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11 * scale, 14, 12), bodyMat);
  head.scale.set(0.85, 0.9, 1.15);
  head.position.set(0, 0.62 * scale, 0.25 * scale);
  g.add(head);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035 * scale, 0.12 * scale, 6), hornMat);
    ear.position.set(side * 0.09 * scale, 0.7 * scale, 0.2 * scale);
    ear.rotation.z = side * -0.5;
    g.add(ear);

    const antler = new THREE.Mesh(new THREE.ConeGeometry(0.022 * scale, 0.18 * scale, 5), hornMat);
    antler.position.set(side * 0.055 * scale, 0.77 * scale, 0.24 * scale);
    antler.rotation.z = side * -0.25;
    g.add(antler);
  }

  return g;
}

function buildGeodeCakeLandmark(
  scale: number,
  frostingTex: THREE.CanvasTexture,
  barkTex: THREE.CanvasTexture
): THREE.Group {
  const cake = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    map: barkTex,
    color: 0x916e52,
    roughness: 0.78,
  });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x5c9e3e, roughness: 0.85 });
  const lowerMat = new THREE.MeshPhysicalMaterial({
    map: frostingTex,
    roughness: 0.35,
    clearcoat: 0.3,
  });
  const chocoMat = new THREE.MeshStandardMaterial({
    color: 0x3b2016,
    roughness: 0.42,
    metalness: 0.05,
  });
  const pipingMat = new THREE.MeshStandardMaterial({ color: 0x522e1f, roughness: 0.4 });
  const spunSugarMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6fbff,
    emissive: 0x56d8f2,
    emissiveIntensity: 0.25,
    roughness: 0.1,
    metalness: 0.15,
    clearcoat: 1,
    transparent: true,
    opacity: 0.85,
  });
  const geodeShellMat = new THREE.MeshStandardMaterial({ color: 0xdcd4eb, roughness: 0.5 });
  const amethystMat = new THREE.MeshPhysicalMaterial({
    color: 0xa66eff,
    emissive: 0x6224cc,
    emissiveIntensity: 0.65,
    roughness: 0.12,
    metalness: 0.2,
    clearcoat: 1,
  });
  const aquaCrystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x5efce7,
    emissive: 0x1fc4b5,
    emissiveIntensity: 0.75,
    roughness: 0.1,
    clearcoat: 1,
  });

  // Carved pedestal base
  const pedColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95 * scale, 1.25 * scale, 0.78 * scale, 18),
    woodMat
  );
  pedColumn.position.y = 0.39 * scale;
  pedColumn.castShadow = true;
  pedColumn.receiveShadow = true;
  cake.add(pedColumn);

  const mossBase = new THREE.Mesh(
    new THREE.TorusGeometry(1.22 * scale, 0.14 * scale, 8, 24),
    mossMat
  );
  mossBase.rotation.x = Math.PI / 2;
  mossBase.position.y = 0.08 * scale;
  cake.add(mossBase);

  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75 * scale, 1.68 * scale, 0.22 * scale, 24),
    woodMat
  );
  platter.position.y = 0.84 * scale;
  platter.castShadow = true;
  platter.receiveShadow = true;
  cake.add(platter);

  // Lower Ombre Cake Tier
  const lowerTier = new THREE.Mesh(
    new THREE.CylinderGeometry(1.32 * scale, 1.35 * scale, 0.92 * scale, 28),
    lowerMat
  );
  lowerTier.position.y = 1.41 * scale;
  lowerTier.castShadow = true;
  lowerTier.receiveShadow = true;
  cake.add(lowerTier);

  // Sugar Crystal Filigree Crown & Pastel Flowers around Lower Tier
  const flowerColors = [0xffa6c9, 0xfff0b5, 0x9efcf0];
  for (let i = 0; i < 12; i++) {
    const ang = (i * Math.PI * 2) / 12;
    const fx = Math.cos(ang) * 1.42 * scale;
    const fz = Math.sin(ang) * 1.42 * scale;

    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.11 * scale, 0), spunSugarMat);
    shard.scale.set(0.7, 1.7, 0.7);
    shard.position.set(fx, 1.12 * scale, fz);
    shard.rotation.z = Math.cos(ang) * 0.2;
    cake.add(shard);

    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.085 * scale, 8, 8),
      new THREE.MeshStandardMaterial({ color: flowerColors[i % 3], roughness: 0.35 })
    );
    petal.scale.set(1, 0.65, 1);
    petal.position.set(Math.cos(ang + 0.2) * 1.38 * scale, 1.02 * scale, Math.sin(ang + 0.2) * 1.38 * scale);
    cake.add(petal);
  }

  // Chocolate Piping Border
  const piping = new THREE.Mesh(
    new THREE.TorusGeometry(1.06 * scale, 0.085 * scale, 8, 28),
    pipingMat
  );
  piping.rotation.x = Math.PI / 2;
  piping.position.y = 1.88 * scale;
  cake.add(piping);

  // Upper Rich Dark Chocolate Tier
  const upperTier = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0 * scale, 1.02 * scale, 0.85 * scale, 26),
    chocoMat
  );
  upperTier.position.y = 2.31 * scale;
  upperTier.castShadow = true;
  upperTier.receiveShadow = true;
  cake.add(upperTier);

  // Autumn Maple Leaves Cascading Down Chocolate Tier
  const leafColors = [0xd96b27, 0xe89b35, 0xb83a24];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI * 0.2 + i * 0.24;
    const ly = 2.65 - (i % 5) * 0.18;
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.11 * scale, 0.22 * scale, 4),
      new THREE.MeshStandardMaterial({ color: leafColors[i % 3], roughness: 0.45 })
    );
    leaf.position.set(Math.sin(ang) * 1.03 * scale, ly * scale, Math.cos(ang) * 1.03 * scale);
    leaf.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.6;
    leaf.rotation.x = 0.5;
    cake.add(leaf);
  }

  // Towering Glowing Amethyst & Aqua Crystal Geode Crown
  const geodeGroup = new THREE.Group();
  geodeGroup.position.set(-0.08 * scale, 2.74 * scale, 0);

  const shellBack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46 * scale, 0.54 * scale, 1.45 * scale, 12, 1, false, Math.PI * 0.65, Math.PI * 1.7),
    geodeShellMat
  );
  shellBack.scale.set(1.1, 1, 0.72);
  shellBack.position.y = 0.68 * scale;
  geodeGroup.add(shellBack);

  const capPeak = new THREE.Mesh(new THREE.ConeGeometry(0.5 * scale, 0.55 * scale, 10), geodeShellMat);
  capPeak.scale.set(1.0, 1, 0.68);
  capPeak.position.y = 1.65 * scale;
  geodeGroup.add(capPeak);

  for (let c = 0; c < 14; c++) {
    const ox = ((c % 5) - 2) * 0.14 * scale;
    const oy = 0.22 * scale + Math.floor(c / 5) * 0.38 * scale + (c % 2) * 0.08 * scale;
    const isAqua = Math.abs(ox) < 0.18 * scale && oy < 1.05 * scale;
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry((0.12 + (c % 3) * 0.04) * scale, 0),
      isAqua ? aquaCrystalMat : amethystMat
    );
    crystal.scale.set(0.8, 1.45, 0.8);
    crystal.position.set(ox, oy, 0.06 * scale);
    crystal.rotation.set((c % 3) * 0.25, c * 0.4, (c % 2 === 0 ? 1 : -1) * 0.2);
    geodeGroup.add(crystal);
  }
  cake.add(geodeGroup);

  // Crystal Woodland Fawn perched beside the geode
  const fawn = buildCrystalFawnMesh(0.75 * scale);
  fawn.position.set(0.48 * scale, 2.74 * scale, 0.34 * scale);
  fawn.rotation.y = -0.45;
  cake.add(fawn);

  return cake;
}

function buildSickAnimal3D(kind: SickAnimalKind): THREE.Group {
  const g = new THREE.Group();
  const palette: Record<SickAnimalKind, { body: number; accent: number }> = {
    fawn: { body: 0xc98c58, accent: 0xf7e3c6 },
    hedgehog: { body: 0x7d5840, accent: 0xe6c7a8 },
    bunny: { body: 0xf0e9e4, accent: 0xffb3c9 },
    bird: { body: 0x62b8e8, accent: 0xffe082 },
    otter: { body: 0x6b4832, accent: 0xd9b99b },
  };
  const pal = palette[kind] ?? palette.fawn;
  const bodyMat = new THREE.MeshStandardMaterial({ color: pal.body, roughness: 0.6 });
  const accentMat = new THREE.MeshStandardMaterial({ color: pal.accent, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 14), bodyMat);
  body.scale.set(1, 0.82, 1.28);
  body.position.y = 0.26;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), bodyMat);
  head.position.set(0, 0.44, 0.24);
  g.add(head);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), accentMat);
  belly.position.set(0, 0.28, 0.32);
  g.add(belly);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1410 });
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, kind === 'bunny' ? 0.28 : 0.14, 6),
      accentMat
    );
    ear.position.set(s * 0.12, 0.62, 0.22);
    ear.rotation.z = s * -0.25;
    g.add(ear);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMat);
    eye.position.set(s * 0.085, 0.46, 0.43);
    g.add(eye);
  }

  // Sad glow aura ring until helped
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.56, 24),
    new THREE.MeshBasicMaterial({ color: 0xff9ec7, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  ring.name = 'animalRing';
  g.add(ring);

  return g;
}

function buildTrash3D(kind: TrashKind): THREE.Group {
  const g = new THREE.Group();
  if (kind === 'bottle') {
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x7be0c3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.32, 10), mat);
    body.rotation.z = 1.25;
    body.position.y = 0.13;
    g.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.1, 8), mat);
    neck.rotation.z = 1.25;
    neck.position.set(-0.18, 0.19, 0);
    g.add(neck);
  } else if (kind === 'can') {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.24, 12),
      new THREE.MeshStandardMaterial({ color: 0xd45b5b, metalness: 0.7, roughness: 0.3 })
    );
    body.rotation.z = 1.4;
    body.position.y = 0.11;
    g.add(body);
  } else {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.09, 0.24, 10),
      new THREE.MeshStandardMaterial({ color: 0xf2ebd9, roughness: 0.7 })
    );
    cup.rotation.x = 0.9;
    cup.position.y = 0.12;
    g.add(cup);
  }
  return g;
}

export const Level5Viewport = React.forwardRef<Level5ViewportHandle, Level5ViewportProps>(
  ({ phase, shopProgress, isTouchDevice, onHudUpdate, onEarnDewdrops, onPhaseChange }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const phaseRef = useRef<GamePhase>(phase);
    const shopRef = useRef<SavedShopProgress>(shopProgress);
    const isTouchRef = useRef<boolean>(isTouchDevice);
    const onHudRef = useRef(onHudUpdate);
    const onEarnDewRef = useRef(onEarnDewdrops);
    const onPhaseRef = useRef(onPhaseChange);

    const [webglUnavailable, setWebglUnavailable] = useState(false);
    const [prompts, setPrompts] = useState<ProjectedPrompt[]>([]);

    useEffect(() => {
      phaseRef.current = phase;
    }, [phase]);
    useEffect(() => {
      shopRef.current = shopProgress;
      actionsRef.current?.applyShopLoadout();
    }, [shopProgress]);
    useEffect(() => {
      isTouchRef.current = isTouchDevice;
    }, [isTouchDevice]);
    useEffect(() => {
      onHudRef.current = onHudUpdate;
    }, [onHudUpdate]);
    useEffect(() => {
      onEarnDewRef.current = onEarnDewdrops;
    }, [onEarnDewdrops]);
    useEffect(() => {
      onPhaseRef.current = onPhaseChange;
    }, [onPhaseChange]);

    const inputRef = useRef<Level5Input>({
      left: false,
      right: false,
      forward: false,
      backward: false,
      jumpHeld: false,
    });

    const actionsRef = useRef<{
      triggerJump: () => void;
      releaseJump: () => void;
      triggerPulse: () => void;
      activateFlyingFlower: () => boolean;
      helpNearbyAnimal: () => boolean;
      saveGame: () => boolean;
      respawnAtLantern: () => void;
      restartLevel: () => void;
      loadFromSaved: () => boolean;
      applyShopLoadout: () => void;
      clickAnimalById: (id: number) => void;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      input: inputRef.current,
      triggerJump: () => actionsRef.current?.triggerJump(),
      releaseJump: () => actionsRef.current?.releaseJump(),
      triggerPulse: () => actionsRef.current?.triggerPulse(),
      activateFlyingFlower: () => actionsRef.current?.activateFlyingFlower() ?? false,
      helpNearbyAnimal: () => actionsRef.current?.helpNearbyAnimal() ?? false,
      saveGame: () => actionsRef.current?.saveGame() ?? false,
      respawnAtLantern: () => actionsRef.current?.respawnAtLantern(),
      restartLevel: () => actionsRef.current?.restartLevel(),
      clearHeldInputs: () => {
        inputRef.current.left = false;
        inputRef.current.right = false;
        inputRef.current.forward = false;
        inputRef.current.backward = false;
        inputRef.current.jumpHeld = false;
      },
      loadFromSaved: () => actionsRef.current?.loadFromSaved() ?? false,
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const isSoftwareGl = detectSoftwareGl();
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
        });
      } catch {
        setWebglUnavailable(true);
        return;
      }

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const initW = Math.max(320, container.clientWidth);
      const initH = Math.max(240, container.clientHeight);
      renderer.setSize(initW, initH);

      const canvas = renderer.domElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.touchAction = 'none';
      container.innerHTML = '';
      container.appendChild(canvas);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setWebglUnavailable(true);
      };
      const handleContextRestored = () => {
        setWebglUnavailable(false);
      };
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x28472e);
      scene.fog = new THREE.FogExp2(0x4f7349, 0.0155);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
      roomEnv.dispose();
      pmrem.dispose();

      const camera = new THREE.PerspectiveCamera(54, initW / initH, 0.15, 160);
      camera.position.set(0, 4.2, 6.8);

      // Warm/Cool Sunlight + Canopy Rim Lighting
      const hemi = new THREE.HemisphereLight(0xf2ffd6, 0x1e4028, 1.35);
      scene.add(hemi);

      const sunLight = new THREE.DirectionalLight(0xffefc2, 2.0);
      sunLight.position.set(16, 28, 12);
      sunLight.castShadow = !isSoftwareGl;
      if (!isSoftwareGl) {
        sunLight.shadow.mapSize.set(1024, 1024);
        sunLight.shadow.camera.near = 2;
        sunLight.shadow.camera.far = 75;
        sunLight.shadow.camera.left = -22;
        sunLight.shadow.camera.right = 22;
        sunLight.shadow.camera.top = 22;
        sunLight.shadow.camera.bottom = -22;
        sunLight.shadow.bias = -0.0005;
        sunLight.shadow.normalBias = 0.02;
      }
      scene.add(sunLight);
      scene.add(sunLight.target);

      const rimLight = new THREE.DirectionalLight(0x7cfce7, 0.75);
      rimLight.position.set(-14, 10, -24);
      scene.add(rimLight);

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const trailTex = createTrailGroundTexture(maxAniso);
      const barkTex = createMossyBarkTexture(maxAniso);
      const frostingTex = createOmbreFrostingTexture(maxAniso);

      // Rolling Enchanted Trail Terrain
      const terrainGeo = new THREE.PlaneGeometry(46, TRAIL_LENGTH + 48, 44, 128);
      terrainGeo.rotateX(-Math.PI / 2);
      const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i) - (TRAIL_LENGTH * 0.5 - 12);
        const cx = pathCenterX(vz);
        const worldX = vx + cx;
        posAttr.setX(i, worldX);
        posAttr.setZ(i, vz);
        posAttr.setY(i, groundHeightAt(worldX, vz));
      }
      terrainGeo.computeVertexNormals();
      const terrainMat = new THREE.MeshStandardMaterial({
        map: trailTex,
        roughness: 0.88,
        metalness: 0.02,
      });
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.receiveShadow = true;
      scene.add(terrainMesh);

      // Volumetric Diagonal Golden Sunbeams
      const sunbeams: THREE.Mesh[] = [];
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffe8a3,
        transparent: true,
        opacity: 0.095,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      for (let b = 0; b < 9; b++) {
        const bz = -10 - b * 19;
        const bx = pathCenterX(bz) + (b % 2 === 0 ? -2.2 : 2.2);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 3.6, 22, 12, 1, true), beamMat.clone());
        beam.position.set(bx, groundHeightAt(bx, bz) + 9, bz);
        beam.rotation.z = -0.34;
        beam.rotation.x = 0.12;
        scene.add(beam);
        sunbeams.push(beam);
      }

      // Gnarled Ancient Mossy Trees + Glowing Orb Hollows along Left & Right Banks
      const barkMat = new THREE.MeshStandardMaterial({
        map: barkTex,
        color: 0x6b4f38,
        roughness: 0.84,
      });
      const canopyMat = new THREE.MeshStandardMaterial({
        color: 0x2c5c2f,
        roughness: 0.78,
      });
      const mossCapMat = new THREE.MeshStandardMaterial({ color: 0x5c9e3e, roughness: 0.8 });
      const hollowOrbMat = new THREE.MeshStandardMaterial({
        color: 0xfff3b0,
        emissive: 0xffc64d,
        emissiveIntensity: 1.4,
        roughness: 0.15,
      });

      for (let t = 0; t < 28; t++) {
        const tz = -4 - t * 6.4;
        const side = t % 2 === 0 ? -1 : 1;
        const dist = 5.4 + (t % 3) * 1.4;
        const tx = pathCenterX(tz) + side * dist;
        const ty = groundHeightAt(tx, tz);
        const h = 7.5 + (t % 4) * 1.6;

        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, ty - 0.3, tz);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.88, h, 9), barkMat);
        trunk.position.y = h * 0.5;
        trunk.rotation.z = side * 0.16;
        trunk.castShadow = !isSoftwareGl;
        treeGroup.add(trunk);

        // Sweeping mossy root curving toward the edge of the trail
        const rootCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 1.4, 0),
          new THREE.Vector3(-side * 1.3, 0.65, 0.3),
          new THREE.Vector3(-side * 2.5, 0.12, 0.1),
        ]);
        const rootMesh = new THREE.Mesh(new THREE.TubeGeometry(rootCurve, 8, 0.22, 7, false), barkMat);
        treeGroup.add(rootMesh);

        // Canopy cluster
        const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), canopyMat);
        canopy.scale.set(1.2, 0.65, 1.1);
        canopy.position.set(-side * 0.9, h + 0.4, 0);
        treeGroup.add(canopy);

        const mossShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), mossCapMat);
        mossShoulder.scale.set(1.3, 0.55, 1.1);
        mossShoulder.position.set(-side * 0.85, 0.85, 0.2);
        treeGroup.add(mossShoulder);

        // Glowing golden orb hollows on selected ancient trunks
        if (t % 3 === 0) {
          const hollow = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), hollowOrbMat);
          hollow.position.set(-side * 0.58, 2.2 + (t % 2) * 1.1, 0.28);
          treeGroup.add(hollow);
        }

        scene.add(treeGroup);
      }

      // Instanced Ferns & Bioluminescent Mushrooms along Banks
      const fernCount = 160;
      const fernMesh = new THREE.InstancedMesh(
        new THREE.ConeGeometry(0.26, 0.95, 5),
        new THREE.MeshStandardMaterial({ color: 0x3fa84e, roughness: 0.72 }),
        fernCount
      );
      const dummy = new THREE.Object3D();
      const tintColor = new THREE.Color();
      for (let i = 0; i < fernCount; i++) {
        const fz = -2 - (i / fernCount) * (TRAIL_LENGTH + 8);
        const side = i % 2 === 0 ? -1 : 1;
        const fx = pathCenterX(fz) + side * (3.2 + ((i * 37) % 100) * 0.085);
        const fy = groundHeightAt(fx, fz);
        dummy.position.set(fx, fy + 0.25, fz);
        dummy.rotation.set(((i % 5) - 2) * 0.14, i * 0.7, side * -0.42);
        const sc = 0.75 + (i % 4) * 0.2;
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        fernMesh.setMatrixAt(i, dummy.matrix);
        tintColor.setHSL(0.32 + (i % 5) * 0.015, 0.58, 0.44 + (i % 3) * 0.05);
        fernMesh.setColorAt(i, tintColor);
      }
      fernMesh.instanceMatrix.needsUpdate = true;
      if (fernMesh.instanceColor) fernMesh.instanceColor.needsUpdate = true;
      fernMesh.computeBoundingSphere();
      scene.add(fernMesh);

      // Decorative Small Cyan & Pink Glowing Mushrooms along banks
      const mushStemMat = new THREE.MeshStandardMaterial({ color: 0xf7f5eb, roughness: 0.65 });
      const cyanCapMat = new THREE.MeshStandardMaterial({
        color: 0x62f5d8,
        emissive: 0x26d9bf,
        emissiveIntensity: 0.85,
        roughness: 0.25,
      });
      const pinkCapMat = new THREE.MeshStandardMaterial({
        color: 0xff7ae2,
        emissive: 0xe63eb8,
        emissiveIntensity: 0.85,
        roughness: 0.25,
      });
      for (let m = 0; m < 44; m++) {
        const mz = -3 - m * 3.9;
        const side = m % 2 === 0 ? -1 : 1;
        const mx = pathCenterX(mz) + side * (3.1 + (m % 4) * 0.65);
        const my = groundHeightAt(mx, mz);
        const s = 0.8 + (m % 3) * 0.25;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.07 * s, 0.26 * s, 8), mushStemMat);
        stem.position.set(mx, my + 0.13 * s, mz);
        scene.add(stem);
        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.19 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58),
          m % 3 === 1 ? pinkCapMat : cyanCapMat
        );
        cap.position.set(mx, my + 0.24 * s, mz);
        scene.add(cap);
      }

      // Playable Platforms (Wood Branches + Dessert Geode Cake Waypoints!)
      interface Platform3D {
        x: number;
        y: number; // Top standing surface Y
        z: number;
        rx: number;
        rz: number;
      }
      const platforms: Platform3D[] = [];

      const cakeWaypoints = [
        { z: -46, xOff: 0, scale: 0.85 },
        { z: -92, xOff: -1.4, scale: 0.9 },
        { z: -134, xOff: 1.5, scale: 0.92 },
      ];
      for (const cw of cakeWaypoints) {
        const x = pathCenterX(cw.z) + cw.xOff;
        const baseY = groundHeightAt(x, cw.z);
        const landmark = buildGeodeCakeLandmark(cw.scale, frostingTex, barkTex);
        landmark.position.set(x, baseY, cw.z);
        scene.add(landmark);
        // Platter & Upper Cake tiers are climbable!
        platforms.push({
          x,
          y: baseY + 0.95 * cw.scale,
          z: cw.z,
          rx: 1.75 * cw.scale,
          rz: 1.75 * cw.scale,
        });
        platforms.push({
          x,
          y: baseY + 2.74 * cw.scale,
          z: cw.z,
          rx: 1.08 * cw.scale,
          rz: 1.08 * cw.scale,
        });
      }

      // Floating Mossy Root Platforms bridging trail sections
      const bridgeSpecs = [
        { z: -24, xOff: -1.8, lift: 1.65, w: 3.4, d: 3.6 },
        { z: -30, xOff: 1.2, lift: 2.35, w: 3.4, d: 3.6 },
        { z: -66, xOff: 0, lift: 1.85, w: 3.8, d: 4.2 },
        { z: -72, xOff: -1.6, lift: 2.85, w: 3.4, d: 3.6 },
        { z: -112, xOff: 1.4, lift: 1.9, w: 3.6, d: 4.0 },
        { z: -118, xOff: -0.8, lift: 2.85, w: 3.6, d: 3.8 },
        { z: -152, xOff: 0, lift: 2.1, w: 4.2, d: 4.2 },
      ];
      const platWoodMat = new THREE.MeshStandardMaterial({ map: barkTex, color: 0x6f5339, roughness: 0.78 });
      const platMossMat = new THREE.MeshStandardMaterial({ color: 0x56a343, roughness: 0.76 });
      for (const bs of bridgeSpecs) {
        const px = pathCenterX(bs.z) + bs.xOff;
        const py = groundHeightAt(px, bs.z) + bs.lift;
        const platGroup = new THREE.Group();
        platGroup.position.set(px, py, bs.z);

        const slab = new THREE.Mesh(new THREE.BoxGeometry(bs.w, 0.34, bs.d), platWoodMat);
        slab.position.y = -0.17;
        slab.castShadow = !isSoftwareGl;
        slab.receiveShadow = true;
        platGroup.add(slab);

        const moss = new THREE.Mesh(new THREE.BoxGeometry(bs.w + 0.12, 0.14, bs.d + 0.12), platMossMat);
        moss.position.y = -0.02;
        moss.receiveShadow = true;
        platGroup.add(moss);

        scene.add(platGroup);
        platforms.push({ x: px, y: py + 0.05, z: bs.z, rx: bs.w * 0.52, rz: bs.d * 0.52 });
      }

      // Grand Centerpiece Geode Cake Sanctuary at z = -170!
      const sanctX = pathCenterX(SANCTUARY_Z);
      const sanctY = groundHeightAt(sanctX, SANCTUARY_Z);
      const sanctuaryGroup = new THREE.Group();
      sanctuaryGroup.position.set(sanctX, sanctY, SANCTUARY_Z);
      const grandCake = buildGeodeCakeLandmark(1.55, frostingTex, barkTex);
      sanctuaryGroup.add(grandCake);

      const sanctuaryRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.8, 0.08, 10, 48),
        new THREE.MeshBasicMaterial({ color: 0xffe485, transparent: true, opacity: 0.72 })
      );
      sanctuaryRing.rotation.x = Math.PI / 2;
      sanctuaryRing.position.y = 0.14;
      sanctuaryGroup.add(sanctuaryRing);

      const sanctuaryLight = new THREE.PointLight(0x8fffe6, 3.2, 22);
      sanctuaryLight.position.set(0, 4.8, 1.2);
      sanctuaryGroup.add(sanctuaryLight);
      scene.add(sanctuaryGroup);

      // Bouncy Glow Mushrooms
      interface BounceMush3D {
        x: number;
        y: number;
        z: number;
        mesh: THREE.Group;
        bounceAnim: number;
      }
      const bounceMushrooms: BounceMush3D[] = [];
      const bounceZs = [-20, -40, -61, -86, -107, -129, -147];
      bounceZs.forEach((bz, idx) => {
        const bx = pathCenterX(bz) + (idx % 2 === 0 ? -1.1 : 1.1);
        const by = groundHeightAt(bx, bz);
        const mg = new THREE.Group();
        mg.position.set(bx, by, bz);

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.55, 10), mushStemMat);
        stem.position.y = 0.27;
        mg.add(stem);

        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.72, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
          idx % 2 === 0 ? cyanCapMat : pinkCapMat
        );
        cap.position.y = 0.45;
        mg.add(cap);

        scene.add(mg);
        bounceMushrooms.push({ x: bx, y: by, z: bz, mesh: mg, bounceAnim: 0 });
      });

      // Sky Wind Rings
      interface SkyRing3D {
        x: number;
        y: number;
        z: number;
        mesh: THREE.Mesh;
        cooldown: number;
      }
      const skyRings: SkyRing3D[] = [];
      const ringSpecs = [
        { z: -34, lift: 3.1 },
        { z: -78, lift: 3.3 },
        { z: -123, lift: 3.2 },
        { z: -157, lift: 3.0 },
      ];
      for (const rs of ringSpecs) {
        const rx = pathCenterX(rs.z);
        const ry = groundHeightAt(rx, rs.z) + rs.lift;
        const rMesh = new THREE.Mesh(
          new THREE.TorusGeometry(1.35, 0.08, 12, 32),
          new THREE.MeshStandardMaterial({
            color: 0xffe485,
            emissive: 0xffb833,
            emissiveIntensity: 0.9,
            roughness: 0.2,
          })
        );
        rMesh.position.set(rx, ry, rs.z);
        scene.add(rMesh);
        skyRings.push({ x: rx, y: ry, z: rs.z, mesh: rMesh, cooldown: 0 });
      }

      // Spirit Lantern Checkpoints
      interface Lantern3D {
        x: number;
        y: number;
        z: number;
        lit: boolean;
        orbMat: THREE.MeshStandardMaterial;
        group: THREE.Group;
      }
      const lanterns: Lantern3D[] = [];
      const lanternZs = [-18, -50, -82, -110, -138, -158];
      lanternZs.forEach((lz, idx) => {
        const lx = pathCenterX(lz) + (idx % 2 === 0 ? 2.3 : -2.3);
        const ly = groundHeightAt(lx, lz);
        const lg = new THREE.Group();
        lg.position.set(lx, ly, lz);

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 1.85, 8), barkMat);
        post.position.y = 0.92;
        lg.add(post);

        const orbMat = new THREE.MeshStandardMaterial({
          color: 0x85998d,
          emissive: 0x223028,
          emissiveIntensity: 0.35,
          roughness: 0.2,
        });
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), orbMat);
        bulb.position.y = 1.95;
        lg.add(bulb);

        scene.add(lg);
        lanterns.push({ x: lx, y: ly, z: lz, lit: false, orbMat, group: lg });
      });

      // Collectibles (Orbs, Blossoms, Crystals, Star Seeds, Flying Flowers, High Jumps)
      type CollectKind = 'orb' | 'blossom' | 'crystal' | 'starseed' | 'flyingflower' | 'highjump';
      interface Collectible3D {
        idx: number;
        kind: CollectKind;
        x: number;
        baseY: number;
        z: number;
        collected: boolean;
        phase: number;
        mesh: THREE.Object3D;
      }
      const collectibles: Collectible3D[] = [];
      const addCollectible = (kind: CollectKind, x: number, y: number, z: number) => {
        const idx = collectibles.length;
        let mesh: THREE.Object3D;
        if (kind === 'orb') {
          mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.22, 1),
            new THREE.MeshStandardMaterial({
              color: 0x8cfce7,
              emissive: 0x3be8c6,
              emissiveIntensity: 0.95,
              roughness: 0.15,
            })
          );
        } else if (kind === 'blossom') {
          mesh = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.28, 0),
            new THREE.MeshStandardMaterial({
              color: 0xffd27a,
              emissive: 0xff9e3d,
              emissiveIntensity: 0.85,
              roughness: 0.22,
            })
          );
        } else if (kind === 'crystal') {
          mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.32, 0),
            new THREE.MeshPhysicalMaterial({
              color: 0xa6f2ff,
              emissive: 0x3ec6ff,
              emissiveIntensity: 0.9,
              roughness: 0.1,
              clearcoat: 1,
            })
          );
          mesh.scale.set(0.8, 1.4, 0.8);
        } else if (kind === 'starseed') {
          mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.34, 0),
            new THREE.MeshStandardMaterial({
              color: 0xe6b8ff,
              emissive: 0xb25cff,
              emissiveIntensity: 1.0,
              roughness: 0.15,
            })
          );
        } else if (kind === 'flyingflower') {
          mesh = new THREE.Mesh(
            new THREE.TorusKnotGeometry(0.2, 0.06, 24, 6, 2, 3),
            new THREE.MeshStandardMaterial({
              color: 0xff9ef0,
              emissive: 0xff4ad2,
              emissiveIntensity: 0.9,
              roughness: 0.2,
            })
          );
        } else {
          mesh = new THREE.Mesh(
            new THREE.ConeGeometry(0.22, 0.44, 6),
            new THREE.MeshStandardMaterial({
              color: 0x7dfae7,
              emissive: 0x26d6b5,
              emissiveIntensity: 0.85,
              roughness: 0.2,
            })
          );
        }
        mesh.position.set(x, y, z);
        scene.add(mesh);
        collectibles.push({
          idx,
          kind,
          x,
          baseY: y,
          z,
          collected: false,
          phase: idx * 0.55,
          mesh,
        });
      };

      // Trail Lumina Orbs (28)
      for (let i = 0; i < 28; i++) {
        const cz = -7 - i * 5.6;
        const cx = pathCenterX(cz) + Math.sin(i * 1.1) * 1.5;
        const cy = groundHeightAt(cx, cz) + 0.95 + (i % 4 === 2 ? 1.1 : 0);
        addCollectible('orb', cx, cy, cz);
      }

      // Sun Blossoms (6) near cake pedestals & landmarks
      [-26, -46, -68, -92, -134, -154].forEach((bz, idx) => {
        const bx = pathCenterX(bz) + (idx % 2 === 0 ? 1.4 : -1.4);
        const by = groundHeightAt(bx, bz) + (idx % 2 === 1 ? 3.2 : 1.15);
        addCollectible('blossom', bx, by, bz);
      });

      // Prism Crystals (5)
      [-22, -56, -84, -118, -146].forEach((cz, idx) => {
        const cx = pathCenterX(cz) + (idx % 2 === 0 ? -1.4 : 1.4);
        addCollectible('crystal', cx, groundHeightAt(cx, cz) + 1.2, cz);
      });

      // Star Seeds (3) perched high on cake tops & elevated bridges
      addCollectible('starseed', pathCenterX(-46), groundHeightAt(pathCenterX(-46), -46) + 3.2, -46);
      addCollectible('starseed', pathCenterX(-92) - 1.4, groundHeightAt(pathCenterX(-92) - 1.4, -92) + 3.35, -92);
      addCollectible('starseed', pathCenterX(-134) + 1.5, groundHeightAt(pathCenterX(-134) + 1.5, -134) + 3.4, -134);

      // Flying Flowers (3) & High Jumps (3)
      [-32, -88, -130].forEach((fz) => {
        const fx = pathCenterX(fz);
        addCollectible('flyingflower', fx, groundHeightAt(fx, fz) + 1.15, fz);
      });
      [-16, -62, -104].forEach((hz) => {
        const hx = pathCenterX(hz) + 0.9;
        addCollectible('highjump', hx, groundHeightAt(hx, hz) + 1.1, hz);
      });

      // Sick Woodland Animals (6) needing rescue + granting 5s Safe Shield
      interface Animal3D {
        id: number;
        kind: SickAnimalKind;
        name: string;
        x: number;
        y: number;
        z: number;
        helped: boolean;
        mesh: THREE.Group;
      }
      const animalSpecs: { kind: SickAnimalKind; name: string; z: number; xOff: number }[] = [
        { kind: 'fawn', name: 'Fawn', z: -14, xOff: -1.6 },
        { kind: 'hedgehog', name: 'Hedgehog', z: -38, xOff: 1.8 },
        { kind: 'bunny', name: 'Bunny', z: -64, xOff: -1.5 },
        { kind: 'otter', name: 'Otter', z: -98, xOff: 1.7 },
        { kind: 'bird', name: 'Songbird', z: -124, xOff: -1.6 },
        { kind: 'fawn', name: 'Crystal Fawn', z: -150, xOff: 1.6 },
      ];
      const sickAnimals: Animal3D[] = animalSpecs.map((spec, id) => {
        const ax = pathCenterX(spec.z) + spec.xOff;
        const ay = groundHeightAt(ax, spec.z);
        const mesh = buildSickAnimal3D(spec.kind);
        mesh.position.set(ax, ay, spec.z);
        mesh.rotation.y = spec.xOff > 0 ? -0.8 : 0.8;
        mesh.userData.animalId = id;
        scene.add(mesh);
        return { id, kind: spec.kind, name: spec.name, x: ax, y: ay, z: spec.z, helped: false, mesh };
      });

      // Woodland Litter / Trash Items (10)
      interface Trash3D {
        id: number;
        x: number;
        y: number;
        z: number;
        collected: boolean;
        mesh: THREE.Group;
      }
      const trashKinds: TrashKind[] = ['bottle', 'can', 'cup', 'bottle', 'can', 'cup', 'bottle', 'can', 'cup', 'bottle'];
      const trashItems: Trash3D[] = trashKinds.map((kind, id) => {
        const tz = -11 - id * 15.2;
        const tx = pathCenterX(tz) + (id % 2 === 0 ? 1.9 : -1.9);
        const ty = groundHeightAt(tx, tz);
        const mesh = buildTrash3D(kind);
        mesh.position.set(tx, ty, tz);
        mesh.rotation.y = id * 0.9;
        scene.add(mesh);
        return { id, x: tx, y: ty, z: tz, collected: false, mesh };
      });

      // Mischievous Thorn Wisps (7) patrolling laterally across the trail
      interface Wisp3D {
        homeX: number;
        z: number;
        x: number;
        y: number;
        range: number;
        speed: number;
        phase: number;
        stunTimer: number;
        mesh: THREE.Group;
      }
      const wisps: Wisp3D[] = [];
      const wispZs = [-28, -54, -76, -101, -120, -141, -160];
      const wispCoreMat = new THREE.MeshStandardMaterial({
        color: 0x3b1347,
        emissive: 0xd93870,
        emissiveIntensity: 0.95,
        roughness: 0.3,
      });
      const wispSpikeMat = new THREE.MeshStandardMaterial({
        color: 0x1e0b26,
        emissive: 0x8f2454,
        emissiveIntensity: 0.5,
      });
      wispZs.forEach((wz, idx) => {
        const homeX = pathCenterX(wz);
        const wy = groundHeightAt(homeX, wz) + 0.75;
        const wg = new THREE.Group();
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 1), wispCoreMat.clone());
        wg.add(core);
        for (let s = 0; s < 4; s++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 5), wispSpikeMat);
          const ang = (s * Math.PI) / 2;
          spike.position.set(Math.cos(ang) * 0.45, 0, Math.sin(ang) * 0.45);
          spike.rotation.z = -Math.cos(ang) * 1.4;
          spike.rotation.x = Math.sin(ang) * 1.4;
          wg.add(spike);
        }
        wg.position.set(homeX, wy, wz);
        scene.add(wg);
        wisps.push({
          homeX,
          z: wz,
          x: homeX,
          y: wy,
          range: 2.3,
          speed: 1.35 + (idx % 3) * 0.3,
          phase: idx * 1.2,
          stunTimer: 0,
          mesh: wg,
        });
      });

      // Ambient Fireflies & Seasonal Weather 3D Particle Clouds
      const fireflyCount = 90;
      const fireflyPos = new Float32Array(fireflyCount * 3);
      for (let i = 0; i < fireflyCount; i++) {
        const fz = -Math.random() * TRAIL_LENGTH;
        const fx = pathCenterX(fz) + (Math.random() - 0.5) * 14;
        fireflyPos[i * 3] = fx;
        fireflyPos[i * 3 + 1] = groundHeightAt(fx, fz) + 0.8 + Math.random() * 4.5;
        fireflyPos[i * 3 + 2] = fz;
      }
      const fireflyGeo = new THREE.BufferGeometry();
      fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
      const fireflyPoints = new THREE.Points(
        fireflyGeo,
        new THREE.PointsMaterial({ color: 0xffe896, size: 0.22, transparent: true, opacity: 0.85 })
      );
      scene.add(fireflyPoints);

      // Rain / Snow / Leaf seasonal weather particles following camera
      const weatherCount = 110;
      const weatherPos = new Float32Array(weatherCount * 3);
      for (let i = 0; i < weatherCount; i++) {
        weatherPos[i * 3] = (Math.random() - 0.5) * 26;
        weatherPos[i * 3 + 1] = Math.random() * 14;
        weatherPos[i * 3 + 2] = (Math.random() - 0.5) * 28;
      }
      const weatherGeo = new THREE.BufferGeometry();
      weatherGeo.setAttribute('position', new THREE.BufferAttribute(weatherPos, 3));
      const weatherMat = new THREE.PointsMaterial({
        color: 0xdff8ff,
        size: 0.18,
        transparent: true,
        opacity: 0,
      });
      const weatherPoints = new THREE.Points(weatherGeo, weatherMat);
      scene.add(weatherPoints);

      // Spirit Player Rig
      const spiritRig = createSpiritCharacterRig(shopRef.current.equipped, !isSoftwareGl);
      const spiritRoot = spiritRig.root;
      // Rotate Spirit so face/front points forward along -Z (into the screen)
      spiritRoot.rotation.y = Math.PI;
      scene.add(spiritRoot);

      // Contact shadow disc under Spirit
      const contactShadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.46, 20),
        new THREE.MeshBasicMaterial({ color: 0x0b1f12, transparent: true, opacity: 0.36, depthWrite: false })
      );
      contactShadow.rotation.x = -Math.PI / 2;
      scene.add(contactShadow);

      // Pulse Shockwave Ring
      const pulseRing = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.08, 10, 36),
        new THREE.MeshBasicMaterial({ color: 0x7cfce7, transparent: true, opacity: 0 })
      );
      pulseRing.rotation.x = Math.PI / 2;
      pulseRing.visible = false;
      scene.add(pulseRing);

      // Player Gameplay State
      const hasHeart = () => shopRef.current.equipped.charm === 'sanctuary_heart';
      const state = {
        x: pathCenterX(0),
        y: groundHeightAt(pathCenterX(0), 0),
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        facingYaw: Math.PI,
        onGround: true,
        coyoteTime: 0.12,
        jumpsLeft: 2,
        gliding: false,
        pulseCooldown: 0,
        pulseTimer: 0,
        crystalBoostTimer: 0,
        extraAirJumpTimer: 0,
        highJumpCharges: 0,
        flyingFlowers: 0,
        flyingTimer: 0,
        invulnTimer: 0,
        wardShieldTimer: 0,
        petals: hasHeart() ? 4 : 3,
        maxPetals: hasHeart() ? 4 : 3,
        checkpointX: pathCenterX(0),
        checkpointY: groundHeightAt(pathCenterX(0), 0),
        checkpointZ: 0,
        elapsedSeconds: 0,
        orbsCollected: 0,
        blossomsCollected: 0,
        crystalsCollected: 0,
        starseedsCollected: 0,
        sanctuaryAwakened: false,
        movePhase: 0,
      };

      const popups: { x: number; y: number; z: number; text: string; color: string; life: number }[] = [];
      const addPopup = (x: number, y: number, z: number, text: string, color: string) => {
        popups.push({ x, y, z, text, color, life: 1.5 });
      };

      const orbsTotal = collectibles.filter((c) => c.kind === 'orb').length;
      const blossomsTotal = collectibles.filter((c) => c.kind === 'blossom').length;
      const crystalsTotal = collectibles.filter((c) => c.kind === 'crystal').length;
      const starseedsTotal = collectibles.filter((c) => c.kind === 'starseed').length;

      let currentSeasonLabel = 'Warm Sunbeams · Dessert Delight';
      const _projVec = new THREE.Vector3();

      const emitSnapshot = () => {
        const animalsHelped = sickAnimals.filter((a) => a.helped).length;
        const trashCollected = trashItems.filter((t) => t.collected).length;
        const lanternsLit = lanterns.filter((l) => l.lit).length;
        const progressPct = clamp(Math.round((Math.max(0, -state.z) / TRAIL_LENGTH) * 100), 0, 100);

        onHudRef.current({
          phase: phaseRef.current,
          levelId: 5,
          levelName: 'Sunbeam Dessert Glade',
          orbsCollected: state.orbsCollected,
          orbsTotal,
          blossomsCollected: state.blossomsCollected,
          blossomsTotal,
          crystalsCollected: state.crystalsCollected,
          crystalsTotal,
          starseedsCollected: state.starseedsCollected,
          starseedsTotal,
          lanternsLit,
          lanternsTotal: lanterns.length,
          animalsHelped,
          animalsTotal: sickAnimals.length,
          trashCollected,
          trashTotal: trashItems.length,
          wardShieldLeft: Math.max(0, Math.round(state.wardShieldTimer * 10) / 10),
          petals: state.petals,
          maxPetals: state.maxPetals,
          biomeName: 'Emerald Sunbeam Glade',
          weatherLabel: currentSeasonLabel,
          elapsedSeconds: Math.floor(state.elapsedSeconds),
          progressPct,
          crystalBoostActive: state.crystalBoostTimer > 0,
          tripleJumpActive: state.extraAirJumpTimer > 0,
          highJumpCharges: state.highJumpCharges,
          flyingFlowers: state.flyingFlowers,
          flyingTimeLeft: Math.max(0, Math.round(state.flyingTimer * 10) / 10),
          underwaterActive: false,
          dewdrops: shopRef.current.dewdrops,
          equipped: { ...shopRef.current.equipped },
          savedGame: getSavedGameSummary(),
        });
      };

      const awardDew = (amt: number) => {
        onEarnDewRef.current(amt);
      };

      const helpAnimal = (animal: Animal3D) => {
        if (animal.helped) return;
        animal.helped = true;
        state.wardShieldTimer = Math.max(state.wardShieldTimer, 5.0);
        const ring = animal.mesh.getObjectByName('animalRing');
        if (ring) ring.visible = false;
        audioEngine.playAnimalHealed();
        awardDew(8);
        addPopup(animal.x, animal.y + 1.1, animal.z, `${animal.name} Helped! 5s Safe Shield`, '#ffb8e8');
        emitSnapshot();
      };

      const triggerJump = () => {
        if (phaseRef.current !== 'PLAYING') return;
        audioEngine.unlock();
        const maxAirJumps =
          shopRef.current.equipped.power === 'super_sky_leap' || state.extraAirJumpTimer > 0 ? 3 : 2;
        const jumpPowerMult =
          (shopRef.current.equipped.power === 'super_sky_leap' ? 1.12 : 1) *
          (shopRef.current.equipped.power === 'super_fairy_sparkle' ? 1.08 : 1);

        if (state.flyingTimer > 0) {
          state.vy = 6.2;
          return;
        }

        if (state.onGround || state.coyoteTime > 0) {
          const boost = state.highJumpCharges > 0 ? 1.32 : 1;
          if (state.highJumpCharges > 0) {
            state.highJumpCharges--;
            audioEngine.playHighJump();
          } else {
            audioEngine.playJump(false);
          }
          state.vy = 8.4 * jumpPowerMult * boost;
          state.onGround = false;
          state.coyoteTime = 0;
          state.jumpsLeft = maxAirJumps - 1;
        } else if (state.jumpsLeft > 0) {
          state.vy = 7.8 * jumpPowerMult;
          state.jumpsLeft--;
          audioEngine.playJump(true);
        }
      };

      const releaseJump = () => {
        inputRef.current.jumpHeld = false;
        state.gliding = false;
      };

      const triggerPulse = () => {
        if (phaseRef.current !== 'PLAYING' || state.pulseCooldown > 0) return;
        audioEngine.unlock();
        audioEngine.playPulse();
        const isNova = shopRef.current.equipped.power === 'super_nova_pulse';
        state.pulseCooldown = isNova ? 1.2 : 1.5;
        state.pulseTimer = 0.55;
        const radius = isNova ? 9.5 : 6.2;

        pulseRing.visible = true;
        pulseRing.position.set(state.x, state.y + 0.65, state.z);
        pulseRing.scale.setScalar(0.5);
        (pulseRing.material as THREE.MeshBasicMaterial).color.setHex(isNova ? 0xffd86b : 0x7cfce7);
        (pulseRing.material as THREE.MeshBasicMaterial).opacity = 0.9;

        for (const w of wisps) {
          const d = Math.hypot(w.x - state.x, w.z - state.z);
          if (d <= radius) {
            w.stunTimer = isNova ? 6.0 : 4.0;
          }
        }
        for (const l of lanterns) {
          const d = Math.hypot(l.x - state.x, l.z - state.z);
          if (!l.lit && d <= radius) {
            l.lit = true;
            l.orbMat.color.setHex(0xfff3a8);
            l.orbMat.emissive.setHex(0xffc64d);
            l.orbMat.emissiveIntensity = 1.6;
            state.checkpointX = l.x;
            state.checkpointY = l.y;
            state.checkpointZ = l.z;
            audioEngine.playLantern();
            awardDew(5);
            addPopup(l.x, l.y + 2.1, l.z, 'Lantern Lit!', '#ffe494');
          }
        }
        emitSnapshot();
      };

      const activateFlyingFlower = (): boolean => {
        if (phaseRef.current !== 'PLAYING' || state.flyingFlowers <= 0) return false;
        audioEngine.unlock();
        audioEngine.playFlyActivate();
        state.flyingFlowers--;
        state.flyingTimer = shopRef.current.equipped.power === 'super_star_magnet' ? 7.5 : 5.5;
        state.vy = Math.max(state.vy, 5.5);
        addPopup(state.x, state.y + 1.8, state.z, 'Winged Flight!', '#ff9ef0');
        emitSnapshot();
        return true;
      };

      const helpNearbyAnimal = (): boolean => {
        if (phaseRef.current !== 'PLAYING') return false;
        let best: Animal3D | null = null;
        let bestD = Infinity;
        for (const a of sickAnimals) {
          if (a.helped) continue;
          const d = Math.hypot(a.x - state.x, a.z - state.z);
          if (d < 5.5 && d < bestD) {
            bestD = d;
            best = a;
          }
        }
        if (best) {
          helpAnimal(best);
          return true;
        }
        for (const t of trashItems) {
          if (t.collected) continue;
          const d = Math.hypot(t.x - state.x, t.z - state.z);
          if (d < 4.5) {
            t.collected = true;
            t.mesh.visible = false;
            audioEngine.playTrashPickup();
            awardDew(3);
            addPopup(t.x, t.y + 1.1, t.z, '+3 Dew · Litter Cleaned', '#8cf8e8');
            emitSnapshot();
            return true;
          }
        }
        return false;
      };

      const saveGame = (): boolean => {
        if (phaseRef.current !== 'PLAYING' && phaseRef.current !== 'PAUSED') return false;
        const ok = saveGameState({
          version: 1,
          savedAt: Date.now(),
          levelId: 5,
          playerX: state.z, // Encode forward trail position in playerX for summary %
          playerY: state.x,
          checkpointX: state.checkpointZ,
          checkpointY: state.checkpointX,
          petals: state.petals,
          highJumpCharges: state.highJumpCharges,
          flyingFlowers: state.flyingFlowers,
          elapsedSeconds: state.elapsedSeconds,
          orbsCollected: state.orbsCollected,
          blossomsCollected: state.blossomsCollected,
          crystalsCollected: state.crystalsCollected,
          starseedsCollected: state.starseedsCollected,
          collectedIndices: collectibles.filter((c) => c.collected).map((c) => c.idx),
          litLanternIndices: lanterns.map((l, idx) => (l.lit ? idx : -1)).filter((i) => i >= 0),
          blessedCreatureIds: [],
          pacifiedBaddieIds: [],
          helpedAnimalIds: sickAnimals.filter((a) => a.helped).map((a) => a.id),
          collectedTrashIds: trashItems.filter((t) => t.collected).map((t) => t.id),
        });
        saveShopProgress(shopRef.current);
        if (ok) {
          audioEngine.playChime(2);
          emitSnapshot();
        }
        return ok;
      };

      const resetRunState = () => {
        state.x = pathCenterX(0);
        state.z = 0;
        state.y = groundHeightAt(state.x, 0);
        state.vx = 0;
        state.vy = 0;
        state.vz = 0;
        state.onGround = true;
        state.checkpointX = state.x;
        state.checkpointY = state.y;
        state.checkpointZ = 0;
        state.maxPetals = hasHeart() ? 4 : 3;
        state.petals = state.maxPetals;
        state.highJumpCharges = 0;
        state.flyingFlowers = 0;
        state.flyingTimer = 0;
        state.crystalBoostTimer = 0;
        state.extraAirJumpTimer = 0;
        state.wardShieldTimer = 0;
        state.invulnTimer = 0;
        state.elapsedSeconds = 0;
        state.orbsCollected = 0;
        state.blossomsCollected = 0;
        state.crystalsCollected = 0;
        state.starseedsCollected = 0;
        state.sanctuaryAwakened = false;

        for (const c of collectibles) {
          c.collected = false;
          c.mesh.visible = true;
        }
        for (const l of lanterns) {
          l.lit = false;
          l.orbMat.color.setHex(0x85998d);
          l.orbMat.emissive.setHex(0x223028);
          l.orbMat.emissiveIntensity = 0.35;
        }
        for (const a of sickAnimals) {
          a.helped = false;
          const r = a.mesh.getObjectByName('animalRing');
          if (r) r.visible = true;
        }
        for (const t of trashItems) {
          t.collected = false;
          t.mesh.visible = true;
        }
        emitSnapshot();
      };

      const loadFromSaved = (): boolean => {
        const saved = loadGameState();
        if (!saved || saved.levelId !== 5) return false;
        resetRunState();

        const cSet = new Set(saved.collectedIndices);
        collectibles.forEach((c) => {
          if (cSet.has(c.idx)) {
            c.collected = true;
            c.mesh.visible = false;
          }
        });
        const lSet = new Set(saved.litLanternIndices);
        lanterns.forEach((l, idx) => {
          if (lSet.has(idx)) {
            l.lit = true;
            l.orbMat.color.setHex(0xfff3a8);
            l.orbMat.emissive.setHex(0xffc64d);
            l.orbMat.emissiveIntensity = 1.6;
          }
        });
        const aSet = new Set(saved.helpedAnimalIds ?? []);
        sickAnimals.forEach((a) => {
          if (aSet.has(a.id)) {
            a.helped = true;
            const r = a.mesh.getObjectByName('animalRing');
            if (r) r.visible = false;
          }
        });
        const tSet = new Set(saved.collectedTrashIds ?? []);
        trashItems.forEach((t) => {
          if (tSet.has(t.id)) {
            t.collected = true;
            t.mesh.visible = false;
          }
        });

        state.z = clamp(saved.playerX, -TRAIL_LENGTH, 2);
        state.x = saved.playerY;
        state.y = groundHeightAt(state.x, state.z);
        state.checkpointZ = clamp(saved.checkpointX, -TRAIL_LENGTH, 2);
        state.checkpointX = saved.checkpointY;
        state.checkpointY = groundHeightAt(state.checkpointX, state.checkpointZ);
        state.petals = clamp(saved.petals, 1, state.maxPetals);
        state.highJumpCharges = saved.highJumpCharges;
        state.flyingFlowers = saved.flyingFlowers;
        state.elapsedSeconds = saved.elapsedSeconds;
        state.orbsCollected = saved.orbsCollected;
        state.blossomsCollected = saved.blossomsCollected;
        state.crystalsCollected = saved.crystalsCollected;
        state.starseedsCollected = saved.starseedsCollected;
        emitSnapshot();
        return true;
      };

      const respawnAtLantern = () => {
        state.x = state.checkpointX;
        state.z = state.checkpointZ;
        state.y = state.checkpointY + 0.2;
        state.vx = 0;
        state.vy = 0;
        state.vz = 0;
        state.petals = state.maxPetals;
        state.invulnTimer = 1.8;
        onPhaseRef.current('PLAYING');
        emitSnapshot();
      };

      actionsRef.current = {
        triggerJump,
        releaseJump,
        triggerPulse,
        activateFlyingFlower,
        helpNearbyAnimal,
        saveGame,
        respawnAtLantern,
        restartLevel: resetRunState,
        loadFromSaved,
        applyShopLoadout: () => {
          spiritRig.applyLoadout(shopRef.current.equipped);
          const targetMax = hasHeart() ? 4 : 3;
          state.maxPetals = targetMax;
          state.petals = Math.min(targetMax, state.petals);
          emitSnapshot();
        },
        clickAnimalById: (id: number) => {
          const found = sickAnimals.find((a) => a.id === id);
          if (found && !found.helped && Math.hypot(found.x - state.x, found.z - state.z) < 8) {
            helpAnimal(found);
          }
        },
      };

      // Raycaster tap/click on sick animals directly in 3D canvas
      const raycaster = new THREE.Raycaster();
      const pointerNdc = new THREE.Vector2();
      const handleCanvasClick = (e: PointerEvent) => {
        if (phaseRef.current !== 'PLAYING') return;
        const rect = canvas.getBoundingClientRect();
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);
        const hits = raycaster.intersectObjects(
          sickAnimals.filter((a) => !a.helped).map((a) => a.mesh),
          true
        );
        if (hits.length > 0) {
          let obj: THREE.Object3D | null = hits[0].object;
          while (obj && obj.userData.animalId === undefined) {
            obj = obj.parent;
          }
          if (obj && typeof obj.userData.animalId === 'number') {
            const target = sickAnimals[obj.userData.animalId];
            if (target && Math.hypot(target.x - state.x, target.z - state.z) < 10) {
              helpAnimal(target);
            }
          }
        }
      };
      canvas.addEventListener('pointerdown', handleCanvasClick);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }
      audioEngine.setLevel(5);
      emitSnapshot();

      let frameId = 0;
      let disposed = false;
      let lastTime = performance.now();
      let elapsed = 0;
      let hudSyncTimer = 0;
      let promptSyncTimer = 0;

      function afterDraw(cb: () => void) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const s = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (s === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      const tick = () => {
        if (disposed) return;
        const now = performance.now();
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;
        elapsed += dt;

        if (phaseRef.current === 'PLAYING') {
          state.elapsedSeconds += dt;
          state.pulseCooldown = Math.max(0, state.pulseCooldown - dt);
          state.crystalBoostTimer = Math.max(0, state.crystalBoostTimer - dt);
          state.extraAirJumpTimer = Math.max(0, state.extraAirJumpTimer - dt);
          state.flyingTimer = Math.max(0, state.flyingTimer - dt);
          state.invulnTimer = Math.max(0, state.invulnTimer - dt);
          state.wardShieldTimer = Math.max(0, state.wardShieldTimer - dt);

          const hasDragon = shopRef.current.equipped.power === 'super_dragon_wings';
          const hasPhoenix = shopRef.current.equipped.power === 'super_phoenix_wings';
          const isWinged = hasDragon || hasPhoenix;
          const isFlying = state.flyingTimer > 0;
          const speedMult =
            (state.crystalBoostTimer > 0 ? 1.32 : 1.0) *
            (hasDragon ? 1.18 : 1.0) *
            (isFlying ? 1.25 : 1.0);

          const inp = inputRef.current;
          const moveX = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
          const moveZ = (inp.backward ? 1 : 0) - (inp.forward ? 1 : 0);
          const len = Math.hypot(moveX, moveZ);
          const normX = len > 0 ? moveX / len : 0;
          const normZ = len > 0 ? moveZ / len : 0;

          const topSpeed = 7.4 * speedMult;
          const accel = state.onGround ? 38 : 24;
          state.vx = THREE.MathUtils.damp(state.vx, normX * topSpeed, accel * 0.25, dt);
          state.vz = THREE.MathUtils.damp(state.vz, normZ * topSpeed, accel * 0.25, dt);

          if (len > 0.05) {
            state.movePhase += dt * 11 * speedMult;
            const targetYaw = Math.atan2(normX, normZ);
            // Shortest angle interpolation
            let diff = targetYaw - state.facingYaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            state.facingYaw += diff * Math.min(1, dt * 11);
          }

          // Vertical physics & gliding
          if (isFlying) {
            const targetVy = inp.jumpHeld ? 4.8 : -0.6;
            state.vy = THREE.MathUtils.damp(state.vy, targetVy, 6, dt);
          } else {
            const glideActive = !state.onGround && state.vy < 0 && (inp.jumpHeld || isWinged);
            state.gliding = glideActive;
            const gravity = glideActive ? (isWinged ? 7.5 : 10.5) : 22.0;
            state.vy -= gravity * dt;
            if (glideActive && state.vy < -2.6) state.vy = -2.6;
          }

          state.x += state.vx * dt;
          state.z += state.vz * dt;
          state.y += state.vy * dt;

          // Keep Spirit inside forest clearing bounds along the curved path
          const cx = pathCenterX(state.z);
          state.x = clamp(state.x, cx - 5.2, cx + 5.2);
          state.z = clamp(state.z, -TRAIL_LENGTH - 3, 2.5);

          // Floor & Platform collision
          let floorY = groundHeightAt(state.x, state.z);
          for (const plat of platforms) {
            if (
              Math.abs(state.x - plat.x) <= plat.rx &&
              Math.abs(state.z - plat.z) <= plat.rz &&
              state.y >= plat.y - 0.55 &&
              state.vy <= 0.5
            ) {
              floorY = Math.max(floorY, plat.y);
            }
          }

          if (state.y <= floorY) {
            state.y = floorY;
            state.vy = 0;
            state.onGround = true;
            state.coyoteTime = 0.12;
            state.jumpsLeft = shopRef.current.equipped.power === 'super_sky_leap' ? 3 : 2;
          } else {
            state.onGround = false;
            state.coyoteTime = Math.max(0, state.coyoteTime - dt);
          }

          // Bouncy Glow Mushrooms
          for (const bm of bounceMushrooms) {
            const d = Math.hypot(state.x - bm.x, state.z - bm.z);
            if (d < 0.95 && state.y <= bm.y + 1.05 && state.vy <= 1.2) {
              state.vy = 13.4;
              state.onGround = false;
              state.jumpsLeft = 2;
              bm.bounceAnim = 1;
              audioEngine.playBounce();
            }
            if (bm.bounceAnim > 0) {
              bm.bounceAnim = Math.max(0, bm.bounceAnim - dt * 4);
              const squash = 1 + Math.sin(bm.bounceAnim * Math.PI) * 0.35;
              bm.mesh.scale.set(squash, 1 / squash, squash);
            }
          }

          // Golden Sky Rings
          for (const sr of skyRings) {
            sr.cooldown = Math.max(0, sr.cooldown - dt);
            sr.mesh.rotation.z += dt * 1.4;
            if (sr.cooldown <= 0 && Math.hypot(state.x - sr.x, state.z - sr.z) < 1.65 && Math.abs(state.y + 0.7 - sr.y) < 1.55) {
              sr.cooldown = 2.0;
              state.vy = Math.max(state.vy, 9.2);
              state.vz -= 5.5;
              state.crystalBoostTimer = Math.max(state.crystalBoostTimer, 3.0);
              audioEngine.playSkyRing();
              addPopup(sr.x, sr.y + 1.2, sr.z, 'Wind Ring Boost!', '#ffe485');
            }
          }

          // Collectibles & Magnet Aura
          const hasMagnet = shopRef.current.equipped.power === 'super_star_magnet';
          const pullR = hasMagnet ? 4.8 : 2.1;
          for (const c of collectibles) {
            if (c.collected) continue;
            c.mesh.position.y = c.baseY + Math.sin(elapsed * 2.8 + c.phase) * 0.16;
            c.mesh.rotation.y += dt * 2.1;
            const dx = state.x - c.x;
            const dy = state.y + 0.7 - c.mesh.position.y;
            const dz = state.z - c.z;
            const dist = Math.hypot(dx, dy, dz);
            if (dist < pullR && dist > 0.05) {
              const pullSpeed = hasMagnet ? 9.5 : 5.5;
              c.x += (dx / dist) * pullSpeed * dt;
              c.z += (dz / dist) * pullSpeed * dt;
              c.baseY += (dy / dist) * pullSpeed * dt;
              c.mesh.position.x = c.x;
              c.mesh.position.z = c.z;
            }
            if (dist < 1.05) {
              c.collected = true;
              c.mesh.visible = false;
              if (c.kind === 'orb') {
                state.orbsCollected++;
                awardDew(2);
                audioEngine.playChime(0);
              } else if (c.kind === 'blossom') {
                state.blossomsCollected++;
                awardDew(10);
                audioEngine.playBlossom();
                addPopup(c.x, c.baseY + 0.8, c.z, 'Sun Blossom +10 Dew', '#ffd67a');
              } else if (c.kind === 'crystal') {
                state.crystalsCollected++;
                state.crystalBoostTimer = 6.0;
                awardDew(12);
                audioEngine.playCrystal();
                addPopup(c.x, c.baseY + 0.8, c.z, 'Prism Surge! +12 Dew', '#94f2ff');
              } else if (c.kind === 'starseed') {
                state.starseedsCollected++;
                state.extraAirJumpTimer = 18.0;
                awardDew(18);
                audioEngine.playStarSeed();
                addPopup(c.x, c.baseY + 0.8, c.z, 'Star Seed! +18 Dew', '#e6b8ff');
              } else if (c.kind === 'flyingflower') {
                state.flyingFlowers++;
                audioEngine.playChime(3);
                addPopup(c.x, c.baseY + 0.8, c.z, 'Flying Flower (Press F)', '#ff9ef0');
              } else if (c.kind === 'highjump') {
                state.highJumpCharges++;
                audioEngine.playChime(2);
                addPopup(c.x, c.baseY + 0.8, c.z, 'Sky Leap Charge!', '#7cfce7');
              }
            }
          }

          // Trash Auto-Pickup
          for (const t of trashItems) {
            if (t.collected) continue;
            if (Math.hypot(state.x - t.x, state.z - t.z) < 1.35 && Math.abs(state.y - t.y) < 1.5) {
              t.collected = true;
              t.mesh.visible = false;
              audioEngine.playTrashPickup();
              awardDew(3);
              addPopup(t.x, t.y + 0.9, t.z, '+3 Dew · Litter Cleaned', '#8cf8e8');
            }
          }

          // Lantern Auto-Lighting
          for (const l of lanterns) {
            if (!l.lit && Math.hypot(state.x - l.x, state.z - l.z) < 2.2) {
              l.lit = true;
              l.orbMat.color.setHex(0xfff3a8);
              l.orbMat.emissive.setHex(0xffc64d);
              l.orbMat.emissiveIntensity = 1.6;
              state.checkpointX = l.x;
              state.checkpointY = l.y;
              state.checkpointZ = l.z;
              audioEngine.playLantern();
              awardDew(5);
              addPopup(l.x, l.y + 2.1, l.z, 'Lantern Awakened', '#ffe494');
            }
          }

          // Thorn Wisps Patrol & Collision
          for (const w of wisps) {
            if (w.stunTimer > 0) {
              w.stunTimer = Math.max(0, w.stunTimer - dt);
              w.mesh.scale.setScalar(0.75);
              w.mesh.rotation.y += dt * 1.2;
            } else {
              w.mesh.scale.setScalar(1);
              w.x = w.homeX + Math.sin(elapsed * w.speed + w.phase) * w.range;
              w.y = groundHeightAt(w.x, w.z) + 0.78 + Math.sin(elapsed * 3.5 + w.phase) * 0.14;
              w.mesh.position.set(w.x, w.y, w.z);
              w.mesh.rotation.y += dt * 3.2;

              if (
                state.invulnTimer <= 0 &&
                state.wardShieldTimer <= 0 &&
                Math.hypot(state.x - w.x, state.z - w.z) < 0.92 &&
                Math.abs(state.y + 0.55 - w.y) < 0.95
              ) {
                if (state.vy < -1.0 && state.y > w.y - 0.1) {
                  // Stomp bounce!
                  w.stunTimer = 4.0;
                  state.vy = 8.0;
                  audioEngine.playStomp();
                  addPopup(w.x, w.y + 1.0, w.z, 'Wisp Pacified!', '#ffe194');
                } else {
                  state.petals--;
                  state.invulnTimer = 1.6;
                  state.vz = 4.5;
                  state.vy = 4.8;
                  audioEngine.playHit();
                  if (state.petals <= 0) {
                    onPhaseRef.current('GAME_OVER');
                    emitSnapshot();
                  }
                }
              }
            }
          }

          // Grand Dessert Geode Sanctuary Victory Check!
          if (!state.sanctuaryAwakened && Math.hypot(state.x - sanctX, state.z - SANCTUARY_Z) < 4.0) {
            state.sanctuaryAwakened = true;
            awardDew(120);
            audioEngine.playLantern();
            window.setTimeout(() => audioEngine.playPulse(), 300);
            addPopup(sanctX, sanctY + 4.5, SANCTUARY_Z, 'Sanctuary Awakened! +120 Dew', '#ffe494');
            window.setTimeout(() => {
              if (phaseRef.current === 'PLAYING') {
                onPhaseRef.current('VICTORY');
                emitSnapshot();
              }
            }, 1450);
          }

          // Dynamic Seasonal Weather Progression in 3D!
          if (state.elapsedSeconds < 14) {
            currentSeasonLabel = 'Warm Sunbeams · Dessert Delight';
            weatherMat.opacity = 0;
            audioEngine.updateWeatherAudio({ leaves: 0.2, rain: 0, flurry: 0, snow: 0, underwater: 0, sunny: 1 });
          } else {
            const seasonT = (state.elapsedSeconds - 14) / 22;
            const sIdx = Math.floor(seasonT) % 4;
            if (sIdx === 0) {
              currentSeasonLabel = 'Soft Silver Rain';
              weatherMat.color.setHex(0xb8ecff);
              weatherMat.size = 0.16;
              weatherMat.opacity = 0.72;
              audioEngine.updateWeatherAudio({ leaves: 0, rain: 0.9, flurry: 0, snow: 0, underwater: 0, sunny: 0 });
            } else if (sIdx === 1) {
              currentSeasonLabel = 'Warm Sunbeams';
              weatherMat.color.setHex(0xffe89c);
              weatherMat.size = 0.15;
              weatherMat.opacity = 0.35;
              audioEngine.updateWeatherAudio({ leaves: 0.15, rain: 0, flurry: 0, snow: 0, underwater: 0, sunny: 1 });
            } else if (sIdx === 2) {
              currentSeasonLabel = 'Gentle Snowfall';
              weatherMat.color.setHex(0xffffff);
              weatherMat.size = 0.22;
              weatherMat.opacity = 0.85;
              audioEngine.updateWeatherAudio({ leaves: 0, rain: 0, flurry: 0, snow: 0.9, underwater: 0, sunny: 0 });
            } else {
              currentSeasonLabel = 'Starlight Flurry';
              weatherMat.color.setHex(0xe8c4ff);
              weatherMat.size = 0.2;
              weatherMat.opacity = 0.78;
              audioEngine.updateWeatherAudio({ leaves: 0, rain: 0, flurry: 0.85, snow: 0.15, underwater: 0, sunny: 0 });
            }
          }
        }

        // Update Spirit Rig Transform & Accessories
        spiritRoot.position.set(state.x, state.y, state.z);
        spiritRoot.rotation.y = state.facingYaw;
        spiritRoot.visible = state.invulnTimer <= 0 || Math.floor(elapsed * 16) % 2 === 0;

        animateSpiritAccessories(spiritRig, shopRef.current.equipped, dt, elapsed, {
          isFlying: state.flyingTimer > 0 || state.gliding,
          isMoving: Math.hypot(state.vx, state.vz) > 0.65 && state.onGround,
          movePhase: state.movePhase,
          wardShieldActive: state.wardShieldTimer > 0,
        });

        const baseFloorY = groundHeightAt(state.x, state.z);
        contactShadow.position.set(state.x, baseFloorY + 0.04, state.z);
        const hAbove = Math.max(0, state.y - baseFloorY);
        const shScale = Math.max(0.42, 1 - hAbove * 0.22);
        contactShadow.scale.set(shScale, shScale, 1);

        // Pulse Shockwave Ring expansion
        if (state.pulseTimer > 0) {
          state.pulseTimer = Math.max(0, state.pulseTimer - dt);
          const p = 1 - state.pulseTimer / 0.55;
          pulseRing.scale.setScalar(0.8 + p * 7.5);
          (pulseRing.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.85;
          if (state.pulseTimer <= 0) pulseRing.visible = false;
        }

        // Animate Sunbeams gently
        sunbeams.forEach((b, idx) => {
          const mat = b.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.07 + Math.sin(elapsed * 1.1 + idx) * 0.025;
        });

        // Animate Sick Animal rings
        for (const a of sickAnimals) {
          if (a.helped) continue;
          const r = a.mesh.getObjectByName('animalRing');
          if (r) {
            const s = 1 + Math.sin(elapsed * 4 + a.id) * 0.08;
            r.scale.set(s, s, 1);
          }
        }

        // Move ambient seasonal weather cloud with player
        if (weatherMat.opacity > 0.02) {
          const wp = weatherGeo.attributes.position as THREE.BufferAttribute;
          const fallSpeed = currentSeasonLabel.includes('Rain') ? 14 : 3.2;
          for (let i = 0; i < weatherCount; i++) {
            let py = wp.getY(i) - fallSpeed * dt;
            if (py < -2) py = 12;
            wp.setY(i, py);
          }
          wp.needsUpdate = true;
          weatherPoints.position.set(state.x, Math.max(0, state.y - 2), state.z - 6);
        }

        // Update floating popups & 3D->2D projected prompts
        for (let i = popups.length - 1; i >= 0; i--) {
          popups[i].life -= dt;
          popups[i].y += dt * 0.85;
          if (popups[i].life <= 0) popups.splice(i, 1);
        }

        // Follow Camera behind the Spirit looking forward into the trail!
        const targetCamX = state.x * 0.72 + pathCenterX(state.z - 4) * 0.28;
        const targetCamY = state.y + 3.45;
        const targetCamZ = state.z + 6.4;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 5.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 5.0, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 6.0, dt);

        const lookX = state.x * 0.6 + pathCenterX(state.z - 6) * 0.4;
        const lookY = state.y + 1.15;
        const lookZ = state.z - 6.2;
        camera.lookAt(lookX, lookY, lookZ);

        const targetFov = state.crystalBoostTimer > 0 || state.flyingTimer > 0 ? 60 : 54;
        if (Math.abs(camera.fov - targetFov) > 0.05) {
          camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4, dt);
          camera.updateProjectionMatrix();
        }

        // Keep shadow frustum centered near Spirit
        sunLight.position.set(state.x + 14, state.y + 24, state.z + 8);
        sunLight.target.position.set(state.x, state.y, state.z - 6);

        renderer.render(scene, camera);

        promptSyncTimer += dt;
        if (promptSyncTimer >= 0.06) {
          promptSyncTimer = 0;
          const cw = container.clientWidth || initW;
          const ch = container.clientHeight || initH;
          const nextPrompts: ProjectedPrompt[] = [];

          for (const a of sickAnimals) {
            if (a.helped) continue;
            const d = Math.hypot(a.x - state.x, a.z - state.z);
            if (d < 13 && a.z < camera.position.z - 1) {
              _projVec.set(a.x, a.y + 1.15, a.z).project(camera);
              if (_projVec.z > -1 && _projVec.z < 1) {
                nextPrompts.push({
                  id: `animal-${a.id}`,
                  x: (_projVec.x * 0.5 + 0.5) * cw,
                  y: (-_projVec.y * 0.5 + 0.5) * ch,
                  label: isTouchRef.current ? `Tap · Help ${a.name}` : `H · Help ${a.name}`,
                  kind: 'animal',
                  animalId: a.id,
                });
              }
            }
          }
          for (let i = 0; i < popups.length; i++) {
            const p = popups[i];
            _projVec.set(p.x, p.y, p.z).project(camera);
            if (_projVec.z > -1 && _projVec.z < 1) {
              nextPrompts.push({
                id: `pop-${i}-${p.text}`,
                x: (_projVec.x * 0.5 + 0.5) * cw,
                y: (-_projVec.y * 0.5 + 0.5) * ch,
                label: p.text,
                kind: 'popup',
                color: p.color,
              });
            }
          }
          setPrompts(nextPrompts);
        }

        hudSyncTimer += dt;
        if (hudSyncTimer >= 0.14) {
          hudSyncTimer = 0;
          emitSnapshot();
        }

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      };

      tick();

      const resizeObserver = new ResizeObserver(() => {
        if (disposed || !container) return;
        const w = Math.max(320, container.clientWidth);
        const h = Math.max(240, container.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        resizeObserver.disconnect();
        canvas.removeEventListener('pointerdown', handleCanvasClick);
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
        trailTex.dispose();
        barkTex.dispose();
        frostingTex.dispose();
        disposeObject3D(scene);
        if (scene.environment) scene.environment.dispose();
        renderer.dispose();
      };
    }, []);

    return (
      <div className="relative h-full w-full overflow-hidden bg-[#1a3320]">
        {webglUnavailable ? (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-[#eafbf8]">
            <p className="max-w-md rounded-xl border border-[#c4a16a]/60 bg-[#0d241b]/90 px-5 py-4 text-sm">
              3D forest rendering is currently unavailable on this browser. Please refresh or choose another forest realm.
            </p>
          </div>
        ) : (
          <div ref={containerRef} className="h-full w-full" style={{ touchAction: 'none' }} />
        )}

        {/* Projected 3D->2D Interactive Animal Help Badges & Floating Popups */}
        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
          {prompts.map((p) =>
            p.kind === 'animal' ? (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (p.animalId !== undefined) {
                    actionsRef.current?.clickAnimalById(p.animalId);
                  }
                }}
                style={{ left: `${p.x}px`, top: `${p.y}px`, transform: 'translate(-50%, -100%)' }}
                className="pointer-events-auto absolute whitespace-nowrap rounded-lg border border-[#ffb8d8]/85 bg-[#1a0b1a]/88 px-2.5 py-1 text-[11px] font-semibold text-[#ffe3f2] shadow-[0_4px_12px_rgba(0,0,0,0.55)] hover:brightness-110"
              >
                ♥ {p.label}
              </button>
            ) : (
              <div
                key={p.id}
                style={{
                  left: `${p.x}px`,
                  top: `${p.y}px`,
                  transform: 'translate(-50%, -100%)',
                  color: p.color ?? '#ffe494',
                }}
                className="absolute whitespace-nowrap text-xs font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
              >
                {p.label}
              </div>
            )
          )}
        </div>
      </div>
    );
  }
);

Level5Viewport.displayName = 'Level5Viewport';
