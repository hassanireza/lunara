import * as ReactNS from 'react';
import * as JsxNS from 'react/jsx-runtime';
import * as RendererNS from 'react-test-renderer';
import { transform } from 'sucrase';
import { Clock } from './clock';
import { EMPTY_RENDER, toHtml, toMarkup } from './snapshot';
import { applyStep, parseSteps } from './steps';

const React: typeof ReactNS = (ReactNS as any).default ?? ReactNS;
const Jsx: typeof JsxNS = (JsxNS as any).default ?? JsxNS;
const Renderer: typeof RendererNS = (RendererNS as any).default ?? RendererNS;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

export type RunInput = { code: string; entry?: string; steps?: string | string[] };
export type Frame = { label: string; markup: string };
export type RunOutput = { frames: Frame[]; logs: string[]; html: string; error?: string };

/** Frames joined into the text the learner sees (and the text answers are compared on). */
export function framesText(frames: Frame[]): string {
  if (frames.length === 1) return frames[0].markup;
  return frames.map((f) => `── ${f.label} ──\n${f.markup}`).join('\n');
}

export function compile(code: string): string {
  return transform(code, { transforms: ['jsx', 'imports'], jsxRuntime: 'automatic', production: true }).code;
}

function nice(e: unknown): string {
  const err = e as Error;
  const msg = String(err?.message ?? e).replace(/^PythonError:\s*/, '');
  const name = err?.name && err.name !== 'Error' ? `${err.name}: ` : '';
  return msg.startsWith(name) ? msg : `${name}${msg}`;
}

const fmt = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
  try { return JSON.stringify(v) ?? String(v); } catch { return String(v); }
};

/** Compiles and renders the learner's code, then plays the step script, taking a frame after each action. */
export function runProgram({ code, entry, steps }: RunInput): RunOutput {
  const frames: Frame[] = [];
  const logs: string[] = [];
  let html = '';
  let renderer: RendererNS.ReactTestRenderer | null = null;
  const clock = new Clock();
  try {
    const parsed = parseSteps(steps ?? []);
    const compiled = compile(entry ? `${code}\n;function __entry__() { return (${entry}); }` : code);
    const exports: Record<string, unknown> = {};
    const module = { exports };
    const require = (name: string) => {
      if (name === 'react') return React;
      if (name === 'react/jsx-runtime' || name === 'react/jsx-dev-runtime') return Jsx;
      throw new Error(`Cannot find module '${name}'. Only react is available here.`);
    };
    const con = { log: (...a: unknown[]) => logs.push(a.map(fmt).join(' ')), info: (...a: unknown[]) => logs.push(a.map(fmt).join(' ')), warn: (...a: unknown[]) => logs.push(`warn: ${a.map(fmt).join(' ')}`), error: (...a: unknown[]) => logs.push(`error: ${a.map(fmt).join(' ')}`) };
    const body = `${compiled}\n;return { entry: typeof __entry__ === 'function' ? __entry__ : undefined, app: (module.exports && module.exports.default) || (typeof App !== 'undefined' ? App : undefined) };`;
    const load = new Function('require', 'exports', 'module', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'console', body) as (...a: unknown[]) => { entry?: () => RendererNS.ReactTestRendererTree | React.ReactElement; app?: React.ComponentType };
    const loaded = load(require, exports, module, clock.setTimeout, clock.setInterval, clock.clear, clock.clear, con);
    let element: React.ReactElement;
    if (loaded.entry) element = loaded.entry() as React.ReactElement;
    else if (loaded.app) element = React.createElement(loaded.app);
    else throw new Error('Define a component named App, for example: function App() { return <h1>Hello</h1>; }');

    const snap = (label: string) => { const j = renderer!.toJSON(); frames.push({ label, markup: toMarkup(j) }); html = toHtml(j); };
    Renderer.act(() => { renderer = Renderer.create(element); });
    snap('render');
    for (const s of parsed) {
      Renderer.act(() => applyStep(renderer!.root, s, (ms) => clock.advance(ms)));
      snap(s.raw);
    }
    Renderer.act(() => { renderer!.unmount(); });
    return { frames, logs, html };
  } catch (e) {
    try { if (renderer) Renderer.act(() => { renderer!.unmount(); }); } catch { /* already broken */ }
    return { frames, logs, html, error: nice(e) };
  }
}

export type Comparison = { actual: string; expected: string; solved: boolean; html: string; error?: string };

const withLogs = (r: RunOutput) => framesText(r.frames) + (r.logs.length ? `\n── console ──\n${r.logs.join('\n')}` : '');

/** Level check: run the learner's code and the answer key through the same script, compare what they render. */
export function check(input: { code: string; target: string; entry?: string; steps?: string | string[] }): Comparison {
  const mine = runProgram({ code: input.code, entry: input.entry, steps: input.steps });
  if (mine.error) return { actual: mine.frames.length ? withLogs(mine) : '', expected: '', solved: false, html: mine.html, error: mine.error };
  const key = runProgram({ code: input.target, entry: input.entry, steps: input.steps });
  if (key.error) throw new Error(`Answer key failed: ${key.error}`);
  const same = framesText(mine.frames) === framesText(key.frames) && (key.logs.length === 0 || mine.logs.join('\n') === key.logs.join('\n'));
  return { actual: withLogs(mine), expected: withLogs(key), solved: same, html: mine.html };
}

export { EMPTY_RENDER };
