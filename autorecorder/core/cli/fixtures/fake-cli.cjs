/**
 * A fake interactive CLI, used to prove the driver works on this machine.
 *
 * It imitates the shapes the real thing uses — a y/n confirm, a text field, an
 * arrow-navigated list that repaints in place and wraps at the ends, and a
 * single-keypress prompt that acts without Enter. Those four shapes are what
 * the driver has to get right; everything else is wording.
 *
 * Deliberately dependency-free CommonJS so it runs under any Node this repo
 * supports, with no build step and nothing to install.
 */
const ESC = String.fromCharCode(27);
const CR = String.fromCharCode(13);
const NL = CR + String.fromCharCode(10);

const ROWS = [
  'LangGraph (Python)',
  'LangGraph (JavaScript)',
  'Claude Agent SDK (Python)',
  'Mastra',
  'Microsoft Agent Framework (.NET)',
  'Microsoft Agent Framework (Python)',
  'Agno',
];

const out = (s) => process.stdout.write(s);

/** Repaints the list over itself, exactly as a real TUI does. */
function paintList(cursor, firstPaint) {
  if (!firstPaint) out(ESC + '[' + (ROWS.length + 1) + 'A');
  out(ESC + '[2K' + 'Select agent framework' + NL);
  ROWS.forEach((row, i) => {
    const marker = i === cursor ? '❯ ' : '  ';
    const colour = i === cursor ? ESC + '[36m' : '';
    const reset = i === cursor ? ESC + '[0m' : '';
    out(ESC + '[2K' + colour + marker + row + reset + NL);
  });
}

let stage = 'confirm';
let cursor = 0;
let typed = '';

process.stdin.setRawMode?.(true);
process.stdin.resume();

out('Need to install the following packages:' + NL);
out('fake-cli@1.0.0' + NL);
out('Ok to proceed? (y) ');

process.stdin.on('data', (chunk) => {
  const data = chunk.toString();

  if (stage === 'confirm') {
    if (data.includes(CR)) {
      stage = 'name';
      out(NL + 'App name' + NL);
      out('Names your new app and its folder' + NL + '> ');
    } else {
      out(data);
    }
    return;
  }

  if (stage === 'name') {
    if (data.includes(CR)) {
      stage = 'list';
      out(NL);
      paintList(cursor, true);
    } else {
      typed += data;
      out(data);
    }
    return;
  }

  if (stage === 'list') {
    if (data === ESC + '[B') {
      cursor = (cursor + 1) % ROWS.length; // wraps, like the real list
      paintList(cursor, false);
    } else if (data === ESC + '[A') {
      cursor = (cursor - 1 + ROWS.length) % ROWS.length;
      paintList(cursor, false);
    } else if (data.includes(CR)) {
      stage = 'install';
      out(NL + 'Selected: ' + ROWS[cursor] + NL);
      out('Want me to install the dependencies for you now? [Y/n] ');
    }
    return;
  }

  if (stage === 'install') {
    // Single keypress: acts immediately, no Enter. Getting this wrong in the
    // driver leaks a stray Enter into whatever comes next.
    const answer = data[0];
    out(answer + NL);
    out('App name was: ' + typed + NL);
    out('Framework was: ' + ROWS[cursor] + NL);
    out('Done.' + NL);
    process.exit(answer.toLowerCase() === 'n' ? 0 : 0);
  }
});
