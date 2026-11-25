#!/usr/bin/env node
// Sidetest i Chrome: ingen vannrett rulling, alle bilder har alt, ingen ødelagte bilder/lenker til egne filer,
// og kontrast for tekst (WCAG AA) på alle sider, fem bredder, lys og mørk.
//   node _bygg/test-sider.mjs [mappe-for-skjermbilder]
// Trenger playwright-core (sett PLAYWRIGHT_DIR til mappa med node_modules) og Google Chrome.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { start } from './server.mjs';

const kand = [process.env.PLAYWRIGHT_DIR, '/tmp/pw660', process.cwd()].filter(Boolean);
let chromium;
for (const k of kand) { try { ({ chromium } = createRequire(k + '/node_modules/')('playwright-core')); break; } catch {} }
if (!chromium) throw new Error('Fant ikke playwright-core. Sett PLAYWRIGHT_DIR.');

const ut = process.argv[2];
const SIDER = Object.keys(JSON.parse(fs.readFileSync(new URL('./lenker-grunnlinje.json', import.meta.url), 'utf8')).sider);
const BREDDER = [320, 390, 768, 1024, 1440];
const BILDER = { '/': 'forside', '/elektrikerhjelpen/': 'elektrikerhjelpen', '/prosjektmappa/': 'prosjektmappa', '/apper/': 'alle-apper', '/404.html': '404' };

const { srv, base } = await start();
const nett = await chromium.launch({ channel: 'chrome' });
const feil = [];
for (const modus of ['light', 'dark']) {
  for (const b of BREDDER) {
    const side = await nett.newPage({ viewport: { width: b, height: b < 800 ? 844 : 900 }, colorScheme: modus, reducedMotion: 'reduce', deviceScaleFactor: b < 800 ? 2 : 1 });
    const brudd = [];
    side.on('response', (r) => { if (r.url().startsWith(base) && r.status() >= 400 && !r.url().includes('finnes-ikke')) brudd.push(`${r.status()} ${r.url()}`); });
    for (const s of SIDER) {
      await side.goto(base + s, { waitUntil: 'networkidle' });
      await side.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); await document.fonts.ready; });
      const r = await side.evaluate(() => {
        const f = [];
        if (document.documentElement.scrollWidth > innerWidth + 1) f.push(`vannrett rulling: ${document.documentElement.scrollWidth} > ${innerWidth}`);
        for (const i of document.images) { if (!i.hasAttribute('alt')) f.push('bilde uten alt: ' + i.src); if (i.complete && i.naturalWidth === 0) f.push('ødelagt bilde: ' + i.src); }
        // Kontrast: synlig tekst mot første ugjennomsiktige bakgrunn oppover.
        const rgb = (s) => { const m = s.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0]; return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
        const lum = ({ r, g, b }) => { const c = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
        const bak = (e) => { for (; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.a > 0.5) return c; } return rgb(getComputedStyle(document.body).backgroundColor); };
        const sett = new Set();
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n; (n = w.nextNode());) {
          const e = n.parentElement; if (!n.textContent.trim() || sett.has(e) || e.closest('svg')) continue; sett.add(e);
          const cs = getComputedStyle(e); const q = e.getBoundingClientRect();
          if (cs.visibility === 'hidden' || q.width === 0 || cs.opacity === '0' || e.closest('.hopp')) continue;
          const fg = rgb(cs.color), bg = bak(e);
          const L1 = lum(fg), L2 = lum(bg), k = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
          const px = parseFloat(cs.fontSize), stor = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
          if (k < (stor ? 3 : 4.5)) f.push(`kontrast ${k.toFixed(2)} «${n.textContent.trim().slice(0, 30)}» ${cs.color} på ${bg.r},${bg.g},${bg.b}`);
        }
        return f;
      });
      r.forEach((x) => feil.push(`${modus} ${b}px ${s}: ${x}`));
      if (ut && BILDER[s] && [390, 1440].includes(b)) {
        fs.mkdirSync(ut, { recursive: true });
        await side.screenshot({ path: `${ut}/${BILDER[s]}-${b < 800 ? 'mobil' : 'pc'}-${modus === 'light' ? 'lys' : 'mork'}.png`, fullPage: true });
      }
    }
    brudd.forEach((x) => feil.push(`${modus} ${b}px: ${x}`));
    await side.close();
  }
}
await nett.close(); srv.close();
const unike = [...new Set(feil)];
if (unike.length) { console.error(`${unike.length} FEIL:\n- ` + unike.slice(0, 80).join('\n- ')); process.exit(1); }
console.log(`OK: ${SIDER.length} sider × ${BREDDER.length} bredder × lys/mørk.`);
