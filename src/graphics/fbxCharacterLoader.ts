/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export interface FBXCharacterInstance {
  root: THREE.Group;
  update: (delta: number, state: CharacterAnimState) => void;
  triggerGesture: () => void;
  isReady: boolean;
}

export interface CharacterAnimState {
  speed: number;
  isRunning: boolean;
  isJumping: boolean;
  isSneaking: boolean;
  isDriving: boolean;
  steerAngle?: number;
}

export class FBXCharacterManager {
  private loader: FBXLoader;
  private cachedObject: THREE.Group | null = null;
  private cachedClips: THREE.AnimationClip[] = [];
  private isLoading = false;
  private loadPromise: Promise<{ object: THREE.Group; clips: THREE.AnimationClip[] }> | null = null;

  constructor() {
    this.loader = new FBXLoader();
  }

  public async preload(): Promise<void> {
    if (this.cachedObject || this.isLoading) return;
    this.isLoading = true;

    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : base + '/';
    const modelUrl = `${cleanBase}models/characters/Character_Animated%20(1).fbx`;

    try {
      const fbx = await new Promise<THREE.Group>((resolve, reject) => {
        this.loader.load(
          modelUrl,
          (obj) => resolve(obj),
          undefined,
          (err) => {
            // Also try unencoded fallback
            this.loader.load(
              `${cleanBase}models/characters/Character_Animated (1).fbx`,
              (obj2) => resolve(obj2),
              undefined,
              (err2) => reject(err2 || err),
            );
          },
        );
      });

      this.cachedObject = fbx;
      this.cachedClips = fbx.animations || [];
      this.isLoading = false;
    } catch (err) {
      console.warn('FBX character load failed, falling back to stylized avatar:', err);
      this.isLoading = false;
    }
  }

  public createInstance(): FBXCharacterInstance {
    const group = new THREE.Group();
    let mixer: THREE.AnimationMixer | null = null;
    let actions: {
      idle?: THREE.AnimationAction;
      walk?: THREE.AnimationAction;
      run?: THREE.AnimationAction;
      roll?: THREE.AnimationAction;
      punch?: THREE.AnimationAction;
      pickup?: THREE.AnimationAction;
    } = {};
    let currentAction: THREE.AnimationAction | null = null;
    let isGesturing = false;
    let gestureTimer = 0;
    let isReady = false;

    const setupClips = (clonedFbx: THREE.Group, clips: THREE.AnimationClip[]) => {
      // Scale to realistic human height (~1.78m)
      clonedFbx.scale.set(0.0062, 0.0062, 0.0062);
      clonedFbx.position.set(0, 0, 0);

      clonedFbx.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if (m instanceof THREE.MeshStandardMaterial) {
                m.roughness = 0.65;
                m.metalness = 0.08;
              }
            });
          }
        }
      });

      group.add(clonedFbx);
      mixer = new THREE.AnimationMixer(clonedFbx);

      const findClip = (regex: RegExp) => {
        return clips.find((c) => regex.test(c.name));
      };

      const idleClip = findClip(/idle/i) || clips[3] || clips[0];
      const walkClip = findClip(/walk/i) || clips[12] || clips[1];
      const runClip = findClip(/run/i) || clips[0] || clips[2];
      const rollClip = findClip(/roll/i) || clips[6];
      const punchClip = findClip(/punch/i) || clips[7] || clips[13];
      const pickupClip = findClip(/pickup/i) || clips[22];

      if (idleClip) actions.idle = mixer.clipAction(idleClip);
      if (walkClip) actions.walk = mixer.clipAction(walkClip);
      if (runClip) actions.run = mixer.clipAction(runClip);
      if (rollClip) {
        actions.roll = mixer.clipAction(rollClip);
        actions.roll.setLoop(THREE.LoopOnce, 1);
        actions.roll.clampWhenFinished = true;
      }
      if (punchClip) {
        actions.punch = mixer.clipAction(punchClip);
        actions.punch.setLoop(THREE.LoopOnce, 1);
      }
      if (pickupClip) {
        actions.pickup = mixer.clipAction(pickupClip);
      }

      if (actions.idle) {
        actions.idle.play();
        currentAction = actions.idle;
      }

      isReady = true;
    };

    if (this.cachedObject) {
      // Clone from cache
      const clone = this.cachedObject.clone(true);
      // Animation clips need to be shared
      setupClips(clone, this.cachedClips);
    } else {
      // Load asynchronously and attach once loaded
      this.preload().then(() => {
        if (this.cachedObject) {
          const clone = this.cachedObject.clone(true);
          setupClips(clone, this.cachedClips);
        }
      });
    }

    const switchAction = (newAction?: THREE.AnimationAction, fadeTime = 0.25) => {
      if (!newAction || newAction === currentAction) return;
      if (currentAction) {
        currentAction.fadeOut(fadeTime);
      }
      newAction.reset().fadeIn(fadeTime).play();
      currentAction = newAction;
    };

    return {
      root: group,
      get isReady() {
        return isReady;
      },
      triggerGesture: () => {
        if (actions.punch) {
          isGesturing = true;
          gestureTimer = 0.75;
          switchAction(actions.punch, 0.15);
        }
      },
      update: (delta: number, state: CharacterAnimState) => {
        if (mixer) {
          mixer.update(delta);
        }

        if (!isReady) return;

        if (isGesturing) {
          gestureTimer -= delta;
          if (gestureTimer <= 0) {
            isGesturing = false;
          } else {
            return;
          }
        }

        if (state.isJumping) {
          if (actions.roll && currentAction !== actions.roll) {
            switchAction(actions.roll, 0.12);
          }
          return;
        }

        if (state.isSneaking) {
          if (actions.pickup && currentAction !== actions.pickup) {
            switchAction(actions.pickup, 0.25);
          } else if (actions.walk && currentAction !== actions.walk) {
            actions.walk.timeScale = 0.55;
            switchAction(actions.walk, 0.25);
          }
          return;
        }

        // Speed based walking vs running
        if (state.speed > 5.5 || state.isRunning) {
          if (actions.run && currentAction !== actions.run) {
            actions.run.timeScale = 1.1;
            switchAction(actions.run, 0.2);
          }
        } else if (state.speed > 0.4) {
          if (actions.walk && currentAction !== actions.walk) {
            actions.walk.timeScale = 1.0;
            switchAction(actions.walk, 0.2);
          }
        } else {
          if (actions.idle && currentAction !== actions.idle) {
            switchAction(actions.idle, 0.3);
          }
        }
      },
    };
  }
}

export const fbxCharacterManager = new FBXCharacterManager();
