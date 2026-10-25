/* Plays every level against its own answer key. Run with:  npm run verify
   Checks that all 1,000 answer keys run, that every prompt is unique, and that no starter code solves its level. */
import { check, runProgram } from '../src/engine/run';
import { questions } from '../src/questions';
import { LEVEL_COUNT } from '../src/episodes';

const origError = console.error; console.error = () => { /* React logs error boundaries noise */ };
let bad = 0;
const fail = (id: number, msg: string) => { bad++; origError(`level ${id}: ${msg}`); };
if (questions.length !== LEVEL_COUNT) fail(0, `expected ${LEVEL_COUNT} levels, found ${questions.length}`);
const prompts = new Set<string>();
const t0 = Date.now();
for (const q of questions) {
  if (prompts.has(q.prompt)) fail(q.id, 'duplicate prompt');
  prompts.add(q.prompt);
  const key = runProgram({ code: q.target, entry: q.entry, steps: q.steps });
  if (key.error) { fail(q.id, `answer key failed: ${key.error}`); continue; }
  const self = check({ code: q.target, target: q.target, entry: q.entry, steps: q.steps });
  if (!self.solved) fail(q.id, 'answer key does not match itself');
  const start = check({ code: q.starter, target: q.target, entry: q.entry, steps: q.steps });
  if (start.solved) fail(q.id, 'the starter code already solves the level');
}
console.log(`${questions.length} levels checked in ${((Date.now() - t0) / 1000).toFixed(1)}s, ${bad} problem(s).`);
process.exit(bad ? 1 : 0);
