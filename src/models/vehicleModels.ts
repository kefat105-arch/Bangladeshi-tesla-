/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { VehicleStage, VEHICLE_CONFIGS } from '../types/game';
import { textureFactory } from '../graphics/textures';

export interface VehicleMeshBundle {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  rider?: THREE.Group;
  pedals?: THREE.Group;
  crank?: THREE.Mesh;
  steeringBar?: THREE.Mesh | THREE.Group;
  skitchPoint?: THREE.Vector3;
  tailLights?: THREE.Mesh[];
  updateAnimation: (
    time: number,
    speed: number,
    isJumping: boolean,
    isSliding: boolean,
    isSkitching: boolean,
    steerAngle?: number,
  ) => void;
}

// --- High-Quality Stylized Human Character Creator ---
// Anatomical proportions: head, neck, torso, shoulders, upper/lower arms, hands, hips, thighs, shins, feet
export function createHumanCharacter(options: {
  hoodieColor: number;
  pantsColor: number;
  shoeColor: number;
  skinColor?: number;
  hasCap?: boolean;
  isNpc?: boolean;
}): {
  group: THREE.Group;
  leftThigh: THREE.Group;
  rightThigh: THREE.Group;
  leftShin: THREE.Group;
  rightShin: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Group;
} {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: options.skinColor || 0xb47346, // warm South Asian skin tone
    roughness: 0.7,
    metalness: 0.05,
  });
  const clothMat = new THREE.MeshStandardMaterial({
    color: options.hoodieColor,
    roughness: 0.6,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: options.pantsColor,
    roughness: 0.7,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: options.shoeColor,
    roughness: 0.5,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.8,
  });

  // Hips / Pelvis
  const pelvisGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.16, 10);
  const pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
  pelvis.position.y = 0.85;
  group.add(pelvis);

  // Torso (Sculpted chest & waist)
  const torsoGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.42, 10);
  const torso = new THREE.Mesh(torsoGeo, clothMat);
  torso.position.y = 1.12;
  torso.castShadow = true;
  group.add(torso);

  // Jacket / Collar trim
  const collarGeo = new THREE.TorusGeometry(0.11, 0.035, 6, 12);
  collarGeo.rotateX(Math.PI / 2);
  const collar = new THREE.Mesh(collarGeo, clothMat);
  collar.position.y = 1.34;
  group.add(collar);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.y = 1.38;
  group.add(neck);

  // Head
  const head = new THREE.Group();
  head.position.y = 1.52;

  // Cranium
  const craniumGeo = new THREE.SphereGeometry(0.11, 14, 12);
  craniumGeo.scale(1, 1.15, 1.05);
  const cranium = new THREE.Mesh(craniumGeo, skinMat);
  head.add(cranium);

  // Stylized Hair or Cap
  if (options.hasCap) {
    const capGeo = new THREE.SphereGeometry(0.118, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.7);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.04;
    head.add(cap);

    // Visor brim
    const brimGeo = new THREE.BoxGeometry(0.14, 0.015, 0.11);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 0.03, 0.12);
    brim.rotation.x = 0.08;
    head.add(brim);
  } else {
    // Stylized slick hair
    const hairGeo = new THREE.SphereGeometry(0.116, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.6);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.04;
    head.add(hair);
  }

  // Eyes & Facial detail
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 });
  [-0.04, 0.04].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), eyeMat);
    eye.position.set(x, 0.02, 0.1);
    head.add(eye);
  });

  group.add(head);

  // --- Limbs with Proper Articulation (Hip -> Knee -> Ankle / Shoulder -> Elbow -> Hand) ---

  // Left Leg
  const leftThigh = new THREE.Group();
  leftThigh.position.set(0.1, 0.8, 0);
  const thighGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.38, 8);
  const leftThighMesh = new THREE.Mesh(thighGeo, pantsMat);
  leftThighMesh.position.y = -0.19;
  leftThigh.add(leftThighMesh);

  const leftShin = new THREE.Group();
  leftShin.position.set(0, -0.38, 0);
  const shinGeo = new THREE.CylinderGeometry(0.052, 0.045, 0.36, 8);
  const leftShinMesh = new THREE.Mesh(shinGeo, pantsMat);
  leftShinMesh.position.y = -0.18;
  leftShin.add(leftShinMesh);

  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.2), shoeMat);
  leftFoot.position.set(0, -0.36, 0.05);
  leftShin.add(leftFoot);
  leftThigh.add(leftShin);
  group.add(leftThigh);

  // Right Leg
  const rightThigh = new THREE.Group();
  rightThigh.position.set(-0.1, 0.8, 0);
  const rightThighMesh = new THREE.Mesh(thighGeo, pantsMat);
  rightThighMesh.position.y = -0.19;
  rightThigh.add(rightThighMesh);

  const rightShin = new THREE.Group();
  rightShin.position.set(0, -0.38, 0);
  const rightShinMesh = new THREE.Mesh(shinGeo, pantsMat);
  rightShinMesh.position.y = -0.18;
  rightShin.add(rightShinMesh);

  const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.2), shoeMat);
  rightFoot.position.set(0, -0.36, 0.05);
  rightShin.add(rightFoot);
  rightThigh.add(rightShin);
  group.add(rightThigh);

  // Left Arm (Shoulder -> Upper arm -> Forearm -> Hand)
  const leftArm = new THREE.Group();
  leftArm.position.set(0.2, 1.28, 0);
  const upperArmGeo = new THREE.CylinderGeometry(0.05, 0.042, 0.28, 8);
  const leftUpperArm = new THREE.Mesh(upperArmGeo, clothMat);
  leftUpperArm.position.y = -0.14;
  leftArm.add(leftUpperArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.28, 0);
  const forearmGeo = new THREE.CylinderGeometry(0.042, 0.038, 0.26, 8);
  const leftForearmMesh = new THREE.Mesh(forearmGeo, clothMat);
  leftForearmMesh.position.y = -0.13;
  leftForearm.add(leftForearmMesh);

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skinMat);
  leftHand.position.set(0, -0.26, 0.02);
  leftForearm.add(leftHand);
  leftArm.add(leftForearm);
  group.add(leftArm);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(-0.2, 1.28, 0);
  const rightUpperArm = new THREE.Mesh(upperArmGeo, clothMat);
  rightUpperArm.position.y = -0.14;
  rightArm.add(rightUpperArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.28, 0);
  const rightForearmMesh = new THREE.Mesh(forearmGeo, clothMat);
  rightForearmMesh.position.y = -0.13;
  rightForearm.add(rightForearmMesh);

  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skinMat);
  rightHand.position.set(0, -0.26, 0.02);
  rightForearm.add(rightHand);
  rightArm.add(rightForearm);
  group.add(rightArm);

  return {
    group,
    leftThigh,
    rightThigh,
    leftShin,
    rightShin,
    leftArm,
    rightArm,
    torso,
    head,
  };
}

// 1. SKATEBOARD MODEL
export function createSkateboardModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Deck: layered Canadian maple with kicks
  const deckShape = new THREE.Shape();
  const w = 0.24;
  const l = 0.86;
  const r = 0.09;
  deckShape.moveTo(-w / 2 + r, -l / 2);
  deckShape.lineTo(w / 2 - r, -l / 2);
  deckShape.quadraticCurveTo(w / 2, -l / 2, w / 2, -l / 2 + r);
  deckShape.lineTo(w / 2, l / 2 - r);
  deckShape.quadraticCurveTo(w / 2, l / 2, w / 2 - r, l / 2);
  deckShape.lineTo(-w / 2 + r, l / 2);
  deckShape.quadraticCurveTo(-w / 2, l / 2, -w / 2, l / 2 - r);
  deckShape.lineTo(-w / 2, -l / 2 + r);
  deckShape.quadraticCurveTo(-w / 2, -l / 2, -w / 2 + r, -l / 2);

  const deckGeo = new THREE.ExtrudeGeometry(deckShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.006,
    bevelThickness: 0.004,
  });
  deckGeo.rotateX(Math.PI / 2);

  const deckMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
  const deckMesh = new THREE.Mesh(deckGeo, deckMat);
  deckMesh.position.y = 0.09;
  deckMesh.castShadow = true;
  root.add(deckMesh);

  // Under-deck vibrant graphics plate
  const graphicMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.62),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, metalness: 0.2 }),
  );
  graphicMesh.rotation.x = Math.PI / 2;
  graphicMesh.position.y = 0.078;
  root.add(graphicMesh);

  // Trucks and Urethane Wheels (Correct rotation axis along X!)
  const truckMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.85 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
  const wheelGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.036, 12);
  wheelGeo.rotateZ(Math.PI / 2); // Cylinder along X axis, rolls around X!

  [-0.26, 0.26].forEach((z) => {
    const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), truckMat);
    hanger.rotation.z = Math.PI / 2;
    hanger.position.set(0, 0.045, z);
    root.add(hanger);

    [-0.13, 0.13].forEach((x) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, 0.045, z);
      wheel.castShadow = true;
      wheels.push(wheel);
      root.add(wheel);
    });
  });

  // Anatomical Human Skater Character
  const skater = createHumanCharacter({
    hoodieColor: 0x0284c7, // Dhaka Cyan hoodie
    pantsColor: 0x1e3a8a, // Blue denim jeans
    shoeColor: 0xdc2626, // Red sneakers
    hasCap: true,
  });
  skater.group.position.set(0, 0.09, 0);
  skater.group.rotation.y = 0.25; // Skate stance (angled on board)
  root.add(skater.group);

  return {
    root,
    wheels,
    rider: skater.group,
    updateAnimation: (time, speed, isJumping, isSliding, isSkitching, steerAngle = 0) => {
      // Wheel rolling around X axis
      const spin = (speed / 0.038) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));

      // Board lean into steering
      deckMesh.rotation.z = -steerAngle * 0.4;

      if (isSliding) {
        // Crouch slide pose
        skater.group.position.y = -0.15;
        skater.leftThigh.rotation.x = -1.1;
        skater.rightThigh.rotation.x = -1.2;
        skater.leftShin.rotation.x = 1.3;
        skater.rightShin.rotation.x = 1.3;
        skater.torso.rotation.x = 0.5;
      } else if (isJumping) {
        // Ollie trick pose
        skater.group.position.y = 0.15;
        deckMesh.rotation.x = -0.3;
        skater.leftThigh.rotation.x = -0.7;
        skater.rightThigh.rotation.x = 0.2;
        skater.torso.rotation.x = -0.2;
      } else if (isSkitching) {
        // Skitching: holding onto CNG rear bumper
        skater.group.position.y = 0.09;
        deckMesh.rotation.x = 0;
        skater.torso.rotation.x = 0.4;
        skater.rightArm.rotation.x = 1.4;
        skater.rightArm.rotation.z = 0.2;
      } else {
        // Normal pushing & cruising
        skater.group.position.y = 0.09;
        deckMesh.rotation.x = 0;
        skater.torso.rotation.x = 0.05;
        skater.leftThigh.rotation.x = -0.1;
        skater.leftShin.rotation.x = 0.2;

        // Pushing foot kick cycle
        const pushPhase = (time * speed * 0.35) % (Math.PI * 2);
        const pushFactor = Math.sin(pushPhase);
        if (pushFactor > 0) {
          skater.rightThigh.rotation.x = 0.2 - pushFactor * 0.6;
          skater.rightShin.rotation.x = pushFactor * 0.4;
        } else {
          skater.rightThigh.rotation.x = 0.1;
          skater.rightShin.rotation.x = 0.15;
        }
      }
    },
  };
}

// 2. HERO ROADSTER BICYCLE MODEL (DIAGNOSED & FULLY FIXED)
export function createBicycleModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.25, metalness: 0.75 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.15, metalness: 0.95 });
  const blackRubber = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });

  const wheelRadius = 0.38; // 28" roadster wheel

  // Helper to build properly oriented bicycle wheel with rim, tire, spokes, and hub
  // Axis is aligned along X so rolling around X turns wheel naturally forward along Z!
  function buildBicycleWheel(isFront: boolean): THREE.Group {
    const wheelGroup = new THREE.Group();

    // Tire: Torus oriented in YZ plane (rotated on Y by 90 deg so its axle is on X)
    const tireGeo = new THREE.TorusGeometry(wheelRadius, 0.024, 10, 32);
    tireGeo.rotateY(Math.PI / 2); // Aligns tire in YZ plane!
    const tire = new THREE.Mesh(tireGeo, blackRubber);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Chrome Rim
    const rimGeo = new THREE.TorusGeometry(wheelRadius - 0.015, 0.014, 8, 32);
    rimGeo.rotateY(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, chromeMat);
    wheelGroup.add(rim);

    // Central Chrome Hub
    const hubGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.12, 12);
    hubGeo.rotateZ(Math.PI / 2); // Along X
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    wheelGroup.add(hub);

    // Wire Spokes: 16 thin spoke cylinders radiating from hub to rim
    const spokeGeo = new THREE.CylinderGeometry(0.002, 0.002, wheelRadius * 1.95, 4);
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(spokeGeo, chromeMat);
      // Lie in YZ plane and rotate around X
      spoke.rotation.x = (i * Math.PI) / 8;
      wheelGroup.add(spoke);
    }

    wheels.push(tire);
    return wheelGroup;
  }

  // Wheels positions: exact ground alignment at y = wheelRadius
  const frontWheelGroup = buildBicycleWheel(true);
  frontWheelGroup.position.set(0, wheelRadius, 0.65);
  root.add(frontWheelGroup);

  const rearWheelGroup = buildBicycleWheel(false);
  rearWheelGroup.position.set(0, wheelRadius, -0.65);
  root.add(rearWheelGroup);

  // 2. Diamond Steel Frame
  const frameGroup = new THREE.Group();

  // Bottom bracket shell (crank pivot) at (0, 0.28, 0)
  const bbShell = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 10), chromeMat);
  bbShell.rotation.z = Math.PI / 2;
  bbShell.position.set(0, 0.28, 0);
  frameGroup.add(bbShell);

  // Seat tube (from bottom bracket to saddle clamp)
  const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.58, 8), frameMat);
  seatTube.position.set(0, 0.55, -0.08);
  seatTube.rotation.x = 0.25;
  frameGroup.add(seatTube);

  // Top tube (horizontal diamond top)
  const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.68, 8), frameMat);
  topTube.position.set(0, 0.75, 0.22);
  topTube.rotation.x = 1.48;
  frameGroup.add(topTube);

  // Down tube (from bottom bracket to head tube)
  const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 8), frameMat);
  downTube.position.set(0, 0.52, 0.28);
  downTube.rotation.x = -0.85;
  frameGroup.add(downTube);

  // Rear chainstays (connecting rear wheel axle to bottom bracket)
  [-0.05, 0.05].forEach((x) => {
    const chainstay = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.66, 8), frameMat);
    chainstay.position.set(x, 0.33, -0.33);
    chainstay.rotation.x = -1.57;
    frameGroup.add(chainstay);

    const seatstay = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.58, 8), frameMat);
    seatstay.position.set(x, 0.58, -0.38);
    seatstay.rotation.x = -0.58;
    frameGroup.add(seatstay);
  });

  // Front Fork
  const frontFork = new THREE.Group();
  frontFork.position.set(0, wheelRadius, 0.65);
  [-0.045, 0.045].forEach((x) => {
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.55, 8), chromeMat);
    blade.position.set(x, 0.25, -0.05);
    blade.rotation.x = -0.2;
    frontFork.add(blade);
  });

  // Handlebars stem and curved bars
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.28, 8), chromeMat);
  stem.position.set(0, 0.56, -0.11);
  stem.rotation.x = -0.2;
  frontFork.add(stem);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.54, 8), chromeMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 0.7, -0.12);
  frontFork.add(handlebar);

  // Bicycle Bell
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), chromeMat);
  bell.position.set(0.12, 0.72, -0.12);
  frontFork.add(bell);

  // Front Wicker Basket
  const basket = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.18, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }),
  );
  basket.position.set(0, 0.58, 0.06);
  frontFork.add(basket);

  root.add(frontFork);
  root.add(frameGroup);

  // Leather Saddle
  const saddle = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.05, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 }),
  );
  saddle.position.set(0, 0.84, -0.16);
  root.add(saddle);

  // 3. Rotating Crank & Pedals (Crucial for bicycle mechanics!)
  const crankGroup = new THREE.Group();
  crankGroup.position.set(0, 0.28, 0);

  // Chainring gear
  const chainring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.008, 16),
    chromeMat,
  );
  chainring.rotation.z = Math.PI / 2;
  chainring.position.x = 0.05;
  crankGroup.add(chainring);

  // Left & Right Crank arms (180 deg apart)
  const leftCrank = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.14, 0.02), chromeMat);
  leftCrank.position.set(0.06, 0.06, 0);
  crankGroup.add(leftCrank);

  const leftPedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.06), blackRubber);
  leftPedal.position.set(0.09, 0.12, 0);
  crankGroup.add(leftPedal);

  const rightCrank = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.14, 0.02), chromeMat);
  rightCrank.position.set(-0.06, -0.06, 0);
  crankGroup.add(rightCrank);

  const rightPedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.06), blackRubber);
  rightPedal.position.set(-0.09, -0.12, 0);
  crankGroup.add(rightPedal);

  root.add(crankGroup);

  // 4. Stylized Cyclist Character (seated on saddle, hands gripping bars, feet on pedals!)
  const cyclist = createHumanCharacter({
    hoodieColor: 0x15803d, // Green Dhaka polo
    pantsColor: 0x334155, // Slate trousers
    shoeColor: 0x475569, // Grey sneakers
    hasCap: true,
  });

  cyclist.group.position.set(0, 0.18, -0.16); // Seated on saddle
  cyclist.torso.rotation.x = 0.35; // Leaning forward to handlebars

  // Hands placed on handlebars
  cyclist.leftArm.rotation.set(0.85, 0, -0.15);
  cyclist.rightArm.rotation.set(0.85, 0, 0.15);

  root.add(cyclist.group);

  return {
    root,
    wheels,
    rider: cyclist.group,
    pedals: crankGroup,
    steeringBar: frontFork,
    updateAnimation: (time, speed, isJumping, isSliding, _isSkitching, steerAngle = 0) => {
      // Wheel rotation (proper rolling speed matching travel!)
      const spin = (speed / wheelRadius) * 0.016;
      frontWheelGroup.rotation.x += spin;
      rearWheelGroup.rotation.x += spin;

      // Crank arms & chainring rotation
      const crankSpin = speed * 0.24;
      crankGroup.rotation.x += crankSpin;

      // Handlebar steering rotation
      frontFork.rotation.y = THREE.MathUtils.damp(frontFork.rotation.y, steerAngle * 0.35, 12, 0.016);

      // True pedaling kinematics: legs follow the crank rotation smoothly
      const angle = crankGroup.rotation.x;
      cyclist.leftThigh.rotation.x = Math.sin(angle) * 0.45 - 0.2;
      cyclist.leftShin.rotation.x = Math.max(0.1, -Math.sin(angle) * 0.5 + 0.6);

      cyclist.rightThigh.rotation.x = -Math.sin(angle) * 0.45 - 0.2;
      cyclist.rightShin.rotation.x = Math.max(0.1, Math.sin(angle) * 0.5 + 0.6);

      // Body rhythm bobbing
      cyclist.group.position.y = 0.18 + Math.abs(Math.sin(angle)) * 0.02;

      if (isSliding) {
        // Aerodynamic sprint tuck
        cyclist.torso.rotation.x = 0.65;
        cyclist.head.rotation.x = -0.3;
      } else {
        cyclist.torso.rotation.x = 0.35;
        cyclist.head.rotation.x = 0;
      }
    },
  };
}

// 3. SPORT MOTORCYCLE MODEL
export function createMotorcycleModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const fairingMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.65 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.8 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.15, metalness: 0.95 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });

  const wheelRadius = 0.34;

  function buildMotoWheel(): THREE.Group {
    const group = new THREE.Group();
    // Cylinder wheel oriented along X (rolling around X)
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.15, 16),
      tireMat,
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    group.add(tire);

    // Chrome disc brake
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.16, 12),
      chromeMat,
    );
    disc.rotation.z = Math.PI / 2;
    group.add(disc);

    wheels.push(tire);
    return group;
  }

  const frontWheel = buildMotoWheel();
  frontWheel.position.set(0, wheelRadius, 0.82);
  root.add(frontWheel);

  const rearWheel = buildMotoWheel();
  rearWheel.position.set(0, wheelRadius, -0.82);
  root.add(rearWheel);

  // Aerodynamic Sport Fairing & Fuel Tank
  const body = new THREE.Group();
  body.position.set(0, 0.44, 0);

  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.76), fairingMat);
  tank.position.set(0, 0.32, 0.1);
  tank.castShadow = true;
  body.add(tank);

  // Front Cowl & Windshield
  const cowl = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.58, 6), fairingMat);
  cowl.rotation.x = Math.PI / 2;
  cowl.position.set(0, 0.42, 0.72);
  body.add(cowl);

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.22, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, transparent: true, opacity: 0.7 }),
  );
  windshield.position.set(0, 0.62, 0.62);
  windshield.rotation.x = -0.55;
  body.add(windshield);

  // Twin LED Headlights
  [-0.09, 0.09].forEach((x) => {
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.05, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 1 }),
    );
    lamp.position.set(x, 0.42, 0.94);
    body.add(lamp);
  });

  // Engine block & Exhaust
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.54), frameMat);
  engine.position.set(0, 0.02, 0);
  body.add(engine);

  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.72, 8), chromeMat);
  exhaust.position.set(0.24, 0.04, -0.54);
  exhaust.rotation.x = 0.28;
  body.add(exhaust);

  root.add(body);

  // Red Tail Light
  const tailLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.05, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xef4444, emissiveIntensity: 1 }),
  );
  tailLight.position.set(0, 0.72, -0.68);
  root.add(tailLight);

  // Racing Rider in aerodynamic leather suit & helmet
  const racer = createHumanCharacter({
    hoodieColor: 0x18181b, // Black racing leather
    pantsColor: 0x18181b,
    shoeColor: 0xef4444,
    hasCap: false, // will wear helmet
  });

  racer.group.position.set(0, 0.24, -0.05);
  racer.torso.rotation.x = 0.62; // deep crouched tuck
  racer.head.rotation.x = -0.3; // head looking up through visor
  racer.leftArm.rotation.set(0.9, 0, -0.2);
  racer.rightArm.rotation.set(0.9, 0, 0.2);

  // Full-face racing helmet
  const helmetGeo = new THREE.SphereGeometry(0.13, 14, 14);
  helmetGeo.scale(1, 1.08, 1.15);
  const helmet = new THREE.Mesh(
    helmetGeo,
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.6 }),
  );
  helmet.position.set(0, 0.02, 0.02);
  racer.head.add(helmet);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 }),
  );
  visor.position.set(0, 0.02, 0.12);
  racer.head.add(visor);

  root.add(racer.group);

  return {
    root,
    wheels,
    rider: racer.group,
    tailLights: [tailLight],
    updateAnimation: (_time, speed, _isJumping, isSliding, _isSkitching, steerAngle = 0) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));

      // Dynamic banking into turns
      root.rotation.z = -steerAngle * 0.5;

      if (isSliding) {
        // Ultra-low racing draft tuck
        racer.torso.rotation.x = 0.78;
      } else {
        racer.torso.rotation.x = 0.62;
      }
    },
  };
}

// 4. AUTO-RICKSHAW MODEL (WITH DRIVER & REAR SKITCH BAR)
export function createAutoRickshawModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35, metalness: 0.2 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });
  const wheelRadius = 0.32;

  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.16, 14);
  wheelGeo.rotateZ(Math.PI / 2); // Rolling around X

  // Front single wheel
  const frontWheel = new THREE.Mesh(wheelGeo, blackMat);
  frontWheel.position.set(0, wheelRadius, 0.95);
  frontWheel.castShadow = true;
  wheels.push(frontWheel);
  root.add(frontWheel);

  // Rear dual wheels
  [-0.68, 0.68].forEach((x) => {
    const rearWheel = new THREE.Mesh(wheelGeo, blackMat);
    rearWheel.position.set(x, wheelRadius, -0.75);
    rearWheel.castShadow = true;
    wheels.push(rearWheel);
    root.add(rearWheel);
  });

  // Cabin Body & Canopy
  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.04, 0);

  const tub = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 1.8), yellowMat);
  tub.position.set(0, 0.28, -0.15);
  tub.castShadow = true;
  body.add(tub);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.6), yellowMat);
  nose.position.set(0, 0.3, 0.85);
  body.add(nose);

  // Headlight
  const lightGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
  lightGeo.rotateX(Math.PI / 2);
  const headlamp = new THREE.Mesh(
    lightGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 0.9 }),
  );
  headlamp.position.set(0, 0.45, 1.18);
  body.add(headlamp);

  // Black canvas canopy roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.36, 0.1, 1.95),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }),
  );
  roof.position.set(0, 1.48, -0.05);
  body.add(roof);

  // Windshield
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.45, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.55 }),
  );
  windshield.position.set(0, 0.85, 0.72);
  body.add(windshield);

  // Rear Rickshaw Art & SKITCH BAR
  const flap = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.4),
    new THREE.MeshStandardMaterial({ map: textureFactory.getRickshawArtTexture('#eab308'), roughness: 0.4 }),
  );
  flap.position.set(0, 0.3, -1.06);
  flap.rotation.y = Math.PI;
  body.add(flap);

  // Rear Heavy Grab Bar (The Skitch Point!)
  const skitchBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8), chromeMat);
  skitchBar.rotation.z = Math.PI / 2;
  skitchBar.position.set(0, 0.22, -1.12);
  body.add(skitchBar);

  // Steering Tiller / Handlebar inside
  const tiller = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.55, 8), chromeMat);
  tiller.rotation.z = Math.PI / 2;
  tiller.position.set(0, 0.75, 0.45);
  body.add(tiller);

  root.add(body);

  // Animated NPC / Player Driver in traditional Bengali shirt & cap
  const driver = createHumanCharacter({
    hoodieColor: 0x0284c7, // Blue Bengali shirt
    pantsColor: 0x1e293b,
    shoeColor: 0x334155,
    hasCap: true,
  });
  driver.group.position.set(0, 0.38, 0.18);
  driver.leftArm.rotation.set(0.85, 0, -0.15);
  driver.rightArm.rotation.set(0.85, 0, 0.15);
  root.add(driver.group);

  return {
    root,
    wheels,
    rider: driver.group,
    steeringBar: tiller,
    skitchPoint: new THREE.Vector3(0, 0.45, -1.15),
    updateAnimation: (_time, speed, _isJumping, _isSliding, _isSkitching, steerAngle = 0) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));

      // 3-wheel quirk tilt & tiller turn
      root.rotation.z = -steerAngle * 0.18;
      tiller.rotation.y = steerAngle * 0.4;
    },
  };
}

// 5. CNG AUTO-RICKSHAW MODEL (DHAKA ICON WITH WIRE MESH CAGE)
export function createCngModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const greenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35, metalness: 0.3 });
  const yellowRoofMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4, metalness: 0.1 });
  const meshCageMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.5, wireframe: true });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });

  const wheelRadius = 0.33;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.16, 14);
  wheelGeo.rotateZ(Math.PI / 2);

  // Front wheel
  const frontWheel = new THREE.Mesh(wheelGeo, blackMat);
  frontWheel.position.set(0, wheelRadius, 1.0);
  frontWheel.castShadow = true;
  wheels.push(frontWheel);
  root.add(frontWheel);

  // Rear wheels
  [-0.7, 0.7].forEach((x) => {
    const rearWheel = new THREE.Mesh(wheelGeo, blackMat);
    rearWheel.position.set(x, wheelRadius, -0.8);
    rearWheel.castShadow = true;
    wheels.push(rearWheel);
    root.add(rearWheel);
  });

  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.03, 0);

  // Lower green chassis tub
  const tub = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.6, 1.9), greenMat);
  tub.position.set(0, 0.3, -0.1);
  tub.castShadow = true;
  body.add(tub);

  // Aerodynamic nose
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.6, 0.7), greenMat);
  nose.position.set(0, 0.32, 0.95);
  body.add(nose);

  // Curved Yellow Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 2.1), yellowRoofMat);
  roof.position.set(0, 1.55, 0.05);
  body.add(roof);

  // Green Wire Mesh Security Cages
  [-0.68, 0.68].forEach((x) => {
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.85, 1.3), meshCageMat);
    cage.position.set(x, 1.05, -0.15);
    body.add(cage);
  });

  // Spare Tire on Rear
  const spareTire = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.08, 8, 16), blackMat);
  spareTire.position.set(0, 0.5, -1.1);
  body.add(spareTire);

  // Rear Heavy Duty Grab Bar for Skitching!
  const skitchBar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.25, 8), chromeMat);
  skitchBar.rotation.z = Math.PI / 2;
  skitchBar.position.set(0, 0.22, -1.14);
  body.add(skitchBar);

  root.add(body);

  // Stylized Bengali Driver inside CNG
  const driver = createHumanCharacter({
    hoodieColor: 0x0f766e, // Teal Bengali kurta
    pantsColor: 0x1e293b,
    shoeColor: 0x334155,
    hasCap: true,
  });
  driver.group.position.set(0, 0.42, 0.22);
  driver.leftArm.rotation.set(0.85, 0, -0.12);
  driver.rightArm.rotation.set(0.85, 0, 0.12);
  root.add(driver.group);

  return {
    root,
    wheels,
    rider: driver.group,
    skitchPoint: new THREE.Vector3(0, 0.48, -1.18),
    updateAnimation: (_time, speed, _isJumping, _isSliding, _isSkitching, steerAngle = 0) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));
      root.rotation.z = -steerAngle * 0.2;
    },
  };
}

// 6. LOCAL DHAKA TRANSPORT BUS MODEL
export function createBusModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const busBlueMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.2 });
  const busWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.9 });
  const blackRubber = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });

  const wheelRadius = 0.52;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.28, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  // Front wheels
  [-1.08, 1.08].forEach((x) => {
    const wheel = new THREE.Mesh(wheelGeo, blackRubber);
    wheel.position.set(x, wheelRadius, 2.1);
    wheel.castShadow = true;
    wheels.push(wheel);
    root.add(wheel);
  });

  // Rear dual wheels
  [-1.1, -0.85, 0.85, 1.1].forEach((x) => {
    const wheel = new THREE.Mesh(wheelGeo, blackRubber);
    wheel.position.set(x, wheelRadius, -1.9);
    wheel.castShadow = true;
    wheels.push(wheel);
    root.add(wheel);
  });

  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.05, 0);

  // Lower chassis
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.1, 5.8), busBlueMat);
  lowerBody.position.set(0, 0.55, 0);
  lowerBody.castShadow = true;
  body.add(lowerBody);

  // Upper Passenger Cabin
  const upperBody = new THREE.Mesh(new THREE.BoxGeometry(2.28, 1.3, 5.75), busWhiteMat);
  upperBody.position.set(0, 1.75, 0);
  upperBody.castShadow = true;
  body.add(upperBody);

  // Windows Stripe
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.3 });
  [-1.16, 1.16].forEach((x) => {
    const windows = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.65, 5.2), windowMat);
    windows.position.set(x, 1.75, 0);
    body.add(windows);
  });

  // Front Windshield
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 0.05), windowMat);
  frontGlass.position.set(0, 1.85, 2.88);
  body.add(frontGlass);

  // Destination Board ("ঢাকা এক্সপ্রেস")
  const destMat = new THREE.MeshStandardMaterial({
    map: textureFactory.getBusDestinationTexture('ঢাকা এক্সপ্রেস', 'মিরপুর ⇄ মতিঝিল ⇄ সায়েদাবাদ'),
    roughness: 0.3,
  });
  const destBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.42), destMat);
  destBoard.position.set(0, 2.58, 2.89);
  body.add(destBoard);

  // Dual Rooftop Pneumatic Air Horns
  [-0.45, 0.45].forEach((x) => {
    const hornGeo = new THREE.ConeGeometry(0.1, 0.45, 8);
    hornGeo.rotateX(-Math.PI / 2);
    const horn = new THREE.Mesh(hornGeo, chromeMat);
    horn.position.set(x, 2.52, 2.4);
    body.add(horn);
  });

  // Steering Wheel inside Bus Cabin
  const steerWheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.024, 6, 16), blackRubber);
  steerWheel.position.set(-0.6, 1.5, 2.1);
  steerWheel.rotation.x = 0.65;
  body.add(steerWheel);

  root.add(body);

  // Driver seated at bus steering wheel
  const busDriver = createHumanCharacter({
    hoodieColor: 0x1e3a8a,
    pantsColor: 0x0f172a,
    shoeColor: 0x334155,
    hasCap: true,
  });
  busDriver.group.position.set(-0.6, 0.95, 1.7);
  busDriver.torso.rotation.x = 0.2;
  busDriver.leftArm.rotation.set(0.9, 0, 0.1);
  busDriver.rightArm.rotation.set(0.9, 0, -0.1);
  root.add(busDriver.group);

  return {
    root,
    wheels,
    rider: busDriver.group,
    steeringBar: steerWheel,
    updateAnimation: (_time, speed, _isJumping, _isSliding, _isSkitching, steerAngle = 0) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));

      // Turning steering wheel
      steerWheel.rotation.z = -steerAngle * 1.5;
      root.rotation.z = -steerAngle * 0.08;
    },
  };
}

// 7. PEDESTRIAN MODEL (WALKING ALONG SIDEWALKS & REACTING TO TRAFFIC)
export function createPedestrianModel(): {
  group: THREE.Group;
  updateAnimation: (time: number, isNearTraffic: boolean) => void;
} {
  const shirts = [0xef4444, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x06b6d4];
  const char = createHumanCharacter({
    hoodieColor: shirts[Math.floor(Math.random() * shirts.length)],
    pantsColor: 0x334155,
    shoeColor: 0x18181b,
    hasCap: Math.random() > 0.5,
    isNpc: true,
  });

  return {
    group: char.group,
    updateAnimation: (time, isNearTraffic) => {
      if (isNearTraffic) {
        // Step back / pause walking
        char.leftThigh.rotation.x = 0;
        char.rightThigh.rotation.x = 0;
        char.torso.rotation.x = -0.15; // startled backward lean
      } else {
        // Walking cycle
        const walkCycle = time * 3.5;
        char.leftThigh.rotation.x = Math.sin(walkCycle) * 0.5;
        char.rightThigh.rotation.x = -Math.sin(walkCycle) * 0.5;
        char.leftArm.rotation.x = -Math.sin(walkCycle) * 0.4;
        char.rightArm.rotation.x = Math.sin(walkCycle) * 0.4;
        char.torso.rotation.x = 0.05;
      }
    },
  };
}

// 8. 3D COLLECTIBLE VEHICLE PICKUP MESH
export function createVehiclePickupMesh(targetVehicle: VehicleStage): THREE.Group {
  const group = new THREE.Group();

  // Glowing beacon ring pedestal
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });

  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.06, 8, 32), ringMat);
  ring1.rotation.x = Math.PI / 2;
  group.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 8, 24), ringMat);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.y = 0.25;
  group.add(ring2);

  // Vertical Hologram Pillar Beacon
  const auraGeo = new THREE.CylinderGeometry(1.2, 1.2, 4.0, 16, 1, true);
  const auraMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  const aura = new THREE.Mesh(auraGeo, auraMat);
  aura.position.y = 2.0;
  group.add(aura);

  // Miniature rotating preview replica of next vehicle!
  let previewModel: THREE.Group;
  if (targetVehicle === 'bicycle') {
    previewModel = createBicycleModel().root;
    previewModel.scale.set(0.75, 0.75, 0.75);
  } else if (targetVehicle === 'motorcycle') {
    previewModel = createMotorcycleModel().root;
    previewModel.scale.set(0.68, 0.68, 0.68);
  } else if (targetVehicle === 'autorickshaw') {
    previewModel = createAutoRickshawModel().root;
    previewModel.scale.set(0.55, 0.55, 0.55);
  } else if (targetVehicle === 'cng') {
    previewModel = createCngModel().root;
    previewModel.scale.set(0.55, 0.55, 0.55);
  } else if (targetVehicle === 'bus') {
    previewModel = createBusModel().root;
    previewModel.scale.set(0.35, 0.35, 0.35);
  } else {
    previewModel = createSkateboardModel().root;
    previewModel.scale.set(0.95, 0.95, 0.95);
  }

  previewModel.position.set(0, 0.85, 0);
  previewModel.name = 'preview_vehicle';
  group.add(previewModel);

  // Floating Bengali & English Signboard Banner
  const config = VEHICLE_CONFIGS[targetVehicle];
  const bannerMat = new THREE.MeshStandardMaterial({
    map: textureFactory.getSignboardTexture(
      `পরবর্তী বাহন: ${config.bengaliName}`,
      `NEXT: ${config.name.toUpperCase()} (COLLECT TO UPGRADE)`,
      '#0284c7',
      '#ffffff',
    ),
    roughness: 0.2,
    emissive: 0x0369a1,
    emissiveIntensity: 0.5,
  });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.65), bannerMat);
  banner.position.set(0, 2.6, 0);
  banner.name = 'preview_banner';
  group.add(banner);

  const bannerBack = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.65), bannerMat);
  bannerBack.position.set(0, 2.6, 0);
  bannerBack.rotation.y = Math.PI;
  group.add(bannerBack);

  return group;
}

// 9. BENGALI CARGO TRUCK MODEL ("খোদা ভরসা" BEDFORD TRUCK)
export function createTruckModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const truckMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.3 });
  const woodBedMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.85 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });
  const wheelRadius = 0.48;

  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.24, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  // Front wheels
  [-1.02, 1.02].forEach((x) => {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(x, wheelRadius, 1.8);
    wheel.castShadow = true;
    wheels.push(wheel);
    root.add(wheel);
  });

  // Dual Rear wheels
  [-1.05, -0.82, 0.82, 1.05].forEach((x) => {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(x, wheelRadius, -1.6);
    wheel.castShadow = true;
    wheels.push(wheel);
    root.add(wheel);
  });

  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.05, 0);

  // Cab (Front driver compartment)
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.5, 1.8), truckMat);
  cab.position.set(0, 0.8, 1.3);
  cab.castShadow = true;
  body.add(cab);

  // Front chrome grill & bumper
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.25), chromeMat);
  bumper.position.set(0, 0.25, 2.25);
  body.add(bumper);

  // Bengali Truck Art Front Banner ("খোদা ভরসা")
  const frontArt = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.4),
    new THREE.MeshStandardMaterial({
      map: textureFactory.getSignboardTexture('খোদা ভরসা', 'MAA-ER DOYA TRUCK', '#b91c1c', '#ffffff'),
    }),
  );
  frontArt.position.set(0, 1.45, 2.22);
  body.add(frontArt);

  // Windshield
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.6, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 }),
  );
  windshield.position.set(0, 1.0, 2.21);
  body.add(windshield);

  // Wooden Cargo Bed with ornate side panels
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 3.8), woodBedMat);
  bed.position.set(0, 0.7, -1.4);
  bed.castShadow = true;
  body.add(bed);

  // Cargo tarpaulin sacks inside bed
  const cargoMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
  const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 3.5), cargoMat);
  cargo.position.set(0, 1.3, -1.4);
  body.add(cargo);

  root.add(body);

  // Driver inside truck cab
  const driver = createHumanCharacter({
    hoodieColor: 0x15803d,
    pantsColor: 0x1e293b,
    shoeColor: 0x334155,
    hasCap: true,
  });
  driver.group.position.set(-0.5, 0.5, 1.2);
  root.add(driver.group);

  return {
    root,
    wheels,
    rider: driver.group,
    updateAnimation: (_time, speed) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));
    },
  };
}

// 10. YELLOW-TOP DHAKA TAXI / SEDAN CAR
export function createCarModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.4 });
  const yellowRoofMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.5 });
  const wheelRadius = 0.32;

  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.18, 14);
  wheelGeo.rotateZ(Math.PI / 2);

  // 4 Wheels
  [-0.82, 0.82].forEach((x) => {
    [1.3, -1.3].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(x, wheelRadius, z);
      wheel.castShadow = true;
      wheels.push(wheel);
      root.add(wheel);
    });
  });

  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.04, 0);

  // Lower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 3.8), bodyMat);
  chassis.position.set(0, 0.28, 0);
  chassis.castShadow = true;
  body.add(chassis);

  // Cabin with Yellow Roof (Classic Dhaka Yellow-Top Taxi)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.0), yellowRoofMat);
  cabin.position.set(0, 0.78, -0.2);
  cabin.castShadow = true;
  body.add(cabin);

  // Windshield & Rear glass
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.04), glassMat);
  frontGlass.position.set(0, 0.75, 0.82);
  frontGlass.rotation.x = -0.45;
  body.add(frontGlass);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.04), glassMat);
  rearGlass.position.set(0, 0.75, -1.22);
  rearGlass.rotation.x = 0.45;
  body.add(rearGlass);

  // Headlights
  [-0.6, 0.6].forEach((x) => {
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.1, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 1 }),
    );
    lamp.position.set(x, 0.35, 1.92);
    body.add(lamp);
  });

  root.add(body);

  // Driver inside sedan
  const driver = createHumanCharacter({
    hoodieColor: 0x0284c7,
    pantsColor: 0x1e293b,
    shoeColor: 0x334155,
    hasCap: true,
  });
  driver.group.position.set(-0.35, 0.3, -0.1);
  root.add(driver.group);

  return {
    root,
    wheels,
    rider: driver.group,
    updateAnimation: (_time, speed) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));
    },
  };
}

// 11. DHAKA MINIBUS / LEGUNA / HUMAN-HAULER
export function createMinibusModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35 });
  const yellowStripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });
  const wheelRadius = 0.36;

  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.2, 14);
  wheelGeo.rotateZ(Math.PI / 2);

  [-0.9, 0.9].forEach((x) => {
    [1.4, -1.4].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(x, wheelRadius, z);
      wheel.castShadow = true;
      wheels.push(wheel);
      root.add(wheel);
    });
  });

  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.05, 0);

  // Main high-roof van body
  const van = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.45, 4.4), bodyMat);
  van.position.set(0, 0.75, 0);
  van.castShadow = true;
  body.add(van);

  // Yellow stripe along sides
  [-0.94, 0.94].forEach((x) => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 4.3), yellowStripeMat);
    stripe.position.set(x, 0.75, 0);
    body.add(stripe);
  });

  // Destination board on roof
  const destBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.35),
    new THREE.MeshStandardMaterial({
      map: textureFactory.getSignboardTexture('লেগুনা সার্ভিস', 'FARM GATE ⇄ MOHAKHALI', '#065f46', '#ffffff'),
    }),
  );
  destBoard.position.set(0, 1.65, 2.21);
  body.add(destBoard);

  root.add(body);

  // Driver
  const driver = createHumanCharacter({
    hoodieColor: 0x047857,
    pantsColor: 0x1e293b,
    shoeColor: 0x334155,
    hasCap: true,
  });
  driver.group.position.set(-0.45, 0.45, 1.2);
  root.add(driver.group);

  return {
    root,
    wheels,
    rider: driver.group,
    updateAnimation: (_time, speed) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));
    },
  };
}

