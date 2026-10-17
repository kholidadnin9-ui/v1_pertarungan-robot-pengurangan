import arenaBg from '../assets/arena-futuristic.jpg';
import { useMemo, useState } from 'react';
import { ArrowLeft, User, Users, Swords, Check, Dices } from 'lucide-react';
import { ROBOTS, RobotColor, PlayerSetup } from '../types';
import { LEVELS } from '../utils/questions';
import ChromaRobot from './ChromaRobot';
import { sfx } from '../utils/sounds';

const COLORS: RobotColor[] = ['blue', 'yellow', 'pink', 'green'];

export interface SetupResult {
  mode: 1 | 2;
  level: number;
  players: [PlayerSetup, PlayerSetup];
}

export default function SetupScreen({
  onBack,
  onStart,
}: {
  onBack: () => void;
  onStart: (r: SetupResult) => void;
}) {
  const [mode, setMode] = useState<1 | 2>(1);
  const [level, setLevel] = useState(1);
  const [p1Name, setP1Name] = useState('Pemain 1');
  const [p2Name, setP2Name] = useState('Pemain 2');
  const [p1Robot, setP1Robot] = useState<RobotColor>('blue');
  const [p2Robot, setP2Robot] = useState<RobotColor>('pink');

  const cpuRobot = useMemo<RobotColor>(() => {
    const others = COLORS.filter((c) => c !== p1Robot);
    return others[Math.floor(Math.random() * others.length)];
  }, [p1Robot]);

  const canStart = p1Name.trim().length > 0 && (mode === 1 || p2Name.trim().length > 0);

  const handleStart = () => {
    if (!canStart) return;
    sfx.roundStart();
    onStart({
      mode,
      level,
      players: mode === 1
        ? [{ name: p1Name.trim() || 'Pemain 1', robot: p1Robot }, { name: 'Komputer', robot: cpuRobot }]
        : [{ name: p1Name.trim() || 'Pemain 1', robot: p1Robot }, { name: p2Name.trim() || 'Pemain 2', robot: p2Robot }],
    });
  };

  const randomize = () => {
    sfx.click();
    const a = COLORS[Math.floor(Math.random() * 4)];
    let b = COLORS[Math.floor(Math.random() * 4)];
    if (mode === 2) while (b === a) b = COLORS[Math.floor(Math.random() * 4)];
    setP1Robot(a);
    setP2Robot(b);
  };

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 px-3 py-4 sm:px-4 sm:py-6">
      {/* bg */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${arenaBg})` }} />
        <div className="city-scrim-strong absolute inset-0" />
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="vignette absolute inset-0" />
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="animate-twinkle absolute text-white" style={{ left: `${(i * 41 + 5) % 100}%`, top: `${(i * 29 + 4) % 90}%`, fontSize: 8 + (i % 3) * 5 }}>✦</span>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { sfx.click(); onBack(); }} className="btn-press panel rounded-full p-2.5">
            <ArrowLeft className="h-6 w-6 text-sky-700" />
          </button>
          <h1 className="font-game title-out-amber text-lg text-amber-300 sm:text-2xl md:text-4xl">PILIH ALAT TEMPURMU!</h1>
        </div>

        {/* STEP 1: mode */}
        <section className="animate-card-in panel mt-5 rounded-3xl p-4 md:p-5">
          <h2 className="font-game text-lg text-sky-700 md:text-2xl">1. PILIH MODE MAIN</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => { sfx.click(); setMode(1); }}
              className={`btn-press relative rounded-2xl border-2 p-4 text-left transition-all ${mode === 1 ? 'border-sky-500 bg-sky-100 shadow-lg scale-[1.02]' : 'border-slate-200 bg-white hover:border-sky-300'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-2xl p-3 ${mode === 1 ? 'bg-sky-500' : 'bg-slate-100'}`}><User className={`h-8 w-8 ${mode === 1 ? 'text-white' : 'text-slate-400'}`} /></span>
                <div>
                  <div className={`font-game text-xl ${mode === 1 ? 'text-sky-700' : 'text-slate-600'}`}>1 PEMAIN</div>
                  <div className="text-sm font-bold text-slate-500">Kamu vs Robot Komputer 🤖</div>
                </div>
              </div>
              {mode === 1 && <span className="absolute right-3 top-3 rounded-full bg-sky-500 p-1"><Check className="h-4 w-4 text-white" /></span>}
            </button>
            <button
              onClick={() => { sfx.click(); setMode(2); }}
              className={`btn-press relative rounded-2xl border-2 p-4 text-left transition-all ${mode === 2 ? 'border-pink-500 bg-pink-100 shadow-lg scale-[1.02]' : 'border-slate-200 bg-white hover:border-pink-300'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-2xl p-3 ${mode === 2 ? 'bg-pink-500' : 'bg-slate-100'}`}><Users className={`h-8 w-8 ${mode === 2 ? 'text-white' : 'text-slate-400'}`} /></span>
                <div>
                  <div className={`font-game text-xl ${mode === 2 ? 'text-pink-700' : 'text-slate-600'}`}>2 PEMAIN</div>
                  <div className="text-sm font-bold text-slate-500">Duel dengan teman! ⚔️</div>
                </div>
              </div>
              {mode === 2 && <span className="absolute right-3 top-3 rounded-full bg-pink-500 p-1"><Check className="h-4 w-4 text-white" /></span>}
            </button>
          </div>
        </section>

        {/* STEP 2: level */}
        <section className="animate-card-in panel mt-4 rounded-3xl p-4 md:p-5" style={{ animationDelay: '0.1s' }}>
          <h2 className="font-game text-lg text-sky-700 md:text-2xl">2. PILIH LEVEL <span className="text-xs font-bold text-slate-400">(10 SOAL / LEVEL)</span></h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {LEVELS.map((lv) => (
              <button
                key={lv.level}
                onClick={() => { sfx.click(); setLevel(lv.level); }}
                className={`btn-press relative rounded-2xl border-2 p-3 text-center transition-all ${level === lv.level ? 'border-amber-400 bg-amber-100 shadow-lg scale-105' : 'border-slate-200 bg-white hover:border-amber-300'}`}
              >
                <div className="text-3xl">{lv.icon}</div>
                <div className={`font-game text-base ${level === lv.level ? 'text-amber-700' : 'text-slate-700'}`}>{lv.name}</div>
                <div className="text-[11px] font-bold text-slate-500">{lv.subtitle}</div>
                <div className="mt-1 text-xs">{'⭐'.repeat(lv.stars)}</div>
                {level === lv.level && <span className="absolute -right-2 -top-2 rounded-full bg-amber-500 p-1 shadow"><Check className="h-3.5 w-3.5 text-white" /></span>}
              </button>
            ))}
          </div>
        </section>

        {/* STEP 3: robots */}
        <section className="animate-card-in panel mt-4 rounded-3xl p-4 md:p-5" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-game text-lg text-sky-700 md:text-2xl">3. PILIH ROBOT & NAMA</h2>
            <button onClick={randomize} className="btn-press font-game flex items-center gap-1.5 rounded-full border-2 border-violet-400 bg-violet-100 px-4 py-2 text-xs text-violet-700 md:text-sm">
              <Dices className="h-4 w-4" /> ACAK
            </button>
          </div>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {/* P1 */}
            <div className="rounded-2xl border-4 border-sky-400 bg-sky-50 p-3">
              <div className="font-game mb-2 flex items-center gap-2 text-base text-sky-700 md:text-lg">
                <span className="rounded-lg bg-sky-500 px-2 py-0.5 text-xs text-white">P1</span> PEMAIN 1
              </div>
              <input
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value.slice(0, 14))}
                placeholder="Nama Pemain 1"
                className="w-full rounded-xl border-2 border-sky-200 bg-white px-3 py-2 font-bold text-slate-800 outline-none placeholder:text-slate-300 focus:border-sky-500"
                maxLength={14}
              />
              <div className="mt-2 grid grid-cols-4 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { sfx.click(); setP1Robot(c); if (mode === 2 && p2Robot === c) setP2Robot(COLORS.find((x) => x !== c)!); }}
                    className={`btn-press rounded-xl border-2 p-1 transition-all ${p1Robot === c ? `scale-105 ${ROBOTS[c].frame} shadow-lg` : 'border-slate-200 bg-white hover:scale-105'}`}
                  >
                    <ChromaRobot src={ROBOTS[c].image} alt={ROBOTS[c].name} className="h-14 w-full object-contain md:h-20" />
                    <div className={`font-game text-[9px] md:text-[11px] ${p1Robot === c ? 'text-slate-800' : 'text-slate-400'}`}>{ROBOTS[c].name}</div>
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-3 rounded-xl border-2 border-white bg-white p-2">
                <div className="animate-float-y">
                  <ChromaRobot src={ROBOTS[p1Robot].image} alt="preview" className="h-16 w-auto object-contain md:h-20" style={{ filter: `drop-shadow(0 6px 10px ${ROBOTS[p1Robot].glow})` }} />
                </div>
                <div>
                  <div className="font-game text-sm text-slate-800 md:text-base">{p1Name || 'Pemain 1'}</div>
                  <div className="text-xs font-bold text-slate-500">memakai <b className="text-sky-600">{ROBOTS[p1Robot].name}</b> 🎉</div>
                </div>
              </div>
            </div>

            {/* P2 / CPU */}
            {mode === 2 ? (
              <div className="rounded-2xl border-4 border-pink-400 bg-pink-50 p-3">
                <div className="font-game mb-2 flex items-center gap-2 text-base text-pink-700 md:text-lg">
                  <span className="rounded-lg bg-pink-500 px-2 py-0.5 text-xs text-white">P2</span> PEMAIN 2
                </div>
                <input
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value.slice(0, 14))}
                  placeholder="Nama Pemain 2"
                  className="w-full rounded-xl border-2 border-pink-200 bg-white px-3 py-2 font-bold text-slate-800 outline-none placeholder:text-slate-300 focus:border-pink-500"
                  maxLength={14}
                />
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { if (c === p1Robot) return; sfx.click(); setP2Robot(c); }}
                      disabled={c === p1Robot}
                      className={`btn-press rounded-xl border-2 p-1 transition-all ${p2Robot === c ? `scale-105 ${ROBOTS[c].frame} shadow-lg` : c === p1Robot ? 'border-slate-200 bg-slate-100 opacity-40' : 'border-slate-200 bg-white hover:scale-105'}`}
                    >
                      <ChromaRobot src={ROBOTS[c].image} alt={ROBOTS[c].name} className="h-14 w-full object-contain md:h-20" />
                      <div className={`font-game text-[9px] md:text-[11px] ${p2Robot === c ? 'text-slate-800' : 'text-slate-400'}`}>{ROBOTS[c].name}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-3 rounded-xl border-2 border-white bg-white p-2">
                  <div className="animate-float-y">
                    <ChromaRobot src={ROBOTS[p2Robot].image} alt="preview" className="h-16 w-auto object-contain md:h-20" style={{ transform: 'scaleX(-1)', filter: `drop-shadow(0 6px 10px ${ROBOTS[p2Robot].glow})` }} />
                  </div>
                  <div>
                    <div className="font-game text-sm text-slate-800 md:text-base">{p2Name || 'Pemain 2'}</div>
                    <div className="text-xs font-bold text-slate-500">memakai <b className="text-pink-600">{ROBOTS[p2Robot].name}</b> 🎉</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-4 border-slate-300 bg-slate-50 p-3">
                <div className="font-game mb-2 flex items-center gap-2 text-base text-slate-700 md:text-lg">
                  <span className="rounded-lg bg-slate-600 px-2 py-0.5 text-xs text-white">CPU</span> ROBOT KOMPUTER 🤖
                </div>
                <div className="rounded-xl border-2 border-white bg-white p-2 text-xs font-bold text-slate-500 md:text-sm">
                  Komputer memilih robot acak yang berbeda dengan robotmu. Hati-hati, dia makin pintar di level tinggi! 🧠
                </div>
                <div className="mt-2 flex items-center gap-3 rounded-xl border-2 border-white bg-white p-2">
                  <div className="animate-float-y">
                    <ChromaRobot src={ROBOTS[cpuRobot].image} alt="cpu" className="h-16 w-auto object-contain md:h-20" style={{ transform: 'scaleX(-1)', filter: `drop-shadow(0 6px 10px ${ROBOTS[cpuRobot].glow})` }} />
                  </div>
                  <div>
                    <div className="font-game text-sm text-slate-800 md:text-base">KOMPUTER</div>
                    <div className="text-xs font-bold text-slate-500">memakai <b className="text-amber-600">{ROBOTS[cpuRobot].name}</b> 😈</div>
                    <div className="text-[11px] font-bold text-orange-500">{level <= 2 ? 'Level ' + level + ': masih lambat, ayo kalahkan!' : level <= 4 ? 'Level ' + level + ': cukup cepat, hati-hati!' : 'Level 5: super cepat & pintar! 🔥'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* start */}
        <div className="animate-card-in mt-5 pb-8 text-center" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`font-game btn-press relative inline-flex items-center gap-2 rounded-full border-2 px-10 py-4 text-xl md:text-3xl ${canStart ? 'border-white bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-white shadow-[0_8px_0_#c2410c]' : 'border-white bg-slate-300 text-white/70'}`}
          >
            <Swords className="h-7 w-7 md:h-8 md:w-8" /> MULAI BERTEMPUR! 💥
          </button>
          <p className="font-game mt-2 text-[11px] tracking-wider text-sky-800/60 md:text-xs">LEVEL {level} • 10 SOAL • SIAPA CEPAT DIA MENEMBAK! 🔫</p>
        </div>
      </div>
    </div>
  );
}
