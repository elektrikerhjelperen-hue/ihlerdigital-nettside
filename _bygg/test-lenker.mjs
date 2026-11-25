#!/usr/bin/env node
// Lenketest: gamle adresser skal virke, og nedlastingslenkene skal være uendret.
//   node _bygg/test-lenker.mjs grunnlinje   – leser sidene fra git (origin/main og 03419a2) og skriver _bygg/lenker-grunnlinje.json
//   node _bygg/test-lenker.mjs              – starter en lokal server på repoet (med 404.html som GitHub Pages) og sjekker
//
// Sjekker:
//  1. Alle gamle sider og filer (HTML, app-ads.txt, favicon, og.jpg, style.css, fonter) svarer 200.
//  2. app-ads.txt er byte for byte lik.
//  3. Elektrikerhjelpen: nøyaktig de samme App Store- og Google Play-URL-ene på alle sider der de fantes før.
//     /elektrikerhjelpen/ og undersidene har nøyaktig samme sett med butikklenker som før.
//  4. Appsidene (/<app>/) har fortsatt alle butikklenkene de hadde. Ingen side har en butikklenke som ikke fantes før.
//  5. En ukjent adresse gir 404 med 404-siden, og 404-siden har lenke til forsiden.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GRUNN = path.join(ROT, '_bygg/lenker-grunnlinje.json');
const REFS = ['origin/main', '03419a2'];
const BUTIKK = /https:\/\/(apps\.apple\.com|play\.google\.com)\/[^"'\s<>]+/g;
const EH = /elektrikerhjelpen|com\.Elektrikerhjelpen|id6795866616/i;
const butikklenker = (html) => [...new Set((html.match(/href="[^"]*"/g) || []).map((h) => h.slice(6, -1)).filter((u) => BUTIKK.test(u) && (BUTIKK.lastIndex = 0, true)))].sort();
const tilAdresse = (f) => '/' + f.replace(/(^|\/)index\.html$/, '$1');

if (process.argv[2] === 'grunnlinje') {
  const git = (...a) => execFileSync('git', a, { cwd: ROT, encoding: 'utf8', maxBuffer: 1 << 26 });
  const ut = { laget: new Date().toISOString(), refs: REFS, filer: [], sider: {}, appAds: null };
  const filer = new Set();
  for (const ref of REFS) {
    for (const f of git('ls-tree', '-r', '--name-only', ref).split('\n').filter(Boolean)) {
      if (f.startsWith('_bygg/') || f.startsWith('.') || f === 'CNAME' || f === 'DESIGN.md') continue;
      if (/\.(html|txt|svg|jpg|css|woff2)$/.test(f) && !f.startsWith('bilder/') && !f.startsWith('ikoner/')) filer.add(f);
      if (f.endsWith('.html')) {
        const lenker = butikklenker(git('show', `${ref}:${f}`));
        const a = tilAdresse(f);
        const tidl = ut.sider[a];
        if (tidl && JSON.stringify(tidl) !== JSON.stringify(lenker)) ut.sider[a] = [...new Set([...tidl, ...lenker])].sort();
        else ut.sider[a] = lenker;
      }
    }
    const ads = git('show', `${ref}:app-ads.txt`);
    if (ut.appAds !== null && ut.appAds !== ads) throw new Error('app-ads.txt er ulik i ' + REFS.join(' og '));
    ut.appAds = ads;
  }
  ut.filer = [...filer].sort().map(tilAdresse);
  fs.writeFileSync(GRUNN, JSON.stringify(ut, null, 1) + '\n');
  console.log(`Grunnlinje: ${ut.filer.length} adresser, ${Object.keys(ut.sider).length} sider.`);
  process.exit(0);
}

// ---- Lokal server som oppfører seg som GitHub Pages ----
const TYPER = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webp': 'image/webp', '.avif': 'image/avif' };
function server() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.join(ROT, p);
    if (!f.startsWith(ROT) || p.includes('/_bygg/') || p.includes('/.git')) f = '';
    if (f && fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (f && fs.existsSync(f)) { res.writeHead(200, { 'content-type': TYPER[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f)); return; }
    res.writeHead(404, { 'content-type': TYPER['.html'] }); res.end(fs.readFileSync(path.join(ROT, '404.html')));
  });
}

const g = JSON.parse(fs.readFileSync(GRUNN, 'utf8'));
const srv = server().listen(0);
await new Promise((r) => srv.once('listening', r));
const base = process.env.BASE || `http://localhost:${srv.address().port}`;
const feil = [];
const hent = async (a) => { const r = await fetch(base + a, { redirect: 'manual' }); return { status: r.status, tekst: await r.text() }; };
let ok = 0;

for (const a of g.filer) {
  const r = await hent(a);
  if (r.status !== 200) feil.push(`${a}: status ${r.status}`); else ok++;
}
const ads = await hent('/app-ads.txt');
if (ads.tekst !== g.appAds) feil.push('app-ads.txt er endret');

const nyeAlle = new Set();
const gamleAlle = new Set(Object.values(g.sider).flat());
for (const [a, gamle] of Object.entries(g.sider)) {
  const r = await hent(a);
  if (r.status !== 200) continue; // allerede rapportert
  const nye = butikklenker(r.tekst);
  nye.forEach((u) => nyeAlle.add(u));
  const gamleEH = gamle.filter((u) => EH.test(u)), nyeEH = nye.filter((u) => EH.test(u));
  const ehSide = a.startsWith('/elektrikerhjelpen/');
  if (ehSide && JSON.stringify(gamle) !== JSON.stringify(nye)) feil.push(`${a}: butikklenkene er endret\n   før:  ${gamle.join(' ')}\n   etter: ${nye.join(' ')}`);
  for (const u of gamleEH) if (!nye.includes(u)) feil.push(`${a}: mangler Elektrikerhjelpen-lenken ${u}`);
  if (/^\/[a-z-]+\/$/.test(a) && a !== '/apper/') for (const u of gamle) if (!nye.includes(u)) feil.push(`${a}: appsiden mangler butikklenken ${u}`);
  for (const u of nye) if (!gamleAlle.has(u)) feil.push(`${a}: ny eller endret butikklenke ${u}`);
  if (nyeEH.some((u) => !gamleAlle.has(u))) feil.push(`${a}: Elektrikerhjelpen-lenke som ikke fantes før`);
}
// Forsiden skal fortsatt ha begge nedlastingslenkene til Elektrikerhjelpen.
const forside = butikklenker((await hent('/')).tekst);
for (const u of [...gamleAlle].filter((u) => EH.test(u))) if (!forside.includes(u)) feil.push(`/: mangler ${u}`);

const ukjent = await hent('/finnes-ikke-' + Date.now() + '/');
if (ukjent.status !== 404 || !ukjent.tekst.includes('href="/"')) feil.push(`ukjent adresse: status ${ukjent.status} eller mangler lenke til forsiden`);

srv.close();
console.log(`${ok}/${g.filer.length} gamle adresser svarer 200. Butikklenker sjekket på ${Object.keys(g.sider).length} sider.`);
console.log('Elektrikerhjelpen-lenker før:', [...gamleAlle].filter((u) => EH.test(u)).join(' '));
console.log('Elektrikerhjelpen-lenker nå: ', [...nyeAlle].filter((u) => EH.test(u)).join(' '));
if (feil.length) { console.error(`\n${feil.length} FEIL:\n- ` + feil.join('\n- ')); process.exit(1); }
console.log('Alt i orden.');
