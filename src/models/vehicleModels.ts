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
  isSeated?: boolean;
  isSkater?: boolean;
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

  // Apply seating posture for drivers / riders
  if (options.isSeated) {
    // Correct forward-seated posture: thighs bent forward, shins bent down, arms reaching forward to wheel
    leftThigh.rotation.x = -1.42;
    rightThigh.rotation.x = -1.42;
    leftShin.rotation.x = 1.42;
    rightShin.rotation.x = 1.42;
    torso.rotation.x = 0.15;
    head.rotation.x = -0.08;
    // Reaching forward towards steering wheel / handlebars
    leftArm.rotation.set(-0.95, 0, -0.15);
    rightArm.rotation.set(-0.95, 0, 0.15);
    leftForearm.rotation.x = -0.3;
    rightForearm.rotation.x = -0.3;
  } else if (options.isSkater) {
    leftThigh.rotation.x = -0.2;
    rightThigh.rotation.x = -0.1;
    leftShin.rotation.x = 0.25;
    rightShin.rotation.x = 0.15;
    leftArm.rotation.set(-0.2, 0, -0.45);
    rightArm.rotation.set(-0.2, 0, 0.45);
  }

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
    isSeated: true,
  });

  cyclist.group.position.set(0, 0.18, -0.16); // Seated on saddle
  cyclist.torso.rotation.x = 0.35; // Leaning forward to handlebars

  // Hands placed forward on handlebars
  cyclist.leftArm.rotation.set(-0.95, 0, -0.15);
  cyclist.rightArm.rotation.set(-0.95, 0, 0.15);

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
    isSeated: true,
  });

  racer.group.position.set(0, 0.24, -0.05);
  racer.torso.rotation.x = 0.62; // deep crouched tuck
  racer.head.rotation.x = -0.3; // head looking up through visor
  racer.leftArm.rotation.set(-1.05, 0, -0.2);
  racer.rightArm.rotation.set(-1.05, 0, 0.2);

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
    isSeated: true,
  });
  driver.group.position.set(0, 0.55, 0.18);
  driver.leftArm.rotation.set(-0.95, 0, -0.15);
  driver.rightArm.rotation.set(-0.95, 0, 0.15);
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
    isSeated: true,
  });
  driver.group.position.set(0, 0.58, 0.22);
  driver.leftArm.rotation.set(-0.95, 0, -0.12);
  driver.rightArm.rotation.set(-0.95, 0, 0.12);
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
    isSeated: true,
  });
  busDriver.group.position.set(-0.6, 1.25, 1.7);
  busDriver.torso.rotation.x = 0.15;
  busDriver.leftArm.rotation.set(-0.95, 0, -0.12);
  busDriver.rightArm.rotation.set(-0.95, 0, 0.12);
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
    isSeated: true,
  });
  driver.group.position.set(-0.35, 0.48, -0.1);
  driver.leftArm.rotation.set(-0.95, 0, -0.12);
  driver.rightArm.rotation.set(-0.95, 0, 0.12);
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
    isSeated: true,
  });
  driver.group.position.set(-0.45, 0.72, 1.2);
  driver.leftArm.rotation.set(-0.95, 0, -0.12);
  driver.rightArm.rotation.set(-0.95, 0, 0.12);
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

export const createSportsMotorcycleModel = createMotorcycleModel;

// 12. STANDARD COMMUTER MOTORCYCLE (BAJAJ PULSAR 150CC STYLE)
export function createStandardMotorcycleModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const bluePaint = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.25, metalness: 0.6 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.7 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.15, metalness: 0.95 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });

  const wheelRadius = 0.35;

  function buildCommuterWheel(): THREE.Group {
    const group = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.14, 16), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    group.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, 0.15, 12), chromeMat);
    rim.rotation.z = Math.PI / 2;
    group.add(rim);

    wheels.push(tire);
    return group;
  }

  const frontWheel = buildCommuterWheel();
  frontWheel.position.set(0, wheelRadius, 0.85);
  root.add(frontWheel);

  const rearWheel = buildCommuterWheel();
  rearWheel.position.set(0, wheelRadius, -0.85);
  root.add(rearWheel);

  const body = new THREE.Group();
  body.position.set(0, 0.45, 0);

  // Muscular Tear-drop Fuel Tank
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.38, 0.8), bluePaint);
  tank.position.set(0, 0.36, 0.15);
  tank.castShadow = true;
  body.add(tank);

  // Engine Block with cooling fins
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.45), chromeMat);
  engine.position.set(0, 0.05, 0.1);
  body.add(engine);

  // Chrome Exhaust Silencer
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 1.25, 10), chromeMat);
  exhaust.rotation.x = Math.PI / 2 + 0.15;
  exhaust.position.set(0.24, 0.08, -0.45);
  body.add(exhaust);

  // Comfortable Long Commuter Two-Up Saddle
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.14, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85 }),
  );
  seat.position.set(0, 0.35, -0.42);
  body.add(seat);

  // Chrome Passenger Grab Rail
  const grabRail = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 8), chromeMat);
  grabRail.rotation.z = Math.PI / 2;
  grabRail.position.set(0, 0.44, -0.85);
  body.add(grabRail);

  // Front Telescopic Fork & Upright Handlebars
  const frontFork = new THREE.Group();
  frontFork.position.set(0, 0, 0.85);

  [-0.14, 0.14].forEach((x) => {
    const stanchion = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.72, 8), chromeMat);
    stanchion.position.set(x, 0.32, -0.1);
    stanchion.rotation.x = -0.22;
    frontFork.add(stanchion);

    // Rearview mirrors
    const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), chromeMat);
    mirrorStem.position.set(x * 1.8, 0.82, -0.15);
    mirrorStem.rotation.z = x > 0 ? -0.25 : 0.25;
    frontFork.add(mirrorStem);

    const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.015), chromeMat);
    mirrorHead.position.set(x * 1.95, 0.9, -0.15);
    frontFork.add(mirrorHead);
  });

  const handlebars = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.68, 8), chromeMat);
  handlebars.rotation.z = Math.PI / 2;
  handlebars.position.set(0, 0.72, -0.16);
  frontFork.add(handlebars);

  // Big Round Front Headlamp
  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 1.1 }),
  );
  headlight.position.set(0, 0.52, 0.04);
  frontFork.add(headlight);

  body.add(frontFork);
  root.add(body);

  // Upright Commuter Rider
  const rider = createHumanCharacter({
    hoodieColor: 0x1e40af,
    pantsColor: 0x334155,
    shoeColor: 0x09090b,
    hasCap: true,
    isSeated: true,
  });
  rider.group.position.set(0, 0.44, -0.18);
  rider.torso.rotation.x = 0.18; // Comfortable upright lean
  rider.leftArm.rotation.set(-0.85, 0, -0.12);
  rider.rightArm.rotation.set(-0.85, 0, 0.12);
  root.add(rider.group);

  return {
    root,
    wheels,
    rider: rider.group,
    steeringBar: frontFork,
    updateAnimation: (_time, speed, isJumping, isSliding, _isSkitching, steerAngle = 0) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));
      frontFork.rotation.y = THREE.MathUtils.damp(frontFork.rotation.y, steerAngle * 0.4, 12, 0.016);
      root.rotation.z = -steerAngle * 0.32;
    },
  };
}

// 13. URBAN RETRO SCOOTER (VESPA / ACTIVA STYLE)
export function createScooterModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const pinkBodyMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, metalness: 0.4 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.15, metalness: 0.95 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });
  const wheelRadius = 0.28;

  function buildScooterWheel(): THREE.Group {
    const group = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.14, 16), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    group.add(tire);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 12), chromeMat);
    hub.rotation.z = Math.PI / 2;
    group.add(hub);

    wheels.push(tire);
    return group;
  }

  const frontWheel = buildScooterWheel();
  frontWheel.position.set(0, wheelRadius, 0.72);
  root.add(frontWheel);

  const rearWheel = buildScooterWheel();
  rearWheel.position.set(0, wheelRadius, -0.68);
  root.add(rearWheel);

  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.04, 0);

  // Curved Front Leg Shield
  const legShield = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.06), pinkBodyMat);
  legShield.position.set(0, 0.48, 0.42);
  legShield.rotation.x = -0.15;
  legShield.castShadow = true;
  body.add(legShield);

  // Flat Step-through Floorboard
  const floorboard = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.62), creamMat);
  floorboard.position.set(0, 0.12, 0.05);
  body.add(floorboard);

  // Curved Bulbous Rear Engine Cowl
  const rearCowl = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), pinkBodyMat);
  rearCowl.scale.set(0.9, 0.8, 1.4);
  rearCowl.position.set(0, 0.32, -0.52);
  rearCowl.castShadow = true;
  body.add(rearCowl);

  // Comfortable Seat
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.12, 0.68),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
  );
  seat.position.set(0, 0.52, -0.42);
  body.add(seat);

  // Handlebars Column with Round Vintage Headlight
  const forkGroup = new THREE.Group();
  forkGroup.position.set(0, 0, 0.72);

  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.75, 10), chromeMat);
  column.position.set(0, 0.45, -0.15);
  column.rotation.x = -0.18;
  forkGroup.add(column);

  const bars = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.62, 8), chromeMat);
  bars.rotation.z = Math.PI / 2;
  bars.position.set(0, 0.82, -0.22);
  forkGroup.add(bars);

  const headlight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 1.2 }),
  );
  headlight.rotation.x = Math.PI / 2;
  headlight.position.set(0, 0.82, -0.18);
  forkGroup.add(headlight);

  body.add(forkGroup);
  root.add(body);

  // Stylish Casual Scooter Rider sitting naturally with feet on floorboard
  const rider = createHumanCharacter({
    hoodieColor: 0xdb2777,
    pantsColor: 0x1e293b,
    shoeColor: 0xf8fafc,
    hasCap: false,
    isSeated: true,
  });
  rider.group.position.set(0, 0.45, -0.24);
  rider.torso.rotation.x = 0.08;
  rider.leftArm.rotation.set(-0.85, 0, -0.15);
  rider.rightArm.rotation.set(-0.85, 0, 0.15);
  root.add(rider.group);

  return {
    root,
    wheels,
    rider: rider.group,
    steeringBar: forkGroup,
    updateAnimation: (_time, speed, _isJumping, _isSliding, _isSkitching, steerAngle = 0) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));
      forkGroup.rotation.y = THREE.MathUtils.damp(forkGroup.rotation.y, steerAngle * 0.45, 12, 0.016);
      root.rotation.z = -steerAngle * 0.25;
    },
  };
}

// 14. AERODYNAMIC SUPERCAR / SPORTS CAR
export function createSportsCarModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const carRedMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.18, metalness: 0.75 });
  const blackCarbonMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4, metalness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.65 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.1, metalness: 0.95 });
  const wheelRadius = 0.36;

  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.24, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  [-0.92, 0.92].forEach((x) => {
    [1.4, -1.4].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, blackCarbonMat);
      wheel.position.set(x, wheelRadius, z);
      wheel.castShadow = true;

      // Rim spokes
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.75, wheelRadius * 0.75, 0.25, 10), chromeMat);
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);

      wheels.push(wheel);
      root.add(wheel);
    });
  });

  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.02, 0);

  // Low-slung sharp wedge body
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.48, 4.2), carRedMat);
  chassis.position.set(0, 0.24, 0);
  chassis.castShadow = true;
  body.add(chassis);

  // Sloping Aerodynamic Cockpit
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.48, 2.0), blackCarbonMat);
  cockpit.position.set(0, 0.62, -0.2);
  cockpit.castShadow = true;
  body.add(cockpit);

  // Sleek Glass Windshield & Rear Engine Glass
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.42, 0.04), glassMat);
  windshield.position.set(0, 0.62, 0.8);
  windshield.rotation.x = -0.65;
  body.add(windshield);

  // Carbon-Fiber GT Rear Wing Spoiler
  const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.35), blackCarbonMat);
  spoilerWing.position.set(0, 0.88, -2.05);
  body.add(spoilerWing);

  [-0.65, 0.65].forEach((x) => {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.12), blackCarbonMat);
    strut.position.set(x, 0.72, -2.05);
    body.add(strut);
  });

  // Quad Chrome Exhaust Pipes
  [-0.32, -0.18, 0.18, 0.32].forEach((x) => {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8), chromeMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(x, 0.16, -2.12);
    body.add(tip);
  });

  // Aggressive Angular LED Headlights
  [-0.68, 0.68].forEach((x) => {
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 1.4 }),
    );
    led.position.set(x, 0.32, 2.08);
    body.add(led);
  });

  root.add(body);

  // Driver in racing helmet/hoodie
  const driver = createHumanCharacter({
    hoodieColor: 0x09090b,
    pantsColor: 0x18181b,
    shoeColor: 0xe11d48,
    hasCap: true,
    isSeated: true,
  });
  driver.group.position.set(-0.35, 0.48, -0.15);
  driver.leftArm.rotation.set(-0.95, 0, -0.12);
  driver.rightArm.rotation.set(-0.95, 0, 0.12);
  root.add(driver.group);

  return {
    root,
    wheels,
    rider: driver.group,
    updateAnimation: (_time, speed, _isJumping, _isSliding, _isSkitching, steerAngle = 0) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));
      root.rotation.z = -steerAngle * 0.1;
    },
  };
}

// 15. LAND CRUISER PRADO SUV
export function createSuvModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.3 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.15, metalness: 0.95 });
  const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.5 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });
  const wheelRadius = 0.44;

  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.26, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  [-0.98, 0.98].forEach((x) => {
    [1.55, -1.55].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(x, wheelRadius, z);
      wheel.castShadow = true;

      // Heavy 6-spoke alloy rim
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, 0.27, 8), chromeMat);
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);

      wheels.push(wheel);
      root.add(wheel);
    });
  });

  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.06, 0);

  // Large rugged SUV lower body
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.85, 4.6), whiteMat);
  chassis.position.set(0, 0.48, 0);
  chassis.castShadow = true;
  body.add(chassis);

  // Tall Glasshouse Cabin with Privacy Glass
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.9, 2.9), darkGlassMat);
  cabin.position.set(0, 1.3, -0.3);
  cabin.castShadow = true;
  body.add(cabin);

  // Roof with luggage rails
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.08, 2.95), whiteMat);
  roof.position.set(0, 1.78, -0.3);
  body.add(roof);

  [-0.85, 0.85].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.7, 8), chromeMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(x, 1.84, -0.3);
    body.add(rail);
  });

  // Massive Chrome Waterfall Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 0.12), chromeMat);
  grille.position.set(0, 0.52, 2.34);
  body.add(grille);

  // Rear-Mounted Full Spare Wheel
  const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 16), tireMat);
  spare.rotation.x = Math.PI / 2;
  spare.position.set(0, 0.65, -2.4);
  body.add(spare);

  root.add(body);

  // Driver inside SUV
  const driver = createHumanCharacter({
    hoodieColor: 0x1e293b,
    pantsColor: 0x475569,
    shoeColor: 0x09090b,
    hasCap: true,
  });
  driver.group.position.set(-0.45, 0.55, 0.15);
  root.add(driver.group);

  return {
    root,
    wheels,
    rider: driver.group,
    updateAnimation: (_time, speed, _isJumping, _isSliding, _isSkitching, steerAngle = 0) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));
      root.rotation.z = -steerAngle * 0.12;
    },
  };
}

// 16. EXECUTIVE LUXURY SEDAN (TESLA / MERCEDES STYLE)
export function createLuxuryCarModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const blackGloss = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15, metalness: 0.8 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.95 });
  const panoGlass = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.75 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });
  const wheelRadius = 0.38;

  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.22, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  [-0.92, 0.92].forEach((x) => {
    [1.5, -1.5].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(x, wheelRadius, z);
      wheel.castShadow = true;

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.7, wheelRadius * 0.7, 0.23, 14), chromeMat);
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);

      wheels.push(wheel);
      root.add(wheel);
    });
  });

  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.03, 0);

  // Aerodynamic streamliner saloon body
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.58, 4.8), blackGloss);
  chassis.position.set(0, 0.32, 0);
  chassis.castShadow = true;
  body.add(chassis);

  // Panoramic Glass Roof Canopy
  const glassRoof = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.6, 2.5), panoGlass);
  glassRoof.position.set(0, 0.82, -0.2);
  glassRoof.castShadow = true;
  body.add(glassRoof);

  // Chrome window perimeter beltline
  const beltline = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.04, 2.65), chromeMat);
  beltline.position.set(0, 0.61, -0.2);
  body.add(beltline);

  // Sleek Matrix LED Headlight Strips
  [-0.72, 0.72].forEach((x) => {
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.06, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe0f2fe, emissiveIntensity: 1.5 }),
    );
    lamp.position.set(x, 0.42, 2.38);
    body.add(lamp);
  });

  // Red Continuous LED Taillight Bar
  const tailBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.05, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.6 }),
  );
  tailBar.position.set(0, 0.48, -2.4);
  body.add(tailBar);

  root.add(body);

  // Chauffeur / VIP Driver
  const driver = createHumanCharacter({
    hoodieColor: 0x0284c7,
    pantsColor: 0x0f172a,
    shoeColor: 0x09090b,
    hasCap: true,
  });
  driver.group.position.set(-0.4, 0.35, 0.1);
  root.add(driver.group);

  return {
    root,
    wheels,
    rider: driver.group,
    updateAnimation: (_time, speed, _isJumping, _isSliding, _isSkitching, steerAngle = 0) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));
      root.rotation.z = -steerAngle * 0.12;
    },
  };
}

// 17. 4X4 OFFROAD SAFARI JEEP / CHANDER GARI
export function createJeepModel(): VehicleMeshBundle {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const armyGreen = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.65, metalness: 0.2 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5, metalness: 0.8 });
  const yellowLights = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfacc15, emissiveIntensity: 1.5 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.95 });
  const wheelRadius = 0.46;

  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.28, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  [-0.96, 0.96].forEach((x) => {
    [1.35, -1.35].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(x, wheelRadius, z);
      wheel.castShadow = true;

      // Heavy 5-slot steel wheel rim
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, 0.29, 6), steelMat);
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);

      wheels.push(wheel);
      root.add(wheel);
    });
  });

  const body = new THREE.Group();
  body.position.set(0, wheelRadius + 0.06, 0);

  // Tub Chassis with classic 7-slot vertical grille
  const tub = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.72, 3.8), armyGreen);
  tub.position.set(0, 0.42, 0);
  tub.castShadow = true;
  body.add(tub);

  // Heavy Front Bumper with Winch
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.22, 0.26), steelMat);
  frontBumper.position.set(0, 0.18, 2.02);
  body.add(frontBumper);

  const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12), steelMat);
  winch.rotation.z = Math.PI / 2;
  winch.position.set(0, 0.32, 2.05);
  body.add(winch);

  // Heavy Steel Tubular Roll Cage
  const cagePoles = [
    [-0.85, 1.05, 0.2],
    [0.85, 1.05, 0.2],
    [-0.85, 1.05, -1.4],
    [0.85, 1.05, -1.4],
  ];
  cagePoles.forEach(([x, y, z]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), steelMat);
    pole.position.set(x, y, z);
    body.add(pole);
  });

  // Overhead crossbars
  const topCrossbar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 1.6), steelMat);
  topCrossbar.position.set(0, 1.58, -0.6);
  body.add(topCrossbar);

  // 4 Overhead Fog Lamps on Lightbar
  [-0.55, -0.2, 0.2, 0.55].forEach((x) => {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), yellowLights);
    lamp.position.set(x, 1.68, 0.22);
    body.add(lamp);
  });

  // Raised Air Intake Snorkel
  const snorkel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), steelMat);
  snorkel.position.set(0.92, 1.0, 1.1);
  body.add(snorkel);

  root.add(body);

  // Driver in adventure outfit
  const driver = createHumanCharacter({
    hoodieColor: 0x854d0e,
    pantsColor: 0x1e293b,
    shoeColor: 0x09090b,
    hasCap: true,
  });
  driver.group.position.set(-0.4, 0.45, 0.1);
  root.add(driver.group);

  return {
    root,
    wheels,
    rider: driver.group,
    updateAnimation: (_time, speed, _isJumping, _isSliding, _isSkitching, steerAngle = 0) => {
      const spin = (speed / wheelRadius) * 0.016;
      wheels.forEach((w) => (w.rotation.x += spin));
      root.rotation.z = -steerAngle * 0.15;
    },
  };
}

// 18. CHECKPOINT SAVE GATE / ARCH MODEL
export function createCheckpointGateModel(): THREE.Group {
  const gate = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
  const neonCyanMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const hologramMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.8,
  });

  // Pillars on left and right of road
  [-7.5, 7.5].forEach((x) => {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 7.2, 12), steelMat);
    column.position.set(x, 3.6, 0);
    column.castShadow = true;
    gate.add(column);

    // Glowing Neon Rings on columns
    [1.5, 3.5, 5.5].forEach((y) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.04, 8, 24), neonCyanMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, y, 0);
      gate.add(ring);
    });

    // Vertical neon beam beacon
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 9.0, 8), neonCyanMat);
    beam.position.set(x, 4.5, 0.4);
    gate.add(beam);
  });

  // Overhead Crossbeam Gantry
  const beam = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.85, 1.2), steelMat);
  beam.position.set(0, 6.8, 0);
  gate.add(beam);

  // Glowing Checkpoint Save LED Signboard
  const signMat = new THREE.MeshStandardMaterial({
    map: textureFactory.getSignboardTexture('সেভ চেকপয়েন্ট 💾', 'CHECKPOINT SAVED - AUTO RESPAWN', '#0284c7', '#ffffff'),
    roughness: 0.2,
    emissive: 0x0284c7,
    emissiveIntensity: 0.9,
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.2), signMat);
  sign.position.set(0, 6.8, 0.62);
  gate.add(sign);

  const signBack = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.2), signMat);
  signBack.position.set(0, 6.8, -0.62);
  signBack.rotation.y = Math.PI;
  gate.add(signBack);

  // Hologram Laser Curtain across the road
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 6.2), hologramMat);
  curtain.position.set(0, 3.2, 0);
  gate.add(curtain);

  return gate;
}

// 19. START LINE BANNER / OVERHEAD GANTRY MODEL
export function createStartLineModel(): THREE.Group {
  const gantry = new THREE.Group();

  const trussMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.85 });
  const startBannerMat = new THREE.MeshStandardMaterial({
    map: textureFactory.getSignboardTexture('যাত্রা শুরু 🏁', 'ENDLESS RIDE BANGLADESH — START LINE', '#047857', '#ffffff'),
    roughness: 0.2,
    emissive: 0x047857,
    emissiveIntensity: 0.8,
  });
  const greenLight = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 2.0 });

  // Two side support towers
  [-7.5, 7.5].forEach((x) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.0, 0.8), trussMat);
    tower.position.set(x, 4.0, 0);
    gantry.add(tower);
  });

  // Overhead Gantry Box
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(16.5, 1.1, 1.2), trussMat);
  bridge.position.set(0, 7.5, 0);
  gantry.add(bridge);

  // Starting Line Banner
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 1.35), startBannerMat);
  banner.position.set(0, 7.5, 0.62);
  gantry.add(banner);

  // Green starting countdown lights
  [-1.5, -0.5, 0.5, 1.5].forEach((x) => {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), greenLight);
    lamp.position.set(x, 6.75, 0.65);
    gantry.add(lamp);
  });

  // Checkered Start Line on road surface
  const lineCanvas = document.createElement('canvas');
  lineCanvas.width = 512;
  lineCanvas.height = 64;
  const lctx = lineCanvas.getContext('2d')!;
  const cols = 16;
  const colW = 512 / cols;
  for (let i = 0; i < cols; i++) {
    lctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
    lctx.fillRect(i * colW, 0, colW, 64);
  }
  const lineTex = new THREE.CanvasTexture(lineCanvas);
  lineTex.colorSpace = THREE.SRGBColorSpace;

  const roadLine = new THREE.Mesh(
    new THREE.PlaneGeometry(13.5, 1.2),
    new THREE.MeshStandardMaterial({ map: lineTex, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -1 }),
  );
  roadLine.rotation.x = -Math.PI / 2;
  roadLine.position.set(0, 0.02, 0);
  gantry.add(roadLine);

  return gantry;
}

// 20. FACTORY DISPATCHER FOR ANY VEHICLE STAGE
export function createVehicleBundleForStage(stage: VehicleStage): VehicleMeshBundle {
  switch (stage) {
    case 'skateboard':
      return createSkateboardModel();
    case 'bicycle':
      return createBicycleModel();
    case 'sports_motorcycle':
    case 'motorcycle':
      return createSportsMotorcycleModel();
    case 'standard_motorcycle':
      return createStandardMotorcycleModel();
    case 'scooter':
      return createScooterModel();
    case 'sports_car':
      return createSportsCarModel();
    case 'suv':
      return createSuvModel();
    case 'luxury_car':
      return createLuxuryCarModel();
    case 'jeep':
      return createJeepModel();
    case 'autorickshaw':
      return createAutoRickshawModel();
    case 'cng':
      return createCngModel();
    case 'bus':
    default:
      return createBusModel();
  }
}


