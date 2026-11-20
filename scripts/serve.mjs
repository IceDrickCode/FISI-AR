import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const port = Number(option('--port', 5173));
const host = option('--host', '127.0.0.1');
const cert = option('--cert'); const key = option('--key');
if (Boolean(cert) !== Boolean(key)) throw new Error('Proporciona --cert y --key juntos.');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.mind': 'application/octet-stream' };
async function handler(req, res) {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Permissions-Policy': 'camera=(self), microphone=()' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404).end('No encontrado'); }
}
const server = cert ? https.createServer({ cert: await fs.readFile(cert), key: await fs.readFile(key) }, handler) : http.createServer(handler);
server.listen(port, host, () => console.log(`FISI-AR: ${cert ? 'https' : 'http'}://${host === '0.0.0.0' ? 'localhost' : host}:${port}`));
