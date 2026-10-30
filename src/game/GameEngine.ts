/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  VehicleStage,
  VEHICLE_CONFIGS,
  VEHICLE_STAGES,
  BiomeConfig,
  BIOME_CONFIGS,
  BiomeType,
  GameMode,
  GameScoreState,
  MinimapEntity,
  SavedCheckpoint,
} from '../types/game';
import { soundManager } from '../audio/soundManager';
import { WorldManager, ROAD_LANES, TrafficEntity } from '../world/worldManager';
import {
  createVehicleBundleForStage,
  createHumanCharacter,
  VehicleMeshBundle,
} from '../models/vehicleModels';
import { multiplayerService } from '../multiplayer/multiplayerService';
import { fbxCharacterManager, FBXCharacterInstance } from '../graphics/fbxCharacterLoader';

// Pre-allocated reusable math helpers
const _camPosTarget = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();

export interface GameEngineCallbacks {
  onScoreUpdate: (state: GameScoreState) => void;
  onVehicleChange: (stage: VehicleStage, isUpgrade: boolean) => void;
  onGameOver: (finalStats: GameScoreState, reason: string) => void;
  onFloatingNotification: (text: string, subtext?: string, type?: 'pickup' | 'skitch' | 'nearmiss' | 'slap') => void;
  onSkitchStateChange: (isSkitching: boolean, targetName?: string) => void;
  onPickupAvailable: (targetVehicle: VehicleStage, distanceRemaining: number) => void;
  onBiomeChange?: (biome: BiomeConfig) => void;
  onMinimapUpdate?: (entities: MinimapEntity[], currentBiomeName: string) => void;
  onGestureDetected?: () => void;
  onCheckpointSaved?: (checkpoint: SavedCheckpoint) => void;
  onVehicleNearby?: (vehicle: { stage: VehicleStage; x: number; z: number } | null) => void;
  onDrivingStateChange?: (isDriving: boolean) => void;
  onVersusCountdown?: (count: number) => void;
  onVersusStart?: () => void;
}

export class GameEngine {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private world: WorldManager;
  private callbacks: GameEngineCallbacks;

  // Environment & Dynamic Lighting
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private shadowPlane!: THREE.Mesh;
  private currentBiome: BiomeConfig = BIOME_CONFIGS['dhaka_city'];

  // Game Mode & Map
  private gameMode: GameMode = 'runner';
  private selectedMap: BiomeType | null = null;

  // 360-Degree Camera System State
  private cameraYaw = 0; // 0 = behind player looking +Z
  private cameraPitch = 0.22; // ~12 degrees above horizon
  private currentLookTarget = new THREE.Vector3(0, 1.2, 10);
  private cameraUserDragging = false;
  private cameraAutoAlignTimer = 0;

  // Player Vehicle & On-Foot State
  private currentStage: VehicleStage = 'skateboard';
  private isDriving = true; // true = riding/driving vehicle, false = on-foot walking
  private isWalking = false; // walking animation state
  private vehicleBundle: VehicleMeshBundle | null = null;
  private playerGroup: THREE.Group;
  private onFootCharacter: ReturnType<typeof createHumanCharacter> | null = null;
  private fbxCharacter: FBXCharacterInstance | null = null;

  // Realistic Driving Cockpit State
  private currentGear: 'P' | 'R' | 'N' | 'D' = 'D';
  private isGasPedalActive = false;
  private isBrakePedalActive = false;
  private steerWheelValue = 0; // -1 to +1

  // Natural On-Foot Pedestrian State
  private onFootJoystickX = 0;
  private onFootJoystickZ = 0;
  private isSprinting = false;
  private isSneaking = false;
  private footstepTimer = 0;
  private onFootFacingAngle = 0;

  private posX = 0;
  private posY = 0;
  private posZ = 0;
  private velocityX = 0;
  private velocityY = 0;
  private currentSpeed = 0;
  private isJumping = false;
  private isSliding = false;
  private slideTimer = 0;
  private jumpCooldown = 0;

  // Checkpoint & Save State
  private lastSavedCheckpoint: SavedCheckpoint | null = null;
  private checkpointsPassedCount = 0;

  // Skitch Mechanic
  private isSkitching = false;
  private skitchTarget: TrafficEntity | null = null;
  private skitchTimer = 0;
  private slapCooldown = 0;

  // Hitstop & Camera Shake
  private hitstopTimer = 0;
  private cameraShakeIntensity = 0;

  // Progression & Milestones
  private distanceTraveledInStage = 0;
  private vehiclePickupSpawned = false;

  // Scoring & Stats
  private scoreState: GameScoreState = {
    currentScore: 0,
    distance: 0,
    coinsCollected: 0,
    multiplier: 1.0,
    combo: 0,
    nearMisses: 0,
    skitchBonus: 0,
    speedKmh: 0,
    checkpointsPassed: 0,
  };

  // Touch Gesture & Right-Side Camera Drag Tracking
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private isTouching = false;
  private touchDragOffset = 0;
  private isCameraTouching = false;
  public touchSensitivity = 1.0;

  // Desktop Keyboard Input State
  private inputLeft = false;
  private inputRight = false;
  private inputForward = false;
  private inputBackward = false;
  private inputJump = false;
  private inputSlide = false;

  // Loop control
  private isRunning = false;
  private isPaused = false;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private totalElapsedTime = 0;
  private isSoftwareGl = false;

  constructor(container: HTMLDivElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7dd3fc);
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.007);

    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      600,
    );

    // 4. Studio Environment Reflection
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {}

    // 5. Studio Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x0284c7, 0.95);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 140;
    const d = 16;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // 6. Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.6, 2.6);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    this.scene.add(this.shadowPlane);

    // 7. Player 3D Group
    this.playerGroup = new THREE.Group();
    this.scene.add(this.playerGroup);

    // 8. World Manager
    this.world = new WorldManager(this.scene);

    // 9. Attach Controls
    this.setupEventListeners();

    // 10. Hook up Multiplayer Service
    multiplayerService.init({
      onConnectionChange: (status, ping) => {
        if (status === 'connected') {
          this.callbacks.onFloatingNotification?.('MULTIPLAYER CONNECTED! 🌐', `Ping: ${ping}ms`, 'pickup');
        }
      },
      onPlayersUpdate: (players) => {
        this.world.updateRemotePlayers(players);
      },
      onVersusCountdown: (count) => {
        this.callbacks.onVersusCountdown?.(count);
        soundManager.playCountdownTick();
      },
      onVersusStart: () => {
        this.callbacks.onVersusStart?.();
        soundManager.playRaceStart();
        this.callbacks.onFloatingNotification?.('GO! 🏁 RACE STARTED', undefined, 'pickup');
      },
    });

    // Initial render
    this.renderer.render(this.scene, this.camera);
  }

  private setupEventListeners() {
    const el = this.renderer.domElement;

    // DIRECT FINGER TOUCH CONTROLS
    el.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    el.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    el.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    el.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

    // Desktop Mouse Drag 360 Camera Listeners
    el.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    // Desktop Keyboard Listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.handleBlur);
  }

  // --- 360-DEGREE CAMERA ROTATION (ONLY ACTIVE ON FOOT) ---
  public rotateCamera(deltaYaw: number, deltaPitch: number) {
    // CRITICAL USER REQUIREMENT: Camera must NOT rotate 360 while driving!
    if (this.isDriving) {
      this.cameraYaw = 0;
      this.cameraPitch = 0.22;
      return;
    }

    this.cameraYaw += deltaYaw;
    // Clamped vertical rotation between -0.22 (looking slightly up) to +1.15 (looking down from above)
    this.cameraPitch = Math.max(-0.22, Math.min(1.15, this.cameraPitch + deltaPitch));
    this.cameraUserDragging = true;
    this.cameraAutoAlignTimer = 3.5; // Do not auto-align for 3.5s after user touches camera
  }

  public resetCamera() {
    this.cameraYaw = 0;
    this.cameraPitch = 0.22;
    this.cameraUserDragging = false;
  }

  public setGameMode(mode: GameMode) {
    this.gameMode = mode;
  }

  public setSelectedMap(map: BiomeType | null) {
    this.selectedMap = map;
    this.world.setSelectedMap(map);
    if (map) {
      this.currentBiome = BIOME_CONFIGS[map];
      this.scene.background = new THREE.Color(this.currentBiome.skyColor);
      (this.scene.fog as THREE.FogExp2).color = new THREE.Color(this.currentBiome.fogColor);
      (this.scene.fog as THREE.FogExp2).density = this.currentBiome.fogDensity;
      this.callbacks.onBiomeChange?.(this.currentBiome);
    }
  }

  // --- TOUCH HANDLERS (SEPARATING LEFT MOVEMENT & RIGHT 360 CAMERA) ---
  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (this.isPaused || e.touches.length === 0) return;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const screenMid = (window.innerWidth || 400) * 0.5;

      if (touch.clientX >= screenMid) {
        // Right side: 360-DEGREE CAMERA ROTATION
        this.isCameraTouching = true;
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
      } else {
        // Left side: CHARACTER MOVEMENT / STEERING
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.lastTouchX = touch.clientX;
        this.touchStartTime = performance.now();
        this.isTouching = true;
        this.touchDragOffset = 0;
      }
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (this.isPaused || e.touches.length === 0) return;

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const screenMid = (window.innerWidth || 400) * 0.5;

      if (touch.clientX >= screenMid || this.isCameraTouching) {
        if (this.isDriving) {
          // Camera is locked behind vehicle while driving - do not rotate!
          return;
        }
        // Unrestricted 360-degree horizontal + smooth vertical camera rotation on foot
        const dx = touch.clientX - this.lastTouchX;
        const dy = touch.clientY - this.lastTouchY;
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;

        const sensitivity = 0.0055 * this.touchSensitivity;
        this.rotateCamera(-dx * sensitivity, -dy * sensitivity);
      } else if (this.isTouching) {
        // Left side steering
        const dx = touch.clientX - this.lastTouchX;
        this.lastTouchX = touch.clientX;
        const screenWidth = Math.max(320, window.innerWidth || 400);
        const steerDelta = (dx / screenWidth) * 16 * this.touchSensitivity;
        this.touchDragOffset += steerDelta;

        if (Math.abs(dx) > 3) {
          this.callbacks.onGestureDetected?.();
        }
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      this.isTouching = false;
      this.isCameraTouching = false;
      this.touchDragOffset = 0;
    }
  };

  // --- MOUSE 360 CAMERA DRAG ---
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private handleMouseDown = (e: MouseEvent) => {
    if (this.isDriving) return; // Ignore mouse look while driving
    this.isMouseDown = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isMouseDown || this.isPaused || this.isDriving) return;
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    const sensitivity = 0.0055 * this.touchSensitivity;
    this.rotateCamera(-dx * sensitivity, -dy * sensitivity);
  };

  private handleMouseUp = () => {
    this.isMouseDown = false;
  };

  // --- DESKTOP KEYBOARD LISTENERS ---
  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.isPaused) return;

    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      this.inputLeft = true;
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      this.inputRight = true;
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.inputForward = true;
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      this.inputBackward = true;
      if (!this.inputSlide) this.triggerSlide();
      this.inputSlide = true;
    } else if (e.code === 'Space') {
      if (!this.inputJump) this.triggerJump();
      this.inputJump = true;
    } else if (e.code === 'KeyE') {
      this.handleInteractOrAction();
    } else if (e.code === 'KeyH') {
      this.triggerHorn();
    } else if (e.code === 'KeyC') {
      this.resetCamera();
    } else if (e.code === 'KeyQ') {
      this.rotateCamera(0.08, 0);
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      this.inputLeft = false;
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      this.inputRight = false;
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.inputForward = false;
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      this.inputBackward = false;
      this.inputSlide = false;
    } else if (e.code === 'Space') {
      this.inputJump = false;
    }
  };

  private handleBlur = () => {
    this.inputLeft = false;
    this.inputRight = false;
    this.inputForward = false;
    this.inputBackward = false;
    this.inputJump = false;
    this.inputSlide = false;
    this.isTouching = false;
    this.isCameraTouching = false;
    this.isMouseDown = false;
    this.touchDragOffset = 0;
  };

  public handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // --- GAMEPLAY LIFECYCLE ---
  public start(stage: VehicleStage = 'skateboard') {
    this.currentStage = stage;
    this.isDriving = true;
    this.isWalking = false;
    this.posX = 0;
    this.posY = 0;
    this.posZ = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.currentSpeed = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.isSkitching = false;
    this.skitchTarget = null;
    this.distanceTraveledInStage = 0;
    this.vehiclePickupSpawned = false;
    this.cameraYaw = 0;
    this.cameraPitch = 0.22;
    this.checkpointsPassedCount = 0;
    this.lastSavedCheckpoint = null;

    this.scoreState = {
      currentScore: 0,
      distance: 0,
      coinsCollected: 0,
      multiplier: 1.0,
      combo: 0,
      nearMisses: 0,
      skitchBonus: 0,
      speedKmh: 0,
      checkpointsPassed: 0,
    };

    this.mountVehicleModel(this.currentStage);
    this.world.initWorld();

    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    this.totalElapsedTime = 0;

    soundManager.startEngine(this.currentStage);
    soundManager.startMusic();

    this.callbacks.onVehicleChange(this.currentStage, false);
    this.callbacks.onDrivingStateChange?.(true);
    this.callbacks.onScoreUpdate(this.scoreState);

    this.tick();
  }

  public pause() {
    this.isPaused = true;
    soundManager.stopEngine();
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.clock.start();
    if (this.isDriving) {
      soundManager.startEngine(this.currentStage);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundManager.stopEngine();
    soundManager.stopMusic();
  }

  // --- VEHICLE MODEL MOUNTING ---
  private mountVehicleModel(stage: VehicleStage) {
    while (this.playerGroup.children.length > 0) {
      this.playerGroup.remove(this.playerGroup.children[0]);
    }

    if (this.isDriving) {
      const bundle = createVehicleBundleForStage(stage);
      this.vehicleBundle = bundle;
      this.onFootCharacter = null;
      this.fbxCharacter = null;
      this.playerGroup.add(bundle.root);
    } else {
      // User's Animated FBX Character (Character_Animated (1).fbx)
      const fbxInst = fbxCharacterManager.createInstance();
      this.fbxCharacter = fbxInst;
      this.vehicleBundle = null;
      this.playerGroup.add(fbxInst.root);

      // Lightweight temporary avatar while FBX loads
      const human = createHumanCharacter({
        hoodieColor: 0x0284c7,
        pantsColor: 0x0f172a,
        shoeColor: 0x38bdf8,
        hasCap: true,
      });
      this.onFootCharacter = human;
      this.playerGroup.add(human.group);
    }

    const config = VEHICLE_CONFIGS[stage];
    this.camera.fov = config.cameraFov;
    this.camera.updateProjectionMatrix();
    this.shadowPlane.scale.set(config.width * 1.3, config.length * 1.3, 1);
  }

  // --- SPAWN VEHICLE FROM SMARTPHONE APP ---
  public spawnVehicleFromPhone(stage: VehicleStage) {
    soundManager.playPhoneNotification();
    const spawnZ = this.posZ + 5.0;
    const spawnX = Math.max(-4.0, Math.min(4.0, this.posX));

    this.world.spawnPlayerVehicle(stage, spawnX, spawnZ);
    soundManager.playHorn(stage);
    this.callbacks.onFloatingNotification(
      `${VEHICLE_CONFIGS[stage].name.toUpperCase()} DELIVERED! 🚗`,
      'Walk up to vehicle and tap DRIVE',
      'pickup',
    );
  }

  // --- ENTER / EXIT VEHICLE MECHANICS ---
  public enterVehicle(stage: VehicleStage) {
    this.currentStage = stage;
    this.isDriving = true;
    this.isWalking = false;
    this.world.removePlayerSpawnedVehicle();

    soundManager.playVehicleEnter();
    soundManager.startEngine(stage);
    this.mountVehicleModel(stage);

    this.callbacks.onDrivingStateChange?.(true);
    this.callbacks.onVehicleChange(stage, false);
    this.callbacks.onFloatingNotification(`DRIVING: ${VEHICLE_CONFIGS[stage].name.toUpperCase()}!`, undefined, 'pickup');
  }

  public exitVehicle() {
    if (!this.isDriving) return;
    this.isDriving = false;
    this.isWalking = true;
    soundManager.playVehicleExit();
    soundManager.stopEngine();

    // Spawn the vehicle we just exited right next to the player
    this.world.spawnPlayerVehicle(this.currentStage, this.posX + 1.2, this.posZ);
    this.mountVehicleModel(this.currentStage);

    this.callbacks.onDrivingStateChange?.(false);
    this.callbacks.onFloatingNotification('ON FOOT / WALKING 🚶', 'Tap smartphone to call vehicle', 'nearmiss');
  }

  private handleInteractOrAction() {
    // If near a spawned vehicle, enter it!
    const spawned = this.world.getPlayerSpawnedVehicle();
    if (spawned) {
      const dist = Math.hypot(spawned.x - this.posX, spawned.z - this.posZ);
      if (dist <= 3.8) {
        this.enterVehicle(spawned.stage);
        return;
      }
    }

    // If driving and skateboard, handle skitching
    if (this.isDriving && this.currentStage === 'skateboard') {
      if (this.isSkitching) {
        this.breakSkitch(true);
      } else {
        const target = this.findNearbySkitchTarget();
        if (target) this.attachSkitch(target);
      }
    }
  }

  // --- CHECKPOINT SAVING & COLLISION RECOVERY ---
  private handleCheckpointSave(cp: { id: number; z: number }) {
    this.checkpointsPassedCount++;
    this.scoreState.checkpointsPassed = this.checkpointsPassedCount;
    this.scoreState.currentScore += 500;

    this.lastSavedCheckpoint = {
      checkpointId: cp.id,
      distance: Math.floor(cp.z),
      posX: this.posX,
      posZ: cp.z,
      vehicle: this.currentStage,
      biome: this.currentBiome.id,
      score: this.scoreState.currentScore,
      coins: this.scoreState.coinsCollected,
      timestamp: Date.now(),
    };

    soundManager.playCheckpointSave();
    this.callbacks.onCheckpointSaved?.(this.lastSavedCheckpoint);
    this.callbacks.onFloatingNotification(
      'CHECKPOINT SAVED! 💾',
      `Checkpoint #${cp.id} (${Math.floor(cp.z)}m) Recorded`,
      'pickup',
    );
  }

  public saveCheckpointManually() {
    this.lastSavedCheckpoint = {
      checkpointId: 999,
      distance: Math.floor(this.posZ),
      posX: this.posX,
      posZ: this.posZ,
      vehicle: this.currentStage,
      biome: this.currentBiome.id,
      score: this.scoreState.currentScore,
      coins: this.scoreState.coinsCollected,
      timestamp: Date.now(),
    };

    soundManager.playCheckpointSave();
    this.callbacks.onCheckpointSaved?.(this.lastSavedCheckpoint);
    this.callbacks.onFloatingNotification('SAVED CURRENT POSITION 💾', undefined, 'pickup');
  }

  private recoverFromLastCheckpoint() {
    soundManager.playCrash();
    this.hitstopTimer = 0.12;
    this.cameraShakeIntensity = 0.6;

    if (this.lastSavedCheckpoint) {
      this.posZ = this.lastSavedCheckpoint.posZ;
      this.posX = 0;
      this.currentSpeed = VEHICLE_CONFIGS[this.currentStage].baseSpeed * 0.7;
      this.callbacks.onFloatingNotification('RESPAWNED AT CHECKPOINT! 💾', 'Progress Preserved', 'nearmiss');
    } else {
      this.posZ = Math.max(0, this.posZ - 20);
      this.posX = 0;
      this.currentSpeed = 10;
      this.callbacks.onFloatingNotification('RECOVERED ON ROAD! 🚗', undefined, 'nearmiss');
    }
  }

  // --- SKITCHING ---
  private findNearbySkitchTarget(): TrafficEntity | null {
    if (this.currentStage !== 'skateboard' || !this.isDriving) return null;
    const traffic = this.world.getTrafficList();
    for (const t of traffic) {
      if (!t.canSkitch) continue;
      const dz = t.z - this.posZ;
      const dx = Math.abs(t.x - this.posX);
      if (dz > 1.2 && dz < 5.0 && dx < 1.5) {
        return t;
      }
    }
    return null;
  }

  private attachSkitch(target: TrafficEntity) {
    this.isSkitching = true;
    this.skitchTarget = target;
    this.skitchTimer = 0;
    soundManager.playSkitchLatch();
    this.callbacks.onSkitchStateChange(true, target.type.toUpperCase());
    this.callbacks.onFloatingNotification('SKITCH LOCKED! 🪝', 'TOWING BEHIND CNG', 'skitch');
  }

  private breakSkitch(boost: boolean) {
    this.isSkitching = false;
    this.skitchTarget = null;
    soundManager.playSkitchRelease();
    this.callbacks.onSkitchStateChange(false);

    if (boost) {
      this.currentSpeed = VEHICLE_CONFIGS[this.currentStage].maxSpeed * 1.35;
      this.scoreState.currentScore += 300;
      this.callbacks.onFloatingNotification('SLINGSHOT BOOST! 🚀', '+300 PTS', 'skitch');
    }
  }

  // --- SIMULATION TICK ---
  private tick = () => {
    if (!this.isRunning) return;

    const rawDt = this.clock.getDelta();
    const delta = Math.min(rawDt, 0.05);
    this.totalElapsedTime += delta;

    if (!this.isPaused) {
      this.updateSimulation(delta);
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private updateSimulation(delta: number) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= delta;
      return;
    }

    const config = VEHICLE_CONFIGS[this.currentStage];

    // Cooldowns
    if (this.jumpCooldown > 0) this.jumpCooldown -= delta;
    if (this.slapCooldown > 0) this.slapCooldown -= delta;
    if (this.cameraAutoAlignTimer > 0) this.cameraAutoAlignTimer -= delta;

    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) this.isSliding = false;
    }

    // Check nearby vehicle for ENTER button prompt
    const spawnedVehicle = this.world.getPlayerSpawnedVehicle();
    if (spawnedVehicle) {
      const dist = Math.hypot(spawnedVehicle.x - this.posX, spawnedVehicle.z - this.posZ);
      if (dist <= 4.0) {
        this.callbacks.onVehicleNearby?.({ stage: spawnedVehicle.stage, x: spawnedVehicle.x, z: spawnedVehicle.z });
      } else {
        this.callbacks.onVehicleNearby?.(null);
      }
    } else {
      this.callbacks.onVehicleNearby?.(null);
    }

    // Vehicle Driving vs Walking Mechanics
    if (this.isDriving) {
      // Speed Dynamics:
      if (this.isSkitching && this.skitchTarget) {
        this.currentSpeed = this.skitchTarget.speed * 1.25;
        this.skitchTimer += delta;
        this.scoreState.skitchBonus += Math.floor(delta * 80);
        this.scoreState.currentScore += Math.floor(delta * 120);
        this.posX = THREE.MathUtils.damp(this.posX, this.skitchTarget.x, 12, delta);
        this.posZ = this.skitchTarget.z - 2.2;
        if (this.skitchTimer > 7.0) this.breakSkitch(true);
      } else {
        let targetSpeed = 0;

        // Gear-based speed target
        if (this.currentGear === 'P') {
          targetSpeed = 0;
        } else if (this.currentGear === 'N') {
          targetSpeed = 0; // coast
        } else if (this.currentGear === 'R') {
          if (this.isBrakePedalActive || this.inputSlide) {
            targetSpeed = 0;
          } else if (this.isGasPedalActive || this.inputBackward) {
            targetSpeed = -config.reverseSpeed;
          } else {
            targetSpeed = 0;
          }
        } else {
          // Gear 'D' (Drive)
          if (this.isBrakePedalActive || this.inputSlide) {
            targetSpeed = 0; // Strong realistic brakes
          } else if (this.isGasPedalActive || this.inputForward || (this.isTouching && !this.isCameraTouching)) {
            targetSpeed = config.maxSpeed; // Acceleration pedal
          } else {
            targetSpeed = config.baseSpeed * 0.75; // Smooth cruising
          }
        }

        const isDecelerating = Math.abs(this.currentSpeed) > Math.abs(targetSpeed) || (targetSpeed === 0 && Math.abs(this.currentSpeed) > 0.1);
        const speedLambda = (this.isBrakePedalActive || this.inputSlide)
          ? config.braking * 0.28
          : (isDecelerating ? config.braking * 0.14 : config.acceleration * 0.14);

        this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, targetSpeed, speedLambda, delta);
        this.posZ += this.currentSpeed * delta;
      }

      // Lateral Steering: supports keyboard keys and circular steering wheel drag
      const keySteer = (this.inputRight ? 1 : 0) - (this.inputLeft ? 1 : 0);
      const combinedSteer = this.steerWheelValue !== 0 ? this.steerWheelValue : keySteer;
      const steerForce = combinedSteer * config.turnSpeed + this.touchDragOffset * 24;
      this.touchDragOffset = 0;

      if (!this.isSkitching) {
        this.velocityX = THREE.MathUtils.damp(this.velocityX, steerForce, 16, delta);
        this.posX += this.velocityX * delta;

        // Road boundaries: keep player safely on the road
        const maxDist = Math.max(1.0, 5.4 - config.width * 0.5);
        if (this.posX > maxDist) {
          this.posX = maxDist;
          this.velocityX = Math.min(0, this.velocityX);
        } else if (this.posX < -maxDist) {
          this.posX = -maxDist;
          this.velocityX = Math.max(0, this.velocityX);
        }
      }
    } else {
      // Natural On-Foot Walking & Full Mobility (Relative to 360 Camera)
      // When FBX character is loaded and ready, remove the temporary stylized character
      if (this.fbxCharacter?.isReady && this.onFootCharacter) {
        this.playerGroup.remove(this.onFootCharacter.group);
        this.onFootCharacter = null;
      }

      const rawX = this.onFootJoystickX !== 0 ? this.onFootJoystickX : ((this.inputRight ? 1 : 0) - (this.inputLeft ? 1 : 0));
      const rawZ = this.onFootJoystickZ !== 0 ? this.onFootJoystickZ : ((this.inputForward ? 1 : 0) - (this.inputBackward ? 1 : 0));

      // Rotate inputs by camera yaw so moving forward moves in direction camera is facing
      const cosY = Math.cos(this.cameraYaw);
      const sinY = Math.sin(this.cameraYaw);
      const moveX = rawX * cosY + rawZ * sinY;
      const moveZ = -rawX * sinY + rawZ * cosY;
      const inputMag = Math.min(1.0, Math.hypot(rawX, rawZ));

      // Speed based on sneak/sprint state
      let walkSpeed = 5.0;
      if (this.isSneaking) {
        walkSpeed = 2.4;
      } else if (this.isSprinting) {
        walkSpeed = 8.6;
      }
      this.currentSpeed = inputMag * walkSpeed;

      this.posX += moveX * walkSpeed * delta;
      this.posZ += moveZ * walkSpeed * delta;

      // Soft road boundaries for on-foot exploration
      this.posX = Math.max(-6.8, Math.min(6.8, this.posX));

      // Rotate character model to face walking direction
      if (inputMag > 0.15) {
        this.onFootFacingAngle = Math.atan2(moveX, moveZ);
        this.playerGroup.rotation.y = THREE.MathUtils.damp(this.playerGroup.rotation.y, this.onFootFacingAngle, 12, delta);
      }

      // Footstep audio effects with alternating pitch
      if (this.currentSpeed > 0.4) {
        this.footstepTimer += delta;
        const stepInterval = this.isSneaking ? 0.6 : (this.isSprinting ? 0.28 : 0.44);
        if (this.footstepTimer >= stepInterval) {
          this.footstepTimer = 0;
          soundManager.playFootstep(this.isSneaking);
        }
      } else {
        this.footstepTimer = 0;
      }

      // Update FBX character model animations
      if (this.fbxCharacter) {
        this.fbxCharacter.update(delta, {
          speed: this.currentSpeed,
          isRunning: this.isSprinting,
          isJumping: this.isJumping,
          isSneaking: this.isSneaking,
          isDriving: false,
        });
      }

      // Fallback stylized character procedural animation if FBX still compiling
      if (this.onFootCharacter) {
        if (this.currentSpeed > 0.5) {
          const walkCycle = this.totalElapsedTime * (this.isSprinting ? 12 : 7);
          this.onFootCharacter.leftThigh.rotation.x = Math.sin(walkCycle) * 0.6;
          this.onFootCharacter.rightThigh.rotation.x = -Math.sin(walkCycle) * 0.6;
          this.onFootCharacter.leftArm.rotation.x = -Math.sin(walkCycle) * 0.5;
          this.onFootCharacter.rightArm.rotation.x = Math.sin(walkCycle) * 0.5;
        } else {
          this.onFootCharacter.leftThigh.rotation.x = 0;
          this.onFootCharacter.rightThigh.rotation.x = 0;
        }
      }
    }

    // Vertical Jump Physics
    if (this.isJumping) {
      const gravity = 28;
      this.velocityY -= gravity * delta;
      this.posY += this.velocityY * delta;
      if (this.posY <= 0) {
        this.posY = 0;
        this.velocityY = 0;
        this.isJumping = false;
      }
    }

    // Update Player 3D Group Position & Banking
    this.playerGroup.position.set(this.posX, this.posY, this.posZ);
    if (this.isDriving) {
      const targetRoll = -this.velocityX * 0.04;
      this.playerGroup.rotation.z = THREE.MathUtils.damp(this.playerGroup.rotation.z, targetRoll, 10, delta);
      this.playerGroup.rotation.y = THREE.MathUtils.damp(this.playerGroup.rotation.y, -this.velocityX * 0.02, 10, delta);
    }

    // Update Contact Shadow
    this.shadowPlane.position.set(this.posX, 0.03, this.posZ);
    const shadowAlpha = 0.55 * Math.max(0.1, 1 - this.posY / 3.0);
    (this.shadowPlane.material as THREE.MeshBasicMaterial).opacity = shadowAlpha;

    // Update Vehicle Animation
    if (this.vehicleBundle && this.isDriving) {
      this.vehicleBundle.updateAnimation(
        this.totalElapsedTime,
        this.currentSpeed,
        this.isJumping,
        this.isSliding,
        this.isSkitching,
        this.velocityX / config.turnSpeed,
      );
    }

    // Update Engine Audio
    if (this.isDriving) {
      const speedRatio = Math.abs(this.currentSpeed) / config.baseSpeed;
      soundManager.updateEnginePitch(speedRatio);
    }

    // Mileage & Progression
    this.distanceTraveledInStage += Math.abs(this.currentSpeed) * delta;
    this.scoreState.distance = Math.floor(Math.abs(this.posZ));
    this.scoreState.speedKmh = Math.floor(Math.abs(this.currentSpeed) * 3.6);
    this.scoreState.currentScore += Math.floor(Math.abs(this.currentSpeed) * delta * 2.5 * this.scoreState.multiplier);

    // Checkpoint Gate Passing Detection
    const checkpoints = this.world.getCheckpointsList();
    for (const cp of checkpoints) {
      if (!cp.passed && this.posZ >= cp.z) {
        cp.passed = true;
        this.handleCheckpointSave(cp);
      }
    }

    // Update World Segments, Curvature & Traffic AI
    this.world.update(this.posZ, delta, this.totalElapsedTime);

    // Update Biome Transition
    const currentBiome = this.world.getCurrentBiome(this.posZ);
    if (currentBiome.id !== this.currentBiome.id) {
      this.currentBiome = currentBiome;
      this.scene.background = new THREE.Color(currentBiome.skyColor);
      (this.scene.fog as THREE.FogExp2).color = new THREE.Color(currentBiome.fogColor);
      (this.scene.fog as THREE.FogExp2).density = currentBiome.fogDensity;
      this.callbacks.onBiomeChange?.(currentBiome);
    }

    // Lighting follows player
    this.dirLight.position.set(this.posX + 25, 45, this.posZ + 30);
    this.dirLight.target.position.set(this.posX, 0, this.posZ);

    // 360-Degree Camera Update
    this.update360Camera(delta, config);

    // Collision Detection
    this.handleCollisions(config);

    // Broadcast multiplayer state
    multiplayerService.broadcastState({
      posX: this.posX,
      posY: this.posY,
      posZ: this.posZ,
      speed: this.currentSpeed,
      rotationY: this.playerGroup.rotation.y,
      rotationZ: this.playerGroup.rotation.z,
      vehicle: this.currentStage,
      isDriving: this.isDriving,
      score: this.scoreState.currentScore,
      distance: this.scoreState.distance,
      lastCheckpoint: this.lastSavedCheckpoint?.checkpointId || 0,
    });

    // Push HUD updates
    this.callbacks.onScoreUpdate(this.scoreState);

    // Push Minimap updates
    const minimapEntities = this.world.getMinimapData(this.posZ);
    this.callbacks.onMinimapUpdate?.(minimapEntities, this.currentBiome.name);
  }

  // --- CAMERA UPDATE (LOCKED BEHIND VEHICLE WHEN DRIVING, 360 ON FOOT) ---
  private update360Camera(delta: number, config: (typeof VEHICLE_CONFIGS)[VehicleStage]) {
    if (this.cameraShakeIntensity > 0) {
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 1.5);
    }
    const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
    const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;

    if (this.isDriving) {
      // CRITICAL: Strictly lock camera behind vehicle while driving, no 360 spin
      this.cameraYaw = 0;
      this.cameraPitch = 0.20;
    }

    const camDist = this.isDriving ? config.cameraDistance : 4.5;
    const camHeight = this.isDriving ? config.cameraHeight : 1.8;

    // Look target on player
    _camLookTarget.set(
      this.posX,
      Math.max(0.6, this.posY * 0.4 + camHeight * 0.4),
      this.posZ,
    );

    // Spherical coordinates for 360 camera position around player
    const cosPitch = Math.cos(this.cameraPitch);
    const sinPitch = Math.sin(this.cameraPitch);
    const sinYaw = Math.sin(this.cameraYaw);
    const cosYaw = Math.cos(this.cameraYaw);

    const targetX = _camLookTarget.x + camDist * cosPitch * sinYaw + shakeX;
    const targetY = _camLookTarget.y + camDist * sinPitch + (camHeight * 0.3) + shakeY;
    const targetZ = _camLookTarget.z - camDist * cosPitch * cosYaw;

    // Smooth exponential damping
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, 15, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetY, 15, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetZ, 15, delta);

    this.currentLookTarget.x = THREE.MathUtils.damp(this.currentLookTarget.x, _camLookTarget.x, 16, delta);
    this.currentLookTarget.y = THREE.MathUtils.damp(this.currentLookTarget.y, _camLookTarget.y, 16, delta);
    this.currentLookTarget.z = THREE.MathUtils.damp(this.currentLookTarget.z, _camLookTarget.z, 16, delta);

    this.camera.lookAt(this.currentLookTarget);
  }

  // --- COLLISIONS ---
  private handleCollisions(config: (typeof VEHICLE_CONFIGS)[VehicleStage]) {
    // 1. Vehicle Pickup Collision
    const activePickup = this.world.getActivePickup();
    if (activePickup && !activePickup.collected) {
      const dx = Math.abs(activePickup.x - this.posX);
      const dz = Math.abs(activePickup.z - this.posZ);
      if (dx < 1.9 && dz < 2.4) {
        activePickup.collected = true;
        this.world.removeActivePickup();
        soundManager.playVehicleUpgrade();
        this.enterVehicle(activePickup.targetVehicle);
      }
    }

    // 2. Coin Collectibles
    const coins = this.world.getCoinsList();
    for (const coin of coins) {
      if (coin.collected) continue;
      const dx = Math.abs(coin.x - this.posX);
      const dy = Math.abs(coin.y - (this.posY + 0.6));
      const dz = Math.abs(coin.z - this.posZ);

      if (dx < 1.5 && dz < 1.7 && dy < 1.6) {
        coin.collected = true;
        this.scoreState.coinsCollected += 1;
        this.scoreState.currentScore += 50 * this.scoreState.multiplier;
        soundManager.playCoin();
      }
    }

    // 3. Obstacles Collision
    const obstacles = this.world.getObstaclesList();
    for (const obs of obstacles) {
      const dx = Math.abs(obs.x - this.posX);
      const dz = Math.abs(obs.z - this.posZ);

      if (dx < (obs.width / 2 + config.width / 2) * 0.75 && dz < (obs.length / 2 + config.length / 2) * 0.75) {
        if (obs.canDuckUnder && this.isSliding) {
          this.scoreState.currentScore += 200;
          this.callbacks.onFloatingNotification('DUCKED UNDER! 🕶️', '+200 PTS', 'nearmiss');
          continue;
        }

        if (this.posY > obs.height * 0.85) {
          this.scoreState.currentScore += 150;
          this.callbacks.onFloatingNotification('CLEARED OBSTACLE! 🛹', '+150 PTS', 'nearmiss');
          continue;
        }

        this.handleCrash(`Crashed into roadside ${obs.type.replace('_', ' ')}!`);
        return;
      }
    }

    // 4. Traffic Vehicles Collision
    const traffic = this.world.getTrafficList();
    for (const t of traffic) {
      if (this.isSkitching && this.skitchTarget === t) continue;

      const dx = Math.abs(t.x - this.posX);
      const dz = Math.abs(t.z - this.posZ);

      // Near miss bonus
      if (dx < 2.5 && dz < 2.0 && dx > (t.width + config.width) * 0.45) {
        this.scoreState.nearMisses += 1;
        this.scoreState.multiplier = Math.min(5.0, this.scoreState.multiplier + 0.1);
        this.scoreState.currentScore += 100;
        soundManager.playNearMiss();
      }

      // Hard Collision
      if (dx < (t.width + config.width) * 0.42 && dz < (t.length + config.length) * 0.42) {
        if (this.posY > t.height * 0.88) {
          this.scoreState.currentScore += 500;
          this.callbacks.onFloatingNotification('ROOF HOP! 🔥', '+500 PTS', 'nearmiss');
        } else {
          this.handleCrash(`Collision with ${t.type.toUpperCase()}!`);
          return;
        }
      }
    }
  }

  private handleCrash(reason: string) {
    if (this.gameMode === 'runner') {
      // OFFLINE ENDLESS RUNNER: Strict Game Over rule (restart from 0 on game over modal)
      this.isRunning = false;
      soundManager.playCrash();
      this.hitstopTimer = 0.15;
      this.cameraShakeIntensity = 0.8;
      this.callbacks.onGameOver(this.scoreState, reason);
    } else {
      // ONLINE FREE ROAM & VERSUS: Collisions recover player at last saved checkpoint!
      this.recoverFromLastCheckpoint();
    }
  }

  // --- ACTIONS ---
  public triggerJump() {
    const config = VEHICLE_CONFIGS[this.currentStage];
    if (this.jumpCooldown <= 0 && !this.isJumping) {
      this.isJumping = true;
      this.velocityY = config.jumpForce;
      this.jumpCooldown = 0.35;
      soundManager.playJump();

      if (this.isSkitching) {
        this.breakSkitch(true);
      }
    }
  }

  public triggerSlide() {
    const config = VEHICLE_CONFIGS[this.currentStage];
    if (config.canSlide && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = 0.75;
      soundManager.playSlide();
    }
  }

  public triggerHorn() {
    soundManager.playHorn(this.currentStage);
    this.callbacks.onFloatingNotification('HORN! 📢', undefined, 'pickup');
  }

  public triggerAction() {
    this.handleInteractOrAction();
  }

  // --- REALISTIC VEHICLE COCKPIT SETTERS ---
  public setVehicleGear(gear: 'P' | 'R' | 'N' | 'D') {
    this.currentGear = gear;
  }

  public setGasPedal(active: boolean) {
    this.isGasPedalActive = active;
  }

  public setBrakePedal(active: boolean) {
    this.isBrakePedalActive = active;
  }

  public setSteerWheel(val: number) {
    this.steerWheelValue = Math.max(-1, Math.min(1, val));
  }

  // --- NATURAL ON-FOOT PEDESTRIAN SETTERS ---
  public setOnFootMove(normX: number, normZ: number) {
    this.onFootJoystickX = normX;
    this.onFootJoystickZ = normZ;
  }

  public setOnFootSprint(isSprinting: boolean) {
    this.isSprinting = isSprinting;
  }

  public setOnFootSneak(isSneaking: boolean) {
    this.isSneaking = isSneaking;
  }

  public triggerOnFootGesture() {
    soundManager.playVocalShout();
    if (this.fbxCharacter) {
      this.fbxCharacter.triggerGesture();
    }
    this.callbacks.onFloatingNotification('EI BHAI! 🗣️', 'Waving and Calling Out', 'pickup');
  }

  public dispose() {
    this.stop();
    multiplayerService.dispose();

    const el = this.renderer.domElement;
    el.removeEventListener('touchstart', this.handleTouchStart);
    el.removeEventListener('touchmove', this.handleTouchMove);
    el.removeEventListener('touchend', this.handleTouchEnd);
    el.removeEventListener('touchcancel', this.handleTouchEnd);
    el.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.handleBlur);

    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
