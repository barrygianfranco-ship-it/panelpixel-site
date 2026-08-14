/* ==========================================================================
   Panel Pixel — logica di rendering [COPIA DI TEST, fase 3 Storyblok]
   Copia di js/main.js (quello vero) con ESATTAMENTE due modifiche,
   segnalate qui sotto con "MODIFICA TEST" — tutto il resto è identico
   all'originale, non è stato toccato apposta: qualunque differenza di
   comportamento va isolata a quelle due funzioni, non al resto del
   rendering (header, hero, card, ricerca, SEO, breadcrumb, tema colore).
   ========================================================================== */

let ARTICLES = [];

// MODIFICA TEST 1 di 2: legge da Storyblok (fetchStoryblokArticles, in
// storyblok-richtext.js) invece che da data/articles.json + data/radar.json.
// Le rubriche "radar" non esistono ancora su Storyblok in questa fase,
// quindi qui ARTICLES contiene solo articoli "normali".
async function loadArticles() {
  ARTICLES = await fetchStoryblokArticles();
}

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
        <img class="hero-main-avatar" src="../assets/images/gianfranco-barry.jpg" alt="Foto di ${article.author}">
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

function renderHomepageGrid() {
  const container = document.getElementById("homepage-articles");
  if (!container) return;

  const heroSlugs = new Set(getTopRecentArticles(5).map((a) => a.slug));

  const articles = ARTICLES.filter((a) => !heroSlugs.has(a.slug))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 9);

  container.innerHTML = articles.map((a) => cardHTML(a)).join("");
}

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

function normalizeSearchText(str) {
  return str
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

function setMetaContent(id, value) {
  const el = document.getElementById(id);
  if (el) el.setAttribute("content", value);
}

function setLinkHref(id, value) {
  const el = document.getElementById(id);
  if (el) el.setAttribute("href", value);
}

function truncateForSEO(text, maxLength) {
  maxLength = maxLength || 160;
  if (!text || text.length <= maxLength) return text || "";
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

function updateArticleSEO(article) {
  const seo = article.seo || {};
  const seoTitle = seo.seoTitle || article.seoTitle || `${article.title} | ${SITE.name}`;
  const seoDescription = seo.seoDescription || article.seoDescription || truncateForSEO(article.excerpt, 160);
  const imageUrl = `${SITE.url}/${article.image.replace(/^\//, "")}`;
  const pageUrl = `${SITE.url}/articolo.html?slug=${encodeURIComponent(article.slug)}`;

  document.title = seoTitle;
  setMetaContent("meta-description", seoDescription);
  const seoKeywords = seo.seoKeywords || article.seoKeywords;
  if (seoKeywords && seoKeywords.length > 0) {
    setMetaContent("meta-keywords", seoKeywords.join(", "));
  }

  setMetaContent("og-title", seoTitle);
  setMetaContent("og-description", seoDescription);
  setMetaContent("og-image", imageUrl);
  setMetaContent("og-url", pageUrl);

  setMetaContent("twitter-title", seoTitle);
  setMetaContent("twitter-description", seoDescription);
  setMetaContent("twitter-image", imageUrl);

  setLinkHref("canonical-link", pageUrl);

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

function renderContentBlocks(el, article) {
  el.innerHTML = article.content
    .map((block) => {
      if (typeof block === "string") {
        return `<p>${block}</p>`;
      }
      if (block.type === "image") {
        const caption = block.caption ? `<figcaption>${block.caption}</figcaption>` : "";
        return `<figure class="article-inline-image"><img src="${block.src}" alt="${block.alt || article.title}" loading="lazy">${caption}</figure>`;
      }
      if (block.type === "h2") {
        return `<h2 class="article-heading">${block.text}</h2>`;
      }
      if (block.type === "h3") {
        return `<h3 class="article-subheading">${block.text}</h3>`;
      }
      if (block.type === "p") {
        return `<p>${block.text}</p>`;
      }
      const heading = block.heading ? `<h2 class="article-heading">${block.heading}</h2>` : "";
      return `${heading}<p>${block.text}</p>`;
    })
    .join("");
}

// MODIFICA TEST 2 di 2: article.content qui è già HTML pronto (convertito
// da storyblokRichtextToHtml() dentro l'adapter, vedi storyblok-richtext.js),
// non più markdown grezzo — quindi niente marked.parse(), solo assegnazione
// diretta. marked.js e js/markdown-components.js non sono nemmeno caricati
// in questa pagina di test (vedi <script> in articolo.html di questa cartella).
function renderMarkdownBody(el, article) {
  el.innerHTML = article.content;
}

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

function applyArticleTheme(article) {
  const wrapEl = document.getElementById("article-content");
  if (!wrapEl) return;

  wrapEl.style.removeProperty("--article-bg");
  wrapEl.style.removeProperty("--article-accent");
  wrapEl.style.removeProperty("--article-text");

  const theme = article.theme;
  if (!theme) return;

  if (theme.background) wrapEl.style.setProperty("--article-bg", theme.background);
  if (theme.accent) wrapEl.style.setProperty("--article-accent", theme.accent);
  if (theme.testoChiaro) wrapEl.style.setProperty("--article-text", "var(--color-bg)");
}

function renderArticleLayout(article) {
  const headerEl = document.getElementById("article-header");
  const mediaEl = document.getElementById("article-media");
  const bodyEl = document.getElementById("article-body");
  const radarListEl = document.getElementById("radar-list");
  const footerMetaEl = document.getElementById("article-footer-meta");

  applyArticleTheme(article);

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
      if (Array.isArray(article.content)) {
        renderContentBlocks(bodyEl, article);
      } else {
        renderMarkdownBody(bodyEl, article);
      }
      bodyEl.hidden = false;
      break;
  }

  renderArticleFooterMeta(footerMetaEl, article);
  renderSupportBox();
}

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

function getSeoKeywords(article) {
  return ((article.seo && article.seo.seoKeywords) || article.seoKeywords || []).map((k) => k.toLowerCase());
}

function getRelatedArticles(article, limit) {
  limit = limit || 3;

  const sameCategory = getArticlesByCategory(article.category).filter((a) => a.slug !== article.slug);

  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }

  const excludeSlugs = new Set([article.slug, ...sameCategory.map((a) => a.slug)]);
  const articleKeywords = getSeoKeywords(article);

  const bySimilarity = ARTICLES.filter((a) => !excludeSlugs.has(a.slug))
    .map((a) => {
      const otherKeywords = getSeoKeywords(a);
      const sharedKeywords = articleKeywords.filter((k) => otherKeywords.includes(k)).length;
      const sameType = a.type === article.type ? 1 : 0;
      return { article: a, score: sharedKeywords * 2 + sameType };
    })
    .sort((a, b) => b.score - a.score || (a.article.date < b.article.date ? 1 : -1))
    .map((entry) => entry.article);

  return [...sameCategory, ...bySimilarity].slice(0, limit);
}

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

function initAccountNavLink() {
  const links = document.querySelectorAll(".nav-link-account");
  if (!links.length || !window.netlifyIdentity) return;

  const reveal = (user) => {
    if (!user) return;
    links.forEach((link) => link.classList.add("is-visible"));
  };

  reveal(window.netlifyIdentity.currentUser());
  window.netlifyIdentity.on("init", reveal);
}

function initHeaderScrollHide() {
  const header = document.querySelector(".site-header");
  const nav = document.getElementById("primary-nav");
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;
  const hideThreshold = 80;

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
  initHeader();
  initHeaderScrollHide();
  initAccountNavLink();

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
