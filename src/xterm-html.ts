import { theme } from './theme';

export const XTERM_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css">
<script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: ${theme.colors.background}; }
  #terminal { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="terminal"></div>
<script>
  var term = new Terminal({
    fontSize: ${theme.font.size},
    fontFamily: 'monospace',
    theme: {
      background: '${theme.colors.background}',
    },
    convertEol: false,
    scrollback: 5000,
  });

  var fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open(document.getElementById('terminal'));
  fitAddon.fit();

  function sendResize() {
    var msg = JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows });
    window.ReactNativeWebView.postMessage(msg);
  }

  sendResize();

  term.onData(function(data) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'input', data: data }));
  });

  var resizeObserver = new ResizeObserver(function() {
    fitAddon.fit();
    sendResize();
  });
  resizeObserver.observe(document.getElementById('terminal'));

  document.addEventListener('message', handleMessage);
  window.addEventListener('message', handleMessage);

  function handleMessage(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'write') {
        var bytes = Uint8Array.from(atob(msg.data), function(c) { return c.charCodeAt(0); });
        term.write(bytes);
      }
    } catch(err) {}
  }
</script>
</body>
</html>`;
