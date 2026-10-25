import type { ReactTestRendererJSON, ReactTestRendererNode } from 'react-test-renderer';

/** Turns the rendered tree into stable, readable markup. Attribute order never matters (they are sorted),
 *  function props are hidden, and the same text is produced for the learner's code and the answer key. */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const UNITLESS = new Set(['opacity', 'zIndex', 'flex', 'flexGrow', 'flexShrink', 'order', 'lineHeight', 'fontWeight', 'zoom', 'scale', 'aspectRatio', 'columns', 'gridColumn', 'gridRow']);
const RENAME: Record<string, string> = { className: 'class', htmlFor: 'for', defaultValue: 'value', defaultChecked: 'checked', tabIndex: 'tabindex', readOnly: 'readonly', maxLength: 'maxlength', autoFocus: 'autofocus', colSpan: 'colspan', rowSpan: 'rowspan' };
const SKIP = new Set(['children', 'key', 'ref', 'dangerouslySetInnerHTML', 'suppressContentEditableWarning', 'suppressHydrationWarning']);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const kebab = (s: string) => (s.startsWith('--') ? s : s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^ms-/, '-ms-'));

function styleText(style: unknown): string {
  if (!style || typeof style !== 'object') return '';
  return Object.entries(style as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== false && v !== '')
    .map(([k, v]) => `${kebab(k)}: ${typeof v === 'number' && v !== 0 && !UNITLESS.has(k) && !k.startsWith('--') ? `${v}px` : String(v)}`)
    .sort()
    .join('; ');
}

function attrs(props: Record<string, unknown>): string {
  const out: string[] = [];
  for (const [name, v] of Object.entries(props)) {
    if (SKIP.has(name) || typeof v === 'function' || v === null || v === undefined || typeof v === 'symbol') continue;
    const key = RENAME[name] ?? name;
    if ((name === 'className' || name === 'style') && (v === '' || (typeof v === 'string' && !v.trim()))) continue;
    if (name === 'style') { const s = styleText(v); if (s) out.push(`style="${escAttr(s)}"`); continue; }
    if (typeof v === 'boolean') {
      if (/^(aria-|data-)/.test(key)) out.push(`${key}="${v}"`); else if (v) out.push(key);
      continue;
    }
    out.push(`${key}="${escAttr(String(v))}"`);
  }
  return out.sort().map((a) => ` ${a}`).join('');
}

type Out = { kind: 'text'; text: string } | { kind: 'el'; tag: string; attrs: string; children: Out[] };

function convert(nodes: ReactTestRendererNode[] | null | undefined): Out[] {
  const out: Out[] = [];
  for (const n of nodes ?? []) {
    if (typeof n === 'string') {
      const last = out[out.length - 1];
      if (last && last.kind === 'text') last.text += n; else if (n !== '') out.push({ kind: 'text', text: n });
    } else out.push({ kind: 'el', tag: n.type, attrs: attrs(n.props as Record<string, unknown>), children: convert(n.children) });
  }
  return out.filter((o) => o.kind !== 'text' || o.text !== '');
}

function print(nodes: Out[], depth: number, pretty: boolean): string[] {
  const pad = pretty ? '  '.repeat(depth) : '';
  const lines: string[] = [];
  for (const n of nodes) {
    if (n.kind === 'text') { lines.push(pad + esc(n.text)); continue; }
    if (VOID.has(n.tag) && n.children.length === 0) { lines.push(`${pad}<${n.tag}${n.attrs} />`); continue; }
    if (n.children.length === 0) { lines.push(`${pad}<${n.tag}${n.attrs}></${n.tag}>`); continue; }
    if (n.children.every((c) => c.kind === 'text') || !pretty) {
      const inner = pretty ? n.children.map((c) => (c.kind === 'text' ? esc(c.text) : '')).join('') : print(n.children, 0, false).join('');
      lines.push(`${pad}<${n.tag}${n.attrs}>${inner}</${n.tag}>`);
      continue;
    }
    lines.push(`${pad}<${n.tag}${n.attrs}>`, ...print(n.children, depth + 1, pretty), `${pad}</${n.tag}>`);
  }
  return lines;
}

export const EMPTY_RENDER = '(renders nothing)';

function roots(json: ReactTestRendererJSON | ReactTestRendererJSON[] | null): Out[] {
  if (json === null) return [];
  return convert(Array.isArray(json) ? json : [json]);
}

/** Indented markup for reading and for answer checking. */
export function toMarkup(json: ReactTestRendererJSON | ReactTestRendererJSON[] | null): string {
  const lines = print(roots(json), 0, true);
  return lines.length ? lines.join('\n') : EMPTY_RENDER;
}

/** Compact markup for the visual preview. */
export function toHtml(json: ReactTestRendererJSON | ReactTestRendererJSON[] | null): string {
  return print(roots(json), 0, false).join('');
}
