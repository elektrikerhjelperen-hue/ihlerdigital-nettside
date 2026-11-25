// Tegningene på nettsiden, som inline SVG. Alt er skjematisk og ikke målriktig.
// Farger settes i style.css (klassene t-*), så lys og mørk modus følger med.

// ---- Hallingskarvet: profil (snitt) med høydekurver under --------------------
const PROFIL_STOR = [[3000,392],[2240,392],[2080,290],[1990,330],[1840,170],[1720,330],[1560,340],[1460,240],[1400,70],[1350,46],[1260,38],[1170,12],[1080,50],[960,44],[880,58],[820,84],[770,200],[690,226],[600,312],[400,342],[250,356],[130,362],[0,362]];
const PROFIL_LITEN = [[900,212],[470,212],[400,196],[372,100],[346,88],[300,82],[262,44],[220,74],[150,76],[118,160],[74,190],[0,196]];
const d = (p) => 'M' + p.map((q) => q.map((v) => +v.toFixed(1)).join(' ')).join('L');
// Kurvene under profilen: samme rygg, presset sammen mot dalbunnen. Leses som terreng i snitt og som koter på kart.
function kurver(p, n, bunn, steg) {
  const ut = [];
  for (let k = 1; k <= n; k++) {
    const f = 1 - k * steg;
    ut.push(d(p.map(([x, y]) => [x, bunn - (bunn - y) * f])));
  }
  return ut;
}
export function fjell(stor) {
  const p = stor ? PROFIL_STOR : PROFIL_LITEN;
  const bunn = stor ? 520 : 300;
  const k = kurver(p, stor ? 6 : 4, bunn, stor ? 0.13 : 0.19);
  const w = stor ? 2400 : 900, h = bunn;
  const kurveSvg = k.map((x, i) => `<path class="t-kote" style="--d:${700 + i * 120}ms" d="${x}"/>`).join('');
  const maal = stor
    ? `<g class="t-maal t-inn" style="--d:1500ms"><path d="M1170 4V-34M1162 -26H1300"/><text x="1180" y="-40">Folarskardnuten +1933</text><path class="t-kote-pil" d="M1164 -6L1170 4L1176 -6Z"/>
<path d="M2240 392V430M2240 422H2380"/><text x="2250" y="446">Ål +440</text>
<text class="t-snitt" x="60" y="470">Snitt A–A · Hallingskarvet · skjematisk</text></g>`
    : `<g class="t-maal t-inn" style="--d:1500ms"><path d="M262 44V0M256 6H400"/><text x="268" y="-4">Folarskardnuten +1933</text><path d="M470 212V240M470 234H540"/><text x="476" y="230">Ål +440</text></g>`;
  return `<svg class="fjell-${stor ? 'stor' : 'liten'}" width="${w}" height="${h + (stor ? 60 : 10)}" viewBox="0 ${stor ? -60 : -24} ${stor ? w : 560} ${h + (stor ? 60 : 24)}" aria-hidden="true">
${kurveSvg}<path class="t-profil" pathLength="1" d="${d(p)}"/>${maal}</svg>`;
}

// ---- Merket i toppen: en liten Hallingskarvet-profil --------------------------
export const MERKE = '<svg class="merke-fjell" viewBox="0 0 44 18" width="44" height="18" aria-hidden="true"><path d="M0 16H7L10 10L13 9.5L15 4L17 3L20 1.5L23 4L26 4.5L28 8L31 13H44"/><path class="merke-kote" d="M4 17.5H9L12 13L15 12.5L17 8.5L20 7L23 8.5L26 9L28 12L30 15.5H40"/></svg>';

// ---- Plantegningen: én leilighet i fire trinn ---------------------------------
// Rom: bad (30–100 × 30–95), gang (30–100 × 95–160), stue (100–210 × 30–160). 1 enhet = 30 mm.
const VEGG_UTE = 'M30 30H130M180 30H210V160H77M55 160H30V30';
const VEGG_INNE = 'M100 30V115M100 137V160M30 95H50M72 95H100';
const DORER = '<path class="t-tynn" d="M72 95V117M50 95A22 22 0 0 0 72 117M100 137H122M100 115A22 22 0 0 1 122 137M77 160V138M55 160A22 22 0 0 1 77 138"/>';
const VINDU = '<path class="t-tynn" d="M130 27H180M130 30H180M130 33H180M130 26V34M180 26V34"/>';
const vegger = (klasse = '') => `<path class="t-vegg-ute ${klasse}" d="${VEGG_UTE}"/><path class="t-vegg-inne ${klasse}" d="${VEGG_INNE}"/>${DORER}${VINDU}`;
const maalLinje = (x1, y1, x2, y2, tekst, side = -1) => {
  const vann = y1 === y2;
  const t = vann ? `<text x="${(x1 + x2) / 2}" y="${y1 + side * 4}" text-anchor="middle">${tekst}</text>` : `<text x="${x1 + side * 4}" y="${(y1 + y2) / 2}" text-anchor="middle" transform="rotate(-90 ${x1 + side * 4} ${(y1 + y2) / 2})">${tekst}</text>`;
  const kryss = (x, y) => `M${x - 3} ${y + 3}L${x + 3} ${y - 3}`;
  return `<path d="M${x1} ${y1}${vann ? 'H' + x2 : 'V' + y2}${kryss(x1, y1)}${kryss(x2, y2)}"/>${t}`;
};
const rom = (x, y, navn, m2) => `<text class="t-rom" x="${x}" y="${y}" text-anchor="middle">${navn}</text><text class="t-areal" x="${x}" y="${y + 10}" text-anchor="middle">${m2}</text>`;

function skann() {
  // Punktsky: prikker langs veggene, og telefonen som skanner.
  return `<path class="t-punkt" d="${VEGG_UTE}M100 30V160M30 95H100"/>
<g class="t-tlf"><rect x="150" y="104" width="16" height="28" rx="3"/><path class="t-straale" d="M158 104L128 62M158 104L190 62"/><path class="t-straale t-bue" d="M131 66Q158 54 187 66"/></g>`;
}
function maal() {
  return `${vegger()}<g class="t-maal">${maalLinje(30, 14, 100, 14, '2100')}${maalLinje(100, 14, 210, 14, '3300')}${maalLinje(14, 30, 14, 95, '1950')}${maalLinje(14, 95, 14, 160, '1950')}${maalLinje(30, 176, 210, 176, '5400', 1.6)}</g>
${rom(65, 63, 'Bad', '4,1 m²')}${rom(65, 128, 'Gang', '4,1 m²')}${rom(155, 82, 'Stue', '12,9 m²')}`;
}
function fag() {
  // Tre fag i samme tegning: tømrer (ny vegg, skravert), rør (blå), el (symboler i blekk).
  const stikk = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-4 0A4 4 0 0 1 4 0Z"/><path d="M0 0V5"/></g>`;
  const lys = (x, y) => `<g transform="translate(${x} ${y})"><circle r="4"/><path d="M-2.8 -2.8L2.8 2.8M-2.8 2.8L2.8 -2.8"/></g>`;
  return `<defs><pattern id="skravur" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V4" stroke="currentColor" stroke-width="1"/></pattern></defs>${vegger('t-dempet')}
<rect class="t-skravur" x="97" y="30" width="6" height="85"/>
<g class="t-ror"><path d="M36 40H60V52"/><path class="t-ror-vv" d="M36 44H56V52"/><rect x="52" y="52" width="16" height="10" rx="2"/><path d="M36 82H44" /><circle cx="48" cy="82" r="4"/></g>
<g class="t-el">${stikk(150, 156, 180)}${stikk(206, 100, -90)}${stikk(104, 60, 90)}${lys(135, 65)}${lys(175, 65)}${lys(135, 115)}${lys(175, 115)}${stikk(85, 98, 0)}</g>
<g class="t-forklaring"><path class="t-tegn-el" d="M30 186H42"/><text x="46" y="189">El</text><path class="t-tegn-ror" d="M80 186H92"/><text x="96" y="189">Rør</text><rect class="t-skravur" x="134" y="182" width="12" height="7"/><text x="150" y="189">Tømrer</text></g>`;
}
function dok() {
  // Ferdig dokumentasjon: et ark med planen i liten skala og tittelfelt.
  return `<rect class="t-ark" x="52" y="6" width="136" height="188"/>
<g transform="translate(64 20) scale(.62)">${vegger()}<g class="t-el"><circle cx="135" cy="65" r="4"/><circle cx="175" cy="65" r="4"/><circle cx="135" cy="115" r="4"/><circle cx="175" cy="115" r="4"/></g><g class="t-ror"><path d="M36 40H60V52"/></g></g>
<g class="t-tf"><path d="M52 150H188M52 166H188M52 180H188M120 150V194M154 166V194"/><text x="57" y="161">Leilighet 2B</text><text x="57" y="176">Ihler Digital</text><text x="124" y="176">Rev. A</text><text x="158" y="176">1:50</text><text x="57" y="190">Tegn.nr 001</text><text x="124" y="190">3 fag</text></g>
<path class="t-stempel" d="M150 128h28v14h-28z"/><text class="t-stempel-t" x="164" y="138" text-anchor="middle">PDF</text>`;
}
export const TRINN = [
  ['01', 'Skann', 'Rommet skannes med telefonen, eller tegnes for hånd med mål.', skann],
  ['02', 'Mål', 'Vegger, dører og vinduer får mål. Rom for rom, etasje for etasje.', maal],
  ['03', 'Fag', 'Stikk, lys, rør og vegger legges inn der de skal være.', fag],
  ['04', 'Dokumentasjon', 'Det ferdige blir en PDF med mål og plassering, klar til kunden.', dok],
];
export const trinnSvg = (f, tittel) => `<svg viewBox="0 0 240 200" role="img" aria-label="${tittel.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${f()}</svg>`;

// ---- Prosjektmappa: snitt av et bygg, stiplet fordi det ikke er bygget ennå ----------
const bjelker = Array.from({ length: 10 }, (_, i) => `M${76 + i * 19} 132h8v8h-8z`).join('');
const stendere = [60, 262].map((x) => `M${x} 186V84M${x + 8} 186V84`).join('');
export const SNITT = `<svg class="snitt" viewBox="0 0 340 236" role="img" aria-label="Snitt av et hus i to etasjer, stiplet fordi det ikke er bygget ennå.">
<path class="t-terreng" d="M0 186H340"/><path class="t-skravur-linje" d="M6 202l10-8M26 202l10-8M46 202l10-8M286 202l10-8M306 202l10-8M326 202l10-8M6 194l10-8M26 194l10-8M286 194l10-8M306 194l10-8"/>
<g class="t-prosjektert"><path d="M54 186V200H276V186M48 88L165 26L282 88M60 84H270"/></g>
<g class="t-tre"><path d="${stendere}"/><path d="${bjelker}"/><path d="M68 140H262M68 132H262"/><path d="M70 84L165 34L260 84M110 84L130 60M220 84L200 60M165 34V84"/></g>
<g class="t-vent"><path d="M90 76H240M240 76V98"/></g>
<g class="t-ror"><path d="M212 186V100M212 160H236M212 114H236"/></g>
<g class="t-el-linje"><path d="M112 186V96"/><circle cx="112" cy="164" r="3.5"/><circle cx="112" cy="116" r="3.5"/></g>
<g class="t-maal"><path d="M296 186H316M296 136H316M296 84H316M300 186l-4-6h8zM300 136l-4-6h8zM300 84l-4-6h8z"/><text x="306" y="180">±0</text><text x="306" y="130">+2,7</text><text x="306" y="78">+5,4</text></g>
<g class="t-forklaring"><path class="t-tre-tegn" d="M4 222H16"/><text x="20" y="226">Tre</text><path class="t-el-linje" d="M58 222H70"/><text x="74" y="226">El</text><path class="t-ror" d="M102 222H114"/><text x="118" y="226">Rør</text><path class="t-vent" d="M150 222H162"/><text x="166" y="226">Vent.</text><text x="262" y="226">Snitt B–B</text></g>
</svg>`;
