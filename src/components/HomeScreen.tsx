import { useEffect, useState } from 'react';
import { Play, BookOpen, User, Users, Volume2, VolumeX } from 'lucide-react';
import arenaBg from '../assets/arena-futuristic.jpg';
import { ROBOTS, RobotColor } from '../types';
import ChromaRobot from './ChromaRobot';
import HomeLightning from './HomeLightning';
import { sfx, isMuted, setMuted } from '../utils/sounds';

const COLORS: RobotColor[] = ['blue', 'yellow', 'pink', 'green'];

export default function HomeScreen({ onStart }: { onStart: () => void }) {
  const [showHelp, setShowHelp] = useState(false);
  const [muted, setM] = useState(isMuted());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = 0;
    const total = COLORS.length;
    const check = () => { if (++done >= total) setLoading(false); };
    COLORS.forEach((c) => {
      const img = new Image();
      img.src = ROBOTS[c].image;
      img.onload = check;
      img.onerror = check;
    });
    const fallback = window.setTimeout(() => setLoading(false), 3500);
    return () => clearTimeout(fallback);
  }, []);

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <div className="bg-grid fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200">
        <div className="relative mb-8 h-24 w-24">
          <div className="animate-rb-spin absolute inset-0 rounded-full border-4 border-dashed border-sky-500" />
          <div className="animate-rb-spin absolute inset-3 rounded-full border-4 border-dashed border-amber-400" style={{ animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🤖</div>
        </div>
        <h1 className="font-game text-2xl text-amber-400 md:text-4xl" style={{ WebkitTextStroke: '3px #ffffff', paintOrder: 'stroke fill' }}>
          MEMUAT ROBOT...
        </h1>
        <p className="mt-2 text-sm font-extrabold text-sky-800">Siapkan pertempuran! ⚔️</p>
        <div className="mt-6 flex gap-3">
          {['🦾', '🤖', '⚙️', '🔩'].map((e, i) => (
            <span key={i} className="animate-loader-bounce text-3xl md:text-4xl" style={{ animationDelay: `${i * 0.12}s` }}>{e}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="home-poster relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-slate-900 text-white">
      {/* Full-bleed battle art with electric strikes instead of falling debris. */}
      <div className="pointer-events-none absolute inset-0 bg-cover bg-[center_55%] bg-no-repeat" style={{ backgroundImage: `url(${arenaBg})` }} />
      <div className="home-poster-veil pointer-events-none absolute inset-0" />
      <div className="home-poster-grid pointer-events-none absolute inset-0" />
      <HomeLightning />

      {/* mute */}
      <button
        onClick={() => { const m = !muted; setM(m); setMuted(m); if (!m) sfx.click(); }}
        className="btn-press home-sound-button absolute right-3 top-3 z-30 rounded-full p-2.5 sm:right-5 sm:top-5"
        aria-label="Suara"
      >
        {muted ? <VolumeX className="h-5 w-5 text-slate-600" /> : <Volume2 className="h-5 w-5 text-blue-700" />}
      </button>

      <main className="home-poster-content relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1600px] flex-col px-3 pb-5 pt-4 sm:px-6 sm:pt-5">
        <header className="animate-card-in relative z-10 mx-auto w-full max-w-4xl text-center">
          <div className="font-game mx-auto inline-flex items-center gap-2 rounded-full border border-white/55 bg-slate-950/45 px-3 py-1 text-[9px] tracking-[.18em] text-cyan-100 shadow-lg backdrop-blur-sm sm:px-4 sm:text-xs">
            <span className="text-amber-300">✦</span> ARENA EDUKASI KELAS 1–3 <span className="text-amber-300">✦</span>
          </div>
          <h1 className="font-game home-main-title mt-2 text-[clamp(2rem,6.8vw,5.5rem)] leading-[.93] text-amber-300">
            PERTARUNGAN ROBOT
          </h1>
          <div className="font-game home-title-sub mt-1 flex flex-wrap items-center justify-center gap-x-2 text-[clamp(1rem,3.6vw,2.4rem)] leading-none">
            <span className="text-white">MATEMATIKA</span>
            <span className="home-vs-mark">VS</span>
            <span className="text-rose-200">ROBOT MONSTER</span>
          </div>
          <div className="font-game mt-2 text-[clamp(.8rem,2vw,1.25rem)] tracking-[.16em] text-cyan-100">PENGURANGAN 1–100</div>
          <p className="home-credit mx-auto mt-2 inline-block rounded-full border border-amber-300/70 px-3 py-1 text-[10px] font-extrabold sm:text-xs">
            created by: <span className="text-yellow-200">widodo guru sd</span>
          </p>
        </header>

        {/* Empat robot pilihan di plaza kota futuristik. */}
        <section className="home-battle-stage relative mx-auto w-full flex-1" aria-label="Empat robot di kota futuristik">
          <div className="home-squad absolute bottom-0 left-0 grid h-full w-[78%] grid-cols-4 items-end">
            {COLORS.map((c, i) => (
              <div key={c} className={`home-mech home-mech-${i + 1} relative flex h-full items-end justify-center`} style={{ animationDelay: `${i * 0.28}s` }}>
                <ChromaRobot
                  src={ROBOTS[c].image}
                  alt={ROBOTS[c].name}
                  className="home-mech-sprite h-full w-full select-none object-contain object-bottom"
                  draggable={false}
                />
                <span className={`home-mech-name home-mech-name-${c} absolute bottom-1 z-10`}>{ROBOTS[c].name}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="animate-card-in relative z-10 mt-1 flex flex-col items-center gap-2 sm:gap-3" style={{ animationDelay: '0.35s' }}>
          <p className="font-game rounded-full border border-white/40 bg-slate-950/45 px-3 py-1 text-center text-[9px] text-white shadow backdrop-blur-sm sm:text-xs">
            5 LEVEL <span className="mx-1 text-amber-300">•</span> 10 SOAL WAJIB <span className="mx-1 text-amber-300">•</span> 1–2 PEMAIN
          </p>
          <button
            onClick={() => { sfx.click(); onStart(); }}
            className="font-game btn-press relative overflow-hidden rounded-full border-4 border-white bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 px-7 py-2.5 text-lg text-white shadow-[0_7px_0_#9a3412,0_12px_28px_rgba(0,0,0,.3)] sm:px-10 sm:py-3 sm:text-2xl"
          >
            <span className="absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute inset-y-0 -left-20 w-12 -skew-x-12 bg-white/50" style={{ animation: 'shine-sweep 2.4s ease-in-out infinite' }} />
            </span>
            <span className="relative flex items-center gap-2"><Play className="h-5 w-5 fill-white sm:h-6 sm:w-6" /> MULAI BERMAIN!</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="font-game flex items-center gap-1 text-[9px] text-white/90 sm:text-xs"><User className="h-3.5 w-3.5 text-cyan-200" /> 1 PEMAIN</span>
            <span className="h-1 w-1 rounded-full bg-amber-300" />
            <span className="font-game flex items-center gap-1 text-[9px] text-white/90 sm:text-xs"><Users className="h-3.5 w-3.5 text-pink-200" /> 2 PEMAIN</span>
            <span className="h-1 w-1 rounded-full bg-amber-300" />
            <button onClick={() => { sfx.click(); setShowHelp(true); }} className="font-game btn-press flex items-center gap-1 text-[9px] text-white underline decoration-amber-300 underline-offset-2 sm:text-xs">
              <BookOpen className="h-3.5 w-3.5 text-amber-200" /> CARA MAIN
            </button>
          </div>
          <p className="font-game text-[8px] tracking-[.12em] text-white/75 sm:text-[10px]">⚡ SIAPA CEPAT MENJAWAB, DIA MENEMBAK ⚡</p>
        </footer>
      </main>

      <style>{`@keyframes shine-sweep { 0% { transform: translateX(0); } 60%, 100% { transform: translateX(560px); } }`}</style>

      {/* help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-900/50 p-4 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <div className="animate-card-in no-scrollbar max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-4 border-amber-400 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-game glow-amber text-center text-3xl text-amber-500">📖 CARA MAIN</h2>
            <div className="mt-4 space-y-3 text-sm font-bold text-slate-700 md:text-base">
              <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-3">1️⃣ Pilih <b>1 atau 2 pemain</b>, pilih <b>level 1–5</b>, lalu pilih robot favoritmu! 🤖</div>
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-3">2️⃣ Setiap level ada <b>10 soal pengurangan</b> dengan 3 pilihan jawaban. 🧮</div>
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3">3️⃣ <b>Siapa paling cepat menjawab benar</b>, robotnya MENEMBAK LASER dari moncong senjata! 🔫 Robot lawan kena ledakan + asap!</div>
              <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-3">4️⃣ Kalau jawaban <b>salah</b>, robotmu <b>TERSENGAT LISTRIK</b>! ⚡</div>
              <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-3">5️⃣ Robot yang HP-nya habis akan <b>HANGUS, BERASAP, MELEDAK & HILANG</b>! 💨🏆</div>
              <div className="rounded-2xl border-2 border-pink-200 bg-pink-50 p-3">👥 <b>Mode 2 pemain:</b> Pemain 1 pakai panel <b className="text-sky-600">P1 (kiri)</b>, Pemain 2 panel <b className="text-pink-600">P2 (kanan)</b>. Urutan angkanya beda, jangan mencontek ya! 😄</div>
            </div>
            <button
              onClick={() => { sfx.click(); setShowHelp(false); }}
              className="font-game btn-press mt-4 w-full rounded-2xl border-4 border-white bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-xl text-white shadow-[0_6px_0_#c2410c]"
            >
              MENGERTI! 👍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
