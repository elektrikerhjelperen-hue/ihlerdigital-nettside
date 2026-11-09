// Geometritest for samleskinna og avgreiningene.
// Kjør: python3 -m http.server 8175 (i repoet), så  node _bygg/test-skinner.mjs [http://localhost:8175]
// Sett PLAYWRIGHT_DIR til en mappe med node_modules/playwright hvis den ikke ligger i npx-mellomlageret.
//
// Sjekker på alle sidetyper, sju bredder, lys og mørk:
//  1. Ingen av de fem skinnene har avbrudd fra toppen av skinnefeltet til tittelfeltet (ekte piksler).
//     PE må også synes på bakgrunn der gult forsvinner: da må konturen på begge sider være synlig.
//  2. Båndene ligger kant i kant, uten sprekker.
//  3. Hver prikk sitter på sin egen skinne, og ingen prikk rører nabo-skinne eller nabo-avgreining.
//  4. Samme pikselsjekk med tegne-animasjonen på, rullet helt ned (slutten av siden).
import { createRequire } from 'module';
import { readdirSync } from 'fs';

const hjem = process.env.HOME;
const npx = `${hjem}/.npm/_npx/`;
const kandidater = [process.env.PLAYWRIGHT_DIR, process.cwd(), ...readdirSync(npx).map((d) => npx + d)].filter(Boolean);
let chromium;
for (const k of kandidater) {
  try { ({ chromium } = createRequire(k + '/node_modules/')('playwright')); break; } catch {}
}
if (!chromium) throw new Error('Fant ikke playwright. Sett PLAYWRIGHT_DIR.');

const base = process.argv[2] || 'http://localhost:8175';
const SIDER = ['/', '/apper/', '/404.html'];
for (const a of ['elektrikerhjelpen', 'garasjen', 'handlelista', 'totallylegit', 'trollminetycoon', 'block-kingdom']) SIDER.push(`/${a}/`);
for (const a of ['elektrikerhjelpen', 'garasjen', 'totallylegit', 'trollminetycoon', 'block-kingdom']) SIDER.push(`/${a}/personvern/`);
const BREDDER = [320, 360, 390, 430, 768, 1024, 1440];
const MODUS = ['light', 'dark'];

// Kjører i nettleseren: finner skinnene og geometrifeil.
function maal() {
  const r = getComputedStyle(document.documentElement);
  const tall = (n) => parseFloat(r.getPropertyValue(n));
  const [L, s, w, kant] = ['--L', '--s', '--w', '--kant'].map(tall);
  const y0 = scrollY, felt = [...document.querySelectorAll('.skinnefelt>*')];
  const baand = felt.map((e) => { const q = e.getBoundingClientRect(); return { top: q.top + y0, bunn: q.bottom + y0 }; });
  const feil = [];
  baand.forEach((b, i) => { if (i && b.top - baand[i - 1].bunn > -0.99) feil.push(`sprekk mellom bånd ${i - 1} og ${i}: ${baand[i - 1].bunn} → ${b.top}`); });
  const tf = document.querySelector('.tittelfelt');
  if (tf) { const t = tf.getBoundingClientRect().top + y0, b = baand[baand.length - 1].bunn; if (Math.abs(t - b) > 3.01) feil.push(`skinne slutter ${t - b}px før tittelfeltet`); }
  let antall = 0;
  document.querySelectorAll('.tilkobling').forEach((t, n) => {
    const leder = +getComputedStyle(t.parentElement.closest('[data-leder]')).getPropertyValue('--i') || 0;
    [...t.children].forEach((i, k) => {
      antall++;
      const egen = [leder, 3, 4][k], q = i.getBoundingClientRect();
      const senter = q.left + q.width / 2 - q.width / 2 + w / 2; // venstre kant + halv lederbredde
      const skinne = L + s * egen + w / 2;
      if (Math.abs(senter - skinne) > 0.51) feil.push(`avgreining ${n}/${k}: prikk x=${senter}, egen skinne x=${skinne}`);
      const d = parseFloat(getComputedStyle(i, '::before').width);
      if (d / 2 + w / 2 >= s) feil.push(`avgreining ${n}/${k}: prikk (${d}px) rører nabo-skinne (s=${s})`);
      const p = tall('--p');
      if (d / 2 + w / 2 > p) feil.push(`avgreining ${n}/${k}: prikk rører nabo-avgreining (p=${p})`);
      const b = i.closest('.skinnefelt>*').getBoundingClientRect();
      if (q.top < b.top || q.bottom > b.bottom) feil.push(`avgreining ${n}/${k} stikker ut av båndet`);
      if (q.width <= 0) feil.push(`avgreining ${n}/${k} har ingen lengde`);
    });
  });
  return { L, s, w, kant, y: baand[0].top, bunn: baand[baand.length - 1].bunn, feil, antall };
}

// Kjører i en egen, tom side: leser skjermbildet og finner brudd.
async function piksler({ data, m, skala, fra, til, offsetY }) {
  const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + data)).blob());
  const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bm, 0, 0);
  const px = (x, y) => g.getImageData(Math.round(x * skala), y, 1, 1).data;
  const lik = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 40;
  const feil = [];
  const top = Math.max(0, Math.ceil((fra - offsetY) * skala)), bunn = Math.min(bm.height, Math.floor((til - offsetY) * skala));
  for (let k = 0; k < 5; k++) {
    const x = m.L + m.s * k + m.w / 2 - 0.5 / skala;
    let run = 0, start = 0, verst = 0, sted = 0;
    for (let y = top; y < bunn; y++) {
      const bg = px(Math.max(0, m.L - 3), y), p = px(x, y);
      let brudd = lik(p, bg);
      if (brudd && k === 4) { // PE i samme farge som bakgrunnen: konturen må holde lederen synlig
        const v = px(m.L + m.s * 4 - 1, y), h = px(m.L + m.s * 4 + m.w, y);
        brudd = lik(v, bg) || lik(h, bg);
      }
      if (brudd) { if (!run) start = y; run++; if (run > verst) { verst = run; sted = start; } } else run = 0;
    }
    if (verst) feil.push(`skinne ${['L1', 'L2', 'L3', 'N', 'PE'][k]}: brudd ${verst / skala}px ved y=${Math.round(sted / skala + offsetY)}`);
  }
  return feil;
}

const b = await chromium.launch();
const tom = await (await b.newContext()).newPage();
await tom.goto('about:blank');
const alleFeil = [];
let sider = 0, avgreininger = 0;
const jobb = [];
for (const sti of SIDER) for (const w of BREDDER) for (const sc of MODUS) jobb.push({ sti, w, sc });

async function en({ sti, w, sc }, bevegelse) {
  const navn = `${sti} ${w}px ${sc}${bevegelse ? ' animert' : ''}`;
  const ctx = await b.newContext({ viewport: { width: w, height: 800 }, colorScheme: sc, reducedMotion: bevegelse ? 'no-preference' : 'reduce' });
  const p = await ctx.newPage();
  try {
    for (let f = 0; ; f++) { try { await p.goto(base + sti, { waitUntil: 'load' }); break; } catch (e) { if (f > 3) throw e; await p.waitForTimeout(300); } }
    await p.evaluate(() => document.fonts.ready);
    // Telefonrekkene kan rulles sideveis: de skal ikke legge seg over skinnene.
    await p.evaluate(() => document.querySelectorAll('.rekke').forEach((e) => { e.style.scrollSnapType = 'none'; e.scrollLeft = 400; }));
    let skudd, offsetY = 0;
    if (bevegelse) {
      await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await p.waitForTimeout(2600);
      offsetY = await p.evaluate(() => scrollY);
      skudd = await p.screenshot({ type: 'png' });
    } else {
      skudd = await p.screenshot({ type: 'png', fullPage: true });
    }
    // Måles etter skjermbildet: skriftene kan endre høyden på siden til de er lastet.
    const m = await p.evaluate(maal);
    m.feil.forEach((f) => alleFeil.push(`${navn}: ${f}`));
    const fra = Math.max(m.y, offsetY), til = m.bunn;
    const f = await tom.evaluate(piksler, { data: skudd.toString('base64'), m, skala: 1, fra, til, offsetY });
    f.forEach((x) => alleFeil.push(`${navn}: ${x}`));
    sider++; avgreininger += bevegelse ? 0 : m.antall;
  } catch (e) { alleFeil.push(`${navn}: ${e.message}`); } finally { await ctx.close(); }
}

async function kjor(liste, bev) {
  let i = 0;
  await Promise.all([...Array(4)].map(async () => { while (i < liste.length) { await en(liste[i++], bev); } }));
}
await kjor(jobb, false);
await kjor(jobb.filter((j) => [390, 1440].includes(j.w)), true);
await b.close();

console.log(`${sider} sidevisninger, ${avgreininger} avgreininger, ${alleFeil.length} feil`);
const gruppert = new Map();
for (const f of alleFeil) { const nokkel = f.replace(/^\S+ \d+px \S+( animert)?: /, '').replace(/[\d.]+/g, '#'); gruppert.set(nokkel, [(gruppert.get(nokkel)?.[0] ?? 0) + 1, f]); }
for (const [, [n, f]] of gruppert) console.log(`  ×${n}  ${f}`);
process.exit(alleFeil.length ? 1 : 0);
