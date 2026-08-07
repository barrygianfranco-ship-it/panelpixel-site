/* ==========================================================================
   Panel Pixel — logica di rendering
   Legge i dati da js/data.js e popola le pagine in base ai contenitori
   presenti nell'HTML. Non serve toccare questo file per aggiungere articoli.
   ========================================================================== */

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
        <h3 class="card-title">${article.title}</h3>
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
        <h3 class="hero-mini-title">${article.title}</h3>
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
        <img class="hero-main-avatar" src="assets/images/gianfranco-barry.jpg" alt="">
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
      <h3 class="hero-side-title">${article.title}</h3>
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
}

/* ---- Layout pagina articolo: header/corpo variano in base a article.type ---- */

function renderRecensioneHeader(el, article) {
  el.innerHTML = `
    <p class="article-category"><a href="${article.category}.html">Recensione</a></p>
    <h1 class="article-title">${article.title}</h1>
    <p class="article-subtitle">${article.excerpt}</p>
  `;
}

function renderMonografiaHeader(el, article) {
  el.innerHTML = `
    <p class="article-category"><a href="${article.category}.html">Monografia</a></p>
    <h1 class="article-title article-title--sober">${article.title}</h1>
  `;
}

function renderNotiziaHeader(el, article) {
  el.innerHTML = `
    <p class="article-category"><a href="${article.category}.html">${getCategoryName(article.category)}</a></p>
    <h1 class="article-title article-title--sober">${article.title}</h1>
  `;
}

function renderRadarHeader(el, article) {
  const intro = (article.content && article.content.intro) || article.excerpt;
  el.innerHTML = `
    <p class="article-category"><a href="${article.category}.html">${article.rubricName || "Radar"}</a></p>
    <h1 class="article-title">${article.title}</h1>
    ${article.period ? `<p class="radar-period">${article.period}</p>` : ""}
    <p class="article-subtitle">${intro}</p>
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
        const caption = block.caption ? `<figcaption>${block.caption}</figcaption>` : "";
        return `<figure class="article-inline-image"><img src="${block.src}" alt="${block.alt || ""}" loading="lazy">${caption}</figure>`;
      }
      // Blocchi di intertitolo standalone generati dall'editor: h2 = titolo
      // di sezione, h3 = sottotitolo. Il titolo dell'articolo resta sempre
      // e solo l'<h1> gestito dal template (renderRecensioneHeader ecc.),
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
        <h3 class="radar-item-title">${item.title}</h3>
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

  switch (article.type) {
    case "radar":
      renderRadarHeader(headerEl, article);
      renderRadarList(radarListEl, article);
      radarListEl.hidden = false;
      break;
    case "recensione":
      renderRecensioneHeader(headerEl, article);
      renderContentBlocks(bodyEl, article);
      bodyEl.hidden = false;
      break;
    case "monografia":
      renderMonografiaHeader(headerEl, article);
      renderContentBlocks(bodyEl, article);
      bodyEl.hidden = false;
      break;
    case "notizia":
    default:
      renderNotiziaHeader(headerEl, article);
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

/* Card compatta per la sidebar: immagine piccola, categoria, titolo, data
   (niente excerpt/autore, a differenza della card standard cardHTML). */
function sidebarCardHTML(article) {
  return `
    <a class="sidebar-card" href="articolo.html?slug=${encodeURIComponent(article.slug)}">
      <div class="sidebar-card-media">
        <img src="${article.image}" alt="${article.title}" loading="lazy">
      </div>
      <div class="sidebar-card-body">
        <p class="sidebar-card-category">${getCategoryName(article.category)}</p>
        <h3 class="sidebar-card-title">${article.title}</h3>
        <p class="sidebar-card-date"><time datetime="${article.date}">${formatDateIT(article.date)}</time></p>
      </div>
    </a>`;
}

function renderRelatedSidebar(article) {
  const sidebarEl = document.getElementById("sidebar-related");
  if (!sidebarEl) return;

  const related = getRelatedArticles(article, 3);

  if (related.length === 0) {
    sidebarEl.innerHTML = "";
    return;
  }

  sidebarEl.innerHTML = `
    <h2 class="sidebar-title">Da leggere dopo</h2>
    <div class="sidebar-list">
      ${related.map((a) => sidebarCardHTML(a)).join("")}
    </div>`;
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
  renderArticleLayout(article);
  renderComments(article);
  renderRelatedSidebar(article);
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

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  renderMagazineHero();
  renderHomepageGrid();
  initSearch();
  renderCategoryPage();
  renderArticlePage();
});
