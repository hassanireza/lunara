import { check, framesText, runProgram } from './engine/run';

export type WorkerIn =
  | { type: 'warm' }
  | { type: 'run'; id: number; code: string; target: string; entry?: string; steps?: string[] }
  | { type: 'exec'; id: number; code: string; actions: string };
export type WorkerOut =
  | { type: 'ready' }
  | { type: 'running'; id: number }
  | { type: 'result'; id: number; actual: string; expected: string; solved: boolean; html: string }
  | { type: 'exec-result'; id: number; output: string; logs: string; html: string; error?: string; ms: number }
  | { type: 'error'; id: number; message: string };

const post = (m: WorkerOut) => (self as unknown as Worker).postMessage(m);
const OUTPUT_CAP = 200_000; // a runaway console.log loop must not eat the phone's memory
const cap = (s: string) => (s.length > OUTPUT_CAP ? `${s.slice(0, OUTPUT_CAP)}\n…(output truncated)\n` : s);
const short = (s: string) => s.split('\n').slice(0, 4).join('\n');

self.onmessage = (event: MessageEvent<WorkerIn>) => {
  const msg = event.data;
  // Everything is bundled, so there is nothing to download: the worker is ready as soon as it starts.
  if (msg.type === 'warm') { post({ type: 'ready' }); return; }
  post({ type: 'ready' });
  post({ type: 'running', id: msg.id });
  try {
    if (msg.type === 'exec') {
      const t0 = performance.now();
      const r = runProgram({ code: msg.code, steps: msg.actions });
      post({ type: 'exec-result', id: msg.id, output: cap(r.frames.length ? framesText(r.frames) : ''), logs: cap(r.logs.join('\n')), html: r.html, error: r.error, ms: Math.round(performance.now() - t0) });
      return;
    }
    const res = check({ code: msg.code, target: msg.target, entry: msg.entry, steps: msg.steps });
    if (res.error) { post({ type: 'error', id: msg.id, message: short(res.error) }); return; }
    post({ type: 'result', id: msg.id, actual: cap(res.actual), expected: cap(res.expected), solved: res.solved, html: res.html });
  } catch (error) {
    post({ type: 'error', id: msg.id, message: short(String((error as Error)?.message ?? error)) });
  }
};
