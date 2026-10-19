import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';
import path from 'node:path';

// Polyfill FileReader for Node.js / Bun environment
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (this.onloadend) this.onloadend();
      });
    }
  };
}

function createLaptopModel() {
  const root = new THREE.Group();
  root.name = 'TechTink_Flagship_Laptop';

  // ── Materials ──
  // Aerospace Titanium / Space Gray Anodized Aluminum
  const chassisMaterial = new THREE.MeshStandardMaterial({
    name: 'Chassis_SpaceGray',
    color: 0x282c35,
    metalness: 0.88,
    roughness: 0.28
  });

  // Matte Dark Plastic / Bezel
  const matteBlackMaterial = new THREE.MeshStandardMaterial({
    name: 'Bezel_MatteBlack',
    color: 0x111317,
    metalness: 0.1,
    roughness: 0.75
  });

  // High-Resolution Display Glass with Subtle Cyber Glow
  const screenMaterial = new THREE.MeshStandardMaterial({
    name: 'OLED_Display',
    color: 0x050c18,
    emissive: 0x0c2744,
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0.2
  });

  // Keyboard Keys (Dark Charcoal with Under-glow)
  const keyMaterial = new THREE.MeshStandardMaterial({
    name: 'Keyboard_Keys',
    color: 0x181a1f,
    roughness: 0.5,
    metalness: 0.2,
    emissive: 0x0369a1,
    emissiveIntensity: 0.12
  });

  // Keyboard Recessed Deck
  const keyWellMaterial = new THREE.MeshStandardMaterial({
    name: 'Keyboard_Well',
    color: 0x1e2128,
    roughness: 0.6,
    metalness: 0.7
  });

  // Precision Glass Touchpad
  const trackpadMaterial = new THREE.MeshStandardMaterial({
    name: 'Glass_Trackpad',
    color: 0x22262e,
    metalness: 0.65,
    roughness: 0.18
  });

  // Shiny Silver / Metal Chamfers & Accents
  const metalAccentMaterial = new THREE.MeshStandardMaterial({
    name: 'Metal_Accents',
    color: 0x94a3b8,
    metalness: 0.98,
    roughness: 0.12
  });

  // Copper Vapor Chamber / Heat Fins
  const copperFinsMaterial = new THREE.MeshStandardMaterial({
    name: 'Copper_Cooling_Fins',
    color: 0xb45309,
    emissive: 0x78350f,
    emissiveIntensity: 0.35,
    metalness: 0.9,
    roughness: 0.3
  });

  // Glowing TechTink Emblem on Lid
  const emblemMaterial = new THREE.MeshStandardMaterial({
    name: 'TechTink_Emblem',
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.0,
    roughness: 0.2,
    metalness: 0.8
  });

  // ── 1. Base Chassis (Bottom Unit) ──
  const baseWidth = 3.6;
  const baseDepth = 2.4;
  const baseHeight = 0.16;

  const baseMesh = new THREE.Mesh(
    new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth),
    chassisMaterial
  );
  baseMesh.name = 'Base_Chassis';
  baseMesh.position.set(0, baseHeight / 2, 0);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  root.add(baseMesh);

  // Recessed Keyboard Well
  const wellWidth = 3.1;
  const wellDepth = 1.35;
  const wellHeight = 0.02;
  const wellMesh = new THREE.Mesh(
    new THREE.BoxGeometry(wellWidth, wellHeight, wellDepth),
    keyWellMaterial
  );
  wellMesh.name = 'Keyboard_Well_Mesh';
  wellMesh.position.set(0, baseHeight + 0.005, -0.32);
  root.add(wellMesh);

  // Individual Key Rows (Function, Number, QWERTY, ASDF, ZXCV, Space)
  const rows = [
    { count: 14, height: 0.11, depth: 0.11, z: -0.84, gap: 0.06 },
    { count: 14, height: 0.15, depth: 0.17, z: -0.66, gap: 0.05 },
    { count: 14, height: 0.15, depth: 0.17, z: -0.45, gap: 0.05 },
    { count: 13, height: 0.15, depth: 0.17, z: -0.24, gap: 0.05 },
    { count: 12, height: 0.15, depth: 0.17, z: -0.03, gap: 0.05 },
    { count: 8,  height: 0.15, depth: 0.19, z:  0.19, gap: 0.06 }
  ];

  rows.forEach((row, rIdx) => {
    const totalRowWidth = wellWidth - 0.16;
    const keyWidth = totalRowWidth / row.count - row.gap;
    for (let c = 0; c < row.count; c++) {
      let kw = keyWidth;
      // Spacebar widen
      if (rIdx === 5 && c === 3) kw = keyWidth * 3.5;
      const x = -totalRowWidth / 2 + c * (keyWidth + row.gap) + kw / 2;
      const key = new THREE.Mesh(
        new THREE.BoxGeometry(kw, 0.025, row.depth),
        keyMaterial
      );
      key.position.set(x, baseHeight + 0.02, row.z);
      root.add(key);
    }
  });

  // Precision Glass Touchpad
  const trackpad = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.015, 0.75),
    trackpadMaterial
  );
  trackpad.name = 'Glass_Touchpad';
  trackpad.position.set(0, baseHeight + 0.008, 0.72);
  root.add(trackpad);

  // Touchpad Silver Border Ring
  const trackpadBorder = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.005, 0.77),
    metalAccentMaterial
  );
  trackpadBorder.position.set(0, baseHeight + 0.006, 0.72);
  root.add(trackpadBorder);

  // ── 2. Hinges ──
  const hingeRadius = 0.055;
  const hingeLength = 0.45;
  const hingeGeom = new THREE.CylinderGeometry(hingeRadius, hingeRadius, hingeLength, 16);
  hingeGeom.rotateZ(Math.PI / 2);

  const leftHinge = new THREE.Mesh(hingeGeom, metalAccentMaterial);
  leftHinge.name = 'Hinge_Left';
  leftHinge.position.set(-1.1, baseHeight + 0.04, -baseDepth / 2 + 0.06);
  root.add(leftHinge);

  const rightHinge = new THREE.Mesh(hingeGeom, metalAccentMaterial);
  rightHinge.name = 'Hinge_Right';
  rightHinge.position.set(1.1, baseHeight + 0.04, -baseDepth / 2 + 0.06);
  root.add(rightHinge);

  // ── 3. Screen Lid (Tilted ~112 degrees from horizontal) ──
  const lidPivot = new THREE.Group();
  lidPivot.name = 'Lid_Pivot';
  lidPivot.position.set(0, baseHeight + 0.04, -baseDepth / 2 + 0.06);
  // Rotate around X axis (~ -68 degrees from vertical = ~112 degrees open)
  lidPivot.rotation.x = -Math.PI * 0.38;
  root.add(lidPivot);

  const lidHeight = baseDepth - 0.08;
  const lidThickness = 0.09;
  const lidWidth = baseWidth;

  // Back of Lid (Space Gray Metal)
  const lidBack = new THREE.Mesh(
    new THREE.BoxGeometry(lidWidth, lidHeight, lidThickness),
    chassisMaterial
  );
  lidBack.name = 'Lid_Back_Cover';
  lidBack.position.set(0, lidHeight / 2, -lidThickness / 2);
  lidPivot.add(lidBack);

  // Glowing TechTink Hexagonal Emblem on Lid
  const emblem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.02, 6),
    emblemMaterial
  );
  emblem.name = 'TechTink_Lid_Logo';
  emblem.rotation.x = Math.PI / 2;
  emblem.position.set(0, lidHeight / 2, -lidThickness - 0.005);
  lidPivot.add(emblem);

  // Front Bezel (Matte Black)
  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(lidWidth - 0.04, lidHeight - 0.04, 0.015),
    matteBlackMaterial
  );
  bezel.name = 'Screen_Bezel';
  bezel.position.set(0, lidHeight / 2, 0.01);
  lidPivot.add(bezel);

  // OLED Display Screen
  const screenWidth = lidWidth - 0.28;
  const screenHeight = lidHeight - 0.32;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(screenWidth, screenHeight),
    screenMaterial
  );
  screen.name = 'OLED_Screen_Panel';
  screen.position.set(0, lidHeight / 2 + 0.04, 0.02);
  lidPivot.add(screen);

  // Webcam Dot
  const webcam = new THREE.Mesh(
    new THREE.CircleGeometry(0.02, 16),
    metalAccentMaterial
  );
  webcam.position.set(0, lidHeight - 0.08, 0.02);
  lidPivot.add(webcam);

  // ── 4. Side Ports & Rear Cooling Vents ──
  // Left Side Ports (Thunderbolt 4 / USB-C slots)
  const usbCGeom = new THREE.BoxGeometry(0.01, 0.035, 0.1);
  const port1 = new THREE.Mesh(usbCGeom, metalAccentMaterial);
  port1.name = 'Port_Thunderbolt_1';
  port1.position.set(-baseWidth / 2 - 0.002, baseHeight / 2, -0.4);
  root.add(port1);

  const port2 = new THREE.Mesh(usbCGeom, metalAccentMaterial);
  port2.name = 'Port_Thunderbolt_2';
  port2.position.set(-baseWidth / 2 - 0.002, baseHeight / 2, -0.2);
  root.add(port2);

  // HDMI Port on Left
  const hdmiPort = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.045, 0.18),
    metalAccentMaterial
  );
  hdmiPort.name = 'Port_HDMI_2_1';
  hdmiPort.position.set(-baseWidth / 2 - 0.002, baseHeight / 2, 0.1);
  root.add(hdmiPort);

  // Right Side Ports (USB-A & Audio Jack)
  const usbAPort = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.05, 0.16),
    metalAccentMaterial
  );
  usbAPort.name = 'Port_USB_A_3_2';
  usbAPort.position.set(baseWidth / 2 + 0.002, baseHeight / 2, -0.3);
  root.add(usbAPort);

  const audioJack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16),
    metalAccentMaterial
  );
  audioJack.rotation.z = Math.PI / 2;
  audioJack.name = 'Port_Audio_Jack';
  audioJack.position.set(baseWidth / 2 + 0.002, baseHeight / 2, 0.2);
  root.add(audioJack);

  // Rear Cooling Exhaust Vents (Dual Copper Fins)
  const leftExhaust = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.06, 0.02),
    copperFinsMaterial
  );
  leftExhaust.name = 'Vapor_Chamber_Exhaust_Left';
  leftExhaust.position.set(-0.95, baseHeight / 2, -baseDepth / 2 - 0.005);
  root.add(leftExhaust);

  const rightExhaust = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.06, 0.02),
    copperFinsMaterial
  );
  rightExhaust.name = 'Vapor_Chamber_Exhaust_Right';
  rightExhaust.position.set(0.95, baseHeight / 2, -baseDepth / 2 - 0.005);
  root.add(rightExhaust);

  // ── 5. Bottom Anti-Slip Feet ──
  const footGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
  const footPositions = [
    [-1.5, -0.01, -0.9],
    [ 1.5, -0.01, -0.9],
    [-1.5, -0.01,  0.9],
    [ 1.5, -0.01,  0.9]
  ];
  footPositions.forEach(([x, y, z], i) => {
    const foot = new THREE.Mesh(footGeom, matteBlackMaterial);
    foot.name = `Anti_Slip_Foot_${i + 1}`;
    foot.position.set(x, y, z);
    root.add(foot);
  });

  return root;
}

async function main() {
  console.log('🚀 Generating precision 3D Flagship Laptop GLB model...');
  const scene = new THREE.Scene();
  const laptop = createLaptopModel();
  scene.add(laptop);

  const exporter = new GLTFExporter();
  const outputPath = path.resolve('public/models/laptop-flagship.glb');

  exporter.parse(
    scene,
    (gltf) => {
      fs.writeFileSync(outputPath, Buffer.from(gltf));
      const stats = fs.statSync(outputPath);
      console.log(`✅ Successfully generated 3D model: ${outputPath}`);
      console.log(`📦 File size: ${(stats.size / 1024).toFixed(1)} KB (Optimized for instant web loading)`);
      try { fs.unlinkSync('public/models/test.glb'); } catch {}
      try { fs.unlinkSync('scripts/test-exporter.js'); } catch {}
    },
    (err) => {
      console.error('❌ Failed to generate GLB:', err);
      process.exit(1);
    },
    { binary: true }
  );
}

main();
