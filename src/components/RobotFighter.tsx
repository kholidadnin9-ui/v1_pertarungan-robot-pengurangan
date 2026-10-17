import { ROBOTS, RobotColor } from '../types';
import ChromaRobot from './ChromaRobot';
import { ChargeAura, DamageNumber, ElectricShock, Explosion, SmokeColumn, WreckFire } from './Effects';

export type RobotStatus = 'intro' | 'idle' | 'charging' | 'attacking' | 'hit' | 'shocked' | 'defeated' | 'victory' | 'gone';

interface Props {
  color: RobotColor;
  side: 'left' | 'right';
  status: RobotStatus;
  showExplosion: boolean;
  explosionBig: boolean;
  explosionKey: number;
  showShock: boolean;
  damageText: string | null;
  damageGood: boolean;
  damageKey: number;
  hp: number;
}

export default function RobotFighter({
  color, side, status,
  showExplosion, explosionBig, explosionKey, showShock,
  damageText, damageGood, damageKey, hp,
}: Props) {
  const robot = ROBOTS[color];
  const isRight = side === 'right';
  // +1 => forward is screen-right (left robot); -1 => forward is screen-left (right robot)
  const dir = isRight ? -1 : 1;
  const lowHp = hp > 0 && hp <= 30;
  const showRobot = status !== 'gone';

  const animClass =
    status === 'intro' ? 'animate-ra-intro'
      : status === 'attacking' ? 'animate-ra-attack'
      : status === 'hit' ? 'animate-ra-hit'
      : status === 'shocked' ? 'animate-ra-stun'
      : status === 'defeated' ? 'animate-ra-destroyed'
      : status === 'victory' ? 'animate-ra-victory'
      : status === 'idle' || status === 'charging' ? 'animate-robot-bob'
      : '';

  return (
    <div className="relative h-full w-full" style={{ ...({ '--dir': dir } as object) } as React.CSSProperties}>
      {/* ground shadow */}
      <div className={`absolute bottom-0 left-1/2 h-4 -translate-x-1/2 rounded-[50%] bg-slate-900/25 blur-[5px] ${showRobot ? 'w-4/5' : 'w-3/5'}`} />

      {/* the robot */}
      {showRobot && (
        <div className={`absolute bottom-0 h-full ${isRight ? 'right-0' : 'left-0'} ${animClass}`}>
          <div className={`relative h-full ${isRight ? 'scale-x-[-1]' : ''}`}>
            <ChromaRobot
              src={robot.image}
              alt={robot.name}
              className="h-full w-auto select-none object-contain"
              draggable={false}
            />
            {/* markers used to anchor the laser exactly at the gun muzzle */}
            <span
              data-muzzle
              className="pointer-events-none absolute block h-0.5 w-0.5"
              style={{ left: `${robot.muzzle.x}%`, top: `${robot.muzzle.y}%` }}
            />
            <span
              data-core
              className="pointer-events-none absolute block h-0.5 w-0.5"
              style={{ left: `${robot.core.x}%`, top: `${robot.core.y}%` }}
            />
            {/* energy gathering right at the barrel before firing */}
            {status === 'charging' && (
              <div className="pointer-events-none absolute" style={{ left: `${robot.muzzle.x}%`, top: `${robot.muzzle.y}%` }}>
                <ChargeAura color={robot.laserColor} glow={robot.laserGlow} />
              </div>
            )}
            {/* impact explosion — anchored on the chest where the laser hits */}
            {showExplosion && (
              <div className="pointer-events-none absolute" style={{ left: `${robot.core.x}%`, top: `${robot.core.y}%` }}>
                {/* counter-mirror so the "KABOOM!" text is never reversed */}
                <div className={isRight ? 'scale-x-[-1]' : ''}>
                  <Explosion big={explosionBig} keyId={explosionKey} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* wreck remnants after the robot is destroyed */}
      {!showRobot && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 flex items-end justify-center">
            <div className="animate-ra-gone-out h-[65%]">
              <div className={`h-full ${isRight ? 'scale-x-[-1]' : ''}`}>
                <ChromaRobot src={robot.image} alt="puing robot" className="h-full w-auto object-contain" draggable={false} />
              </div>
            </div>
          </div>
          <WreckFire />
          <SmokeColumn count={4} />
        </div>
      )}

      {/* low HP warning */}
      {lowHp && status !== 'defeated' && status !== 'gone' && (
        <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2">
          <span className="font-game animate-pulse-scale whitespace-nowrap rounded-lg border-2 border-white bg-red-500 px-2 py-0.5 text-[11px] text-white shadow-lg md:text-sm">
            ⚠ HP KRITIS
          </span>
        </div>
      )}

      {/* explosion shown on the wreck once the robot sprite is gone */}
      {showExplosion && !showRobot && (
        <div className="pointer-events-none absolute left-1/2 top-1/2">
          <Explosion big={explosionBig} keyId={explosionKey} />
        </div>
      )}
      {showShock && <ElectricShock />}
      {damageText && <DamageNumber value={damageText} good={damageGood} keyId={damageKey} />}
    </div>
  );
}
