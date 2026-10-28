/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VehicleStage =
  | 'skateboard'
  | 'bicycle'
  | 'motorcycle'
  | 'autorickshaw'
  | 'cng'
  | 'bus';

export interface VehicleConfig {
  id: VehicleStage;
  name: string;
  bengaliName: string;
  tagline: string;
  baseSpeed: number; // units/sec
  maxSpeed: number;
  acceleration: number;
  turnSpeed: number;
  jumpForce: number;
  canSlide: boolean;
  canSkitch: boolean;
  width: number;
  length: number;
  height: number;
  wheelRadius: number;
  cameraDistance: number;
  cameraHeight: number;
  cameraFov: number;
  hornType: 'bell' | 'chime' | 'peep' | 'horn' | 'airhorn' | 'holler';
  requiredMilestone: number; // meters required to spawn next vehicle pickup
  primaryColor: string;
  description: string;
}

export const VEHICLE_STAGES: VehicleStage[] = [
  'skateboard',
  'bicycle',
  'motorcycle',
  'autorickshaw',
  'cng',
  'bus',
];

export const VEHICLE_CONFIGS: Record<VehicleStage, VehicleConfig> = {
  skateboard: {
    id: 'skateboard',
    name: 'Street Skateboard',
    bengaliName: 'স্কেটবোর্ড',
    tagline: 'Agile & Streetwise',
    baseSpeed: 16,
    maxSpeed: 25,
    acceleration: 12,
    turnSpeed: 16,
    jumpForce: 13.5,
    canSlide: true,
    canSkitch: true,
    width: 0.85,
    length: 1.1,
    height: 1.65,
    wheelRadius: 0.04,
    cameraDistance: 4.8,
    cameraHeight: 2.1,
    cameraFov: 62,
    hornType: 'holler',
    requiredMilestone: 320,
    primaryColor: '#f97316',
    description: 'Ultra nimble street cruiser. Perform ollie jumps, slide under high bamboo barriers, and latch onto moving CNGs for a high-speed skitch!',
  },
  bicycle: {
    id: 'bicycle',
    name: 'Hero Roadster Bicycle',
    bengaliName: 'হিরো বাইসাইকেল',
    tagline: 'Light & Rhythmic',
    baseSpeed: 21,
    maxSpeed: 31,
    acceleration: 13,
    turnSpeed: 14,
    jumpForce: 11,
    canSlide: true, // duck/crouch over handlebars
    canSkitch: false,
    width: 0.95,
    length: 1.8,
    height: 1.75,
    wheelRadius: 0.38,
    cameraDistance: 5.4,
    cameraHeight: 2.4,
    cameraFov: 64,
    hornType: 'bell',
    requiredMilestone: 440,
    primaryColor: '#06b6d4',
    description: 'Classic roadster with front bell and rotating chainring. Smooth pedaling cadence, bunny hops, and tight traffic weaving.',
  },
  motorcycle: {
    id: 'motorcycle',
    name: '150cc Sport Bike',
    bengaliName: 'স্পোর্টস বাইক',
    tagline: 'High Speed Thunder',
    baseSpeed: 28,
    maxSpeed: 44,
    acceleration: 18,
    turnSpeed: 16,
    jumpForce: 8.5,
    canSlide: true, // racing tuck
    canSkitch: false,
    width: 1.05,
    length: 2.1,
    height: 1.65,
    wheelRadius: 0.34,
    cameraDistance: 6.2,
    cameraHeight: 2.6,
    cameraFov: 67,
    hornType: 'peep',
    requiredMilestone: 560,
    primaryColor: '#ef4444',
    description: 'Aerodynamic speed demon. Drifts sharply across highway lanes with deep banking lean and explosive top speed.',
  },
  autorickshaw: {
    id: 'autorickshaw',
    name: 'Baby Taxi Auto-Rickshaw',
    bengaliName: 'অটোরিকশা',
    tagline: 'Classic 2-Stroke Soul',
    baseSpeed: 25,
    maxSpeed: 36,
    acceleration: 13,
    turnSpeed: 12.5,
    jumpForce: 6.5,
    canSlide: false,
    canSkitch: false,
    width: 1.45,
    length: 2.5,
    height: 1.95,
    wheelRadius: 0.32,
    cameraDistance: 6.8,
    cameraHeight: 3.1,
    cameraFov: 68,
    hornType: 'horn',
    requiredMilestone: 660,
    primaryColor: '#eab308',
    description: 'The golden yellow classic three-wheeler. High stability, quirky cornering tilt, and classic mechanical horn.',
  },
  cng: {
    id: 'cng',
    name: 'Dhaka Green CNG',
    bengaliName: 'সবুজ সিএনজি',
    tagline: 'Icon of Dhaka Streets',
    baseSpeed: 27,
    maxSpeed: 39,
    acceleration: 14,
    turnSpeed: 13.5,
    jumpForce: 7.0,
    canSlide: false,
    canSkitch: false,
    width: 1.5,
    length: 2.6,
    height: 2.05,
    wheelRadius: 0.33,
    cameraDistance: 7.2,
    cameraHeight: 3.3,
    cameraFov: 69,
    hornType: 'horn',
    requiredMilestone: 780,
    primaryColor: '#10b981',
    description: 'The world-famous green wire-mesh autorickshaw. Agile city threading with high engine torque and vibrant bumper art.',
  },
  bus: {
    id: 'bus',
    name: 'Local Dhaka Bus',
    bengaliName: 'লোকাল বাস',
    tagline: 'King of the Highway',
    baseSpeed: 30,
    maxSpeed: 45,
    acceleration: 11,
    turnSpeed: 9.5,
    jumpForce: 4.5,
    canSlide: false,
    canSkitch: false,
    width: 2.4,
    length: 6.2,
    height: 3.2,
    wheelRadius: 0.52,
    cameraDistance: 10.5,
    cameraHeight: 4.6,
    cameraFov: 72,
    hornType: 'airhorn',
    requiredMilestone: 920,
    primaryColor: '#3b82f6',
    description: 'Heavy duty transport beast adorned with authentic truck art and destination placards. Features deafening pneumatic air horn!',
  },
};

export type BiomeType =
  | 'dhaka_city'
  | 'old_market'
  | 'flyover'
  | 'river_bridge'
  | 'village_highway'
  | 'industrial_zone'
  | 'riverside_road'
  | 'bus_terminal';

export interface BiomeConfig {
  id: BiomeType;
  name: string;
  bengaliName: string;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  sunColor: number;
  sunIntensity: number;
  roadWidth: number;
  description: string;
}

export const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
  dhaka_city: {
    id: 'dhaka_city',
    name: 'Dhaka Metropolitan',
    bengaliName: 'ঢাকা মহানগর',
    skyColor: 0x7dd3fc,
    fogColor: 0xbae6fd,
    fogDensity: 0.007,
    ambientColor: 0xffffff,
    sunColor: 0xfff7ed,
    sunIntensity: 1.8,
    roadWidth: 12,
    description: 'Vibrant metropolitan Dhaka with tall apartment blocks, streetlights, overhead power wires, and roadside tea stalls.',
  },
  old_market: {
    id: 'old_market',
    name: 'Old Dhaka Heritage Market',
    bengaliName: 'পুরান ঢাকা বাজার',
    skyColor: 0xfde047,
    fogColor: 0xfef08a,
    fogDensity: 0.009,
    ambientColor: 0xffedd5,
    sunColor: 0xf59e0b,
    sunIntensity: 1.6,
    roadWidth: 11,
    description: 'Historic colonial brick storefronts, colorful fruit vendor carts, cloth canopies, and festive lanterns.',
  },
  flyover: {
    id: 'flyover',
    name: 'Mayor Hanif Flyover',
    bengaliName: 'মেয়র হানিফ ফ্লাইওভার',
    skyColor: 0x60a5fa,
    fogColor: 0x93c5fd,
    fogDensity: 0.005,
    ambientColor: 0xffffff,
    sunColor: 0xffedd5,
    sunIntensity: 2.0,
    roadWidth: 13,
    description: 'Elevated highway expressway with safety barriers, overhead green directional gantries, and expansive city vistas.',
  },
  river_bridge: {
    id: 'river_bridge',
    name: 'Padma - Meghna Mega Bridge',
    bengaliName: 'পদ্মা-মেঘনা সেতু',
    skyColor: 0x38bdf8,
    fogColor: 0x7dd3fc,
    fogDensity: 0.006,
    ambientColor: 0xe0f2fe,
    sunColor: 0xffedd5,
    sunIntensity: 2.1,
    roadWidth: 14,
    description: 'Majestic steel truss bridge crossing sparkling broad river waters with suspension cable stays and open horizon.',
  },
  village_highway: {
    id: 'village_highway',
    name: 'Sonargaon Village Highway',
    bengaliName: 'সোনারগাঁ পল্লী পথ',
    skyColor: 0x86efac,
    fogColor: 0xbbf7d0,
    fogDensity: 0.008,
    ambientColor: 0xf0fdf4,
    sunColor: 0xfef08a,
    sunIntensity: 1.9,
    roadWidth: 11.5,
    description: 'Lush emerald green paddy fields, tall coconut and date palms, wooden fences, and roadside ponds with water lilies.',
  },
  industrial_zone: {
    id: 'industrial_zone',
    name: 'Gazipur Industrial Avenue',
    bengaliName: 'গাজীপুর শিল্প এলাকা',
    skyColor: 0xfb923c,
    fogColor: 0xfed7aa,
    fogDensity: 0.009,
    ambientColor: 0xffedd5,
    sunColor: 0xf97316,
    sunIntensity: 1.7,
    roadWidth: 13,
    description: 'Dynamic industrial corridor with brick kilns, cargo containers, warehouses, and heavy truck freight.',
  },
  riverside_road: {
    id: 'riverside_road',
    name: 'Buriganga Riverfront Ghat',
    bengaliName: 'বুড়িগঙ্গা রিভারফ্রন্ট',
    skyColor: 0x38bdf8,
    fogColor: 0xbae6fd,
    fogDensity: 0.007,
    ambientColor: 0xf0f9ff,
    sunColor: 0xfef08a,
    sunIntensity: 1.9,
    roadWidth: 12,
    description: 'Riverside boulevard alongside wooden passenger boats (nouka), wooden jetties, and gentle river breezes.',
  },
  bus_terminal: {
    id: 'bus_terminal',
    name: 'Sayedabad Central Terminal',
    bengaliName: 'সায়েদাবাদ বাস টার্মিনাল',
    skyColor: 0xa78bfa,
    fogColor: 0xc4b5fd,
    fogDensity: 0.008,
    ambientColor: 0xf5f3ff,
    sunColor: 0xfacc15,
    sunIntensity: 1.8,
    roadWidth: 14,
    description: 'High-density transit nexus with departure bays, gantry floodlights, toll booths, and crisscrossing buses.',
  },
};

export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  touchSensitivity: number; // 0.5 to 2.0
  showMinimap: boolean;
  gestureTutorialSeen: boolean;
}

export interface PlayerStats {
  coins: number;
  totalDistance: number;
  bestScore: number;
  bestDistance: number;
  runsPlayed: number;
  skitchCount: number;
  nearMissCount: number;
  unlockedVehicles: VehicleStage[];
  achievements: string[];
}

export interface GameScoreState {
  currentScore: number;
  distance: number;
  coinsCollected: number;
  multiplier: number;
  combo: number;
  nearMisses: number;
  skitchBonus: number;
  speedKmh: number;
}

export interface MinimapEntity {
  id: string;
  type: 'player' | 'cng' | 'bus' | 'traffic' | 'pickup' | 'obstacle';
  x: number; // relative to road center (-6 to +6)
  z: number; // relative to player (-10 to +120)
}
