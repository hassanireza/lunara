import { useId } from 'react';

/** The Lunara mark: a crescent moon held by three orbits, the same scene as the Lumenari home icon.
 *  Used for the hero and empty states. Motion is skipped for people who ask for reduced motion. */
export function MoonArt({ size = 120, orbits = true, className = '' }: { size?: number; orbits?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '');
  const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // one orbit path per ellipse, so the electron really travels along it
  const path = (rx: number, ry: number) => `M${-rx} 0a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
  const rings = [{ rx: 300, ry: 112, a: 0, dur: 14, dot: 15 }, { rx: 300, ry: 112, a: 60, dur: 19, dot: 12 }, { rx: 300, ry: 112, a: 120, dur: 24, dot: 13 }];
  return (
    <svg className={className} width={size} height={size} viewBox="-400 -400 800 800" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`h${id}`}><stop offset="0" stopColor="#d5a5ff" stopOpacity=".5" /><stop offset=".55" stopColor="#8b52d6" stopOpacity=".16" /><stop offset="1" stopColor="#8b52d6" stopOpacity="0" /></radialGradient>
        <linearGradient id={`m${id}`} x1=".15" y1=".1" x2=".85" y2=".95"><stop offset="0" stopColor="#ffffff" /><stop offset=".5" stopColor="#ead2ff" /><stop offset="1" stopColor="#b48be6" /></linearGradient>
        <mask id={`k${id}`}><rect x="-200" y="-200" width="400" height="400" fill="#fff" /><circle cx="62" cy="-34" r="116" fill="#000" /></mask>
      </defs>
      <circle r="360" fill={`url(#h${id})`} />
      {orbits && rings.map((o, i) => (
        <g key={i} transform={`rotate(${o.a})`}>
          <path className={`moon-orbit o${i}`} d={path(o.rx, o.ry)} fill="none" stroke="#e5ccff" strokeOpacity={0.42 - i * 0.07} strokeWidth="4.5" />
          <circle r={o.dot} fill="#f5e9ff">
            {!still && <animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={path(o.rx, o.ry)} />}
            {still && <animateMotion dur="1s" repeatCount="1" path={path(o.rx, o.ry)} keyPoints="0.2;0.2" keyTimes="0;1" calcMode="linear" fill="freeze" />}
          </circle>
        </g>
      ))}
      <g mask={`url(#k${id})`}><circle r="136" fill={`url(#m${id})`} /></g>
      <circle className="twinkle" cx="168" cy="-172" r="9" fill="#fff" opacity=".85" />
      <circle className="twinkle t2" cx="-226" cy="150" r="7" fill="#fff" opacity=".7" />
    </svg>
  );
}
