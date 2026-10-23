/**
 * serve.js — minimal static file server for local development.
 * Zero dependencies. Uses only Node built-ins.
 *
 * Usage:  node serve.js          (default port 3000)
 *         node serve.js 8080     (custom port)
 */

import http from 'node:http';
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2]) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',   // must be text/javascript for ESM
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // Sanitise path — prevent directory traversal
  const rel     = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const absPath = path.join(ROOT, path.normalize(rel));

  if (!absPath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(absPath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      return res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
    }

    const ext  = path.extname(absPath).toLowerCase();
    const mime = MIME[ext] ?? 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT}`);
  console.log(`Open http://localhost:${PORT}`);
});
