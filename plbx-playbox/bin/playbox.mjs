#!/usr/bin/env node
// @plbx/playbox — device-mockup preview harness for playable ads.
//
// Starts a tiny static HTTP server that serves the preview shell (a simulated
// phone frame) and loads a target URL (your game's dev server) inside an
// <iframe>. The target is loaded directly by the browser, so this server never
// proxies it — Vite HMR / WebSocket to the target keeps working untouched.
//
// Usage:
//   playbox --target http://localhost:5173 [--port 6060] [--host 0.0.0.0] [--open]

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import QRCode from 'qrcode';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ---------------------------------------------------------------- arg parsing
function parseArgs(argv) {
  const opts = { target: 'http://localhost:5173', port: 6060, host: '0.0.0.0', open: false, device: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--target' || a === '-t') opts.target = next();
    else if (a === '--port' || a === '-p') opts.port = Number(next());
    else if (a === '--host') opts.host = next();
    else if (a === '--device' || a === '-d') opts.device = next();
    else if (a === '--open' || a === '-o') opts.open = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (!a.startsWith('-') && opts.target === 'http://localhost:5173') opts.target = a; // positional
  }
  return opts;
}

function printHelp() {
  console.log(`
@plbx/playbox — simulated-device preview for playable ads

Usage:
  playbox --target <url> [options]

Options:
  -t, --target <url>   URL of the playable to preview   (default http://localhost:5173)
  -p, --port <n>       Port for the preview server       (default 6060)
      --host <addr>    Bind address                       (default 0.0.0.0)
  -d, --device <id>    Initial device preset id           (default s23ultra)
  -o, --open           Open the preview in the browser
  -h, --help           Show this help

Example:
  playbox --target http://localhost:5173 --open
`);
}

// -------------------------------------------------------------- LAN detection
// The QR code should point at an address a phone on the same Wi-Fi can reach,
// so swap loopback hosts for the machine's LAN IPv4 when possible.
function lanIPv4() {
  const ifaces = os.networkInterfaces();
  for (const list of Object.values(ifaces)) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}

function toLanUrl(target) {
  try {
    const u = new URL(target);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '0.0.0.0') {
      const ip = lanIPv4();
      if (ip) { u.hostname = ip; return u.toString(); }
    }
  } catch { /* leave as-is */ }
  return target;
}

// --------------------------------------------------------------- static serve
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { printHelp(); return; }

  const lanTarget = toLanUrl(opts.target);
  const config = {
    target: opts.target,
    lanTarget,
    defaultDevice: opts.device || 's23ultra',
    version: '0.1.0',
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);

    // QR endpoint: /api/qr?data=<url> -> SVG
    if (pathname === '/api/qr') {
      const data = url.searchParams.get('data') || lanTarget;
      try {
        const svg = await QRCode.toString(data, { type: 'svg', margin: 1, width: 240 });
        return send(res, 200, 'image/svg+xml', svg);
      } catch (e) {
        return send(res, 500, 'text/plain', 'QR error: ' + e.message);
      }
    }

    if (pathname === '/' || pathname === '') pathname = '/index.html';
    const filePath = path.join(PUBLIC_DIR, pathname);

    // Prevent path traversal outside PUBLIC_DIR.
    if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, 'text/plain', 'Forbidden');

    fs.readFile(filePath, (err, data) => {
      if (err) return send(res, 404, 'text/plain', 'Not found: ' + pathname);
      const ext = path.extname(filePath).toLowerCase();
      // Inject the runtime config into the shell page.
      if (ext === '.html') {
        const html = data.toString().replace(
          '<!--PLAYBOX_CONFIG-->',
          `<script>window.__PLAYBOX__ = ${JSON.stringify(config)};</script>`
        );
        return send(res, 200, MIME['.html'], html);
      }
      return send(res, 200, MIME[ext] || 'application/octet-stream', data);
    });
  });

  server.listen(opts.port, opts.host, () => {
    const shownHost = opts.host === '0.0.0.0' ? 'localhost' : opts.host;
    const previewUrl = `http://${shownHost}:${opts.port}/`;
    console.log(`\n  📱 @plbx/playbox v${config.version}`);
    console.log(`     Preview:  ${previewUrl}`);
    console.log(`     Target:   ${opts.target}`);
    if (lanTarget !== opts.target) console.log(`     On-device (QR): ${lanTarget}`);
    console.log(`\n     Make sure your playable dev server is running at the target URL.\n`);
    if (opts.open) openInBrowser(previewUrl);
  });
}

function openInBrowser(url) {
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin' ? ['open', [url]]
    : ['xdg-open', [url]];
  try { spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref(); } catch { /* ignore */ }
}

main();
