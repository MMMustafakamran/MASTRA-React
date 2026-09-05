/**
 * A fake scaffolded app, used to prove the whole demo recording path works on
 * this machine before any real scaffold exists.
 *
 * It is a dev server and an app at once, because the thing being verified spans
 * both: boot output that becomes ready, then a page whose chat surface matches
 * the selector contract in `config/selectors.config.ts`, so `sendPrompt` and
 * `waitForAgentResponseCompletion` have something real to drive.
 *
 * The reply streams word by word on purpose. An answer that appeared all at
 * once would let a broken completion detector pass — it is the growing-then-
 * stable text that the detector actually keys on.
 *
 * Dependency-free CommonJS so it runs with no build step.
 */
const http = require('node:http');

const PORT = Number(process.env.PORT || 3999);
const CR = String.fromCharCode(13);
const NL = CR + String.fromCharCode(10);
const out = (s) => process.stdout.write(s);

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Fake scaffolded app</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; height:100vh; display:flex; align-items:center; justify-content:center;
         background:#0f172a; color:#e2e8f0; font-family:'Segoe UI',system-ui,sans-serif; }
  .copilotKitChat { width:760px; max-width:92vw; height:620px; background:#111827;
        border:1px solid #1f2937; border-radius:14px; display:flex; flex-direction:column;
        box-shadow:0 24px 64px rgba(0,0,0,.5); }
  header { padding:16px 20px; border-bottom:1px solid #1f2937; font-weight:600; font-size:15px; }
  #messages { flex:1; padding:18px 20px; overflow:auto; display:flex; flex-direction:column; gap:12px; }
  .copilotKitMessage { padding:11px 15px; border-radius:12px; max-width:80%; line-height:1.5; font-size:14.5px; }
  .copilotKitUserMessage { align-self:flex-end; background:#2563eb; color:#fff; }
  .copilotKitAssistantMessage { align-self:flex-start; background:#1f2937; }
  footer { padding:14px 16px; border-top:1px solid #1f2937; display:flex; gap:10px; }
  textarea { flex:1; resize:none; height:44px; padding:12px 14px; border-radius:10px;
             border:1px solid #334155; background:#0b1220; color:#e2e8f0; font-size:14.5px;
             font-family:inherit; }
  button { padding:0 20px; border-radius:10px; border:0; background:#2563eb; color:#fff;
           font-weight:600; font-size:14px; cursor:pointer; }
  button:disabled { opacity:.45; }
</style></head>
<body>
  <div class="copilotKitChat">
    <header>Fake scaffolded app — recorder self-test</header>
    <div id="messages"></div>
    <footer>
      <textarea data-testid="copilot-chat-textarea" placeholder="Ask anything..."></textarea>
      <button data-testid="copilot-send-button" type="submit">Send</button>
    </footer>
  </div>
<script>
  var input = document.querySelector('[data-testid="copilot-chat-textarea"]');
  var send = document.querySelector('[data-testid="copilot-send-button"]');
  var list = document.getElementById('messages');

  var REPLY = ("Here is one: why did the developer bring a ladder to the terminal? " +
               "Because the build kept failing at a higher level. " +
               "Ask me for another and I will try to do better.").split(' ');

  function bubble(cls, role) {
    var el = document.createElement('div');
    el.className = 'copilotKitMessage ' + cls;
    el.setAttribute('data-message-role', role);
    list.appendChild(el);
    return el;
  }

  function submit() {
    var text = input.value.trim();
    if (!text) return;
    bubble('copilotKitUserMessage', 'user').textContent = text;
    input.value = '';

    var reply = bubble('copilotKitAssistantMessage', 'assistant');
    var i = 0;
    var timer = setInterval(function () {
      reply.textContent += (i ? ' ' : '') + REPLY[i++];
      list.scrollTop = list.scrollHeight;
      if (i >= REPLY.length) clearInterval(timer);
    }, 70);
  }

  send.addEventListener('click', submit);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });
</script>
</body></html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(PAGE);
});

out('  ▲ Next.js 15.0.0 (fixture)' + NL);
out('  - Local:        http://localhost:' + PORT + NL);
out(NL + ' ✓ Starting...' + NL);

let dots = 0;
const compiling = setInterval(() => {
  dots++;
  out(' ⚙ Compiling' + '.'.repeat(dots) + CR);
  if (dots < 3) return;

  clearInterval(compiling);
  // Ready is printed only once the port is genuinely accepting connections —
  // a recorder that trusted the word alone would otherwise navigate too early.
  server.listen(PORT, () => {
    out(NL + ' ✓ Ready in 1502ms' + NL);
  });
}, 250);
