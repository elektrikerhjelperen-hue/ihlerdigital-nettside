# Designbrief – ihlerdigital.no

## Hva research viste
Skjermbilder og tekst fra Panic, Teenage Engineering, Playdate, Lux (Halide) og Tapbots, Flexibits og The Browser Company.

- **Panic / Playdate:** tørr, konkret tekst («a new, tiny, yellow console with a crank») og én ting i enorm størrelse. Sjelden adjektiver.
- **Teenage Engineering:** et teknisk tegnespråk (strektegnede ikoner, små japanske spesifikasjoner) gjennomført så konsekvent at det blir identitet.
- **Lux:** produktet er helten, svart rundt, ingen pynt.
- **Tapbots:** én figur eier hele siden.
- **Flexibits / Browser Company:** ryddige, men lette å forveksle med hvem som helst. Det vi skal unngå.

Fellesnevner for de særegne: ett eget *system* hentet fra det de faktisk driver med, ikke en stil.

## Retning: Koblingsskjemaet
Selskapet har elektrofaget i huset. Hele nettstedet er tegnet som et elektroskjema. Fem ledere med ekte fargekoder (svart L1, brun L2, grå L3 (norsk NEK 400, 514.3.2), blå N, gul/grønn PE) kommer inn fra høyre, tegner profilen av Hallingskarvet, faller ned i venstre marg og blir en samleskinne som går gjennom hele siden. Hver app er en **kurs** som er koblet på skinna. Bunnen er et **tittelfelt** som på en arbeidstegning.

Tonen er verkstedets: kort, tørr, konkret. Ingen «innovative løsninger». Tall og mål framfor adjektiver.

## Typografi (selvhostet, OFL)
- **Big Shoulders Display** – smal, høy, industriell. Bare store titler, versaler.
- **Schibsted Grotesk** – brødtekst. Tegnet for nordiske nyhetsmedier, kjenner æøå.
- **Martian Mono** (smal bredde) – målsetting, kursnummer, tegningsmerknader.

## Farger
Papir er kaldt tegnegrått, ikke varm krem. Blekk er nesten svart.
| Navn | Lys | Mørk |
|---|---|---|
| Papir | `#E7E8E3` | `#101214` |
| Blekk | `#14161A` | `#E9E9E2` |
| L1 svart | `#14161A` | `#E9E9E2` |
| L2 brun | `#7A4A26` | `#A86F42` |
| L3 grå | `#8A8D90` | `#6F7377` |
| N blå | `#1C69BE` | `#3F8CDD` |
| PE | `#1E9A4B` / `#F4CB00` | samme |

Hver app får et helt bånd i sin egen ekte farge: Elektrikerhjelpen signalgul, Garasjen betonggrå med malertape, spillene mørke. Gult brukes bare som flate med svart tekst, aldri som tekst på lyst.

## Layout
- Skinna ligger fast i venstre marg og går over alle bånd. Hver kurs kobles på med terminal og strek.
- Forsiden handler om selskapet: hvem vi er, hva vi står for, slik jobber vi, verktøyene som en kort fortegnelse, kontakt. Spillene er bare én lenke nederst.
- `/apper/` viser Verktøy med store bånd, og Spill som en enkel, lett tabell helt nederst.
- Ingen personnavn på siden, bare Ihler Digital og det juridiske selskapet.
- Telefoner forskjøvet og overlappende, navn i ekstrem størrelse som går helt ut i kanten.
- Appside: stort bånd, skjermbilder i horisontal rekke, hva den gjør, hvem den er for, støtte, personvern.

## Bevegelse
Lederne tegner seg selv ved lasting. Telefoner glir inn med `animation-timeline: view()` der det støttes. Bare CSS, null JS. Alt slås av ved `prefers-reduced-motion`.

## Bygg
`_bygg/bygg.mjs` lager alle HTML-filene av `_bygg/data.mjs`. `node _bygg/bygg.mjs`. Teksten i personvern-artiklene leses fra den publiserte HTML-en og endres aldri av bygget.

## Ikke gjør
Lilla/blå gradienter, glass-kort, Inter/systemfont, emoji-ikoner, like kort i rutenett, krem + serif + terrakotta, falske tall, falske kundesitater.
