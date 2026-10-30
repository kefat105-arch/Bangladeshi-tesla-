/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import {
  BiomeType,
  BiomeConfig,
  BIOME_CONFIGS,
  VehicleStage,
  VEHICLE_CONFIGS,
  MinimapEntity,
  RemotePlayerState,
} from '../types/game';
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
  createCheckpointGateModel,
  createStartLineModel,
  createVehicleBundleForStage,
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

export interface CheckpointEntity {
  id: number;
  mesh: THREE.Group;
  z: number;
  passed: boolean;
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

export interface PlayerSpawnedVehicleEntity {
  mesh: THREE.Group;
  bundle: VehicleMeshBundle;
  stage: VehicleStage;
  x: number;
  z: number;
}

export class WorldManager {
  private scene: THREE.Scene;
  private segments: SegmentChunk[] = [];
  private trafficList: TrafficEntity[] = [];
  private pedestriansList: PedestrianEntity[] = [];
  private coinsList: CollectibleCoin[] = [];
  private obstaclesList: RoadObstacle[] = [];
  private checkpointsList: CheckpointEntity[] = [];
  private activePickup: VehiclePickupEntity | null = null;
  private startLineMesh: THREE.Group | null = null;
  private nextSegmentZ = -50;
  private currentSegmentIndex = 0;
  private nextCheckpointIndex = 1;

  // Selected Map override (for custom map choice from Phone or Menu)
  private selectedMap: BiomeType | null = null;
  private lastBiome: BiomeType = 'dhaka_city';
  private biomeRunCount = 0;

  // Player spawned vehicle from phone garage
  private playerSpawnedVehicle: PlayerSpawnedVehicleEntity | null = null;

  // Remote multiplayer players
  private remotePlayerMeshes: Map<
    string,
    {
      root: THREE.Group;
      bundle: VehicleMeshBundle;
      nameTag: THREE.Mesh;
      currentX: number;
      currentY: number;
      currentZ: number;
      targetX: number;
      targetY: number;
      targetZ: number;
      targetRotationY: number;
      vehicleStage: VehicleStage;
    }
  > = new Map();

  // Reusable materials
  private roadMaterial: THREE.MeshStandardMaterial;
  private brickRoadMaterial: THREE.MeshStandardMaterial;
  private raceTrackMaterial: THREE.MeshStandardMaterial;
  private curbMaterial: THREE.MeshStandardMaterial;
  private grassMaterial: THREE.MeshStandardMaterial;
  private waterMaterial: THREE.MeshStandardMaterial;
  private sandMaterial: THREE.MeshStandardMaterial;
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

    this.brickRoadMaterial = new THREE.MeshStandardMaterial({
      map: textureFactory.getBrickRoadTexture(),
      roughness: 0.85,
    });

    this.raceTrackMaterial = new THREE.MeshStandardMaterial({
      map: textureFactory.getRaceTrackTexture(),
      roughness: 0.65,
      metalness: 0.2,
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

    this.sandMaterial = new THREE.MeshStandardMaterial({
      map: textureFactory.getSandTexture(),
      roughness: 0.9,
    });

    this.cityGroundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
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

    this.initWorld();
  }

  public setSelectedMap(map: BiomeType | null) {
    this.selectedMap = map;
    if (map) {
      this.lastBiome = map;
      this.biomeRunCount = 999;
    }
  }

  public initWorld() {
    this.clearAll();
    this.nextSegmentZ = -50;
    this.nextCheckpointIndex = 1;

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

    this.checkpointsList.forEach((cp) => this.scene.remove(cp.mesh));
    this.checkpointsList = [];

    if (this.startLineMesh) {
      this.scene.remove(this.startLineMesh);
      this.startLineMesh = null;
    }

    if (this.activePickup) {
      this.scene.remove(this.activePickup.mesh);
      this.activePickup = null;
    }

    if (this.playerSpawnedVehicle) {
      this.scene.remove(this.playerSpawnedVehicle.mesh);
      this.playerSpawnedVehicle = null;
    }

    this.remotePlayerMeshes.forEach((p) => this.scene.remove(p.root));
    this.remotePlayerMeshes.clear();

    this.nextSegmentZ = -50;
    this.currentSegmentIndex = 0;
    this.nextCheckpointIndex = 1;
    this.lastBiome = this.selectedMap || 'dhaka_city';
    this.biomeRunCount = 0;
  }

  private selectNextBiome(): BiomeType {
    if (this.selectedMap) {
      return this.selectedMap;
    }

    const allBiomes: BiomeType[] = [
      'dhaka_city',
      'old_market',
      'village_highway',
      'mountain_pass',
      'tea_forest',
      'coastal_drive',
      'padma_expressway',
      'rural_village',
      'grand_circuit',
      'flyover',
      'river_bridge',
    ];

    if (this.biomeRunCount < 4 && this.currentSegmentIndex > 0) {
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

    // 1. Solid Flanking Ground Terrain Plane
    let groundMat = this.cityGroundMaterial;
    if (biome === 'village_highway' || biome === 'tea_forest') {
      groundMat = this.grassMaterial;
    } else if (biome === 'river_bridge' || biome === 'riverside_road') {
      groundMat = this.waterMaterial;
    } else if (biome === 'coastal_drive') {
      groundMat = this.sandMaterial;
    } else if (biome === 'mountain_pass') {
      groundMat = this.concreteMaterial;
    }

    const groundGeo = new THREE.PlaneGeometry(240, SEGMENT_LENGTH);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.set(0, -0.04, midZ);
    groundMesh.receiveShadow = true;
    root.add(groundMesh);

    // 2. Road Surface Plane with Biome-Specific Styling
    let roadMat = this.roadMaterial;
    if (biome === 'rural_village' || biome === 'old_market') {
      roadMat = this.brickRoadMaterial;
    } else if (biome === 'grand_circuit') {
      roadMat = this.raceTrackMaterial;
    }

    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.set(0, 0, midZ);
    roadMesh.receiveShadow = true;
    root.add(roadMesh);

    // 3. Concrete Curbs & Sidewalks (Lining both sides)
    [-ROAD_WIDTH / 2 - 0.8, ROAD_WIDTH / 2 + 0.8].forEach((x) => {
      const curbGeo = new THREE.BoxGeometry(1.6, 0.22, SEGMENT_LENGTH);
      const curb = new THREE.Mesh(curbGeo, this.curbMaterial);
      curb.position.set(x, 0.1, midZ);
      curb.receiveShadow = true;
      root.add(curb);
    });

    // 4. Start Line Gantry Banner at Z = 0
    if (zStart <= 0 && zEnd > 0 && !this.startLineMesh) {
      const startLine = createStartLineModel();
      startLine.position.set(0, 0, 0);
      this.scene.add(startLine);
      this.startLineMesh = startLine;
    }

    // 5. Automatic Checkpoint Gate placement (every 350 meters)
    const targetCpZ = this.nextCheckpointIndex * 350;
    if (zStart <= targetCpZ && zEnd > targetCpZ) {
      const gate = createCheckpointGateModel();
      gate.position.set(0, 0, targetCpZ);
      this.scene.add(gate);

      this.checkpointsList.push({
        id: this.nextCheckpointIndex,
        mesh: gate,
        z: targetCpZ,
        passed: false,
      });

      this.nextCheckpointIndex++;
    }

    // 6. Biome Scenery & Architecture
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

    // Populate entities (skip initial start zone around 0)
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
          const height = 15 + Math.random() * 14;
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
    } else if (biome === 'mountain_pass') {
      // Majestic mountain peaks, rocky cliffs, and safety barricades
      [-ROAD_WIDTH / 2 - 12, ROAD_WIDTH / 2 + 12].forEach((x) => {
        for (let z = zStart + 10; z < zStart + SEGMENT_LENGTH; z += 22) {
          const hillGeo = new THREE.ConeGeometry(14 + Math.random() * 8, 22 + Math.random() * 15, 7);
          const hillMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
          const hill = new THREE.Mesh(hillGeo, hillMat);
          hill.position.set(x * (1 + Math.random() * 0.4), 10, z);
          root.add(hill);
        }
      });

      // Yellow steel mountain barricades
      [-ROAD_WIDTH / 2 - 0.2, ROAD_WIDTH / 2 + 0.2].forEach((x) => {
        const guard = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.9, SEGMENT_LENGTH),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }),
        );
        guard.position.set(x, 0.45, zStart + SEGMENT_LENGTH / 2);
        root.add(guard);
      });
    } else if (biome === 'tea_forest') {
      // Undulating tea bush mounds & tall bamboo stalks
      [-ROAD_WIDTH / 2 - 4.5, ROAD_WIDTH / 2 + 4.5].forEach((x) => {
        for (let z = zStart + 4; z < zStart + SEGMENT_LENGTH; z += 8) {
          const teaBush = new THREE.Mesh(
            new THREE.SphereGeometry(1.4 + Math.random() * 0.5, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 }),
          );
          teaBush.scale.set(1.4, 0.7, 1.4);
          teaBush.position.set(x + (Math.random() - 0.5) * 2, 0.5, z);
          root.add(teaBush);

          // Bamboo tree stalks
          if (Math.random() > 0.4) {
            const bamboo = new THREE.Mesh(
              new THREE.CylinderGeometry(0.08, 0.1, 7.5, 6),
              new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.7 }),
            );
            bamboo.position.set(x * 1.5, 3.75, z + 2);
            root.add(bamboo);
          }
        }
      });
    } else if (biome === 'coastal_drive') {
      // Ocean water plane on west flank
      const oceanGeo = new THREE.PlaneGeometry(80, SEGMENT_LENGTH);
      oceanGeo.rotateX(-Math.PI / 2);
      const ocean = new THREE.Mesh(oceanGeo, this.waterMaterial);
      ocean.position.set(-ROAD_WIDTH / 2 - 45, -0.02, zStart + SEGMENT_LENGTH / 2);
      root.add(ocean);

      // Sandy dunes & coconut palms on east flank
      [ROAD_WIDTH / 2 + 4].forEach((x) => {
        for (let z = zStart + 8; z < zStart + SEGMENT_LENGTH; z += 14) {
          const palm = this.createPalmTree();
          palm.position.set(x + Math.random() * 4, 0, z);
          root.add(palm);
        }
      });

      // Wooden Fishing Boats on shore
      if (Math.random() > 0.5) {
        const boat = this.createNoukaBoat();
        boat.position.set(-ROAD_WIDTH / 2 - 8, 0.2, zStart + 20);
        boat.rotation.y = Math.PI / 3;
        root.add(boat);
      }
    } else if (biome === 'padma_expressway' || biome === 'river_bridge') {
      // Massive steel truss arches and bridge suspension cables
      [-ROAD_WIDTH / 2 - 1.2, ROAD_WIDTH / 2 + 1.2].forEach((x) => {
        for (let z = zStart + 10; z < zStart + SEGMENT_LENGTH; z += 25) {
          const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 12, 10), this.concreteMaterial);
          pier.position.set(x, 6, z);
          root.add(pier);

          const truss = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 26), this.concreteMaterial);
          truss.position.set(x, 11.5, z);
          root.add(truss);
        }
      });
    } else if (biome === 'grand_circuit') {
      // Racing grandstands & sponsor banners
      [-ROAD_WIDTH / 2 - 6, ROAD_WIDTH / 2 + 6].forEach((x) => {
        const stand = new THREE.Mesh(
          new THREE.BoxGeometry(6, 4.5, SEGMENT_LENGTH * 0.8),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }),
        );
        stand.position.set(x, 2.25, zStart + SEGMENT_LENGTH / 2);
        root.add(stand);
      });
    } else if (biome === 'rural_village') {
      // Rustic thatched huts, banyan trees, and ponds
      [-ROAD_WIDTH / 2 - 4.5, ROAD_WIDTH / 2 + 4.5].forEach((x) => {
        for (let z = zStart + 10; z < zStart + SEGMENT_LENGTH; z += 18) {
          const hut = this.createVillageHut();
          hut.position.set(x, 0, z);
          root.add(hut);

          const tree = this.createBanyanTree();
          tree.position.set(x * 1.6, 0, z + 7);
          root.add(tree);
        }
      });
    } else {
      // Default village highway: palms, fences, and greenery
      [-ROAD_WIDTH / 2 - 4.5, ROAD_WIDTH / 2 + 4.5].forEach((x) => {
        for (let z = zStart + 8; z < zStart + SEGMENT_LENGTH; z += 14) {
          const palm = this.createPalmTree();
          palm.position.set(x, 0, z);
          root.add(palm);
        }
      });
    }
  }

  // --- ENTITY POPULATION (COINS, OBSTACLES, TRAFFIC, PEDESTRIANS) ---
  private populateEntities(chunk: SegmentChunk) {
    const { zStart, zEnd } = chunk;

    // Coins pattern
    const coinPattern = Math.random();
    if (coinPattern > 0.25) {
      const lane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];
      for (let z = zStart + 10; z < zEnd - 10; z += 4) {
        const coinMesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
        coinMesh.position.set(lane, 0.65, z);
        this.scene.add(coinMesh);
        this.coinsList.push({
          mesh: coinMesh,
          x: lane,
          y: 0.65,
          z,
          collected: false,
        });
      }
    }

    // Road Obstacle
    if (Math.random() > 0.45) {
      const lane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];
      const obsZ = zStart + 18 + Math.random() * 15;
      const obsType = Math.random() > 0.5 ? 'barrier' : 'wire_barrier';

      const obsGroup = new THREE.Group();
      if (obsType === 'barrier') {
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.75, 0.35),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }),
        );
        bar.position.y = 0.38;
        bar.castShadow = true;
        obsGroup.add(bar);

        obsGroup.position.set(lane, 0, obsZ);
        this.scene.add(obsGroup);
        this.obstaclesList.push({
          mesh: obsGroup,
          type: 'barrier',
          x: lane,
          z: obsZ,
          width: 2.4,
          length: 0.4,
          height: 0.75,
        });
      } else {
        // High wire barrier (duck under)
        const postMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
        [-1.2, 1.2].forEach((px) => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6), postMat);
          post.position.set(px, 0.9, 0);
          obsGroup.add(post);
        });

        const wire = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 0.2, 0.05),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 }),
        );
        wire.position.set(0, 1.45, 0);
        obsGroup.add(wire);

        obsGroup.position.set(lane, 0, obsZ);
        this.scene.add(obsGroup);
        this.obstaclesList.push({
          mesh: obsGroup,
          type: 'wire_barrier',
          x: lane,
          z: obsZ,
          width: 2.5,
          length: 0.3,
          height: 1.6,
          canDuckUnder: true,
        });
      }
    }

    // Traffic AI
    if (Math.random() > 0.35) {
      const lane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];
      const types: ('cng' | 'autorickshaw' | 'bus' | 'car' | 'truck')[] = ['cng', 'autorickshaw', 'bus', 'car', 'truck'];
      const type = types[Math.floor(Math.random() * types.length)];
      const trafficZ = zStart + 22 + Math.random() * 15;

      let bundle: VehicleMeshBundle;
      let width = 1.6;
      let length = 3.0;
      let height = 2.0;
      let speed = 18;
      let canSkitch = false;

      if (type === 'cng') {
        bundle = createCngModel();
        width = 1.5;
        length = 2.6;
        height = 2.0;
        speed = 22;
        canSkitch = true;
      } else if (type === 'autorickshaw') {
        bundle = createAutoRickshawModel();
        width = 1.45;
        length = 2.5;
        height = 1.95;
        speed = 20;
        canSkitch = true;
      } else if (type === 'bus') {
        bundle = createBusModel();
        width = 2.4;
        length = 6.2;
        height = 3.2;
        speed = 24;
      } else if (type === 'truck') {
        bundle = createTruckModel();
        width = 2.2;
        length = 5.6;
        height = 2.8;
        speed = 20;
      } else {
        bundle = createCarModel();
        width = 1.7;
        length = 3.8;
        height = 1.6;
        speed = 26;
      }

      bundle.root.position.set(lane, 0, trafficZ);
      this.scene.add(bundle.root);

      this.trafficList.push({
        mesh: bundle.root,
        bundle,
        type,
        lane,
        targetLane: lane,
        laneTransition: 0,
        x: lane,
        z: trafficZ,
        speed,
        targetSpeed: speed,
        length,
        width,
        height,
        canSkitch,
        aiState: 'cruising',
        scanTimer: Math.random() * 0.2,
      });
    }
  }

  // --- SPAWN VEHICLE ON ROAD (CALLED FROM PHONE GARAGE) ---
  public spawnPlayerVehicle(stage: VehicleStage, x: number, z: number): PlayerSpawnedVehicleEntity {
    this.removePlayerSpawnedVehicle();

    const bundle = createVehicleBundleForStage(stage);
    bundle.root.position.set(x, 0, z);
    this.scene.add(bundle.root);

    this.playerSpawnedVehicle = {
      mesh: bundle.root,
      bundle,
      stage,
      x,
      z,
    };

    return this.playerSpawnedVehicle;
  }

  public getPlayerSpawnedVehicle(): PlayerSpawnedVehicleEntity | null {
    return this.playerSpawnedVehicle;
  }

  public removePlayerSpawnedVehicle() {
    if (this.playerSpawnedVehicle) {
      this.scene.remove(this.playerSpawnedVehicle.mesh);
      this.playerSpawnedVehicle = null;
    }
  }

  // --- MULTIPLAYER REMOTE PLAYERS SYNC ---
  public updateRemotePlayers(players: RemotePlayerState[]) {
    const activeIds = new Set(players.map((p) => p.id));

    // Remove disconnected peers
    this.remotePlayerMeshes.forEach((meshInfo, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(meshInfo.root);
        this.remotePlayerMeshes.delete(id);
      }
    });

    // Update / create active peers
    players.forEach((player) => {
      let peer = this.remotePlayerMeshes.get(player.id);
      if (!peer || peer.vehicleStage !== player.vehicle) {
        if (peer) this.scene.remove(peer.root);

        const bundle = createVehicleBundleForStage(player.vehicle);

        // Name tag billboard canvas
        const tagCanvas = document.createElement('canvas');
        tagCanvas.width = 256;
        tagCanvas.height = 64;
        const tctx = tagCanvas.getContext('2d')!;
        tctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        tctx.roundRect(4, 4, 248, 56, 12);
        tctx.fill();
        tctx.strokeStyle = '#38bdf8';
        tctx.lineWidth = 3;
        tctx.stroke();
        tctx.fillStyle = '#ffffff';
        tctx.font = 'bold 26px sans-serif';
        tctx.textAlign = 'center';
        tctx.textBaseline = 'middle';
        tctx.fillText(player.name, 128, 32);

        const tagTex = new THREE.CanvasTexture(tagCanvas);
        tagTex.colorSpace = THREE.SRGBColorSpace;
        const nameTag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: tagTex, transparent: true }));
        nameTag.position.set(0, 2.4, 0);
        bundle.root.add(nameTag);

        this.scene.add(bundle.root);
        peer = {
          root: bundle.root,
          bundle,
          nameTag,
          currentX: player.posX,
          currentY: player.posY,
          currentZ: player.posZ,
          targetX: player.posX,
          targetY: player.posY,
          targetZ: player.posZ,
          targetRotationY: player.rotationY || 0,
          vehicleStage: player.vehicle,
        };
        this.remotePlayerMeshes.set(player.id, peer);
      }

      peer.targetX = player.posX;
      peer.targetY = player.posY;
      peer.targetZ = player.posZ;
      peer.targetRotationY = player.rotationY || 0;
    });
  }

  // --- VEHICLE PICKUPS ---
  public spawnVehiclePickup(targetVehicle: VehicleStage, playerZ: number): boolean {
    if (this.activePickup) return false;

    const pickupZ = playerZ + 75;
    const lane = ROAD_LANES[Math.floor(Math.random() * ROAD_LANES.length)];

    const mesh = createVehiclePickupMesh(targetVehicle);
    mesh.position.set(lane, 0, pickupZ);
    this.scene.add(mesh);

    this.activePickup = {
      mesh,
      targetVehicle,
      x: lane,
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

  public getCheckpointsList(): CheckpointEntity[] {
    return this.checkpointsList;
  }

  public resetCheckpointStates() {
    this.checkpointsList.forEach((cp) => (cp.passed = false));
  }

  public getCurrentBiome(playerZ: number): BiomeConfig {
    if (this.selectedMap) return BIOME_CONFIGS[this.selectedMap];
    for (const seg of this.segments) {
      if (playerZ >= seg.zStart && playerZ <= seg.zEnd) {
        return BIOME_CONFIGS[seg.biome];
      }
    }
    return BIOME_CONFIGS['dhaka_city'];
  }

  public getCoinsList(): CollectibleCoin[] {
    return this.coinsList;
  }

  public getObstaclesList(): RoadObstacle[] {
    return this.obstaclesList;
  }

  public getTrafficList(): TrafficEntity[] {
    return this.trafficList;
  }

  public getMinimapData(playerZ: number): MinimapEntity[] {
    const list: MinimapEntity[] = [];

    // Checkpoints
    this.checkpointsList.forEach((cp) => {
      const dz = cp.z - playerZ;
      if (dz >= -10 && dz <= 140) {
        list.push({ id: `cp_${cp.id}`, type: 'checkpoint', x: 0, z: dz });
      }
    });

    // Traffic
    this.trafficList.forEach((t, i) => {
      const dz = t.z - playerZ;
      if (dz >= -10 && dz <= 120) {
        list.push({ id: `tr_${i}`, type: 'traffic', x: t.x, z: dz });
      }
    });

    // Remote Players
    this.remotePlayerMeshes.forEach((p, id) => {
      const dz = p.currentZ - playerZ;
      if (dz >= -15 && dz <= 120) {
        list.push({ id: `rem_${id}`, type: 'remote_player', x: p.currentX, z: dz });
      }
    });

    return list;
  }

  // --- PER-FRAME WORLD UPDATE ---
  public update(playerZ: number, delta: number, totalTime: number) {
    const recycleThreshold = playerZ - 60;

    // 1. Recycle segments
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

    // 4. Update Traffic AI
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

    // 7. Update Remote Players Animation & Position interpolation
    this.remotePlayerMeshes.forEach((peer) => {
      peer.currentX = THREE.MathUtils.damp(peer.currentX, peer.targetX, 14, delta);
      peer.currentY = THREE.MathUtils.damp(peer.currentY, peer.targetY, 14, delta);
      peer.currentZ = THREE.MathUtils.damp(peer.currentZ, peer.targetZ, 14, delta);

      peer.root.position.set(peer.currentX, peer.currentY, peer.currentZ);
      peer.root.rotation.y = peer.targetRotationY;
      peer.bundle.updateAnimation(totalTime, 20, false, false, false, 0);
    });
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

    if (isBlocked && entity.aiState === 'cruising') {
      const currentLaneIdx = ROAD_LANES.indexOf(entity.lane);
      const possibleLanes: number[] = [];
      if (currentLaneIdx > 0) possibleLanes.push(ROAD_LANES[currentLaneIdx - 1]);
      if (currentLaneIdx < ROAD_LANES.length - 1) possibleLanes.push(ROAD_LANES[currentLaneIdx + 1]);

      if (possibleLanes.length > 0) {
        const target = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
        entity.targetLane = target;
        entity.laneTransition = 0;
        entity.aiState = 'changing_lane';
      } else {
        entity.targetSpeed = 10;
        entity.aiState = 'braking';
      }
    } else if (!isBlocked && entity.aiState === 'braking') {
      entity.targetSpeed = 22;
      entity.aiState = 'cruising';
    }
  }

  // --- Helper Scenery Builders ---
  private createStreetlight(): THREE.Group {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 8), this.concreteMaterial);
    pole.position.y = 2.6;
    group.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), this.concreteMaterial);
    arm.position.set(0.35, 5.1, 0);
    group.add(arm);

    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 1.5 }),
    );
    lamp.position.set(0.7, 5.0, 0);
    group.add(lamp);
    return group;
  }

  private createTongerDokan(): THREE.Group {
    const group = new THREE.Group();
    const stallMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });

    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.4), stallMat);
    bench.position.y = 0.45;
    group.add(bench);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 1.8), canopyMat);
    canopy.position.y = 1.9;
    group.add(canopy);
    return group;
  }

  private createMarketShop(isLeft: boolean): THREE.Group {
    const group = new THREE.Group();
    const shop = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.2, 8.5), this.brickMaterial);
    shop.position.set(isLeft ? -2.75 : 2.75, 2.1, 0);
    group.add(shop);

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.1, 8.2),
      new THREE.MeshStandardMaterial({ color: isLeft ? 0x0284c7 : 0xe11d48, roughness: 0.5 }),
    );
    canopy.position.set(isLeft ? 0.8 : -0.8, 2.4, 0);
    canopy.rotation.z = isLeft ? 0.2 : -0.2;
    group.add(canopy);
    return group;
  }

  private createPalmTree(): THREE.Group {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 7.5, 8), trunkMat);
    trunk.position.y = 3.75;
    group.add(trunk);

    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.2, 5), leavesMat);
      leaf.position.set(0, 7.2, 0);
      leaf.rotation.set((Math.PI / 4) * Math.sin((i * Math.PI) / 3), 0, (Math.PI / 4) * Math.cos((i * Math.PI) / 3));
      group.add(leaf);
    }
    return group;
  }

  private createNoukaBoat(): THREE.Group {
    const group = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.8 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.85 });

    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.4, 4.8, 8), hullMat);
    hull.rotation.z = Math.PI / 2;
    hull.scale.set(0.5, 1, 1);
    group.add(hull);

    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.4, 8, 1, true, 0, Math.PI), canopyMat);
    roof.rotation.z = Math.PI / 2;
    roof.position.y = 0.35;
    group.add(roof);
    return group;
  }

  private createVillageHut(): THREE.Group {
    const group = new THREE.Group();
    const mudMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.95 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });

    const wall = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 3.2), mudMat);
    wall.position.y = 1.1;
    group.add(wall);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.4, 4), thatchMat);
    roof.position.y = 2.8;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
    return group;
  }

  private createBanyanTree(): THREE.Group {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.9 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 5.5, 8), trunkMat);
    trunk.position.y = 2.75;
    group.add(trunk);

    const crown = new THREE.Mesh(new THREE.SphereGeometry(4.2, 10, 8), foliageMat);
    crown.scale.set(1.4, 0.7, 1.4);
    crown.position.y = 5.8;
    group.add(crown);
    return group;
  }
}
