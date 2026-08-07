/* Panel Pixel — anteprima live per la collection "articoli" nell'editor
   Decap CMS. API ufficiale (registerPreviewTemplate/registerPreviewStyle),
   ma con un limite architetturale: "articoli" è una "files collection"
   con UN SOLO file (data/articles.json) che contiene TUTTI gli articoli
   in un campo "list" — per Decap è una sola entry, quindi questa anteprima
   riceve l'intero elenco, non il singolo articolo aperto nel form. Mostra
   tutti gli articoli in sequenza, con lo stesso markup/CSS del sito.

   Step C della migrazione a markdown: "content" ora è una stringa
   markdown (non più un array di blocchi h2/h3/p/image), esattamente come
   in data/articles.json dopo lo Step B. Il parser è marked.js: deve
   essere caricato in admin/index.html PRIMA di questo file (la preview
   gira nel contesto della pagina admin, non dentro l'iframe — solo il CSS
   ci arriva via registerPreviewStyle, il JS no, va caricato qui). Il
   renderer personalizzato qui sotto è lo stesso identico di
   renderArticleLayout/renderMarkdownBody in js/main.js — duplicato di
   proposito: l'anteprima lavora sui dati "in bozza" dell'editor (oggetti
   Immutable), il sito sui dati fetchati, i due contesti non possono
   condividere codice senza un build step. Se cambi il renderer in un
   punto, cambialo anche nell'altro. */

CMS.registerPreviewStyle("/css/style.css");
CMS.registerPreviewStyle("/admin/preview.css");

if (typeof marked !== "undefined") {
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const tag = depth <= 2 ? "h2" : "h3";
        const cls = depth <= 2 ? "article-heading" : "article-subheading";
        return `<${tag} class="${cls}">${text}</${tag}>`;
      },
      image({ href, title, text }) {
        const caption = title ? `<figcaption>${title}</figcaption>` : "";
        return `<figure class="article-inline-image"><img src="${href}" alt="${text || ""}" loading="lazy">${caption}</figure>`;
      },
      paragraph({ tokens }) {
        if (tokens.length === 1 && tokens[0].type === "image") {
          return this.image(tokens[0]);
        }
        return `<p>${this.parser.parseInline(tokens)}</p>`;
      },
    },
  });
}

var CATEGORY_NAMES = {
  recensioni: "Recensioni",
  monografie: "Monografie",
  attualita: "Attualità",
  anteprime: "Anteprime",
  approfondimenti: "Approfondimenti",
};

function toArr(list) {
  if (!list) return [];
  if (typeof list.toArray === "function") return list.toArray();
  if (Array.isArray(list)) return list;
  return [];
}

function categoryLabel(article) {
  var type = article.get("type");
  if (type === "recensione") return "Recensione";
  if (type === "monografia") return "Monografia";
  var category = article.get("category");
  return CATEGORY_NAMES[category] || category || "";
}

function formatDateIT(iso) {
  if (!iso) return "";
  var d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

var ArticoliPreview = createClass({
  renderImage: function (src, alt) {
    if (!src) return null;
    var asset = this.props.getAsset(src);
    return h("img", { src: asset ? asset.toString() : "", alt: alt || "" });
  },

  renderMarkdownBody: function (markdown) {
    var html = typeof marked !== "undefined" && markdown ? marked.parse(markdown) : "";
    return h("div", { className: "article-body", dangerouslySetInnerHTML: { __html: html } });
  },

  renderArticle: function (article, idx) {
    return h(
      "article",
      { key: idx, className: "article-wrap", style: { marginBottom: "4rem", borderBottom: "1px solid var(--color-border, #e2dacb)", paddingBottom: "3rem" } },
      h("div", { className: "article-media" }, this.renderImage(article.get("image"), article.get("title"))),
      h(
        "div",
        { className: "article-content-inner" },
        h(
          "header",
          { className: "article-header" },
          h("p", { className: "article-category" }, categoryLabel(article)),
          h("h1", { className: "article-title" }, article.get("title")),
          h("p", { className: "article-subtitle" }, article.get("excerpt")),
          h("div", { className: "article-header-divider" })
        ),
        this.renderMarkdownBody(article.get("content")),
        h(
          "div",
          { className: "article-footer-meta" },
          h("p", {}, "Pubblicato il " + formatDateIT(article.get("date")) + " · A cura di " + (article.get("author") || ""))
        )
      )
    );
  },

  render: function () {
    var entry = this.props.entry;
    var articles = toArr(entry.getIn(["data", "articles"]));
    var self = this;

    if (articles.length === 0) {
      return h("p", { className: "pp-preview-hint" }, "Nessun articolo da mostrare.");
    }

    return h(
      "div",
      { className: "pp-preview" },
      h(
        "p",
        { className: "pp-preview-hint" },
        articles.length + " articoli nel file — l'anteprima mostra tutti in sequenza, non solo quello che stai modificando (limite di questa collection, vedi commento in cima a questo file)."
      ),
      articles.map(function (article, idx) { return self.renderArticle(article, idx); })
    );
  },
});

CMS.registerPreviewTemplate("articoli", ArticoliPreview);
