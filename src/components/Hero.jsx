import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { ArrowDown, Check } from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Engine loading state
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [loadingPercent, setLoadingPercent] = useState(15);

  // Animation Progress: 0.0 to 1.0 (Scrubbed smoothly by scroll gestures)
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const isDismissedRef = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isTransitioningRef = useRef(false);
  const [isMounted, setIsMounted] = useState(true);

  // Momentum scrubbing refs (Physics inertia & silky momentum glide)
  const currentProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const velocityRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchLastYRef = useRef(0);
  const touchLastTimeRef = useRef(0);
  const touchVelocityRef = useRef(0);
  const animationFrameRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  // Mouse coords for camera parallax
  const mouseRef = useRef({ x: 0, y: 0 });

  // 1. SCROLL-PINNING & GESTURE INTERCEPTION WITH PHYSICS MOMENTUM
  useEffect(() => {
    if (isDismissed) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    // Momentum-driven wheel handler
    const handleWheel = (e) => {
      e.preventDefault();
      const wheelImpulse = e.deltaY * 0.00034;
      velocityRef.current += wheelImpulse;
      // Cap maximum impulse to keep motion controllable
      velocityRef.current = Math.max(-0.06, Math.min(0.06, velocityRef.current));
    };

    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
      touchLastYRef.current = e.touches[0].clientY;
      touchLastTimeRef.current = performance.now();
      touchVelocityRef.current = 0;
      velocityRef.current = 0; // stop prior inertia when a new touch gesture begins
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const currentTime = performance.now();
      const diffY = touchLastYRef.current - currentY;
      const dt = Math.max(1, currentTime - touchLastTimeRef.current);

      touchLastYRef.current = currentY;
      touchLastTimeRef.current = currentTime;

      if (e.cancelable) e.preventDefault();
      // Responsive touch delta tuned for mobile screens
      const delta = diffY * 0.0010;
      targetProgressRef.current = Math.max(0, Math.min(1.15, targetProgressRef.current + delta));

      // Calculate flick velocity (progress delta per frame)
      touchVelocityRef.current = (diffY / dt) * 0.014;
    };

    const handleTouchEnd = () => {
      // Transfer finger flick velocity into momentum inertia
      velocityRef.current = Math.max(-0.05, Math.min(0.05, touchVelocityRef.current));
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        velocityRef.current += 0.015;
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        velocityRef.current -= 0.015;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleProceedToStore();
      }
    };

    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.overflow = '';
    };
  }, [isDismissed]);

  // Safety hook: guarantee body overflow is unlocked when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleProceedToStore = () => {
    if (isDismissedRef.current || isTransitioningRef.current) return;
    isDismissedRef.current = true;
    setIsTransitioning(true);
    isTransitioningRef.current = true;
    targetProgressRef.current = 1.18;
    currentProgressRef.current = 1.12;
    setProgress(1.0);
    setIsDismissed(true);
    document.body.style.overflow = '';

    setTimeout(() => {
      setIsMounted(false);
    }, 700);
  };

  // 2. THREE.JS 3D ENGINE (Sterile Lumon White Colorway & Macrodata Refinement Focus)
  useEffect(() => {
    if (!canvasRef.current) return;

    let loadTimer = setInterval(() => {
      setLoadingPercent(prev => {
        if (prev >= 95) {
          clearInterval(loadTimer);
          return 100;
        }
        return prev + 25;
      });
    }, 60);

    const canvas = canvasRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Responsive FOV calculation (avoids lateral clipping on portrait mobile devices)
    const getTargetFov = (w, h) => {
      const aspect = w / h;
      if (aspect < 0.75) {
        return Math.min(58, 38 / aspect * 0.76);
      } else if (aspect < 1.0) {
        return 46;
      }
      return 38;
    };

    // --- Scene & Camera (Sterile Lumon Off-White Environment) ---
    const scene = new THREE.Scene();
    const lumonWhiteColor = new THREE.Color(0xf0f5f4); // Pristine Lumon White
    scene.background = lumonWhiteColor;
    scene.fog = new THREE.FogExp2(0xf0f5f4, 0.045);

    const initialFov = getTargetFov(width, height);
    const camera = new THREE.PerspectiveCamera(initialFov, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // --- High-Resolution Dynamic CRT Offscreen Canvas ---
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 640;
    screenCanvas.height = 400;
    const screenCtx = screenCanvas.getContext('2d');
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;

    // --- Sterile Lumon Lighting (Bright, shadowless corporate perfection) ---
    const ambientLight = new THREE.AmbientLight(0xdcf0ec, 1.9); // Diffuse sterile white/mint
    scene.add(ambientLight);

    // Overhead Clinical White Fluorescent Key Light
    const ceilingLight = new THREE.DirectionalLight(0xffffff, 2.4);
    ceilingLight.position.set(0, 8, 2.5);
    ceilingLight.castShadow = true;
    ceilingLight.shadow.mapSize.width = 1024;
    ceilingLight.shadow.mapSize.height = 1024;
    ceilingLight.shadow.bias = -0.001;
    scene.add(ceilingLight);

    // Glowing CRT Phosphor Point Light (Bright green glow from the screen)
    const crtScreenLight = new THREE.PointLight(0x00ffb4, 0, 4.8);
    crtScreenLight.position.set(0, 1.45, 0.1);
    scene.add(crtScreenLight);

    // Mint side fill light
    const fillLight = new THREE.PointLight(0x5eead4, 0.8, 8);
    fillLight.position.set(-3.5, 3.2, -1.2);
    scene.add(fillLight);

    const group = new THREE.Group();
    scene.add(group);

    // --- 1. STERILE LUMON WHITE BACK WALL WITH ARCHITECTURAL DIVISION SEAMS ---
    const wallGeo = new THREE.PlaneGeometry(36, 14);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xfafcfc, // Clinical white wall
      roughness: 0.35,
      metalness: 0.05
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 5, -4.5);
    backWall.receiveShadow = true;
    group.add(backWall);

    // Minimal architectural wall seams (Vertical & Horizontal divider lines)
    for (let x = -8; x <= 8; x += 4) {
      const seamGeo = new THREE.BoxGeometry(0.015, 12, 0.01);
      const seamMat = new THREE.MeshBasicMaterial({ color: 0xd1dedc });
      const seam = new THREE.Mesh(seamGeo, seamMat);
      seam.position.set(x, 5, -4.49);
      group.add(seam);
    }

    // --- 2. ICONIC LUMON SEAFOAM GREEN CARPET FLOOR ---
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f2d26, // Iconic Lumon carpet green
      roughness: 0.8,
      metalness: 0.12
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // Crisp white/mint grid helper lines
    const gridHelper = new THREE.GridHelper(30, 30, 0x00e5a3, 0x1b4d42);
    gridHelper.position.y = 0.005;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    group.add(gridHelper);

    // Overhead Fluorescent Light Fixtures (Crisp white housing)
    for (let i = -1; i <= 1; i++) {
      const fixGeo = new THREE.BoxGeometry(0.55, 0.08, 4.6);
      const fixMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const fixMesh = new THREE.Mesh(fixGeo, fixMat);
      fixMesh.position.set(i * 3.8, 5.6, 0);
      group.add(fixMesh);
    }

    // --- 3. PRISTINE LUMON WHITE MATTE DESK ---
    const deskTopGeo = new THREE.BoxGeometry(3.6, 0.1, 1.8);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Pure pristine white lacquer desk
      roughness: 0.22,
      metalness: 0.1
    });
    const deskTop = new THREE.Mesh(deskTopGeo, deskMat);
    deskTop.position.set(0, 1.1, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    group.add(deskTop);

    // Brushed Chrome Legs
    const legGeo = new THREE.CylinderGeometry(0.038, 0.038, 1.1, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.15 });
    [[-1.65, -0.7], [1.65, -0.7], [-1.65, 0.7], [1.65, 0.7]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, 0.55, z);
      leg.castShadow = true;
      group.add(leg);
    });

    // --- 4. AUTHENTIC NATURAL KRAFT CARDBOARD PACKAGING BOX ---
    const boxGroup = new THREE.Group();
    boxGroup.position.set(-0.85, 1.25, 0.15); // Sits on desk top
    group.add(boxGroup);

    // Natural Cardboard Materials (Matte Kraft tan)
    const kraftBaseMat = new THREE.MeshStandardMaterial({
      color: 0xba8c58, // Warm authentic Kraft cardboard tan
      roughness: 0.88,
      metalness: 0.02
    });
    const kraftInnerMat = new THREE.MeshStandardMaterial({
      color: 0x9e7343, // Slightly darker corrugated interior
      roughness: 0.92,
      metalness: 0.01
    });
    const kraftTapeMat = new THREE.MeshStandardMaterial({
      color: 0x8c6130, // Cardboard packaging tape seal
      roughness: 0.72,
      metalness: 0.04
    });

    // Outer Bottom Tray (height: 0.20)
    const boxBaseGeo = new THREE.BoxGeometry(1.36, 0.20, 0.96);
    const boxBase = new THREE.Mesh(boxBaseGeo, kraftBaseMat);
    boxBase.castShadow = true;
    boxBase.receiveShadow = true;
    boxGroup.add(boxBase);

    // Inner protective cradle insert
    const insertGeo = new THREE.BoxGeometry(1.28, 0.05, 0.88);
    const boxInsert = new THREE.Mesh(insertGeo, kraftInnerMat);
    boxInsert.position.set(0, 0.075, 0);
    boxGroup.add(boxInsert);

    // Box Lid Group (Closed flush over the base initially)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.03, 0);
    boxGroup.add(lidGroup);

    const boxLidGeo = new THREE.BoxGeometry(1.38, 0.16, 0.98);
    const boxLid = new THREE.Mesh(boxLidGeo, kraftBaseMat);
    boxLid.castShadow = true;
    boxLid.receiveShadow = true;
    lidGroup.add(boxLid);

    // Center Packing Tape Strip
    const tapeGeo = new THREE.BoxGeometry(1.385, 0.005, 0.16);
    const tape = new THREE.Mesh(tapeGeo, kraftTapeMat);
    tape.position.set(0, 0.082, 0);
    lidGroup.add(tape);

    // Minimal Shipping / Fragile sticker on lid corner
    const labelGeo = new THREE.PlaneGeometry(0.24, 0.14);
    const labelMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.rotation.x = -Math.PI / 2;
    label.position.set(0.42, 0.083, 0.28);
    lidGroup.add(label);

    // --- 5. THE 3D LAPTOP (Deep Space Gray Aluminum - Crisp contrast on white desk) ---
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(-0.85, 1.25, 0.15);
    laptopGroup.visible = false; // Closed packaging initially - laptop is completely concealed
    group.add(laptopGroup);

    const baseGeo = new THREE.BoxGeometry(1.22, 0.034, 0.84);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.92,
      roughness: 0.2
    });
    const laptopBase = new THREE.Mesh(baseGeo, chassisMat);
    laptopBase.castShadow = true;
    laptopBase.receiveShadow = true;
    laptopGroup.add(laptopBase);

    // Keyboard Deck Inset
    const kbGeo = new THREE.BoxGeometry(1.02, 0.008, 0.46);
    const kbMat = new THREE.MeshStandardMaterial({
      color: 0x070b12,
      roughness: 0.6,
      metalness: 0.3,
      emissive: 0x00e5a3,
      emissiveIntensity: 0.15
    });
    const keyboard = new THREE.Mesh(kbGeo, kbMat);
    keyboard.position.set(0, 0.018, -0.06);
    laptopGroup.add(keyboard);

    // Precision Glass Trackpad
    const padGeo = new THREE.BoxGeometry(0.36, 0.004, 0.23);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2c384a, roughness: 0.2, metalness: 0.5 });
    const trackpad = new THREE.Mesh(padGeo, padMat);
    trackpad.position.set(0, 0.018, 0.25);
    laptopGroup.add(trackpad);

    // Screen Hinge
    const screenHinge = new THREE.Group();
    screenHinge.position.set(0, 0.02, -0.42);
    laptopGroup.add(screenHinge);

    // Screen Lid Back
    const lidGeo = new THREE.BoxGeometry(1.22, 0.84, 0.025);
    const screenLid = new THREE.Mesh(lidGeo, chassisMat);
    screenLid.position.set(0, 0.42, 0);
    screenLid.castShadow = true;
    screenHinge.add(screenLid);

    // OLED Display Panel
    const displayGeo = new THREE.PlaneGeometry(1.16, 0.79);
    const displayMat = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0, 0.42, 0.014);
    screenHinge.add(display);

    screenHinge.rotation.x = Math.PI / 2; // Flat / Closed initially

    // --- 6. FLOATING 3D MACRODATA REFINEMENT DATA CUBES ---
    const cubeGroup = new THREE.Group();
    group.add(cubeGroup);

    const floatCubes = [];
    for (let i = 0; i < 9; i++) {
      const cGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const cMat = new THREE.MeshStandardMaterial({
        color: 0x00e5a3,
        emissive: 0x00e5a3,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.85,
        transparent: true,
        opacity: 0
      });
      const mesh = new THREE.Mesh(cGeo, cMat);
      mesh.position.set(
        (Math.random() - 0.5) * 3.5,
        1.3 + Math.random() * 1.8,
        (Math.random() - 0.5) * 2.5
      );
      cubeGroup.add(mesh);
      floatCubes.push({ mesh, speed: 0.5 + Math.random() });
    }

    // --- 7. DYNAMIC NUMBER CRUNCHING CANVAS FUNCTION ---
    let frameTicker = 0;
    const drawSeveranceDisplay = (scrubProgress) => {
      frameTicker++;
      screenCtx.fillStyle = '#05110f';
      screenCtx.fillRect(0, 0, 640, 400);

      // CRT Scanlines
      screenCtx.fillStyle = 'rgba(0, 229, 163, 0.035)';
      for (let y = 0; y < 400; y += 4) {
        screenCtx.fillRect(0, y, 640, 1.5);
      }

      if (scrubProgress > 0.28) {
        // Lumon Terminal Header
        screenCtx.fillStyle = '#00e5a3';
        screenCtx.font = 'bold 14px monospace';
        screenCtx.fillText('LUMON INDUSTRIES // TECHTINK MDR-04', 30, 36);

        screenCtx.fillStyle = '#5eead4';
        screenCtx.font = '11px monospace';
        screenCtx.fillText('DATA STREAM: SIENNA_CLUSTER // ACTIVE CRUNCHING', 30, 54);

        // Completion calculation: reaches 100% when scrub reaches 0.82
        const completion = Math.min(100, Math.round(Math.max(0, (scrubProgress - 0.32) / 0.50) * 100));

        // Macrodata 4 Bins Status Ticker
        const woe = Math.min(100, Math.round(completion * 0.95));
        const dread = Math.min(100, Math.round(completion * 0.88));
        const malice = Math.min(100, Math.round(completion * 0.76));
        const frolic = completion;

        screenCtx.fillStyle = completion >= 100 ? '#00ffb4' : '#5eead4';
        screenCtx.font = '11px monospace';
        screenCtx.fillText(
          `[01] WOE ${woe}%   [02] DREAD ${dread}%   [03] MALICE ${malice}%   [04] FROLIC ${frolic}%`,
          30,
          72
        );

        // Macrodata Refinement Number Bins Grid
        const cols = 9;
        const rows = 5;
        const startX = 36;
        const startY = 104;

        for (let r = 0; r < rows; r++) {
          for (let col = 0; col < cols; col++) {
            const numSeed = ((r * cols + col) * 47 + Math.floor(frameTicker / 12)) % 9999;
            const numStr = String(numSeed).padStart(4, '0');
            const isScary = (r + col + Math.floor(frameTicker / 24)) % 4 === 0;

            if (completion >= 100) {
              screenCtx.fillStyle = '#00e5a3';
            } else {
              screenCtx.fillStyle = isScary ? '#ffffff' : '#00e5a3';
            }
            screenCtx.font = isScary && completion < 100 ? 'bold 15px monospace' : '13px monospace';

            const jitter = isScary && completion < 100 ? Math.sin(frameTicker * 0.25 + r) * 2.5 : 0;
            screenCtx.fillText(numStr, startX + col * 64, startY + r * 36 + jitter);
          }
        }

        // Progress Bar & Seal
        const barWidth = 580;
        const fillWidth = barWidth * (completion / 100);
        screenCtx.fillStyle = '#0e3a34';
        screenCtx.fillRect(30, 310, barWidth, 16);

        screenCtx.fillStyle = '#00e5a3';
        screenCtx.fillRect(30, 310, fillWidth, 16);

        screenCtx.fillStyle = '#ffffff';
        screenCtx.font = 'bold 11px monospace';
        screenCtx.fillText(
          `REFINEMENT COMPLETION: ${completion}% ${completion >= 100 ? '[100% COMPLETE // ALL 4 BINS EQUALIZED]' : '[SORTING ACTIVE NUMBERS...]' }`,
          34,
          348
        );
      }

      screenTexture.needsUpdate = true;
    };

    // --- Main Render Loop with Physics Momentum ---
    let firstFrame = true;
    const render = () => {
      // Apply momentum velocity with silky exponential friction
      if (Math.abs(velocityRef.current) > 0.00002) {
        targetProgressRef.current = Math.max(0, Math.min(1.15, targetProgressRef.current + velocityRef.current));
        velocityRef.current *= 0.90; // smooth momentum decay
      } else {
        velocityRef.current = 0;
      }

      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.14;
      const p = currentProgressRef.current;
      setProgress(p);

      // Dismiss only if user deliberately scrolls beyond 1.12
      if (p >= 1.12 && targetProgressRef.current >= 1.12 && !isDismissedRef.current) {
        isDismissedRef.current = true;
        setIsDismissed(true);
        document.body.style.overflow = '';
        setTimeout(() => {
          setIsMounted(false);
        }, 700);
      }

      // Camera Choreography (Adaptive framing for both mobile portrait and desktop widescreen)
      const isNarrow = window.innerWidth < 768 || (window.innerWidth / window.innerHeight < 1.0);
      const progressClamped = Math.min(0.85, p);

      const startZ = isNarrow ? 9.6 : 7.8;
      const endZ = isNarrow ? 3.3 : 2.5;
      const startY = isNarrow ? 3.5 : 3.2;
      const endY = isNarrow ? 1.60 : 1.48;
      const endX = isNarrow ? 0.12 : 0.42;

      let camTargetZ = THREE.MathUtils.lerp(startZ, endZ, progressClamped / 0.85);
      let camTargetY = THREE.MathUtils.lerp(startY, endY, progressClamped / 0.85);
      let camTargetX = THREE.MathUtils.lerp(0, endX, progressClamped / 0.85) + (mouseRef.current.x * (isNarrow ? 0.10 : 0.3));

      // Dramatic cinematic camera push towards screen during transition into store
      if (isTransitioningRef.current) {
        camTargetZ = 1.7;
        camTargetY = 1.45;
        camTargetX = 0;
      }

      camera.position.x += (camTargetX - camera.position.x) * 0.08;
      camera.position.y += (camTargetY - camera.position.y) * 0.08;
      camera.position.z += (camTargetZ - camera.position.z) * 0.08;
      camera.lookAt(0, 1.25, 0);

      // --- Physical Accurate Unboxing Sequence ---
      // Firmly closed packaging initially (p < 0.08)
      if (p < 0.08) {
        laptopGroup.visible = false;
        lidGroup.position.set(0, 0.03, 0);
        lidGroup.rotation.set(0, 0, 0);
        boxGroup.position.set(-0.85, 1.25, 0.15);
        screenHinge.rotation.x = Math.PI / 2;
      } else {
        laptopGroup.visible = true;

        // Stage 1: Cardboard Box Lid slides vertically up with vacuum glide (p: 0.08 -> 0.22)
        const lidLift = THREE.MathUtils.clamp((p - 0.08) / 0.14, 0, 1);
        lidGroup.position.y = 0.03 + (lidLift * 0.52);

        // Stage 2: Lid tilts and rests to the side; Laptop emerges and glides to center stage (p: 0.20 -> 0.38)
        const unboxSlide = THREE.MathUtils.clamp((p - 0.20) / 0.18, 0, 1);

        // Lid smoothly rotates and rests naturally on the desk
        lidGroup.position.x = -unboxSlide * 0.70;
        lidGroup.position.z = -unboxSlide * 0.35;
        lidGroup.position.y = 0.03 + 0.52 - (unboxSlide * 0.44);
        lidGroup.rotation.z = unboxSlide * 0.14;
        lidGroup.rotation.x = -unboxSlide * 0.16;

        // Cardboard Box Base gently rests on the left of the desk
        boxGroup.position.x = THREE.MathUtils.lerp(-0.85, -1.35, unboxSlide);
        boxGroup.position.z = THREE.MathUtils.lerp(0.15, -0.15, unboxSlide);

        // Laptop emerges from the packaging tray and glides to center
        laptopGroup.position.x = THREE.MathUtils.lerp(-0.85, 0, unboxSlide);
        laptopGroup.position.y = THREE.MathUtils.lerp(1.25, 1.18, unboxSlide);
        laptopGroup.position.z = THREE.MathUtils.lerp(0.15, 0, unboxSlide);

        // Stage 3: Laptop Display opens smoothly (p: 0.36 -> 0.60)
        const lidOpen = THREE.MathUtils.clamp((p - 0.36) / 0.24, 0, 1);
        screenHinge.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0.20, lidOpen);
      }

      // CRT Light Glow (Floods onto chassis and white desk)
      const crtGlow = THREE.MathUtils.clamp((p - 0.35) / 0.24, 0, 1);
      crtScreenLight.intensity = crtGlow * 4.2;

      // Backlit Keyboard Glow Pulse
      if (p > 0.4) {
        kbMat.emissiveIntensity = 0.15 + (Math.sin(frameTicker * 0.08) * 0.06);
      }

      // Floating 3D Cubes Orbit
      const cubeOpacity = THREE.MathUtils.clamp((p - 0.55) / 0.2, 0, 1);
      floatCubes.forEach(({ mesh, speed }, idx) => {
        mesh.material.opacity = cubeOpacity * 0.85;
        mesh.rotation.x += 0.009 * speed;
        mesh.rotation.y += 0.014 * speed;
        mesh.position.y += Math.sin(frameTicker * 0.02 * speed + idx) * 0.0028;
      });

      drawSeveranceDisplay(p);
      renderer.render(scene, camera);

      if (firstFrame) {
        setIsEngineReady(true);
        firstFrame = false;
      }

      // Once dismissed and curtain has cleared, stop render loop completely to free GPU for shop scrolling
      if (isDismissedRef.current && p >= 1.13) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsMobile(w < 640);
      camera.aspect = w / h;
      camera.fov = getTargetFov(w, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(loadTimer);
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
    };
  }, []);

  if (!isMounted) return null;

  const p = Math.max(0, Math.min(1.15, progress));

  const curtainLift = isDismissed ? 100 : Math.max(0, (p - 1.06) / 0.08) * 100;
  const isAtPlateau = p >= 0.82;
  const brandTitle = config?.brandName || 'تک‌تینک';

  return (
    <div 
      ref={containerRef}
      className="tt-severance-portal"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100svh',
        zIndex: 9999,
        background: '#f0f5f4', // Lumon pristine off-white portal background
        color: '#0f172a',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: isDismissed ? 'auto' : 'none',
        pointerEvents: isDismissed ? 'none' : 'auto',
        transform: `translateY(-${curtainLift}%)`,
        opacity: isDismissed ? 0.96 : 1,
        borderBottom: (isDismissed || isTransitioning) ? '3.5px solid #00e5a3' : 'none',
        boxShadow: (isDismissed || isTransitioning) ? '0 24px 70px rgba(0, 229, 163, 0.75)' : 'none',
        transition: isDismissed ? 'transform 0.70s cubic-bezier(0.85, 0, 0.15, 1), opacity 0.70s ease, box-shadow 0.3s ease' : 'none'
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas 
        ref={canvasRef} 
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          zIndex: 1,
          opacity: isEngineReady ? 1 : 0,
          transition: 'opacity 0.4s ease'
        }} 
      />

      {/* SEVERANCE ENGINE LOADING HUD (Pristine Lumon White Aesthetic) */}
      {!isEngineReady && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 60,
          background: '#f0f5f4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: '#0f2d26'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e5a3', boxShadow: '0 0 10px #00e5a3' }} />
            <span className="font-tech" style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 900, letterSpacing: '2px', color: '#0f2d26' }}>
              TECHTINK ENGINE // INITIALIZING...
            </span>
          </div>

          <div style={{ width: isMobile ? '180px' : '220px', height: '3px', background: 'rgba(0, 229, 163, 0.25)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${loadingPercent}%`, height: '100%', background: '#00e5a3', boxShadow: '0 0 8px #00e5a3', transition: 'width 0.1s linear' }} />
          </div>

          <span className="font-tech" style={{ fontSize: '0.62rem', color: '#64748b', letterSpacing: '1px' }}>
            COMPILING RETINA SHADERS & 3D ASSETS
          </span>
        </div>
      )}

      {/* Cinematic Letterboxing Bars (Lumon Deep Slate with Mint Laser Seams) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isMobile ? '20px' : 'clamp(22px, 3.5vh, 36px)', background: '#0d1816', zIndex: 30, borderBottom: '1.5px solid #00e5a3' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isMobile ? '20px' : 'clamp(22px, 3.5vh, 36px)', background: '#0d1816', zIndex: 30, borderTop: '1.5px solid #00e5a3' }} />

      {/* Viewfinder Crosshairs */}
      <div style={{ position: 'absolute', top: isMobile ? '28px' : '50px', left: isMobile ? '16px' : '36px', width: '12px', height: '12px', borderTop: '1.5px solid #00e5a3', borderLeft: '1.5px solid #00e5a3', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', top: isMobile ? '28px' : '50px', right: isMobile ? '16px' : '36px', width: '12px', height: '12px', borderTop: '1.5px solid #00e5a3', borderRight: '1.5px solid #00e5a3', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: isMobile ? '28px' : '50px', left: isMobile ? '16px' : '36px', width: '12px', height: '12px', borderBottom: '1.5px solid #00e5a3', borderLeft: '1.5px solid #00e5a3', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: isMobile ? '28px' : '50px', right: isMobile ? '16px' : '36px', width: '12px', height: '12px', borderBottom: '1.5px solid #00e5a3', borderRight: '1.5px solid #00e5a3', pointerEvents: 'none', zIndex: 20 }} />

      {/* TOP VIEWFINDER HUD (Clean Brand Identity + Quick Skip) */}
      <div 
        style={{
          position: 'absolute',
          top: isMobile ? '24px' : 'clamp(28px, 4.5vh, 44px)',
          left: isMobile ? '16px' : '36px',
          right: isMobile ? '16px' : '36px',
          zIndex: 35,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e5a3', boxShadow: '0 0 10px #00e5a3', display: 'inline-block' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: isMobile ? '0.85rem' : '0.98rem', fontWeight: 900, color: '#0f2d26', fontFamily: 'var(--font-sans)' }}>
              {brandTitle}
            </span>
            <span className="font-tech" style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, letterSpacing: '1px' }}>
              / TechTink
            </span>
          </div>
        </div>

        <div>
          {/* Persian Quick Skip Button */}
          <button
            type="button"
            onClick={handleProceedToStore}
            style={{
              background: '#0d1816',
              border: '1.5px solid #00e5a3',
              color: '#00e5a3',
              fontSize: isMobile ? '0.68rem' : '0.74rem',
              fontWeight: 800,
              padding: isMobile ? '6px 12px' : '7px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-sans)',
              direction: 'rtl',
              boxShadow: '0 4px 12px rgba(0, 229, 163, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{isMobile ? 'ورود به فروشگاه' : 'ورود به فروشگاه [ESC]'}</span>
            <ArrowDown size={isMobile ? 11 : 13} />
          </button>
        </div>
      </div>

      {/* BOTTOM TELEMETRY & BIG PERSIAN PROCEED BUTTON (Brand & Subtle Subtext + Action) */}
      <div 
        style={{
          position: 'absolute',
          bottom: isMobile ? '24px' : 'clamp(28px, 4.5vh, 44px)',
          left: isMobile ? '16px' : '36px',
          right: isMobile ? '16px' : '36px',
          zIndex: 35,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: isMobile ? 'flex-end' : 'space-between',
          alignItems: isMobile ? 'center' : 'flex-end',
          gap: isMobile ? '12px' : '20px'
        }}
      >
        <div style={{ textAlign: isMobile ? 'center' : 'right', direction: 'rtl', width: isMobile ? '100%' : 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '8px', marginBottom: '2px' }}>
            <span 
              style={{
                fontSize: isMobile ? '1.05rem' : '1.22rem',
                fontWeight: 900,
                color: '#0f2d26',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '-0.3px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00e5a3', boxShadow: '0 0 8px #00e5a3' }} />
              {brandTitle}
              <span className="font-tech" style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 800, letterSpacing: '1px', direction: 'ltr' }}>
                TechTink
              </span>
            </span>
          </div>

          <p 
            style={{
              margin: 0,
              fontSize: '0.62rem',
              color: '#94a3b8',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0px',
              opacity: 0.72
            }}
          >
            الهام گرفته شده از سریال severance
          </p>
        </div>

        {/* Dynamic Action: BIG PERSIAN PROCEED BUTTON vs SCRUB DIAL */}
        {isAtPlateau ? (
          <button
            type="button"
            onClick={handleProceedToStore}
            style={{
              background: 'linear-gradient(135deg, #00e5a3 0%, #059669 100%)',
              border: '2px solid #ffffff',
              color: '#041713',
              padding: isMobile ? '14px 24px' : '16px 36px',
              borderRadius: '16px',
              fontSize: isMobile ? '0.96rem' : '1.05rem',
              fontWeight: 900,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '10px' : '12px',
              boxShadow: '0 12px 36px rgba(0, 229, 163, 0.55), 0 0 0 3px rgba(255, 255, 255, 0.4)',
              animation: 'pulseGlow 2s infinite',
              direction: 'rtl',
              width: isMobile ? '100%' : 'auto',
              maxWidth: isMobile ? '360px' : 'none'
            }}
          >
            <Check size={isMobile ? 20 : 22} strokeWidth={3} />
            <span>ورود به فروشگاه تک‌تینک</span>
            <ArrowDown size={isMobile ? 16 : 18} strokeWidth={2.5} />
          </button>
        ) : (
          <div 
            onClick={handleProceedToStore}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              gap: '14px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
              width: isMobile ? 'auto' : 'auto'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div className="font-tech" style={{ fontSize: isMobile ? '0.80rem' : '0.88rem', fontWeight: 900, color: '#0f2d26', letterSpacing: '1px' }}>
                {Math.min(100, Math.round(p / 0.82 * 100))}%
              </div>
              <div style={{ fontSize: isMobile ? '0.58rem' : '0.62rem', color: '#475569', fontWeight: 700, fontFamily: 'var(--font-sans)', direction: 'rtl' }}>
                اسکرول برای پردازش داده‌ها
              </div>
            </div>

            <div style={{
              width: '18px',
              height: '28px',
              borderRadius: '8px',
              border: '1.5px solid #00e5a3',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '5px'
            }}>
              <div 
                style={{
                  width: '3.5px',
                  height: '6px',
                  borderRadius: '2px',
                  background: '#00e5a3',
                  transform: `translateY(${Math.min(10, p * 10)}px)`,
                  boxShadow: '0 0 6px #00e5a3',
                  transition: 'transform 0.05s linear'
                }} 
              />
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: 0 12px 36px rgba(0, 229, 163, 0.55), 0 0 0 3px rgba(255, 255, 255, 0.5);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 16px 48px rgba(0, 229, 163, 0.8), 0 0 0 5px rgba(255, 255, 255, 0.8);
            transform: scale(1.02);
          }
        }
      `}} />
    </div>
  );
}
