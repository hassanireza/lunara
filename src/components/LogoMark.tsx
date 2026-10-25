import { useId } from 'react';

/** Small, crisp brand tile for the header (a tiny version of the app icon). Pure vector strokes: no blur filters,
 *  so it stays sharp on 3x iPhone screens and in standalone mode. */
export function LogoMark({ size = 30 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" shapeRendering="geometricPrecision" style={{ display: 'block', flex: 'none' }}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b1c68" /><stop offset="1" stopColor="#07030f" /></linearGradient>
        <linearGradient id={`m${id}`} x1=".1" y1=".1" x2=".9" y2=".95"><stop offset="0" stopColor="#fff" /><stop offset=".55" stopColor="#ead2ff" /><stop offset="1" stopColor="#b48be6" /></linearGradient>
        <mask id={`k${id}`}><rect width="32" height="32" fill="#fff" /><circle cx="19.6" cy="13.2" r="6.9" fill="#000" /></mask>
      </defs>
      <rect x=".5" y=".5" width="31" height="31" rx="8" fill={`url(#g${id})`} stroke="#d5a5ff" strokeOpacity=".32" />
      <ellipse cx="16" cy="16" rx="12" ry="4.6" transform="rotate(-28 16 16)" fill="none" stroke="#e5ccff" strokeOpacity=".6" strokeWidth="1.1" />
      <g mask={`url(#k${id})`}><circle cx="15.2" cy="16.4" r="7.4" fill={`url(#m${id})`} /></g>
      <circle cx="25.6" cy="9.4" r="1.4" fill="#f5e9ff" />
      <circle cx="6.6" cy="22.4" r="1.1" fill="#f5e9ff" />
    </svg>
  );
}
