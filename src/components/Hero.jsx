import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { ArrowDown, Cpu } from 'lucide-react';

export default function Hero({ config, onExploreClick, onSecondaryClick }) {
  const c = config || {};
  if (c.active === false) return null;

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Animation Progress: 0.0 to 1.0 (Scrubbed by scroll gestures)
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Momentum scrubbing refs
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

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.0011;
      targetProgressRef.current = Math.max(0, Math.min(1.05, targetProgressRef.current + delta));
    };

    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const diffY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;

      if (e.cancelable) e.preventDefault();
      const delta = diffY * 0.0025;
      targetProgressRef.current = Math.max(0, Math.min(1.05, targetProgressRef.current + delta));
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        targetProgressRef.current = Math.min(1.05, targetProgressRef.current + 0.1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        targetProgressRef.current = Math.max(0, targetProgressRef.current - 0.1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
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

  const handleSkip = () => {
    targetProgressRef.current = 1.05;
    currentProgressRef.current = 1.0;
    setProgress(1.0);
    setIsDismissed(true);
    document.body.style.overflow = '';
    setTimeout(() => {
      setIsMounted(false);
      const el = document.getElementById('shopping-center') || document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  };

  const handleJumpToScene = (val) => {
    targetProgressRef.current = val;
  };

  // 2. THREE.JS 3D SEVERANCE-STYLE SCENE
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // --- Scene & Renderer ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c10); // Eerie Lumon Seafoam Obsidian
    scene.fog = new THREE.FogExp2(0x060c10, 0.08);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.5);

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
    renderer.toneMappingExposure = 1.15;

    // --- Offscreen Canvas for Dynamic CRT Macrodata Refinement Display ---
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 320;
    const screenCtx = screenCanvas.getContext('2d');
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;

    // --- Lights (Severance Sterile Fluorescent + Glowing CRT Phosphor) ---
    const ambientLight = new THREE.AmbientLight(0x18302c, 1.2);
    scene.add(ambientLight);

    // Overhead cold white ceiling panel light
    const ceilingLight = new THREE.DirectionalLight(0xe0f7f5, 1.8);
    ceilingLight.position.set(0, 7, 2);
    ceilingLight.castShadow = true;
    ceilingLight.shadow.mapSize.width = 1024;
    ceilingLight.shadow.mapSize.height = 1024;
    ceilingLight.shadow.camera.near = 0.5;
    ceilingLight.shadow.camera.far = 15;
    ceilingLight.shadow.bias = -0.001;
    scene.add(ceilingLight);

    // CRT Screen Light Point (glows onto keyboard and actor as screen powers on)
    const crtScreenLight = new THREE.PointLight(0x00ffb4, 0, 4);
    crtScreenLight.position.set(0, 1.45, 0.1);
    scene.add(crtScreenLight);

    // Warm desk lamp accent
    const rimLight = new THREE.PointLight(0x38bdf8, 1.2, 6);
    rimLight.position.set(-3.5, 3, -1);
    scene.add(rimLight);

    // --- Meshes ---
    const group = new THREE.Group();
    scene.add(group);

    // 1. Liminal Floor (Severance Seafoam Green Office Grid Carpet)
    const floorGeo = new THREE.PlaneGeometry(30, 30, 30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0c211e,
      roughness: 0.75,
      metalness: 0.15,
      wireframe: false
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    group.add(floor);

    // Grid wire overlay for retro-futuristic Lumon architecture
    const gridHelper = new THREE.GridHelper(26, 26, 0x00ffb4, 0x123630);
    gridHelper.position.y = 0.005;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    group.add(gridHelper);

    // Overhead Fluorescent Fixtures (Lumon style)
    for (let i = -1; i <= 1; i++) {
      const fixtureGeo = new THREE.BoxGeometry(0.6, 0.1, 4);
      const fixtureMat = new THREE.MeshBasicMaterial({ color: 0xebfffa });
      const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
      fixture.position.set(i * 3.5, 5.2, 0);
      group.add(fixture);
    }

    // 2. The Desk (Severance Minimalist Mid-Century Executive Desk)
    const deskTopGeo = new THREE.BoxGeometry(3.6, 0.12, 1.8);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x132a26, // Lumon deep teal composite
      roughness: 0.35,
      metalness: 0.25
    });
    const deskTop = new THREE.Mesh(deskTopGeo, deskMat);
    deskTop.position.set(0, 1.1, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    group.add(deskTop);

    // Desk Legs (Brushed chrome modernist tubes)
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    [[-1.6, -0.7], [1.6, -0.7], [-1.6, 0.7], [1.6, 0.7]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, 0.55, z);
      leg.castShadow = true;
      group.add(leg);
    });

    // 3. Packaging Box (Severance Precision Lumon Storage Enclosure)
    const boxGroup = new THREE.Group();
    boxGroup.position.set(-0.7, 1.18, 0.2);
    group.add(boxGroup);

    const boxBaseGeo = new THREE.BoxGeometry(1.0, 0.25, 0.8);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x161e24,
      roughness: 0.4,
      metalness: 0.3
    });
    const boxBase = new THREE.Mesh(boxBaseGeo, boxMat);
    boxBase.castShadow = true;
    boxBase.receiveShadow = true;
    boxGroup.add(boxBase);

    // Box Lid (Lifts and opens)
    const boxLidGeo = new THREE.BoxGeometry(1.02, 0.12, 0.82);
    const boxLidMat = new THREE.MeshStandardMaterial({
      color: 0x1f2b34,
      roughness: 0.3,
      metalness: 0.4
    });
    const boxLid = new THREE.Mesh(boxLidGeo, boxLidMat);
    boxLid.position.set(0, 0.15, 0);
    boxLid.castShadow = true;
    boxGroup.add(boxLid);

    // 4. The Laptop (Precision Space-Age Workstation)
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(0, 1.18, 0);
    group.add(laptopGroup);

    // Laptop Base Chassis
    const baseGeo = new THREE.BoxGeometry(1.15, 0.035, 0.8);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2
    });
    const laptopBase = new THREE.Mesh(baseGeo, chassisMat);
    laptopBase.castShadow = true;
    laptopBase.receiveShadow = true;
    laptopGroup.add(laptopBase);

    // Keyboard Deck Inset
    const kbGeo = new THREE.BoxGeometry(0.96, 0.008, 0.42);
    const kbMat = new THREE.MeshStandardMaterial({
      color: 0x080c14,
      roughness: 0.6,
      metalness: 0.3,
      emissive: 0x00e5a3,
      emissiveIntensity: 0.1
    });
    const keyboard = new THREE.Mesh(kbGeo, kbMat);
    keyboard.position.set(0, 0.019, -0.06);
    laptopGroup.add(keyboard);

    // Glass Trackpad
    const padGeo = new THREE.BoxGeometry(0.32, 0.004, 0.22);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2d3a4f, roughness: 0.2, metalness: 0.5 });
    const trackpad = new THREE.Mesh(padGeo, padMat);
    trackpad.position.set(0, 0.019, 0.24);
    laptopGroup.add(trackpad);

    // Screen Hinge Pivot (Allows natural 3D rotation of lid)
    const screenHinge = new THREE.Group();
    screenHinge.position.set(0, 0.02, -0.4);
    laptopGroup.add(screenHinge);

    // Screen Lid Back Shell
    const lidGeo = new THREE.BoxGeometry(1.15, 0.8, 0.025);
    const screenLid = new THREE.Mesh(lidGeo, chassisMat);
    screenLid.position.set(0, 0.4, 0);
    screenLid.castShadow = true;
    screenHinge.add(screenLid);

    // OLED Screen Display Panel (Dynamic Canvas Texture)
    const displayGeo = new THREE.PlaneGeometry(1.1, 0.75);
    const displayMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
      toneMapped: false
    });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0, 0.4, 0.014);
    screenHinge.add(display);

    // Initial state: Lid is closed flat
    screenHinge.rotation.x = Math.PI / 2;

    // 5. The Severance Character (Mark S. / Minimalist Lumon Innie Silhouette)
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, 1.1, 0.85);
    group.add(characterGroup);

    // Tailored Charcoal/Navy Suit Torso
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.8, 16);
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x111b27, roughness: 0.7, metalness: 0.1 });
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.set(0, 0.35, 0);
    torso.castShadow = true;
    characterGroup.add(torso);

    // Lumon Identification Card Lanyard Badge
    const badgeGeo = new THREE.BoxGeometry(0.08, 0.12, 0.01);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0.08, 0.42, 0.22);
    characterGroup.add(badge);

    // Neck & Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.82, 0);
    characterGroup.add(headGroup);

    const neckGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.14, 12);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.5 });
    const neck = new THREE.Mesh(neckGeo, skinMat);
    headGroup.add(neck);

    const headGeo = new THREE.SphereGeometry(0.16, 24, 24);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.18, 0);
    head.scale.set(1, 1.15, 1);
    head.castShadow = true;
    headGroup.add(head);

    // Minimal Hair
    const hairGeo = new THREE.SphereGeometry(0.17, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.22, -0.02);
    headGroup.add(hair);

    // Arms & Hands (Typing position)
    const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.55, 12);
    const leftArm = new THREE.Mesh(armGeo, suitMat);
    leftArm.position.set(-0.28, 0.35, -0.2);
    leftArm.rotation.set(0.7, 0, 0.3);
    characterGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, suitMat);
    rightArm.position.set(0.28, 0.35, -0.2);
    rightArm.rotation.set(0.7, 0, -0.3);
    characterGroup.add(rightArm);

    // Hands resting on keyboard
    const handGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.16, 0.1, -0.5);
    characterGroup.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.16, 0.1, -0.5);
    characterGroup.add(rightHand);

    // 6. Floating Macrodata Refinement 3D Cubes (Oliver Latta / Severance surrealism)
    const cubeGroup = new THREE.Group();
    group.add(cubeGroup);

    const floatCubes = [];
    for (let i = 0; i < 6; i++) {
      const cGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
      const cMat = new THREE.MeshStandardMaterial({
        color: 0x00e5a3,
        emissive: 0x00e5a3,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0
      });
      const mesh = new THREE.Mesh(cGeo, cMat);
      mesh.position.set(
        (Math.random() - 0.5) * 3,
        1.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 2
      );
      cubeGroup.add(mesh);
      floatCubes.push({ mesh, speed: 0.5 + Math.random() });
    }

    // --- Dynamic CRT Canvas Screen Drawing Function (Severance Macrodata Refinement) ---
    let frameTicker = 0;
    const drawSeveranceDisplay = (scrubProgress) => {
      frameTicker++;
      screenCtx.fillStyle = '#061311'; // Lumon CRT phosphor background
      screenCtx.fillRect(0, 0, 512, 320);

      // CRT Scanlines
      screenCtx.fillStyle = 'rgba(0, 229, 163, 0.035)';
      for (let y = 0; y < 320; y += 4) {
        screenCtx.fillRect(0, y, 512, 1.5);
      }

      if (scrubProgress > 0.38) {
        // Lumon Terminal Header
        screenCtx.fillStyle = '#00e5a3';
        screenCtx.font = 'bold 13px monospace';
        screenCtx.fillText('LUMON INDUSTRIES // TECHTINK MDR-04', 24, 32);

        screenCtx.fillStyle = '#5eead4';
        screenCtx.font = '10px monospace';
        screenCtx.fillText('FILE: SIENNA_DATA_STREAM // ACTIVE', 24, 48);
        screenCtx.fillText(`TEMPER: WOE [24%]  DREAD [12%]  FROLIC [98%]`, 24, 62);

        // Macrodata Refinement Number Bins Grid
        const cols = 8;
        const rows = 4;
        const startX = 36;
        const startY = 90;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const numSeed = ((r * cols + c) * 37 + Math.floor(frameTicker / 15)) % 9999;
            const numStr = String(numSeed).padStart(4, '0');
            const isScary = (r + c + Math.floor(frameTicker / 30)) % 5 === 0;

            screenCtx.fillStyle = isScary ? '#ffffff' : '#00e5a3';
            screenCtx.font = isScary ? 'bold 14px monospace' : '12px monospace';

            const jitter = isScary ? Math.sin(frameTicker * 0.2 + r) * 2 : 0;
            screenCtx.fillText(numStr, startX + c * 56, startY + r * 38 + jitter);
          }
        }

        // Refinement Progress Bar
        const barWidth = 464;
        const fillWidth = barWidth * Math.min(1, Math.max(0, (scrubProgress - 0.4) / 0.5));
        screenCtx.fillStyle = '#134e48';
        screenCtx.fillRect(24, 260, barWidth, 14);

        screenCtx.fillStyle = '#00e5a3';
        screenCtx.fillRect(24, 260, fillWidth, 14);

        screenCtx.fillStyle = '#ffffff';
        screenCtx.font = 'bold 10px monospace';
        screenCtx.fillText(`REFINEMENT COMPLETION: ${Math.round(fillWidth / barWidth * 100)}%`, 28, 292);
      }

      screenTexture.needsUpdate = true;
    };

    // --- Main Render Loop (Tied directly to scroll scrubbing progress) ---
    const render = () => {
      // Lerp scrub progress
      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.12;
      const p = currentProgressRef.current;
      setProgress(p);

      // Check if finished
      if (p >= 0.99 && targetProgressRef.current >= 0.99 && !isDismissed) {
        setIsDismissed(true);
        setTimeout(() => {
          setIsMounted(false);
          const el = document.getElementById('shopping-center') || document.getElementById('catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 650);
      }

      // 1. Camera Choreography (Severance cold dolly-in from surveillance to macro)
      const camTargetZ = THREE.MathUtils.lerp(7.5, 3.2, p);
      const camTargetY = THREE.MathUtils.lerp(3.2, 1.6, p);
      const camTargetX = THREE.MathUtils.lerp(0, 0.35, p) + (mouseRef.current.x * 0.3);

      camera.position.x += (camTargetX - camera.position.x) * 0.08;
      camera.position.y += (camTargetY - camera.position.y) * 0.08;
      camera.position.z += (camTargetZ - camera.position.z) * 0.08;

      camera.lookAt(0, 1.25, 0);

      // 2. Stage 1: Unboxing (p: 0.0 -> 0.35)
      // Box lid lifts and box dissolves
      const lidLift = THREE.MathUtils.clamp((p - 0.05) / 0.22, 0, 1);
      boxLid.position.y = 0.15 + (lidLift * 0.45);
      boxLid.rotation.z = lidLift * 0.25;

      const boxFade = THREE.MathUtils.clamp((p - 0.24) / 0.15, 0, 1);
      boxGroup.position.y = 1.18 - (boxFade * 0.6);
      boxBase.material.opacity = 1 - boxFade;
      boxLid.material.opacity = 1 - boxFade;
      boxBase.material.transparent = true;
      boxLid.material.transparent = true;

      // 3. Stage 2: Laptop Positioning & Lid Opening (p: 0.35 -> 0.68)
      // Laptop lifts out of box and settles at center desk
      const laptopSlide = THREE.MathUtils.clamp((p - 0.1) / 0.25, 0, 1);
      laptopGroup.position.x = THREE.MathUtils.lerp(-0.7, 0, laptopSlide);
      laptopGroup.position.z = THREE.MathUtils.lerp(0.2, 0, laptopSlide);

      // Screen Lid opens from flat (Math.PI / 2) to 1.75 rad (100 degrees upright)
      const lidOpen = THREE.MathUtils.clamp((p - 0.32) / 0.28, 0, 1);
      screenHinge.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0.22, lidOpen);

      // CRT Light Ignition
      const crtGlow = THREE.MathUtils.clamp((p - 0.42) / 0.25, 0, 1);
      crtScreenLight.intensity = crtGlow * 3.5;
      crtScreenLight.color.setHex(0x00ffb4);

      // 4. Stage 3: Character Head & Pose (Watching screen open, typing flow)
      const headTurn = THREE.MathUtils.clamp((p - 0.35) / 0.35, 0, 1);
      headGroup.rotation.x = THREE.MathUtils.lerp(-0.15, 0.22, headTurn); // Looks down into screen
      headGroup.rotation.y = THREE.MathUtils.lerp(-0.25, 0, headTurn);

      // Hands subtle rhythmic typing
      if (p > 0.6) {
        const typeTick = frameTicker * 0.18;
        leftHand.position.y = 0.1 + Math.sin(typeTick) * 0.015;
        rightHand.position.y = 0.1 + Math.cos(typeTick) * 0.015;
      }

      // 5. Floating Surreal Refinement Cubes (Oliver Latta / Severance Title style)
      const cubeOpacity = THREE.MathUtils.clamp((p - 0.65) / 0.22, 0, 1);
      floatCubes.forEach(({ mesh, speed }, idx) => {
        mesh.material.opacity = cubeOpacity * 0.85;
        mesh.rotation.x += 0.01 * speed;
        mesh.rotation.y += 0.015 * speed;
        mesh.position.y += Math.sin(frameTicker * 0.02 * speed + idx) * 0.003;
      });

      // Update Dynamic CRT Screen
      drawSeveranceDisplay(p);

      renderer.render(scene, camera);
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
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
    };
  }, []);

  if (!isMounted) return null;

  const p = Math.max(0, Math.min(1, progress));

  // Minimal Severance Swiss Telemetry (NO MARKETING SLOGANS)
  let sceneIndex = '01';
  let sceneTag = 'SECTOR 01 // ARRIVAL & PACKAGING DISASSEMBLY';
  let sceneSub = 'UNSEAL MATTE COMPOSITE ENCLOSURE';

  if (p >= 0.35 && p < 0.68) {
    sceneIndex = '02';
    sceneTag = 'SECTOR 02 // CRT TERMINAL BOOT & PHOSPHOR LINK';
    sceneSub = 'OLED 500 NITS CALIBRATION INITIATED';
  } else if (p >= 0.68) {
    sceneIndex = '03';
    sceneTag = 'SECTOR 03 // MACRODATA REFINEMENT & ACTIVE FLOW';
    sceneSub = 'WHISPER-QUIET THERMAL EQUILIBRIUM ACHIEVED';
  }

  const curtainLift = isDismissed ? 100 : Math.max(0, (p - 0.92) / 0.08) * 100;

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
        background: '#060c10',
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
          zIndex: 1
        }} 
      />

      {/* Cinematic Anamorphic Top & Bottom Letterboxing */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(22px, 3.5vh, 36px)', background: '#020406', zIndex: 30, borderBottom: '1px solid rgba(0, 229, 163, 0.1)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 'clamp(22px, 3.5vh, 36px)', background: '#020406', zIndex: 30, borderTop: '1px solid rgba(0, 229, 163, 0.1)' }} />

      {/* Camera Viewfinder Crosshairs (Severance Surveillance Aesthetic) */}
      <div style={{ position: 'absolute', top: '50px', left: '36px', width: '14px', height: '14px', borderTop: '1px solid rgba(0, 229, 163, 0.4)', borderLeft: '1px solid rgba(0, 229, 163, 0.4)', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', top: '50px', right: '36px', width: '14px', height: '14px', borderTop: '1px solid rgba(0, 229, 163, 0.4)', borderRight: '1px solid rgba(0, 229, 163, 0.4)', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: '50px', left: '36px', width: '14px', height: '14px', borderBottom: '1px solid rgba(0, 229, 163, 0.4)', borderLeft: '1px solid rgba(0, 229, 163, 0.4)', pointerEvents: 'none', zIndex: 20 }} />
      <div style={{ position: 'absolute', bottom: '50px', right: '36px', width: '14px', height: '14px', borderBottom: '1px solid rgba(0, 229, 163, 0.4)', borderRight: '1px solid rgba(0, 229, 163, 0.4)', pointerEvents: 'none', zIndex: 20 }} />

      {/* TOP VIEWFINDER HUD (Swiss Sterile Minimalism) */}
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
            { id: 1, label: '01 UNBOX', val: 0.16 },
            { id: 2, label: '02 BOOT', val: 0.50 },
            { id: 3, label: '03 REFINE', val: 0.80 }
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
            onClick={handleSkip}
            className="font-tech"
            style={{
              background: 'rgba(0, 229, 163, 0.1)',
              border: '1px solid rgba(0, 229, 163, 0.4)',
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
            <span>ENTER STORE [ESC]</span>
            <ArrowDown size={11} />
          </button>
        </div>
      </div>

      {/* BOTTOM TELEMETRY (Severance Quote + Real-time Dial) */}
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

        <div 
          onClick={handleSkip}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div className="font-tech" style={{ fontSize: '0.82rem', fontWeight: 900, color: '#00e5a3', letterSpacing: '1px' }}>
              {Math.round(p * 100)}%
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
                transform: `translateY(${p * 10}px)`,
                boxShadow: '0 0 6px #00e5a3',
                transition: 'transform 0.05s linear'
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
