/* Procedural puzzle library for levels 21 to 1000.
   150+ hand-written puzzle families across 10 difficulty tiers. Every level is deterministic (seeded) and
   `buildLevels` guarantees that no two prompts are identical. */
import { rng, type Built, type Gen } from './kit';
import { T1, T2, T3 } from './tier1';
import { T4, T5 } from './tier4';
import { T6, T7 } from './tier6';
import { T8, T9, T10 } from './tier8';

export type { Built } from './kit';
const TIERS: Gen[][] = [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10];
export const FAMILY_COUNT = TIERS.reduce((n, t) => n + t.length, 0);

const REACT_NAMES = ['useState', 'useEffect', 'useReducer', 'useRef', 'useMemo', 'useCallback', 'useContext', 'createContext', 'memo', 'forwardRef', 'Children', 'cloneElement', 'Fragment', 'useLayoutEffect'];

/** The import line a solution needs, worked out from the names it uses. Puzzle targets are written without it. */
export function importLine(source: string): string {
  const used = REACT_NAMES.filter((n) => new RegExp(`\\b${n}\\b`).test(source));
  return used.length ? `import { ${used.join(', ')} } from 'react';\n\n` : '';
}
export const withImports = (source: string) => importLine(source) + source;

/** What the editor starts with: the import line plus an empty component for whatever the level renders. */
export function starterFor(p: Pick<Built, 'target' | 'entry' | 'starter'>): string {
  const imp = importLine(p.target);
  if (p.starter !== undefined) return imp + p.starter;
  const name = p.entry ? /<([A-Z][A-Za-z0-9]*)/.exec(p.entry)?.[1] ?? 'App' : 'App';
  return `${imp}function ${name}(props) {\n  return null;\n}\n`;
}

const ADJ = ['Hollow', 'Silent', 'Pale', 'Velvet', 'Distant', 'Gilded', 'Drifting', 'Quiet', 'Fading', 'Wandering', 'Crystal', 'Lilac', 'Veiled', 'Restless', 'Silver', 'Midnight', 'Borrowed', 'Gentle', 'Forgotten', 'Luminous', 'Violet', 'Brittle', 'Tidal', 'Frozen', 'Glowing', 'Secret', 'Lonely', 'Opal', 'Glass', 'Heavy', 'Slow', 'Winter', 'Mirrored', 'Plum', 'Amber', 'Hushed', 'Orbiting', 'Waning', 'Dusky', 'Mossy', 'Soft', 'Faint', 'Spun'];
const NOUN = ['Lantern', 'Signal', 'Harbor', 'Orbit', 'Compass', 'Cipher', 'Tide', 'Garden', 'Bridge', 'Echo', 'Comet', 'Archive', 'Engine', 'Crown', 'Mirror', 'Shore', 'Thread', 'Key', 'Window', 'Beacon', 'Anchor', 'Meadow', 'Clock', 'Feather', 'Ladder', 'Whisper', 'Ember', 'Atlas'];
export const titleFor = (i: number) => { const a = i % ADJ.length; return `${ADJ[a]} ${NOUN[(Math.floor(i / ADJ.length) + a) % NOUN.length]}`; };

/** Builds levels `from` to `to` (inclusive). Guarantees unique prompts. */
export function buildLevels(from: number, to: number, seen: Set<string> = new Set()): Array<Built & { id: number; tier: number }> {
  const out: Array<Built & { id: number; tier: number }> = [];
  const span = to - from + 1, perTier = Math.ceil(span / 10);
  for (let id = from; id <= to; id++) {
    const idx = id - from, tier = Math.min(10, Math.floor(idx / perTier) + 1), j = idx - (tier - 1) * perTier, fams = TIERS[tier - 1];
    const cycle = Math.floor(j / fams.length), order = fams.map((_, k) => k).sort((x, y) => ((x * 2654435761 + cycle * 40503 + tier) % 997) - ((y * 2654435761 + cycle * 40503 + tier) % 997));
    let made: Built | null = null;
    // Try this tier's families first (each with many seeds), then spill into the neighbouring tiers.
    const own = order.map((k) => fams[k]);
    const pool = [...own.slice(j % own.length), ...own.slice(0, j % own.length), ...TIERS[Math.max(0, tier - 2)], ...TIERS[Math.min(9, tier)]];
    for (let f = 0; f < pool.length && !made; f++) {
      const fam = pool[f];
      for (let attempt = 0; attempt < 60 && !made; attempt++) {
        const cand = fam(rng(id * 7919 + attempt * 104729 + f * 31 + tier));
        if (!seen.has(cand.prompt)) made = cand;
      }
    }
    if (!made) throw new Error(`Could not build a unique level ${id}`);
    seen.add(made.prompt);
    out.push({ ...made, id, tier });
  }
  return out;
}
