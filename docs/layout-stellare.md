# Layout «Stellare» (interviste a domande e risposte)

Impaginazione per le interviste a domande e risposte, **su fondo chiaro** come il resto del sito: copertina in cornice bianca con falce di luna, riquadro-titolo con barra rossa, capolettera rossa, divisore a scintille e una scheda numerata per ogni domanda. Colori del sito (rosso Panel Pixel e un tocco di oro). Solo grafica originale, nessuna immagine ufficiale di serie.

Stato: **online** dal commit del 1 novembre 2026 (sito e Studio), insieme alla Monografia. Anteprima locale: `anteprima-stellare.html?slug=noriyo-sasaki-intervista-sailor-moon` (file non tracciato, non committare).

Versioni precedenti, su cielo notturno, salvate come copie dell'intero `style.css` (non tracciate): `tmp/style.css.stellare-pieno` (stelle che brillano, riquadro rosa) e `tmp/style.css.stellare-scuro-morbido` (scura ma più sobria).

## Come si usa in Sanity

1. Nel documento, campo **Impaginazione** → «Stellare — interviste, anni 90» (richiede il deploy dello Studio con la nuova opzione, vedi sotto).
2. **Titolo testata speciale**: il nome sul riquadro rosa in copertina (es. «Noriyo Sasaki»).
3. **Sottotitolo testata speciale**: la riga piccola sotto (es. «Sailor Moon · Cutie Honey F»). Se i due campi sono vuoti il riquadro mostra solo l'etichetta del tipo («Intervista»).
4. **Corpo**: ogni domanda è un paragrafo scritto **tutto in grassetto**; i paragrafi normali che seguono sono la risposta. Un paragrafo normale prima della prima domanda diventa l'introduzione, con la capolettera dorata.
5. **Figura a sinistra / Figura a destra** (campi nuovi nel gruppo Aspetto): PNG con sfondo trasparente, alto circa 1200 px. Compaiono ai lati della colonna di lettura solo su schermi larghi (da 1180 px in su) e restano ferme mentre si scorre. Sono decorative (nascoste agli screen reader): compila comunque Copyright e Fonte, finiscono nella riga dei crediti delle immagini. Su telefono e tablet non si vedono.
6. Citazioni (`blockquote`), immagini e box funzionano come negli altri layout; il tema colore dell'articolo è facoltativo (il rosso segue `--article-accent` se c'è).

## Cosa è cambiato nel codice

- `css/style.css`: sezione «Impaginazione Stellare» in fondo al file (classi `.layout-stellare`, `.stellare-*`).
- `js/main.js`: `stellareCoverBoxHTML`, `renderStellareInterview`, classe `layout-stellare` in `applyArticleLayout`, indice automatico spento per questo layout.
- `js/sanity-adapter.js`: accetta `stellare` come valore di `impaginazione`.
- `netlify/edge-functions/article-meta.js`: la query del documento include anche le due figure.
- `sanity-studio/schemaTypes/articolo.ts`: nuova opzione nel campo Impaginazione e i campi `figura_sinistra` / `figura_destra`. **Lo Studio pubblicato non la mostra finché non viene rifatto il deploy** (`sanity deploy` dalla cartella `sanity-studio`).

## Da fare prima di pubblicare

- Cache-bust: aggiornare i `?v=` di `style.css` e `main.js` nelle pagine (`articolo.html` e le altre che li caricano).
- Deploy dello Studio e verifica che l'opzione compaia.
- Foto con persone (come la 06 di San Donà): conferma dell'ufficio stampa.
