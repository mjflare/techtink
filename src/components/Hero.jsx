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
  const [isMounted, setIsMounted] = useState(true);

  // Momentum scrubbing refs (Tuned for an even longer, deliberate, cinema-grade scrub journey)
  const currentProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const animationFrameRef = useRef(null);
  const touchStartYRef = useRef(0);

  // Mouse coords for camera parallax
  const mouseRef = useRef({ x: 0, y: 0 });

  // 1. SCROLL-PINNING & GESTURE INTERCEPTION (Keeps page still while scrubbing)
  useEffect(() => {
    if (isDismissed) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Ultra-tuned scroll sensitivity for an extended, satisfying scrub distance
    const handleWheel = (e) => {
      e.preventDefault();
      // Reduced from 0.00042 to 0.00025 for a longer, cinematic experience
      const delta = e.deltaY * 0.00025;
      targetProgressRef.current = Math.max(0, Math.min(1.15, targetProgressRef.current + delta));
    };

    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const diffY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;

      if (e.cancelable) e.preventDefault();
      // Reduced touch delta to 0.00065 for smooth swipe control
      const delta = diffY * 0.00065;
      targetProgressRef.current = Math.max(0, Math.min(1.15, targetProgressRef.current + delta));
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        targetProgressRef.current = Math.min(1.15, targetProgressRef.current + 0.04);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.04);
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
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.overflow = originalOverflow;
    };
  }, [isDismissed]);

  const handleProceedToStore = () => {
    targetProgressRef.current = 1.18;
    currentProgressRef.current = 1.12;
    setProgress(1.0);
    setIsDismissed(true);
    document.body.style.overflow = '';
    setTimeout(() => {
      setIsMounted(false);
      const el = document.getElementById('shopping-center') || document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 650);
  };

  const handleJumpToScene = (val) => {
    targetProgressRef.current = val;
  };

  // 2. THREE.JS 3D ENGINE (Laptop & Macrodata Refinement Number Crunching Focus)
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

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a0e);
    scene.fog = new THREE.FogExp2(0x050a0e, 0.075);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
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
    renderer.toneMappingExposure = 1.25;

    // --- High-Resolution Dynamic CRT Offscreen Canvas ---
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 640;
    screenCanvas.height = 400;
    const screenCtx = screenCanvas.getContext('2d');
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;

    // --- Studio Lighting ---
    const ambientLight = new THREE.AmbientLight(0x112622, 1.5);
    scene.add(ambientLight);

    // Overhead Fluorescent Panel Light
    const ceilingLight = new THREE.DirectionalLight(0xe4fdf9, 2.2);
    ceilingLight.position.set(0, 7.5, 2.5);
    ceilingLight.castShadow = true;
    ceilingLight.shadow.mapSize.width = 1024;
    ceilingLight.shadow.mapSize.height = 1024;
    ceilingLight.shadow.bias = -0.001;
    scene.add(ceilingLight);

    // Glowing CRT Phosphor Point Light (Projects onto laptop keyboard, chassis and desk)
    const crtScreenLight = new THREE.PointLight(0x00ffb4, 0, 4.5);
    crtScreenLight.position.set(0, 1.45, 0.1);
    scene.add(crtScreenLight);

    // Rim studio accent
    const rimLight = new THREE.PointLight(0x38bdf8, 1.2, 8);
    rimLight.position.set(-3.5, 3.2, -1.2);
    scene.add(rimLight);

    const group = new THREE.Group();
    scene.add(group);

    // --- 1. LIMINAL OFFICE ROOM (Severance Floor Grid & Overhead Bars) ---
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x081a17,
      roughness: 0.82,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const gridHelper = new THREE.GridHelper(30, 30, 0x00ffb4, 0x0f2b26);
    gridHelper.position.y = 0.005;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    group.add(gridHelper);

    // Overhead Fluorescent Light Bars
    for (let i = -1; i <= 1; i++) {
      const fixGeo = new THREE.BoxGeometry(0.5, 0.08, 4.5);
      const fixMat = new THREE.MeshBasicMaterial({ color: 0xecfffa });
      const fixMesh = new THREE.Mesh(fixGeo, fixMat);
      fixMesh.position.set(i * 3.8, 5.5, 0);
      group.add(fixMesh);
    }

    // --- 2. THE DESK (Minimalist Executive Workstation) ---
    const deskTopGeo = new THREE.BoxGeometry(3.6, 0.1, 1.8);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x112421,
      roughness: 0.32,
      metalness: 0.28
    });
    const deskTop = new THREE.Mesh(deskTopGeo, deskMat);
    deskTop.position.set(0, 1.1, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    group.add(deskTop);

    // Chrome legs
    const legGeo = new THREE.CylinderGeometry(0.038, 0.038, 1.1, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    [[-1.65, -0.7], [1.65, -0.7], [-1.65, 0.7], [1.65, 0.7]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, 0.55, z);
      leg.castShadow = true;
      group.add(leg);
    });

    // --- 3. LUXURY PACKAGING BOX (Unboxes in Stage 1) ---
    const boxGroup = new THREE.Group();
    boxGroup.position.set(-0.75, 1.18, 0.2);
    group.add(boxGroup);

    const boxBaseGeo = new THREE.BoxGeometry(1.05, 0.24, 0.82);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x141b22, roughness: 0.45, metalness: 0.3 });
    const boxBase = new THREE.Mesh(boxBaseGeo, boxMat);
    boxBase.castShadow = true;
    boxBase.receiveShadow = true;
    boxGroup.add(boxBase);

    const boxLidGeo = new THREE.BoxGeometry(1.07, 0.1, 0.84);
    const boxLidMat = new THREE.MeshStandardMaterial({ color: 0x1c2630, roughness: 0.35, metalness: 0.4 });
    const boxLid = new THREE.Mesh(boxLidGeo, boxLidMat);
    boxLid.position.set(0, 0.14, 0);
    boxLid.castShadow = true;
    boxGroup.add(boxLid);

    // --- 4. THE 3D LAPTOP (The Star of the Scene) ---
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(0, 1.18, 0);
    group.add(laptopGroup);

    // Base Chassis
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

    // Milled Keyboard Deck with Phosphor Backlight Underglow
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

    // Screen Hinge Pivot
    const screenHinge = new THREE.Group();
    screenHinge.position.set(0, 0.02, -0.42);
    laptopGroup.add(screenHinge);

    // Screen Lid Back Shell
    const lidGeo = new THREE.BoxGeometry(1.22, 0.84, 0.025);
    const screenLid = new THREE.Mesh(lidGeo, chassisMat);
    screenLid.position.set(0, 0.42, 0);
    screenLid.castShadow = true;
    screenHinge.add(screenLid);

    // OLED Display Panel (Dynamic Canvas Texture with Severance Numbers)
    const displayGeo = new THREE.PlaneGeometry(1.16, 0.79);
    const displayMat = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0, 0.42, 0.014);
    screenHinge.add(display);

    screenHinge.rotation.x = Math.PI / 2; // Flat / Closed initially

    // --- 5. FLOATING 3D MACRODATA REFINEMENT DATA CUBES ---
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

    // --- 6. DYNAMIC NUMBER CRUNCHING CANVAS FUNCTION ---
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

        // Macrodata Refinement Number Bins Grid (Crunching & Sorting Numbers)
        const cols = 9;
        const rows = 5;
        const startX = 36;
        const startY = 104;

        for (let r = 0; r < rows; r++) {
          for (let col = 0; col < cols; col++) {
            // Numbers jitter, sort, and bounce in clusters
            const numSeed = ((r * cols + col) * 47 + Math.floor(frameTicker / 12)) % 9999;
            const numStr = String(numSeed).padStart(4, '0');
            const isScary = (r + col + Math.floor(frameTicker / 24)) % 4 === 0;

            if (completion >= 100) {
              screenCtx.fillStyle = '#00e5a3'; // Peaceful harmonious phosphor at 100%
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

    // --- Main Render Loop ---
    let firstFrame = true;
    const render = () => {
      // Lerp scrub progress
      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.12;
      const p = currentProgressRef.current;
      setProgress(p);

      // Dismiss only if user deliberately scrolls beyond 1.12
      if (p >= 1.12 && targetProgressRef.current >= 1.12 && !isDismissed) {
        setIsDismissed(true);
        setTimeout(() => {
          setIsMounted(false);
          const el = document.getElementById('shopping-center') || document.getElementById('catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 650);
      }

      // Camera Choreography Focused 100% on the Laptop:
      // Starts wide (surveillance) -> dollies in to dramatic 3/4 macro view of laptop & screen
      const progressClamped = Math.min(0.85, p);
      const camTargetZ = THREE.MathUtils.lerp(7.8, 2.5, progressClamped / 0.85);
      const camTargetY = THREE.MathUtils.lerp(3.2, 1.48, progressClamped / 0.85);
      const camTargetX = THREE.MathUtils.lerp(0, 0.42, progressClamped / 0.85) + (mouseRef.current.x * 0.3);

      camera.position.x += (camTargetX - camera.position.x) * 0.08;
      camera.position.y += (camTargetY - camera.position.y) * 0.08;
      camera.position.z += (camTargetZ - camera.position.z) * 0.08;
      camera.lookAt(0, 1.25, 0);

      // Stage 1: Unboxing (p: 0.0 -> 0.28)
      const lidLift = THREE.MathUtils.clamp((p - 0.03) / 0.22, 0, 1);
      boxLid.position.y = 0.14 + (lidLift * 0.45);
      boxLid.rotation.z = lidLift * 0.22;

      const boxFade = THREE.MathUtils.clamp((p - 0.20) / 0.14, 0, 1);
      boxGroup.position.y = 1.18 - (boxFade * 0.6);
      boxBase.material.opacity = 1 - boxFade;
      boxLid.material.opacity = 1 - boxFade;
      boxBase.material.transparent = true;
      boxLid.material.transparent = true;

      // Stage 2: Laptop Position & Lid Opening (p: 0.28 -> 0.58)
      const laptopSlide = THREE.MathUtils.clamp((p - 0.08) / 0.24, 0, 1);
      laptopGroup.position.x = THREE.MathUtils.lerp(-0.75, 0, laptopSlide);
      laptopGroup.position.z = THREE.MathUtils.lerp(0.2, 0, laptopSlide);

      // Screen Lid rotates open smoothly
      const lidOpen = THREE.MathUtils.clamp((p - 0.26) / 0.28, 0, 1);
      screenHinge.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0.20, lidOpen);

      // CRT Light Glow (Floods onto chassis and desk)
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

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
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

  // Telemetry Chapters (Factual, zero slogans)
  let sceneIndex = '01';
  let sceneTag = 'SECTOR 01 // ARRIVAL & PACKAGING DISASSEMBLY';
  let sceneSub = 'UNSEAL MATTE COMPOSITE ENCLOSURE';

  if (p >= 0.28 && p < 0.58) {
    sceneIndex = '02';
    sceneTag = 'SECTOR 02 // CRT TERMINAL BOOT & PHOSPHOR LINK';
    sceneSub = 'OLED 500 NITS CALIBRATION INITIATED';
  } else if (p >= 0.58 && p < 0.82) {
    sceneIndex = '03';
    sceneTag = 'SECTOR 03 // MACRODATA REFINEMENT & BIN SORTING';
    sceneSub = 'CRUNCHING NUMBERS // WOE · DREAD · MALICE · FROLIC';
  } else if (p >= 0.82) {
    sceneIndex = '04';
    sceneTag = 'SECTOR 04 // 100% REFINEMENT EQUILIBRIUM';
    sceneSub = 'ALL 4 BINS EQUALIZED // READY FOR PRODUCTION';
  }

  const curtainLift = isDismissed ? 100 : Math.max(0, (p - 1.06) / 0.08) * 100;
  const isAtPlateau = p >= 0.82;

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
        background: '#050a0e',
        color: '#ffffff',
        overflow: 'hidden',
        userSelect: 'none',
        transform: `translateY(-${curtainLift}%)`,
        opacity: isDismissed ? 0.96 : 1,
        transition: isDismissed ? 'transform 0.65s cubic-bezier(0.85, 0, 0.15, 1), opacity 0.65s ease' : 'none'
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

      {/* SEVERANCE ENGINE LOADING HUD */}
      {!isEngineReady && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 60,
          background: '#050a0e',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: '#00e5a3'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e5a3', boxShadow: '0 0 10px #00e5a3' }} />
            <span className="font-tech" style={{ fontSize: '0.82rem', fontWeight: 900, letterSpacing: '2.5px' }}>
              LUMON MDR-04 ENGINE // INITIALIZING...
            </span>
          </div>

          <div style={{ width: '220px', height: '2px', background: 'rgba(0, 229, 163, 0.15)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${loadingPercent}%`, height: '100%', background: '#00e5a3', boxShadow: '0 0 8px #00e5a3', transition: 'width 0.1s linear' }} />
          </div>

          <span className="font-tech" style={{ fontSize: '0.62rem', color: '#64748b', letterSpacing: '1px' }}>
            COMPILING RETINA SHADERS & 3D ASSETS
          </span>
        </div>
      )}

      {/* Cinematic Letterboxing Bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(22px, 3.5vh, 36px)', background: '#020406', zIndex: 30, borderBottom: '1px solid rgba(0, 229, 163, 0.1)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 'clamp(22px, 3.5vh, 36px)', background: '#020406', zIndex: 30, borderTop: '1px solid rgba(0, 229, 163, 0.1)' }} />

      {/* Viewfinder Crosshairs */}
      <div style={{ position: 'absolute', top: '50px', left: '36px', width: '14px', height: '14px', borderTop: '1px solid rgba(0, 229, 163, 0.4)', borderLeft: '1px solid rgba(0, 229, 163, 0.4)', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', top: '50px', right: '36px', width: '14px', height: '14px', borderTop: '1px solid rgba(0, 229, 163, 0.4)', borderRight: '1px solid rgba(0, 229, 163, 0.4)', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: '50px', left: '36px', width: '14px', height: '14px', borderBottom: '1px solid rgba(0, 229, 163, 0.4)', borderLeft: '1px solid rgba(0, 229, 163, 0.4)', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: '50px', right: '36px', width: '14px', height: '14px', borderBottom: '1px solid rgba(0, 229, 163, 0.4)', borderRight: '1px solid rgba(0, 229, 163, 0.4)', pointerEvents: 'none', zIndex: 20 }} />

      {/* TOP VIEWFINDER HUD */}
      <div 
        style={{
          position: 'absolute',
          top: 'clamp(28px, 4.5vh, 44px)',
          left: '36px',
          right: '36px',
          zIndex: 35,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        dir="ltr"
      >
        <div>
          <span className="font-tech" style={{ fontSize: '0.74rem', fontWeight: 900, letterSpacing: '2.5px', color: '#00e5a3' }}>
            LUMON // TECHTINK DIVISION
          </span>
          <span style={{ fontSize: '0.62rem', color: '#64748b', display: 'block', letterSpacing: '1px' }}>
            TERMINAL 04 · SEVERED LEVEL
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { id: 1, label: '01 UNBOX', val: 0.14 },
            { id: 2, label: '02 BOOT', val: 0.45 },
            { id: 3, label: '03 CRUNCH', val: 0.72 },
            { id: 4, label: '04 COMPLETE', val: 0.90 }
          ].map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleJumpToScene(s.val)}
              className="font-tech"
              style={{
                background: sceneIndex === `0${s.id}` ? 'rgba(0, 229, 163, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${sceneIndex === `0${s.id}` ? '#00e5a3' : 'rgba(255, 255, 255, 0.1)'}`,
                color: sceneIndex === `0${s.id}` ? '#00e5a3' : '#94a3b8',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                letterSpacing: '1px',
                transition: 'all 0.2s ease'
              }}
            >
              {s.label}
            </button>
          ))}

          <button
            type="button"
            onClick={handleProceedToStore}
            className="font-tech"
            style={{
              background: 'rgba(0, 229, 163, 0.12)',
              border: '1px solid rgba(0, 229, 163, 0.45)',
              color: '#00e5a3',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '5px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              letterSpacing: '1px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>STORE [ESC]</span>
            <ArrowDown size={11} />
          </button>
        </div>
      </div>

      {/* BOTTOM TELEMETRY & EXTENDED WIGGLE-ROOM CONTROLLER */}
      <div 
        style={{
          position: 'absolute',
          bottom: 'clamp(28px, 4.5vh, 44px)',
          left: '36px',
          right: '36px',
          zIndex: 35,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '20px'
        }}
        dir="ltr"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span 
              className="font-tech"
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#00e5a3',
                letterSpacing: '1.5px'
              }}
            >
              {sceneTag}
            </span>
          </div>

          <p 
            className="font-tech"
            style={{
              margin: 0,
              fontSize: '0.68rem',
              color: '#64748b',
              letterSpacing: '0.5px'
            }}
          >
            {sceneSub}
          </p>
        </div>

        {/* Dynamic Action: Wiggle Room Proceed Button vs Scrub Dial */}
        {isAtPlateau ? (
          <button
            type="button"
            onClick={handleProceedToStore}
            className="font-tech"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 229, 163, 0.25), rgba(56, 189, 248, 0.25))',
              border: '1px solid #00e5a3',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '1.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(0, 229, 163, 0.35)',
              animation: 'pulseGlow 2s infinite'
            }}
          >
            <Check size={14} color="#00e5a3" />
            <span>PROCEED TO STORE →</span>
          </button>
        ) : (
          <div 
            onClick={handleProceedToStore}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div className="font-tech" style={{ fontSize: '0.82rem', fontWeight: 900, color: '#00e5a3', letterSpacing: '1px' }}>
                {Math.min(100, Math.round(p / 0.82 * 100))}%
              </div>
              <div className="font-tech" style={{ fontSize: '0.58rem', color: '#64748b', letterSpacing: '1px' }}>
                SCROLL TO CRUNCH
              </div>
            </div>

            <div style={{
              width: '18px',
              height: '28px',
              borderRadius: '8px',
              border: '1.5px solid rgba(0, 229, 163, 0.4)',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '5px'
            }}>
              <div 
                style={{
                  width: '3px',
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
          0%, 100% { box-shadow: 0 0 16px rgba(0, 229, 163, 0.25); }
          50% { box-shadow: 0 0 28px rgba(0, 229, 163, 0.5); }
        }
      `}} />
    </div>
  );
}
