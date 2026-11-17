// Keep fixed combat steps intact, but yield between them when a crowded battle
// has consumed this frame's CPU budget. Overload slows the game clock rather
// than executing a long catch-up loop that starves input and painting.
export function advanceSimulation(runtime, step, now = () => performance.now()) {
  const fixed = 1 / 30, started = now();
  runtime.acc = Math.min(runtime.acc, fixed * 8);
  let steps = 0;
  while (runtime.acc >= fixed && (steps === 0 || now() - started < 12)) {
    if (step(fixed) === false) break;
    runtime.acc -= fixed;
    steps++;
  }
  return {steps, pending: runtime.acc, elapsed: now() - started};
}
