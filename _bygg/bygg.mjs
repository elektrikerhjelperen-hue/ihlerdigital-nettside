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
const TEGN_JS = les('_bygg/tegn.js').trim();
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
const PROFIL_STOR = [[3000,392],[2240,392],[2080,290],[1990,330],[1840,170],[1720,330],[1560,340],[1460,240],[1400,70],[1350,46],[1260,38],[1170,12],[1080,50],[960,44],[880,58],[820,84],[770,200],[690,226],[600,312],[400,342],[250,356],[130,362],[38,362],[38,560]];
const PROFIL_LITEN = [[900,212],[470,212],[400,196],[372,100],[346,88],[300,82],[262,44],[220,74],[150,76],[118,160],[74,190],[11,196],[11,300]];

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
<script>if(matchMedia('(prefers-reduced-motion:no-preference)').matches)document.documentElement.classList.add('tegn')</script>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonter/bigshoulders.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonter/schibsted.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
</head>
<body class="${o.klasse || ''}">
<a class="hopp" href="#innhold">Hopp til innholdet</a>
<header class="topp">
<a class="merke" href="/" aria-label="Ihler Digital, til forsiden"><span class="merke-leder" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>Ihler Digital</a>
<nav aria-label="Hovedmeny"><a href="/#oss">Om oss</a><a href="/apper/">Apper</a><a href="/#kontakt">Kontakt</a></nav>
</header>
`;

const iso = new Date().toISOString().slice(0, 10);
const FOT = (tegn = "ID-001") => `<footer class="tittelfelt"><span class="jord" aria-hidden="true"></span>
<div class="tf-merke"><span class="tf-navn">Ihler Digital</span><span class="mono">Programvare fra Ål i Hallingdal</span></div>
<dl class="tf-felt">
<div><dt>Selskap</dt><dd>${firma.selskap}</dd></div>
<div><dt>Org.nr</dt><dd>${firma.orgnr}</dd></div>
<div class="tf-brei"><dt>Merknad</dt><dd>${firma.merknad}</dd></div>
<div><dt>Tegnet av</dt><dd>${firma.tegnetAv}</dd></div>
<div><dt>Sted</dt><dd>${firma.sted}</dd></div>
<div class="tf-brei"><dt>Kontakt</dt><dd><a href="mailto:${firma.epost}">${firma.epost}</a></dd></div>
<div><dt>Tegn.nr</dt><dd>${tegn}</dd></div>
<div><dt>Målestokk</dt><dd>Ikke målriktig</dd></div>
<div><dt>Rev.</dt><dd>${iso.split('-').reverse().join('.')}</dd></div>
</dl>
</footer>
<script>${TEGN_JS}</script>
</body>
</html>
`;

function bilde(slug, navn, alt, sizes, lazy = true) {
  const r = mal[slug][navn];
  const b = (x) => `/bilder/${slug}/${navn}-360.${x} 360w,/bilder/${slug}/${navn}-720.${x} 720w`;
  return `<picture><source type="image/avif" srcset="${b('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${b('webp')}" sizes="${sizes}"><img src="/bilder/${slug}/${navn}-720.webp" alt="${e(alt)}" width="720" height="${Math.round(720 * r)}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}></picture>`;
}
const telefon = (a, i, sizes, lazy, ekstra = '') => `<figure class="telefon ${ekstra}"><div class="ramme">${bilde(a.slug, a.bilder[i][0], a.bilder[i][1], sizes, lazy)}</div><figcaption class="maalstrek"><span>${a.bilder[i][2]}</span></figcaption></figure>`;
const KOBLING = '<span class="tilkobling" aria-hidden="true"><i></i><i></i><i></i></span>';
const uttak = (i) => `data-leder="${i}" style="--i:${i}"`;
const kursLinje = (a, tekst) => `<p class="kursnr" ${uttak(a.leder)}>${KOBLING}<b>${a.kurs}</b> <span class="mono">${tekst}</span></p>`;
const ikon = (a, s) => `<picture class="ikon"><source type="image/avif" srcset="/ikoner/${a.slug}-128.avif 1x,/ikoner/${a.slug}-320.avif 2x"><img src="/ikoner/${a.slug}-320.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async"></picture>`;
const storeKnapp = (a, t = 'Hent i App Store') => a.store ? `<a class="knapp" href="${a.store}">${t}</a>` : `<span class="merkelapp">Under arbeid</span>`;
const navnH = (a) => a.deler.map((d) => `<span>${d}</span>`).join(' ');

// ---- Deler til forsiden og appoversikten ---------------------------------------
const VERKTOY = apper.filter((x) => x.gruppe === 'Verktøy');
const SPILL = apper.filter((x) => x.gruppe === 'Spill');
const a = Object.fromEntries(apper.map((x) => [x.slug, x]));

const fortegnelse = (liste, o) => `<section class="fortegnelse innrykk ${o.klasse || ''}" id="${o.id}" aria-labelledby="h-${o.id}">
<div class="seksjonshode"><h2 class="uttak" ${uttak(o.leder ?? 0)} id="h-${o.id}">${KOBLING}${o.tittel}</h2><p class="mono">${o.undertekst}</p></div>
<table>
<thead><tr><th scope="col">Kurs</th><th scope="col">Navn</th><th scope="col" class="skjul-smal">For hvem</th><th scope="col">Status</th></tr></thead>
<tbody>
${liste.map((x) => `<tr><td class="mono rad-kurs" ${uttak(x.leder)}>${KOBLING}${x.kurs}</td><th scope="row"><a href="/${x.slug}/">${ikon(x, 40)}<span>${x.navn}</span></a></th><td class="skjul-smal">${x.gaarTil}</td><td class="mono">${x.underArbeid ? 'Under arbeid' : 'I App Store'}</td></tr>`).join('\n')}
</tbody></table>
${o.etter || ''}
</section>`;

function kursBand(x) {
  const lenke = `<p class="handling"><a class="les" href="/${x.slug}/">Les om ${x.navn}<span aria-hidden="true"> →</span></a>${storeKnapp(x)}</p>`;
  const antall = x.tema === 'el' ? 4 : 3;
  const sizes = x.tema === 'el' ? '(min-width: 900px) 22vw, 46vw' : '(min-width: 900px) 24vw, 46vw';
  return `<section class="kurs ${x.tema}" aria-labelledby="h-${x.slug}">
<div class="innrykk">
${kursLinje(x, x.gruppe)}
<h3 class="kjempe" id="h-${x.slug}">${navnH(x)}</h3>
<div class="kurs-kropp"><div class="kurs-tekst"><p class="ingress">${x.ingress}</p>${lenke}</div>
<div class="stabel stabel-${antall}">${Array.from({ length: antall }, (_, i) => telefon(x, i, sizes, true)).join('')}</div>
</div>
</div>
</section>`;
}
function benk(x) {
  return `<section class="kurs benk ${x.tema}" aria-labelledby="h-${x.slug}">
<div class="innrykk benk-rad">
<div>
${kursLinje(x, 'Under arbeid')}
<h3 class="mellom" id="h-${x.slug}">${x.navn}</h3>
<p>${x.ingress}</p>
<p class="handling"><a class="les" href="/${x.slug}/">Se hva vi holder på med<span aria-hidden="true"> →</span></a></p>
</div>
${telefon(x, 0, '(min-width: 900px) 220px, 40vw', true)}
</div>
</section>`;
}
const punktliste = (kode, punkter) => `<ol class="hva-liste">${punkter.map(([t, x], i) => `<li data-nr="${kode}.${i + 1}"><h3>${t}</h3><p>${x}</p></li>`).join('')}</ol>`;

// ---- Forsiden ---------------------------------------------------------------
const STAR_FOR = [
  ['Det skal stemme', 'Beregninger følger norm og kilde, for eksempel NEK 400. Er noe veiledende, står det tydelig.'],
  ['Rett på sak', 'Verktøyene gir ett svar og viser hvorfor. Det meste virker uten konto.'],
  ['Dataene er dine', 'Elektrikerhjelpen og Garasjen har ingen reklame og ingen sporing. Det du legger inn, ligger hos deg.'],
  ['Vi svarer selv', 'Skriver du til oss, er det de som lager appene som leser det.'],
];
const SLIK = [
  ['Vi starter i oppgaven', 'Utgangspunktet er jobben slik den faktisk gjøres, ikke en liste over funksjoner.'],
  ['Vi sjekker mot kilden', 'Tall og regler kontrolleres mot normen eller kilden de kommer fra.'],
  ['Vi tester på ekte telefoner', 'Nye versjoner prøves på ekte telefoner før de slippes.'],
  ['Vi følger opp', 'Feil og ønsker kommer rett til oss, og går inn i arbeidet med neste versjon.'],
];
const forside = HODE({ tittel: 'Ihler Digital – programvare fra Ål i Hallingdal', beskrivelse: 'Ihler Digital er et norsk selskap som utvikler apper og digitale verktøy, med elektrofaget i bunnen. Ål i Hallingdal.', klasse: 'hjem' }) + `<main id="innhold">
<section class="helt" aria-labelledby="h1">
<div class="helt-tekst">
<p class="mono">Tegn.nr ID-001 · Ål i Hallingdal</p>
<h1 id="h1">Programvare som må stemme.</h1>
<p class="helt-ingress">Ihler Digital er et norsk selskap som utvikler apper og digitale verktøy, med elektrofaget i bunnen.</p>
<p class="helt-valg"><a class="knapp" href="#kontakt">Ta kontakt</a><a class="les" href="#oss">Hvem vi er<span aria-hidden="true"> ↓</span></a></p>
</div>
<figure class="fjell" aria-label="Fem elektriske ledere tegner profilen av Hallingskarvet">
<svg class="fjell-stor" width="3000" height="520" aria-hidden="true">${ledere(PROFIL_STOR, 12)}
<g class="maalsetting"><path d="M1170 2V-30H1198"/><text x="1206" y="-30">Folarskardnuten 1933 moh</text><text x="1206" y="-12">Skjematisk, ikke målriktig</text><path d="M94 342V316"/><text x="102" y="312">Ål</text></g></svg>
<svg class="fjell-liten" width="900" height="300" aria-hidden="true">${ledere(PROFIL_LITEN, 5)}</svg>
<figcaption class="mono">Hallingskarvet. Skjematisk, ikke målriktig.</figcaption>
</figure>
</section>
<div class="skinnefelt">
<section class="oss innrykk" id="oss" aria-labelledby="h-oss">
<h2 class="kjempe uttak" ${uttak(0)} id="h-oss">${KOBLING}Hvem vi er</h2>
<div class="oss-tekst">
<p class="ingress">Vi lager programvare for folk som trenger at den virker: på byggeplassen, i garasjen og hjemme.</p>
<p>Vi holder til i Ål i Hallingdal og har elektrofaget i huset. Det preger måten vi jobber på: kontroll, mål og dokumentasjon skal henge sammen.</p>
<p>Ihler Digital drives i dag av ${firma.selskap}, org.nr ${firma.orgnr}. Navneendring til Ihler Digital AS pågår.</p>
</div>
</section>
<section class="innrykk hva prinsipper" aria-labelledby="h-prinsipp">
<h2 class="mellom uttak" ${uttak(1)} id="h-prinsipp">${KOBLING}Hva vi står for</h2>
${punktliste('P', STAR_FOR)}
</section>
<section class="innrykk hva hl" aria-labelledby="h-slik">
<h2 class="mellom uttak" ${uttak(2)} id="h-slik">${KOBLING}Slik jobber vi</h2>
${punktliste('A', SLIK)}
</section>
${fortegnelse(VERKTOY, { id: 'apper', tittel: 'Verktøy', undertekst: 'Det vi har laget for jobb og hverdag.', etter: '<p class="fortegnelse-etter"><a class="les" href="/apper/">Se alle appene<span aria-hidden="true"> →</span></a></p>' })}
<section class="kurs el kontakt" id="kontakt" aria-labelledby="h-kontakt">
<div class="innrykk">
<h2 class="kjempe uttak" ${uttak(1)} id="h-kontakt">${KOBLING}Ta kontakt</h2>
<p class="ingress">Driver du elektrikerbedrift, vil du samarbeide, eller har du spørsmål om en av appene? Skriv til oss.</p>
<p><a class="knapp" href="mailto:${firma.epost}">${firma.epost}</a></p>
</div>
</section>
<p class="innrykk spill-linje">Vi lager også noen spill. <a class="les" href="/apper/#spill">Se dem under Apper<span aria-hidden="true"> →</span></a></p>
</div>
</main>
` + FOT();
skriv('index.html', forside);

// ---- Apper --------------------------------------------------------------------
skriv('apper/index.html', HODE({ tittel: 'Apper – Ihler Digital', beskrivelse: 'Verktøy og spill fra Ihler Digital: Elektrikerhjelpen, Garasjen og Handlelista, og noen spill ved siden av.', klasse: 'hjem' }) + `<main id="innhold"><div class="skinnefelt">
<section class="innrykk apper-hode" aria-labelledby="h1">
<p class="sti mono"><a href="/">Ihler Digital</a> / Apper</p>
<h1 class="kjempe uttak" ${uttak(0)} id="h1">${KOBLING}Apper</h1>
<p class="ingress">Verktøy for jobb og hverdag. Lenger ned finner du også noen spill.</p>
</section>
<section class="innrykk gruppehode" id="verktoy" aria-labelledby="h-verktoy">
<h2 class="uttak" ${uttak(1)} id="h-verktoy">${KOBLING}Verktøy</h2>
</section>
${kursBand(a.elektrikerhjelpen)}
${kursBand(a.garasjen)}
${benk(a.handlelista)}
${fortegnelse(SPILL, { id: 'spill', leder: 2, klasse: 'spill', tittel: 'Spill', undertekst: 'Noe vi lager ved siden av verktøyene.' })}
</div></main>
` + FOT('ID-002'));

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
<div class="innrykk">
<p class="sti mono"><a href="/">Ihler Digital</a> / <a href="/apper/">Apper</a> / ${ap.gruppe}</p>
${kursLinje(ap, `${ap.gruppe} fra Ihler Digital`)}
${ikon(ap, 112)}
<h1 class="kjempe" id="h1">${navnH(ap)}</h1>
<p class="ingress">${ap.ingress}</p>
<p class="handling">${storeKnapp(ap)}<span class="mono pris">${ap.pris}</span></p>
</div>
<div class="rekke" tabindex="0" role="group" aria-label="Skjermbilder">${ap.bilder.map((_, i) => telefon(ap, i, '(min-width: 900px) 300px, 62vw', i > 1)).join('')}</div>
</section>
<section class="innrykk hva" aria-labelledby="h-hva">
<h2 class="mellom" id="h-hva">${ap.tittel}</h2>
<ol class="hva-liste">${ap.hva.map(([t, x], i) => `<li data-nr="${ap.kurs}.${i + 1}"><h3>${t}</h3><p>${x}</p></li>`).join('')}</ol>
<div class="hvem"><h2>Kursen går til</h2><p class="ingress">${ap.hvem}</p></div>
</section>
${hvisKunde}
<section class="innrykk avsender" aria-labelledby="h-avs"><h2 class="mellom" id="h-avs">${ap.navn} er laget av Ihler Digital</h2><p>Vi utvikler og vedlikeholder appen selv, fra Ål i Hallingdal.</p><p class="handling"><a class="les" href="/#oss">Om selskapet<span aria-hidden="true"> →</span></a></p></section>
<section class="innrykk underlenker"><nav aria-label="${ap.navn}">${harPersonvern(ap) ? `<a href="/${ap.slug}/personvern/">Personvern</a>` : ''}${ap.store ? `<a href="${ap.store}">App Store</a>` : ''}<a href="/apper/">Alle appene</a></nav></section>
</div></main>
` + FOT(`ID-${ap.kurs.slice(1)}00`);
}
function personvernside(ap) {
  const fil = `${ap.slug}/personvern/index.html`;
  const gml = les(fil);
  const { attr: raattAttr, kropp } = hentArtikkel(gml);
  const attr = raattAttr.replace(/\s*class="[^"]*"/g, ''); // klassen settes under
  const tittel = gml.match(/<title>([\s\S]*?)<\/title>/)[1];
  const beskr = gml.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const dek = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  return HODE({ tittel: dek(tittel), beskrivelse: dek(beskr), klasse: 'dok' }) + `<main id="innhold"><div class="skinnefelt"><div class="innrykk dok-hode">
<p class="sti mono"><a href="/">Ihler Digital</a> / <a href="/${ap.slug}/">${ap.navn}</a> / Personvern</p>
</div>
<article class="innrykk tekst"${attr}>
${kropp}
</article>
</div></main>
` + FOT(`ID-${ap.kurs.slice(1)}01`);
}
for (const ap of apper) {
  skriv(`${ap.slug}/index.html`, appside(ap));
  if (harPersonvern(ap)) skriv(`${ap.slug}/personvern/index.html`, personvernside(ap));
}

// ---- 404 ----------------------------------------------------------------------
skriv('404.html', HODE({ tittel: 'Fant ikke siden – Ihler Digital', beskrivelse: 'Siden finnes ikke.', klasse: 'dok' }) + `<main id="innhold"><div class="skinnefelt"><section class="innrykk brudd">
<p class="sti mono">Feilkode 404</p>
<h1 class="kjempe">Brudd på kursen</h1>
<p class="ingress">Adressen går ikke fram til noe her. Kanskje den er flyttet.</p>
<p><a class="knapp" href="/">Til forsiden</a></p>
</section></div></main>
` + FOT('ID-404'));
console.log('Bygget', apper.length, 'apper');
