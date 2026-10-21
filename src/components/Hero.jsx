import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { ArrowDown, Cpu, Check, Loader2 } from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Engine loading state
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [loadingPercent, setLoadingPercent] = useState(15);

  // Animation Progress: 0.0 to 1.0 (Scrubbed by scroll gestures)
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Momentum scrubbing refs (Tuned for longer, deliberate, weighted physical scroll feel)
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

    // Fine-tuned scroll sensitivity for longer, more deliberate storytelling
    const handleWheel = (e) => {
      e.preventDefault();
      // Reduced sensitivity from 0.0011 to 0.00042 for a longer, cinematic scrub distance
      const delta = e.deltaY * 0.00042;
      targetProgressRef.current = Math.max(0, Math.min(1.12, targetProgressRef.current + delta));
    };

    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const diffY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;

      if (e.cancelable) e.preventDefault();
      // Reduced touch delta from 0.0025 to 0.0011 for smooth swipe control
      const delta = diffY * 0.0011;
      targetProgressRef.current = Math.max(0, Math.min(1.12, targetProgressRef.current + delta));
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        targetProgressRef.current = Math.min(1.12, targetProgressRef.current + 0.06);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.06);
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

  // Proceed to store action (Clean transition with curtain lift)
  const handleProceedToStore = () => {
    targetProgressRef.current = 1.15;
    currentProgressRef.current = 1.1;
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

  // 2. THREE.JS 3D SEVERANCE ENGINE (High detail character & liminal environment)
  useEffect(() => {
    if (!canvasRef.current) return;

    // Simulate quick shader compile ticker
    let loadTimer = setInterval(() => {
      setLoadingPercent(prev => {
        if (prev >= 95) {
          clearInterval(loadTimer);
          return 100;
        }
        return prev + 25;
      });
    }, 70);

    const canvas = canvasRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // --- Scene & Renderer ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a0e); // Eerie Lumon Seafoam Dark
    scene.fog = new THREE.FogExp2(0x050a0e, 0.07);

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
    renderer.toneMappingExposure = 1.2;

    // --- Dynamic CRT Offscreen Canvas ---
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 320;
    const screenCtx = screenCanvas.getContext('2d');
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x132724, 1.4);
    scene.add(ambientLight);

    // Overhead Lumon Fluorescent Bar Light
    const ceilingLight = new THREE.DirectionalLight(0xe4fdf9, 2.0);
    ceilingLight.position.set(0, 7.5, 2.5);
    ceilingLight.castShadow = true;
    ceilingLight.shadow.mapSize.width = 1024;
    ceilingLight.shadow.mapSize.height = 1024;
    ceilingLight.shadow.camera.near = 0.5;
    ceilingLight.shadow.camera.far = 16;
    ceilingLight.shadow.bias = -0.001;
    scene.add(ceilingLight);

    // CRT Screen Phosphor Glow Point (casts on keyboard & face)
    const crtScreenLight = new THREE.PointLight(0x00ffb4, 0, 4.2);
    crtScreenLight.position.set(0, 1.42, 0.1);
    scene.add(crtScreenLight);

    // Rim studio accent
    const rimLight = new THREE.PointLight(0x38bdf8, 1.1, 7);
    rimLight.position.set(-3.8, 3.2, -1.2);
    scene.add(rimLight);

    const group = new THREE.Group();
    scene.add(group);

    // --- 1. LIMINAL OFFICE ROOM (Severance Floor Grid & Fluorescents) ---
    const floorGeo = new THREE.PlaneGeometry(32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x091c18, // Lumon carpet green
      roughness: 0.8,
      metalness: 0.15
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const gridHelper = new THREE.GridHelper(28, 28, 0x00ffb4, 0x11312b);
    gridHelper.position.y = 0.005;
    gridHelper.material.opacity = 0.32;
    gridHelper.material.transparent = true;
    group.add(gridHelper);

    // Overhead Fluorescent Fixtures
    for (let i = -1; i <= 1; i++) {
      const fixGeo = new THREE.BoxGeometry(0.5, 0.08, 4.2);
      const fixMat = new THREE.MeshBasicMaterial({ color: 0xecfffa });
      const fixMesh = new THREE.Mesh(fixGeo, fixMat);
      fixMesh.position.set(i * 3.8, 5.4, 0);
      group.add(fixMesh);
    }

    // --- 2. THE DESK (Minimalist Mid-Century Executive Desk) ---
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

    // --- 3. THE PACKAGING BOX (Unboxes smoothly in Stage 1) ---
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

    // --- 4. THE 3D LAPTOP ---
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(0, 1.18, 0);
    group.add(laptopGroup);

    const baseGeo = new THREE.BoxGeometry(1.18, 0.032, 0.82);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.22
    });
    const laptopBase = new THREE.Mesh(baseGeo, chassisMat);
    laptopBase.castShadow = true;
    laptopBase.receiveShadow = true;
    laptopGroup.add(laptopBase);

    // Keyboard Deck Inset
    const kbGeo = new THREE.BoxGeometry(0.98, 0.008, 0.44);
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

    // Trackpad
    const padGeo = new THREE.BoxGeometry(0.34, 0.004, 0.22);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2c384a, roughness: 0.2, metalness: 0.5 });
    const trackpad = new THREE.Mesh(padGeo, padMat);
    trackpad.position.set(0, 0.018, 0.25);
    laptopGroup.add(trackpad);

    // Screen Hinge
    const screenHinge = new THREE.Group();
    screenHinge.position.set(0, 0.02, -0.41);
    laptopGroup.add(screenHinge);

    // Screen Lid Back
    const lidGeo = new THREE.BoxGeometry(1.18, 0.82, 0.024);
    const screenLid = new THREE.Mesh(lidGeo, chassisMat);
    screenLid.position.set(0, 0.41, 0);
    screenLid.castShadow = true;
    screenHinge.add(screenLid);

    // Display Panel
    const displayGeo = new THREE.PlaneGeometry(1.12, 0.77);
    const displayMat = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0, 0.41, 0.014);
    screenHinge.add(display);

    screenHinge.rotation.x = Math.PI / 2; // Starts flat/closed

    // --- 5. HIGH-DETAIL SEVERANCE CHARACTER (Mark S. / Lumon Worker) ---
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, 1.1, 0.85);
    group.add(characterGroup);

    // A. Tailored Charcoal Suit Jacket
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x0e1722, roughness: 0.72, metalness: 0.12 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.5, metalness: 0.2 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf3cca9, roughness: 0.45 });

    // Torso Base
    const torsoGeo = new THREE.CylinderGeometry(0.25, 0.21, 0.82, 16);
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.set(0, 0.36, 0);
    torso.castShadow = true;
    characterGroup.add(torso);

    // Left and Right Suit Lapels
    const lapelGeo = new THREE.BoxGeometry(0.08, 0.38, 0.02);
    const leftLapel = new THREE.Mesh(lapelGeo, suitMat);
    leftLapel.position.set(-0.1, 0.5, 0.2);
    leftLapel.rotation.set(0.1, 0.1, -0.2);
    characterGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, suitMat);
    rightLapel.position.set(0.1, 0.5, 0.2);
    rightLapel.rotation.set(0.1, -0.1, 0.2);
    characterGroup.add(rightLapel);

    // Collared White Dress Shirt V-neck
    const shirtGeo = new THREE.BoxGeometry(0.12, 0.28, 0.02);
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.set(0, 0.55, 0.19);
    characterGroup.add(shirt);

    // Slate Blue Tie with Silver Tie Bar
    const tieGeo = new THREE.BoxGeometry(0.045, 0.32, 0.015);
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.set(0, 0.48, 0.21);
    characterGroup.add(tie);

    const tieBarGeo = new THREE.BoxGeometry(0.04, 0.008, 0.008);
    const tieBarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const tieBar = new THREE.Mesh(tieBarGeo, tieBarMat);
    tieBar.position.set(0, 0.52, 0.22);
    characterGroup.add(tieBar);

    // Lumon Blue Lanyard & Security Identification Badge
    const lanyardGeo = new THREE.TorusGeometry(0.16, 0.008, 8, 24, Math.PI);
    const lanyardMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const lanyard = new THREE.Mesh(lanyardGeo, lanyardMat);
    lanyard.position.set(0, 0.68, 0.14);
    lanyard.rotation.x = Math.PI / 2.3;
    characterGroup.add(lanyard);

    const badgeGeo = new THREE.BoxGeometry(0.085, 0.13, 0.012);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0.08, 0.41, 0.23);
    characterGroup.add(badge);

    // Badge Photo strip & Lumon Blue logo block
    const badgePhotoGeo = new THREE.BoxGeometry(0.065, 0.05, 0.002);
    const badgePhotoMat = new THREE.MeshBasicMaterial({ color: 0x0369a1 });
    const badgePhoto = new THREE.Mesh(badgePhotoGeo, badgePhotoMat);
    badgePhoto.position.set(0.08, 0.43, 0.24);
    characterGroup.add(badgePhoto);

    // B. Anatomical Head with Detailed Hair, Ears, and Natural Gaze
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.84, 0);
    characterGroup.add(headGroup);

    const neckGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.15, 12);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    headGroup.add(neck);

    const headGeo = new THREE.SphereGeometry(0.165, 24, 24);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.18, 0);
    head.scale.set(0.96, 1.14, 1.02);
    head.castShadow = true;
    headGroup.add(head);

    // Sculpted Nose Bridge
    const noseGeo = new THREE.ConeGeometry(0.024, 0.06, 8);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, 0.18, 0.17);
    nose.rotation.x = Math.PI / 2;
    headGroup.add(nose);

    // Sculpted Ears
    const earGeo = new THREE.SphereGeometry(0.035, 12, 12);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.16, 0.18, 0);
    leftEar.scale.set(0.4, 1.2, 0.8);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.16, 0.18, 0);
    rightEar.scale.set(0.4, 1.2, 0.8);
    headGroup.add(rightEar);

    // Mark S. Layered Signature Side-Part Haircut
    const hairGeo = new THREE.SphereGeometry(0.175, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2.1);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x0a1017, roughness: 0.7, metalness: 0.1 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.22, -0.015);
    headGroup.add(hair);

    // Hair Side Part Fringe
    const fringeGeo = new THREE.BoxGeometry(0.14, 0.05, 0.08);
    const fringe = new THREE.Mesh(fringeGeo, hairMat);
    fringe.position.set(-0.06, 0.31, 0.1);
    fringe.rotation.set(-0.2, 0.1, -0.15);
    headGroup.add(fringe);

    // C. Articulated Arms, Hands & Individual Knuckle Fingers
    const armGeo = new THREE.CylinderGeometry(0.058, 0.05, 0.56, 12);
    const leftArm = new THREE.Mesh(armGeo, suitMat);
    leftArm.position.set(-0.28, 0.36, -0.2);
    leftArm.rotation.set(0.72, 0, 0.28);
    characterGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, suitMat);
    rightArm.position.set(0.28, 0.36, -0.2);
    rightArm.rotation.set(0.72, 0, -0.28);
    characterGroup.add(rightArm);

    // Hands with Articulated Home-Row Fingers
    const createDetailedHand = (isLeft) => {
      const hGroup = new THREE.Group();
      // Palm
      const palmGeo = new THREE.BoxGeometry(0.07, 0.024, 0.08);
      const palm = new THREE.Mesh(palmGeo, skinMat);
      hGroup.add(palm);

      // Thumb
      const thumbGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.045, 8);
      const thumb = new THREE.Mesh(thumbGeo, skinMat);
      thumb.position.set(isLeft ? 0.038 : -0.038, -0.005, 0.01);
      thumb.rotation.set(0.3, 0, isLeft ? -0.6 : 0.6);
      hGroup.add(thumb);

      // 4 Fingers
      const fingerList = [];
      for (let i = 0; i < 4; i++) {
        const fGeo = new THREE.CylinderGeometry(0.01, 0.009, 0.052, 8);
        const finger = new THREE.Mesh(fGeo, skinMat);
        const xOffset = (i - 1.5) * 0.017;
        finger.position.set(xOffset, 0, -0.055);
        finger.rotation.x = Math.PI / 2.8;
        hGroup.add(finger);
        fingerList.push(finger);
      }
      return { hGroup, fingerList };
    };

    const leftHandData = createDetailedHand(true);
    leftHandData.hGroup.position.set(-0.16, 0.095, -0.5);
    characterGroup.add(leftHandData.hGroup);

    const rightHandData = createDetailedHand(false);
    rightHandData.hGroup.position.set(0.16, 0.095, -0.5);
    characterGroup.add(rightHandData.hGroup);

    // 6. Floating Macrodata Cubes
    const cubeGroup = new THREE.Group();
    group.add(cubeGroup);

    const floatCubes = [];
    for (let i = 0; i < 7; i++) {
      const cGeo = new THREE.BoxGeometry(0.13, 0.13, 0.13);
      const cMat = new THREE.MeshStandardMaterial({
        color: 0x00e5a3,
        emissive: 0x00e5a3,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.85,
        transparent: true,
        opacity: 0
      });
      const mesh = new THREE.Mesh(cGeo, cMat);
      mesh.position.set(
        (Math.random() - 0.5) * 3.2,
        1.4 + Math.random() * 1.6,
        (Math.random() - 0.5) * 2.2
      );
      cubeGroup.add(mesh);
      floatCubes.push({ mesh, speed: 0.6 + Math.random() });
    }

    // --- Dynamic CRT Canvas Screen Drawing Function (Severance Macrodata Refinement) ---
    let frameTicker = 0;
    const drawSeveranceDisplay = (scrubProgress) => {
      frameTicker++;
      screenCtx.fillStyle = '#05110f';
      screenCtx.fillRect(0, 0, 512, 320);

      // CRT Scanlines
      screenCtx.fillStyle = 'rgba(0, 229, 163, 0.035)';
      for (let y = 0; y < 320; y += 4) {
        screenCtx.fillRect(0, y, 512, 1.5);
      }

      if (scrubProgress > 0.32) {
        // Lumon Terminal Header
        screenCtx.fillStyle = '#00e5a3';
        screenCtx.font = 'bold 13px monospace';
        screenCtx.fillText('LUMON INDUSTRIES // TECHTINK MDR-04', 24, 32);

        screenCtx.fillStyle = '#5eead4';
        screenCtx.font = '10px monospace';
        screenCtx.fillText('DATA STREAM: SIENNA_CLUSTER // CALIBRATED', 24, 48);

        // Completion calculation: reaches 100% when scrub reaches 0.82
        const completion = Math.min(100, Math.round(Math.max(0, (scrubProgress - 0.35) / 0.47) * 100));

        if (completion >= 100) {
          screenCtx.fillStyle = '#00ffb4';
          screenCtx.font = 'bold 12px monospace';
          screenCtx.fillText('TEMPER STATUS: 100% BALANCED // REFINEMENT ACCORD REACHED', 24, 64);
        } else {
          screenCtx.fillText(`TEMPER: WOE [${Math.round(completion * 0.4)}%]  DREAD [${Math.round(completion * 0.2)}%]  FROLIC [${completion}%]`, 24, 64);
        }

        // Macrodata Refinement Numbers Grid
        const cols = 8;
        const rows = 4;
        const startX = 36;
        const startY = 92;

        for (let r = 0; r < rows; r++) {
          for (let col = 0; col < cols; col++) {
            const numSeed = ((r * cols + col) * 41 + Math.floor(frameTicker / 14)) % 9999;
            const numStr = String(numSeed).padStart(4, '0');
            const isScary = (r + col + Math.floor(frameTicker / 28)) % 5 === 0;

            if (completion >= 100) {
              screenCtx.fillStyle = '#00e5a3'; // All harmonious at 100%
            } else {
              screenCtx.fillStyle = isScary ? '#ffffff' : '#00e5a3';
            }
            screenCtx.font = isScary && completion < 100 ? 'bold 14px monospace' : '12px monospace';

            const jitter = isScary && completion < 100 ? Math.sin(frameTicker * 0.2 + r) * 2 : 0;
            screenCtx.fillText(numStr, startX + col * 56, startY + r * 38 + jitter);
          }
        }

        // Progress Bar
        const barWidth = 464;
        const fillWidth = barWidth * (completion / 100);
        screenCtx.fillStyle = '#0f3d37';
        screenCtx.fillRect(24, 260, barWidth, 14);

        screenCtx.fillStyle = '#00e5a3';
        screenCtx.fillRect(24, 260, fillWidth, 14);

        screenCtx.fillStyle = '#ffffff';
        screenCtx.font = 'bold 10px monospace';
        screenCtx.fillText(`REFINEMENT COMPLETION: ${completion}% ${completion >= 100 ? '[COMPLETE - ALL BINS SEALED]' : ''}`, 28, 292);
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

      // Only dismiss if user deliberately scrolls beyond 1.08 (gives ample wiggle room at the end!)
      if (p >= 1.08 && targetProgressRef.current >= 1.08 && !isDismissed) {
        setIsDismissed(true);
        setTimeout(() => {
          setIsMounted(false);
          const el = document.getElementById('shopping-center') || document.getElementById('catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 650);
      }

      // Camera Choreography
      // 0.0 -> 0.82: camera dollies smoothly in
      // 0.82 -> 1.05: camera rests at comfortable contemplation angle with gentle mouse tilt
      const progressClamped = Math.min(0.85, p);
      const camTargetZ = THREE.MathUtils.lerp(7.8, 3.1, progressClamped / 0.85);
      const camTargetY = THREE.MathUtils.lerp(3.2, 1.55, progressClamped / 0.85);
      const camTargetX = THREE.MathUtils.lerp(0, 0.32, progressClamped / 0.85) + (mouseRef.current.x * 0.35);

      camera.position.x += (camTargetX - camera.position.x) * 0.08;
      camera.position.y += (camTargetY - camera.position.y) * 0.08;
      camera.position.z += (camTargetZ - camera.position.z) * 0.08;
      camera.lookAt(0, 1.25, 0);

      // Subtle breathing chest expansion
      const breath = Math.sin(frameTicker * 0.04) * 0.006;
      torso.scale.set(1 + breath, 1, 1 + breath);

      // Stage 1: Unboxing (p: 0.0 -> 0.30)
      const lidLift = THREE.MathUtils.clamp((p - 0.04) / 0.22, 0, 1);
      boxLid.position.y = 0.14 + (lidLift * 0.45);
      boxLid.rotation.z = lidLift * 0.22;

      const boxFade = THREE.MathUtils.clamp((p - 0.22) / 0.14, 0, 1);
      boxGroup.position.y = 1.18 - (boxFade * 0.6);
      boxBase.material.opacity = 1 - boxFade;
      boxLid.material.opacity = 1 - boxFade;
      boxBase.material.transparent = true;
      boxLid.material.transparent = true;

      // Stage 2: Laptop Position & Lid Opening (p: 0.30 -> 0.60)
      const laptopSlide = THREE.MathUtils.clamp((p - 0.08) / 0.24, 0, 1);
      laptopGroup.position.x = THREE.MathUtils.lerp(-0.75, 0, laptopSlide);
      laptopGroup.position.z = THREE.MathUtils.lerp(0.2, 0, laptopSlide);

      // Lid rotation
      const lidOpen = THREE.MathUtils.clamp((p - 0.28) / 0.28, 0, 1);
      screenHinge.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0.22, lidOpen);

      // CRT Light Glow
      const crtGlow = THREE.MathUtils.clamp((p - 0.38) / 0.24, 0, 1);
      crtScreenLight.intensity = crtGlow * 3.6;

      // Stage 3 & 4: Character Head Gaze & Serene Smile
      // When p < 0.82: head looks down at screen
      // When p >= 0.82 (Completion Plateau): head gently tilts up with proud, serene satisfaction
      const isRefined = p >= 0.82;
      const headGazeDown = THREE.MathUtils.clamp((p - 0.3) / 0.3, 0, 1);
      const headSereneLift = THREE.MathUtils.clamp((p - 0.82) / 0.15, 0, 1);

      const targetHeadX = THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(-0.15, 0.24, headGazeDown),
        0.05, // Looks up pleasantly at the viewer
        headSereneLift
      );
      headGroup.rotation.x = targetHeadX;
      headGroup.rotation.y = THREE.MathUtils.lerp(-0.2, 0, headGazeDown);

      // Individual Knuckle Finger Typing Movements
      if (p > 0.52 && p < 0.86) {
        const typeTick = frameTicker * 0.25;
        leftHandData.fingerList.forEach((f, idx) => {
          f.position.y = Math.sin(typeTick + idx * 1.5) * 0.008;
        });
        rightHandData.fingerList.forEach((f, idx) => {
          f.position.y = Math.cos(typeTick + idx * 1.5) * 0.008;
        });
      }

      // Floating Cubes Orbit
      const cubeOpacity = THREE.MathUtils.clamp((p - 0.6) / 0.2, 0, 1);
      floatCubes.forEach(({ mesh, speed }, idx) => {
        mesh.material.opacity = cubeOpacity * 0.85;
        mesh.rotation.x += 0.008 * speed;
        mesh.rotation.y += 0.012 * speed;
        mesh.position.y += Math.sin(frameTicker * 0.02 * speed + idx) * 0.0025;
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

  const p = Math.max(0, Math.min(1.12, progress));

  // Sector chapters
  let sceneIndex = '01';
  let sceneTag = 'SECTOR 01 // ARRIVAL & PACKAGING DISASSEMBLY';
  let sceneSub = 'UNSEAL MATTE COMPOSITE ENCLOSURE';

  if (p >= 0.28 && p < 0.58) {
    sceneIndex = '02';
    sceneTag = 'SECTOR 02 // CRT TERMINAL BOOT & PHOSPHOR LINK';
    sceneSub = 'OLED 500 NITS CALIBRATION INITIATED';
  } else if (p >= 0.58 && p < 0.82) {
    sceneIndex = '03';
    sceneTag = 'SECTOR 03 // MACRODATA REFINEMENT & ACTIVE FLOW';
    sceneSub = 'SORTING SCARY NUMBERS // FROLIC COEFFICIENT MAX';
  } else if (p >= 0.82) {
    sceneIndex = '04';
    sceneTag = 'SECTOR 04 // 100% REFINEMENT COMPLETED';
    sceneSub = 'ALL TEMPERS EQUALIZED // READY FOR PRODUCTION';
  }

  // Curtain lift only triggers past 1.05
  const curtainLift = isDismissed ? 100 : Math.max(0, (p - 1.04) / 0.08) * 100;
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

      {/* QUICK SEVERANCE ENGINE LOADING HUD */}
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
            { id: 3, label: '03 REFINE', val: 0.72 },
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
                {Math.min(100, Math.round(p / 0.85 * 100))}%
              </div>
              <div className="font-tech" style={{ fontSize: '0.58rem', color: '#64748b', letterSpacing: '1px' }}>
                SCROLL TO REFINE
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
