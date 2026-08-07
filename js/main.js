/* ==========================================================================
   Panel Pixel — logica di rendering
   Legge SITE/CATEGORIES/COMMENTS_CONFIG da js/data.js (sincrono, invariato)
   e gli articoli da data/articles.json + data/radar.json via fetch,
   caricati da loadArticles() prima di popolare le pagine — vedi il blocco
   DOMContentLoaded in fondo al file. Non serve toccare questo file per
   aggiungere articoli "normali": si aggiungono a data/articles.json (anche
   via admin/, Decap CMS) o, per le rubriche "radar", a data/radar.json.
   ========================================================================== */

// Popolato da loadArticles() all'avvio, prima di ogni rendering — vedi
// DOMContentLoaded in fondo al file. Finché il fetch non è completato resta
// vuoto: nessuna funzione di rendering viene chiamata prima di allora, quindi
// non c'è un momento in cui il codice gira su un ARTICLES vuoto per errore.
let ARTICLES = [];

/* Carica gli articoli "normali" (data/articles.json) e le rubriche radar
   (data/radar.json) e li unisce in un unico ARTICLES, come prima quando
   erano tutti insieme nell'array in js/data.js. Se anche uno solo dei due
   fetch fallisce (rete offline, file mancante, JSON non valido), l'intera
   pagina mostra un messaggio d'errore invece di restare bianca o mostrare
   un sito vuoto con sezioni "nessun articolo" fuorvianti.

   data/articles.json è un OGGETTO { articles: [...] }, non un array nudo:
   lo richiede Decap CMS, che per le collection di tipo "files" legge/scrive
   il contenuto del file come oggetto con una chiave per ogni field di primo
   livello (qui il field si chiama "articles", vedi admin/config.yml) — un
   array alla radice non ha una chiave a cui agganciarsi e il CMS lo vede
   vuoto. data/radar.json invece resta un array nudo: non è gestito dal CMS
   (vedi commento in quel file), quindi non ha bisogno dello stesso wrapper. */
async function loadArticles() {
  const [articlesRes, radarRes] = await Promise.all([fetch("data/articles.json"), fetch("data/radar.json")]);

  if (!articlesRes.ok) throw new Error(`data/articles.json: HTTP ${articlesRes.status}`);
  if (!radarRes.ok) throw new Error(`data/radar.json: HTTP ${radarRes.status}`);

  const [articlesData, radar] = await Promise.all([articlesRes.json(), radarRes.json()]);
  ARTICLES = [...articlesData.articles, ...radar];
}

/* Messaggio d'errore leggibile, mostrato in cima a <body> su qualunque
   pagina se loadArticles() fallisce — non dipende dai contenitori
   specifici di ciascuna pagina (che restano invariati sotto: header, nav,
   footer continuano a funzionare normalmente). */
function showDataLoadError() {
  const banner = document.createElement("div");
  banner.className = "data-load-error";
  banner.setAttribute("role", "alert");
  banner.textContent = "Non è stato possibile caricare gli articoli di Panel Pixel. Controlla la connessione e ricarica la pagina.";
  document.body.prepend(banner);
}

function formatDateIT(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

function getCategoryName(slug) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  return cat ? cat.name : slug;
}

function getArticlesByCategory(slug) {
  return ARTICLES.filter((a) => a.category === slug).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function getArticleBySlug(slug) {
  return ARTICLES.find((a) => a.slug === slug);
}

function getTopRecentArticles(count) {
  return ARTICLES.slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, count);
}

/* Etichetta mostrata come tag categoria nella hero: stessa logica usata
   nelle intestazioni di articolo.html (recensione/monografia/radar hanno
   un'etichetta dedicata, notizia usa il nome della categoria). */
function getHeroTag(article) {
  switch (article.type) {
    case "recensione":
      return "Recensione";
    case "monografia":
      return "Monografia";
    case "radar":
      return article.rubricName || "Radar";
    case "notizia":
    default:
      return getCategoryName(article.category);
  }
}

function cardHTML(article) {
  return `
    <a class="card" href="articolo.html?slug=${encodeURIComponent(article.slug)}">
      <div class="card-media">
        <img src="${article.image}" alt="${article.title}" loading="lazy">
      </div>
      <div class="card-body">
        <p class="card-category">${getCategoryName(article.category)}</p>
        <h2 class="card-title">${article.title}</h2>
        <p class="card-excerpt">${article.excerpt}</p>
        <p class="card-meta"><time datetime="${article.date}">${formatDateIT(article.date)}</time> · A cura di ${article.author}</p>
      </div>
    </a>`;
}

/* ---- Rendering Home: hero a 3 colonne (sinistra: 3 mini, centro: articolo
   principale, destra: secondo articolo in evidenza), stile magazine ---- */
function heroMiniHTML(article) {
  return `
    <a class="hero-mini" href="articolo.html?slug=${encodeURIComponent(article.slug)}">
      <div class="hero-mini-media">
        <img src="${article.image}" alt="${article.title}" loading="lazy">
      </div>
      <div class="hero-mini-body">
        <h2 class="hero-mini-title">${article.title}</h2>
        <p class="hero-mini-excerpt">${article.excerpt}</p>
        <p class="hero-mini-author">A cura di ${article.author}</p>
      </div>
    </a>`;
}

function heroMainHTML(article) {
  return `
    <a class="hero-main" href="articolo.html?slug=${encodeURIComponent(article.slug)}">
      <div class="hero-main-media">
        <img src="${article.image}" alt="${article.title}" loading="lazy">
        <span class="hero-main-tag">${getHeroTag(article)}</span>
      </div>
      <div class="hero-main-meta-row">
        <time datetime="${article.date}">${formatDateIT(article.date)}</time>
        <span class="hero-main-comments">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16v11H8l-4 4V4z" stroke-linejoin="round" stroke-linecap="round"/></svg>
          0
        </span>
      </div>
      <h2 class="hero-main-title">${article.title}</h2>
      <p class="hero-main-excerpt">${article.excerpt}</p>
      <div class="hero-main-author">
        <img class="hero-main-avatar" src="assets/images/gianfranco-barry.jpg" alt="Foto di ${article.author}">
        <span>${article.author}</span>
      </div>
    </a>`;
}

function heroSideHTML(article) {
  return `
    <a class="hero-side" href="articolo.html?slug=${encodeURIComponent(article.slug)}">
      <div class="hero-side-media">
        <img src="${article.image}" alt="${article.title}" loading="lazy">
        <span class="hero-side-tag">${getHeroTag(article)}</span>
      </div>
      <h2 class="hero-side-title">${article.title}</h2>
      <p class="hero-side-author">A cura di ${article.author}</p>
    </a>`;
}

function renderMagazineHero() {
  const leftEl = document.getElementById("hero-left");
  const centerEl = document.getElementById("hero-center");
  const rightEl = document.getElementById("hero-right");
  if (!leftEl || !centerEl || !rightEl) return;

  const [main, side, ...minis] = getTopRecentArticles(5);

  centerEl.innerHTML = main ? heroMainHTML(main) : "";
  rightEl.innerHTML = side ? heroSideHTML(side) : "";
  leftEl.innerHTML = minis.map((a) => heroMiniHTML(a)).join("");
}

/* ---- Rendering Home: griglia unica sotto l'hero, categorie miste ----
   Mostra gli articoli più recenti (fino a 9), esclusi i 5 già mostrati
   nella hero sopra, per non ripeterli due volte nella stessa pagina. */
function renderHomepageGrid() {
  const container = document.getElementById("homepage-articles");
  if (!container) return;

  const heroSlugs = new Set(getTopRecentArticles(5).map((a) => a.slug));

  const articles = ARTICLES.filter((a) => !heroSlugs.has(a.slug))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 9);

  container.innerHTML = articles.map((a) => cardHTML(a)).join("");
}

/* ---- Rendering Home: sezione dedicata "Approfondimenti" ----
   Sezione a sé (titolo + griglia), separata dalla griglia mista "Ultimi
   articoli" sopra. Resta nascosta finché non c'è almeno un articolo con
   category "approfondimenti", per non mostrare una sezione vuota in home. */
function renderApprofondimentiSection() {
  const section = document.getElementById("approfondimenti-section");
  const container = document.getElementById("approfondimenti-articles");
  if (!section || !container) return;

  const articles = getArticlesByCategory("approfondimenti").slice(0, 3);

  if (articles.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  container.innerHTML = articles.map((a) => cardHTML(a)).join("");
}

/* ---- Ricerca articoli (home): filtra per titolo, categoria, autore ---- */
function normalizeSearchText(str) {
  // NFD scompone le lettere accentate in lettera-base + segno diacritico
  // separato; il replace toglie il segno diacritico (range Unicode dei
  // diacritici combinanti U+0300-U+036F), così "attualita" trova anche "Attualità".
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function searchArticles(query) {
  const q = normalizeSearchText(query.trim());
  if (!q) return [];
  return ARTICLES.filter((a) => {
    const haystack = normalizeSearchText(`${a.title} ${getCategoryName(a.category)} ${a.author}`);
    return haystack.includes(q);
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function renderSearchResults(query) {
  const resultsEl = document.getElementById("search-results");
  if (!resultsEl) return;

  const featuredEl = document.getElementById("magazine-hero");
  const sectionsEl = document.getElementById("homepage-grid");
  const q = query.trim();

  // ricerca vuota: torna alla home normale (In evidenza + griglia articoli)
  if (!q) {
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
    if (featuredEl) featuredEl.hidden = false;
    if (sectionsEl) sectionsEl.hidden = false;
    return;
  }

  if (featuredEl) featuredEl.hidden = true;
  if (sectionsEl) sectionsEl.hidden = true;
  resultsEl.hidden = false;

  const matches = searchArticles(q);

  if (matches.length === 0) {
    resultsEl.innerHTML = `<p class="empty-state">Nessun articolo trovato per "${escapeHTML(q)}".</p>`;
    return;
  }

  resultsEl.innerHTML = `
    <p class="search-results-count">${matches.length} articol${matches.length === 1 ? "o trovato" : "i trovati"}</p>
    <div class="card-grid">
      ${matches.map((a) => cardHTML(a)).join("")}
    </div>`;
}

function initSearch() {
  const input = document.getElementById("search-input");
  const clearBtn = document.getElementById("search-clear");
  if (!input) return;

  input.addEventListener("input", () => {
    const hasQuery = input.value.trim().length > 0;
    if (clearBtn) clearBtn.hidden = !hasQuery;
    renderSearchResults(input.value);
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      input.value = "";
      clearBtn.hidden = true;
      renderSearchResults("");
      input.focus();
    });
  }
}

/* ---- Rendering pagina di categoria (es. recensioni.html) ---- */
function renderCategoryPage() {
  const container = document.getElementById("category-list");
  if (!container) return;

  const slug = container.getAttribute("data-category");
  const titleEl = document.getElementById("category-page-title");
  const articles = getArticlesByCategory(slug);

  if (titleEl) titleEl.textContent = getCategoryName(slug);
  document.title = `${getCategoryName(slug)} — ${SITE.name}`;

  if (articles.length === 0) {
    container.innerHTML = `<p class="empty-state">Nessun articolo disponibile in questa categoria per ora.</p>`;
    return;
  }
  container.innerHTML = articles.map((a) => cardHTML(a)).join("");
}

/* ---- SEO pagina articolo: title, meta description, Open Graph, Twitter Card ---- */
function setMetaContent(id, value) {
  const el = document.getElementById(id);
  if (el) el.setAttribute("content", value);
}

function setLinkHref(id, value) {
  const el = document.getElementById(id);
  if (el) el.setAttribute("href", value);
}

// Taglia un testo a "maxLength" caratteri per la meta description, senza
// spezzare a metà una parola: tronca all'ultimo spazio utile e aggiunge "…".
// Se il testo è già abbastanza corto, lo restituisce invariato.
function truncateForSEO(text, maxLength) {
  maxLength = maxLength || 160;
  if (!text || text.length <= maxLength) return text || "";
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

function updateArticleSEO(article) {
  // Fallback: se seoTitle/seoDescription non sono compilati (nell'editor o
  // a mano in js/data.js), si generano da title/excerpt — la description
  // viene troncata a 160 caratteri per restare nel range consigliato
  // (140-160) per i motori di ricerca.
  const seoTitle = article.seoTitle || `${article.title} | ${SITE.name}`;
  const seoDescription = article.seoDescription || truncateForSEO(article.excerpt, 160);
  const imageUrl = `${SITE.url}/${article.image}`;
  const pageUrl = `${SITE.url}/articolo.html?slug=${encodeURIComponent(article.slug)}`;

  document.title = seoTitle;
  setMetaContent("meta-description", seoDescription);
  if (article.seoKeywords && article.seoKeywords.length > 0) {
    setMetaContent("meta-keywords", article.seoKeywords.join(", "));
  }

  setMetaContent("og-title", seoTitle);
  setMetaContent("og-description", seoDescription);
  setMetaContent("og-image", imageUrl);
  setMetaContent("og-url", pageUrl);

  setMetaContent("twitter-title", seoTitle);
  setMetaContent("twitter-description", seoDescription);
  setMetaContent("twitter-image", imageUrl);

  setLinkHref("canonical-link", pageUrl);

  // JSON-LD (schema.org Article): aiuta i motori di ricerca a capire che
  // questa pagina è un articolo e chi/quando l'ha pubblicato, oltre a
  // abilitare rich result come autore e data di pubblicazione nei risultati.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: seoDescription,
    image: [imageUrl],
    datePublished: article.date,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/assets/images/logo-icon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };
  const jsonLdEl = document.getElementById("article-jsonld");
  if (jsonLdEl) jsonLdEl.textContent = JSON.stringify(jsonLd);
}

/* ---- Layout pagina articolo: header/corpo variano in base a article.type ---- */

/* Etichetta categoria mostrata sopra il titolo. Stessa logica per tutti i
   tipi: recensione/monografia hanno un'etichetta fissa, radar usa il nome
   della rubrica, notizia usa il nome della categoria del sito. */
function getArticleHeaderLabel(article) {
  switch (article.type) {
    case "recensione":
      return "Recensione";
    case "monografia":
      return "Monografia";
    case "radar":
      return article.rubricName || "Radar";
    case "notizia":
    default:
      return getCategoryName(article.category);
  }
}

/* Header unico per tutti i tipi di articolo: etichetta categoria, titolo,
   (periodo per il radar), sottotitolo, linea divisoria. Prima ogni tipo
   aveva una propria funzione con markup leggermente diverso (titolo "sober"
   per monografia/notizia, niente sottotitolo per alcuni tipi); nel nuovo
   layout editoriale la struttura è la stessa per tutti, cambia solo il
   testo dell'etichetta. */
function renderArticleHeader(el, article) {
  const subtitle = article.type === "radar" ? (article.content && article.content.intro) || article.excerpt : article.excerpt;
  const period = article.type === "radar" && article.period ? `<p class="radar-period">${article.period}</p>` : "";

  el.innerHTML = `
    <p class="article-category"><a href="${article.category}.html">${getArticleHeaderLabel(article)}</a></p>
    <h1 class="article-title">${article.title}</h1>
    ${period}
    <p class="article-subtitle">${subtitle}</p>
    <div class="article-header-divider"></div>
  `;
}

/* Corpo articolo per recensione/monografia/notizia: content è un array di
   BLOCCHI, in ordine, ciascuno testo o immagine:
     - paragrafo: { type: "paragraph", heading?, text }
     - immagine:  { type: "image", src, alt?, caption? }
   Compatibile anche con i formati usati prima di avere i blocchi misti
   (stringa semplice = paragrafo; oggetto { heading?, text } senza "type" =
   paragrafo/sezione), così i contenuti scritti in precedenza continuano a
   funzionare senza doverli riscrivere. */
function renderContentBlocks(el, article) {
  el.innerHTML = article.content
    .map((block) => {
      if (typeof block === "string") {
        return `<p>${block}</p>`;
      }
      if (block.type === "image") {
        // Se il blocco non specifica un alt (campo opzionale nell'editor),
        // ripiega sul titolo dell'articolo invece di lasciarlo vuoto: meglio
        // un alt generico che nessun alt per un'immagine che porta contenuto
        // (non decorativa).
        const caption = block.caption ? `<figcaption>${block.caption}</figcaption>` : "";
        return `<figure class="article-inline-image"><img src="${block.src}" alt="${block.alt || article.title}" loading="lazy">${caption}</figure>`;
      }
      // Blocchi di intertitolo standalone generati dall'editor: h2 = titolo
      // di sezione, h3 = sottotitolo, e h3 dovrebbe comparire solo dopo un
      // h2 nello stesso articolo (mai subito dopo l'h1) per non saltare
      // livelli nella gerarchia degli heading. Non imposto questo vincolo
      // via codice: dipende dall'ordine in cui vengono aggiunti i blocchi
      // in fase di scrittura (editor o js/data.js). Il titolo dell'articolo
      // resta sempre e solo l'<h1> gestito dal template (renderArticleHeader),
      // qui non è mai possibile generare un h1.
      if (block.type === "h2") {
        return `<h2 class="article-heading">${block.text}</h2>`;
      }
      if (block.type === "h3") {
        return `<h3 class="article-subheading">${block.text}</h3>`;
      }
      if (block.type === "p") {
        return `<p>${block.text}</p>`;
      }
      // Formato precedente: paragrafo con intertitolo opzionale incorporato.
      const heading = block.heading ? `<h2 class="article-heading">${block.heading}</h2>` : "";
      return `${heading}<p>${block.text}</p>`;
    })
    .join("");
}

/* Elenco radar: content.items è un array di voci { title, creator, publisher, releaseInfo, why } */
function renderRadarList(el, article) {
  const items = (article.content && article.content.items) || [];
  el.innerHTML = items
    .map(
      (item, i) => `
    <li class="radar-item">
      <span class="radar-item-index">${String(i + 1).padStart(2, "0")}</span>
      <div class="radar-item-body">
        <h2 class="radar-item-title">${item.title}</h2>
        <p class="radar-item-meta">${[item.creator, item.publisher].filter(Boolean).join(" · ")}</p>
        <p class="radar-item-release">${item.releaseInfo}</p>
        <p class="radar-item-why">${item.why}</p>
      </div>
    </li>`
    )
    .join("");
}

function renderArticleFooterMeta(el, article) {
  const parts = [
    `Pubblicato il <time datetime="${article.date}">${formatDateIT(article.date)}</time>`,
    `A cura di ${article.author}`,
  ];
  if (article.triedOn) parts.push(`Provato su ${article.triedOn}`);
  el.innerHTML = `<p>${parts.join(" · ")}</p>`;
}

function renderSupportBox() {
  const el = document.getElementById("support-box");
  if (!el) return;
  el.innerHTML = `
    <p class="support-eyebrow">Sostieni Panel Pixel</p>
    <p class="support-text">Se questo articolo ti è piaciuto, il modo più utile per sostenerci è condividerlo con chi pensi possa apprezzarlo. Niente pubblicità invasiva, nessun paywall: solo lettori che si passano parola.</p>
    <a class="support-cta" href="chi-sono.html">Scopri chi c'è dietro Panel Pixel &rarr;</a>
  `;
}

function renderArticleLayout(article) {
  const headerEl = document.getElementById("article-header");
  const mediaEl = document.getElementById("article-media");
  const bodyEl = document.getElementById("article-body");
  const radarListEl = document.getElementById("radar-list");
  const footerMetaEl = document.getElementById("article-footer-meta");

  mediaEl.innerHTML = `<img src="${article.image}" alt="${article.title}">`;

  bodyEl.innerHTML = "";
  radarListEl.innerHTML = "";
  bodyEl.hidden = true;
  radarListEl.hidden = true;

  renderArticleHeader(headerEl, article);

  switch (article.type) {
    case "radar":
      renderRadarList(radarListEl, article);
      radarListEl.hidden = false;
      break;
    case "recensione":
    case "monografia":
    case "notizia":
    default:
      renderContentBlocks(bodyEl, article);
      bodyEl.hidden = false;
      break;
  }

  renderArticleFooterMeta(footerMetaEl, article);
  renderSupportBox();
}

/* ---- Commenti: integrazione con servizio esterno (Giscus) ----
   Nessun backend proprio: il widget si appoggia a Giscus (GitHub
   Discussions). Finché COMMENTS_CONFIG.enabled è false (vedi js/data.js),
   qui viene mostrato solo un messaggio placeholder e NON viene caricato
   alcuno script esterno. */
function renderComments(article) {
  const container = document.getElementById("giscus-container");
  if (!container) return;

  if (!COMMENTS_CONFIG.enabled) {
    container.innerHTML = `
      <p class="comments-placeholder">
        I commenti non sono ancora attivi su Panel Pixel: stiamo valutando
        ${COMMENTS_CONFIG.provider === "giscus" ? "Giscus" : COMMENTS_CONFIG.provider},
        un servizio esterno che non richiede un backend proprio. Torna a trovarci.
      </p>`;
    return;
  }

  // COMMENTS_CONFIG.enabled è true: crea lo script di Giscus e lo inserisce
  // nel container. "data-mapping" è "pathname" su richiesta esplicita — vedi
  // l'avviso sopra COMMENTS_CONFIG in js/data.js: dato che tutte le pagine
  // articolo condividono lo stesso indirizzo articolo.html?slug=... (la
  // query string non entra nel pathname), il risultato è che tutti gli
  // articoli del sito condividono la stessa discussione GitHub.
  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", COMMENTS_CONFIG.giscus.repo);
  script.setAttribute("data-repo-id", COMMENTS_CONFIG.giscus.repoId);
  script.setAttribute("data-category", COMMENTS_CONFIG.giscus.category);
  script.setAttribute("data-category-id", COMMENTS_CONFIG.giscus.categoryId);
  script.setAttribute("data-mapping", "pathname");
  script.setAttribute("data-strict", "0");
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "bottom");
  script.setAttribute("data-theme", "preferred_color_scheme");
  script.setAttribute("data-lang", "it");

  container.innerHTML = "";
  container.appendChild(script);
}

/* ---- Sidebar "Da leggere dopo": scelta degli articoli correlati ----
   Criterio: prima gli articoli della stessa categoria (esclusa la corrente).
   Se non bastano a riempire "limit" posti, si completa con gli articoli che
   condividono più parole chiave SEO (seoKeywords) con quello corrente — e a
   parità di parole chiave condivise, quelli dello stesso "type" — sempre
   escludendo l'articolo che si sta leggendo. */
function getRelatedArticles(article, limit) {
  limit = limit || 3;

  const sameCategory = getArticlesByCategory(article.category).filter((a) => a.slug !== article.slug);

  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }

  const excludeSlugs = new Set([article.slug, ...sameCategory.map((a) => a.slug)]);
  const articleKeywords = (article.seoKeywords || []).map((k) => k.toLowerCase());

  const bySimilarity = ARTICLES.filter((a) => !excludeSlugs.has(a.slug))
    .map((a) => {
      const otherKeywords = (a.seoKeywords || []).map((k) => k.toLowerCase());
      const sharedKeywords = articleKeywords.filter((k) => otherKeywords.includes(k)).length;
      const sameType = a.type === article.type ? 1 : 0;
      return { article: a, score: sharedKeywords * 2 + sameType };
    })
    .sort((a, b) => b.score - a.score || (a.article.date < b.article.date ? 1 : -1))
    .map((entry) => entry.article);

  return [...sameCategory, ...bySimilarity].slice(0, limit);
}

/* "Da leggere dopo": sezione a piè di pagina (non più sidebar laterale),
   riusa la card standard cardHTML() già usata in home/categorie, per
   coerenza visiva col resto del sito. */
function renderReadNext(article) {
  const sectionEl = document.getElementById("read-next");
  const listEl = document.getElementById("read-next-list");
  if (!sectionEl || !listEl) return;

  const related = getRelatedArticles(article, 3);

  if (related.length === 0) {
    sectionEl.hidden = true;
    return;
  }

  sectionEl.hidden = false;
  listEl.innerHTML = related.map((a) => cardHTML(a)).join("");
}

/* ---- Breadcrumb pagina articolo: Home / Categoria / Titolo ----
   Aggiorna sia il markup visibile (#breadcrumb-list, popolato qui sotto)
   sia il JSON-LD schema.org BreadcrumbList corrispondente (vedi il
   placeholder #breadcrumb-jsonld in articolo.html), così i due restano
   sempre sincronizzati con l'articolo caricato. */
function renderBreadcrumbs(article) {
  const categoryName = getCategoryName(article.category);
  const categoryUrl = `${SITE.url}/${article.category}.html`;
  const pageUrl = `${SITE.url}/articolo.html?slug=${encodeURIComponent(article.slug)}`;

  const listEl = document.getElementById("breadcrumb-list");
  if (listEl) {
    listEl.innerHTML = `
      <li><a href="index.html">Home</a></li>
      <li><a href="${article.category}.html">${categoryName}</a></li>
      <li aria-current="page">${article.title}</li>
    `;
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/index.html` },
      { "@type": "ListItem", position: 2, name: categoryName, item: categoryUrl },
      { "@type": "ListItem", position: 3, name: article.title, item: pageUrl },
    ],
  };
  const jsonLdEl = document.getElementById("breadcrumb-jsonld");
  if (jsonLdEl) jsonLdEl.textContent = JSON.stringify(breadcrumbJsonLd);
}

/* ---- Rendering pagina singolo articolo (articolo.html) ---- */
function renderArticlePage() {
  const container = document.getElementById("article-content");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const article = getArticleBySlug(slug);

  if (!article) {
    container.innerHTML = `
      <p class="empty-state">Articolo non trovato. <a href="index.html">Torna alla home</a>.</p>`;
    return;
  }

  updateArticleSEO(article);
  renderBreadcrumbs(article);
  renderArticleLayout(article);
  renderComments(article);
  renderReadNext(article);
}

/* ---- Header: nome sito, tagline, menu mobile, link attivo ---- */
function initHeader() {
  document.querySelectorAll("[data-site-name]").forEach((el) => (el.textContent = SITE.name));
  document.querySelectorAll("[data-site-tagline]").forEach((el) => (el.textContent = SITE.tagline));

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) link.classList.add("is-active");
  });
}

/* ---- Header che si nasconde scorrendo verso il basso, riappare scorrendo
   verso l'alto (o vicino alla cima della pagina). Aggiunge/rimuove solo la
   classe "header-hidden": design, logo e menu restano invariati, cambia
   solo la posizione verticale (vedi .site-header.header-hidden in
   css/style.css). Attivo su tutte le pagine, desktop e mobile allo stesso
   modo (nessuna differenza legata alla larghezza dello schermo). */
function initHeaderScrollHide() {
  const header = document.querySelector(".site-header");
  const nav = document.getElementById("primary-nav");
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;
  const hideThreshold = 80; // vicino alla cima: l'header resta sempre visibile

  function onScroll() {
    const currentScrollY = window.scrollY;
    const navOpen = nav && nav.classList.contains("is-open");

    if (navOpen) {
      // non nascondere l'header mentre il menu mobile è aperto
    } else if (currentScrollY <= hideThreshold) {
      header.classList.remove("header-hidden");
    } else if (currentScrollY > lastScrollY) {
      header.classList.add("header-hidden");
    } else if (currentScrollY < lastScrollY) {
      header.classList.remove("header-hidden");
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  // Header/nav non dipendono dagli articoli: si inizializzano subito, così
  // restano utilizzabili anche se il caricamento degli articoli fallisce.
  initHeader();
  initHeaderScrollHide();

  try {
    await loadArticles();
  } catch (err) {
    console.error("Impossibile caricare gli articoli:", err);
    showDataLoadError();
    return;
  }

  renderMagazineHero();
  renderHomepageGrid();
  renderApprofondimentiSection();
  initSearch();
  renderCategoryPage();
  renderArticlePage();
});
