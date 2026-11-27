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
const NY_VEGG = 'M100 30V115'; // veggen mellom bad/gang og stue, som tømreren setter opp nytt (skravert i felt 03 og 04)
const VEGG_INNE = 'M100 137V160M30 95H50M72 95H100';
// Dører: badet slår ut i gangen (hengsel ved x 50), stua slår inn, ytterdøra slår inn med hengsel ved x 55, så midten av gangen er fri.
const DORER = '<path class="t-tynn" d="M50 95V117M72 95A22 22 0 0 1 50 117M100 137H122M100 115A22 22 0 0 1 122 137M55 160V138M77 160A22 22 0 0 0 55 138"/>';
const VINDU = '<path class="t-tynn" d="M130 27H180M130 30H180M130 33H180M130 26V34M180 26V34"/>';
// nyVegg = false: den nye veggen tegnes ikke som vanlig vegg, fordi den står skravert (ellers blir det dobbelt).
const vegger = (klasse = '', nyVegg = true) => `<path class="t-vegg-ute ${klasse}" d="${VEGG_UTE}"/><path class="t-vegg-inne ${klasse}" d="${nyVegg ? NY_VEGG : ''}${VEGG_INNE}"/>${DORER}${VINDU}`;
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
  return `${vegger()}<g class="t-maal">${maalLinje(30, 14, 100, 14, '2100')}${maalLinje(100, 14, 210, 14, '3300')}${maalLinje(14, 30, 14, 95, '1950')}${maalLinje(14, 95, 14, 160, '1950')}${maalLinje(30, 176, 210, 176, '5400', 3.5)}</g>
${rom(65, 63, 'Bad', '4,1 m²')}${rom(78, 125, 'Gang', '4,1 m²')}${rom(155, 82, 'Stue', '12,9 m²')}`;
}
// Fagsymbolene er tegnet selv, i vanlig norsk tegningsstil. Lokale koordinater: veggflaten ligger ved y = 0,
// symbolet går inn i rommet (y > 0). plass() roterer: r = 0 vegg over rommet, 180 under, 90 til høyre, -90 til venstre.
const STIKK = '<path d="M-6 0H6M-6 0A6 6 0 0 0 6 0M0 0V8.5"/>'; // stikkontakt med jord: halvsirkel med flat side mot veggen, jordstrek ut i rommet
const LAMPE = '<circle r="5"/><path d="M-3.5 -3.5L3.5 3.5M-3.5 3.5L3.5 -3.5"/>'; // lampepunkt/downlight i tak
const BRYTER = '<circle r="2.6"/><path d="M1.8 -1.8L8.5 -8.5M8.5 -8.5L11.3 -5.7"/>'; // enpolet bryter (fritt, som i forklaringen)
const VEGG_BRYTER = `<g transform="translate(0 2.6) rotate(90)">${BRYTER}</g>`; // samme bryter, sirkelen inntil veggen og armen inn i rommet
const SLUK = '<rect x="-4" y="-4" width="8" height="8"/><path class="t-rist" d="M-4 0H4M0 -4V4"/>'; // sluk: kvadrat med rist i gulvet
const SERVANT = '<rect x="-11" y="0" width="22" height="11"/><ellipse cy="5.5" rx="7" ry="3.5"/>'; // servant mot vegg, kum i midten
const WC = '<rect x="0" y="-8" width="6" height="16"/><path d="M6 -6H11A9 6 0 0 1 11 6H6"/>'; // WC: sisterne mot veggen, skål ut i rommet
const plass = (x, y, r, sym, speil) => `<g transform="translate(${x} ${y})${r ? ` rotate(${r})` : ''}${speil ? ' scale(-1 1)' : ''}">${sym}</g>`;
const skravur = (id) => `<pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path class="t-skravur-strek" d="M0 0V4"/></pattern>`;
// Rør på badet (blått): WC mot venstre vegg, servant mot øvre vegg, sluk i gulvet borte fra døra. Veggflatene: ytre 33, bad/gang 93,25.
const ROR = '<g class="t-ror t-san">' + plass(33, 49, 0, WC) + plass(73, 33, 0, SERVANT) + plass(85, 70, 0, SLUK) + '</g>';
// El (blekk): én lampe midt i taket på badet og i gangen, fire downlights jevnt fordelt i stua.
// Brytere på veggen ved låssiden av døra, innenfor rommet. Stikk på veggene i stua.
const EL = '<g class="t-el">' + plass(65, 62.5, 0, LAMPE) + plass(65, 127.5, 0, LAMPE)
  + [[130, 65], [180, 65], [130, 125], [180, 125]].map(([x, y]) => plass(x, y, 0, LAMPE)).join('')
  + plass(77, 93.25, 180, VEGG_BRYTER, true) // bad: ved døra mot gangen (låssiden x 72), på badsiden
  + plass(82, 157, 180, VEGG_BRYTER, true) // gang: ved ytterdøra (låssiden x 77)
  + plass(103, 109, -90, VEGG_BRYTER) // stue: ved døra fra gangen (låssiden y 115), på den nye veggen
  + plass(195, 33, 0, STIKK) + plass(207, 62, 90, STIKK) + plass(207, 128, 90, STIKK) + plass(155, 157, 180, STIKK) + '</g>';
// Tømrer (brun skravur): ny vegg mellom bad/gang og stue.
const tomrer = (id) => `<rect class="t-skravur t-tomrer" x="97" y="30" width="6" height="85" style="fill:url(#${id})"/>`;
function fag() {
  // Forklaringen bruker nøyaktig de samme symbolene: el = lampe, stikk, bryter; rør = servant (blått); tømrer = skravur (brunt).
  return `<defs>${skravur('skravur')}</defs>${vegger('t-dempet', false)}${tomrer('skravur')}${ROR}${EL}
<g class="t-forklaring"><g class="t-el">${plass(32, 185, 0, LAMPE)}${plass(47, 180, 0, STIKK)}${plass(62, 189, 0, BRYTER)}</g><text x="82" y="189">El</text>${plass(108, 180, 0, '<g class="t-ror t-san">' + SERVANT + '</g>')}<text x="124" y="189">Rør</text><rect class="t-skravur t-tomrer" x="154" y="181" width="12" height="8" style="fill:url(#skravur)"/><text x="170" y="189">Tømrer</text></g>`;
}
function dok() {
  // Ferdig dokumentasjon: et ark med planen i liten skala og tittelfelt. Planen (x 27–213, y 26–163) skaleres
  // til .64 og ligger midt i feltet over PDF-stempelet, godt innenfor arket (x 52–188).
  return `<rect class="t-ark" x="52" y="6" width="136" height="188"/>
<defs>${skravur('skravur-dok')}</defs><g transform="translate(43 6) scale(.64)">${vegger('', false)}${tomrer('skravur-dok')}${ROR}${EL}</g>
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

// ---- Prosjektmappa: snitt B–B av et hus med loftsetasje, stiplet fordi det ikke er bygget ennå ----------
// Høyder: 1 m = 26 enheter, ±0 (gulv 1. etg = terreng) ved y 186. Gulv 2. etg +2,7 (y 116), raft +3,3 (y 100), møne +5,4 (y 46).
// Huset er 7,5 m bredt (x 60–254), mønet midt på (x 157). Takfallet er ca. 29°.
const kote = (h) => +(186 - h * 26).toFixed(1);
const MONE = [157, kote(5.4)];
const FALL = (kote(3.3) - MONE[1]) / (MONE[0] - 60); // stigning per enhet langs taket
const takY = (x, ned = 0) => +(MONE[1] + ned + Math.abs(x - MONE[0]) * FALL).toFixed(1);
// Bjelkelaget i etasjeskillet: bjelker c/c 0,6 m sett i snitt (kappet tre = rektangel med kryss), gulvlinje over og himlingslinje under.
const BJELKE = (x, y, b = 3, h = 7) => `M${x} ${y}h${b}v${h}h${-b}zM${x} ${y}l${b} ${h}M${x + b} ${y}l${-b} ${h}`;
const bjelker = Array.from({ length: 11 }, (_, i) => BJELKE(+(157 + (i - 5) * 15.6 - 1.5).toFixed(1), 117)).join('');
// Fagsymbolene er de samme som i plantegningene over (STIKK og LAMPE), så el ser likt ut i hele siden.
const VENTIL = '<path d="M-3 -2.5L3 2.5V-2.5L-3 2.5Z"/>'; // stengeventil på røret
const PIL = (x, y, r) => `<path class="t-pil" transform="translate(${x} ${y}) rotate(${r})" d="M0 -3.5L3 1.5H-3Z"/>`; // pilspiss, peker opp ved r = 0
const KANAL_X = 223; // ventilasjonskanalen går mellom to bjelker (x 220,9–233,5), til høyre for stigerøret, så lampa kan stå midt i rommet
const skravurJord = [2, 12, 22, 32, 42, 270, 280, 290, 300, 310, 320].map((x) => `M${x} 198l10-10`).join(''); // enkel skravur under terrenget
const koteMerke = (y, tekst, fra) => `${fra ? `<path class="t-hjelp" d="M${fra} ${y}H296"/>` : ''}<path d="M296 ${y}H316"/><path class="t-kote-pil" d="M300 ${y}l-4-6h8z"/><text x="306" y="${y - 6}">${tekst}</text>`;
export const SNITT = `<svg class="snitt" viewBox="0 0 340 236" role="img" aria-label="Snitt B–B av et hus med loftsetasje: bjelkelag i etasjeskillet, kabel opp i veggen til en stikkontakt og en taklampe midt i rommet, stigerør med avgreninger og en ventilasjonskanal ut gjennom taket. Prosjektert, ikke utført: ytterkanten av bygget er stiplet.">
<path class="t-terreng" d="M0 186H340"/><path class="t-skravur-linje" d="${skravurJord}"/>
<g class="t-prosjektert"><path d="M54 186V200H260V186M60 186V${kote(3.3)}M254 186V${kote(3.3)}M48 ${takY(48)}L${MONE[0]} ${MONE[1]}L266 ${takY(266)}"/></g>
<g class="t-tre"><path d="M67 186V${takY(67, 7)}M247 186V${takY(247, 7)}M60 ${takY(60, 7)}L${MONE[0]} ${MONE[1] + 7}L254 ${takY(254, 7)}"/><path class="t-gulv" d="M67 116H247M67 124H247"/><path d="${bjelker}"/></g>
<g class="t-vent"><path d="M${KANAL_X} 124V${takY(KANAL_X) - 12}M${KANAL_X + 8} 124V${takY(KANAL_X) - 12}M${KANAL_X - 2} 124H${KANAL_X + 10}M${KANAL_X - 6} ${takY(KANAL_X) - 12}H${KANAL_X + 14}"/><path class="t-pil-strek" d="M${KANAL_X + 4} 142V${takY(KANAL_X) - 4}"/>${PIL(KANAL_X + 4, 134, 0)}${PIL(KANAL_X + 4, 92, 0)}${PIL(KANAL_X + 4, takY(KANAL_X) - 4, 0)}</g>
<g class="t-ror t-stige"><path d="M276 196H212V${kote(3.4)}M212 160H190V166M212 ${kote(3.4)}H190V${kote(3.4) + 6}"/><g class="t-ventil">${plass(200, 160, 0, VENTIL)}${plass(200, kote(3.4), 0, VENTIL)}${plass(234, 196, 0, VENTIL)}</g></g>
<g class="t-el"><path class="t-kabel" d="M64 199V176H67M64 176V129H152"/>${plass(67, 176, -90, STIKK)}${plass(157, 129, 0, LAMPE)}</g>
<g class="t-maal">${koteMerke(186, '±0')}${koteMerke(116, '+2,7', 258)}${koteMerke(MONE[1], '+5,4', 163)}</g>
<g class="t-forklaring"><g class="t-tre"><path d="${BJELKE(4, 216, 4, 9)}"/></g><text x="13" y="225">Tre</text>
<g class="t-el">${plass(44, 220, 0, LAMPE)}${plass(53, 220, -90, STIKK)}</g><text x="67" y="225">El</text>
<g class="t-ror t-stige"><path d="M94 220H116"/><g class="t-ventil">${plass(105, 220, 0, VENTIL)}</g></g><text x="120" y="225">Rør</text>
<g class="t-vent"><path d="M146 216H170M146 224H170"/><path class="t-pil-strek" d="M148 220H164"/>${PIL(166, 220, 90)}</g><text x="175" y="225">Vent.</text><text x="262" y="225">Snitt B–B</text></g>
</svg>`;
