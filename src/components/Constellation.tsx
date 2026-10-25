import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Question } from '../questions';

const W = 340, H = 300, COLS = 5, ROWS = 4;

/** Deterministic position of the i-th moon: a bottom-up snake with a little seeded drift so each episode has its own shape. */
function place(episode: number, i: number) {
  const row = Math.floor(i / COLS);
  const col = row % 2 === 0 ? i % COLS : COLS - 1 - (i % COLS);
  const j = (k: number) => { const v = Math.sin((episode * 131 + i * 17 + k * 53) * 12.9898) * 43758.5453; return v - Math.floor(v) - 0.5; };
  return { x: ((col + 0.5) / COLS) * W + j(1) * 14, y: H - ((row + 0.5) / ROWS) * H + j(2) * 26 };
}

type Props = { episode: number; items: Question[]; done: Set<number>; nextId: number | null; onOpen: (id: number) => void };

export function Constellation({ episode, items, done, nextId, onOpen }: Props) {
  const pts = items.map((_, i) => place(episode, i));
  return (
    <div className="constellation" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        {pts.slice(1).map((p, i) => {
          const a = pts[i];
          const lit = done.has(items[i].id) && done.has(items[i + 1].id);
          const half = done.has(items[i].id);
          return <line key={i} x1={a.x} y1={a.y} x2={p.x} y2={p.y} className={lit ? 'seg lit' : half ? 'seg half' : 'seg'} />;
        })}
      </svg>
      {items.map((q, i) => {
        const isDone = done.has(q.id), isNext = q.id === nextId;
        const style = { left: `${(pts[i].x / W) * 100}%`, top: `${(pts[i].y / H) * 100}%` } as CSSProperties;
        return (
          <button key={q.id} style={style} className={`star${isDone ? ' done' : ''}${isNext ? ' next' : ''}`} onClick={() => onOpen(q.id)}
            aria-label={`Level ${q.id}: ${q.title}${isDone ? ', completed' : isNext ? ', next up' : ''}`}>
            <span className={`star-body${q.id > 999 ? ' long' : ''}`}>{isDone ? <Check size={13} strokeWidth={3} /> : String(q.id).padStart(3, '0')}</span>
          </button>
        );
      })}
    </div>
  );
}
