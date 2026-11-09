#!/usr/bin/env node
// Bygger alle sidene. Kjør fra hvor som helst: node _bygg/bygg.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { firma, apper } from './data.mjs';

const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const les = (p) => fs.readFileSync(path.join(ROT, p), 'utf8');
const skriv = (p, s) => { fs.mkdirSync(path.dirname(path.join(ROT, p)), { recursive: true }); fs.writeFileSync(path.join(ROT, p), s); };
const finnes = (p) => fs.existsSync(path.join(ROT, p));
const mal = JSON.parse(les('_bygg/bildemal.json'));
const e = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// ---- Lederne: en polylinje forskjøvet parallelt ---------------------------
function forskyv(p, d) {
  return p.map((q, i) => {
    const a = p[Math.max(i - 1, 0)], b = p[Math.min(i + 1, p.length - 1)];
    const n = (u, v) => { const x = v[0] - u[0], y = v[1] - u[1], l = Math.hypot(x, y) || 1; return [y / l, -x / l]; };
    const n1 = n(a, q), n2 = n(q, b);
    let mx = n1[0] + n2[0], my = n1[1] + n2[1];
    const l = Math.hypot(mx, my) || 1; mx /= l; my /= l;
    const m = Math.min(d / Math.max(mx * n1[0] + my * n1[1], 0.35), Math.abs(d) * 2.5) * (d < 0 ? -1 : 1);
    const mm = d === 0 ? 0 : Math.abs(m) * Math.sign(d);
    return [+(q[0] + mx * mm).toFixed(1), +(q[1] + my * mm).toFixed(1)];
  });
}
const sti = (p) => 'M' + p.map((q) => q.join(' ')).join('L');
function ledere(punkter, s) {
  const farger = ['l1', 'l2', 'l3', 'n'];
  let ut = '';
  farger.forEach((f, i) => { ut += `<path class="leder ${f}" style="--d:${i * 90}ms" pathLength="1" d="${sti(forskyv(punkter, i * s))}"/>`; });
  const pe = sti(forskyv(punkter, 4 * s));
  return ut + `<path class="leder pe" style="--d:360ms" pathLength="1" d="${pe}"/><path class="pe-gul" d="${pe}"/>`;
}
const PROFIL_STOR = [[3000,372],[2240,372],[2080,300],[1990,330],[1840,232],[1720,328],[1530,342],[1420,286],[1362,132],[1320,112],[1236,102],[1160,62],[1080,92],[930,84],[800,100],[728,94],[660,170],[596,182],[510,296],[400,322],[250,340],[130,352],[37.5,352],[37.5,520]];
const PROFIL_LITEN = [[900,212],[470,212],[400,196],[372,110],[346,98],[300,92],[262,60],[220,84],[150,86],[118,160],[74,190],[11.5,196],[11.5,300]];

// ---- Felles deler ----------------------------------------------------------
const HODE = (o) => `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(o.tittel)}</title>
<meta name="description" content="${e(o.beskrivelse)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#e7e8e3">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#101214">
<meta property="og:title" content="${e(o.tittel)}">
<meta property="og:description" content="${e(o.beskrivelse)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="nb_NO">
<meta property="og:image" content="https://ihlerdigital.no/og.jpg">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonter/bigshoulders.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonter/schibsted.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
</head>
<body class="${o.klasse || ''}">
<a class="hopp" href="#innhold">Hopp til innholdet</a>
<header class="topp">
<a class="merke" href="/" aria-label="Ihler Digital, til forsiden"><span class="merke-leder" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>Ihler Digital</a>
<nav aria-label="Hovedmeny"><a href="/#apper">Apper</a><a href="/#oss">Om oss</a><a href="mailto:${firma.epost}">Kontakt</a></nav>
</header>
`;

const iso = new Date().toISOString().slice(0, 10);
const FOT = () => `<footer class="tittelfelt">
<div class="tf-merke"><span class="tf-navn">Ihler Digital</span><span class="mono">Apper fra Ål i Hallingdal</span></div>
<dl class="tf-felt">
<div><dt>Selskap</dt><dd>${firma.selskap}</dd></div>
<div><dt>Org.nr</dt><dd>${firma.orgnr}</dd></div>
<div class="tf-brei"><dt>Merknad</dt><dd>${firma.merknad}</dd></div>
<div><dt>Tegnet av</dt><dd>${firma.tegnetAv}</dd></div>
<div><dt>Sted</dt><dd>${firma.sted}</dd></div>
<div class="tf-brei"><dt>Kontakt</dt><dd><a href="mailto:${firma.epost}">${firma.epost}</a></dd></div>
<div><dt>Rev.</dt><dd>${iso.split('-').reverse().join('.')}</dd></div>
<div><dt>Ark</dt><dd>1 av 1</dd></div>
</dl>
</footer>
</body>
</html>
`;

function bilde(slug, navn, alt, sizes, lazy = true) {
  const r = mal[slug][navn];
  const b = (x) => `/bilder/${slug}/${navn}-360.${x} 360w,/bilder/${slug}/${navn}-720.${x} 720w`;
  return `<picture><source type="image/avif" srcset="${b('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${b('webp')}" sizes="${sizes}"><img src="/bilder/${slug}/${navn}-720.webp" alt="${e(alt)}" width="720" height="${Math.round(720 * r)}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}></picture>`;
}
const telefon = (a, i, sizes, lazy, ekstra = '') => `<figure class="telefon ${ekstra}">${bilde(a.slug, a.bilder[i][0], a.bilder[i][1], sizes, lazy)}</figure>`;
const ikon = (a, s) => `<picture class="ikon"><source type="image/avif" srcset="/ikoner/${a.slug}-128.avif 1x,/ikoner/${a.slug}-320.avif 2x"><img src="/ikoner/${a.slug}-320.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async"></picture>`;
const TILKOBLING = (a) => `<span class="tilkobling" style="--i:${a.leder}" data-leder="${a.leder}" aria-hidden="true"></span>`;
const storeKnapp = (a, t = 'Hent i App Store') => a.store ? `<a class="knapp" href="${a.store}">${t}<span aria-hidden="true"> →</span></a>` : `<span class="merkelapp">Under arbeid</span>`;
const navnH = (a) => a.deler.map((d) => `<span>${d}</span>`).join(' ');
const maal = (a) => `<dl class="maal">${a.maal.map(([v, t]) => `<div><dd>${v}</dd><dt>${t}</dt></div>`).join('')}</dl>`;

// ---- Forsiden ---------------------------------------------------------------
const fortegnelse = () => `<section class="fortegnelse innrykk" id="apper" aria-labelledby="kf">
<div class="seksjonshode"><h2 id="kf">Kursfortegnelse</h2><p class="mono">Seks kurser. Tre for jobben, tre for fritida.</p></div>
<table>
<thead><tr><th scope="col">Kurs</th><th scope="col">Navn</th><th scope="col" class="skjul-smal">Belastning</th><th scope="col">Status</th></tr></thead>
<tbody>
${apper.map((a) => `<tr><td class="mono">${a.kurs}</td><th scope="row"><a href="/${a.slug}/">${ikon(a, 40)}<span>${a.navn}</span></a></th><td class="skjul-smal">${a.gruppe}</td><td class="mono">${a.underArbeid ? 'Under arbeid' : 'I App Store'}</td></tr>`).join('\n')}
</tbody></table>
</section>`;

function kursBand(a, stil) {
  const lenke = `<p class="handling"><a class="les" href="/${a.slug}/">Les om ${a.navn}<span aria-hidden="true"> →</span></a>${storeKnapp(a)}</p>`;
  const sizes = stil === 'stor' ? '(min-width: 900px) 24vw, 46vw' : '(min-width: 900px) 18vw, 42vw';
  const antall = stil === 'stor' ? 3 : 2;
  const tels = Array.from({ length: antall }, (_, i) => telefon(a, i, sizes, true)).join('');
  return `<section class="kurs ${a.tema} kurs-${stil}" aria-labelledby="h-${a.slug}">
${TILKOBLING(a)}
<div class="innrykk">
<p class="kursnr mono">${a.kurs} · ${a.gruppe}</p>
<h2 class="kjempe" id="h-${a.slug}">${navnH(a)}</h2>
<div class="kurs-kropp">
<div class="kurs-tekst"><p class="ingress">${a.ingress}</p>${maal(a)}${lenke}</div>
<div class="stabel stabel-${antall}">${tels}</div>
</div>
</div>
</section>`;
}
function benk(a) {
  return `<section class="kurs benk ${a.tema}" aria-labelledby="h-${a.slug}">
${TILKOBLING(a)}
<div class="innrykk benk-rad">
<div>
<p class="kursnr mono">${a.kurs} · På arbeidsbenken</p>
<h2 class="mellom" id="h-${a.slug}">${a.navn}</h2>
<p>${a.ingress}</p>
<p class="handling"><a class="les" href="/${a.slug}/">Se hva vi holder på med<span aria-hidden="true"> →</span></a></p>
</div>
${telefon(a, 0, '(min-width: 900px) 220px, 40vw', true)}
</div>
</section>`;
}
const a = Object.fromEntries(apper.map((x) => [x.slug, x]));
const forside = HODE({ tittel: 'Ihler Digital – apper fra Ål i Hallingdal', beskrivelse: 'Verktøy for folk som jobber med hendene, og spill for når dagen er ferdig. Laget av brødrene Kristian og Marius Ihler i Ål i Hallingdal.', klasse: 'hjem' }) + `<main id="innhold">
<section class="helt" aria-labelledby="h1">
<div class="helt-tekst">
<p class="mono">Tegn.nr ID-001 · Ål i Hallingdal</p>
<h1 id="h1">Apper for folk som jobber med hendene.</h1>
<p class="helt-ingress">Vi er brødrene Kristian og Marius Ihler. Kristian er elektriker. Verktøyene er for jobben. Spillene er for når dagen er ferdig.</p>
</div>
<figure class="fjell" aria-label="Fem elektriske ledere tegner profilen av Hallingskarvet">
<svg class="fjell-stor" width="3000" height="520" aria-hidden="true">${ledere(PROFIL_STOR, 10)}
<g class="maalsetting"><path d="M1160 44V8H1188"/><text x="1196" y="14">Folarskardnuten 1933 moh</text><path d="M94 332V306"/><text x="102" y="302">Ål</text></g></svg>
<svg class="fjell-liten" width="900" height="300" aria-hidden="true">${ledere(PROFIL_LITEN, 6)}</svg>
<figcaption class="mono">Hallingskarvet. Skjematisk, ikke målriktig.</figcaption>
</figure>
</section>
<div class="skinnefelt">
${fortegnelse()}
${kursBand(a.elektrikerhjelpen, 'stor')}
${kursBand(a.garasjen, 'stor')}
${benk(a.handlelista)}
<div class="kveld">
<div class="innrykk kveld-hode"><p class="mono">Fra kl. 16.00</p><h2 class="kjempe">Etter arbeidstid</h2><p class="ingress">Ikke alt må være nyttig.</p></div>
${kursBand(a.trollminetycoon, 'liten')}
${kursBand(a.totallylegit, 'liten')}
${benk(a['block-kingdom'])}
</div>
<section class="oss innrykk" id="oss" aria-labelledby="h-oss">
<h2 class="kjempe" id="h-oss">To brødre fra Ål</h2>
<div class="oss-tekst">
<p class="ingress">Ihler Digital er Kristian og Marius Ihler. Vi holder til i Ål i Hallingdal.</p>
<p>Kristian er elektriker, så vi vet hvordan det er å trenge et svar når du står på en stige. Det er derfor verktøyene våre gir ett tydelig svar, og derfor det meste virker uten konto.</p>
<p>Har du funnet en feil, eller savner du noe? Send en e-post. Det er oss som leser den.</p>
<p><a class="knapp" href="mailto:${firma.epost}">${firma.epost}</a></p>
</div>
</section>
</div>
</main>
` + FOT();
skriv('index.html', forside);

// ---- Appsider -----------------------------------------------------------------
function hentArtikkel(html) {
  const m = html.match(/<article([^>]*)>([\s\S]*?)<\/article>/);
  if (!m) throw new Error('fant ikke <article>');
  return { attr: m[1], kropp: m[2].trim() };
}
const stotteFil = (s) => `_bygg/stotte/${s}.html`;
function stotte(ap) {
  const f = stotteFil(ap.slug);
  if (!finnes(f)) {
    if (!finnes(`${ap.slug}/index.html`) || !les(`${ap.slug}/index.html`).includes('<article')) return { attr: '', kropp: '' };
    // Engangsflytting fra den gamle støttesiden: dropp h1, senk overskriftene ett nivå.
    const { attr, kropp } = hentArtikkel(les(`${ap.slug}/index.html`));
    const ny = kropp.replace(/<h1>[\s\S]*?<\/h1>\s*/, '').replace(/<(\/?)h3>/g, '<$1h4>').replace(/<(\/?)h2>/g, '<$1h3>');
    skriv(f, `<!--attr:${attr}-->\n${ny}\n`);
  }
  const r = les(f); const m = r.match(/^<!--attr:(.*?)-->\n/);
  return { attr: m ? m[1] : '', kropp: r.replace(/^<!--attr:.*?-->\n/, '').trim() };
}
const harPersonvern = (ap) => finnes(`${ap.slug}/personvern/index.html`);

function appside(ap) {
  const st = stotte(ap);
  const klar = !ap.underArbeid;
  const hvisKunde = st.kropp ? `<section class="innrykk stotte" id="stotte" aria-labelledby="h-st"><h2 id="h-st">Støtte</h2><div class="tekst"${st.attr}>${st.kropp}</div></section>` : `<section class="innrykk stotte" id="stotte" aria-labelledby="h-st"><h2 id="h-st">Støtte</h2><div class="tekst"><p>Spørsmål eller ønsker? Send e-post til <a href="mailto:${firma.epost}">${firma.epost}</a>.</p></div></section>`;
  return HODE({ tittel: `${ap.navn} – ${ap.tittel} – Ihler Digital`, beskrivelse: ap.kort + (klar ? ` Støtte og personvern for ${ap.navn}.` : ''), klasse: `appside t-${ap.tema}` }) + `<main id="innhold"><div class="skinnefelt">
<section class="apphelt ${ap.tema}" aria-labelledby="h1">
${TILKOBLING(ap)}
<div class="innrykk">
<p class="kursnr mono"><a href="/#apper">Kursfortegnelse</a> / ${ap.kurs} · ${ap.gruppe}</p>
${ikon(ap, 112)}
<h1 class="kjempe" id="h1">${navnH(ap)}</h1>
<p class="ingress">${ap.ingress}</p>
<p class="handling">${storeKnapp(ap)}<span class="mono pris">${ap.pris}</span></p>
</div>
<div class="rekke" tabindex="0" role="group" aria-label="Skjermbilder">${ap.bilder.map((_, i) => telefon(ap, i, '(min-width: 900px) 300px, 62vw', i > 1)).join('')}</div>
</section>
<section class="innrykk hva" aria-labelledby="h-hva">
<h2 class="kjempe" id="h-hva">${ap.tittel}</h2>
${maal(ap)}
<ol class="hva-liste">${ap.hva.map(([t, x]) => `<li><h3>${t}</h3><p>${x}</p></li>`).join('')}</ol>
<div class="hvem"><h2>Hvem den er for</h2><p class="ingress">${ap.hvem}</p></div>
</section>
${hvisKunde}
<section class="innrykk underlenker"><nav aria-label="${ap.navn}">${harPersonvern(ap) ? `<a href="/${ap.slug}/personvern/">Personvern</a>` : ''}${ap.store ? `<a href="${ap.store}">App Store</a>` : ''}<a href="/#apper">Alle appene</a></nav></section>
</div></main>
` + FOT();
}
function personvernside(ap) {
  const fil = `${ap.slug}/personvern/index.html`;
  const gml = les(fil);
  const { attr, kropp } = hentArtikkel(gml);
  const tittel = gml.match(/<title>([\s\S]*?)<\/title>/)[1];
  const beskr = gml.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const dek = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  return HODE({ tittel: dek(tittel), beskrivelse: dek(beskr), klasse: 'dok' }) + `<main id="innhold"><div class="skinnefelt"><div class="innrykk dok-hode">
<p class="kursnr mono"><a href="/${ap.slug}/">${ap.navn}</a> / Personvern</p>
</div>
<article class="innrykk tekst"${attr}>
${kropp}
</article>
</div></main>
` + FOT();
}
for (const ap of apper) {
  skriv(`${ap.slug}/index.html`, appside(ap));
  if (harPersonvern(ap)) skriv(`${ap.slug}/personvern/index.html`, personvernside(ap));
}

// ---- 404 ----------------------------------------------------------------------
skriv('404.html', HODE({ tittel: 'Fant ikke siden – Ihler Digital', beskrivelse: 'Siden finnes ikke.', klasse: 'dok' }) + `<main id="innhold"><div class="skinnefelt"><section class="innrykk brudd">
<p class="kursnr mono">Feilkode 404</p>
<h1 class="kjempe">Brudd på kursen</h1>
<p class="ingress">Adressen går ikke fram til noe her. Kanskje den er flyttet.</p>
<p><a class="knapp" href="/">Til forsiden</a></p>
</section></div></main>
` + FOT());
console.log('Bygget', apper.length, 'apper');
