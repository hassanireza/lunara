import type { ReactTestInstance } from 'react-test-renderer';

/** A tiny script language that stands in for a user: one action per line.
 *    click button        click button[2]      click "Add item"      click .card
 *    type input hello    check input[2]       uncheck input         choose select red
 *    submit form         key input Enter      wait 1000
 *  Lines that are empty or start with # or // are ignored. */

export type Step = { raw: string; verb: string; target: string; arg: string };

const VERBS = ['click', 'type', 'check', 'uncheck', 'submit', 'choose', 'key', 'wait'] as const;

export function parseSteps(source: string | string[]): Step[] {
  const lines = Array.isArray(source) ? source : source.replace(/\r/g, '').split('\n');
  const out: Step[] = [];
  for (const line of lines) {
    const raw = line.trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('//')) continue;
    const m = /^(\w+)\s*(.*)$/.exec(raw);
    const verb = m?.[1].toLowerCase() ?? '';
    if (!m || !(VERBS as readonly string[]).includes(verb)) throw new Error(`Unknown action "${raw}". Use click, type, check, uncheck, submit, choose, key or wait.`);
    let rest = m[2].trim();
    if (verb === 'wait') { out.push({ raw, verb, target: '', arg: rest || '0' }); continue; }
    let target = '';
    const q = /^("[^"]*")(\[\d+\])?/.exec(rest);
    if (q) target = q[0]; else target = /^\S+/.exec(rest)?.[0] ?? '';
    rest = rest.slice(target.length).trim();
    if (!target) throw new Error(`The action "${raw}" needs something to act on, like: ${verb} button`);
    out.push({ raw, verb, target, arg: rest });
  }
  return out;
}

const isHost = (i: ReactTestInstance) => typeof i.type === 'string';
function textOf(i: ReactTestInstance | string): string {
  return typeof i === 'string' ? i : i.children.map(textOf).join('');
}

function find(root: ReactTestInstance, target: string): ReactTestInstance {
  const nth = /\[(\d+)\]$/.exec(target);
  const index = nth ? Number(nth[1]) - 1 : 0;
  const body = nth ? target.slice(0, nth.index) : target;
  let hits: ReactTestInstance[];
  if (body.startsWith('"')) {
    const text = body.slice(1, -1);
    const all = root.findAll((i) => isHost(i) && textOf(i).trim() === text);
    // innermost match first: a button inside a div with the same text should win
    hits = all.filter((i) => !all.some((o) => o !== i && o.parent === i));
  } else {
    const m = /^([a-zA-Z][a-zA-Z0-9]*|\*)?(?:#([\w-]+))?((?:\.[\w-]+)*)$/.exec(body);
    if (!m) throw new Error(`Cannot understand the target "${target}". Try a tag like button, button[2], #id, .class or "text".`);
    const [, tag, id, cls] = m;
    const classes = cls ? cls.split('.').filter(Boolean) : [];
    hits = root.findAll((i) => {
      if (!isHost(i)) return false;
      if (tag && tag !== '*' && i.type !== tag) return false;
      if (id && i.props.id !== id) return false;
      const have = String(i.props.className ?? '').split(/\s+/);
      return classes.every((c) => have.includes(c));
    }, { deep: true });
  }
  const hit = hits[index];
  if (!hit) throw new Error(`Could not find ${target} on the page${hits.length ? ` (only ${hits.length} matched)` : ''}.`);
  return hit;
}

type Ev = Record<string, unknown> & { cancelBubble?: boolean };

/** Calls the handler on the element, then bubbles up the way the DOM would. */
function fire(el: ReactTestInstance, handler: string, extra: Ev, targetState: Record<string, unknown>): boolean {
  const event: Ev = {
    type: handler.slice(2).toLowerCase(), target: targetState, currentTarget: targetState, defaultPrevented: false, cancelBubble: false,
    preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.cancelBubble = true; }, persist() { /* noop */ }, ...extra,
  };
  let node: ReactTestInstance | null = el, called = false;
  while (node) {
    const fn = isHost(node) ? node.props[handler] : undefined;
    if (typeof fn === 'function') { called = true; fn(event); if (event.cancelBubble) break; }
    node = node.parent;
  }
  return called;
}

export function applyStep(root: ReactTestInstance, step: Step, advance: (ms: number) => void) {
  if (step.verb === 'wait') {
    const ms = Number(step.arg);
    if (!Number.isFinite(ms) || ms < 0) throw new Error(`wait needs a number of milliseconds, like: wait 1000`);
    advance(ms); return;
  }
  const el = find(root, step.target);
  const p = el.props as Record<string, unknown>;
  const state = { value: p.value ?? p.defaultValue ?? '', checked: Boolean(p.checked ?? p.defaultChecked), name: p.name, type: p.type, id: p.id };
  const need = (handler: string, ok: boolean) => { if (!ok) throw new Error(`${step.verb} ${step.target}: the element has no ${handler} handler.`); };
  switch (step.verb) {
    case 'click': need('onClick', fire(el, 'onClick', { button: 0 }, state)); break;
    case 'type': { const t = { ...state, value: step.arg }; need('onChange', fire(el, 'onChange', {}, t)); break; }
    case 'choose': { const t = { ...state, value: step.arg }; need('onChange', fire(el, 'onChange', {}, t)); break; }
    case 'check': need('onChange', fire(el, 'onChange', {}, { ...state, checked: true })); break;
    case 'uncheck': need('onChange', fire(el, 'onChange', {}, { ...state, checked: false })); break;
    case 'submit': need('onSubmit', fire(el, 'onSubmit', {}, state)); break;
    case 'key': need('onKeyDown', fire(el, 'onKeyDown', { key: step.arg || 'Enter' }, state)); break;
  }
}
