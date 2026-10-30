/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import {
  VehicleStage,
  VEHICLE_CONFIGS,
  VEHICLE_STAGES,
  GameScoreState,
  GameSettings,
  PlayerStats,
  MinimapEntity,
  BiomeConfig,
  BIOME_CONFIGS,
  BiomeType,
  GameMode,
  VersusMatchFormat,
  SavedCheckpoint,
} from './types/game';
import { soundManager } from './audio/soundManager';
import { multiplayerService } from './multiplayer/multiplayerService';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { GarageModal } from './components/GarageModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { SettingsModal } from './components/SettingsModal';
import { InGameSmartphone } from './components/InGameSmartphone';
import { MapSelectModal } from './components/MapSelectModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { VehicleCockpit } from './components/VehicleCockpit';
import { OnFootControls } from './components/OnFootControls';

const STATS_STORAGE_KEY = 'endless_ride_bangladesh_stats_v3';
const SETTINGS_STORAGE_KEY = 'endless_ride_bangladesh_settings_v3';

const DEFAULT_STATS: PlayerStats = {
  coins: 0,
  totalDistance: 0,
  bestScore: 0,
  bestDistance: 0,
  runsPlayed: 0,
  skitchCount: 0,
  nearMissCount: 0,
  unlockedVehicles: ['skateboard', 'bicycle', 'sports_motorcycle', 'cng', 'bus'],
  achievements: [],
  lastSavedCheckpoint: null,
};

const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 0.8,
  musicVolume: 0.5,
  graphicsQuality: 'high',
  touchSensitivity: 1.0,
  showMinimap: true,
  gestureTutorialSeen: false,
  gameMode: 'runner',
  selectedMap: 'dhaka_city',
  playerName: 'DhakaRider_' + Math.floor(Math.random() * 900 + 100),
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App & Screen State
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [showGarage, setShowGarage] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSmartphone, setShowSmartphone] = useState(false);
  const [showMapSelect, setShowMapSelect] = useState(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);

  // Persistent Player Stats & Settings
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isMuted, setIsMuted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!settings.gestureTutorialSeen);

  // In-game dynamic state
  const [currentVehicle, setCurrentVehicle] = useState<VehicleStage>('skateboard');
  const [isDriving, setIsDriving] = useState(true);
  const [nearbyVehicle, setNearbyVehicle] = useState<{ stage: VehicleStage; x: number; z: number } | null>(null);
  const [pickupTarget, setPickupTarget] = useState<VehicleStage | null>(null);
  const [pickupDistance, setPickupDistance] = useState<number | null>(null);
  const [skitchStatus, setSkitchStatus] = useState<{ active: boolean; label?: string }>({ active: false });
  const [floatingNotice, setFloatingNotice] = useState<{ text: string; subtext?: string; type?: string } | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  const [minimapEntities, setMinimapEntities] = useState<MinimapEntity[]>([]);
  const [currentBiome, setCurrentBiome] = useState<BiomeConfig>(BIOME_CONFIGS['dhaka_city']);
  const [selectedMap, setSelectedMap] = useState<BiomeType | null>(settings.selectedMap || null);
  const [gameMode, setGameMode] = useState<GameMode>(settings.gameMode || 'runner');
  const [multiplayerStatus, setMultiplayerStatus] = useState({ status: 'connected', ping: 42 });

  const [scoreState, setScoreState] = useState<GameScoreState>({
    currentScore: 0,
    distance: 0,
    coinsCollected: 0,
    multiplier: 1.0,
    combo: 0,
    nearMisses: 0,
    skitchBonus: 0,
    speedKmh: 0,
    checkpointsPassed: 0,
  });

  const [crashReason, setCrashReason] = useState<string>('');
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Save Stats to Local Storage on update
  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {}
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Update touch sensitivity in engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.touchSensitivity = settings.touchSensitivity;
    }
  }, [settings.touchSensitivity]);

  const showNotice = useCallback((text: string, subtext?: string, type?: 'pickup' | 'skitch' | 'nearmiss' | 'slap') => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    setFloatingNotice({ text, subtext, type });
    noticeTimerRef.current = window.setTimeout(() => {
      setFloatingNotice(null);
    }, 1800);
  }, []);

  // Stable callbacks ref so React state updates never re-create GameEngine or tear down WebGL
  const callbacksRef = useRef<any>(null);
  callbacksRef.current = {
    onScoreUpdate: (newScore: GameScoreState) => {
      setScoreState({ ...newScore });
    },
    onVehicleChange: (stage: VehicleStage, isUpgrade: boolean) => {
      setCurrentVehicle(stage);
      setPickupTarget(null);
      setPickupDistance(null);

      if (isUpgrade) {
        setStats((prev) => {
          const unlocked = prev.unlockedVehicles.includes(stage)
            ? prev.unlockedVehicles
            : [...prev.unlockedVehicles, stage];
          return { ...prev, unlockedVehicles: unlocked };
        });
      }
    },
    onDrivingStateChange: (driving: boolean) => {
      setIsDriving(driving);
    },
    onVehicleNearby: (vehicle: { stage: VehicleStage; x: number; z: number } | null) => {
      setNearbyVehicle(vehicle);
    },
    onGameOver: (finalStats: GameScoreState, reason: string) => {
      setGameState('gameover');
      setCrashReason(reason);

      setStats((prev) => {
        const isNewBest = finalStats.currentScore > prev.bestScore;
        setIsNewRecord(isNewBest);

        return {
          ...prev,
          coins: prev.coins + finalStats.coinsCollected,
          totalDistance: prev.totalDistance + finalStats.distance,
          bestScore: Math.max(prev.bestScore, finalStats.currentScore),
          bestDistance: Math.max(prev.bestDistance, finalStats.distance),
          runsPlayed: prev.runsPlayed + 1,
          nearMissCount: prev.nearMissCount + finalStats.nearMisses,
        };
      });
    },
    onFloatingNotification: (text: string, subtext?: string, type?: 'pickup' | 'skitch' | 'nearmiss' | 'slap') => {
      showNotice(text, subtext, type);
    },
    onSkitchStateChange: (active: boolean, label?: string) => {
      setSkitchStatus({ active, label });
    },
    onPickupAvailable: (targetVehicle: VehicleStage, dist: number) => {
      setPickupTarget(targetVehicle);
      setPickupDistance(dist);
    },
    onBiomeChange: (biome: BiomeConfig) => {
      setCurrentBiome(biome);
    },
    onMinimapUpdate: (entities: MinimapEntity[], _name: string) => {
      setMinimapEntities(entities);
    },
    onGestureDetected: () => {
      setShowTutorial(false);
      setSettings((prev) => ({ ...prev, gestureTutorialSeen: true }));
    },
    onCheckpointSaved: (checkpoint: SavedCheckpoint) => {
      setStats((prev) => ({
        ...prev,
        lastSavedCheckpoint: checkpoint,
      }));
    },
  };

  // Initialize Game Engine exactly ONCE in dedicated empty container ref
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onScoreUpdate: (s) => callbacksRef.current?.onScoreUpdate(s),
      onVehicleChange: (v, u) => callbacksRef.current?.onVehicleChange(v, u),
      onGameOver: (s, r) => callbacksRef.current?.onGameOver(s, r),
      onFloatingNotification: (t, s, tp) => callbacksRef.current?.onFloatingNotification(t, s, tp),
      onSkitchStateChange: (a, l) => callbacksRef.current?.onSkitchStateChange(a, l),
      onPickupAvailable: (t, d) => callbacksRef.current?.onPickupAvailable(t, d),
      onBiomeChange: (b) => callbacksRef.current?.onBiomeChange(b),
      onMinimapUpdate: (e, n) => callbacksRef.current?.onMinimapUpdate(e, n),
      onGestureDetected: () => callbacksRef.current?.onGestureDetected(),
      onCheckpointSaved: (cp) => callbacksRef.current?.onCheckpointSaved(cp),
      onVehicleNearby: (v) => callbacksRef.current?.onVehicleNearby(v),
      onDrivingStateChange: (d) => callbacksRef.current?.onDrivingStateChange(d),
      onVersusCountdown: (c) => callbacksRef.current?.onVersusCountdown(c),
      onVersusStart: () => callbacksRef.current?.onVersusStart(),
    });

    engine.touchSensitivity = settings.touchSensitivity;
    engine.setGameMode(gameMode);
    if (selectedMap) engine.setSelectedMap(selectedMap);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Handle Pause Keyboard Shortcut (Escape / KeyP / KeyG for Garage Phone / KeyM for Maps)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'playing') {
          handlePause();
        } else if (gameState === 'paused') {
          handleResume();
        }
      } else if (e.code === 'KeyG') {
        setShowSmartphone((prev) => !prev);
      } else if (e.code === 'KeyM') {
        setShowMapSelect((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  const handleStartGame = (startingVehicle: VehicleStage = 'skateboard') => {
    setGameState('playing');
    setCurrentVehicle(startingVehicle);
    setIsDriving(true);
    setPickupTarget(null);
    setPickupDistance(null);
    setSkitchStatus({ active: false });
    setIsNewRecord(false);
    setShowSmartphone(false);

    if (engineRef.current) {
      engineRef.current.setGameMode(gameMode);
      if (selectedMap) engineRef.current.setSelectedMap(selectedMap);
      engineRef.current.start(startingVehicle);
    }
  };

  const handlePause = () => {
    setGameState('paused');
    if (engineRef.current) {
      engineRef.current.pause();
    }
  };

  const handleResume = () => {
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.resume();
    }
  };

  const handleRestart = () => {
    handleStartGame('skateboard');
  };

  const handleHome = () => {
    setGameState('title');
    setShowSmartphone(false);
    if (engineRef.current) {
      engineRef.current.stop();
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleHorn = () => {
    if (engineRef.current) {
      engineRef.current.triggerHorn();
    }
  };

  const handleAction = () => {
    if (engineRef.current) {
      engineRef.current.triggerAction();
    }
  };

  const handleSpawnVehicleFromPhone = (stage: VehicleStage) => {
    if (engineRef.current) {
      engineRef.current.spawnVehicleFromPhone(stage);
    }
  };

  const handleEnterVehicle = (stage: VehicleStage) => {
    if (engineRef.current) {
      engineRef.current.enterVehicle(stage);
    }
  };

  const handleExitVehicle = () => {
    if (engineRef.current) {
      engineRef.current.exitVehicle();
    }
  };

  const handleResetCamera = () => {
    if (engineRef.current) {
      engineRef.current.resetCamera();
    }
  };

  const handleSaveCheckpointManually = () => {
    if (engineRef.current) {
      engineRef.current.saveCheckpointManually();
    }
  };

  const handleSelectMap = (mapId: BiomeType | null) => {
    setSelectedMap(mapId);
    setSettings((prev) => ({ ...prev, selectedMap: mapId || 'dhaka_city' }));
    if (engineRef.current) {
      engineRef.current.setSelectedMap(mapId);
    }
    showNotice(
      mapId ? `MAP SELECTED: ${BIOME_CONFIGS[mapId].name.toUpperCase()}` : 'DYNAMIC ENDLESS WORLD ACTIVATED',
      mapId ? BIOME_CONFIGS[mapId].bengaliName : undefined,
      'pickup',
    );
  };

  const handleSelectGameMode = (mode: GameMode, versusFormat?: VersusMatchFormat) => {
    setGameMode(mode);
    setSettings((prev) => ({ ...prev, gameMode: mode }));
    if (engineRef.current) {
      engineRef.current.setGameMode(mode);
    }
    multiplayerService.setPlayerInfo(settings.playerName, selectedMap || 'dhaka_city', mode === 'runner' ? 'freeroam' : mode, versusFormat);
    showNotice(
      mode === 'runner'
        ? 'OFFLINE ENDLESS RUNNER MODE'
        : mode === 'freeroam'
        ? 'ONLINE FREE ROAM MODE'
        : `ONLINE VERSUS (${(versusFormat || '1v1').toUpperCase()})`,
      'Mode Updated',
      'pickup',
    );
  };

  const handleResetData = () => {
    setStats(DEFAULT_STATS);
    localStorage.removeItem(STATS_STORAGE_KEY);
    showNotice('Saved data reset to initial state!', undefined, 'slap');
  };

  const currentConfig = VEHICLE_CONFIGS[currentVehicle];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* 3D WebGL Canvas Container: touch gestures active anywhere on canvas */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing touch-none select-none"
      />

      {/* Screen: Title Screen Shell */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={() => handleStartGame('skateboard')}
          onOpenGarage={() => setShowGarage(true)}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMaps={() => setShowMapSelect(true)}
          onOpenMultiplayer={() => setShowMultiplayerModal(true)}
          stats={stats}
        />
      )}

      {/* Screen: In-Game HUD & Radar */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHUD
          scoreState={scoreState}
          currentVehicle={currentVehicle}
          isDriving={isDriving}
          gameMode={gameMode}
          pickupTarget={pickupTarget}
          pickupDistance={pickupDistance}
          skitchStatus={skitchStatus}
          floatingNotice={floatingNotice}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onHorn={handleHorn}
          onAction={handleAction}
          onOpenPhone={() => setShowSmartphone(true)}
          onResetCamera={handleResetCamera}
          minimapEntities={minimapEntities}
          currentBiomeName={currentBiome.name}
          showMinimap={settings.showMinimap}
          showGestureTutorial={showTutorial && gameState === 'playing'}
          canSkitch={currentConfig?.canSkitch && isDriving}
          lastSavedCheckpoint={stats.lastSavedCheckpoint}
          nearbyVehicle={nearbyVehicle}
          onEnterVehicle={handleEnterVehicle}
          onExitVehicle={handleExitVehicle}
        />
      )}

      {/* DEDICATED CONTROLS: REALISTIC VEHICLE COCKPIT vs NATURAL ON-FOOT PEDESTRIAN */}
      {gameState === 'playing' && isDriving && (
        <VehicleCockpit
          currentVehicle={currentVehicle}
          onSteer={(val) => engineRef.current?.setSteerWheel(val)}
          onAccelerate={(active) => engineRef.current?.setGasPedal(active)}
          onBrake={(active) => engineRef.current?.setBrakePedal(active)}
          onGearChange={(gear) => engineRef.current?.setVehicleGear(gear)}
          onHorn={() => engineRef.current?.triggerHorn()}
          onJump={() => engineRef.current?.triggerJump()}
          onSlide={() => engineRef.current?.triggerSlide()}
          onAction={() => engineRef.current?.triggerAction()}
          onExitVehicle={handleExitVehicle}
          onOpenPhone={() => setShowSmartphone(true)}
          canSlide={currentConfig?.canSlide || false}
          canSkitch={currentConfig?.canSkitch || false}
        />
      )}

      {gameState === 'playing' && !isDriving && (
        <OnFootControls
          onMove={(x, z) => engineRef.current?.setOnFootMove(x, z)}
          onSprintToggle={(sprinting) => engineRef.current?.setOnFootSprint(sprinting)}
          onSneakToggle={(sneaking) => engineRef.current?.setOnFootSneak(sneaking)}
          onJump={() => engineRef.current?.triggerJump()}
          onGesture={() => engineRef.current?.triggerOnFootGesture()}
          onOpenPhone={() => setShowSmartphone(true)}
          onResetCamera={handleResetCamera}
          nearbyVehicle={nearbyVehicle}
          onEnterVehicle={handleEnterVehicle}
        />
      )}

      {/* Modal: Pause */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={handleHome}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onSaveCheckpoint={handleSaveCheckpointManually}
          onOpenMaps={() => setShowMapSelect(true)}
        />
      )}

      {/* Modal: Game Over (Only in Offline Endless Runner mode on crash) */}
      {gameState === 'gameover' && (
        <GameOverModal
          scoreState={scoreState}
          vehicleStage={currentVehicle}
          crashReason={crashReason}
          isNewRecord={isNewRecord}
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}

      {/* Modal: Garage / Vehicle Showroom */}
      {showGarage && (
        <GarageModal
          onClose={() => setShowGarage(false)}
          unlockedVehicles={stats.unlockedVehicles}
          onSelectVehicle={(stage) => {
            setShowGarage(false);
            handleStartGame(stage);
          }}
        />
      )}

      {/* Modal: In-Game Interactive Smartphone */}
      <InGameSmartphone
        isOpen={showSmartphone}
        onClose={() => setShowSmartphone(false)}
        currentVehicle={currentVehicle}
        isDriving={isDriving}
        onSpawnVehicle={handleSpawnVehicleFromPhone}
        onSelectMap={handleSelectMap}
        selectedMap={selectedMap}
        gameMode={gameMode}
        onSelectGameMode={handleSelectGameMode}
        lastSavedCheckpoint={stats.lastSavedCheckpoint || null}
        onSaveCheckpoint={handleSaveCheckpointManually}
        multiplayerStatus={multiplayerStatus}
      />

      {/* Modal: Map Select */}
      <MapSelectModal
        isOpen={showMapSelect}
        onClose={() => setShowMapSelect(false)}
        selectedMap={selectedMap}
        onSelectMap={handleSelectMap}
      />

      {/* Modal: Multiplayer Lobby & Modes */}
      <MultiplayerModal
        isOpen={showMultiplayerModal}
        onClose={() => setShowMultiplayerModal(false)}
        gameMode={gameMode}
        onSelectMode={handleSelectGameMode}
        playerName={settings.playerName}
        onUpdatePlayerName={(name) => setSettings((prev) => ({ ...prev, playerName: name }))}
        multiplayerStatus={multiplayerStatus}
      />

      {/* Modal: How to Play / Controls */}
      {showHowToPlay && (
        <HowToPlayModal
          onClose={() => setShowHowToPlay(false)}
        />
      )}

      {/* Modal: Settings */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
          onResetData={handleResetData}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
