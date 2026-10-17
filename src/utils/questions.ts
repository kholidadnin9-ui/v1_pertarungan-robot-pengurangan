import { LevelConfig, Question } from '../types';

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: 'Level 1',
    subtitle: 'Latihan Dasar 1–10',
    rangeMax: 10,
    timePerQuestion: 20,
    cpuMinDelay: 11,
    cpuMaxDelay: 17,
    cpuAccuracy: 0.45,
    stars: 1,
    icon: '🌱',
    bg: 'from-emerald-300 to-teal-400',
  },
  {
    level: 2,
    name: 'Level 2',
    subtitle: 'Petualang 1–20',
    rangeMax: 20,
    timePerQuestion: 18,
    cpuMinDelay: 9,
    cpuMaxDelay: 15,
    cpuAccuracy: 0.55,
    stars: 2,
    icon: '🚀',
    bg: 'from-sky-300 to-blue-500',
  },
  {
    level: 3,
    name: 'Level 3',
    subtitle: 'Pahlawan 1–50',
    rangeMax: 50,
    timePerQuestion: 16,
    cpuMinDelay: 8,
    cpuMaxDelay: 13,
    cpuAccuracy: 0.62,
    stars: 3,
    icon: '⚡',
    bg: 'from-amber-300 to-orange-500',
  },
  {
    level: 4,
    name: 'Level 4',
    subtitle: 'Master 1–100',
    rangeMax: 100,
    timePerQuestion: 15,
    cpuMinDelay: 7,
    cpuMaxDelay: 12,
    cpuAccuracy: 0.7,
    stars: 4,
    icon: '🔥',
    bg: 'from-orange-400 to-red-500',
  },
  {
    level: 5,
    name: 'Level 5',
    subtitle: 'Legenda 1–100 Meminjam',
    rangeMax: 100,
    timePerQuestion: 12,
    cpuMinDelay: 6,
    cpuMaxDelay: 10.5,
    cpuAccuracy: 0.78,
    stars: 5,
    icon: '👑',
    bg: 'from-violet-400 to-purple-600',
  },
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeOptions(answer: number, max: number): number[] {
  const set = new Set<number>([answer]);
  const candidates = [
    answer + 1, answer - 1,
    answer + 2, answer - 2,
    answer + 3, answer - 3,
    answer + 5, answer - 5,
    answer + 10, answer - 10,
    answer + rand(4, 9), answer - rand(4, 9),
  ];
  const shuffledCandidates = shuffle(candidates);
  for (const c of shuffledCandidates) {
    if (set.size >= 3) break;
    if (c >= 0 && c <= max && !set.has(c)) set.add(c);
  }
  let guard = 0;
  while (set.size < 3 && guard < 100) {
    const c = rand(0, max);
    if (!set.has(c)) set.add(c);
    guard++;
  }
  return shuffle([...set]);
}

/** Generate one subtraction question for a level (a - b, a >= b, answer >= 0) */
export function generateQuestion(level: number): Question {
  const cfg = LEVELS[level - 1];
  const max = cfg.rangeMax;
  let a = 0;
  let b = 0;

  if (level === 1) {
    a = rand(2, 10);
    b = rand(0, a);
  } else if (level === 2) {
    a = rand(5, 20);
    b = rand(0, a);
  } else if (level === 3) {
    a = rand(11, 50);
    b = rand(1, a);
  } else if (level === 4) {
    a = rand(21, 100);
    b = rand(1, a);
    if (b === a) b = Math.max(0, a - rand(1, 20));
  } else {
    // Level 5: force borrowing (satuan a < satuan b) most of the time
    let tries = 0;
    do {
      a = rand(21, 100);
      b = rand(11, a - 1);
      tries++;
    } while (tries < 30 && (a % 10 >= b % 10 || a === b));
    if (a % 10 >= b % 10) {
      // fallback: manually create borrow
      a = rand(31, 99);
      const aOnes = rand(0, 4);
      a = Math.floor(a / 10) * 10 + aOnes;
      const bTens = rand(1, Math.floor(a / 10) - 0);
      const bOnes = rand(aOnes + 1, 9);
      b = Math.min(a - 1, bTens * 10 + bOnes);
      if (b >= a) b = a - rand(6, 15);
    }
  }

  const answer = a - b;
  const options = makeOptions(answer, max);
  return { a, b, answer, options };
}

/** Setiap level WAJIB menuntaskan 10 soal. */
export const TOTAL_QUESTIONS_PER_LEVEL = 10;

/** Label tipe soal per level — dipakai agar regenerate tetap satu tipe. */
export function levelTypeLabel(level: number): string {
  const cfg = LEVELS[level - 1];
  if (!cfg) return '';
  if (level === 1) return 'Tipe: a − b, a 1–10';
  if (level === 2) return 'Tipe: a − b, a 1–20';
  if (level === 3) return 'Tipe: a − b, a 11–50';
  if (level === 4) return 'Tipe: a − b, a 21–100';
  return 'Tipe: a − b meminjam, a 21–100';
}

/**
 * Generate satu set segar berisi `count` soal untuk level tersebut.
 * Setiap pemanggilan menghasilkan angka-angka BARU yang acak,
 * tetapi tipenya selalu sama untuk level yang sama.
 * Contoh Level 1: refresh bisa mengubah "4 − 3" menjadi "2 − 1".
 */
export function generateLevelQuestions(level: number, count = TOTAL_QUESTIONS_PER_LEVEL): Question[] {
  const qs: Question[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (qs.length < count && guard < 300) {
    const q = generateQuestion(level);
    const key = `${q.a}-${q.b}`;
    if (!seen.has(key)) {
      seen.add(key);
      qs.push(q);
    }
    guard++;
  }
  while (qs.length < count) qs.push(generateQuestion(level));
  return qs;
}

/** Damage based on speed: faster = bigger damage */
export function damageForTime(elapsedSec: number, totalSec: number): number {
  const ratio = elapsedSec / totalSec;
  if (ratio <= 0.25) return 20;
  if (ratio <= 0.5) return 16;
  if (ratio <= 0.75) return 13;
  return 10;
}
