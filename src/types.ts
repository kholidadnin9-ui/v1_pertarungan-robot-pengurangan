
const imgBlue = '/images/robot-blue.png';
const imgYellow = '/images/robot-yellow.png';
const imgPink = '/images/robot-pink.png';
const imgGreen = '/images/robot-green.png';

export type RobotColor = 'blue' | 'yellow' | 'pink' | 'green';

export interface RobotInfo {
  id: RobotColor;
  name: string;
  image: string;
  laserColor: string;
  laserGlow: string;
  theme: string;
  frame: string;
  glow: string;
  solid: string;
  /** Gun muzzle position in % of the image box */
  muzzle: { x: number; y: number };
  /** Chest core position (impact target) in % of the image box */
  core: { x: number; y: number };
}

export const ROBOTS: Record<RobotColor, RobotInfo> = {
  blue: {
    id: 'blue',
    name: 'Bolt Biru',
    image: imgBlue,
    laserColor: '#22d3ee',
    laserGlow: 'rgba(34,211,238,0.9)',
    theme: 'from-sky-400 to-blue-500',
    frame: 'border-sky-500 bg-sky-100',
    glow: 'rgba(56,189,248,0.6)',
    solid: '#0ea5e9',
    muzzle: { x: 97, y: 31.8 },
    core: { x: 47, y: 42 },
  },
  yellow: {
    id: 'yellow',
    name: 'Volt Kuning',
    image: imgYellow,
    laserColor: '#f59e0b',
    laserGlow: 'rgba(250,204,21,0.9)',
    theme: 'from-amber-300 to-orange-400',
    frame: 'border-amber-500 bg-amber-100',
    glow: 'rgba(251,191,36,0.6)',
    solid: '#f59e0b',
    muzzle: { x: 97, y: 32.9 },
    core: { x: 47, y: 42 },
  },
  pink: {
    id: 'pink',
    name: 'Nova Pink',
    image: imgPink,
    laserColor: '#ec4899',
    laserGlow: 'rgba(244,114,182,0.9)',
    theme: 'from-pink-400 to-rose-500',
    frame: 'border-pink-500 bg-pink-100',
    glow: 'rgba(244,114,182,0.6)',
    solid: '#ec4899',
    muzzle: { x: 97, y: 33.3 },
    core: { x: 47, y: 42 },
  },
  green: {
    id: 'green',
    name: 'Rex Hijau',
    image: imgGreen,
    laserColor: '#22c55e',
    laserGlow: 'rgba(74,222,128,0.9)',
    theme: 'from-lime-400 to-emerald-500',
    frame: 'border-emerald-500 bg-emerald-100',
    glow: 'rgba(74,222,128,0.6)',
    solid: '#22c55e',
    muzzle: { x: 97, y: 23.2 },
    core: { x: 47, y: 42 },
  },
};

export interface LevelConfig {
  level: number;
  name: string;
  subtitle: string;
  rangeMax: number;
  timePerQuestion: number;
  cpuMinDelay: number;
  cpuMaxDelay: number;
  cpuAccuracy: number;
  stars: number;
  icon: string;
  bg: string;
}

export interface Question {
  a: number;
  b: number;
  answer: number;
  options: number[];
}

export interface PlayerSetup {
  name: string;
  robot: RobotColor;
}
