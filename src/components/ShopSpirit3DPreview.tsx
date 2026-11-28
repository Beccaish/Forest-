import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import stageForestImg from '../assets/images/shop_forest_glade_stage_1795684175619.jpg';
import type { PlayerLoadout } from '../game/shop';
import {
  animateSpiritAccessories,
  createSpiritCharacterRig,
  detectSoftwareGl,
  disposeObject3D,
} from '../game/spirit3d';

export interface ShopSpirit3DPreviewProps {
  loadout: PlayerLoadout;
  flyingActive: boolean;
  demoNonce: number;
  onToggleFly?: () => void;
  onTriggerDemo?: () => void;
}

function createPedestalAndForestFloor(): THREE.Group {
  const group = new THREE.Group();

  // Layered mossy stone pedestal grounded at y = 0
  const baseGeo = new THREE.CylinderGeometry(1.18, 1.34, 0.24, 36);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x5c7265,
    roughness: 0.86,
    metalness: 0.05,
  });
  const baseStone = new THREE.Mesh(baseGeo, baseMat);
  baseStone.position.y = -0.12;
  baseStone.receiveShadow = true;
  group.add(baseStone);

  const mossTopGeo = new THREE.CylinderGeometry(1.12, 1.19, 0.08, 36);
  const mossTopMat = new THREE.MeshStandardMaterial({
    color: 0x3b9d6a,
    roughness: 0.8,
    metalness: 0.04,
  });
  const mossTop = new THREE.Mesh(mossTopGeo, mossTopMat);
  mossTop.position.y = -0.01;
  mossTop.receiveShadow = true;
  group.add(mossTop);

  // Carved glowing rune ring on top surface (offset Y slightly to avoid z-fighting)
  const runeRingGeo = new THREE.RingGeometry(0.68, 0.74, 48);
  const runeRingMat = new THREE.MeshBasicMaterial({
    color: 0x8efce7,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const runeRing = new THREE.Mesh(runeRingGeo, runeRingMat);
  runeRing.rotation.x = -Math.PI / 2;
  runeRing.position.y = 0.032;
  group.add(runeRing);

  // Soft contact shadow disc right under character
  const shadowGeo = new THREE.CircleGeometry(0.42, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x0c241b,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.034;
  contactShadow.name = 'contactShadow';
  group.add(contactShadow);

  // Small 3D forest ferns / tufts & glowing mushrooms around rim
  const mushroomStemMat = new THREE.MeshStandardMaterial({ color: 0xf7f5eb, roughness: 0.7 });
  const aquaCapMat = new THREE.MeshStandardMaterial({
    color: 0x62f5d8,
    emissive: 0x2bd6b8,
    emissiveIntensity: 0.45,
    roughness: 0.35,
  });
  const amberCapMat = new THREE.MeshStandardMaterial({
    color: 0xffc857,
    emissive: 0xe08d18,
    emissiveIntensity: 0.35,
    roughness: 0.4,
  });

  const mushroomSpots = [
    { angle: 0.55, r: 0.96, s: 1.0, aqua: true },
    { angle: 0.72, r: 0.88, s: 0.65, aqua: true },
    { angle: 2.45, r: 0.94, s: 0.9, aqua: false },
    { angle: 4.15, r: 0.96, s: 0.85, aqua: true },
    { angle: 5.2, r: 0.92, s: 0.75, aqua: false },
  ];

  for (const m of mushroomSpots) {
    const mx = Math.cos(m.angle) * m.r;
    const mz = Math.sin(m.angle) * m.r;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022 * m.s, 0.03 * m.s, 0.1 * m.s, 10),
      mushroomStemMat
    );
    stem.position.set(mx, 0.03 + 0.05 * m.s, mz);
    group.add(stem);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.068 * m.s, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
      m.aqua ? aquaCapMat : amberCapMat
    );
    cap.position.set(mx, 0.03 + 0.095 * m.s, mz);
    group.add(cap);
  }

  // Stylized emerald fern blades around pedestal edge
  const fernMat = new THREE.MeshStandardMaterial({
    color: 0x35b36d,
    roughness: 0.65,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 8; i++) {
    const ang = i * ((Math.PI * 2) / 8) + 0.25;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 4), fernMat);
    blade.position.set(Math.cos(ang) * 1.04, 0.09, Math.sin(ang) * 1.04);
    blade.rotation.z = Math.cos(ang) * 0.55;
    blade.rotation.x = -Math.sin(ang) * 0.55;
    group.add(blade);
  }

  // Tiny colorful meadow blossom dots on moss rim
  const flowerColors = [0xffe066, 0xff8ed4, 0x7dfce7, 0xffffff];
  for (let f = 0; f < 10; f++) {
    const ang = f * 0.64 + 0.15;
    const rad = 0.78 + (f % 3) * 0.11;
    const blossom = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 8, 8),
      new THREE.MeshBasicMaterial({ color: flowerColors[f % flowerColors.length] })
    );
    blossom.position.set(Math.cos(ang) * rad, 0.045, Math.sin(ang) * rad);
    group.add(blossom);
  }

  return group;
}

export const ShopSpirit3DPreview: React.FC<ShopSpirit3DPreviewProps> = ({
  loadout,
  flyingActive,
  demoNonce,
  onToggleFly,
  onTriggerDemo,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const loadoutRef = useRef<PlayerLoadout>(loadout);
  const flyingRef = useRef<boolean>(flyingActive);
  const autoSpinRef = useRef<boolean>(true);
  const [autoSpin, setAutoSpin] = useState(true);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rebuildAccessoriesRef = useRef<((l: PlayerLoadout) => void) | null>(null);
  const triggerFxRef = useRef<((l: PlayerLoadout) => void) | null>(null);

  useEffect(() => {
    loadoutRef.current = loadout;
    rebuildAccessoriesRef.current?.(loadout);
  }, [loadout]);

  useEffect(() => {
    flyingRef.current = flyingActive;
  }, [flyingActive]);

  useEffect(() => {
    if (demoNonce > 0) {
      triggerFxRef.current?.(loadoutRef.current);
    }
  }, [demoNonce]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const initW = Math.max(240, container.clientWidth);
    const initH = Math.max(220, container.clientHeight);
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
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(38, initW / initH, 0.1, 40);
    camera.position.set(0, 1.45, 3.65);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.82, 0);
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.4;
    controls.maxDistance = 5.2;
    controls.minPolarAngle = 0.42;
    controls.maxPolarAngle = Math.PI * 0.55;
    controls.rotateSpeed = 0.9;
    controls.update();
    controlsRef.current = controls;

    // Warm Sunlit Forest Lighting Rig
    const hemi = new THREE.HemisphereLight(0xf6fff9, 0x3b6e52, 1.35);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4d6, 1.75);
    keyLight.position.set(3.2, 5.2, 4.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7cfce7, 0.95);
    rimLight.position.set(-3.4, 2.8, -3.6);
    scene.add(rimLight);

    // Forest Moss Pedestal
    const pedestal = createPedestalAndForestFloor();
    scene.add(pedestal);
    const contactShadow = pedestal.getObjectByName('contactShadow') as THREE.Mesh | undefined;

    // Composite 3D Spirit Character Rig
    const spiritRig = createSpiritCharacterRig(loadoutRef.current);
    const spiritRoot = spiritRig.root;
    const headGroup = spiritRig.headGroup;
    scene.add(spiritRoot);

    // Transient 3D VFX Group (wind rings, nova shockwave, magnet gems, fairy sparkles)
    const fxGroup = new THREE.Group();
    scene.add(fxGroup);

    interface ActiveFx {
      mesh: THREE.Object3D;
      kind: 'ring' | 'nova' | 'pullGem' | 'sparkle';
      age: number;
      life: number;
      startAngle?: number;
      startRadius?: number;
      vy?: number;
    }
    const activeFx: ActiveFx[] = [];

    const spawnRingFx = (yPos: number, colorHex: number) => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.022, 10, 32),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 })
      );
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(0, yPos, 0);
      fxGroup.add(mesh);
      activeFx.push({ mesh, kind: 'ring', age: 0, life: 0.75 });
    };

    const spawnNovaFx = () => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 24, 18),
        new THREE.MeshBasicMaterial({
          color: 0xffd86b,
          transparent: true,
          opacity: 0.55,
          wireframe: true,
        })
      );
      mesh.position.set(0, 0.72, 0);
      fxGroup.add(mesh);
      activeFx.push({ mesh, kind: 'nova', age: 0, life: 0.9 });
      spawnRingFx(0.7, 0xffd86b);
    };

    const spawnMagnetGemsFx = () => {
      const cols = [0x7cfce7, 0xffe194, 0xff9ee8, 0x9ef4ff];
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI * 2) / 8;
        const gem = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.055, 0),
          new THREE.MeshStandardMaterial({
            color: cols[i % cols.length],
            emissive: cols[i % cols.length],
            emissiveIntensity: 0.65,
            roughness: 0.2,
          })
        );
        const startRadius = 1.25 + (i % 2) * 0.25;
        gem.position.set(Math.cos(ang) * startRadius, 0.45 + (i % 3) * 0.25, Math.sin(ang) * startRadius);
        fxGroup.add(gem);
        activeFx.push({ mesh: gem, kind: 'pullGem', age: 0, life: 1.15, startAngle: ang, startRadius });
      }
    };

    const spawnFairySparklesFx = () => {
      for (let i = 0; i < 12; i++) {
        const ang = (i * Math.PI * 2) / 12;
        const mote = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.036, 0),
          new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0xff9ef0 : 0xffe685,
            transparent: true,
            opacity: 0.95,
          })
        );
        mote.position.set(Math.cos(ang) * 0.35, 0.4 + (i % 3) * 0.2, Math.sin(ang) * 0.35);
        fxGroup.add(mote);
        activeFx.push({ mesh: mote, kind: 'sparkle', age: 0, life: 1.0, startAngle: ang, vy: 0.7 + (i % 3) * 0.2 });
      }
    };

    // Ambient Forest Fireflies floating softly around the clearing
    const fireflyGroup = new THREE.Group();
    scene.add(fireflyGroup);
    const fireflies: { mesh: THREE.Mesh; phase: number; r: number; y: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const fMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 8),
        new THREE.MeshBasicMaterial({
          color: i % 3 === 0 ? 0x7cfce7 : 0xffe885,
          transparent: true,
          opacity: 0.8,
        })
      );
      fireflyGroup.add(fMesh);
      fireflies.push({
        mesh: fMesh,
        phase: i * 0.85,
        r: 1.0 + (i % 4) * 0.28,
        y: 0.35 + (i % 5) * 0.32,
      });
    }

    // Power Demo Animation State
    let demoKind: 'none' | 'triple_leap' | 'nova' | 'magnet' | 'fairy' | 'dragon_dash' | 'jump' = 'none';
    let demoTimer = 0;
    let demoStep = 0;

    const rebuildAccessories = (l: PlayerLoadout) => {
      spiritRig.applyLoadout(l);
    };

    const triggerPowerDemo = (l: PlayerLoadout) => {
      demoTimer = 0;
      demoStep = 0;
      if (l.power === 'super_sky_leap') {
        demoKind = 'triple_leap';
        spawnRingFx(0.12, 0x7cfce7);
      } else if (l.power === 'super_nova_pulse') {
        demoKind = 'nova';
        spawnNovaFx();
      } else if (l.power === 'super_star_magnet') {
        demoKind = 'magnet';
        spawnMagnetGemsFx();
      } else if (l.power === 'super_fairy_sparkle') {
        demoKind = 'fairy';
        spawnFairySparklesFx();
      } else if (l.power === 'super_dragon_wings') {
        demoKind = 'dragon_dash';
        spawnRingFx(0.65, 0x3be8b0);
      } else if (l.power === 'super_phoenix_wings') {
        demoKind = 'fairy';
        spawnRingFx(0.5, 0xff935c);
      } else {
        demoKind = 'jump';
        spawnRingFx(0.1, 0x7cfce7);
      }
    };

    rebuildAccessoriesRef.current = rebuildAccessories;
    triggerFxRef.current = triggerPowerDemo;
    rebuildAccessories(loadoutRef.current);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;

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
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const animate = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      // Smooth turntable auto-spin
      if (autoSpinRef.current) {
        spiritRoot.rotation.y += dt * 0.55;
      }

      // Compute Spirit height/tilt/spin for Flight & Superpower Demos
      const isFlying = flyingRef.current;
      let yOffset = 0.02 + Math.sin(elapsed * 2.2) * 0.015;
      let pitchX = 0;
      let spinBonus = 0;

      if (isFlying) {
        yOffset = 0.52 + Math.sin(elapsed * 3.1) * 0.08;
        pitchX = 0.14;
      }

      if (demoKind !== 'none') {
        demoTimer += dt;
        if (demoKind === 'triple_leap') {
          if (demoTimer < 0.5) {
            const p = demoTimer / 0.5;
            yOffset = Math.max(yOffset, Math.sin(p * Math.PI) * 0.42);
          } else if (demoTimer < 1.05) {
            if (demoStep < 1) {
              demoStep = 1;
              spawnRingFx(0.38, 0x9ef4ff);
            }
            const p = (demoTimer - 0.5) / 0.55;
            yOffset = Math.max(yOffset, 0.28 + Math.sin(p * Math.PI) * 0.52);
          } else if (demoTimer < 1.75) {
            if (demoStep < 2) {
              demoStep = 2;
              spawnRingFx(0.68, 0xffe485);
            }
            const p = (demoTimer - 1.05) / 0.7;
            yOffset = Math.max(yOffset, 0.48 + Math.sin(p * Math.PI) * 0.65);
            spinBonus = p * Math.PI * 2;
          } else {
            demoKind = 'none';
          }
        } else if (demoKind === 'dragon_dash') {
          if (demoTimer < 1.1) {
            const p = demoTimer / 1.1;
            yOffset = Math.max(yOffset, 0.56 + Math.sin(p * Math.PI) * 0.18);
            pitchX = 0.24;
            spinBonus = p * Math.PI * 2;
          } else {
            demoKind = 'none';
          }
        } else if (demoKind === 'fairy') {
          if (demoTimer < 1.4) {
            const p = demoTimer / 1.4;
            yOffset = Math.max(yOffset, 0.45 + Math.sin(p * Math.PI) * 0.24);
            spinBonus = p * Math.PI * 2;
          } else {
            demoKind = 'none';
          }
        } else if (demoKind === 'nova') {
          if (demoTimer < 0.95) {
            const p = demoTimer / 0.95;
            yOffset = Math.max(yOffset, Math.sin(p * Math.PI) * 0.25);
          } else {
            demoKind = 'none';
          }
        } else if (demoKind === 'magnet') {
          if (demoTimer < 1.2) {
            yOffset = Math.max(yOffset, 0.18 + Math.sin(demoTimer * 4) * 0.06);
          } else {
            demoKind = 'none';
          }
        } else if (demoKind === 'jump') {
          if (demoTimer < 0.75) {
            const p = demoTimer / 0.75;
            yOffset = Math.max(yOffset, Math.sin(p * Math.PI) * 0.48);
          } else {
            demoKind = 'none';
          }
        }
      }

      spiritRoot.position.y = yOffset;
      spiritRoot.rotation.x = THREE.MathUtils.lerp(spiritRoot.rotation.x, pitchX, 0.12);
      if (spinBonus > 0) {
        headGroup.rotation.y = spinBonus;
      } else {
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0, 0.15);
      }

      if (contactShadow) {
        const s = Math.max(0.42, 1 - yOffset * 0.55);
        contactShadow.scale.set(s, s, 1);
        (contactShadow.material as THREE.MeshBasicMaterial).opacity = 0.34 * s;
      }

      animateSpiritAccessories(spiritRig, loadoutRef.current, dt, elapsed, {
        isFlying,
        hasDemo: demoKind !== 'none',
      });

      // Update Transient FX
      for (let i = activeFx.length - 1; i >= 0; i--) {
        const fx = activeFx[i];
        fx.age += dt;
        const p = fx.age / fx.life;
        if (p >= 1) {
          fxGroup.remove(fx.mesh);
          disposeObject3D(fx.mesh);
          activeFx.splice(i, 1);
          continue;
        }
        const m = fx.mesh as THREE.Mesh;
        if (fx.kind === 'ring') {
          const s = 1 + p * 3.0;
          m.scale.set(s, s, 1);
          (m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.85;
        } else if (fx.kind === 'nova') {
          const s = 1 + p * 4.5;
          m.scale.setScalar(s);
          m.rotation.y += dt * 3;
          (m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.6;
        } else if (fx.kind === 'pullGem') {
          const r = (fx.startRadius ?? 1.2) * (1 - p);
          const ang = (fx.startAngle ?? 0) + p * 4.2;
          m.position.x = Math.cos(ang) * r;
          m.position.z = Math.sin(ang) * r;
          m.position.y = THREE.MathUtils.lerp(m.position.y, 0.72, dt * 4);
          m.rotation.y += dt * 5;
          m.scale.setScalar(1 - p * 0.65);
        } else if (fx.kind === 'sparkle') {
          m.position.y += (fx.vy ?? 0.8) * dt;
          m.rotation.y += dt * 4;
          (m.material as THREE.MeshBasicMaterial).opacity = 1 - p;
        }
      }

      // Ambient Fireflies
      for (const ff of fireflies) {
        const ang = elapsed * 0.35 + ff.phase;
        ff.mesh.position.set(
          Math.cos(ang) * ff.r,
          ff.y + Math.sin(elapsed * 1.8 + ff.phase) * 0.08,
          Math.sin(ang) * ff.r
        );
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    };

    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (disposed || !container) return;
      const w = Math.max(240, container.clientWidth);
      const h = Math.max(220, container.clientHeight);
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
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      disposeObject3D(scene);
      if (scene.environment) scene.environment.dispose();
      renderer.dispose();
      controlsRef.current = null;
      cameraRef.current = null;
      rebuildAccessoriesRef.current = null;
      triggerFxRef.current = null;
    };
  }, []);

  const handleTurnStep = (deltaRad: number) => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!controls || !camera) return;
    autoSpinRef.current = false;
    setAutoSpin(false);
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(THREE.Object3D.DEFAULT_UP, deltaRad);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  };

  const handleResetView = () => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!controls || !camera) return;
    camera.position.set(0, 1.45, 3.65);
    controls.target.set(0, 0.82, 0);
    controls.update();
  };

  const handleToggleAutoSpin = () => {
    const next = !autoSpinRef.current;
    autoSpinRef.current = next;
    setAutoSpin(next);
  };

  const powerActionLabel = (() => {
    switch (loadout.power) {
      case 'super_phoenix_wings':
        return flyingActive ? 'Land Spirit' : 'Test Fly & Glide';
      case 'super_dragon_wings':
        return flyingActive ? 'Land Dragon' : 'Fly & Dragon Dash';
      case 'super_sky_leap':
        return 'Test Triple Leap';
      case 'super_nova_pulse':
        return 'Test Nova Pulse';
      case 'super_star_magnet':
        return 'Test Magnet Pull';
      case 'super_fairy_sparkle':
        return 'Test Sparkle Boost';
      default:
        return 'Test Jump';
    }
  })();

  const isWingPower =
    loadout.power === 'super_phoenix_wings' || loadout.power === 'super_dragon_wings';

  return (
    <div className="flex flex-col gap-2.5">
      {/* Ornate Sculpted Bronze & Luminous Turquoise Gem Frame around 3D Clearing */}
      <div className="relative p-[10px] sm:p-[12px] select-none">
        {/* Continuous Sculpted Bronze Border & Organic Scrollwork Frame */}
        <svg
          aria-hidden="true"
          viewBox="0 0 420 320"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full z-20 drop-shadow-[0_10px_22px_rgba(0,0,0,0.65)]"
        >
          <defs>
            <linearGradient id="bronzeFrameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b6956" />
              <stop offset="28%" stopColor="#5c4033" />
              <stop offset="72%" stopColor="#462f25" />
              <stop offset="100%" stopColor="#6c4d3e" />
            </linearGradient>
            <linearGradient id="bronzeTrimHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d3b28c" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#947157" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#d9ba93" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Sculpted Outer Bronze Frame Perimeter (hollow center via evenodd) */}
          <path
            fillRule="evenodd"
            d="M 18 8
               C 55 4, 130 6, 178 7
               C 192 7, 200 2, 210 2
               C 220 2, 228 7, 242 7
               C 290 6, 365 4, 402 8
               C 410 9, 413 13, 414 22
               C 417 78, 415 130, 413 160
               C 415 190, 417 242, 414 298
               C 413 307, 410 311, 402 312
               C 365 316, 290 314, 242 313
               C 228 313, 220 318, 210 318
               C 200 318, 192 313, 178 313
               C 130 314, 55 316, 18 312
               C 10 311, 7 307, 6 298
               C 3 242, 5 190, 7 160
               C 5 130, 3 78, 6 22
               C 7 13, 10 9, 18 8 Z
               M 16 16
               L 404 16
               L 404 304
               L 16 304 Z"
            fill="url(#bronzeFrameGrad)"
            stroke="url(#bronzeTrimHighlight)"
            strokeWidth="1.6"
          />

          {/* Inner Recessed Bronze Rim */}
          <rect
            x="15.5"
            y="15.5"
            width="389"
            height="289"
            rx="6"
            fill="none"
            stroke="#241610"
            strokeWidth="2"
          />
          <rect
            x="13.5"
            y="13.5"
            width="393"
            height="293"
            rx="7"
            fill="none"
            stroke="#b59272"
            strokeOpacity="0.45"
            strokeWidth="1"
          />

          {/* Decorative Organic Scroll Ribs Along Top, Bottom, Left, Right */}
          <path d="M 38 10 C 75 6, 115 11, 155 9" fill="none" stroke="#c8a582" strokeOpacity="0.45" strokeWidth="1.2" />
          <path d="M 265 9 C 305 11, 345 6, 382 10" fill="none" stroke="#c8a582" strokeOpacity="0.45" strokeWidth="1.2" />
          <path d="M 38 310 C 75 314, 115 309, 155 311" fill="none" stroke="#c8a582" strokeOpacity="0.45" strokeWidth="1.2" />
          <path d="M 265 311 C 305 309, 345 314, 382 310" fill="none" stroke="#c8a582" strokeOpacity="0.45" strokeWidth="1.2" />
          <path d="M 10 55 C 6 105, 11 135, 9 160 C 11 185, 6 215, 10 265" fill="none" stroke="#c8a582" strokeOpacity="0.4" strokeWidth="1.2" />
          <path d="M 410 55 C 414 105, 409 135, 411 160 C 409 185, 414 215, 410 265" fill="none" stroke="#c8a582" strokeOpacity="0.4" strokeWidth="1.2" />
        </svg>

        {/* Stage Viewport */}
        <div className="relative h-[235px] sm:h-[260px] xl:h-[280px] w-full overflow-hidden rounded-[7px] bg-[#162921] shadow-[inset_0_0_16px_rgba(0,0,0,0.5)]">
          <img
            src={stageForestImg}
            alt="Sunlit enchanted forest clearing behind the character"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d271e]/15 via-transparent to-[#ffffff]/8"
          />

          {webglUnavailable ? (
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4 text-center">
              <div className="rounded-lg bg-[#0c231f]/90 border border-[#72b5a4]/50 px-4 py-3 text-sm font-medium text-[#e9f5f1] shadow">
                3D preview paused — try rotating or reopening the shop.
              </div>
            </div>
          ) : (
            <div ref={mountRef} className="relative z-10 h-full w-full cursor-grab active:cursor-grabbing" />
          )}

          {/* Top-left clean light guide tag */}
          <div className="pointer-events-none absolute top-3 left-3 z-20 rounded-md bg-white/94 px-2.5 py-1 text-xs font-medium text-[#1b2c27] shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
            Drag to turn 360°
          </div>

          {/* Top-right Front Reset button */}
          <button
            type="button"
            onClick={handleResetView}
            className="absolute top-3 right-3 z-20 min-h-[30px] rounded-md bg-white/95 hover:bg-white px-3 py-1 text-xs font-medium text-[#1b2c27] shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-colors focus-visible:outline-2 focus-visible:outline-[#5eead4]"
          >
            Front
          </button>
        </div>

        {/* Crisp Non-Stretched Turquoise Teardrop Gem Medallions */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
          {/* Top-Center Turquoise Teardrop Crest */}
          <svg
            width="84"
            height="34"
            viewBox="0 0 84 34"
            fill="none"
            className="absolute -top-2 left-1/2 -translate-x-1/2 drop-shadow-[0_3px_8px_rgba(45,212,191,0.45)]"
          >
            <path
              d="M4 17C16 17 25 7 34 6C38 2 46 2 50 6C59 7 68 17 80 17C67 20 56 26 42 30C28 26 17 20 4 17Z"
              fill="#553b30"
              stroke="#cca984"
              strokeWidth="1.4"
            />
            <path d="M14 16C22 14 27 10 32 10" stroke="#e4c5a3" strokeWidth="1.1" strokeOpacity="0.7" />
            <path d="M70 16C62 14 57 10 52 10" stroke="#e4c5a3" strokeWidth="1.1" strokeOpacity="0.7" />
            <path
              d="M42 6.5C46.5 12.8 49 17 49 20.5C49 24.4 45.9 27.5 42 27.5C38.1 27.5 35 24.4 35 20.5C35 17 37.5 12.8 42 6.5Z"
              fill="url(#gemCyanTop)"
              stroke="#134e4a"
              strokeWidth="1.2"
            />
            <ellipse cx="39.8" cy="17.8" rx="2.1" ry="3.8" fill="#ffffff" fillOpacity="0.75" />
            <defs>
              <linearGradient id="gemCyanTop" x1="35" y1="7" x2="49" y2="27" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="45%" stopColor="#4fe3cc" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
            </defs>
          </svg>

          {/* Bottom-Center Turquoise Teardrop Crest */}
          <svg
            width="84"
            height="34"
            viewBox="0 0 84 34"
            fill="none"
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 drop-shadow-[0_3px_8px_rgba(45,212,191,0.45)]"
          >
            <path
              d="M4 17C16 17 25 27 34 28C38 32 46 32 50 28C59 27 68 17 80 17C67 14 56 8 42 4C28 8 17 14 4 17Z"
              fill="#553b30"
              stroke="#cca984"
              strokeWidth="1.4"
            />
            <path
              d="M42 6.5C46 11.5 48.2 15.2 48.2 18.6C48.2 22.3 45.4 25.2 42 25.2C38.6 25.2 35.8 22.3 35.8 18.6C35.8 15.2 38 11.5 42 6.5Z"
              fill="url(#gemCyanBot)"
              stroke="#134e4a"
              strokeWidth="1.2"
            />
            <ellipse cx="40" cy="16.5" rx="1.9" ry="3.4" fill="#ffffff" fillOpacity="0.75" />
            <defs>
              <linearGradient id="gemCyanBot" x1="36" y1="7" x2="48" y2="25" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="45%" stopColor="#4fe3cc" />
                <stop offset="100%" stopColor="#0f766e" />
              </linearGradient>
            </defs>
          </svg>

          {/* Top-Left Corner Bronze Scroll & Turquoise Gem */}
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" className="absolute -top-1 -left-1">
            <path d="M5 34C4 16 14 5 34 5" stroke="#553b30" strokeWidth="6" strokeLinecap="round" />
            <path d="M5 34C4 16 14 5 34 5" stroke="#cca984" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="13" cy="13" r="7" fill="#4f372c" stroke="#cca984" strokeWidth="1.4" />
            <circle cx="13" cy="13" r="4.4" fill="#5eead4" stroke="#134e4a" strokeWidth="1" />
            <circle cx="11.6" cy="11.5" r="1.4" fill="#ffffff" fillOpacity="0.8" />
          </svg>

          {/* Top-Right Corner Bronze Scroll & Turquoise Gem */}
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none" className="absolute -top-1 -right-1">
            <path d="M37 34C38 16 28 5 8 5" stroke="#553b30" strokeWidth="6" strokeLinecap="round" />
            <path d="M37 34C38 16 28 5 8 5" stroke="#cca984" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="29" cy="13" r="7" fill="#4f372c" stroke="#cca984" strokeWidth="1.4" />
            <circle cx="29" cy="13" r="4.4" fill="#5eead4" stroke="#134e4a" strokeWidth="1" />
            <circle cx="27.6" cy="11.5" r="1.4" fill="#ffffff" fillOpacity="0.8" />
          </svg>

          {/* Bottom-Left Diagonal Turquoise Teardrop Gem Crest */}
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            className="absolute -bottom-1.5 -left-1.5 drop-shadow-[0_2px_6px_rgba(45,212,191,0.45)]"
          >
            <path d="M6 10C6 26 16 38 34 38" stroke="#553b30" strokeWidth="6" strokeLinecap="round" />
            <path d="M6 10C6 26 16 38 34 38" stroke="#cca984" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M8 36C7 26 14 19 23 19C25 27 18 35 8 36Z"
              fill="#4f372c"
              stroke="#cca984"
              strokeWidth="1.4"
            />
            <path
              d="M11 33C11 26.5 15.5 22 21 21.5C21 27.5 16.8 32.5 11 33Z"
              fill="#5eead4"
              stroke="#134e4a"
              strokeWidth="1"
            />
            <circle cx="16.5" cy="25.5" r="1.5" fill="#ffffff" fillOpacity="0.75" />
          </svg>

          {/* Bottom-Right Diagonal Turquoise Teardrop Gem Crest */}
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            className="absolute -bottom-1.5 -right-1.5 drop-shadow-[0_2px_6px_rgba(45,212,191,0.45)]"
          >
            <path d="M38 10C38 26 28 38 10 38" stroke="#553b30" strokeWidth="6" strokeLinecap="round" />
            <path d="M38 10C38 26 28 38 10 38" stroke="#cca984" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M36 36C37 26 30 19 21 19C19 27 26 35 36 36Z"
              fill="#4f372c"
              stroke="#cca984"
              strokeWidth="1.4"
            />
            <path
              d="M33 33C33 26.5 28.5 22 23 21.5C23 27.5 27.2 32.5 33 33Z"
              fill="#5eead4"
              stroke="#134e4a"
              strokeWidth="1"
            />
            <circle cx="27.5" cy="25.5" r="1.5" fill="#ffffff" fillOpacity="0.75" />
          </svg>
        </div>
      </div>

      {/* Row 1: Compact Left-Aligned Beveled Stone Turn / Spin Buttons (matches mockup placement) */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => handleTurnStep(-Math.PI / 4)}
          aria-label="Turn character left"
          className="min-h-[38px] min-w-[82px] flex items-center justify-center gap-1.5 rounded-md border border-[#b0bab2]/80 bg-gradient-to-b from-[#606761] to-[#393f3b] px-3 py-1.5 text-xs sm:text-sm font-medium text-[#f5f2e8] shadow-[0_3px_8px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(22,26,24,0.68),inset_0_0_0_3px_rgba(255,255,255,0.16)] hover:brightness-110 active:translate-y-px transition-all focus-visible:outline-2 focus-visible:outline-[#5eead4]"
        >
          <span>↺ Turn</span>
        </button>

        <button
          type="button"
          onClick={handleToggleAutoSpin}
          className={`min-h-[38px] min-w-[92px] flex items-center justify-center rounded-md border px-3.5 py-1.5 text-xs sm:text-sm font-medium shadow-[0_3px_8px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(22,26,24,0.68),inset_0_0_0_3px_rgba(255,255,255,0.16)] hover:brightness-110 active:translate-y-px transition-all focus-visible:outline-2 focus-visible:outline-[#5eead4] ${
            autoSpin
              ? 'border-[#cad5cc] bg-gradient-to-b from-[#656f67] to-[#414944] text-[#ffffff]'
              : 'border-[#b0bab2]/80 bg-gradient-to-b from-[#606761] to-[#393f3b] text-[#f5f2e8]'
          }`}
        >
          <span>{autoSpin ? 'Spinning' : 'Spin'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTurnStep(Math.PI / 4)}
          aria-label="Turn character right"
          className="min-h-[38px] min-w-[82px] flex items-center justify-center gap-1.5 rounded-md border border-[#b0bab2]/80 bg-gradient-to-b from-[#606761] to-[#393f3b] px-3 py-1.5 text-xs sm:text-sm font-medium text-[#f5f2e8] shadow-[0_3px_8px_rgba(0,0,0,0.45),inset_0_0_0_2px_rgba(22,26,24,0.68),inset_0_0_0_3px_rgba(255,255,255,0.16)] hover:brightness-110 active:translate-y-px transition-all focus-visible:outline-2 focus-visible:outline-[#5eead4]"
        >
          <span>Turn ↻</span>
        </button>
      </div>

      {/* Row 2: Full-Width Beveled Action Bar ("Test Jump" / Power Demo) with Subtle Filigree End Caps */}
      <button
        type="button"
        onClick={() => {
          if (isWingPower) {
            onToggleFly?.();
          }
          onTriggerDemo?.();
        }}
        className="relative w-full min-h-[40px] flex items-center justify-center rounded-md border border-[#b5beb5]/80 bg-gradient-to-b from-[#555d57] to-[#333935] px-8 py-1.5 text-sm font-medium text-[#f7f4eb] shadow-[0_3px_10px_rgba(0,0,0,0.48),inset_0_0_0_2px_rgba(20,24,22,0.7),inset_0_0_0_3px_rgba(255,255,255,0.16)] hover:brightness-110 active:translate-y-px transition-all focus-visible:outline-2 focus-visible:outline-[#5eead4]"
      >
        <span aria-hidden="true" className="pointer-events-none absolute left-2.5 text-[#c7cfbf]/60 text-xs">
          ✦
        </span>
        <span>{powerActionLabel}</span>
        <span aria-hidden="true" className="pointer-events-none absolute right-2.5 text-[#c7cfbf]/60 text-xs">
          ✦
        </span>
      </button>
    </div>
  );
};
