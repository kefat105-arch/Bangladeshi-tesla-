/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BiomeType, BiomeConfig, BIOME_CONFIGS, VehicleStage, VEHICLE_STAGES, VEHICLE_CONFIGS, MinimapEntity } from '../types/game';
import { textureFactory } from '../graphics/textures';
import {
  createVehiclePickupMesh,
  createAutoRickshawModel,
  createCngModel,
  createBusModel,
  createMotorcycleModel,
  createBicycleModel,
  createTruckModel,
  createCarModel,
  createMinibusModel,
  createPedestrianModel,
  VehicleMeshBundle,
} from '../models/vehicleModels';

export const SEGMENT_LENGTH = 50;
export const ROAD_WIDTH = 13;
export const ROAD_LANES = [-4.5, -1.5, 1.5, 4.5];

export interface TrafficEntity {
  mesh: THREE.Group;
  bundle?: VehicleMeshBundle;
  type: 'cng' | 'autorickshaw' | 'bus' | 'truck' | 'car' | 'minibus' | 'bike' | 'bicycle';
  lane: number;
  targetLane: number;
  laneTransition: number;
  x: number;
  z: number;
  speed: number;
  targetSpeed: number;
  length: number;
  width: number;
  height: number;
  canSkitch: boolean;
  skitchPoint?: THREE.Vector3;
  aiState: 'cruising' | 'braking' | 'changing_lane';
  scanTimer: number;
}

export interface PedestrianEntity {
  group: THREE.Group;
  updateAnimation: (time: number, isNearTraffic: boolean) => void;
  x: number;
  z: number;
  walkSpeed: number;
}

export interface CollectibleCoin {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface VehiclePickupEntity {
  mesh: THREE.Group;
  targetVehicle: VehicleStage;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface RoadObstacle {
  mesh: THREE.Group;
  type: 'barrier' | 'pothole' | 'fruit_cart' | 'wire_barrier';
  x: number;
  z: number;
  width: number;
  length: number;
  height: number;
  canDuckUnder?: boolean;
}

export interface SegmentChunk {
  root: THREE.Group;
  index: number;
  zStart: number;
  zEnd: number;
  biome: BiomeType;
  roadMesh: THREE.Mesh;
  groundMesh: THREE.Mesh;
}

export class WorldManager {
  private scene: THREE.Scene;
  private segments: SegmentChunk[] = [];
  private trafficList: TrafficEntity[] = [];
  private pedestriansList: PedestrianEntity[] = [];
  private coinsList: CollectibleCoin[] = [];
  private obstaclesList: RoadObstacle[] = [];
  private activePickup: VehiclePickupEntity | null = null;
  private nextSegmentZ = -50; // Starts behind player (at z = -50) so road is fully visible behind
  private currentSegmentIndex = 0;

  // Biome management
  private lastBiome: BiomeType = 'dhaka_city';
  private biomeRunCount = 0;

  // Reusable materials
  private roadMaterial: THREE.MeshStandardMaterial;
  private curbMaterial: THREE.MeshStandardMaterial;
  private grassMaterial: THREE.MeshStandardMaterial;
  private waterMaterial: THREE.MeshStandardMaterial;
  private cityGroundMaterial: THREE.MeshStandardMaterial;
  private concreteMaterial: THREE.MeshStandardMaterial;
  private brickMaterial: THREE.MeshStandardMaterial;
  private coinGeometry: THREE.CylinderGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: textureFactory.getRoadTexture(),
      roughness: 0.75,
      metalness: 0.1,
    });

    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.6,
    });

    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x166534, // lush green paddy
      roughness: 0.9,
    });

    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.4,
    });

    this.cityGroundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark Dhaka asphalt/pavers
      roughness: 0.85,
    });

    this.concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.7,
    });

    this.brickMaterial = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.8,
    });

    this.coinGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    this.coinGeometry.rotateX(Math.PI / 2);
    this.coinMaterial = new THREE.MeshStandardMaterial({
      map: textureFactory.getCoinTexture(),
      roughness: 0.25,
      metalness: 0.85,
    });

    // Automatically initialize initial world segments right away
    this.initWorld();
  }

  public initWorld() {
    this.clearAll();
    this.nextSegmentZ = -50; // Ensure road exists behind the starting camera!

    // Spawn 10 contiguous segments spanning -50m to +450m ahead
    for (let i = 0; i < 10; i++) {
      this.spawnSegment();
    }
  }

  public clearAll() {
    this.segments.forEach((s) => this.scene.remove(s.root));
    this.segments = [];

    this.trafficList.forEach((t) => this.scene.remove(t.mesh));
    this.trafficList = [];

    this.pedestriansList.forEach((p) => this.scene.remove(p.group));
    this.pedestriansList = [];

    this.coinsList.forEach((c) => this.scene.remove(c.mesh));
    this.coinsList = [];

    this.obstaclesList.forEach((o) => this.scene.remove(o.mesh));
    this.obstaclesList = [];

    if (this.activePickup) {
      this.scene.remove(this.activePickup.mesh);
      this.activePickup = null;
    }

    this.nextSegmentZ = -50;
    this.currentSegmentIndex = 0;
    this.lastBiome = 'dhaka_city';
    this.biomeRunCount = 0;
  }

  private selectNextBiome(): BiomeType {
    const allBiomes: BiomeType[] = [
      'dhaka_city',
      'old_market',
      'flyover',
      'river_bridge',
      'village_highway',
      'industrial_zone',
      'riverside_road',
      'bus_terminal',
    ];

    // Maintain district theme for 3 segments (150m) before transitioning
    if (this.biomeRunCount < 3 && this.currentSegmentIndex > 0) {
      this.biomeRunCount++;
      return this.lastBiome;
    }

    const available = allBiomes.filter((b) => b !== this.lastBiome);
    const chosen = available[Math.floor(Math.random() * available.length)];
    this.lastBiome = chosen;
    this.biomeRunCount = 1;
    return chosen;
  }

  // --- SPAWN CONTIGUOUS PROCEDURAL SEGMENT ---
  private spawnSegment(): SegmentChunk {
    const root = new THREE.Group();
    const zStart = this.nextSegmentZ;
    const zEnd = zStart + SEGMENT_LENGTH;
    const midZ = zStart + SEGMENT_LENGTH / 2;
    const index = this.currentSegmentIndex++;

    const biome = this.selectNextBiome();

    // 1. Solid Flanking Ground Terrain Plane (Extends from X = -100m to +100m)
    // Ensures the player NEVER looks into an empty void or floating space!
    const groundMat =
      biome === 'village_highway'
        ? this.grassMaterial
        : biome === 'river_bridge' || biome === 'riverside_road'
        ? this.waterMaterial
        : this.cityGroundMaterial;

    const groundGeo = new THREE.PlaneGeometry(200, SEGMENT_LENGTH);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.set(0, -0.04, midZ);
    groundMesh.receiveShadow = true;
    root.add(groundMesh);

    // 2. High-Precision Road Surface Plane
    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMaterial);
    roadMesh.position.set(0, 0, midZ);
    roadMesh.receiveShadow = true;
    root.add(roadMesh);

    // 3. Concrete Curbs & Sidewalks (Seamlessly lining both sides)
    [-ROAD_WIDTH / 2 - 0.8, ROAD_WIDTH / 2 + 0.8].forEach((x) => {
      const curbGeo = new THREE.BoxGeometry(1.6, 0.22, SEGMENT_LENGTH);
      const curb = new THREE.Mesh(curbGeo, this.curbMaterial);
      curb.position.set(x, 0.1, midZ);
      curb.receiveShadow = true;
      root.add(curb);
    });

    // 4. Biome Scenery & Architecture
    this.decorateSegmentScenery(root, biome, zStart);

    this.scene.add(root);
    const chunk: SegmentChunk = {
      root,
      index,
      zStart,
      zEnd,
      biome,
      roadMesh,
      groundMesh,
    };
    this.segments.push(chunk);

    // Populate coins, obstacles, traffic AI, and pedestrians (skip start zone)
    if (index > 1) {
      this.populateEntities(chunk);
    }

    this.nextSegmentZ = zEnd;
    return chunk;
  }

  // --- BIOME ENVIRONMENT SCENERY ---
  private decorateSegmentScenery(root: THREE.Group, biome: BiomeType, zStart: number) {
    if (biome === 'dhaka_city') {
      // Tall multi-storey apartments & roadside tea stalls
      [-ROAD_WIDTH / 2 - 8.5, ROAD_WIDTH / 2 + 8.5].forEach((x) => {
        for (let z = zStart + 6; z < zStart + SEGMENT_LENGTH; z += 16) {
          const height = 15 + Math.random() * 12;
          const bMat = new THREE.MeshStandardMaterial({
            map: textureFactory.getBuildingFacadeTexture(Math.random() > 0.5 ? 'modern' : 'old_brick'),
            roughness: 0.65,
          });
          const building = new THREE.Mesh(new THREE.BoxGeometry(10, height, 14), bMat);
          building.position.set(x, height / 2, z);
          building.castShadow = true;
          root.add(building);
        }
      });

      // Streetlights
      [-ROAD_WIDTH / 2 - 1.2, ROAD_WIDTH / 2 + 1.2].forEach((x) => {
        for (let z = zStart + 12; z < zStart + SEGMENT_LENGTH; z += 24) {
          const pole = this.createStreetlight();
          pole.position.set(x, 0, z);
          root.add(pole);
        }
      });

      if (Math.random() > 0.4) {
        const stall = this.createTongerDokan();
        stall.position.set(-ROAD_WIDTH / 2 - 2.8, 0, zStart + 22);
        root.add(stall);
      }
    } else if (biome === 'old_market') {
      // Colonial brick shops and cloth awnings
      [-ROAD_WIDTH / 2 - 3.2, ROAD_WIDTH / 2 + 3.2].forEach((x) => {
        for (let z = zStart + 6; z < zStart + SEGMENT_LENGTH; z += 12) {
          const shop = this.createMarketShop(x < 0);
          shop.position.set(x, 0, z);
          root.add(shop);
        }
      });
    } else if (biome === 'flyover') {
      // Highway guardrails & concrete flyover piers
      [-ROAD_WIDTH / 2 - 0.2, ROAD_WIDTH / 2 + 0.2].forEach((x) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, SEGMENT_LENGTH), this.concreteMaterial);
        rail.position.set(x, 0.55, zStart + SEGMENT_LENGTH / 2);
        root.add(rail);

        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.15, SEGMENT_LENGTH),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }),
        );
        stripe.position.set(x, 1.1, zStart + SEGMENT_LENGTH / 2);
        root.add(stripe);
      });

      const gantry = this.createHighwayGantry('মেয়র হানিফ ফ্লাইওভার', 'MAYOR HANIF FLYOVER • TOLL EXPRESSWAY');
      gantry.position.set(0, 0, zStart + 25);
      root.add(gantry);
    } else if (biome === 'river_bridge') {
      // Blue steel truss arches
      [-ROAD_WIDTH / 2 - 0.4, ROAD_WIDTH / 2 + 0.4].forEach((x) => {
        const archMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.75 });
        const archBeam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, SEGMENT_LENGTH), archMat);
        archBeam.position.set(x, 2.1, zStart + SEGMENT_LENGTH / 2);
        root.add(archBeam);

        for (let z = zStart + 5; z < zStart + SEGMENT_LENGTH; z += 10) {
          const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.8, 6), archMat);
          strut.position.set(x, 2.2, z);
          strut.rotation.z = x > 0 ? 0.3 : -0.3;
          root.add(strut);
        }
      });
    } else if (biome === 'village_highway') {
      // Coconut palms & roadside trees
      [-ROAD_WIDTH / 2 - 3.8, ROAD_WIDTH / 2 + 3.8].forEach((x) => {
        for (let z = zStart + 8; z < zStart + SEGMENT_LENGTH; z += 14) {
          const palm = this.createPalmTree();
          palm.position.set(x + (Math.random() * 2 - 1), 0, z + (Math.random() * 3 - 1.5));
          root.add(palm);
        }
      });
    } else if (biome === 'industrial_zone') {
      // Brick kilns & cargo containers
      [-ROAD_WIDTH / 2 - 7, ROAD_WIDTH / 2 + 7].forEach((x) => {
        for (let z = zStart + 8; z < zStart + SEGMENT_LENGTH; z += 18) {
          const containerColors = [0xef4444, 0x0284c7, 0x16a34a, 0xf59e0b];
          const col = containerColors[Math.floor(Math.random() * containerColors.length)];
          const container = new THREE.Mesh(
            new THREE.BoxGeometry(4.5, 2.6, 7.5),
            new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.5 }),
          );
          container.position.set(x, 1.3, z);
          root.add(container);
        }
      });
    } else if (biome === 'riverside_road') {
      // Nouka boats moored near bank
      const boat = this.createNoukaBoat();
      boat.position.set(-ROAD_WIDTH / 2 - 14, -0.6, zStart + 22);
      root.add(boat);

      for (let z = zStart + 10; z < zStart + SEGMENT_LENGTH; z += 16) {
        const palm = this.createPalmTree();
        palm.position.set(ROAD_WIDTH / 2 + 4, 0, z);
        root.add(palm);
      }
    } else {
      // Bus Terminal
      const gantry = this.createHighwayGantry('সায়েদাবাদ বাস টার্মিনাল', 'SAYEDABAD CENTRAL INTERDISTRICT TERMINAL');
      gantry.position.set(0, 0, zStart + 20);
      root.add(gantry);

      [-ROAD_WIDTH / 2 - 4.5, ROAD_WIDTH / 2 + 4.5].forEach((x) => {
        const depotCanopy = new THREE.Mesh(
          new THREE.BoxGeometry(5.0, 0.2, 24),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 }),
        );
        depotCanopy.position.set(x, 4.2, zStart + 25);
        root.add(depotCanopy);
      });
    }
  }

  private createStreetlight(): THREE.Group {
    const pole = new THREE.Group();
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 6.5, 8), this.concreteMaterial);
    mast.position.y = 3.25;
    pole.add(mast);

    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 1 }),
    );
    lamp.position.set(0, 6.2, 0);
    pole.add(lamp);
    return pole;
  }

  private createTongerDokan(): THREE.Group {
    const stall = new THREE.Group();
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.1, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 }),
    );
    counter.position.y = 0.55;
    stall.add(counter);

    const tinRoof = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.08, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.7 }),
    );
    tinRoof.position.y = 2.3;
    tinRoof.rotation.z = -0.15;
    stall.add(tinRoof);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.5),
      new THREE.MeshStandardMaterial({
        map: textureFactory.getSignboardTexture('টং চা দোকান', 'FRESH CHAI & BISCUITS', '#b91c1c', '#ffffff'),
      }),
    );
    sign.position.set(0, 1.9, 0.9);
    stall.add(sign);
    return stall;
  }

  private createMarketShop(isLeft: boolean): THREE.Group {
    const shop = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.8, 5.8), this.brickMaterial);
    wall.position.y = 1.9;
    shop.add(wall);

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.08, 5.6),
      new THREE.MeshStandardMaterial({ color: isLeft ? 0xf59e0b : 0x06b6d4, roughness: 0.5 }),
    );
    awning.position.set(isLeft ? 1.6 : -1.6, 2.2, 0);
    awning.rotation.z = isLeft ? 0.35 : -0.35;
    shop.add(awning);
    return shop;
  }

  private createHighwayGantry(title: string, sub: string): THREE.Group {
    const gantry = new THREE.Group();
    [-7.5, 7.5].forEach((x) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.8, 8), this.concreteMaterial);
      post.position.set(x, 2.9, 0);
      gantry.add(post);
    });

    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 0.35), this.concreteMaterial);
    crossBeam.position.set(0, 5.6, 0);
    gantry.add(crossBeam);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 1.6),
      new THREE.MeshStandardMaterial({
        map: textureFactory.getSignboardTexture(title, sub, '#065f46', '#ffffff'),
        roughness: 0.3,
      }),
    );
    sign.position.set(0, 4.4, 0.18);
    gantry.add(sign);
    return gantry;
  }

  private createPalmTree(): THREE.Group {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.3, 7.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x573a24, roughness: 0.85 }),
    );
    trunk.position.y = 3.75;
    trunk.rotation.z = 0.06;
    tree.add(trunk);

    const crown = new THREE.Group();
    crown.position.set(0.25, 7.5, 0);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
    for (let i = 0; i < 7; i++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.6, 3.2, 5), leafMat);
      frond.rotation.z = Math.PI / 3;
      frond.rotation.y = (i * Math.PI * 2) / 7;
      crown.add(frond);
    }
    tree.add(crown);
    return tree;
  }

  private createNoukaBoat(): THREE.Group {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.7, 6.5),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 }),
    );
    boat.add(hull);

    const canopy = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 3.5, 8, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9, side: THREE.DoubleSide }),
    );
    canopy.rotation.z = Math.PI / 2;
    canopy.position.y = 0.8;
    boat.add(canopy);
    return boat;
  }

  // --- POPULATE ENTITIES WITH ENHANCED TRAFFIC VARIETY ---
  private populateEntities(chunk: SegmentChunk) {
    const zMid = chunk.zStart + SEGMENT_LENGTH / 2;

    // 1. Coins Arc or Line
    const chosenLane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];
    const isArc = Math.random() > 0.5;

    for (let i = 0; i < 5; i++) {
      const coinZ = chunk.zStart + 10 + i * 5;
      const coinY = isArc ? 0.75 + Math.sin((i / 4) * Math.PI) * 1.4 : 0.75;

      const coinMesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
      coinMesh.position.set(chosenLane, coinY, coinZ);
      this.scene.add(coinMesh);

      this.coinsList.push({
        mesh: coinMesh,
        x: chosenLane,
        y: coinY,
        z: coinZ,
        collected: false,
      });
    }

    // 2. Obstacles
    if (Math.random() > 0.4) {
      const obsLane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];
      if (obsLane !== chosenLane) {
        const obs = this.createObstacle(obsLane, zMid + (Math.random() * 8 - 4));
        this.obstaclesList.push(obs);
      }
    }

    // 3. Traffic Vehicle Spawning (All 8 Bangladeshi vehicle types!)
    if (Math.random() > 0.2) {
      const trafficLane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];
      this.spawnTrafficVehicle(trafficLane, chunk.zStart + 25);
    }

    // 4. Sidewalk Pedestrians
    if (Math.random() > 0.4) {
      const ped = createPedestrianModel();
      const pedSide = Math.random() > 0.5 ? 1 : -1;
      const pedX = pedSide * (ROAD_LANES[3] + 2.0);
      const pedZ = chunk.zStart + 15 + Math.random() * 20;
      ped.group.position.set(pedX, 0, pedZ);
      this.scene.add(ped.group);

      this.pedestriansList.push({
        group: ped.group,
        updateAnimation: ped.updateAnimation,
        x: pedX,
        z: pedZ,
        walkSpeed: (Math.random() * 1.2 + 0.8) * (Math.random() > 0.5 ? 1 : -1),
      });
    }
  }

  private createObstacle(x: number, z: number): RoadObstacle {
    const root = new THREE.Group();
    root.position.set(x, 0, z);

    const typeRoll = Math.random();
    let type: RoadObstacle['type'] = 'barrier';
    let width = 2.2;
    let length = 0.8;
    let height = 1.0;
    let canDuckUnder = false;

    if (typeRoll < 0.45) {
      type = 'barrier';
      width = 2.4;
      height = 1.2;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.9, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 }),
      );
      bar.position.y = 0.6;
      bar.castShadow = true;
      root.add(bar);

      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(2.42, 0.25, 0.22),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }),
      );
      stripe.position.y = 0.6;
      root.add(stripe);
    } else if (typeRoll < 0.75) {
      type = 'wire_barrier';
      canDuckUnder = true;
      height = 2.2;
      width = 2.8;

      const poleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      [-1.3, 1.3].forEach((px) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), poleMat);
        post.position.set(px, 1.1, 0);
        root.add(post);
      });

      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), poleMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 1.6;
      root.add(bar);

      const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 }),
      );
      cloth.position.y = 1.4;
      root.add(cloth);
    } else {
      type = 'fruit_cart';
      width = 1.8;
      height = 1.1;

      const cart = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.6, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x573a24, roughness: 0.8 }),
      );
      cart.position.y = 0.45;
      cart.castShadow = true;
      root.add(cart);

      const fruitMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 });
      for (let i = 0; i < 4; i++) {
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), fruitMat);
        fruit.position.set((i % 2) * 0.45 - 0.22, 0.85, Math.floor(i / 2) * 0.45 - 0.22);
        root.add(fruit);
      }
    }

    this.scene.add(root);
    return { mesh: root, type, x, z, width, length, height, canDuckUnder };
  }

  // --- SPAWN TRAFFIC VEHICLE (8 DIVERSE BANGLADESH VEHICLE TYPES) ---
  private spawnTrafficVehicle(laneX: number, z: number) {
    const types: TrafficEntity['type'][] = [
      'cng',
      'autorickshaw',
      'bus',
      'truck',
      'car',
      'minibus',
      'bike',
      'bicycle',
    ];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    let bundle: VehicleMeshBundle;
    let width = 1.4;
    let length = 2.4;
    let height = 2.0;
    let speed = 11 + Math.random() * 5;
    let canSkitch = false;

    if (chosenType === 'cng') {
      bundle = createCngModel();
      width = 1.5;
      length = 2.6;
      height = 2.1;
      speed = 13 + Math.random() * 5;
      canSkitch = true;
    } else if (chosenType === 'autorickshaw') {
      bundle = createAutoRickshawModel();
      width = 1.45;
      length = 2.5;
      height = 2.0;
      speed = 11 + Math.random() * 4;
      canSkitch = true;
    } else if (chosenType === 'bus') {
      bundle = createBusModel();
      width = 2.4;
      length = 6.2;
      height = 3.2;
      speed = 10 + Math.random() * 4;
    } else if (chosenType === 'truck') {
      bundle = createTruckModel();
      width = 2.2;
      length = 5.8;
      height = 2.8;
      speed = 10 + Math.random() * 4;
    } else if (chosenType === 'car') {
      bundle = createCarModel();
      width = 1.7;
      length = 3.8;
      height = 1.6;
      speed = 15 + Math.random() * 6;
    } else if (chosenType === 'minibus') {
      bundle = createMinibusModel();
      width = 1.85;
      length = 4.4;
      height = 2.2;
      speed = 12 + Math.random() * 5;
    } else if (chosenType === 'bicycle') {
      bundle = createBicycleModel();
      width = 0.95;
      length = 1.8;
      height = 1.75;
      speed = 9 + Math.random() * 3;
    } else {
      bundle = createMotorcycleModel();
      width = 1.05;
      length = 2.0;
      height = 1.65;
      speed = 16 + Math.random() * 6;
    }

    const mesh = bundle.root;
    mesh.position.set(laneX, 0, z);
    this.scene.add(mesh);

    this.trafficList.push({
      mesh,
      bundle,
      type: chosenType,
      lane: laneX,
      targetLane: laneX,
      laneTransition: 0,
      x: laneX,
      z,
      speed,
      targetSpeed: speed,
      length,
      width,
      height,
      canSkitch,
      skitchPoint: bundle.skitchPoint,
      aiState: 'cruising',
      scanTimer: Math.random() * 0.3,
    });
  }

  // --- SPAWN VEHICLE PICKUP ---
  public spawnVehiclePickup(targetVehicle: VehicleStage, currentZ: number): boolean {
    if (this.activePickup) return false;

    const pickupLane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];
    const pickupZ = currentZ + 100;

    const mesh = createVehiclePickupMesh(targetVehicle);
    mesh.position.set(pickupLane, 0, pickupZ);
    this.scene.add(mesh);

    this.activePickup = {
      mesh,
      targetVehicle,
      x: pickupLane,
      y: 0,
      z: pickupZ,
      collected: false,
    };

    return true;
  }

  public getActivePickup(): VehiclePickupEntity | null {
    return this.activePickup;
  }

  public removeActivePickup() {
    if (this.activePickup) {
      this.scene.remove(this.activePickup.mesh);
      this.activePickup = null;
    }
  }

  // Road center is 0 (straight road)
  public getRoadCenterX(_z: number): number {
    return 0;
  }

  public getCurrentBiome(playerZ: number): BiomeConfig {
    for (const seg of this.segments) {
      if (playerZ >= seg.zStart && playerZ <= seg.zEnd) {
        return BIOME_CONFIGS[seg.biome];
      }
    }
    return BIOME_CONFIGS['dhaka_city'];
  }

  // --- PER-FRAME UPDATE ---
  public update(playerZ: number, delta: number, totalTime: number) {
    // 1. Recycle chunks behind player
    const recycleThreshold = playerZ - 60;
    while (this.segments.length > 0 && this.segments[0].zEnd < recycleThreshold) {
      const old = this.segments.shift()!;
      this.scene.remove(old.root);
      this.spawnSegment();
    }

    // 2. Animate Coins
    const coinSpin = totalTime * 3.5;
    for (let i = this.coinsList.length - 1; i >= 0; i--) {
      const coin = this.coinsList[i];
      if (coin.z < recycleThreshold || coin.collected) {
        this.scene.remove(coin.mesh);
        this.coinsList.splice(i, 1);
        continue;
      }
      coin.mesh.rotation.z = coinSpin;
    }

    // 3. Animate Vehicle Pickup
    if (this.activePickup) {
      if (this.activePickup.z < recycleThreshold || this.activePickup.collected) {
        this.removeActivePickup();
      } else {
        const bob = Math.sin(totalTime * 3.0) * 0.25;
        this.activePickup.mesh.position.y = bob;

        const preview = this.activePickup.mesh.getObjectByName('preview_vehicle');
        if (preview) {
          preview.rotation.y = totalTime * 1.6;
        }
      }
    }

    // 4. Update Functioning Traffic AI
    for (let i = this.trafficList.length - 1; i >= 0; i--) {
      const t = this.trafficList[i];

      t.scanTimer += delta;
      if (t.scanTimer > 0.25) {
        t.scanTimer = 0;
        this.updateTrafficAi(t);
      }

      if (t.lane !== t.targetLane) {
        t.laneTransition += delta * 1.6;
        t.x = THREE.MathUtils.lerp(t.lane, t.targetLane, Math.min(1, t.laneTransition));
        if (t.laneTransition >= 1) {
          t.lane = t.targetLane;
          t.laneTransition = 0;
          t.aiState = 'cruising';
        }
      }

      t.speed = THREE.MathUtils.damp(t.speed, t.targetSpeed, 3.5, delta);
      t.z += t.speed * delta;
      t.mesh.position.set(t.x, 0, t.z);

      if (t.bundle) {
        const steerLean = (t.targetLane - t.lane) * 0.2;
        t.bundle.updateAnimation(totalTime, t.speed, false, false, false, steerLean);
      }

      if (t.z < recycleThreshold || t.z > playerZ + 420) {
        this.scene.remove(t.mesh);
        this.trafficList.splice(i, 1);
      }
    }

    // 5. Update Pedestrians
    for (let i = this.pedestriansList.length - 1; i >= 0; i--) {
      const p = this.pedestriansList[i];
      p.z += p.walkSpeed * delta;
      p.group.position.z = p.z;

      const dist = Math.abs(p.z - playerZ);
      p.updateAnimation(totalTime, dist < 8);

      if (p.z < recycleThreshold || p.z > playerZ + 300) {
        this.scene.remove(p.group);
        this.pedestriansList.splice(i, 1);
      }
    }

    // 6. Clean Up Obstacles
    for (let i = this.obstaclesList.length - 1; i >= 0; i--) {
      const obs = this.obstaclesList[i];
      if (obs.z < recycleThreshold) {
        this.scene.remove(obs.mesh);
        this.obstaclesList.splice(i, 1);
      }
    }
  }

  private updateTrafficAi(entity: TrafficEntity) {
    let isBlocked = false;

    for (const obs of this.obstaclesList) {
      const dz = obs.z - entity.z;
      const dx = Math.abs(obs.x - entity.x);
      if (dz > 0 && dz < 18 && dx < 1.4) {
        isBlocked = true;
        break;
      }
    }

    if (!isBlocked) {
      for (const other of this.trafficList) {
        if (other === entity) continue;
        const dz = other.z - entity.z;
        const dx = Math.abs(other.x - entity.x);
        if (dz > 0 && dz < 16 && dx < 1.5) {
          isBlocked = true;
          break;
        }
      }
    }

    if (isBlocked) {
      entity.targetSpeed = Math.max(5, entity.speed * 0.65);
      entity.aiState = 'braking';

      const currentIdx = ROAD_LANES.findIndex((l) => Math.abs(l - entity.lane) < 0.8);
      const possible: number[] = [];
      if (currentIdx > 0) possible.push(ROAD_LANES[currentIdx - 1]);
      if (currentIdx < ROAD_LANES.length - 1) possible.push(ROAD_LANES[currentIdx + 1]);

      for (const cand of possible) {
        let clear = true;
        for (const other of this.trafficList) {
          if (other === entity) continue;
          if (Math.abs(other.x - cand) < 1.4 && Math.abs(other.z - entity.z) < 14) {
            clear = false;
            break;
          }
        }
        if (clear) {
          entity.targetLane = cand;
          entity.laneTransition = 0;
          entity.aiState = 'changing_lane';
          break;
        }
      }
    } else {
      entity.targetSpeed =
        entity.type === 'bike'
          ? 18
          : entity.type === 'car'
          ? 16
          : entity.type === 'cng'
          ? 14
          : entity.type === 'minibus'
          ? 12
          : 11;
      entity.aiState = 'cruising';
    }
  }

  public getMinimapData(playerZ: number): MinimapEntity[] {
    const list: MinimapEntity[] = [];

    this.trafficList.forEach((t, i) => {
      const relZ = t.z - playerZ;
      if (relZ > -15 && relZ < 100) {
        list.push({
          id: `traffic_${i}`,
          type: t.type === 'cng' ? 'cng' : t.type === 'bus' || t.type === 'truck' ? 'bus' : 'traffic',
          x: t.x,
          z: relZ,
        });
      }
    });

    this.obstaclesList.forEach((o, i) => {
      const relZ = o.z - playerZ;
      if (relZ > -5 && relZ < 90) {
        list.push({
          id: `obs_${i}`,
          type: 'obstacle',
          x: o.x,
          z: relZ,
        });
      }
    });

    if (this.activePickup && !this.activePickup.collected) {
      const relZ = this.activePickup.z - playerZ;
      if (relZ > -10 && relZ < 120) {
        list.push({
          id: 'pickup_beacon',
          type: 'pickup',
          x: this.activePickup.x,
          z: relZ,
        });
      }
    }

    return list;
  }

  public getTrafficList(): TrafficEntity[] {
    return this.trafficList;
  }

  public getCoinsList(): CollectibleCoin[] {
    return this.coinsList;
  }

  public getObstaclesList(): RoadObstacle[] {
    return this.obstaclesList;
  }
}
