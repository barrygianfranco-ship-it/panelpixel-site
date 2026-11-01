# Layout «Monografia» (saggi lunghi)

Impaginazione per i pezzi lunghi di approfondimento. La copertina è divisa in due e i capitoli sono separati da filetti sottili. Si possono affiancare al testo colonne di immagini. Fondo chiaro e colori del sito: è solo uno schema di pagina, senza grafica presa da altri.

Stato: **online** dal commit del 1 novembre 2026 (sito e Studio).

Anteprima locale con testo di prova e foto di San Donà (file non tracciato, da non committare):
- `anteprima-monografia.html?slug=anteprima-monografia` per la copertina divisa;
- `anteprima-monografia.html?slug=anteprima-monografia&fascia=1` per la versione con la fascia 失われた十年.

## Come si usa in Sanity

1. **Impaginazione**: scegli «Monografia — saggi lunghi». Serve prima il deploy dello Studio, vedi sotto.
2. **Copertina divisa** (Titolo testata speciale vuoto): su schermi larghi titolo, sottotitolo e firma stanno centrati a sinistra, l'immagine di copertina a destra, intera e senza tagli. Rende meglio un'immagine verticale.
3. **Fascia verticale** (Titolo testata speciale compilato): a sinistra c'è una fascia colorata con la scritta in verticale. A destra stanno immagine e titolo, uno sopra l'altro.
   - Le scritte giapponesi stanno dritte, una sotto l'altra; quelle in alfabeto latino sono ruotate.
   - Il **Sottotitolo testata speciale** è la riga piccola in fondo alla fascia, per esempio la traslitterazione.
   - Il colore della fascia è il colore principale del tema schiarito; senza tema è il rosso del sito schiarito.
4. **Corpo**:
   - i titoli H2 sono centrati, con un filetto sopra;
   - su schermi larghi i paragrafi sono giustificati;
   - il grassetto si usa come evidenziatore;
   - immagini, gallerie (due immagini affiancate), citazioni e box funzionano come negli altri layout.
5. **Nuovo blocco «Testo e immagini affiancati»**, disponibile in tutte le impaginazioni:
   - un testo breve con grassetto, corsivo e link, accanto a una colonna da 1 a 5 immagini una sotto l'altra;
   - le immagini vanno a destra o a sinistra, con un filetto verticale in mezzo;
   - sul telefono le immagini finiscono sotto il testo;
   - ogni immagine chiede alt, copyright e fonte, che finiscono nei crediti.

6. **Altri blocchi, ristilizzati per la Monografia** (aggiunti il 1 nov con il pezzo su Inio Asano):
   - **Cronologia** (ex «Survival — cronologia», ora «Cronologia (Survival e Monografia)»): date su più righe con un pallino rosso, colori del sito, senza fondo scuro;
   - **Citazione in evidenza**: centrata e in corsivo tra due filetti, senza l'etichetta «Passaggio chiave»;
   - **Scheda opera**: senza fondo, tra due filetti; utile per i dati di ogni opera (anni, rivista, volumi, adattamenti);
   - **Capolettera**: c'è anche a inizio di ogni capitolo, sul primo paragrafo dopo un H2. Per questo il primo paragrafo di un capitolo non deve iniziare con virgolette o trattini.

## Cosa è cambiato nel codice

- `sanity-studio/schemaTypes/articolo.ts`: c'è l'opzione `monografia` nel campo Impaginazione e una descrizione sui due campi della testata.
- `sanity-studio/schemaTypes/objects.ts`: c'è il tipo `testo_immagini` («Testo e immagini affiancati»), aggiunto ai blocchi del corpo.
- `js/sanity-adapter.js`:
  - accetta `monografia`;
  - la query carica le immagini di `testo_immagini`;
  - il blocco viene reso come `.article-affiancato`.
- `js/main.js`: aggiunta la classe `layout-monografia` (più `--fascia` se c'è il titolo testata) e la funzione `monografiaFasciaHTML`.
- `css/style.css`: in fondo al file ci sono due sezioni nuove, «Testo e immagini affiancati» e «Impaginazione monografia».
- `netlify/edge-functions/article-meta.js`: il testo del blocco affiancato finisce nella versione HTML letta dai motori di ricerca.

## Da fare prima di pubblicare

- Cache-bust: aggiornare i `?v=` di `style.css`, `main.js` e `sanity-adapter.js` nelle pagine che li caricano.
- Deploy dello Studio (`sanity deploy` dalla cartella `sanity-studio`) e verifica che l'opzione e il blocco compaiano.
- Provarlo con un articolo vero in bozza, usando l'anteprima dello Studio.
