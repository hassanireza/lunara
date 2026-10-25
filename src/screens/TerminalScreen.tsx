import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Code2, HelpCircle, MousePointerClick, Play, Square, Terminal, Trash2, Undo2 } from 'lucide-react';
import { Accessory, keepFocus } from '../components/Accessory';
import { CodeEditor, type EditorHandle } from '../components/CodeEditor';
import { Preview, ViewToggle, type OutView } from '../components/Rendered';
import { Sheet } from '../components/Sheet';
import { ACTION_HELP, EXAMPLES, type Example } from '../examples';
import { useEditing } from '../hooks';
import { cancelRun, execReact, runtimeState, subscribeRuntime, warmUp, type RuntimeState } from '../react';
import { loadSandbox, saveSandbox } from '../sandbox';

type Run = { state: 'idle' | 'running' | 'done' | 'error' | 'stopped'; output: string; logs: string; html: string; error?: string; ms?: number };
type Undo = { code: string; actions: string; label: string };
const IDLE: Run = { state: 'idle', output: '', logs: '', html: '' };

/** A free scratchpad: write any React, optionally script some clicks and typing, run it, see the markup and console. Nothing here affects progress. */
export function TerminalScreen({ onBack }: { onBack: () => void }) {
  const saved = useMemo(loadSandbox, []);
  const [code, setCode] = useState(saved.code);
  const [actions, setActions] = useState(saved.actions);
  const [run, setRun] = useState<Run>(IDLE);
  const [view, setView] = useState<OutView>('markup');
  const [rt, setRt] = useState<RuntimeState>(runtimeState());
  const [sheet, setSheet] = useState<'examples' | 'help' | null>(null);
  const [actionsOpen, setActionsOpen] = useState(!!saved.actions.trim());
  const [undo, setUndo] = useState<Undo | null>(null);
  const editor = useRef<EditorHandle>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const token = useRef(0);
  const pendingScroll = useRef(false);
  const editing = useEditing();
  const running = run.state === 'running';
  const lines = code.trim() ? code.replace(/\s+$/, '').split('\n').length : 0;
  const actionCount = actions.split('\n').filter((l) => l.trim() && !/^(#|\/\/)/.test(l.trim())).length;

  useEffect(() => subscribeRuntime(setRt), []);
  useEffect(() => { warmUp(); window.scrollTo(0, 0); }, []);
  useEffect(() => { const t = window.setTimeout(() => saveSandbox({ code, actions }), 400); return () => window.clearTimeout(t); }, [code, actions]);
  useEffect(() => { if (!undo) return; const t = window.setTimeout(() => setUndo(null), 7000); return () => window.clearTimeout(t); }, [undo]);
  useEffect(() => () => { token.current++; cancelRun(); }, []);
  useEffect(() => {
    if (!editing && pendingScroll.current) {
      pendingScroll.current = false;
      const t = window.setTimeout(() => consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 180);
      return () => window.clearTimeout(t);
    }
  }, [editing]);

  async function start() {
    if (running) return;
    if (editing) pendingScroll.current = true; else requestAnimationFrame(() => consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    (document.activeElement as HTMLElement | null)?.blur?.();
    const t = ++token.current;
    setRun({ ...IDLE, state: 'running' });
    try {
      const r = await execReact(code, actions);
      if (t !== token.current) return;
      setRun({ state: r.error ? 'error' : 'done', output: r.output, logs: r.logs, html: r.html, error: r.error, ms: r.ms });
    } catch (e) {
      if (t !== token.current) return;
      const m = (e as Error).message;
      setRun({ ...IDLE, state: 'error', error: m === 'TIMEOUT_RUN' ? 'Stopped after 6 seconds. Check for a loop that never ends.' : m === 'TIMEOUT_LOAD' || m === 'START_FAILED' ? 'React could not start. Reload the page and tap Run again.' : m });
    }
  }
  function stop() { token.current++; cancelRun(); setRun({ ...IDLE, state: 'stopped' }); }

  const replace = (next: { code: string; actions: string }, label: string) => { setUndo({ code, actions, label }); setCode(next.code); setActions(next.actions); setRun(IDLE); if (next.actions.trim()) setActionsOpen(true); };
  const useExample = (e: Example) => { setSheet(null); replace({ code: e.code, actions: e.actions ?? '' }, `Loaded “${e.title}”`); };

  const status = run.state === 'running' ? 'RUNNING' : run.state === 'done' ? `DONE · ${run.ms} MS` : run.state === 'error' ? 'ERROR' : run.state === 'stopped' ? 'STOPPED' : 'READY';
  const hasResult = run.state === 'done' || run.state === 'error';
  const runAction = running
    ? <button className="danger run-mini" onPointerDown={keepFocus} onClick={stop}><Square size={14} fill="currentColor" /> Stop</button>
    : <button className="primary run-mini" onPointerDown={keepFocus} onClick={start}><Play size={15} fill="currentColor" /> Run</button>;

  return (
    <div className="workspace play terminal">
      <div className="focus-bar">
        <button className="done" onClick={() => editor.current?.blur()}><ChevronDown size={18} /> Done</button>
        <span className="focus-title"><Terminal size={14} /> Terminal</span>
      </div>

      <div className="play-bar">
        <button className="back" onClick={onBack}><ChevronLeft size={18} /> MAP</button>
        <div className="level-no">SANDBOX</div>
        <div className="play-bar-end" aria-hidden="true" />
      </div>

      <div className="question-head sandbox-head">
        <div className="eyebrow">FREE PLAY</div>
        <h1>Terminal</h1>
        <p>Write any React, with a component called App, and run it. Your code is saved on this device, and nothing here counts toward your path.</p>
      </div>

      <div className="card editor-card">
        <div className="card-top">
          <span><Code2 size={14} /> App.jsx</span>
          <span className={`rt rt-${rt}`}>{rt === 'ready' ? 'REACT READY' : rt === 'loading' ? 'REACT WAKING' : 'REACT ASLEEP'}</span>
          <span className="lines">{lines} {lines === 1 ? 'line' : 'lines'}</span>
          <button className="icon-btn" onClick={() => code && replace({ code: '', actions }, 'Editor cleared')} aria-label="Clear editor" disabled={!code}><Trash2 size={16} /></button>
        </div>
        <div className="editor"><CodeEditor ref={editor} value={code} onChange={setCode} /></div>
      </div>

      <div className="card input-card">
        <button className="card-top toggle" onClick={() => setActionsOpen((o) => !o)} aria-expanded={actionsOpen}>
          <span><MousePointerClick size={14} /> ACTIONS</span>
          <span className="hint-line">{actionCount ? `${actionCount} action${actionCount === 1 ? '' : 's'} ready` : 'optional: clicks, typing, waiting'}</span>
          <ChevronRight size={16} className={`chev${actionsOpen ? ' open' : ''}`} />
        </button>
        {actionsOpen && (
          <>
            <textarea className="stdin" value={actions} onChange={(e) => setActions(e.target.value)} rows={3} placeholder={'One action per line, played after the first render.\nExample:\nclick button\ntype input Ada\nwait 1000'}
              autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Actions played after the first render" />
            <button className="link-btn" onClick={() => setSheet('help')}><HelpCircle size={14} /> What can I write here?</button>
          </>
        )}
      </div>

      <div className="card output-card" ref={consoleRef}>
        <div className="card-top">
          <span><Terminal size={14} /> RESULT</span>
          <ViewToggle view={view} onChange={setView} />
          <span className={`status s-${run.state === 'error' ? 'error' : run.state === 'running' ? 'busy' : run.state === 'done' ? 'ok' : 'idle'}`}>{status}</span>
          <button className="icon-btn" onClick={() => setRun(IDLE)} aria-label="Clear result" disabled={run.state === 'idle' || running}><Trash2 size={16} /></button>
        </div>
        {view === 'preview' && hasResult && !run.error ? <Preview html={run.html} /> : (
          <pre aria-live="polite">
            {run.state === 'idle' && <span className="muted">Run your code to see what it renders.</span>}
            {run.state === 'running' && <span className="muted">{rt === 'ready' ? 'Rendering…' : 'Waking React up…'}</span>}
            {run.state === 'stopped' && <span className="muted">Stopped.</span>}
            {hasResult && <>{run.output}{run.logs && <><span className="muted">{`${run.output ? '\n' : ''}── console ──\n`}</span>{run.logs}</>}{run.state === 'done' && !run.output && !run.logs && <span className="muted">(rendered nothing)</span>}{run.error && <span className="err">{`${run.output || run.logs ? '\n' : ''}${run.error}`}</span>}</>}
          </pre>
        )}
      </div>

      {undo && <div className="toast" role="status"><span>{undo.label}</span><button onClick={() => { setCode(undo.code); setActions(undo.actions); setUndo(null); }}><Undo2 size={15} /> Undo</button></div>}

      <div className="dock play-dock">
        <div className="actions">
          <button className="ghost" onClick={() => setSheet('examples')}><BookOpen size={17} /> Examples</button>
          {running
            ? <button className="danger run-btn" onClick={stop}><Square size={14} fill="currentColor" /> Stop</button>
            : <button className="primary run-btn" onClick={start}><Play size={15} fill="currentColor" /> Run code</button>}
        </div>
      </div>

      <Accessory editor={editor} action={runAction} />

      {sheet === 'examples' && (
        <Sheet eyebrow="START FROM" title="Examples" onClose={() => setSheet(null)}>
          <div className="example-list">
            {EXAMPLES.map((e) => (
              <button key={e.id} className="example" onClick={() => useExample(e)}>
                <span><b>{e.title}</b><small>{e.blurb}</small></span><ChevronRight size={18} />
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {sheet === 'help' && (
        <Sheet eyebrow="ACTIONS PANEL" title="Play the page" onClose={() => setSheet(null)}>
          <div className="example-list help-list">
            {ACTION_HELP.map(([cmd, what]) => <div key={cmd} className="help-row"><code>{cmd}</code><small>{what}</small></div>)}
          </div>
        </Sheet>
      )}
    </div>
  );
}
