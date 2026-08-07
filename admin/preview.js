/* Panel Pixel — anteprima live per la collection "articoli" nell'editor
   Decap CMS. API ufficiale (registerPreviewTemplate/registerPreviewStyle),
   ma con un limite architetturale: "articoli" è una "files collection"
   con UN SOLO file (data/articles.json) che contiene TUTTI gli articoli
   in un campo "list" — per Decap è una sola entry, quindi questa anteprima
   riceve l'intero elenco, non il singolo articolo aperto nel form. Mostra
   tutti gli articoli in sequenza, con lo stesso markup/CSS del sito
   (vedi renderArticleLayout/renderArticleHeader/renderContentBlocks in
   js/main.js, di cui questo file è un porting manuale: l'anteprima non
   può richiamare quelle funzioni perché lavorano su JSON già fetchato,
   mentre qui i dati sono l'oggetto Immutable "in bozza" dell'editor). */

CMS.registerPreviewStyle("/css/style.css");
CMS.registerPreviewStyle("/admin/preview.css");

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

  renderContentBlock: function (block, i) {
    var type = block.get("type");
    var text = block.get("text");

    if (type === "h2") return h("h2", { key: i, className: "article-heading" }, text);
    if (type === "h3") return h("h3", { key: i, className: "article-subheading" }, text);

    if (type === "image") {
      var caption = block.get("caption");
      return h(
        "figure",
        { key: i, className: "article-inline-image" },
        this.renderImage(block.get("src"), block.get("alt")),
        caption ? h("figcaption", {}, caption) : null
      );
    }

    if (type === "p") return h("p", { key: i }, text);

    // Formato legacy (articoli scritti prima dei blocchi h2/h3/p, non
    // creabile dal form del CMS ma presente nei 12 articoli migrati):
    // "paragraph" con un "heading" opzionale incorporato — vedi il ramo
    // equivalente in renderContentBlocks() in js/main.js.
    var heading = block.get("heading");
    return h(
      "div",
      { key: i },
      heading ? h("h2", { className: "article-heading" }, heading) : null,
      h("p", {}, text)
    );
  },

  renderArticle: function (article, idx) {
    var content = toArr(article.get("content"));
    var self = this;

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
        h("div", { className: "article-body" }, content.map(function (block, i) { return self.renderContentBlock(block, i); })),
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
