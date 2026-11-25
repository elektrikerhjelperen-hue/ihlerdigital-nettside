// Lokal server som oppfører seg som GitHub Pages: mappe → index.html, ukjent adresse → 404.html med status 404.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

export const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPER = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webp': 'image/webp', '.avif': 'image/avif' };
export async function start() {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.join(ROT, p);
    if (!f.startsWith(ROT) || p.includes('/_bygg/') || p.includes('/.git')) f = '';
    if (f && fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (f && fs.existsSync(f)) { res.writeHead(200, { 'content-type': TYPER[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f)); return; }
    res.writeHead(404, { 'content-type': TYPER['.html'] }); res.end(fs.readFileSync(path.join(ROT, '404.html')));
  }).listen(0);
  await new Promise((r) => srv.once('listening', r));
  return { srv, base: `http://localhost:${srv.address().port}` };
}
