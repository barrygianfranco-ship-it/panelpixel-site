/* ==========================================================================
   Panel Pixel — dati del sito
   Gli articoli NON vivono più in questo file: sono in data/articles.json
   (letto via fetch all'avvio da js/main.js, editabile anche da admin/ —
   Decap CMS) e in data/radar.json per le rubriche di tipo "radar" (non
   gestite dal CMS, vedi commento lì dentro). Questo file resta per i dati
   "di configurazione" del sito che non cambiano articolo per articolo.
   Vedi README.md per le istruzioni dettagliate.
   ========================================================================== */

const SITE = {
  name: "Panel Pixel",
  tagline: "Fumetti, videogiochi e cultura pop, un frame alla volta.",
  email: "redazione@panelpixel.it",
  // Dominio pubblico del sito, usato per comporre og:url e og:image (le
  // anteprime che compaiono quando condividi un link su social/chat/WhatsApp)
  // — vedi updateArticleSEO in js/main.js. NESSUNO slash finale.
  //
  // QUANDO IL DOMINIO panelpixel.it SARÀ ATTIVO: qui deve esserci esattamente
  //   url: "https://panelpixel.it"
  // (è già impostato così qui sotto). Finché il dominio non è registrato e
  // puntato al sito, questo valore resta corretto ma "a vuoto": non causa
  // errori, semplicemente le anteprime social punteranno a un indirizzo non
  // ancora raggiungibile. Vedi la sezione "Quando il dominio è attivo" nel
  // README.md per i controlli da fare una volta che panelpixel.it risponde.
  url: "https://panelpixel.it",
};

const CATEGORIES = [
  { slug: "recensioni", name: "Recensioni" },
  { slug: "monografie", name: "Monografie" },
  { slug: "attualita", name: "Attualità" },
  { slug: "anteprime", name: "Anteprime" },
  { slug: "approfondimenti", name: "Approfondimenti" },
];

/* ==========================================================================
   Commenti (Giscus) — configurazione
   Panel Pixel non ha un backend proprio per i commenti: usa Giscus
   (https://giscus.app), un widget gratuito basato sulle GitHub Discussions
   di un repository pubblico. Finché "enabled" è false, in fondo agli
   articoli compare solo un messaggio placeholder e NESSUNO script esterno
   viene caricato (nessuna richiesta a giscus.app, nessun cookie di terze
   parti) — coerente con quanto dichiarato in privacy.html.

   Come attivarlo:
   1. Crea (o usa) un repository PUBBLICO su GitHub, anche vuoto — es.
      github.com/tuo-utente/panel-pixel — e attiva "Discussions" in
      Settings → General → Features del repository.
   2. Installa la GitHub App di giscus sul repository:
      https://github.com/apps/giscus
   3. Vai su https://giscus.app, inserisci il nome del repository
      (formato "utente/nome-repo") nel campo in alto: la pagina genera
      automaticamente i valori "data-repo-id" e "data-category-id" da
      copiare qui sotto.
   4. Sostituisci repo / repoId / category / categoryId qui sotto con quei
      valori (categoria consigliata: "Commenti", oppure quella che preferisci
      tra le Discussions categories del repo).
   5. Imposta enabled: true.

   Nota sul "mapping": impostato su "pathname" su richiesta esplicita.
   ATTENZIONE — tutte le pagine articolo condividono lo stesso indirizzo
   articolo.html?slug=... e "pathname" ignora la query string: significa
   che TUTTI gli articoli del sito condividono la STESSA discussione GitHub
   (un unico thread di commenti per l'intero sito, non uno per articolo).
   Se in futuro si vuole un thread separato per ogni articolo, l'alternativa
   è "specific" con "data-term" impostato sullo slug dell'articolo.
*/
const COMMENTS_CONFIG = {
  provider: "giscus",
  enabled: true,
  giscus: {
    repo: "barrygianfranco-ship-it/panelpixel-site",
    repoId: "R_kgDOTweA-Q",
    category: "General",
    categoryId: "DIC_kwDOTweA-c4DC01r",
  },
};

/* Lo schema di ogni articolo (slug, category, type, title, excerpt, author,
   date, image, featured, triedOn opzionale, seoTitle/seoDescription/
   seoKeywords opzionali, content) è documentato in data/articles.json e
   data/radar.json, dove ora vivono i dati veri. Riepilogo rapido:
   - category: deve corrispondere a uno slug in CATEGORIES qui sopra.
   - type: determina il TEMPLATE/layout della pagina articolo (vedi
     renderArticleLayout in js/main.js). "recensione"/"monografia"/"notizia"
     usano un array di blocchi ({ type: "h2"|"h3"|"p", text } oppure
     { type: "image", src, alt?, caption? }); "radar" usa un oggetto
     { intro, items } — vedi data/radar.json.
   - Se seoTitle/seoDescription non sono compilati, main.js usa in automatico
     title ed excerpt come fallback (vedi updateArticleSEO in js/main.js).
*/
