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
  GameScoreState,
  GameSettings,
  MinimapEntity,
} from '../types/game';
import { soundManager } from '../audio/soundManager';
import { WorldManager, ROAD_LANES, TrafficEntity } from '../world/worldManager';
import {
  createSkateboardModel,
  createBicycleModel,
  createMotorcycleModel,
  createAutoRickshawModel,
  createCngModel,
  createBusModel,
  VehicleMeshBundle,
} from '../models/vehicleModels';

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

  // Player Vehicle State
  private currentStage: VehicleStage = 'skateboard';
  private vehicleBundle: VehicleMeshBundle | null = null;
  private playerGroup: THREE.Group;
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

  // Skitch Mechanic (Skateboard towing behind CNG)
  private isSkitching = false;
  private skitchTarget: TrafficEntity | null = null;
  private skitchTimer = 0;

  // Slap / Bump Mechanic
  private slapCooldown = 0;

  // Hitstop & Camera Shake
  private hitstopTimer = 0;
  private cameraShakeIntensity = 0;

  // Next-Vehicle Progression Milestone
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
  };

  // Touch Gesture Tracking State
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTouchX = 0;
  private isTouching = false;
  private touchDragOffset = 0;
  public touchSensitivity = 1.0;

  // Desktop Keyboard Input State
  private inputLeft = false;
  private inputRight = false;
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

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 900);

    // 4. Studio Environment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Safe fallback
    }

    // 5. Lighting Rig
    this.initLighting();

    // 6. Player Root Container
    this.playerGroup = new THREE.Group();
    this.scene.add(this.playerGroup);

    // 7. Ground Contact Shadow
    this.initContactShadow();

    // 8. World Manager
    this.world = new WorldManager(this.scene);

    // Initial Mount & Camera Placement so Title Screen has live 3D road and scenery immediately!
    this.mountVehicleModel('skateboard');
    this.world.initWorld();
    const initCfg = VEHICLE_CONFIGS['skateboard'];
    this.camera.position.set(0, initCfg.cameraHeight, -initCfg.cameraDistance);
    this.camera.lookAt(0, 1.2, 12.0);
    this.renderer.render(this.scene, this.camera);

    // 9. Input & Touch Gesture Listeners
    this.initInputListeners();
  }

  private initLighting() {
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.dirLight.position.set(25, 45, 30);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 160;
    const d = 25;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x15803d, 0.7);
    this.scene.add(this.hemiLight);
  }

  private initContactShadow() {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0,0,0,0.7)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.2), shadowMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = 0.03;
    this.scene.add(this.shadowPlane);
  }

  // --- TOUCH GESTURE & KEYBOARD LISTENERS ---
  private initInputListeners() {
    const el = this.renderer.domElement;

    // DIRECT FINGER TOUCH CONTROLS
    el.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    el.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    el.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    el.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });

    // Desktop Keyboard Listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (this.isPaused || e.touches.length === 0) return;

    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.lastTouchX = touch.clientX;
    this.touchStartTime = performance.now();
    this.isTouching = true;
    this.touchDragOffset = 0;
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.isTouching || this.isPaused || e.touches.length === 0) return;

    const touch = e.touches[0];
    const dx = touch.clientX - this.lastTouchX;
    this.lastTouchX = touch.clientX;

    // Direct finger steering:
    // Dragging right (dx > 0) unambiguously steers right (+X)
    // Dragging left (dx < 0) unambiguously steers left (-X)
    const screenWidth = Math.max(320, window.innerWidth || 400);
    const steerDelta = (dx / screenWidth) * 16 * this.touchSensitivity;
    this.touchDragOffset += steerDelta;

    if (Math.abs(dx) > 3) {
      this.callbacks.onGestureDetected?.();
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.isTouching) return;
    this.isTouching = false;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const totalDx = touch.clientX - this.touchStartX;
    const totalDy = touch.clientY - this.touchStartY;
    const duration = performance.now() - this.touchStartTime;

    // Horizontal Swipe Right: Quick Lane Change Right
    if (totalDx > 35 && Math.abs(totalDx) > Math.abs(totalDy) * 1.1 && duration < 350) {
      const config = VEHICLE_CONFIGS[this.currentStage];
      this.velocityX = Math.max(this.velocityX, 0) + config.turnSpeed * 1.4;
      this.touchDragOffset = 0;
      this.callbacks.onGestureDetected?.();
      return;
    }

    // Horizontal Swipe Left: Quick Lane Change Left
    if (totalDx < -35 && Math.abs(totalDx) > Math.abs(totalDy) * 1.1 && duration < 350) {
      const config = VEHICLE_CONFIGS[this.currentStage];
      this.velocityX = Math.min(this.velocityX, 0) - config.turnSpeed * 1.4;
      this.touchDragOffset = 0;
      this.callbacks.onGestureDetected?.();
      return;
    }

    // Swipe Up detection (Jump / Ollie)
    if (totalDy < -35 && Math.abs(totalDy) > Math.abs(totalDx) * 0.8 && duration < 400) {
      this.triggerJump();
      this.touchDragOffset = 0;
      this.callbacks.onGestureDetected?.();
      return;
    }

    // Swipe Down detection (Crouch / Slide / Brake)
    if (totalDy > 35 && Math.abs(totalDy) > Math.abs(totalDx) * 0.8 && duration < 400) {
      this.triggerSlide();
      this.touchDragOffset = 0;
      this.callbacks.onGestureDetected?.();
      return;
    }

    // Quick Tap detection (Skitch / Slap / Action)
    if (Math.abs(totalDx) < 15 && Math.abs(totalDy) < 15 && duration < 250) {
      this.triggerAction();
      this.callbacks.onGestureDetected?.();
    }

    this.touchDragOffset = 0;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.isPaused) return;

    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      this.inputLeft = true;
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      this.inputRight = true;
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
      if (!this.inputJump) {
        this.triggerJump();
      }
      this.inputJump = true;
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      if (!this.inputSlide) {
        this.triggerSlide();
      }
      this.inputSlide = true;
    } else if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.triggerAction();
    } else if (e.code === 'KeyH') {
      this.triggerHorn();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      this.inputLeft = false;
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      this.inputRight = false;
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
      this.inputJump = false;
    } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      this.inputSlide = false;
    }
  };

  private handleBlur = () => {
    this.inputLeft = false;
    this.inputRight = false;
    this.inputJump = false;
    this.inputSlide = false;
    this.isTouching = false;
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
    const config = VEHICLE_CONFIGS[this.currentStage];

    // Skitching on Skateboard
    if (config.canSkitch) {
      if (this.isSkitching) {
        this.breakSkitch(true);
        return;
      } else {
        const target = this.findNearbySkitchTarget();
        if (target) {
          this.attachSkitch(target);
          return;
        }
      }
    }

    // Arcade SLAP / BUMP
    if (this.slapCooldown <= 0) {
      this.performSlapInteraction();
    }
  }

  private performSlapInteraction() {
    this.slapCooldown = 0.45;
    soundManager.playSlap();

    let slapped = false;
    const traffic = this.world.getTrafficList();
    for (const t of traffic) {
      const dx = Math.abs(t.x - this.posX);
      const dz = Math.abs(t.z - this.posZ);
      if (dx < 2.4 && dz < 2.5) {
        slapped = true;
        t.x += t.x > this.posX ? 0.9 : -0.9;
        t.mesh.position.x = t.x;
        this.scoreState.currentScore += 150;
        this.callbacks.onFloatingNotification('+150 SLAP! 👋', undefined, 'slap');
        break;
      }
    }

    if (!slapped) {
      this.callbacks.onFloatingNotification('SWIPE!', undefined, 'slap');
    }
  }

  // --- START & RESET ---
  public start(startingStage: VehicleStage = 'skateboard') {
    this.currentStage = startingStage;
    this.posX = 0;
    this.posY = 0;
    this.posZ = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.currentSpeed = VEHICLE_CONFIGS[this.currentStage].baseSpeed;
    this.isJumping = false;
    this.isSliding = false;
    this.isSkitching = false;
    this.skitchTarget = null;
    this.skitchTimer = 0;
    this.distanceTraveledInStage = 0;
    this.vehiclePickupSpawned = false;
    this.hitstopTimer = 0;
    this.cameraShakeIntensity = 0;
    this.touchDragOffset = 0;

    this.scoreState = {
      currentScore: 0,
      distance: 0,
      coinsCollected: 0,
      multiplier: 1.0,
      combo: 0,
      nearMisses: 0,
      skitchBonus: 0,
      speedKmh: 0,
    };

    this.mountVehicleModel(this.currentStage);
    this.world.initWorld();

    const config = VEHICLE_CONFIGS[this.currentStage];
    this.camera.position.set(0, config.cameraHeight, -config.cameraDistance);
    this.camera.lookAt(0, config.cameraHeight * 0.35, 12.0);

    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    this.totalElapsedTime = 0;

    soundManager.startEngine(this.currentStage);
    soundManager.startMusic();

    this.callbacks.onVehicleChange(this.currentStage, false);
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
    soundManager.startEngine(this.currentStage);
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

  private mountVehicleModel(stage: VehicleStage) {
    while (this.playerGroup.children.length > 0) {
      this.playerGroup.remove(this.playerGroup.children[0]);
    }

    let bundle: VehicleMeshBundle;
    if (stage === 'skateboard') {
      bundle = createSkateboardModel();
    } else if (stage === 'bicycle') {
      bundle = createBicycleModel();
    } else if (stage === 'motorcycle') {
      bundle = createMotorcycleModel();
    } else if (stage === 'autorickshaw') {
      bundle = createAutoRickshawModel();
    } else if (stage === 'cng') {
      bundle = createCngModel();
    } else {
      bundle = createBusModel();
    }

    this.vehicleBundle = bundle;
    this.playerGroup.add(bundle.root);

    const config = VEHICLE_CONFIGS[stage];
    this.camera.fov = config.cameraFov;
    this.camera.updateProjectionMatrix();

    this.shadowPlane.scale.set(config.width * 1.3, config.length * 1.3, 1);
  }

  // --- VEHICLE PICKUP COLLECTION ---
  private collectVehiclePickup(targetVehicle: VehicleStage) {
    this.world.removeActivePickup();
    this.vehiclePickupSpawned = false;
    this.distanceTraveledInStage = 0;

    soundManager.playVehicleUpgrade();
    this.hitstopTimer = 0.08;
    this.cameraShakeIntensity = 0.35;

    this.currentStage = targetVehicle;
    this.mountVehicleModel(this.currentStage);
    soundManager.startEngine(this.currentStage);

    this.scoreState.currentScore += 1000;
    this.scoreState.multiplier += 0.5;

    const config = VEHICLE_CONFIGS[this.currentStage];
    this.callbacks.onFloatingNotification(
      `UPGRADED: ${config.name.toUpperCase()}!`,
      `নতুন বাহন: ${config.bengaliName}`,
      'pickup',
    );
    this.callbacks.onVehicleChange(this.currentStage, true);
  }

  // --- SKITCH MECHANIC ---
  private findNearbySkitchTarget(): TrafficEntity | null {
    if (this.currentStage !== 'skateboard') return null;

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

    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Forward Movement & Speed: Realistic Acceleration & Rolling Friction Deceleration
    if (this.isSkitching && this.skitchTarget) {
      this.currentSpeed = this.skitchTarget.speed * 1.25;
      this.skitchTimer += delta;
      this.scoreState.skitchBonus += Math.floor(delta * 80);
      this.scoreState.currentScore += Math.floor(delta * 120);

      this.posX = THREE.MathUtils.damp(this.posX, this.skitchTarget.x, 12, delta);
      this.posZ = this.skitchTarget.z - 2.2;

      if (this.skitchTimer > 7.0) {
        this.breakSkitch(true);
      }
    } else {
      // Natural speed dynamics:
      // - Holding finger on screen or pressing W/Up accelerates vehicle toward maxSpeed
      // - Sliding or pressing S/Down applies strong brakes down to 4.0 m/s
      // - Releasing finger/keys lets road friction naturally decelerate vehicle down to baseSpeed (coasting)
      let targetSpeed = config.baseSpeed;
      if (this.isSliding || this.inputSlide) {
        targetSpeed = 4.0; // Active braking
      } else if (this.isTouching || this.inputJump) {
        targetSpeed = config.maxSpeed; // Active acceleration / pushing
      }

      // Smooth acceleration and realistic friction braking
      const isDecelerating = this.currentSpeed > targetSpeed;
      const speedLambda = isDecelerating ? 3.0 : (config.acceleration * 0.12);
      this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, targetSpeed, speedLambda, delta);
      this.posZ += this.currentSpeed * delta;
    }

    // Lateral Steering: Direct finger touch drag + desktop keyboard
    const keySteer = (this.inputRight ? 1 : 0) - (this.inputLeft ? 1 : 0);
    const steerForce = keySteer * config.turnSpeed + this.touchDragOffset * 24;
    this.touchDragOffset = 0; // consumed

    if (!this.isSkitching) {
      this.velocityX = THREE.MathUtils.damp(this.velocityX, steerForce, 16, delta);
      this.posX += this.velocityX * delta;

      // Strict road boundary enforcement:
      // Drivable road width is 12m (-5.2m to +5.2m). Prevent entering roadside buildings!
      const maxDist = Math.max(1.0, 5.2 - config.width * 0.5);
      if (this.posX > maxDist) {
        this.posX = maxDist;
        this.velocityX = Math.min(0, this.velocityX);
      } else if (this.posX < -maxDist) {
        this.posX = -maxDist;
        this.velocityX = Math.max(0, this.velocityX);
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

    // Update Player 3D Group Position & Banking Lean
    this.playerGroup.position.set(this.posX, this.posY, this.posZ);
    const targetRoll = -this.velocityX * 0.04;
    this.playerGroup.rotation.z = THREE.MathUtils.damp(this.playerGroup.rotation.z, targetRoll, 10, delta);
    this.playerGroup.rotation.y = THREE.MathUtils.damp(this.playerGroup.rotation.y, -this.velocityX * 0.02, 10, delta);

    // Update Contact Shadow
    this.shadowPlane.position.set(this.posX, 0.03, this.posZ);
    const shadowAlpha = 0.55 * Math.max(0.1, 1 - this.posY / 3.0);
    (this.shadowPlane.material as THREE.MeshBasicMaterial).opacity = shadowAlpha;

    // Update Vehicle Animation
    if (this.vehicleBundle) {
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
    const speedRatio = this.currentSpeed / config.baseSpeed;
    soundManager.updateEnginePitch(speedRatio);

    // Mileage & Progression
    this.distanceTraveledInStage += this.currentSpeed * delta;
    this.scoreState.distance = Math.floor(this.posZ);
    this.scoreState.speedKmh = Math.floor(this.currentSpeed * 3.6);
    this.scoreState.currentScore += Math.floor(this.currentSpeed * delta * 2.5 * this.scoreState.multiplier);

    // Milestone Check to Spawn Vehicle Pickup
    const currentIdx = VEHICLE_STAGES.indexOf(this.currentStage);
    const nextIdx = (currentIdx + 1) % VEHICLE_STAGES.length;
    const nextStage = VEHICLE_STAGES[nextIdx];

    if (!this.vehiclePickupSpawned && this.distanceTraveledInStage >= config.requiredMilestone) {
      const spawned = this.world.spawnVehiclePickup(nextStage, this.posZ);
      if (spawned) {
        this.vehiclePickupSpawned = true;
        this.callbacks.onPickupAvailable(nextStage, 100);
        this.callbacks.onFloatingNotification(
          'VEHICLE PICKUP IN SIGHT! 🌟',
          `STEER TO COLLECT: ${VEHICLE_CONFIGS[nextStage].name.toUpperCase()}`,
          'pickup',
        );
      }
    }

    // Check Skitch Availability for Skateboard
    if (config.canSkitch && !this.isSkitching) {
      const target = this.findNearbySkitchTarget();
      this.callbacks.onSkitchStateChange(false, target ? 'CNG IN RANGE! TAP ACTION' : undefined);
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
      this.callbacks.onFloatingNotification(
        `ENTERING: ${currentBiome.name.toUpperCase()}`,
        currentBiome.bengaliName,
        'nearmiss',
      );
    }

    // Lighting follows player
    this.dirLight.position.set(this.posX + 25, 45, this.posZ + 30);
    this.dirLight.target.position.set(this.posX, 0, this.posZ);

    // Smooth Camera Follow
    this.updateCamera(delta, config);

    // Collision Detection
    this.handleCollisions(config);

    // Push HUD updates
    this.callbacks.onScoreUpdate(this.scoreState);

    // Push Minimap updates
    const minimapEntities = this.world.getMinimapData(this.posZ);
    this.callbacks.onMinimapUpdate?.(minimapEntities, this.currentBiome.name);
  }

  private updateCamera(delta: number, config: (typeof VEHICLE_CONFIGS)[VehicleStage]) {
    if (this.cameraShakeIntensity > 0) {
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 1.5);
    }

    const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
    const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;

    // Centered directly on player X with zero horizontal perspective distortion
    _camPosTarget.set(
      this.posX + shakeX,
      Math.max(1.8, this.posY * 0.4 + config.cameraHeight + shakeY),
      this.posZ - config.cameraDistance,
    );

    _camLookTarget.set(
      this.posX,
      Math.max(0.8, this.posY * 0.4 + config.cameraHeight * 0.35),
      this.posZ + 12.0,
    );

    // Rigid Z lock: the camera NEVER lags behind the player on Z
    this.camera.position.z = this.posZ - config.cameraDistance;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camPosTarget.x, 16, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camPosTarget.y, 14, delta);

    this.camera.lookAt(_camLookTarget);
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
        this.collectVehiclePickup(activePickup.targetVehicle);
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
        // Crouch under high wire barrier
        if (obs.canDuckUnder && this.isSliding) {
          this.scoreState.currentScore += 200;
          this.callbacks.onFloatingNotification('DUCKED UNDER! 🕶️', '+200 PTS', 'nearmiss');
          continue;
        }

        // Jump over low barrier
        if (this.posY > obs.height * 0.85) {
          this.scoreState.currentScore += 150;
          this.callbacks.onFloatingNotification('CLEARED OBSTACLE! 🛹', '+150 PTS', 'nearmiss');
          continue;
        }

        this.triggerCrash(`Crashed into roadside ${obs.type.replace('_', ' ')}!`);
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
        this.callbacks.onFloatingNotification('NEAR MISS! 💨', '+100 PTS', 'nearmiss');
      }

      // Hard Collision
      if (dx < (t.width + config.width) * 0.42 && dz < (t.length + config.length) * 0.42) {
        if (this.posY > t.height * 0.88) {
          // Roof Hop Stunt!
          this.scoreState.currentScore += 500;
          this.callbacks.onFloatingNotification('ROOF HOP! 🔥', '+500 PTS', 'nearmiss');
        } else {
          this.triggerCrash(`Collision with ${t.type.toUpperCase()}!`);
          return;
        }
      }
    }
  }

  private triggerCrash(reason: string) {
    this.isRunning = false;
    soundManager.playCrash();
    this.hitstopTimer = 0.15;
    this.cameraShakeIntensity = 0.8;
    this.callbacks.onGameOver(this.scoreState, reason);
  }

  public dispose() {
    this.stop();
    const el = this.renderer.domElement;
    el.removeEventListener('touchstart', this.handleTouchStart);
    el.removeEventListener('touchmove', this.handleTouchMove);
    el.removeEventListener('touchend', this.handleTouchEnd);
    el.removeEventListener('touchcancel', this.handleTouchEnd);

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
