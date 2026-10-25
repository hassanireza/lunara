import type { WorkerIn, WorkerOut } from './react.worker';

export type RunResult = { actual: string; expected: string; solved: boolean; html: string };
export type ExecResult = { output: string; logs: string; html: string; error?: string; ms: number };
export type RuntimeState = 'idle' | 'loading' | 'ready';

const LOAD_LIMIT = 20_000;      // the renderer ships inside the app, so this is generous
export const QUIZ_LIMIT = 4_000;    // protects levels against `while (true) {}`
export const SANDBOX_LIMIT = 6_000;

let worker: Worker | null = null;
let state: RuntimeState = 'idle';
let nextId = 1;
type Pending = { id: number; limit: number; resolve: (v: any) => void; reject: (e: Error) => void; timer: number };
let pending: Pending | null = null;
const listeners = new Set<(s: RuntimeState) => void>();
const setState = (s: RuntimeState) => { state = s; listeners.forEach((l) => l(s)); };

export const runtimeState = () => state;
export function subscribeRuntime(fn: (s: RuntimeState) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

function kill(reason?: Error) {
  worker?.terminate(); worker = null; setState('idle');
  if (pending) { window.clearTimeout(pending.timer); pending.reject(reason ?? new Error('cancelled')); pending = null; }
}

function spawn() {
  if (worker) return worker;
  worker = new Worker(new URL('./react.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<WorkerOut>) => {
    const m = e.data;
    if (m.type === 'ready') { setState('ready'); return; }
    if (!pending || ('id' in m && m.id !== pending.id)) return;
    if (m.type === 'running') { window.clearTimeout(pending.timer); pending.timer = window.setTimeout(() => kill(new Error('TIMEOUT_RUN')), pending.limit); return; }
    window.clearTimeout(pending.timer);
    const p = pending; pending = null;
    if (m.type === 'result') p.resolve({ actual: m.actual, expected: m.expected, solved: m.solved, html: m.html } satisfies RunResult);
    else if (m.type === 'exec-result') p.resolve({ output: m.output, logs: m.logs, html: m.html, error: m.error, ms: m.ms } satisfies ExecResult);
    else p.reject(new Error(m.message));
  };
  worker.onerror = () => kill(new Error('START_FAILED'));
  return worker;
}

/** Wake the renderer while the learner reads, so Run feels instant. */
export function warmUp() { if (state === 'idle') { setState('loading'); spawn().postMessage({ type: 'warm' } satisfies WorkerIn); } }

/** Stops whatever is running (the worker is replaced and wakes again on the next run). */
export function cancelRun() { if (pending) kill(); }

function send<T>(build: (id: number) => WorkerIn, limit: number): Promise<T> {
  if (pending) kill();
  if (state === 'idle') setState('loading');
  const w = spawn();
  return new Promise<T>((resolve, reject) => {
    const id = nextId++;
    pending = { id, limit, resolve, reject, timer: window.setTimeout(() => kill(new Error('TIMEOUT_LOAD')), LOAD_LIMIT) };
    w.postMessage(build(id));
  });
}

/** Level check: render the learner's code and the answer key through the same script, compare what they draw. */
export const runReact = (req: { code: string; target: string; entry?: string; steps?: string[] }) => send<RunResult>((id) => ({ type: 'run', id, ...req }), QUIZ_LIMIT);
/** Free terminal: render code and replay the Actions script, return the raw markup and console output. */
export const execReact = (code: string, actions: string) => send<ExecResult>((id) => ({ type: 'exec', id, code, actions }), SANDBOX_LIMIT);
