/* ==========================================================================
   Panel Pixel — logica di rendering
   ========================================================================== */

let ARTICLES = [];

// Legge da Storyblok (fetchStoryblokArticles, in js/storyblok-richtext.js).
// Le rubriche "radar" non esistono ancora su Storyblok, quindi qui
// ARTICLES contiene solo articoli "normali".
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
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(String(iso || ""));
  if (!match) return "Data non disponibile";
  const [, year, month, day] = match.map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return "Data non disponibile";
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
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

function authorCreditHTML(name, className) {
  const safeName = escapeHTML(String(name || ""));
  const author = typeof getAuthorByName === "function" ? getAuthorByName(name) : null;
  const cssClass = className || "author-link";

  if (!author) return `<span class="${cssClass}">${safeName}</span>`;
  return `<a class="${cssClass}" href="autore.html?nome=${encodeURIComponent(author.slug)}">${safeName}</a>`;
}

function cardHTML(article) {
  const href = `articolo.html?slug=${encodeURIComponent(article.slug)}`;
  return `
    <article class="card">
      <a class="card-media" href="${href}" aria-label="${article.title}">
        <img src="${article.image}" alt="${article.title}" loading="lazy">
      </a>
      <div class="card-body">
        <p class="card-category">${getCategoryName(article.category)}</p>
        <h2 class="card-title"><a href="${href}">${article.title}</a></h2>
        <p class="card-excerpt">${article.excerpt}</p>
        <p class="card-meta"><time datetime="${article.date}">${formatDateIT(article.date)}</time> · A cura di ${authorCreditHTML(article.author, "author-link")}</p>
      </div>
    </article>`;
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
        <img class="hero-main-avatar" src="${getAuthorAvatar(article.author)}" alt="Foto di ${article.author}">
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

// La home presenta una storia in evidenza e le altre senza duplicazioni.
function getHomepageLead() {
  const sorted = getTopRecentArticles(ARTICLES.length);
  return sorted.find((article) => article.featured) || sorted[0];
}

function editorialStoryHTML(article, lead = false) {
  const href = "articolo.html?slug=" + encodeURIComponent(article.slug);
  const safe = (value) => escapeHTML(String(value || "")).replace(/"/g, "&quot;");
  return `<article class="editorial-story${lead ? " editorial-story--lead" : ""}">
    <a class="editorial-image" href="${href}" aria-label="${safe(article.title)}">
      <img src="${safe(article.image)}" alt="${safe(article.title)}" ${lead ? 'fetchpriority="high"' : 'loading="lazy"'}>
    </a>
    <p class="editorial-category">${safe(getCategoryName(article.category))}</p>
    <h2 class="editorial-title"><a href="${href}">${safe(article.title)}</a></h2>
    <p class="editorial-excerpt">${safe(article.excerpt)}</p>
    <p class="editorial-byline">Di ${authorCreditHTML(article.author, "author-link")}</p>
  </article>`;
}

function renderMagazineHero() {
  const section = document.getElementById("magazine-hero");
  const container = document.getElementById("hero-center");
  if (!section || !container) return;
  const lead = getHomepageLead();
  section.hidden = !lead;
  container.innerHTML = lead ? editorialStoryHTML(lead, true) : "";
}

function renderHomepageGrid() {
  const section = document.getElementById("homepage-grid");
  const container = document.getElementById("homepage-articles");
  if (!section || !container) return;
  const lead = getHomepageLead();
  const articles = getTopRecentArticles(ARTICLES.length).filter((a) => a.slug !== lead?.slug);
  section.hidden = articles.length === 0;
  container.innerHTML = articles.map((a) => editorialStoryHTML(a)).join("");
}

function renderApprofondimentiSection() {
  const section = document.getElementById("approfondimenti-section");
  const container = document.getElementById("approfondimenti-articles");
  if (!section || !container) return;

  const shownOnHome = document.body.classList.contains("editorial-home");
  const articles = shownOnHome ? [] : getArticlesByCategory("approfondimenti").slice(0, 3);

  if (articles.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  container.innerHTML = articles.map((a) => cardHTML(a)).join("");
}

function normalizeSearchText(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Evidenzia la query conservando accenti e maiuscole del testo originale.
function highlightSearchMatch(value, query) {
  const text = String(value || "");
  const needle = normalizeSearchText(query.trim());
  if (!needle) return escapeHTML(text);

  let normalized = "";
  const sourceIndex = [];
  Array.from(text).forEach((character, index) => {
    const part = normalizeSearchText(character);
    normalized += part;
    for (let i = 0; i < part.length; i += 1) sourceIndex.push(index);
  });

  const ranges = [];
  let from = 0;
  let matchIndex = normalized.indexOf(needle, from);
  while (matchIndex !== -1) {
    const start = sourceIndex[matchIndex];
    const end = sourceIndex[matchIndex + needle.length - 1] + 1;
    ranges.push([start, end]);
    from = matchIndex + needle.length;
    matchIndex = normalized.indexOf(needle, from);
  }
  if (!ranges.length) return escapeHTML(text);

  let html = "";
  let cursor = 0;
  ranges.forEach(([start, end]) => {
    html += escapeHTML(text.slice(cursor, start));
    html += `<mark>${escapeHTML(text.slice(start, end))}</mark>`;
    cursor = end;
  });
  return html + escapeHTML(text.slice(cursor));
}

function searchArticles(query) {
  const q = normalizeSearchText(query.trim());
  if (!q) return [];
  return ARTICLES.filter((article) => {
    const haystack = normalizeSearchText(
      `${article.title} ${article.excerpt || ""} ${getCategoryName(article.category)} ${article.author || ""}`
    );
    return haystack.includes(q);
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function searchResultHTML(article, query) {
  const href = `articolo.html?slug=${encodeURIComponent(article.slug)}`;
  const title = highlightSearchMatch(article.title, query);
  const excerpt = highlightSearchMatch(article.excerpt || "", query);
  const category = highlightSearchMatch(getCategoryName(article.category), query);
  const author = highlightSearchMatch(article.author || "", query);

  return `<article class="search-result-item">
    <a class="search-result-media" href="${href}" aria-label="${escapeHTML(article.title)}">
      <img src="${escapeHTML(article.image)}" alt="" loading="lazy">
    </a>
    <div class="search-result-copy">
      <p class="search-result-eyebrow"><span>${category}</span><time datetime="${escapeHTML(article.date)}">${formatDateIT(article.date)}</time></p>
      <h2><a href="${href}">${title}</a></h2>
      <p class="search-result-excerpt">${excerpt}</p>
      <p class="search-result-author">Di ${author}</p>
    </div>
  </article>`;
}

function resetSearch(input, clearBtn) {
  input.value = "";
  if (clearBtn) clearBtn.hidden = true;
  renderSearchResults("");
  input.focus();
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
    renderMagazineHero();
    renderHomepageGrid();
    return;
  }

  if (featuredEl) featuredEl.hidden = true;
  if (sectionsEl) sectionsEl.hidden = true;
  resultsEl.hidden = false;

  const matches = searchArticles(q);
  const countLabel = `${matches.length} articol${matches.length === 1 ? "o" : "i"}`;
  resultsEl.innerHTML = `<section class="search-results-panel" aria-labelledby="search-results-title">
    <header class="search-results-header">
      <div>
        <p class="search-results-kicker">Archivio Panel Pixel</p>
        <h1 id="search-results-title">Risultati per “${escapeHTML(q)}”</h1>
      </div>
      <p class="search-results-count" aria-live="polite">${countLabel}</p>
    </header>
    ${matches.length
      ? `<div class="search-results-list">${matches.map((article) => searchResultHTML(article, q)).join("")}</div>`
      : `<div class="search-empty">
          <p class="search-empty-title">Nessun articolo trovato</p>
          <p>Prova con un titolo, una categoria o il nome di un autore.</p>
          <button type="button" class="search-reset" data-search-reset>Azzera la ricerca</button>
        </div>`}
  </section>`;

  const resetBtn = resultsEl.querySelector("[data-search-reset]");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const input = document.getElementById("search-input");
      const clearBtn = document.getElementById("search-clear");
      if (input) resetSearch(input, clearBtn);
    });
  }
}

function initSearch() {
  const input = document.getElementById("search-input");
  const clearBtn = document.getElementById("search-clear");
  if (!input) return;

  input.setAttribute("aria-keyshortcuts", "/");
  input.setAttribute("aria-controls", "search-results");

  input.addEventListener("input", () => {
    const hasQuery = input.value.trim().length > 0;
    if (clearBtn) clearBtn.hidden = !hasQuery;
    renderSearchResults(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && input.value) {
      event.preventDefault();
      resetSearch(input, clearBtn);
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => resetSearch(input, clearBtn));
  }

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isEditing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
    if (event.key === "/" && !isEditing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      input.focus();
      input.select();
    }
  });
}
function renderCategoryPage() {
  const container = document.getElementById("category-list");
  if (!container) return;

  const slug = container.getAttribute("data-category");
  const titleEl = document.getElementById("category-page-title");
  const articles = getArticlesByCategory(slug);
  const pageHero = titleEl && titleEl.closest(".page-hero");
  let countEl = document.getElementById("category-article-count");

  if (titleEl) titleEl.textContent = getCategoryName(slug);
  document.title = `${getCategoryName(slug)} — ${SITE.name}`;

  if (pageHero && !countEl) {
    countEl = document.createElement("p");
    countEl.id = "category-article-count";
    countEl.className = "category-article-count";
    pageHero.appendChild(countEl);
  }
  if (countEl) {
    countEl.textContent = `${articles.length} ${articles.length === 1 ? "articolo" : "articoli"}`;
  }

  if (articles.length === 0) {
    container.innerHTML = `<p class="empty-state">Nessun articolo disponibile in questa categoria per ora.</p>`;
    return;
  }

  if (!document.body.classList.contains("editorial-category-page")) {
    container.innerHTML = articles.map((a) => cardHTML(a)).join("");
    return;
  }

  const [lead, ...archive] = articles;
  container.innerHTML = `
    <section class="category-lead" aria-label="Articolo in evidenza">
      <p class="category-section-kicker">In primo piano</p>
      ${editorialStoryHTML(lead, true)}
    </section>
    ${archive.length ? `
      <section class="category-archive" aria-label="Archivio della categoria">
        <div class="category-archive-heading">
          <h2>Archivio</h2>
          <span>${archive.length} ${archive.length === 1 ? "articolo" : "articoli"}</span>
        </div>
        <div class="category-archive-grid">
          ${archive.map((article) => editorialStoryHTML(article)).join("")}
        </div>
      </section>` : ""}
  `;
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
    <p class="article-byline">di ${authorCreditHTML(article.author, "author-link")}</p>
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

// article.content è già HTML pronto (convertito da storyblokRichtextToHtml()
// dentro l'adapter, vedi js/storyblok-richtext.js), non markdown grezzo.
function renderMarkdownBody(el, article) {
  el.innerHTML = article.content;
}

/* ---- Indice automatico degli articoli lunghi. Usa gli H2/H3 già
   presenti nel corpo e non modifica i contenuti salvati su Storyblok. ---- */
function renderArticleToc(bodyEl) {
  const contentInner = bodyEl && bodyEl.parentElement;
  if (!contentInner) return;

  const previousToc = contentInner.querySelector(".article-toc");
  if (previousToc) previousToc.remove();

  const headings = Array.from(bodyEl.querySelectorAll("h2, h3"));
  if (headings.length < 3) return;

  const usedIds = new Set();
  headings.forEach((heading, index) => {
    let baseId = heading.id || heading.textContent
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `sezione-${index + 1}`;
    let uniqueId = baseId;
    let suffix = 2;
    while (usedIds.has(uniqueId) || (document.getElementById(uniqueId) && document.getElementById(uniqueId) !== heading)) {
      uniqueId = `${baseId}-${suffix++}`;
    }
    heading.id = uniqueId;
    usedIds.add(uniqueId);
  });

  const nav = document.createElement("nav");
  nav.className = "article-toc";
  nav.setAttribute("aria-label", "Indice dell'articolo");

  const details = document.createElement("details");
  details.className = "article-toc-details";
  details.open = !window.matchMedia("(max-width: 640px)").matches;

  const summary = document.createElement("summary");
  summary.className = "article-toc-title";
  summary.textContent = "In questo articolo";

  const list = document.createElement("ol");
  list.className = "article-toc-list";
  headings.forEach((heading) => {
    const item = document.createElement("li");
    item.className = heading.tagName === "H3" ? "article-toc-item article-toc-item--sub" : "article-toc-item";
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();
    item.appendChild(link);
    list.appendChild(item);
  });

  details.append(summary, list);
  nav.appendChild(details);
  contentInner.insertBefore(nav, bodyEl);
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
    `A cura di ${authorCreditHTML(article.author, "author-link")}`,
  ];
  if (article.triedOn) parts.push(`Provato su ${article.triedOn}`);
  const keywords = getSeoKeywords(article);
  const paths = keywords.length ? `<div class="article-paths"><span>In questo percorso</span>${keywords.slice(0, 5).map((keyword) => `<a href="archivio.html?q=${encodeURIComponent(keyword)}">${escapeHTML(keyword)}</a>`).join("")}</div>` : "";
  el.innerHTML = `<p>${parts.join(" · ")}</p>${paths}`;
}

function renderSupportBox(article) {
  const el = document.getElementById("support-box");
  if (!el) return;
  el.innerHTML = `
    <p class="support-eyebrow">Sostieni Panel Pixel</p>
    <p class="support-text">Se questo articolo ti è piaciuto, il modo più utile per sostenerci è condividerlo con chi pensi possa apprezzarlo. Niente pubblicità invasiva, nessun paywall: solo lettori che si passano parola.</p>
    <div class="share-actions" aria-label="Condividi questo articolo">
      <button type="button" class="share-button share-button--primary" data-share-native>Condividi</button>
      <button type="button" class="share-button" data-share-copy>Copia il link</button>
    </div>
    <p class="share-feedback" role="status" aria-live="polite"></p>
    <a class="support-cta" href="chi-sono.html">Scopri chi c'è dietro Panel Pixel &rarr;</a>
  `;
  const url = SITE.url + "/articolo.html?slug=" + encodeURIComponent(article.slug);
  const feedback = el.querySelector(".share-feedback");
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      feedback.textContent = "Link copiato.";
    } catch (_) {
      window.prompt("Copia questo link:", url);
    }
  };
  el.querySelector("[data-share-copy]").addEventListener("click", copyLink);
  el.querySelector("[data-share-native]").addEventListener("click", async () => {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title: article.title, text: article.excerpt, url });
    } catch (error) {
      if (error.name !== "AbortError") copyLink();
    }
  });
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

  mediaEl.innerHTML = `<img src="${article.image}" alt="${article.title}" fetchpriority="high" decoding="async">`;

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

  renderArticleToc(bodyEl);
  renderArticleFooterMeta(footerMetaEl, article);
  renderSupportBox(article);
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

// Markup originale (statico, da articolo.html) del contenitore #article-content,
// salvato la prima volta che renderArticlePage() gira. Serve a ripristinare
// gli elementi interni (#article-header, #article-media, ecc.) se un
// rendering precedente li ha cancellati mostrando "Articolo non trovato"
// (che sovrascrive container.innerHTML con un semplice messaggio) — capita
// tipicamente nell'anteprima Storyblok: il primo giro trova solo la
// versione pubblicata (magari non ancora esistente), il secondo giro
// (via bridge, con la bozza) deve invece poter ricostruire il layout vero.
let articleContentTemplate = null;

function renderArticlePage() {
  const container = document.getElementById("article-content");
  if (!container) return;

  if (articleContentTemplate === null) {
    articleContentTemplate = container.innerHTML;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const article = getArticleBySlug(slug);

  if (!article) {
    container.innerHTML = `
      <p class="empty-state">Articolo non trovato. <a href="index.html">Torna alla home</a>.</p>`;
    return;
  }

  if (!document.getElementById("article-header")) {
    container.innerHTML = articleContentTemplate;
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

/* ---- Anteprima live nel Visual Editor di Storyblok. Si attiva SOLO se
   l'URL contiene "_storyblok" (parametro che Storyblok imposta da solo
   quando apre la pagina dentro l'editor, per far capire allo script che
   è dentro l'iframe di anteprima) — per i visitatori normali questa
   funzione esce subito al primo controllo e non scarica né esegue
   nulla in più. Quando attiva, sostituisce l'articolo corrente
   (identificato dal solito parametro "slug" già usato da questa
   pagina) con la sua bozza, e si aggiorna a ogni modifica fatta
   nell'editor tramite il bridge ufficiale di Storyblok. ---- */
function isStoryblokPreview() {
  return new URLSearchParams(window.location.search).has("_storyblok");
}

function loadStoryblokBridgeScript() {
  return new Promise((resolve, reject) => {
    if (window.StoryblokBridge) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://app.storyblok.com/f/storyblok-v2-latest.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Impossibile caricare lo script bridge di Storyblok."));
    document.head.appendChild(script);
  });
}

let storyblokPreviewRevision = 0;


function getEditorialChecks(article) {
  const errors = [];
  const warnings = [];
  const value = (field) => String(article[field] || "").trim();
  const title = value("title");
  const slug = value("slug");
  const excerpt = value("excerpt");
  const seoTitle = value("seoTitle");
  const seoDescription = value("seoDescription");
  const author = value("author");
  const addError = (label) => errors.push(label);
  const addWarning = (label) => warnings.push(label);

  if (!title) addError("Inserisci il titolo.");
  if (!slug) addError("Inserisci lo slug.");
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) addError("Lo slug deve contenere solo lettere minuscole, numeri e trattini.");
  if (!value("category")) addError("Seleziona la categoria.");
  if (!value("type")) addError("Seleziona il tipo di articolo.");
  if (!excerpt) addError("Inserisci il sottotitolo / excerpt.");
  if (!author) addError("Inserisci l’autore.");
  else if (typeof getAuthorByName === "function" && !getAuthorByName(author)) addError("L’autore non corrisponde a un profilo presente sul sito.");
  if (!value("date") || Number.isNaN(Date.parse(value("date")))) addError("Inserisci una data valida.");
  if (!value("image")) addError("Aggiungi la copertina.");
  if (!article.hasContent) addError("Il corpo dell’articolo è vuoto.");

  if (title && (title.length < 35 || title.length > 75)) addWarning(`Il titolo è lungo ${title.length} caratteri: la fascia consigliata è 35–75.`);
  if (excerpt && (excerpt.length < 100 || excerpt.length > 180)) addWarning(`Il sottotitolo è lungo ${excerpt.length} caratteri: la fascia consigliata è 100–180.`);
  if (value("image") && !value("imageAlt")) addWarning("Aggiungi il testo alternativo alla copertina.");
  if (!seoTitle) addWarning("Compila il titolo SEO.");
  else if (seoTitle.length > 60) addWarning(`Il titolo SEO è lungo ${seoTitle.length} caratteri: resta entro 60.`);
  if (!seoDescription) addWarning("Compila la descrizione SEO.");
  else if (seoDescription.length < 120 || seoDescription.length > 160) addWarning(`La descrizione SEO è lunga ${seoDescription.length} caratteri: la fascia consigliata è 120–160.`);
  if (!Array.isArray(article.seoKeywords) || article.seoKeywords.length === 0) addWarning("Aggiungi almeno una parola chiave SEO.");
  if (/recensione/i.test(`${value("category")} ${value("type")}`) && !value("triedOn")) addWarning("Per una recensione, indica su quale piattaforma o formato è stata provata.");

  return { errors, warnings };
}

function renderEditorialCheck(article) {
  if (!isStoryblokPreview()) return;
  const { errors, warnings } = getEditorialChecks(article);
  let panel = document.getElementById("editorial-check");
  if (!panel) {
    panel = document.createElement("aside");
    panel.id = "editorial-check";
    panel.className = "editorial-check";
    panel.setAttribute("aria-live", "polite");
    document.body.appendChild(panel);
  }

  const statusClass = errors.length ? "has-errors" : warnings.length ? "has-warnings" : "is-ready";
  const statusText = errors.length ? `${errors.length} ${errors.length === 1 ? "errore" : "errori"}` : warnings.length ? `${warnings.length} ${warnings.length === 1 ? "avviso" : "avvisi"}` : "Pronto";
  const list = (items, kind) => items.map((item) => `<li class="editorial-check__item editorial-check__item--${kind}">${item}</li>`).join("");

  panel.className = `editorial-check ${statusClass}`;
  panel.innerHTML = `
    <details ${errors.length ? "open" : ""}>
      <summary>
        <span class="editorial-check__heading">Controllo editoriale</span>
        <span class="editorial-check__status">${statusText}</span>
      </summary>
      <div class="editorial-check__body">
        ${errors.length ? `<h2>Da correggere</h2><ul>${list(errors, "error")}</ul>` : ""}
        ${warnings.length ? `<h2>Da valutare</h2><ul>${list(warnings, "warning")}</ul>` : ""}
        ${!errors.length && !warnings.length ? "<p>Tutti i controlli sono superati. L’articolo è pronto per la revisione finale.</p>" : ""}
      </div>
    </details>`;
}


function displayStoryblokPreviewArticle(article, slug) {
  renderEditorialCheck(article);
  // Mantiene la rotta dell'iframe anche durante la modifica del campo slug.
  ARTICLES = ARTICLES.filter((a) => a.slug !== slug);
  ARTICLES.push({ ...article, slug });
  renderArticlePage();
}

async function refreshStoryblokPreviewArticle(slug) {
  const revision = ++storyblokPreviewRevision;
  try {
    const article = await fetchStoryblokStoryBySlug(slug, "draft");
    // Le risposte in ritardo non devono sovrascrivere input piu recenti.
    if (revision === storyblokPreviewRevision) displayStoryblokPreviewArticle(article, slug);
  } catch (err) {
    console.error("Impossibile aggiornare l'anteprima Storyblok:", err);
  }
}

async function initStoryblokPreview() {
  if (!isStoryblokPreview()) return;

  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) return;

  try {
    await loadStoryblokBridgeScript();
  } catch (err) {
    console.error(err);
    return;
  }

  const bridge = new window.StoryblokBridge();
  const expectedId = new URLSearchParams(window.location.search).get("_storyblok");
  bridge.on("input", (event) => {
    if (!event.story || !event.story.content || String(event.story.id) !== expectedId) return;
    ++storyblokPreviewRevision;
    displayStoryblokPreviewArticle(adaptStoryblokStory(event.story), slug);
  });
  bridge.on(["published", "change"], () => {
    refreshStoryblokPreviewArticle(slug);
  });
  await refreshStoryblokPreviewArticle(slug);
}

/* ---- Lista collaboratori su chi-sono.html. Si attiva solo se la
   pagina ha il contenitore #about-collaborators-list (quindi nessun
   effetto sulle altre pagine). Dati presi da AUTHORS (js/authors.js),
   ogni collaboratore linka alla sua pagina autore.html?nome=<slug>. ---- */
function renderAboutCollaborators() {
  const container = document.getElementById("about-collaborators-list");
  if (!container) return;

  container.innerHTML = AUTHORS.map(
    (a) => `
    <li class="about-collaborator">
      <a href="autore.html?nome=${encodeURIComponent(a.slug)}">
        <img src="${a.photo}" alt="Foto di ${a.name}" class="about-collaborator-photo">
        <span class="about-collaborator-info">
          <span class="about-collaborator-name">${a.name}</span>
          <span class="about-collaborator-role">${a.role}</span>
        </span>
      </a>
    </li>`
  ).join("");
}

/* ---- Pagina autore.html: foto, ruolo, bio, e lista degli articoli
   scritti da quella persona. Si attiva solo se la pagina ha il
   contenitore #author-page. Lo slug arriva da ?nome= nell'URL e
   viene cercato in AUTHORS; gli articoli si trovano confrontando
   article.author con il nome esatto dell'autore (case-insensitive,
   vedi getAuthorByName in js/authors.js). ---- */
function renderAuthorPage() {
  const container = document.getElementById("author-page");
  if (!container) return;

  const slug = new URLSearchParams(window.location.search).get("nome");
  const author = getAuthorBySlug(slug);

  if (!author) {
    container.innerHTML = `
      <p class="empty-state">Autore non trovato. <a href="chi-sono.html">Torna a Chi siamo</a>.</p>`;
    return;
  }

  document.title = `${author.name} — ${SITE.name}`;
  setMetaContent("og-title", `${author.name} — ${SITE.name}`);
  setMetaContent("og-description", author.bio);
  setMetaContent("twitter-title", `${author.name} — ${SITE.name}`);
  setMetaContent("twitter-description", author.bio);
  setLinkHref("canonical-link", `https://panelpixel.it/autore.html?nome=${encodeURIComponent(author.slug)}`);

  const breadcrumbNameEl = document.getElementById("author-breadcrumb-name");
  if (breadcrumbNameEl) breadcrumbNameEl.textContent = author.name;

  container.innerHTML = `
    <div class="author-header">
      <img src="${author.photo}" alt="Foto di ${author.name}" class="author-photo">
      <div>
        <h1>${author.name}</h1>
        <p class="author-role">${author.role}</p>
        <p class="author-bio">${author.bio}</p>
      </div>
    </div>`;

  const authorArticles = ARTICLES.filter(
    (a) => a.author && a.author.toLowerCase() === author.name.toLowerCase()
  );

  const articlesEl = document.getElementById("author-articles-list");
  if (!articlesEl) return;

  if (authorArticles.length === 0) {
    articlesEl.innerHTML = `<p class="empty-state">Nessun articolo pubblicato ancora.</p>`;
    return;
  }
  articlesEl.innerHTML = authorArticles.map((a) => editorialStoryHTML(a)).join("");
}

function getArticleYear(article) {
  return String(article.date || "").slice(0, 4);
}

function renderArchivePage() {
  const listEl = document.getElementById("archive-list");
  if (!listEl) return;
  const categoryEl = document.getElementById("archive-category");
  const authorEl = document.getElementById("archive-author");
  const yearEl = document.getElementById("archive-year");
  const searchEl = document.getElementById("archive-search");
  const countEl = document.getElementById("archive-count");
  const params = new URLSearchParams(window.location.search);
  searchEl.value = params.get("q") || "";
  const categories = [...new Set(ARTICLES.map((a) => a.category))].sort();
  const authors = [...new Set(ARTICLES.map((a) => a.author).filter(Boolean))].sort();
  const years = [...new Set(ARTICLES.map(getArticleYear).filter(Boolean))].sort().reverse();
  categoryEl.insertAdjacentHTML("beforeend", categories.map((value) => `<option value="${escapeHTML(value)}">${escapeHTML(getCategoryName(value))}</option>`).join(""));
  authorEl.insertAdjacentHTML("beforeend", authors.map((value) => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join(""));
  yearEl.insertAdjacentHTML("beforeend", years.map((value) => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join(""));
  const update = () => {
    const query = normalizeSearchText(searchEl.value);
    const matches = ARTICLES.filter((article) => {
      const text = normalizeSearchText(`${article.title} ${article.excerpt} ${article.author} ${getCategoryName(article.category)} ${getSeoKeywords(article).join(" ")}`);
      return (!categoryEl.value || article.category === categoryEl.value)
        && (!authorEl.value || article.author === authorEl.value)
        && (!yearEl.value || getArticleYear(article) === yearEl.value)
        && (!query || text.includes(query));
    }).sort((a, b) => (a.date < b.date ? 1 : -1));
    countEl.textContent = `${matches.length} ${matches.length === 1 ? "articolo" : "articoli"}`;
    listEl.innerHTML = matches.length ? matches.map((article) => editorialStoryHTML(article)).join("") : `<p class="archive-empty">Nessun articolo corrisponde ai filtri scelti.</p>`;
  };
  [categoryEl, authorEl, yearEl].forEach((el) => el.addEventListener("change", update));
  searchEl.addEventListener("input", update);
  document.getElementById("archive-reset").addEventListener("click", () => {
    categoryEl.value = authorEl.value = yearEl.value = searchEl.value = "";
    update();
  });
  update();
}
document.addEventListener("DOMContentLoaded", async () => {
  initHeader();
  initHeaderScrollHide();
  initAccountNavLink();

  renderAboutCollaborators();
  if (!document.querySelector("#magazine-hero, #homepage-articles, #category-list, #article-content, #author-page, #archive-list")) return;

  try {
    await loadArticles();
  } catch (err) {
    console.error("Impossibile caricare gli articoli:", err);
    showDataLoadError();
    await initStoryblokPreview();
    return;
  }

  renderMagazineHero();
  renderHomepageGrid();
  renderApprofondimentiSection();
  initSearch();
  renderCategoryPage();
  renderArticlePage();
  renderAuthorPage();
  renderArchivePage();
  initStoryblokPreview();
});
