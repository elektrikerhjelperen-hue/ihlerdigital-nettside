# Designbrief – ihlerdigital.no

## Hva research viste
Skjermbilder og tekst fra Panic, Teenage Engineering, Playdate, Lux (Halide) og Tapbots, Flexibits og The Browser Company.

- **Panic / Playdate:** tørr, konkret tekst («a new, tiny, yellow console with a crank») og én ting i enorm størrelse. Sjelden adjektiver.
- **Teenage Engineering:** et teknisk tegnespråk (strektegnede ikoner, små japanske spesifikasjoner) gjennomført så konsekvent at det blir identitet.
- **Lux:** produktet er helten, svart rundt, ingen pynt.
- **Tapbots:** én figur eier hele siden.
- **Flexibits / Browser Company:** ryddige, men lette å forveksle med hvem som helst. Det vi skal unngå.

Fellesnevner for de særegne: ett eget *system* hentet fra det de faktisk driver med, ikke en stil.

## Retning: Arbeidstegningen (fra 26.11.2026, jobb 660)
Forrige retning var et elektroskjema (fem ledere og samleskinne). Nå er siden tegnet som en **byggtegning** som passer alle fag: elektriker, tømrer, rørlegger og byggeplass. Elektro kan skimtes (det gule båndet til Elektrikerhjelpen, el-symboler i plantegningen), men dominerer ikke.

- **Fjellet** er kjennetegnet: Hallingskarvet som *snitt A–A* med høydekurver under, Folarskardnuten +1933 og Ål +440 som koter. Profilen tegnes ved lasting.
- **Akser:** én strek–prikk-akse i venstre marg gjennom hele siden. Hver seksjon har en akseboble (A, B, C …) som på en byggtegning.
- **Rutenett** (24 px) bak hodet og planseksjonen, som tegnepapir.
- **Plantegning i fire detaljer:** skann (punktsky) → mål (målsetting) → fag (el, rør, tømrer i samme tegning) → dokumentasjon (ark med tittelfelt og PDF).
- **Prosjektert = stiplet:** Prosjektmappa vises i en stiplet ramme med et stiplet snitt, fordi den ikke er bygget ennå. Bare konseptet, ingen skjermbilder eller funksjonslister.
- **Tittelfelt** nederst som på en arbeidstegning, med lenke til «Alle apper og personvern».

Forsiden handler om planlegging og dokumentasjon for fagfolk og bedrifter: A plan, B Elektrikerhjelpen, C Prosjektmappa (kommer), D for bedrifter, E om oss, F kontakt. Menyen: Elektrikerhjelpen, Prosjektmappa, Kontakt. De andre appene (spill, Garasjen, Handlelista, Matplanlegger) har sidene sine på samme adresse som før, men vises bare på `/apper/`, som bare lenkes fra tittelfeltet.

Tonen er verkstedets: kort, tørr, konkret. Ingen «innovative løsninger». Tall og mål framfor adjektiver.

## Typografi (selvhostet, OFL)
- **Big Shoulders Display** – smal, høy, industriell. Bare store titler, versaler.
- **Schibsted Grotesk** – brødtekst. Tegnet for nordiske nyhetsmedier, kjenner æøå.
- **Martian Mono** (smal bredde) – målsetting, kursnummer, tegningsmerknader.

## Farger
Papir er kaldt tegnegrått, blekk nesten svart. Én merkefarge, oppmerkingsoransje, til strek (første høydekurve, skannestråle, PDF-stempel) og korte merknader, aldri brødtekst.
| Navn | Lys | Mørk |
|---|---|---|
| Papir | `#E7E8E3` | `#101214` |
| Blekk | `#14161A` | `#E9E9E2` |
| Merke (oransje) | `#A8390B` | `#FF8A4C` |
| Rør (blå) | `#1C5FAE` | `#6AA8F0` |

Elektrikerhjelpen har det signalgule båndet (`#FFC800`, svart tekst). Gult brukes bare som flate med svart tekst.

## Bevegelse
Profilen tegnes ved lasting (CSS, ingen JS), høydekurvene toner inn etter. Telefoner og plandetaljer glir inn med `animation-timeline: view()` der det støttes. Ved `prefers-reduced-motion` står alt ferdig. Ingen JavaScript på siden.

## Bygg
`_bygg/bygg.mjs` lager alle HTML-filene av `_bygg/data.mjs`, tegningene ligger i `_bygg/tegninger.mjs`. `node _bygg/bygg.mjs`.

Tester: `node _bygg/test-lenker.mjs` (alle gamle adresser, app-ads.txt og nedlastingslenkene mot `_bygg/lenker-grunnlinje.json`) og `node _bygg/test-sider.mjs [mappe]` (Chrome via playwright-core: vannrett rulling, alt-tekst, ødelagte bilder, kontrast, valgfritt skjermbilder). Teksten i personvern-artiklene leses fra den publiserte HTML-en og endres aldri av bygget.

## Ikke gjør
Lilla/blå gradienter, glass-kort, Inter/systemfont, emoji-ikoner, like kort i rutenett, krem + serif + terrakotta, falske tall, falske kundesitater.
