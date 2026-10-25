import { STARTER } from './examples';

const KEY = 'lunara.sandbox.v1';
export type Sandbox = { code: string; actions: string };

export function loadSandbox(): Sandbox {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s.code === 'string') return { code: s.code, actions: typeof s.actions === 'string' ? s.actions : '' };
  } catch { /* fall through */ }
  return { code: STARTER, actions: '' };
}
export function saveSandbox(s: Sandbox) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode / quota */ } }
