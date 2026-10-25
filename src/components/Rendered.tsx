import { Code2, Eye } from 'lucide-react';

export type OutView = 'markup' | 'preview';

/** The two ways to look at a result: the exact markup (what answers are compared on) or a picture of it. */
export function ViewToggle({ view, onChange }: { view: OutView; onChange: (v: OutView) => void }) {
  return (
    <div className="seg-toggle" role="tablist" aria-label="Result view">
      <button role="tab" aria-selected={view === 'markup'} className={view === 'markup' ? 'on' : ''} onClick={() => onChange('markup')}><Code2 size={13} /> Markup</button>
      <button role="tab" aria-selected={view === 'preview'} className={view === 'preview' ? 'on' : ''} onClick={() => onChange('preview')}><Eye size={13} /> Preview</button>
    </div>
  );
}

const FRAME_CSS = `html,body{margin:0}body{padding:14px;font:15px/1.5 system-ui,-apple-system,sans-serif;color:#f1e9fa;background:transparent}
h1,h2,h3{font-family:Georgia,serif;font-weight:400;margin:.2em 0}button,input,select{font:inherit;color:#f1e9fa;background:#241346;border:1px solid #6b4a9e;border-radius:8px;padding:6px 10px;margin:2px}
button:disabled{opacity:.45}a{color:#d5a5ff}ul,ol{padding-left:1.2em}table{border-collapse:collapse}td,th{border:1px solid #4a2f78;padding:4px 8px}img{max-width:100%}`;

/** A still picture of the rendered tree, in a sandbox with no scripts and no network. */
export function Preview({ html }: { html: string }) {
  const doc = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><style>${FRAME_CSS}</style>${html || '<p style="opacity:.55">Nothing rendered yet.</p>'}`;
  return <iframe className="preview-frame" title="Rendered preview" sandbox="" srcDoc={doc} />;
}

/** Turns consecutive repeats into "click button x3" so the test script stays short on a phone. */
export function summarizeSteps(steps: string[] | undefined): string {
  if (!steps?.length) return '';
  const out: string[] = [];
  for (let i = 0; i < steps.length;) {
    let j = i; while (j < steps.length && steps[j] === steps[i]) j++;
    out.push(j - i > 1 ? `${steps[i]} ×${j - i}` : steps[i]); i = j;
  }
  return out.join('  ›  ');
}
