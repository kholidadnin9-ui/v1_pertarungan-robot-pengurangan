import { useMemo } from 'react';

export interface BeamGeom {
  x: number;      // origin px (muzzle) relative to arena
  y: number;
  len: number;    // length px to the target core
  angle: number;  // degrees
  color: string;
  glow: string;
}

/* ================= LASER BEAM — fired straight from the gun muzzle ================= */
export function Beam({ geom }: { geom: BeamGeom }) {
  const { x, y, len, angle, color, glow } = geom;
  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{ left: x, top: y, width: len, height: 0, transform: `rotate(${angle}deg)`, transformOrigin: '0 50%' }}
    >
      {/* animated beam body (grows from the muzzle outwards) */}
      <div
        className="absolute top-0 h-0 w-full"
        style={{ transformOrigin: 'left center', animation: 'beam-fire .7s cubic-bezier(.3,.9,.3,1) both' }}
      >
        {/* outer glow */}
        <div className="absolute left-0 h-7 w-full -translate-y-1/2 rounded-full blur-md md:h-10" style={{ background: glow }} />
        {/* core */}
        <div
          className="absolute left-0 h-2.5 w-full -translate-y-1/2 rounded-full md:h-4"
          style={{
            background: `linear-gradient(180deg, #ffffff 0%, ${color} 42%, ${color} 58%, #ffffff 100%)`,
            boxShadow: `0 0 20px 6px ${glow}`,
          }}
        />
        {/* hot white center */}
        <div className="absolute left-0 h-[3px] w-full -translate-y-1/2 rounded-full bg-white" />
      </div>

      {/* muzzle flash exactly at the barrel */}
      <div
        className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full md:h-24 md:w-24"
        style={{
          left: 0, top: 0,
          background: `radial-gradient(circle, #ffffff 0%, ${color} 38%, transparent 70%)`,
          animation: 'muzzle .5s ease-out both',
        }}
      />
      {/* impact flash at the target */}
      <div
        className="absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full md:h-28 md:w-28"
        style={{
          left: len, top: 0,
          background: `radial-gradient(circle, #ffffff 0%, ${color} 32%, transparent 68%)`,
          animation: 'muzzle .45s ease-out .2s both',
        }}
      />
    </div>
  );
}

/* ================= CHARGE AURA (gathering energy at the muzzle) ================= */
export function ChargeAura({ color, glow }: { color: string; glow: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        className="animate-aura absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full md:h-52 md:w-52"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 65%)` }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-dashed md:h-56 md:w-56"
        style={{ borderColor: color, animation: 'charge-ring .6s ease-in both' }}
      />
    </div>
  );
}

/* ================= EXPLOSION ================= */
export function Explosion({ big = false, keyId }: { big?: boolean; keyId: number }) {
  const debris = useMemo(
    () =>
      Array.from({ length: big ? 18 : 12 }, (_, i) => ({
        id: i,
        dx: `${(Math.random() - 0.5) * (big ? 380 : 260)}px`,
        dy: `${-60 - Math.random() * (big ? 280 : 180)}px`,
        rot: `${180 + Math.random() * 360}deg`,
        size: 8 + Math.random() * (big ? 24 : 15),
        color: ['#fb923c', '#fbbf24', '#f87171', '#64748b', '#fde68a'][i % 5],
        delay: `${Math.random() * 0.1}s`,
      })),
    [big, keyId]
  );
  const smoke = useMemo(
    () =>
      Array.from({ length: big ? 7 : 5 }, (_, i) => ({
        id: i,
        left: `${18 + i * 11 + Math.random() * 6}%`,
        size: 30 + Math.random() * 40,
        delay: `${0.15 + Math.random() * 0.4}s`,
      })),
    [big, keyId]
  );
  const dim = big ? 'h-52 w-52 md:h-72 md:w-72' : 'h-36 w-36 md:h-48 md:w-48';

  return (
    <div key={keyId} className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
      <div className={`animate-exp-flash absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${dim}`}
        style={{ background: 'radial-gradient(circle, #ffffff 0%, #fef9c3 30%, transparent 70%)' }} />
      <div className={`animate-exp-fire absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${dim}`}
        style={{ background: 'radial-gradient(circle, #fffbeb 0%, #fcd34d 35%, #fb923c 60%, #f87171 80%, transparent 100%)' }} />
      <div className="animate-exp-ring absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-8 border-white/90" />
      <div className="animate-exp-ring absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-orange-400/90" style={{ animationDelay: '0.08s' }} />
      {debris.map((d) => (
        <div
          key={`d${d.id}`}
          className="animate-exp-debris absolute left-1/2 top-1/2 rounded-sm"
          style={{
            width: d.size, height: d.size * 0.65,
            background: d.color,
            animationDelay: d.delay,
            ...({ '--dx': d.dx, '--dy': d.dy, '--rot': d.rot } as object),
          } as React.CSSProperties}
        />
      ))}
      {smoke.map((s) => (
        <div
          key={`s${s.id}`}
          className="animate-exp-smoke absolute rounded-full"
          style={{
            left: s.left, top: '40%',
            width: s.size, height: s.size,
            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 55%, #94a3b8 100%)',
            animationDelay: s.delay,
          }}
        />
      ))}
      <div className="animate-q-pop absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6">
        <span className={`font-game text-4xl text-white md:text-5xl ${big ? 'scale-125' : ''}`} style={{ WebkitTextStroke: '3px #ea580c', paintOrder: 'stroke fill' }}>
          {big ? 'KABOOM!' : 'DUAR!'}
        </span>
      </div>
    </div>
  );
}

/* ================= SMOKE ================= */
export function SmokeColumn({ count = 5 }: { count?: number }) {
  const puffs = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${20 + i * 14 + Math.random() * 8}%`,
        size: 24 + Math.random() * 30,
        sx: `${(Math.random() - 0.5) * 90}px`,
        delay: `${i * 0.3}s`,
      })),
    [count]
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/4 z-30">
      {puffs.map((p) => (
        <div
          key={p.id}
          className="animate-smoke-rise absolute bottom-6 rounded-full"
          style={{
            left: p.left,
            width: p.size, height: p.size,
            background: 'radial-gradient(circle at 35% 35%, #f8fafc 0%, #cbd5e1 55%, #94a3b8 100%)',
            animationDelay: p.delay,
            ...({ '--sx': p.sx } as object),
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function WreckFire() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-center gap-1">
      <span className="animate-flame text-3xl md:text-4xl">🔥</span>
      <span className="animate-flame text-4xl md:text-5xl" style={{ animationDelay: '.1s' }}>🔥</span>
      <span className="animate-flame text-3xl md:text-4xl" style={{ animationDelay: '.2s' }}>🔥</span>
    </div>
  );
}

/* ================= ELECTRIC SHOCK ================= */
export function ZapBolt({ size = 40, delay = 0 }: { size?: number; delay?: number }) {
  return (
    <svg width={size} height={size * 2.1} viewBox="0 0 40 84" fill="none" className="animate-zap" style={{ animationDelay: `${delay}s` }}>
      <path d="M24 2 L6 44 L17 44 L13 82 L34 36 L22 36 L30 2 Z" fill="#fde047" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export function ElectricShock() {
  const bolts = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        id: i,
        left: `${6 + i * 13}%`,
        top: `${Math.random() * 35}%`,
        size: 30 + Math.random() * 34,
        delay: Math.random() * 0.2,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      <div
        className="absolute inset-2 rounded-3xl"
        style={{ animation: 'zap-flicker .16s linear infinite alternate', boxShadow: '0 0 30px 10px rgba(250,204,21,.95), 0 0 80px 26px rgba(56,189,248,.7)' }}
      />
      {bolts.map((b) => (
        <div key={b.id} className="absolute" style={{ left: b.left, top: b.top }}>
          <ZapBolt size={b.size} delay={b.delay} />
        </div>
      ))}
      <div className="animate-q-pop absolute left-1/2 top-4 -translate-x-1/2">
        <span className="font-game whitespace-nowrap rounded-2xl border-4 border-white bg-yellow-400 px-4 py-1 text-lg text-yellow-950 shadow-xl md:text-2xl">⚡ KESETRUM!</span>
      </div>
    </div>
  );
}

/* ================= DAMAGE NUMBER ================= */
export function DamageNumber({ value, good = false, keyId }: { value: string; good?: boolean; keyId: number }) {
  return (
    <div key={keyId} className="animate-dmg-pop pointer-events-none absolute left-1/2 top-[6%] z-50 -translate-x-1/2">
      <span
        className={`font-game whitespace-nowrap text-3xl md:text-5xl ${good ? 'text-lime-300' : 'text-white'}`}
        style={{ WebkitTextStroke: `3px ${good ? '#15803d' : '#dc2626'}`, paintOrder: 'stroke fill' }}
      >
        {value}
      </span>
    </div>
  );
}
