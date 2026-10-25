/** A virtual clock. Learner code gets these instead of the real timers, so "wait 1000" in a step script
 *  advances time instantly and every run is deterministic. */
type Task = { id: number; at: number; fn: () => void; every?: number };

export class Clock {
  now = 0;
  private nextId = 1;
  private tasks = new Map<number, Task>();

  setTimeout = (fn: (...a: unknown[]) => void, ms = 0, ...args: unknown[]): number => {
    const id = this.nextId++;
    this.tasks.set(id, { id, at: this.now + Math.max(0, Number(ms) || 0), fn: () => fn(...args) });
    return id;
  };
  setInterval = (fn: (...a: unknown[]) => void, ms = 0, ...args: unknown[]): number => {
    const id = this.nextId++;
    const every = Math.max(1, Number(ms) || 1);
    this.tasks.set(id, { id, at: this.now + every, every, fn: () => fn(...args) });
    return id;
  };
  clear = (id: unknown) => { this.tasks.delete(id as number); };

  /** Moves time forward, running every timer that falls due along the way, in order. */
  advance(ms: number) {
    const end = this.now + Math.max(0, ms);
    let guard = 0;
    for (;;) {
      let next: Task | undefined;
      for (const t of this.tasks.values()) if (t.at <= end && (!next || t.at < next.at || (t.at === next.at && t.id < next.id))) next = t;
      if (!next) break;
      if (++guard > 5000) throw new Error('A timer is firing too often. Check your setInterval or setTimeout loop.');
      this.now = next.at;
      if (next.every) next.at += next.every; else this.tasks.delete(next.id);
      next.fn();
    }
    this.now = end;
  }
}
