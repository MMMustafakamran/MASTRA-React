/**
 * A fake dev server, used to prove the service runner works on this machine.
 *
 * Imitates the two behaviours that make a dev server different from a command:
 * it prints progress before it is usable, and then it *never exits*. A runner
 * that waits for exit hangs on it; a runner that assumes "started" means "ready"
 * films a compile screen instead of an app.
 *
 * Dependency-free CommonJS so it runs with no build step.
 */
const CR = String.fromCharCode(13);
const NL = CR + String.fromCharCode(10);
const out = (s) => process.stdout.write(s);

const PORT = process.env.PORT || '3000';

out('  ▲ Next.js 15.0.0' + NL);
out('  - Local:        http://localhost:' + PORT + NL);
out(NL);
out(' ✓ Starting...' + NL);

// A short compile phase, so "ready" is genuinely later than "started".
let dots = 0;
const compiling = setInterval(() => {
  dots++;
  out(' ⚙ Compiling' + '.'.repeat(dots) + CR);
  if (dots >= 3) {
    clearInterval(compiling);
    out(NL + ' ✓ Ready in 1487ms' + NL);
  }
}, 250);

// Stay up. The runner is expected to kill this; if it does not, the test hangs,
// which is exactly the failure worth catching.
setInterval(() => {}, 1 << 30);
