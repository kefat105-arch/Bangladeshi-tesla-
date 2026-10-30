/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VehicleStage =
  | 'skateboard'
  | 'bicycle'
  | 'motorcycle' // legacy alias
  | 'sports_motorcycle'
  | 'standard_motorcycle'
  | 'scooter'
  | 'sports_car'
  | 'suv'
  | 'luxury_car'
  | 'jeep'
  | 'autorickshaw'
  | 'cng'
  | 'bus';

export type GameMode = 'runner' | 'freeroam' | 'versus';

export interface VehicleConfig {
  id: VehicleStage;
  name: string;
  bengaliName: string;
  category: 'two_wheeler' | 'car' | 'traditional' | 'heavy' | 'micro';
  tagline: string;
  baseSpeed: number; // units/sec
  maxSpeed: number;
  reverseSpeed: number;
  acceleration: number;
  braking: number;
  turnSpeed: number;
  jumpForce: number;
  canSlide: boolean;
  canSkitch: boolean;
  width: number;
  length: number;
  height: number;
  wheelRadius: number;
  wheelCount: number;
  cameraDistance: number;
  cameraHeight: number;
  cameraFov: number;
  hornType: 'bell' | 'chime' | 'peep' | 'horn' | 'airhorn' | 'holler' | 'supercar' | 'truckhorn';
  requiredMilestone: number;
  primaryColor: string;
  description: string;
  seatCount: number;
}

export const VEHICLE_STAGES: VehicleStage[] = [
  'skateboard',
  'bicycle',
  'sports_motorcycle',
  'standard_motorcycle',
  'scooter',
  'sports_car',
  'suv',
  'luxury_car',
  'jeep',
  'autorickshaw',
  'cng',
  'bus',
];

export const VEHICLE_CONFIGS: Record<VehicleStage, VehicleConfig> = {
  skateboard: {
    id: 'skateboard',
    name: 'Street Skateboard',
    bengaliName: 'স্কেটবোর্ড',
    category: 'micro',
    tagline: 'Agile & Streetwise',
    baseSpeed: 14,
    maxSpeed: 24,
    reverseSpeed: 8,
    acceleration: 12,
    braking: 20,
    turnSpeed: 16,
    jumpForce: 13.5,
    canSlide: true,
    canSkitch: true,
    width: 0.85,
    length: 1.1,
    height: 1.65,
    wheelRadius: 0.04,
    wheelCount: 4,
    cameraDistance: 4.8,
    cameraHeight: 2.1,
    cameraFov: 62,
    hornType: 'holler',
    requiredMilestone: 300,
    primaryColor: '#f97316',
    description: 'Ultra nimble street cruiser. Perform ollie jumps, slide under high bamboo barriers, and latch onto moving CNGs for a high-speed skitch!',
    seatCount: 1,
  },
  bicycle: {
    id: 'bicycle',
    name: 'Roadster Bicycle',
    bengaliName: 'হিরো বাইসাইকেল',
    category: 'two_wheeler',
    tagline: 'Light & Rhythmic',
    baseSpeed: 18,
    maxSpeed: 28,
    reverseSpeed: 7,
    acceleration: 13,
    braking: 22,
    turnSpeed: 15,
    jumpForce: 11,
    canSlide: true,
    canSkitch: false,
    width: 0.95,
    length: 1.8,
    height: 1.75,
    wheelRadius: 0.38,
    wheelCount: 2,
    cameraDistance: 5.4,
    cameraHeight: 2.4,
    cameraFov: 64,
    hornType: 'bell',
    requiredMilestone: 400,
    primaryColor: '#06b6d4',
    description: 'Classic roadster with front bell, chrome handlebars, and rotating chainring. Smooth pedaling cadence and tight traffic weaving.',
    seatCount: 1,
  },
  sports_motorcycle: {
    id: 'sports_motorcycle',
    name: '250cc Sport Motorcycle',
    bengaliName: 'স্পোর্টস বাইক (R15)',
    category: 'two_wheeler',
    tagline: 'High Speed Thunder',
    baseSpeed: 28,
    maxSpeed: 48,
    reverseSpeed: 10,
    acceleration: 22,
    braking: 28,
    turnSpeed: 17,
    jumpForce: 8.5,
    canSlide: true,
    canSkitch: false,
    width: 1.05,
    length: 2.1,
    height: 1.65,
    wheelRadius: 0.34,
    wheelCount: 2,
    cameraDistance: 6.2,
    cameraHeight: 2.6,
    cameraFov: 68,
    hornType: 'peep',
    requiredMilestone: 520,
    primaryColor: '#ef4444',
    description: 'Aerodynamic speed demon with sharp front fairing and roaring exhaust. Drifts sharply across highway lanes with deep banking lean.',
    seatCount: 2,
  },
  motorcycle: {
    id: 'motorcycle',
    name: '250cc Sport Motorcycle',
    bengaliName: 'স্পোর্টস বাইক (R15)',
    category: 'two_wheeler',
    tagline: 'High Speed Thunder',
    baseSpeed: 28,
    maxSpeed: 48,
    reverseSpeed: 10,
    acceleration: 22,
    braking: 28,
    turnSpeed: 17,
    jumpForce: 8.5,
    canSlide: true,
    canSkitch: false,
    width: 1.05,
    length: 2.1,
    height: 1.65,
    wheelRadius: 0.34,
    wheelCount: 2,
    cameraDistance: 6.2,
    cameraHeight: 2.6,
    cameraFov: 68,
    hornType: 'peep',
    requiredMilestone: 520,
    primaryColor: '#ef4444',
    description: 'Aerodynamic speed demon with sharp front fairing and roaring exhaust. Drifts sharply across highway lanes with deep banking lean.',
    seatCount: 2,
  },
  standard_motorcycle: {
    id: 'standard_motorcycle',
    name: '150cc Commuter Bike',
    bengaliName: 'পালসার ১৫০সিসি',
    category: 'two_wheeler',
    tagline: 'Dhaka City Commuter',
    baseSpeed: 24,
    maxSpeed: 40,
    reverseSpeed: 9,
    acceleration: 18,
    braking: 25,
    turnSpeed: 16,
    jumpForce: 9.0,
    canSlide: true,
    canSkitch: false,
    width: 1.0,
    length: 2.05,
    height: 1.68,
    wheelRadius: 0.35,
    wheelCount: 2,
    cameraDistance: 5.8,
    cameraHeight: 2.5,
    cameraFov: 66,
    hornType: 'peep',
    requiredMilestone: 600,
    primaryColor: '#3b82f6',
    description: 'Iconic street motorcycle with muscular fuel tank, chrome exhaust, upright commuter handlebars, and dual rear shocks.',
    seatCount: 2,
  },
  scooter: {
    id: 'scooter',
    name: 'Urban Motor Scooter',
    bengaliName: 'ভেস্পা স্কুটার',
    category: 'two_wheeler',
    tagline: 'Chic, Smooth & Retro',
    baseSpeed: 20,
    maxSpeed: 34,
    reverseSpeed: 8,
    acceleration: 15,
    braking: 24,
    turnSpeed: 18,
    jumpForce: 8.0,
    canSlide: false,
    canSkitch: false,
    width: 0.9,
    length: 1.85,
    height: 1.6,
    wheelRadius: 0.28,
    wheelCount: 2,
    cameraDistance: 5.5,
    cameraHeight: 2.4,
    cameraFov: 65,
    hornType: 'peep',
    requiredMilestone: 680,
    primaryColor: '#ec4899',
    description: 'Retro step-through scooter with round headlamp, curved leg shield, and effortless automatic acceleration.',
    seatCount: 2,
  },
  sports_car: {
    id: 'sports_car',
    name: 'High-Performance Supercar',
    bengaliName: 'স্পোর্টস কার',
    category: 'car',
    tagline: 'Wedge-Profile Racer',
    baseSpeed: 32,
    maxSpeed: 54,
    reverseSpeed: 14,
    acceleration: 26,
    braking: 32,
    turnSpeed: 19,
    jumpForce: 5.0,
    canSlide: false,
    canSkitch: false,
    width: 1.9,
    length: 4.4,
    height: 1.45,
    wheelRadius: 0.36,
    wheelCount: 4,
    cameraDistance: 7.2,
    cameraHeight: 2.8,
    cameraFov: 70,
    hornType: 'supercar',
    requiredMilestone: 780,
    primaryColor: '#e11d48',
    description: 'Exotic mid-engine supercar with rear aerodynamic wing, low ground clearance, quad exhaust, and lightning acceleration.',
    seatCount: 2,
  },
  suv: {
    id: 'suv',
    name: 'Land Cruiser Prado SUV',
    bengaliName: 'প্রাডো এসইউভি',
    category: 'car',
    tagline: 'Power, Stature & Comfort',
    baseSpeed: 28,
    maxSpeed: 45,
    reverseSpeed: 12,
    acceleration: 17,
    braking: 26,
    turnSpeed: 13,
    jumpForce: 6.0,
    canSlide: false,
    canSkitch: false,
    width: 2.05,
    length: 4.85,
    height: 2.1,
    wheelRadius: 0.44,
    wheelCount: 4,
    cameraDistance: 8.5,
    cameraHeight: 3.6,
    cameraFov: 68,
    hornType: 'horn',
    requiredMilestone: 860,
    primaryColor: '#f8fafc',
    description: 'Commanding VIP 4x4 SUV with roof rails, heavy tread wheels, tinted panoramic windows, and smooth air suspension.',
    seatCount: 7,
  },
  luxury_car: {
    id: 'luxury_car',
    name: 'Executive Luxury Sedan',
    bengaliName: 'লাক্সারি সেডান',
    category: 'car',
    tagline: 'Silent Electric Glide',
    baseSpeed: 30,
    maxSpeed: 50,
    reverseSpeed: 13,
    acceleration: 24,
    braking: 30,
    turnSpeed: 16,
    jumpForce: 5.5,
    canSlide: false,
    canSkitch: false,
    width: 1.95,
    length: 4.9,
    height: 1.6,
    wheelRadius: 0.38,
    wheelCount: 4,
    cameraDistance: 8.0,
    cameraHeight: 3.2,
    cameraFov: 69,
    hornType: 'horn',
    requiredMilestone: 940,
    primaryColor: '#0f172a',
    description: 'Prestige luxury cruiser with all-glass panoramic roof, polished chrome door trim, multi-spoke alloy wheels, and effortless drive.',
    seatCount: 5,
  },
  jeep: {
    id: 'jeep',
    name: '4x4 Offroad Safari Jeep',
    bengaliName: 'চাঁদের গাড়ি (জিপ)',
    category: 'car',
    tagline: 'Hill Tracts Expedition',
    baseSpeed: 26,
    maxSpeed: 42,
    reverseSpeed: 11,
    acceleration: 19,
    braking: 25,
    turnSpeed: 14,
    jumpForce: 7.5,
    canSlide: false,
    canSkitch: false,
    width: 1.95,
    length: 4.2,
    height: 2.15,
    wheelRadius: 0.46,
    wheelCount: 4,
    cameraDistance: 8.2,
    cameraHeight: 3.5,
    cameraFov: 68,
    hornType: 'horn',
    requiredMilestone: 1020,
    primaryColor: '#84cc16',
    description: 'Iconic open-frame Chander Gari with heavy-duty roll cage, front winch, elevated snorkel, and all-terrain suspension.',
    seatCount: 6,
  },
  autorickshaw: {
    id: 'autorickshaw',
    name: 'Baby Taxi Auto-Rickshaw',
    bengaliName: 'হলুদ অটোরিকশা',
    category: 'traditional',
    tagline: 'Classic 2-Stroke Soul',
    baseSpeed: 24,
    maxSpeed: 36,
    reverseSpeed: 9,
    acceleration: 14,
    braking: 22,
    turnSpeed: 13,
    jumpForce: 6.5,
    canSlide: false,
    canSkitch: false,
    width: 1.45,
    length: 2.5,
    height: 1.95,
    wheelRadius: 0.32,
    wheelCount: 3,
    cameraDistance: 6.8,
    cameraHeight: 3.1,
    cameraFov: 68,
    hornType: 'horn',
    requiredMilestone: 1100,
    primaryColor: '#eab308',
    description: 'The golden yellow classic three-wheeler. High stability, quirky cornering tilt, and classic mechanical horn.',
    seatCount: 4,
  },
  cng: {
    id: 'cng',
    name: 'Dhaka Green CNG',
    bengaliName: 'সবুজ সিএনজি',
    category: 'traditional',
    tagline: 'Icon of Dhaka Streets',
    baseSpeed: 26,
    maxSpeed: 39,
    reverseSpeed: 10,
    acceleration: 15,
    braking: 23,
    turnSpeed: 14,
    jumpForce: 7.0,
    canSlide: false,
    canSkitch: false,
    width: 1.5,
    length: 2.6,
    height: 2.05,
    wheelRadius: 0.33,
    wheelCount: 3,
    cameraDistance: 7.2,
    cameraHeight: 3.3,
    cameraFov: 69,
    hornType: 'horn',
    requiredMilestone: 1180,
    primaryColor: '#10b981',
    description: 'The world-famous green wire-mesh autorickshaw. Agile city threading with high engine torque, fare meter, and rear skitch bar.',
    seatCount: 4,
  },
  bus: {
    id: 'bus',
    name: 'Local Dhaka Highway Bus',
    bengaliName: 'লোকাল বাস (ঢাকা এক্সপ্রেস)',
    category: 'heavy',
    tagline: 'King of the Highway',
    baseSpeed: 30,
    maxSpeed: 46,
    reverseSpeed: 10,
    acceleration: 12,
    braking: 20,
    turnSpeed: 10,
    jumpForce: 4.5,
    canSlide: false,
    canSkitch: false,
    width: 2.4,
    length: 6.2,
    height: 3.2,
    wheelRadius: 0.52,
    wheelCount: 6,
    cameraDistance: 10.5,
    cameraHeight: 4.6,
    cameraFov: 72,
    hornType: 'airhorn',
    requiredMilestone: 1280,
    primaryColor: '#2563eb',
    description: 'Heavy duty transport beast adorned with authentic truck art and destination placards. Features deafening pneumatic air horn!',
    seatCount: 42,
  },
};

export type BiomeType =
  | 'dhaka_city'
  | 'old_market'
  | 'flyover'
  | 'river_bridge'
  | 'village_highway'
  | 'mountain_pass'
  | 'tea_forest'
  | 'coastal_drive'
  | 'padma_expressway'
  | 'rural_village'
  | 'grand_circuit'
  | 'industrial_zone'
  | 'riverside_road';

export interface BiomeConfig {
  id: BiomeType;
  name: string;
  bengaliName: string;
  location: string;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  sunColor: number;
  sunIntensity: number;
  roadWidth: number;
  roadType: 'asphalt' | 'brick' | 'concrete' | 'expressway' | 'racetrack';
  sceneryType: 'city' | 'bazaar' | 'countryside' | 'mountain' | 'tea' | 'coastal' | 'bridge';
  description: string;
  previewGradient: string;
}

export const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
  dhaka_city: {
    id: 'dhaka_city',
    name: 'Dhaka Metropolitan',
    bengaliName: 'ঢাকা মহানগর এভিনিউ',
    location: 'Gulshan & Hatirjheel, Dhaka',
    skyColor: 0x7dd3fc,
    fogColor: 0xbae6fd,
    fogDensity: 0.006,
    ambientColor: 0xffffff,
    sunColor: 0xfff7ed,
    sunIntensity: 1.8,
    roadWidth: 13,
    roadType: 'asphalt',
    sceneryType: 'city',
    description: 'Vibrant metropolitan Dhaka with tall apartment blocks, streetlights, overhead power wires, and roadside tea stalls.',
    previewGradient: 'from-sky-700 to-indigo-900',
  },
  old_market: {
    id: 'old_market',
    name: 'Old Dhaka Heritage Market',
    bengaliName: 'পুরান ঢাকা চকবাজার',
    location: 'Chawkbazar & Shakharibazar',
    skyColor: 0xfde047,
    fogColor: 0xfef08a,
    fogDensity: 0.009,
    ambientColor: 0xffedd5,
    sunColor: 0xf59e0b,
    sunIntensity: 1.6,
    roadWidth: 11,
    roadType: 'brick',
    sceneryType: 'bazaar',
    description: 'Historic colonial brick storefronts, colorful fruit vendor carts, cloth canopies, and festive lanterns.',
    previewGradient: 'from-amber-600 to-rose-900',
  },
  village_highway: {
    id: 'village_highway',
    name: 'Sonargaon Countryside',
    bengaliName: 'সোনারগাঁ পল্লী পথ',
    location: 'Narayanganj & Comilla Highway',
    skyColor: 0x86efac,
    fogColor: 0xbbf7d0,
    fogDensity: 0.007,
    ambientColor: 0xf0fdf4,
    sunColor: 0xfef08a,
    sunIntensity: 1.9,
    roadWidth: 12,
    roadType: 'asphalt',
    sceneryType: 'countryside',
    description: 'Lush emerald green paddy fields, tall coconut and date palms, wooden fences, and roadside ponds with water lilies.',
    previewGradient: 'from-emerald-600 to-teal-900',
  },
  mountain_pass: {
    id: 'mountain_pass',
    name: 'Bandarban Mountain Pass',
    bengaliName: 'বান্দরবান পাহাড়ি গিরিপথ',
    location: 'Sajek & Nilgiri Hills',
    skyColor: 0x67e8f9,
    fogColor: 0xa5f3fc,
    fogDensity: 0.008,
    ambientColor: 0xecfeff,
    sunColor: 0xffedd5,
    sunIntensity: 1.9,
    roadWidth: 11,
    roadType: 'asphalt',
    sceneryType: 'mountain',
    description: 'Scenic winding hill highway carved through misty mountain peaks with cliffside safety barricades and cloud banks.',
    previewGradient: 'from-cyan-700 to-slate-900',
  },
  tea_forest: {
    id: 'tea_forest',
    name: 'Srimangal Tea Rainforest',
    bengaliName: 'শ্রীমঙ্গল চা বাগান ও বনাঞ্চল',
    location: 'Moulvibazar & Lawachara Forest',
    skyColor: 0x4ade80,
    fogColor: 0x86efac,
    fogDensity: 0.009,
    ambientColor: 0xf0fdf4,
    sunColor: 0xfef08a,
    sunIntensity: 1.7,
    roadWidth: 11.5,
    roadType: 'asphalt',
    sceneryType: 'tea',
    description: 'Dense green tea bush mounds, bamboo thickets, tall shaded rubber trees, and wooden village bridges.',
    previewGradient: 'from-green-700 to-emerald-950',
  },
  coastal_drive: {
    id: 'coastal_drive',
    name: "Cox's Bazar Marine Drive",
    bengaliName: 'কক্সবাজার মেরিন ড্রাইভ',
    location: 'Inani to Teknaf Coast',
    skyColor: 0x38bdf8,
    fogColor: 0x7dd3fc,
    fogDensity: 0.005,
    ambientColor: 0xe0f2fe,
    sunColor: 0xfef08a,
    sunIntensity: 2.1,
    roadWidth: 13,
    roadType: 'asphalt',
    sceneryType: 'coastal',
    description: 'The world-famous marine drive running parallel to ocean surf, golden sandy dunes, coconut groves, and fishing boats.',
    previewGradient: 'from-blue-600 to-cyan-900',
  },
  padma_expressway: {
    id: 'padma_expressway',
    name: 'Padma Bridge Mega Expressway',
    bengaliName: 'পদ্মা সেতু মহাসড়ক',
    location: 'Mawa to Janjira Expressway',
    skyColor: 0x60a5fa,
    fogColor: 0x93c5fd,
    fogDensity: 0.005,
    ambientColor: 0xffffff,
    sunColor: 0xffedd5,
    sunIntensity: 2.0,
    roadWidth: 15,
    roadType: 'expressway',
    sceneryType: 'bridge',
    description: 'High-speed 6-lane elevated expressway transitioning into the double-deck steel truss mega bridge over the Padma River.',
    previewGradient: 'from-blue-700 to-slate-900',
  },
  rural_village: {
    id: 'rural_village',
    name: 'Rural Herringbone Brick Road',
    bengaliName: 'গ্রামের হেরিংবোন ইটের রাস্তা',
    location: 'Bogra & Jessore Village Lanes',
    skyColor: 0xfbbf24,
    fogColor: 0xfde68a,
    fogDensity: 0.008,
    ambientColor: 0xfef3c7,
    sunColor: 0xf59e0b,
    sunIntensity: 1.8,
    roadWidth: 10.5,
    roadType: 'brick',
    sceneryType: 'countryside',
    description: 'Traditional red-brick herringbone road lined with banyan trees, bamboo shrines, tea stalls, and ducks by ponds.',
    previewGradient: 'from-orange-700 to-amber-950',
  },
  grand_circuit: {
    id: 'grand_circuit',
    name: 'Dhaka Grand Prix Circuit',
    bengaliName: 'ঢাকা গ্র্যান্ড প্রিক্স সার্কিট',
    location: 'International Racing Speedway',
    skyColor: 0x38bdf8,
    fogColor: 0x93c5fd,
    fogDensity: 0.004,
    ambientColor: 0xffffff,
    sunColor: 0xffedd5,
    sunIntensity: 2.2,
    roadWidth: 16,
    roadType: 'racetrack',
    sceneryType: 'city',
    description: 'Professional high-grip racing circuit with red-and-white curbs, grandstands, sponsor gantries, and tire barriers.',
    previewGradient: 'from-red-600 to-zinc-900',
  },
  flyover: {
    id: 'flyover',
    name: 'Mayor Hanif Flyover',
    bengaliName: 'মেয়র হানিফ ফ্লাইওভার',
    location: 'Jatrabari Elevated Corridor',
    skyColor: 0x60a5fa,
    fogColor: 0x93c5fd,
    fogDensity: 0.005,
    ambientColor: 0xffffff,
    sunColor: 0xffedd5,
    sunIntensity: 2.0,
    roadWidth: 13,
    roadType: 'concrete',
    sceneryType: 'city',
    description: 'Elevated highway expressway with safety barriers, overhead green directional gantries, and expansive city vistas.',
    previewGradient: 'from-indigo-600 to-slate-900',
  },
  river_bridge: {
    id: 'river_bridge',
    name: 'Meghna Cable-Stayed Bridge',
    bengaliName: 'মেঘনা সেতু',
    location: 'Dhaka-Chittagong Highway',
    skyColor: 0x38bdf8,
    fogColor: 0x7dd3fc,
    fogDensity: 0.006,
    ambientColor: 0xe0f2fe,
    sunColor: 0xffedd5,
    sunIntensity: 2.1,
    roadWidth: 14,
    roadType: 'concrete',
    sceneryType: 'bridge',
    description: 'Majestic steel truss bridge crossing sparkling broad river waters with suspension cable stays and open horizon.',
    previewGradient: 'from-sky-600 to-blue-900',
  },
  industrial_zone: {
    id: 'industrial_zone',
    name: 'Gazipur Industrial Avenue',
    bengaliName: 'গাজীপুর শিল্প এলাকা',
    location: 'Tongi & Joydebpur Corridor',
    skyColor: 0xfb923c,
    fogColor: 0xfed7aa,
    fogDensity: 0.009,
    ambientColor: 0xffedd5,
    sunColor: 0xf97316,
    sunIntensity: 1.7,
    roadWidth: 13,
    roadType: 'asphalt',
    sceneryType: 'city',
    description: 'Dynamic industrial corridor with brick kilns, cargo containers, warehouses, and heavy freight trucks.',
    previewGradient: 'from-orange-800 to-stone-900',
  },
  riverside_road: {
    id: 'riverside_road',
    name: 'Buriganga Riverfront Ghat',
    bengaliName: 'বুড়িগঙ্গা রিভারফ্রন্ট',
    location: 'Sadarghat River Boulevard',
    skyColor: 0x38bdf8,
    fogColor: 0xbae6fd,
    fogDensity: 0.007,
    ambientColor: 0xf0f9ff,
    sunColor: 0xfef08a,
    sunIntensity: 1.9,
    roadWidth: 12,
    roadType: 'asphalt',
    sceneryType: 'coastal',
    description: 'Riverside boulevard alongside wooden passenger boats (nouka), wooden jetties, and gentle river breezes.',
    previewGradient: 'from-cyan-600 to-blue-950',
  },
};

export interface SavedCheckpoint {
  checkpointId: number;
  distance: number;
  posX: number;
  posZ: number;
  vehicle: VehicleStage;
  biome: BiomeType;
  score: number;
  coins: number;
  timestamp: number;
}

export interface RemotePlayerState {
  id: string;
  name: string;
  vehicle: VehicleStage;
  posX: number;
  posY: number;
  posZ: number;
  speed: number;
  rotationY: number;
  rotationZ: number;
  isDriving: boolean;
  score: number;
  distance: number;
  lastCheckpoint: number;
}

export type VersusMatchFormat = '1v1' | '2v2' | '3v3' | '4v4';

export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  touchSensitivity: number; // 0.5 to 2.0
  showMinimap: boolean;
  gestureTutorialSeen: boolean;
  gameMode: GameMode;
  selectedMap: BiomeType;
  playerName: string;
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
  lastSavedCheckpoint?: SavedCheckpoint | null;
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
  checkpointsPassed: number;
}

export interface MinimapEntity {
  id: string;
  type: 'player' | 'cng' | 'bus' | 'traffic' | 'pickup' | 'obstacle' | 'remote_player' | 'checkpoint';
  x: number; // relative to road center (-6 to +6)
  z: number; // relative to player (-10 to +120)
}
