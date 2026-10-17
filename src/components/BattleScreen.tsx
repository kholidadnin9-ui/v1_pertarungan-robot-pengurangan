import arenaBg from '../assets/arena-futuristic.jpg';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Volume2, VolumeX, Shuffle } from 'lucide-react';
import { PlayerSetup, Question, ROBOTS } from '../types';
import { LEVELS, generateLevelQuestions, damageForTime, TOTAL_QUESTIONS_PER_LEVEL, levelTypeLabel } from '../utils/questions';
import { sfx, isMuted, setMuted } from '../utils/sounds';
import RobotFighter, { RobotStatus } from './RobotFighter';
import { Beam, BeamGeom } from './Effects';

interface Props {
  mode: 1 | 2;
  level: number;
  players: [PlayerSetup, PlayerSetup];
  battleKey: number;
  onExit: () => void;
  onRematch: () => void;
  onSetup: () => void;
}

interface FxState {
  explosion: boolean;
  explosionBig: boolean;
  explosionKey: number;
  shock: boolean;
  damageText: string | null;
  damageGood: boolean;
  damageKey: number;
}
const freshFx = (): FxState => ({
  explosion: false, explosionBig: false, explosionKey: 0,
  shock: false, damageText: null, damageGood: false, damageKey: 0,
});

const ACCENT = [
  { text: 'text-sky-700', border: 'border-sky-500', chip: 'bg-sky-500 text-white', bar: 'from-sky-400 to-blue-500' },
  { text: 'text-pink-700', border: 'border-pink-500', chip: 'bg-pink-500 text-white', bar: 'from-pink-400 to-rose-500' },
];

export default function BattleScreen({ mode, level, players, battleKey, onExit, onRematch, onSetup }: Props) {
  const cfg = LEVELS[level - 1];
  const totalTime = cfg.timePerQuestion;

  // Satu set soal segar per battle. Setiap generate menghasilkan angka BARU
  // dengan tipe yang SAMA untuk level ini (mis. Level 1 "4−3" bisa jadi "2−1").
  const [questions, setQuestions] = useState<Question[]>(() => generateLevelQuestions(level, TOTAL_QUESTIONS_PER_LEVEL));
  // Naik setiap kali set soal diganti — memicu countdown ulang & acak opsi baru.
  const [sessionId, setSessionId] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [hp, setHp] = useState<[number, number]>([100, 100]);
  const [correct, setCorrect] = useState<[number, number]>([0, 0]);
  const [bestMs, setBestMs] = useState<[number | null, number | null]>([null, null]);
  const [phase, setPhase] = useState<'countdown' | 'battle' | 'gameover'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [roundLock, setRoundLock] = useState(false);
  const [locked, setLocked] = useState<[boolean, boolean]>([false, false]);
  const [statuses, setStatuses] = useState<[RobotStatus, RobotStatus]>(['intro', 'intro']);
  const [fx, setFx] = useState<[FxState, FxState]>([freshFx(), freshFx()]);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [beam, setBeam] = useState<BeamGeom | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [msgKey, setMsgKey] = useState(0);
  const [koSlam, setKoSlam] = useState(0);
  const [feedback, setFeedback] = useState<[{ v: number | null; ok: boolean }, { v: number | null; ok: boolean }]>([{ v: null, ok: false }, { v: null, ok: false }]);
  const [winner, setWinner] = useState<0 | 1 | -1 | null>(null);
  const [muted, setM] = useState(isMuted());

  const q = questions[qIndex];
  const timers = useRef<number[]>([]);
  const roundStartRef = useRef<number>(0);
  const stateRef = useRef({ roundLock, locked, phase, qIndex });
  stateRef.current = { roundLock, locked, phase, qIndex };
  const hpRef = useRef(hp);
  hpRef.current = hp;
  const arenaRef = useRef<HTMLDivElement>(null);
  const robotRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)] as const;
  // KO hanya boleh dieksekusi sekali per battle (cegah dobel dari timer yang balapan).
  const koFiredRef = useRef(false);

  /** Measure the attacker's gun muzzle and the victim's chest, in arena pixels. */
  const computeBeam = useCallback((attacker: 0 | 1): BeamGeom | null => {
    const arena = arenaRef.current;
    const aEl = robotRefs[attacker].current;
    const vEl = robotRefs[attacker === 0 ? 1 : 0].current;
    if (!arena || !aEl || !vEl) return null;
    const muzzleEl = aEl.querySelector('[data-muzzle]') as HTMLElement | null;
    const coreEl = vEl.querySelector('[data-core]') as HTMLElement | null;
    if (!muzzleEl || !coreEl) return null;
    const ar = arena.getBoundingClientRect();
    const m = muzzleEl.getBoundingClientRect();
    const t = coreEl.getBoundingClientRect();
    const x1 = m.left + m.width / 2 - ar.left;
    const y1 = m.top + m.height / 2 - ar.top;
    const x2 = t.left + t.width / 2 - ar.left;
    const y2 = t.top + t.height / 2 - ar.top;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const rc = ROBOTS[players[attacker].robot];
    return {
      x: x1, y: y1,
      len: Math.hypot(dx, dy),
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      color: rc.laserColor,
      glow: rc.laserGlow,
    };
  }, [players]);

  const optionsP1 = useMemo(() => [...q.options].sort(() => Math.random() - 0.5), [q, sessionId]);
  const optionsP2 = useMemo(() => [...q.options].sort(() => Math.random() - 0.5), [q, sessionId]);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);
  useEffect(() => {
    const arr = timers.current;
    return () => arr.forEach(clearTimeout);
  }, []);

  const fireConfetti = useCallback(() => {
    const colors = ['#fbbf24', '#22d3ee', '#f472b6', '#4ade80', '#ffffff'];
    confetti({ particleCount: 130, spread: 100, origin: { y: 0.6 }, colors });
    setTimeout(() => confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0 }, colors }), 250);
    setTimeout(() => confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1 }, colors }), 450);
  }, []);

  /* ---------- countdown ---------- */
  useEffect(() => {
    setPhase('countdown');
    setCountdown(3);
    sfx.countBeep();
    const t1 = window.setTimeout(() => { setCountdown(2); sfx.countBeep(); }, 900);
    const t2 = window.setTimeout(() => { setCountdown(1); sfx.countBeep(); }, 1800);
    const t3 = window.setTimeout(() => { setCountdown(0); sfx.countBeep(true); }, 2700);
    const t4 = window.setTimeout(() => {
      setPhase('battle');
      setStatuses(['idle', 'idle']);
      roundStartRef.current = Date.now();
    }, 3500);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [battleKey, sessionId]);

  /* ---------- timer tick ---------- */
  useEffect(() => {
    if (phase !== 'battle' || roundLock || timeLeft <= 0) return;
    const id = window.setTimeout(() => setTimeLeft((t) => Math.max(0, +(t - 0.1).toFixed(2))), 100);
    return () => clearTimeout(id);
  }, [phase, timeLeft, roundLock, qIndex]);
  useEffect(() => {
    if (phase === 'battle' && !roundLock && timeLeft <= 0) handleTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  /* ---------- CPU brain ---------- */
  useEffect(() => {
    if (phase !== 'battle' || mode !== 1 || roundLock) return;
    if (stateRef.current.locked[1]) return;
    const delay = (cfg.cpuMinDelay + Math.random() * (cfg.cpuMaxDelay - cfg.cpuMinDelay)) * 1000;
    const willCorrect = Math.random() < cfg.cpuAccuracy;
    const id = window.setTimeout(() => {
      const s = stateRef.current;
      if (s.phase !== 'battle' || s.roundLock || s.locked[1]) return;
      handleCpuAnswer(willCorrect);
    }, Math.min(delay, totalTime * 1000 - 500));
    timers.current.push(id);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex, roundLock, battleKey, mode]);

  const showMsg = (text: string, ms = 1600) => {
    setMessage(text);
    setMsgKey((k) => k + 1);
    later(() => setMessage(null), ms);
  };

  const setStatusAt = (idx: 0 | 1, st: RobotStatus) =>
    setStatuses((prev) => { const n: [RobotStatus, RobotStatus] = [...prev] as [RobotStatus, RobotStatus]; n[idx] = st; return n; });
  const setFxAt = (idx: 0 | 1, patch: Partial<FxState>) =>
    setFx((prev) => { const n: [FxState, FxState] = [{ ...prev[0] }, { ...prev[1] }]; n[idx] = { ...n[idx], ...patch }; return n; });

  /** Soal terakhir? Hanya di soal ke-10 robot boleh KO — soal 1–9 wajib selesai. */
  const isLastQuestion = qIndex >= questions.length - 1;

  /**
   * Mulai ulang battle dengan set soal yang BARU (tipe sama, angka beda).
   * Dipakai tombol 🔀 dan otomatis tiap "Main Lagi" lewat battleKey yang baru.
   */
  const startFreshBattle = useCallback((fresh: Question[]) => {
    // Hentikan semua animasi/efek battle lama agar tidak bocor ke soal baru.
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setQuestions(fresh);
    setQIndex(0);
    setHp([100, 100]);
    setCorrect([0, 0]);
    setBestMs([null, null]);
    setRoundLock(false);
    setLocked([false, false]);
    setStatuses(['intro', 'intro']);
    setFx([freshFx(), freshFx()]);
    setBeam(null);
    setMessage(null);
    setFeedback([{ v: null, ok: false }, { v: null, ok: false }]);
    setWinner(null);
    setKoSlam(0);
    setTimeLeft(totalTime);
    roundStartRef.current = Date.now();
  }, [totalTime]);

  /** Tombol 🔀: ganti 10 soal dengan angka-angka baru, tipe level tetap sama. */
  const handleShuffleQuestions = () => {
    if (phase === 'countdown') return;
    sfx.click();
    startFreshBattle(generateLevelQuestions(level, TOTAL_QUESTIONS_PER_LEVEL));
    setSessionId((s) => s + 1); // memicu countdown + soal baru
  };

  /* ---------- ATTACK ---------- */
  const runAttack = useCallback((attacker: 0 | 1, damage: number) => {
    const victim: 0 | 1 = attacker === 0 ? 1 : 0;
    setRoundLock(true);
    setLocked([true, true]);
    setStatusAt(attacker, 'charging');
    showMsg(`${players[attacker].name} MENEMBAK!`);

    later(() => {
      setStatusAt(attacker, 'attacking');
      sfx.laser();
      // measure on the next frame so the lunge transform is already applied
      requestAnimationFrame(() => {
        const g = computeBeam(attacker);
        if (g) setBeam(g);
      });
    }, 350);

    // Soal 1–9 wajib selesai: robot bertahan dengan sisa 1 HP (tidak KO di tengah jalan).
    // KO hanya boleh terjadi di soal ke-10.
    const allowKO = isLastQuestion;

    later(() => {
      setBeam(null);
      setStatusAt(attacker, 'idle');
      setStatusAt(victim, 'hit');
      sfx.explosion();
      setFxAt(victim, { explosion: true, explosionBig: false, explosionKey: Date.now(), damageText: `-${damage}`, damageGood: false, damageKey: Date.now() });
      setHp((prev) => {
        const n: [number, number] = [...prev] as [number, number];
        n[victim] = Math.max(allowKO ? 0 : 1, n[victim] - damage);
        return n;
      });
      if (!allowKO && hpRef.current[victim] - damage <= 0) {
        showMsg(`😱 ${players[victim].name} hampir kalah! Tersisa 1 HP — lanjut!`, 1800);
      }
    }, 950);

    later(() => {
      setFxAt(victim, { explosion: false, damageText: null });
      if (stateRef.current.phase !== 'battle') return;
      if (hpRef.current[victim] <= 0) runKnockout(victim, attacker);
      else advanceOrFinish(hpRef.current);
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, qIndex]);

  const runKnockout = (loser: 0 | 1, winIdx: 0 | 1) => {
    if (koFiredRef.current) return;
    koFiredRef.current = true;
    setRoundLock(true);
    setKoSlam(Date.now());
    sfx.bigExplosion();
    setStatusAt(loser, 'defeated');
    setFxAt(loser, { explosion: true, explosionBig: true, explosionKey: Date.now(), damageText: 'K.O.!', damageGood: false, damageKey: Date.now() });
    showMsg(`${players[loser].name} MELEDAK!`, 2000);
    later(() => {
      setFxAt(loser, { explosion: false, damageText: null });
      setStatusAt(loser, 'gone');
      setStatusAt(winIdx, 'victory');
      sfx.win();
      fireConfetti();
      setWinner(winIdx);
      later(() => setPhase('gameover'), 700);
    }, 1600);
  };

  /** Dipanggil tepat setelah soal ke-10 tuntas: tentukan pemenang, KO-kan yang kalah. */
  const finishBattle = (currentHp: [number, number]) => {
    let w: 0 | 1 | -1;
    if (currentHp[0] > currentHp[1]) w = 0;
    else if (currentHp[1] > currentHp[0]) w = 1;
    else w = -1;
    if (w === -1) {
      setStatuses(['victory', 'victory']);
      sfx.win();
      showMsg('SERI! 10 soal tuntas, kalian sama hebat! 🎉', 2200);
      fireConfetti();
      setWinner(w);
      later(() => setPhase('gameover'), 1300);
    } else {
      showMsg(`🏆 ${players[w].name} MENANG! 10 soal tuntas!`, 2000);
      const loser: 0 | 1 = w === 0 ? 1 : 0;
      runKnockout(loser, w);
    }
  };

  const advanceOrFinish = (currentHp: [number, number]) => {
    if (qIndex >= questions.length - 1) finishBattle(currentHp);
    else nextQuestion();
  };

  const nextQuestion = () => {
    setQIndex((i) => i + 1);
    setLocked([false, false]);
    setFeedback([{ v: null, ok: false }, { v: null, ok: false }]);
    setFx([freshFx(), freshFx()]);
    setStatuses((prev) => {
      const map = (s: RobotStatus): RobotStatus => (s === 'gone' || s === 'defeated' ? s : 'idle');
      return [map(prev[0]), map(prev[1])];
    });
    setTimeLeft(totalTime);
    setRoundLock(false);
    roundStartRef.current = Date.now();
    sfx.roundStart();
  };

  /* ---------- ANSWERS ---------- */
  const handleAnswer = (playerIdx: 0 | 1, value: number) => {
    const s = stateRef.current;
    if (s.phase !== 'battle' || s.roundLock || s.locked[playerIdx]) return;
    const elapsed = totalTime - timeLeft;

    if (value === q.answer) {
      sfx.correct();
      setFeedback((prev) => { const n = [...prev] as typeof prev; n[playerIdx] = { v: value, ok: true }; return n; });
      setCorrect((prev) => { const n: [number, number] = [...prev] as [number, number]; n[playerIdx]++; return n; });
      const ms = Date.now() - roundStartRef.current;
      setBestMs((prev) => {
        const n: [number | null, number | null] = [...prev] as [number | null, number | null];
        if (n[playerIdx] === null || ms < n[playerIdx]!) n[playerIdx] = ms;
        return n;
      });
      runAttack(playerIdx, damageForTime(elapsed, totalTime));
    } else {
      sfx.wrong();
      sfx.shock();
      setFeedback((prev) => { const n = [...prev] as typeof prev; n[playerIdx] = { v: value, ok: false }; return n; });
      setStatusAt(playerIdx, 'shocked');
      setFxAt(playerIdx, { shock: true, damageText: '-6', damageGood: false, damageKey: Date.now() });
      // Salah sendiri max −6; sebelum soal ke-10 robot dipertahankan di 1 HP agar 10 soal tetap tuntas.
      const allowSelfKO = qIndex >= questions.length - 1;
      setHp((prev) => { const n: [number, number] = [...prev] as [number, number]; n[playerIdx] = Math.max(allowSelfKO ? 0 : 1, n[playerIdx] - 6); return n; });
      const opp: 0 | 1 = playerIdx === 0 ? 1 : 0;
      later(() => {
        setStatusAt(playerIdx, 'idle');
        setFxAt(playerIdx, { shock: false, damageText: null });
        // self-destruction? (hanya mungkin di soal ke-10)
        if (hpRef.current[playerIdx] <= 0) runKnockout(playerIdx, opp);
      }, 1000);
      const newLocked: [boolean, boolean] = [...stateRef.current.locked] as [boolean, boolean];
      newLocked[playerIdx] = true;
      setLocked(newLocked);
      if (newLocked[0] && newLocked[1]) {
        setRoundLock(true);
        showMsg('Keduanya salah! Lanjut...', 1300);
        later(() => { advanceOrFinish(hpRef.current); }, 1300);
      }
    }
  };

  const handleCpuAnswer = (willCorrect: boolean) => {
    const s = stateRef.current;
    if (s.phase !== 'battle' || s.roundLock || s.locked[1]) return;
    const elapsed = totalTime - timeLeft;
    if (willCorrect) {
      sfx.correct();
      setFeedback((prev) => { const n = [...prev] as typeof prev; n[1] = { v: q.answer, ok: true }; return n; });
      setCorrect((prev) => { const n: [number, number] = [...prev] as [number, number]; n[1]++; return n; });
      const ms = Date.now() - roundStartRef.current;
      setBestMs((prev) => { const n: [number | null, number | null] = [...prev] as [number | null, number | null]; if (n[1] === null || ms < n[1]!) n[1] = ms; return n; });
      runAttack(1, damageForTime(elapsed, totalTime));
    } else {
      sfx.wrong();
      sfx.shock();
      const wrongVal = q.options.find((o) => o !== q.answer) ?? q.answer + 1;
      setFeedback((prev) => { const n = [...prev] as typeof prev; n[1] = { v: wrongVal, ok: false }; return n; });
      setStatusAt(1, 'shocked');
      setFxAt(1, { shock: true, damageText: '-6', damageGood: false, damageKey: Date.now() });
      const allowCpuSelfKO = qIndex >= questions.length - 1;
      setHp((prev) => { const n: [number, number] = [...prev] as [number, number]; n[1] = Math.max(allowCpuSelfKO ? 0 : 1, n[1] - 6); return n; });
      showMsg('Komputer kesetrum! Ayo kalahkan!', 1300);
      later(() => {
        setStatusAt(1, 'idle');
        setFxAt(1, { shock: false, damageText: null });
        if (hpRef.current[1] <= 0) runKnockout(1, 0);
      }, 1000);
      const newLocked: [boolean, boolean] = [stateRef.current.locked[0], true];
      setLocked(newLocked);
      if (newLocked[0] && newLocked[1]) {
        setRoundLock(true);
        later(() => { advanceOrFinish(hpRef.current); }, 1300);
      }
    }
  };

  const handleTimeout = () => {
    const s = stateRef.current;
    if (s.phase !== 'battle' || s.roundLock) return;
    setRoundLock(true);
    setLocked([true, true]);
    sfx.timeout();
    showMsg('Waktu habis! Tidak ada yang menembak.', 1500);
    later(() => { advanceOrFinish(hpRef.current); }, 1400);
  };

  const timerPct = Math.max(0, (timeLeft / totalTime) * 100);
  const timerDanger = timeLeft <= 5 && !roundLock && phase === 'battle';
  const cpuThinking = mode === 1 && phase === 'battle' && !locked[1] && !roundLock;

  const stars = useMemo(() => {
    if (winner === null) return 0;
    if (winner === -1) return 2;
    const c = correct[winner];
    return c >= 6 ? 3 : c >= 4 ? 2 : 1;
  }, [winner, correct]);

  const fmtMs = (ms: number | null) => (ms === null ? '–' : `${(ms / 1000).toFixed(1)} dtk`);

  return (
    <div className="battle-shell select-none bg-gradient-to-b from-sky-200 to-emerald-100">
      {/* battlefield background — kota futuristik cerah */}
      <div className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${arenaBg})` }} />
      {/* scrim: menjaga HUD & angka soal tetap terbaca di atas latar yang ramai */}
      <div className="city-scrim pointer-events-none absolute inset-0" />
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-25" />
      <div className="vignette pointer-events-none absolute inset-0" />

      {/* ============ HUD ============ */}
      <div className="relative z-40 flex items-start gap-1 px-1.5 pt-1 sm:gap-2 sm:px-3 sm:pt-2 md:gap-3 md:px-5 md:pt-3">
        <PlayerCard
          idx={0}
          name={players[0].name}
          isCpu={mode === 1}
          thinking={cpuThinking}
          hp={hp[0]}
          correct={correct[0]}
          active={!locked[0] && !roundLock && phase === 'battle'}
        />
        {/* center info */}
        <div className="panel flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2">
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
            <span className="font-game rounded-lg bg-amber-400 px-1.5 py-0.5 text-[9px] text-amber-950 shadow sm:px-2 sm:text-[10px] md:text-sm">{cfg.name}</span>
            <span className="font-game truncate text-[9px] text-slate-600 sm:text-[10px] md:text-xs">SOAL {Math.min(qIndex + 1, 10)}/10</span>
            <span className="hidden gap-1 sm:flex">
              {questions.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full md:h-2 md:w-2 ${i < qIndex ? 'bg-emerald-400' : i === qIndex ? 'animate-pulse bg-amber-400' : 'bg-slate-300'}`} />
              ))}
            </span>
          </div>
          <div className="flex w-full items-center gap-1.5 sm:gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 sm:h-2.5 md:h-3">
              <div
                className={`h-full rounded-full transition-[width] duration-100 ${timerDanger ? 'animate-hp-blink bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-lime-300 via-amber-300 to-orange-400'}`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
            <span className={`font-game w-10 text-right text-[11px] sm:w-12 sm:text-xs md:text-base ${timerDanger ? 'text-red-600' : 'text-slate-700'}`}>
              {timeLeft.toFixed(1)}s
            </span>
          </div>
          <div className="flex w-full items-center justify-between gap-1">
            <button onClick={() => { sfx.click(); onExit(); }} className="btn-press rounded-lg border-2 border-sky-300 bg-sky-100 p-1" aria-label="Keluar">
              <ArrowLeft className="h-3.5 w-3.5 text-sky-700 md:h-4 md:w-4" />
            </button>
            <span className="font-game hidden text-[10px] tracking-wider text-slate-500 sm:inline md:text-xs">⚡ SIAPA CEPAT DIA MENEMBAK</span>
            <span className="font-game text-[9px] font-bold text-slate-500 sm:hidden">10 SOAL WAJIB TUNTAS</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleShuffleQuestions}
                disabled={phase === 'countdown'}
                className="btn-press rounded-lg border-2 border-amber-300 bg-amber-100 p-1 disabled:opacity-40"
                aria-label="Acak soal baru"
                title="Soal baru — tipe sama, angka beda"
              >
                <Shuffle className="h-3.5 w-3.5 text-amber-600 md:h-4 md:w-4" />
              </button>
              <button
                onClick={() => { const m = !muted; setM(m); setMuted(m); if (!m) sfx.click(); }}
                className="btn-press rounded-lg border-2 border-sky-300 bg-sky-100 p-1" aria-label="Suara"
              >
                {muted ? <VolumeX className="h-3.5 w-3.5 text-slate-500 md:h-4 md:w-4" /> : <Volume2 className="h-3.5 w-3.5 text-sky-600 md:h-4 md:w-4" />}
              </button>
            </div>
          </div>
        </div>
        <PlayerCard
          idx={1}
          name={mode === 1 ? 'KOMPUTER' : players[1].name}
          isCpu={mode === 1}
          thinking={cpuThinking}
          hp={hp[1]}
          correct={correct[1]}
          active={!locked[1] && !roundLock && phase === 'battle'}
          right
        />
      </div>

      {/* ============ ARENA (robots only — soal tidak menutupi) ============ */}
      <div ref={arenaRef} className="battle-arena z-10">
        <div className="flex h-full items-end justify-between px-[3vw] sm:px-[5vw] md:px-[8vw]">
          <div ref={robotRefs[0]} className="h-[88%] w-[38%] max-w-[340px] sm:h-[92%] sm:w-[34%]">
            <RobotFighter
              color={players[0].robot}
              side="left"
              status={statuses[0]}
              showExplosion={fx[0].explosion}
              explosionBig={fx[0].explosionBig}
              explosionKey={fx[0].explosionKey}
              showShock={fx[0].shock}
              damageText={fx[0].damageText}
              damageGood={fx[0].damageGood}
              damageKey={fx[0].damageKey}
              hp={hp[0]}
            />
          </div>
          <div ref={robotRefs[1]} className="h-[88%] w-[38%] max-w-[340px] sm:h-[92%] sm:w-[34%]">
            <RobotFighter
              color={players[1].robot}
              side="right"
              status={statuses[1]}
              showExplosion={fx[1].explosion}
              explosionBig={fx[1].explosionBig}
              explosionKey={fx[1].explosionKey}
              showShock={fx[1].shock}
              damageText={fx[1].damageText}
              damageGood={fx[1].damageGood}
              damageKey={fx[1].damageKey}
              hp={hp[1]}
            />
          </div>
        </div>

        {beam && <Beam geom={beam} />}

        {/* compact VS badge — does not cover robots */}
        <div className="pointer-events-none absolute left-1/2 top-[8%] z-20 -translate-x-1/2">
          <span className="font-game rounded-full border-2 border-white bg-gradient-to-r from-orange-400 to-red-500 px-2.5 py-0.5 text-[10px] text-white shadow sm:text-xs md:px-3 md:text-sm">VS</span>
        </div>
      </div>

      {/* ============ QUESTION + ANSWERS (compact, below arena) ============ */}
      <div className="battle-qa">
        <div key={`${sessionId}-${qIndex}`} className="animate-q-pop mx-auto mb-0.5 flex max-w-xl items-center justify-center gap-1.5 rounded-xl border-2 border-white bg-white/90 px-2 py-0.5 shadow sm:mb-1 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-1">
          <span className="font-game rounded-lg bg-orange-500 px-1.5 py-0.5 text-[9px] text-white sm:text-[11px]">SOAL {qIndex + 1}/{questions.length}</span>
          <div className="font-game q-eq text-slate-800">
            {q.a} <span className="text-orange-500">−</span> {q.b} <span className="text-sky-500">=</span> <span className="animate-pulse text-emerald-500">?</span>
          </div>
          {isLastQuestion && (
            <span className="font-game animate-pulse rounded-lg bg-red-500 px-1.5 py-0.5 text-[9px] text-white sm:text-[11px]">TERAKHIR!</span>
          )}
        </div>
        <div className="font-game mx-auto mb-1 max-w-xl truncate text-center text-[8px] tracking-wider text-slate-500 sm:text-[10px]">
          {levelTypeLabel(level)} • 🔀 ANGKA BARU TIAP MAIN / REFRESH
        </div>

        {mode === 1 ? (
          <div className="mx-auto grid max-w-2xl grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
            {optionsP1.map((opt) => {
              const fb = feedback[0];
              const picked = fb.v === opt;
              const disabled = roundLock || locked[0] || phase !== 'battle';
              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(0, opt)}
                  disabled={disabled}
                  className={`font-game ans-btn ans-num btn-press rounded-xl border-4 text-white shadow-lg transition-all sm:rounded-2xl ${
                    picked
                      ? fb.ok ? 'border-white bg-gradient-to-b from-lime-400 to-emerald-500 shadow-[0_4px_0_#15803d]' : 'animate-btn-shake border-white bg-gradient-to-b from-red-400 to-red-600 shadow-[0_4px_0_#991b1b]'
                      : disabled ? 'border-white bg-slate-300 text-white/70' : 'border-white bg-gradient-to-b from-sky-400 to-blue-500 shadow-[0_4px_0_#1d4ed8] hover:scale-[1.04]'
                  }`}
                >
                  {opt}{picked && (fb.ok ? ' ✓' : ' ✗')}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
            {([0, 1] as const).map((pi) => {
              const opts = pi === 0 ? optionsP1 : optionsP2;
              const fb = feedback[pi];
              const disabled = roundLock || locked[pi] || phase !== 'battle';
              return (
                <div key={pi} className={`flex flex-col rounded-xl border-4 ${ACCENT[pi].border} bg-white/90 p-1 shadow-lg sm:rounded-2xl sm:p-1.5 md:p-2`}>
                  <div className={`font-game mb-0.5 truncate text-[9px] tracking-wider sm:mb-1 sm:text-[11px] md:text-sm ${ACCENT[pi].text}`}>
                    {pi === 0 ? 'P1' : 'P2'} · {players[pi].name.toUpperCase()}
                  </div>
                  <div className="grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-2">
                    {opts.map((opt) => {
                      const picked = fb.v === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(pi, opt)}
                          disabled={disabled}
                          className={`font-game ans-btn ans-num btn-press rounded-lg border-4 border-white text-white shadow-md transition-all sm:rounded-xl ${
                            picked
                              ? fb.ok ? 'bg-gradient-to-b from-lime-400 to-emerald-500 shadow-[0_4px_0_#15803d]' : 'animate-btn-shake bg-gradient-to-b from-red-400 to-red-600 shadow-[0_4px_0_#991b1b]'
                              : disabled ? 'bg-slate-300 text-white/70' : `bg-gradient-to-b ${pi === 0 ? 'from-sky-400 to-blue-500 shadow-[0_4px_0_#1d4ed8]' : 'from-pink-400 to-rose-500 shadow-[0_4px_0_#be185d]'} hover:scale-[1.04]`
                          }`}
                        >
                          {opt}{picked && (fb.ok ? '✓' : '✗')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ message banner ============ */}
      {message && (
        <div key={msgKey} className="animate-banner-pop pointer-events-none absolute left-1/2 top-[38%] z-40 max-w-[92vw]">
          <span className="font-game inline-block max-w-full truncate rounded-2xl border-4 border-white bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-sm text-white shadow-xl sm:px-4 sm:py-1.5 sm:text-lg md:text-3xl">
            {message}
          </span>
        </div>
      )}

      {/* ============ K.O. slam ============ */}
      {koSlam > 0 && phase !== 'gameover' && (
        <div key={koSlam} className="animate-ko-slam pointer-events-none absolute left-1/2 top-[42%] z-50">
          <span className="font-game text-5xl text-amber-300 sm:text-7xl md:text-[10rem]" style={{ WebkitTextStroke: '5px #b45309', paintOrder: 'stroke fill' }}>K.O.!</span>
        </div>
      )}

      {/* ============ countdown ============ */}
      {phase === 'countdown' && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-sky-900/35 backdrop-blur-[2px]">
          <div key={countdown} className="animate-count-zoom font-game text-[64px] leading-none text-amber-300 sm:text-[90px] md:text-[140px]" style={{ WebkitTextStroke: '5px #ffffff', paintOrder: 'stroke fill' }}>
            {countdown > 0 ? countdown : 'GO!'}
          </div>
          <div className="font-game mt-2 rounded-full bg-white/90 px-4 py-1 text-xs tracking-[.2em] text-sky-700 shadow sm:text-sm md:text-lg">
            {countdown > 0 ? (sessionId > 0 ? '🔀 SOAL BARU! TIPE SAMA!' : 'BERSIAP TEMBAK!') : 'JAWAB CEPAT!'}
          </div>
        </div>
      )}

      {/* ============ RESULT ============ */}
      {phase === 'gameover' && winner !== null && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-sky-900/45 p-3 backdrop-blur-sm">
          <div className="animate-card-in my-auto w-full max-w-md rounded-3xl border-4 border-amber-400 bg-white p-4 text-center shadow-2xl sm:p-5 md:p-7 max-h-[92dvh] overflow-y-auto">
            {winner === -1 ? (
              <>
                <div className="font-game animate-float-y text-6xl">🤝</div>
                <h2 className="font-game mt-1 text-4xl text-sky-700 md:text-5xl">SERI!</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">Keduanya sama hebat!</p>
              </>
            ) : (
              <>
                <div className="font-game animate-float-y text-6xl">🏆</div>
                <h2 className="font-game glow-amber mt-1 text-3xl text-amber-500 md:text-5xl">
                  {players[winner].name.toUpperCase()} MENANG!
                </h2>
                <div className="mt-1 text-2xl">
                  {'⭐'.repeat(stars)}<span className="opacity-30">{'⭐'.repeat(3 - stars)}</span>
                </div>
              </>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {([0, 1] as const).map((i) => (
                <div key={i} className={`rounded-2xl border-4 p-3 text-left ${winner === i ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="font-game truncate text-sm text-slate-800 md:text-base">{winner === i ? '👑 ' : ''}{players[i].name}</div>
                  <div className="mt-1 text-xs font-extrabold text-slate-500">
                    ❤️ HP: <span className="text-red-500">{hp[i]}</span>
                    <span className="mx-1">•</span>✅ <span className="text-emerald-600">{correct[i]}/10</span>
                    <span className="mx-1">•</span>⚡ <span className="text-sky-600">{fmtMs(bestMs[i])}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 rounded-xl bg-sky-50 p-2 text-xs font-bold text-sky-700">
              ✅ 10/10 SOAL TUNTAS! 📚 {cfg.name} — {cfg.subtitle} • {levelTypeLabel(level)}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button onClick={() => { sfx.click(); onRematch(); }} className="font-game btn-press rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-xl text-amber-950 shadow-[0_0_25px_rgba(251,191,36,.4)]">
                🔄 MAIN LAGI (SOAL BARU)
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { sfx.click(); onSetup(); }} className="font-game btn-press rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-600 py-2.5 text-sm text-white md:text-base">
                  🛠 GANTI LEVEL
                </button>
                <button onClick={() => { sfx.click(); onExit(); }} className="font-game btn-press rounded-2xl bg-slate-200 py-2.5 text-sm text-slate-700 md:text-base">
                  🏠 BERANDA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function PlayerCard({
  idx, name, isCpu, thinking, hp, correct, active, right = false,
}: {
  idx: 0 | 1;
  name: string;
  isCpu: boolean;
  thinking: boolean;
  hp: number;
  correct: number;
  active: boolean;
  right?: boolean;
}) {
  const a = ACCENT[idx];
  const low = hp <= 30 && hp > 0;
  const dead = hp <= 0;
  return (
    <div className={`panel min-w-0 flex-1 max-w-[34%] rounded-xl border-4 px-1.5 py-1 sm:max-w-[30%] sm:rounded-2xl sm:px-2 sm:py-1.5 md:px-3 md:py-2 ${active ? a.border + ' scale-[1.03]' : 'border-white'} ${right ? 'text-right' : ''}`}>
      <div className={`flex items-center gap-1 ${right ? 'flex-row-reverse' : ''}`}>
        <span className={`font-game truncate rounded-md px-1 py-0.5 text-[8px] sm:px-1.5 sm:text-[10px] md:text-xs ${a.chip}`}>{isCpu ? 'CPU' : `P${idx + 1}`}</span>
        <span className="font-game truncate text-[10px] text-slate-800 sm:text-[11px] md:text-sm">{name.toUpperCase()}</span>
        {dead && <span className="text-xs">💀</span>}
      </div>
      <div className={`mt-0.5 flex items-center gap-1 sm:mt-1 sm:gap-1.5 ${right ? 'flex-row-reverse' : ''}`}>
        <div className={`h-2 flex-1 overflow-hidden rounded-full bg-slate-200 sm:h-2.5 md:h-3 ${right ? '-scale-x-100' : ''}`}>
          <div
            className={`hp-bar h-full rounded-full bg-gradient-to-r ${a.bar} ${low ? 'animate-hp-blink' : ''}`}
            style={{ width: `${Math.max(0, hp)}%`, transition: 'width .5s cubic-bezier(.34,1.3,.64,1)' }}
          />
        </div>
        <span className="font-game w-6 text-[9px] text-slate-600 sm:w-7 sm:text-[10px] md:text-xs">{Math.max(0, hp)}</span>
      </div>
      <div className={`mt-0.5 flex items-center justify-between text-[9px] font-extrabold sm:text-[10px] md:text-xs ${right ? 'flex-row-reverse' : ''}`}>
        <span className="text-amber-600">⭐ {correct}</span>
        {thinking && (
          <span className={`font-game flex items-center gap-1 text-sky-600 ${right ? 'flex-row-reverse' : ''}`}>
            <span className="hidden sm:inline">BERPIKIR</span>
            {[0, 1, 2].map((d) => (
              <span key={d} className="dot-bounce inline-block h-1.5 w-1.5 rounded-full bg-sky-500" style={{ animationDelay: `${d * 0.15}s` }} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}


