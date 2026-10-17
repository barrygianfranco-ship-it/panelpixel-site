# Layout Storyblok “Survival”

Questa configurazione abilita l'impaginazione cinematografica usata per il dossier sulla saga di Resident Evil. Il renderer del sito è già predisposto; in Storyblok vanno aggiunta l'opzione di layout e i cinque blocchi annidabili elencati qui sotto.

## Articolo

Nel componente `articolo`, campo `impaginazione`, aggiungere l'opzione:

- Nome visualizzato: `Survival — dossier horror`
- Valore: `survival`

I campi già esistenti vengono riutilizzati così:

- `testata_titolo`: titolo molto grande sovrapposto alla copertina, per esempio `Resident Evil`
- `testata_sottotitolo`: riga editoriale sotto il titolo, per esempio `Trent'anni di paura, mutazioni e rinascite`
- `tema.background`: può restare vuoto; il layout usa il proprio nero editoriale
- `tema.accent`: rosso principale consigliato `#9f251f`
- `tema.testo_chiaro`: attivo

Nel campo rich text `corpo`, autorizzare i componenti annidati seguenti.

## `survival_chapter` — Apertura capitolo

| Campo | Tipo | Obbligatorio | Esempio |
|---|---|---:|---|
| `number` | testo | sì | `01` |
| `eyebrow` | testo | no | `Le origini` |
| `title` | testo | sì | `La villa, il contagio, la paura` |
| `years` | testo | no | `1996—1998` |
| `summary` | textarea | no | Breve introduzione al capitolo |

Usarlo prima dei paragrafi relativi a ogni grande fase. Con almeno tre capitoli il sito genera automaticamente l'indice cronologico.

## `survival_timeline` — Cronologia

| Campo | Tipo | Obbligatorio |
|---|---|---:|
| `title` | testo | no |
| `items` | blocchi annidati `survival_timeline_item` | sì |

Componente figlio `survival_timeline_item`:

| Campo | Tipo | Obbligatorio |
|---|---|---:|
| `year` | testo | sì |
| `title` | testo | sì |
| `text` | textarea breve | no |

## `survival_compare` — Confronto a due pannelli

Campi: `title` (testo), `left_image` (asset), `left_title` (testo), `left_text` (textarea), `right_image` (asset), `right_title` (testo), `right_text` (textarea).

È adatto ai confronti originale/remake, survival/action oppure prima/dopo una svolta della saga. Le due immagini dovrebbero avere lo stesso rapporto, idealmente 16:10.

## `survival_panorama` — Immagine panoramica

Campi: `image` (asset, obbligatorio), `caption` (testo). Usarlo per illustrazioni originali o immagini che devono interrompere la colonna di lettura e occupare quasi tutta la pagina.

## `survival_dossier` — Nota d'archivio

Campi: `label` (testo), `code` (testo breve), `title` (testo), `text` (textarea). È pensato per retroscena produttivi, cambi di direzione, autori, versioni cancellate o chiarimenti di continuity.

## Ordine consigliato

1. Due o tre paragrafi introduttivi.
2. Timeline generale.
3. `survival_chapter` per ogni fase della saga.
4. Paragrafi normali, citazioni e immagini tra un capitolo e l'altro.
5. Un `survival_compare` solo quando il confronto serve davvero.
6. Una o due `survival_panorama` con le illustrazioni originali.
7. `takeaway` già esistente per la chiusura editoriale.

Non serve riempire l'articolo di moduli: capitoli e ritmo tipografico devono restare la struttura principale.
