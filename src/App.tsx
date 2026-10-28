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
} from './types/game';
import { soundManager } from './audio/soundManager';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { GarageModal } from './components/GarageModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { SettingsModal } from './components/SettingsModal';

const STATS_STORAGE_KEY = 'endless_ride_bangladesh_stats_v2';
const SETTINGS_STORAGE_KEY = 'endless_ride_bangladesh_settings_v2';

const DEFAULT_STATS: PlayerStats = {
  coins: 0,
  totalDistance: 0,
  bestScore: 0,
  bestDistance: 0,
  runsPlayed: 0,
  skitchCount: 0,
  nearMissCount: 0,
  unlockedVehicles: ['skateboard'],
  achievements: [],
};

const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 0.8,
  musicVolume: 0.5,
  graphicsQuality: 'high',
  touchSensitivity: 1.0,
  showMinimap: true,
  gestureTutorialSeen: false,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App & Screen State
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [showGarage, setShowGarage] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
  const [pickupTarget, setPickupTarget] = useState<VehicleStage | null>(null);
  const [pickupDistance, setPickupDistance] = useState<number | null>(null);
  const [skitchStatus, setSkitchStatus] = useState<{ active: boolean; label?: string }>({ active: false });
  const [floatingNotice, setFloatingNotice] = useState<{ text: string; subtext?: string; type?: string } | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  const [minimapEntities, setMinimapEntities] = useState<MinimapEntity[]>([]);
  const [currentBiome, setCurrentBiome] = useState<BiomeConfig>(BIOME_CONFIGS['dhaka_city']);

  const [scoreState, setScoreState] = useState<GameScoreState>({
    currentScore: 0,
    distance: 0,
    coinsCollected: 0,
    multiplier: 1.0,
    combo: 0,
    nearMisses: 0,
    skitchBonus: 0,
    speedKmh: 0,
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
    });

    engine.touchSensitivity = settings.touchSensitivity;
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []); // Run exactly once on mount!

  // Keep touch sensitivity synchronized without tearing down WebGL
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.touchSensitivity = settings.touchSensitivity;
    }
  }, [settings.touchSensitivity]);

  // Handle Pause Keyboard Shortcut (Escape / KeyP)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'playing') {
          handlePause();
        } else if (gameState === 'paused') {
          handleResume();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  const handleStartGame = () => {
    setGameState('playing');
    setCurrentVehicle('skateboard');
    setPickupTarget(null);
    setPickupDistance(null);
    setSkitchStatus({ active: false });
    setIsNewRecord(false);

    if (engineRef.current) {
      engineRef.current.start('skateboard');
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
    handleStartGame();
  };

  const handleHome = () => {
    setGameState('title');
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
          onStart={handleStartGame}
          onOpenGarage={() => setShowGarage(true)}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenSettings={() => setShowSettings(true)}
          stats={stats}
        />
      )}

      {/* Screen: In-Game HUD & Radar */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHUD
          scoreState={scoreState}
          currentVehicle={currentVehicle}
          pickupTarget={pickupTarget}
          pickupDistance={pickupDistance}
          skitchStatus={skitchStatus}
          floatingNotice={floatingNotice}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onHorn={handleHorn}
          onAction={handleAction}
          minimapEntities={minimapEntities}
          currentBiomeName={currentBiome.name}
          showMinimap={settings.showMinimap}
          showGestureTutorial={showTutorial && gameState === 'playing'}
          canSkitch={currentConfig.canSkitch}
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
        />
      )}

      {/* Modal: Game Over */}
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
        />
      )}

      {/* Modal: How to Play */}
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
