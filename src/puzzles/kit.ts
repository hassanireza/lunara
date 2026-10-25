/* Shared toolkit for the puzzle library: a seeded random source, word pools and small code helpers. */

export type Built = {
  topic: string; prompt: string; target: string; hint: string;
  /** What gets rendered. Defaults to <App />. */
  entry?: string;
  /** User actions replayed after the first render (one per line, see engine/steps.ts). */
  steps?: string[];
  starter?: string;
};
export type R = {
  int: (a: number, b: number) => number;
  pick: <T>(a: readonly T[]) => T;
  two: <T>(a: readonly T[]) => [T, T];
  some: <T>(a: readonly T[], n: number) => T[];
  nums: (n: number, a: number, b: number) => number[];
  uniq: (n: number, a: number, b: number) => number[];
};
export type Gen = (r: R) => Built;

export function rng(seed: number): R {
  let s = seed >>> 0;
  const next = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const int = (a: number, b: number) => a + Math.floor(next() * (b - a + 1));
  const pick = <T,>(a: readonly T[]) => a[int(0, a.length - 1)];
  const two = <T,>(a: readonly T[]): [T, T] => { const x = pick(a); let y = pick(a); while (y === x) y = pick(a); return [x, y]; };
  const some = <T,>(a: readonly T[], n: number) => { const pool = [...a]; const out: T[] = []; while (out.length < n && pool.length) out.push(pool.splice(int(0, pool.length - 1), 1)[0]); return out; };
  const nums = (n: number, a: number, b: number) => Array.from({ length: n }, () => int(a, b));
  const uniq = (n: number, a: number, b: number) => { const o: number[] = []; while (o.length < n) { const v = int(a, b); if (!o.includes(v)) o.push(v); } return o; };
  return { int, pick, two, some, nums, uniq };
}

export const W = ['raven', 'velvet', 'cipher', 'nebula', 'shadow', 'signal', 'winter', 'silver', 'lumen', 'midnight', 'ember', 'harbor', 'lantern', 'mirror', 'orchid', 'pebble', 'quartz', 'ripple', 'tundra', 'violet', 'willow', 'zephyr', 'comet', 'marble', 'saffron', 'thistle', 'umbra', 'vortex', 'amber', 'basalt'] as const;
export const NAMES = ['Ada', 'Bo', 'Cleo', 'Dax', 'Eli', 'Faye', 'Gus', 'Hana', 'Ivo', 'Juno', 'Kai', 'Lena'] as const;
export const COLORS = ['crimson', 'teal', 'gold', 'indigo', 'coral', 'olive', 'plum', 'slate', 'tan', 'navy'] as const;
export const LABELS = ['Save', 'Send', 'Open', 'Close', 'Join', 'Buy', 'Skip', 'Next', 'Retry', 'Share', 'Launch', 'Pause'] as const;
export const THINGS = ['apple', 'lamp', 'book', 'key', 'cup', 'map', 'kite', 'drum', 'shell', 'coin', 'seed', 'rope'] as const;

export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** A JS array literal of strings, e.g. ["a", "b"]. */
export const SL = (a: readonly string[]) => `[${a.map((x) => `"${x}"`).join(', ')}]`;
export const NL = (a: readonly number[]) => `[${a.join(', ')}]`;
/** Joins code lines. Keeps the library readable and sidesteps template-literal traps around "$" and "{". */
export const code = (...lines: string[]) => lines.join('\n');
export const b = (topic: string, prompt: string, target: string, hint: string, extra: Partial<Built> = {}): Built => ({ topic, prompt, target, hint, ...extra });
export const times = <T,>(n: number, f: (i: number) => T) => Array.from({ length: n }, (_, i) => f(i));
export const clicks = (target: string, n: number) => times(n, () => `click ${target}`);
