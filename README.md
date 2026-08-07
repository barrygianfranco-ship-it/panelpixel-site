# Panel Pixel

Sito magazine editoriale su fumetti, videogiochi e cultura pop. HTML + CSS + JavaScript vanilla, nessun framework, nessuna build necessaria.

## Struttura del progetto

```
panel-pixel/
├── index.html          → Home page (In evidenza + sezioni per categoria + ricerca)
├── recensioni.html      → Archivio categoria "Recensioni"
├── monografie.html      → Archivio categoria "Monografie"
├── attualita.html        → Archivio categoria "Attualità"
├── anteprime.html        → Archivio categoria "Anteprime"
├── articolo.html         → Template pagina singolo articolo (usa ?slug=..., layout per tipo + sidebar correlati)
├── chi-sono.html          → Pagina "Chi sono"
├── privacy.html            → Pagina "Privacy & Cookie"
├── editor.html              → Mini editor interno per scrivere articoli — SOLO USO LOCALE (vedi sotto)
├── css/
│   ├── style.css         → Tutto lo stile del sito pubblico (palette, font, layout)
│   └── editor.css          → Stile del solo editor.html
├── js/
│   ├── data.js            → TUTTI i contenuti: articoli, categorie, config commenti
│   ├── main.js             → Logica che legge data.js e popola le pagine pubbliche
│   └── editor.js            → Logica del mini editor interno
├── assets/
│   ├── images/              → Immagini di copertina e loghi
│   └── fonts/                → Font self-hosted (Inter, Playfair Display)
└── README.md
```

## Come aprire il sito in locale

Il sito è statico: bastano i file, non serve installare nulla.

**Opzione 1 — doppio click**
Apri semplicemente `index.html` con il browser (doppio click sul file). Funziona perché tutti gli script sono caricati come tag `<script>` classici (non moduli ES), quindi non ci sono problemi di CORS con `file://`.

**Opzione 2 — server locale (consigliata)**
Per un comportamento identico alla produzione (utile se in futuro aggiungi funzionalità che richiedono `fetch`), avvia un piccolo server locale nella cartella del progetto:

```bash
# con Python 3
python -m http.server 8000

# oppure con Node (via npx, non richiede installazione permanente)
npx serve .
```

Poi apri `http://localhost:8000` nel browser.

## Come modificare testi e immagini

### Nome sito, tagline, email
Apri `js/data.js` e modifica l'oggetto `SITE` in cima al file:

```js
const SITE = {
  name: "Panel Pixel",
  tagline: "Fumetti, videogiochi e cultura pop, un frame alla volta.",
  email: "redazione@panelpixel.it",
};
```

### Testi di un articolo esistente
Sempre in `js/data.js`, trova l'oggetto dell'articolo nell'array `ARTICLES` (cercalo per `slug` o `title`) e modifica i campi che vuoi: `title`, `excerpt`, `author`, `date`, `content` (array di paragrafi).

### Immagini
Le immagini di copertina si trovano in `assets/images/`. Per sostituirle:
1. Metti la tua immagine (jpg/png/webp) nella cartella `assets/images/`.
2. Nell'oggetto dell'articolo in `js/data.js`, aggiorna il campo `image` con il nuovo percorso, es. `image: "assets/images/mia-foto.jpg"`.

Le immagini attuali sono placeholder in formato SVG generati automaticamente: puoi sostituirle una a una senza toccare nient'altro.

### Bio e foto della pagina "Chi sono"
Apri `chi-sono.html` e modifica direttamente il testo dentro `<div class="about-text">` e il percorso dell'immagine in `<img src="assets/images/gianfranco-barry.jpg" ...>`.

### Colori e font
Apri `css/style.css` e modifica le variabili in cima al file (sezione `:root`):

```css
:root {
  --color-bg: #faf8f5;      /* sfondo pagina */
  --color-text: #1a1a1a;     /* testo principale */
  --color-accent: #b23a2e;    /* colore categorie, link, dettagli */
  --font-serif: "Playfair Display", Georgia, serif;  /* titoli */
  --font-sans: "Inter", system-ui, sans-serif;         /* testo/UI */
}
```

Cambiando questi valori, l'intero sito si aggiorna in automatico.

## Come aggiungere un nuovo articolo

### Opzione consigliata: il mini editor interno (`editor.html`)

Panel Pixel non ha un backend, ma include un piccolo editor per scrivere articoli senza aprire `js/data.js` a mano:

1. Apri `editor.html` in locale (doppio click, come le altre pagine).
2. Compila i campi: slug (opzionale, generato dal titolo se lo lasci vuoto), titolo, excerpt, categoria, tipo, data, autore, immagine di copertina, campi SEO.
3. In base al **tipo** scelto, la sezione "Contenuto" cambia:
   - *Recensione / Monografia / Notizia*: aggiungi blocchi con "+ Aggiungi paragrafo" e "+ Aggiungi immagine", nell'ordine in cui devono comparire — puoi alternarli liberamente (testo → immagine → testo...).
   - *Radar*: compila nome rubrica, periodo, intro, poi aggiungi le voci della rubrica (una per gioco/film segnalato).
4. Premi **"Genera oggetto articolo"**, poi **"Copia negli appunti"**.
5. Apri `js/data.js` e incolla il blocco copiato dentro l'array `ARTICLES`, come nuovo elemento.
6. Salva: l'articolo comparirà automaticamente nella home, nella pagina della sua categoria, e sarà raggiungibile su `articolo.html?slug=...`.

⚠️ **`editor.html` è solo per uso locale**: non ha password (non essendoci un backend, non è tecnicamente possibile aggiungerne una vera) ed è raggiungibile da chiunque conosca l'URL se il sito è online. Non è collegata da nessun link nel sito pubblico, ma se pubblichi il sito **escludi dal deploy** (o cancella prima di pubblicare) `editor.html`, `css/editor.css` e `js/editor.js`.

### Opzione manuale: modificare `js/data.js` a mano

Se preferisci scrivere direttamente il codice, apri `js/data.js` e copia un oggetto esistente dentro l'array `ARTICLES` come punto di partenza. La lista completa dei campi disponibili (incluso il campo `type`, che determina il layout della pagina, e il formato del `content` — a blocchi misti testo/immagine per recensioni/monografie/notizie, a voci per le rubriche radar) è documentata nel commento in cima al file, sopra `const ARTICLES = [...]`: tienilo come riferimento aggiornato invece di questo README, perché è lì che va aggiornato ogni volta che cambia lo schema.

**Nota sulla sezione "In evidenza":** in home compare 1 articolo grande, preso tra quelli con `featured: true` (il più recente). Per cambiare cosa è "in evidenza", imposta `featured: true/false` sugli articoli che vuoi.

## Come aggiungere una nuova categoria

1. In `js/data.js`, aggiungi una voce all'array `CATEGORIES`:
   ```js
   { slug: "interviste", name: "Interviste" }
   ```
2. Crea un nuovo file HTML copiando uno esistente (es. `recensioni.html`), rinominalo `interviste.html` e modifica:
   - il `<title>` e il testo in `.page-hero`
   - l'attributo `data-category="interviste"` sul `<div id="category-list">`
3. Aggiungi il link nel menu di navigazione (`<nav class="primary-nav">`) in **tutti** i file HTML.

## Deploy online (GitHub + Vercel/Netlify)

### 1. Pubblica su GitHub

```bash
cd panel-pixel
git init
git add .
git commit -m "Primo commit: Panel Pixel"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/panel-pixel.git
git push -u origin main
```
(Crea prima il repository vuoto su github.com, senza README, poi usa l'URL che ti viene mostrato al posto di quello sopra.)

### 2a. Deploy su Vercel
1. Vai su [vercel.com](https://vercel.com) e accedi con GitHub.
2. Clicca **New Project** e seleziona il repository `panel-pixel`.
3. Vercel rileva automaticamente che è un sito statico: lascia i campi di build vuoti (nessun "Build Command", "Output Directory" = `.`).
4. Clicca **Deploy**. Il sito sarà online in meno di un minuto, con un URL tipo `panel-pixel.vercel.app`.
5. Ad ogni `git push` su `main`, Vercel ripubblica automaticamente il sito.

### 2b. Deploy su Netlify (alternativa)
1. Vai su [netlify.com](https://netlify.com) e accedi con GitHub.
2. Clicca **Add new site → Import an existing project**, seleziona il repository.
3. Lascia vuoti "Build command" e imposta "Publish directory" = `.` (cartella radice).
4. Clicca **Deploy site**. Anche qui, ogni push su `main` aggiorna automaticamente il sito online.

### Dominio personalizzato
Sia su Vercel che su Netlify, dopo il primo deploy puoi collegare un dominio tuo dalla sezione **Domain settings** del progetto.

### 2c. Hosting tradizionale (FTP / cPanel), se non usi Vercel/Netlify
Il sito è statico: non serve altro che copiare i file così come sono.
1. Collegati al tuo spazio hosting via FTP/SFTP (client tipo FileZilla) o dal File Manager del pannello di controllo.
2. Carica **tutto il contenuto** della cartella `panel-pixel/` (non la cartella stessa, il suo *contenuto*) dentro la cartella pubblica del dominio — di solito si chiama `public_html/`, `www/` o `htdocs/` a seconda dell'hosting.
3. Verifica che `index.html` finisca esattamente nella radice pubblica (es. `public_html/index.html`, non `public_html/panel-pixel/index.html`): se finisce in una sottocartella, tutti i percorsi relativi (`css/style.css`, `assets/images/...`) continuano a funzionare comunque, ma il sito risponderà su `tuodominio.it/panel-pixel/` invece che su `tuodominio.it/`.

### Prima di pubblicare: checklist
- **`SITE.url`** in cima a `js/data.js` è già impostato su `https://panelpixel.it` (il dominio che registrerai), quindi non serve toccarlo di nuovo — vedi il commento sopra quella riga nel file. Finché il dominio non è registrato e puntato al sito, il valore resta corretto ma "a vuoto": non causa errori, solo le anteprime social punteranno a un indirizzo non ancora raggiungibile.
- **Escludi l'editor interno**: `editor.html`, `css/editor.css` e `js/editor.js` sono pensati solo per uso locale (vedi la sezione sull'editor più sopra). Rimuovili dal repository (o comunque dalla cartella che pubblichi) prima del primo deploy: non hanno password e, online, sarebbero raggiungibili da chiunque conosca l'URL.
- Se hai aggiunto un dominio personalizzato, ricontrolla che sia collegato correttamente e che il certificato HTTPS risulti attivo (Vercel/Netlify lo fanno in automatico, ma può richiedere qualche minuto).

### Quando il dominio è attivo
Nel momento esatto in cui `panelpixel.it` inizia a rispondere (registrato, puntato al deploy, HTTPS attivo), fai questi tre controlli in ordine:

1. **Imposta `SITE.url`** — apri `js/data.js` e controlla che sia esattamente:
   ```js
   url: "https://panelpixel.it",
   ```
   (dovrebbe già esserlo, dato che l'ho impostato così in previsione della registrazione — ricontrolla solo che nessuna modifica successiva l'abbia cambiato, es. rimettendo `www.` o uno slash finale).

2. **Controlla `<title>` e meta description sugli articoli** — apri un paio di articoli veri sul dominio (non in locale) e verifica che:
   - la scheda del browser mostri il titolo di *quell'articolo* (non "Panel Pixel" fisso),
   - nel codice sorgente della pagina (tasto destro → Visualizza sorgente pagina, oppure `Ctrl+U`) il tag `<meta name="description" ...>` contenga il testo dell'articolo, non quello generico di default.
   Se qualcosa non torna, il problema è quasi sempre che `updateArticleSEO()` non è partita — controlla la console del browser (`F12`) per errori JavaScript.

3. **Verifica i link `mailto:`** — su una pagina qualsiasi (footer, "Chi sono", "Privacy & Cookie") clicca l'indirizzo `redazione@panelpixel.it`: deve aprire il client di posta predefinito con un'email vuota già indirizzata a quel contatto. Se non succede nulla al click, il browser probabilmente non ha un client di posta predefinito configurato sul dispositivo di test (non è un problema del sito) — riprova da un altro dispositivo/browser prima di preoccuparti.

### Dopo la pubblicazione: cosa controllare online
Una volta che il sito risponde sul dominio vero, prima di considerarlo pronto controlla a mano:
- [ ] La **home** si apre e mostra "In evidenza" + le sezioni per categoria.
- [ ] Il **menu** funziona su tutte le voci (Home, Recensioni, Monografie, Attualità, Anteprime, Chi sono) — sia da desktop che aprendo/chiudendo il menu mobile.
- [ ] Da una card in home, il **click apre l'articolo giusto** (`articolo.html?slug=...`) e non una pagina bianca o "Articolo non trovato".
- [ ] In un articolo, **immagine di copertina, immagini interne e favicon** si caricano (nessuna icona di immagine rotta) — se un'immagine non compare, quasi sempre è un problema di maiuscole/minuscole nel nome file (es. `Logo.png` caricato ma richiamato come `logo.png`: online, a differenza di Windows, il file system fa differenza tra maiuscole e minuscole).
- [ ] La pagina **Chi sono** e **Privacy & Cookie** si aprono correttamente.
- [ ] Provando un **URL sbagliato apposta** (es. `tuodominio.it/pagina-che-non-esiste.html`) il sito mostra un 404 dell'hosting, non un errore bianco — comportamento normale, ma verifica che almeno non rompa la navigazione da lì (basta tornare indietro o andare in home).
- [ ] Nella pagina di un articolo, verifica che il **`<title>` della scheda del browser** cambi in base all'articolo aperto (conferma che `updateArticleSEO` sta girando) invece di restare fisso su "Panel Pixel".
- [ ] Da smartphone reale (non solo ridimensionando la finestra), controlla che **testo e immagini non escano dai bordi** e che il menu mobile si apra/chiuda correttamente.

## Note tecniche

- Nessuna dipendenza esterna: i font (Playfair Display + Inter) sono self-hosted in `assets/fonts/`, non caricati da Google Fonts o altri CDN — nessuna richiesta di rete in uscita al caricamento delle pagine.
- Tutte le pagine pubbliche condividono `css/style.css` e `js/data.js` / `js/main.js`. L'editor interno (`editor.html`) ha il proprio `css/editor.css` e `js/editor.js`, separati dal resto.
- Il menu su mobile è gestito da un piccolo toggle in `js/main.js` (funzione `initHeader`), senza librerie esterne.
- I commenti (Giscus) sono disattivati di default e non caricano nulla finché non li configuri: vedi `COMMENTS_CONFIG` in cima a `js/data.js` per come attivarli.
