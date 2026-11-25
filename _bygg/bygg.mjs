#!/usr/bin/env node
// Bygger alle sidene. Kjør fra hvor som helst: node _bygg/bygg.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { firma, apper } from './data.mjs';
import { fjell, MERKE, TRINN, trinnSvg, SNITT } from './tegninger.mjs';

const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const les = (p) => fs.readFileSync(path.join(ROT, p), 'utf8');
const skriv = (p, s) => { fs.mkdirSync(path.dirname(path.join(ROT, p)), { recursive: true }); fs.writeFileSync(path.join(ROT, p), s); };
const finnes = (p) => fs.existsSync(path.join(ROT, p));
const mal = JSON.parse(les('_bygg/bildemal.json'));
const e = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const a = Object.fromEntries(apper.map((x) => [x.slug, x]));
const EH = a.elektrikerhjelpen, PM = a.prosjektmappa;
const post = (emne) => `mailto:${firma.epost}?subject=${encodeURIComponent(emne)}`;

// Sider som bare har personvern (ingen egen appside i data.mjs).
const BARE_PERSONVERN = [{ slug: 'matplanlegger', navn: 'Matplanlegger', nr: '801' }];

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
<a class="merke" href="/" aria-label="Ihler Digital, til forsiden">${MERKE}Ihler Digital</a>
<nav aria-label="Hovedmeny"><a href="/elektrikerhjelpen/">Elektrikerhjelpen</a><a href="/#prosjektmappa">Prosjektmappa</a><a href="/#kontakt">Kontakt</a></nav>
</header>
`;

const iso = new Date().toISOString().slice(0, 10);
const FOT = (tegn = 'ID-001') => `<footer class="tittelfelt">
<div class="tf-merke"><span class="tf-navn">Ihler Digital</span><span class="mono">Planlegging og dokumentasjon for fagfolk</span></div>
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
<div><dt>Andre apper</dt><dd><a href="/apper/">Alle apper og personvern</a></dd></div>
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
const telefon = (ap, i, sizes, lazy, ekstra = '') => `<figure class="telefon ${ekstra}"><div class="ramme">${bilde(ap.slug, ap.bilder[i][0], ap.bilder[i][1], sizes, lazy)}</div><figcaption class="maalstrek"><span>${ap.bilder[i][2]}</span></figcaption></figure>`;
const ikon = (ap, s) => `<picture class="ikon"><source type="image/avif" srcset="/ikoner/${ap.slug}-128.avif 1x,/ikoner/${ap.slug}-320.avif 2x"><img src="/ikoner/${ap.slug}-320.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async"></picture>`;
const storeKnapper = (ap) => ap.store ? `<a class="knapp" href="${ap.store}">Hent i App Store</a>${ap.play ? `<a class="knapp" href="${ap.play}">Hent på Google Play</a>` : ''}` : `<span class="merkelapp">${ap.kommer ? 'Kommer' : 'Under arbeid'}</span>`;
const navnH = (ap) => ap.deler.map((x) => `<span>${x}</span>`).join(' ');
// Akse: boble i venstre marg, som aksene på en byggtegning.
const akse = (bokstav) => `<span class="akse" aria-hidden="true">${bokstav}</span>`;
const abonnement = (ap) => ap.abonnement ? `<dl class="abo">${ap.abonnement.map(([n, t]) => `<div><dt>${n}</dt><dd>${t}</dd></div>`).join('')}</dl>` : '';

// ---- Forsiden ---------------------------------------------------------------
const PRINSIPP = [
  ['Det skal stemme', 'Beregningene bygger på norm og oppgitt kilde, for eksempel NEK 400. Er noe veiledende, står det.'],
  ['Ett svar, og hvorfor', 'Verktøyene gir ett svar og viser hvordan det er regnet ut. Det meste virker uten konto.'],
  ['Dataene er dine', 'Ingen reklame og ingen analyseverktøy i Elektrikerhjelpen. Vi selger ingenting om deg.'],
  ['Vi svarer selv', 'E-post til oss leses av dem som lager appene.'],
];
const punktliste = (punkter) => `<ol class="hva-liste">${punkter.map(([t, x], i) => `<li data-nr="${String(i + 1).padStart(2, '0')}"><h3>${t}</h3><p>${x}</p></li>`).join('')}</ol>`;
const ehBilder = [0, 4, 5, 3]; // romkart, kabelberegning, kursfortegnelse, downlights

const forside = HODE({ tittel: 'Ihler Digital – planlegging og dokumentasjon for fagfolk', beskrivelse: 'Ihler Digital lager apper for fagfolk som planlegger og dokumenterer bygg: romkart, mål og plassering, fra skanning til ferdig dokumentasjon. Ål i Hallingdal.', klasse: 'hjem' }) + `<main id="innhold">
<section class="helt" aria-labelledby="h1">
<div class="helt-tekst">
<p class="mono">Tegn.nr ID-001 · Ål i Hallingdal</p>
<h1 id="h1">Rom for rom.</h1>
<p class="helt-ingress">Ihler Digital lager apper for fagfolk som planlegger og dokumenterer bygg. Romkart, mål og plassering, fra skanning til ferdig dokumentasjon, for elektriker, tømrer, rørlegger og byggeplass.</p>
<p class="helt-valg"><a class="knapp" href="#elektrikerhjelpen">Elektrikerhjelpen</a><a class="les" href="#prosjektmappa">Prosjektmappa kommer<span aria-hidden="true"> ↓</span></a></p>
</div>
<figure class="fjell" aria-label="Hallingskarvet tegnet som snitt med høydekurver">
${fjell(true)}
${fjell(false)}
<figcaption class="mono">Snitt A–A · Hallingskarvet · skjematisk</figcaption>
</figure>
</section>
<div class="ark">
<section class="innrykk plan" id="plan" aria-labelledby="h-plan">
<h2 class="mellom" id="h-plan">${akse('A')}Fra skanning til dokumentasjon</h2>
<p class="ingress">Samme rom, fire trinn. Elektriker, tømrer og rørlegger trenger det samme: riktige mål, og at alle vet hva som ligger hvor. Elektrikerhjelpen gjør dette for elektrikere i dag.</p>
<ol class="trinn">
${TRINN.map(([nr, t, x, f]) => `<li><figure>${trinnSvg(f, `${t}: ${x}`)}</figure><p class="trinn-nr mono">${nr} · ${t}</p><p>${x}</p></li>`).join('\n')}
</ol>
<p class="mono trinn-fot">Detalj 1–4 · leilighet 2B · 1:50 · ikke målriktig</p>
</section>
<section class="kurs el" id="elektrikerhjelpen" aria-labelledby="h-eh">
<div class="innrykk">
<p class="baand-hode">${akse('B')}<span class="mono">I App Store og på Google Play</span></p>
<h2 class="kjempe" id="h-eh">${navnH(EH)}</h2>
<div class="kurs-kropp">
<div class="kurs-tekst">
<p class="ingress">Kalkulatorer, oppslag og dokumentasjon for elektrikere. Romkart, kabelberegning etter NEK 400, kursfortegnelse og koblingsskjema som PDF.</p>
<p class="handling">${storeKnapper(EH)}</p>
<p class="pris mono">${EH.pris}</p>
${abonnement(EH)}
<p class="handling"><a class="les" href="/elektrikerhjelpen/">Les mer om Elektrikerhjelpen<span aria-hidden="true"> →</span></a></p>
</div>
<div class="stabel stabel-4">${ehBilder.map((i) => telefon(EH, i, '(min-width: 900px) 15vw, 46vw', true)).join('')}</div>
</div>
</div>
</section>
<section class="innrykk prosjektert" id="prosjektmappa" aria-labelledby="h-pm">
<div class="prosjektert-ramme">
<p class="baand-hode">${akse('C')}<span class="mono revisjon">Prosjektert · ikke bygget ennå</span></p>
<h2 class="kjempe" id="h-pm">${navnH(PM)}</h2>
<div class="pm-kropp">
<div>
<p class="ingress">Ett felles prosjekt for alle fagene på samme bygg.</p>
<p>Elektriker, rørlegger, tømrer og byggeplassen jobber i de samme plantegningene og kartene, hver med sitt. Bedriften bestemmer hvem som er med, og hvilken rolle de har.</p>
<p>Prosjektmappa er under arbeid. Vil du ha beskjed når den er klar? Send oss en e-post.</p>
<p class="handling"><a class="knapp" href="${post('Prosjektmappa – meld interesse')}">Meld interesse</a><span class="mono">E-post til ${firma.epost}</span></p>
</div>
<figure>${SNITT}<figcaption class="mono">Stiplet: prosjektert, ikke utført</figcaption></figure>
</div>
</div>
</section>
<section class="innrykk bedrift" id="bedrift" aria-labelledby="h-bedrift">
<h2 class="mellom" id="h-bedrift">${akse('D')}For bedrifter</h2>
<div class="to-spalter">
<p class="ingress">Firmalisens kommer. Pris og dato er ikke satt ennå.</p>
<div>
<p>Har du et firma med flere fagfolk, og vil vite mer om lisens eller hvordan appene passer inn hos dere? Skriv til oss, så får dere beskjed når den er klar.</p>
<p class="handling"><a class="knapp" href="${post('Firmalisens')}">Spør om firmalisens</a></p>
</div>
</div>
</section>
<section class="innrykk oss" id="oss" aria-labelledby="h-oss">
<h2 class="mellom" id="h-oss">${akse('E')}Om Ihler Digital</h2>
<div class="to-spalter">
<div>
<p class="ingress">Vi lager programvare for dem som planlegger, bygger og dokumenterer.</p>
<p>Vi holder til i Ål i Hallingdal og har elektrofaget i huset. Tall og regler i appene sjekkes mot normen eller kilden de kommer fra.</p>
<p>Ihler Digital drives i dag av ${firma.selskap}, org.nr ${firma.orgnr}. Navneendring til Ihler Digital AS pågår.</p>
</div>
${punktliste(PRINSIPP)}
</div>
</section>
<section class="innrykk kontakt" id="kontakt" aria-labelledby="h-kontakt">
<h2 class="mellom" id="h-kontakt">${akse('F')}Kontakt</h2>
<p class="ingress">Spørsmål om en app, eller en feil du har funnet? Skriv til oss.</p>
<p><a class="knapp" href="mailto:${firma.epost}">${firma.epost}</a></p>
</section>
</div>
</main>
` + FOT();
skriv('index.html', forside);

// ---- Alle apper (lite synlig, bare fra footeren) ------------------------------
const harPersonvern = (slug) => finnes(`${slug}/personvern/index.html`);
const alle = [...apper.map((x) => ({ slug: x.slug, navn: x.navn, side: true, store: x.store, play: x.play, status: x.kommer ? 'Kommer' : x.underArbeid ? 'Under arbeid' : x.play ? 'App Store og Google Play' : 'App Store' })), ...BARE_PERSONVERN.map((x) => ({ ...x, side: false, status: 'App Store' }))]
  .sort((x, y) => (x.slug === 'elektrikerhjelpen' ? -1 : y.slug === 'elektrikerhjelpen' ? 1 : x.navn.localeCompare(y.navn, 'nb')));
skriv('apper/index.html', HODE({ tittel: 'Alle apper – Ihler Digital', beskrivelse: 'Oversikt over alle appene fra Ihler Digital, med støtte og personvern.', klasse: 'dok' }) + `<main id="innhold"><div class="ark">
<section class="innrykk apper-hode" aria-labelledby="h1">
<p class="sti mono"><a href="/">Ihler Digital</a> / Alle apper</p>
<h1 class="mellom" id="h1">${akse('A')}Alle apper</h1>
<p>Støtte og personvern for alle appene fra Ihler Digital.</p>
</section>
<section class="innrykk fortegnelse" aria-label="Appene">
<table>
<thead><tr><th scope="col">App</th><th scope="col">Status</th><th scope="col">Lenker</th></tr></thead>
<tbody>
${alle.map((x) => `<tr><th scope="row">${x.side ? `<a href="/${x.slug}/">${x.navn}</a>` : x.navn}</th><td class="mono">${x.status}</td><td class="lenker">${x.side ? `<a href="/${x.slug}/#stotte">Støtte</a>` : `<a href="mailto:${firma.epost}">Støtte</a>`}${harPersonvern(x.slug) ? `<a href="/${x.slug}/personvern/">Personvern</a>` : ''}${x.store ? `<a href="${x.store}">App Store</a>` : ''}${x.play ? `<a href="${x.play}">Google Play</a>` : ''}</td></tr>`).join('\n')}
</tbody></table>
</section>
</div></main>
` + FOT('ID-002'));

// ---- Appsider -----------------------------------------------------------------
function hentArtikkel(html) {
  const m = html.match(/<article([^>]*)>([\s\S]*?)<\/article>/);
  if (!m) throw new Error('fant ikke <article>');
  return { attr: m[1], kropp: m[2].trim() };
}
function stotte(ap) {
  const f = `_bygg/stotte/${ap.slug}.html`;
  if (!finnes(f)) return { attr: '', kropp: '' };
  const r = les(f); const m = r.match(/^<!--attr:(.*?)-->\n/);
  return { attr: m ? m[1] : '', kropp: r.replace(/^<!--attr:.*?-->\n/, '').trim() };
}
const stotteSeksjon = (ap) => {
  const st = stotte(ap);
  return `<section class="innrykk stotte" id="stotte" aria-labelledby="h-st"><h2 class="mellom" id="h-st">${akse('C')}Støtte</h2><div class="tekst"${st.attr}>${st.kropp || `<p>Spørsmål eller ønsker? Send e-post til <a href="mailto:${firma.epost}">${firma.epost}</a>.</p>`}</div></section>`;
};
const underlenker = (ap) => `<section class="innrykk underlenker"><nav aria-label="${ap.navn}">${harPersonvern(ap.slug) ? `<a href="/${ap.slug}/personvern/">Personvern</a>` : ''}${ap.store ? `<a href="${ap.store}">App Store</a>` : ''}${ap.play ? `<a href="${ap.play}">Google Play</a>` : ''}<a href="/">Ihler Digital</a></nav></section>`;
const sti = (ap) => `<p class="sti mono"><a href="/">Ihler Digital</a> / ${ap.slug === 'elektrikerhjelpen' || ap.kommer ? '' : '<a href="/apper/">Alle apper</a> / '}${ap.navn}</p>`;

function appside(ap) {
  const klar = !ap.underArbeid;
  return HODE({ tittel: `${ap.navn} – ${ap.tittel} – Ihler Digital`, beskrivelse: ap.kort + (klar ? ` Støtte og personvern for ${ap.navn}.` : ''), klasse: `appside t-${ap.tema}` }) + `<main id="innhold"><div class="ark">
<section class="apphelt kurs ${ap.tema}" aria-labelledby="h1">
<div class="innrykk">
${sti(ap)}
<p class="baand-hode">${akse('A')}<span class="mono">${ap.gruppe} fra Ihler Digital</span></p>
${ikon(ap, 112)}
<h1 class="kjempe" id="h1">${navnH(ap)}</h1>
<p class="ingress">${ap.ingress}</p>
<p class="handling">${storeKnapper(ap)}</p>
<p class="pris mono">${ap.pris}</p>
${abonnement(ap)}
</div>
<div class="rekke" tabindex="0" role="group" aria-label="Skjermbilder">${ap.bilder.map((_, i) => telefon(ap, i, '(min-width: 900px) 300px, 62vw', i > 1)).join('')}</div>
</section>
<section class="innrykk hva" aria-labelledby="h-hva">
<h2 class="mellom" id="h-hva">${akse('B')}${ap.tittel}</h2>
<ol class="hva-liste">${ap.hva.map(([t, x], i) => `<li data-nr="${String(i + 1).padStart(2, '0')}"><h3>${t}</h3><p>${x}</p></li>`).join('')}</ol>
<div class="hvem"><h2>Hvem den er for</h2><p class="ingress">${ap.hvem}</p></div>
</section>
${stotteSeksjon(ap)}
<section class="innrykk avsender" aria-labelledby="h-avs"><h2 class="mellom" id="h-avs">${akse('D')}Laget av Ihler Digital</h2><p>Vi utvikler og vedlikeholder ${ap.navn} selv, fra Ål i Hallingdal.</p><p class="handling"><a class="les" href="/#oss">Om selskapet<span aria-hidden="true"> →</span></a></p></section>
${underlenker(ap)}
</div></main>
` + FOT(`ID-${ap.kurs.slice(1)}00`);
}

// Prosjektmappa: bare konseptet til den er klar.
function kommerSide(ap) {
  return HODE({ tittel: `${ap.navn} – kommer – Ihler Digital`, beskrivelse: ap.kort, klasse: 'appside' }) + `<main id="innhold"><div class="ark">
<section class="innrykk prosjektert apphelt-kommer" aria-labelledby="h1">
${sti(ap)}
<div class="prosjektert-ramme">
<p class="baand-hode">${akse('A')}<span class="mono revisjon">Prosjektert · ikke bygget ennå</span></p>
<h1 class="kjempe" id="h1">${navnH(ap)}</h1>
<div class="pm-kropp">
<div>
<p class="ingress">${ap.ingress}</p>
<p>For elektriker, rørlegger, tømrer og alle andre som er på samme bygg. Appen er under arbeid og ikke i App Store ennå.</p>
<p class="handling"><a class="knapp" href="${post('Prosjektmappa – meld interesse')}">Meld interesse</a><span class="mono">E-post til ${firma.epost}</span></p>
</div>
<figure>${SNITT}<figcaption class="mono">Stiplet: prosjektert, ikke utført</figcaption></figure>
</div>
</div>
</section>
${stotteSeksjon(ap).replace(akse('C'), akse('B'))}
${underlenker(ap)}
</div></main>
` + FOT(`ID-${ap.kurs.slice(1)}00`);
}

function personvernside({ slug, navn, nr }) {
  const fil = `${slug}/personvern/index.html`;
  const gml = les(fil);
  const { attr: raattAttr, kropp } = hentArtikkel(gml);
  const attr = raattAttr.replace(/\s*class="[^"]*"/g, '');
  const tittel = gml.match(/<title>([\s\S]*?)<\/title>/)[1];
  const beskr = gml.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const dek = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  const appLenke = finnes(`${slug}/index.html`) ? `<a href="/${slug}/">${navn}</a>` : navn;
  return HODE({ tittel: dek(tittel), beskrivelse: dek(beskr), klasse: 'dok' }) + `<main id="innhold"><div class="ark"><div class="innrykk dok-hode">
<p class="sti mono"><a href="/">Ihler Digital</a> / ${appLenke} / Personvern</p>
</div>
<article class="innrykk tekst"${attr}>
${kropp}
</article>
</div></main>
` + FOT(`ID-${nr}`);
}
for (const ap of apper) {
  skriv(`${ap.slug}/index.html`, ap.kommer ? kommerSide(ap) : appside(ap));
  if (harPersonvern(ap.slug)) skriv(`${ap.slug}/personvern/index.html`, personvernside({ slug: ap.slug, navn: ap.navn, nr: `${ap.kurs.slice(1)}01` }));
}
for (const x of BARE_PERSONVERN) skriv(`${x.slug}/personvern/index.html`, personvernside(x));

// ---- 404 ----------------------------------------------------------------------
skriv('404.html', HODE({ tittel: 'Fant ikke siden – Ihler Digital', beskrivelse: 'Siden finnes ikke.', klasse: 'dok' }) + `<main id="innhold"><div class="ark"><section class="innrykk brudd">
<p class="sti mono">Feilkode 404</p>
<h1 class="kjempe">Ikke på tegningen</h1>
<p class="ingress">Adressen går ikke fram til noe her. Kanskje den er flyttet.</p>
<p class="handling"><a class="knapp" href="/">Til forsiden</a><a class="les" href="/apper/">Alle apper og personvern</a></p>
</section></div></main>
` + FOT('ID-404'));
console.log('Bygget', apper.length + BARE_PERSONVERN.length, 'apper');

// ---- Git-vakt: ingenting fra NEK 400 / Montørhåndboka på nettsiden (sjekkes også av pre-push) ----
const vakt = path.join(os.homedir(), 'Morgenbrief/git-vakt/sjekk.sh');
if (fs.existsSync(vakt)) {
  const r = spawnSync(vakt, [ROT], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('Ikke publiser: rett funnene over først.'); process.exit(1); }
}
