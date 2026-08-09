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
   ci arriva via registerPreviewStyle, il JS no, va caricato qui). La
   personalizzazione del renderer (heading/image/paragraph, più i
   componenti galleria/box) vive in js/markdown-components.js, condiviso
   con js/main.js — deve caricare anche quello, PRIMA di questo file
   (vedi admin/index.html), così sito e anteprima usano esattamente la
   stessa logica invece di due copie a rischio di divergere. */

CMS.registerPreviewStyle("/css/style.css");
CMS.registerPreviewStyle("/admin/preview.css");

/* ---- Componenti editoriali extra: galleria a griglia, box con bordo,
   3 colonne testo/immagine/testo ----
   Registrazione Decap-specifica (usa CMS.registerEditorComponent, non
   disponibile sul sito pubblico) — per questo vive qui e non nel file
   condiviso. Il rendering vero e proprio (cosa succede quando marked
   incontra <!--gallery:...-->, <!--box:...--> o <!--columns3:...--> nel
   markdown salvato) è invece nel file condiviso, così sito e anteprima
   mostrano lo stesso risultato. Qui c'è solo il form di inserimento
   (fields) e la serializzazione da/verso quella sintassi
   (fromBlock/toBlock), più una preview minimale per quando il blocco è
   "chiuso" nell'editor (toPreview — diverso dalla preview a destra, che
   uso la nostra). */
CMS.registerEditorComponent({
  id: "gallery",
  label: "Galleria immagini",
  fields: [
    {
      name: "images",
      label: "Immagini (2-4)",
      widget: "list",
      minimize_collapsed: true,
      fields: [
        { name: "src", label: "Immagine", widget: "image" },
        { name: "alt", label: "Testo alternativo (alt)", widget: "string", required: false },
      ],
    },
  ],
  pattern: /^<!--gallery:(\[[\s\S]*?\])-->\n?/,
  fromBlock: function (match) {
    var images = [];
    try {
      images = JSON.parse(match[1]);
    } catch (e) {
      images = [];
    }
    return { images: images };
  },
  toBlock: function (obj) {
    var images = (obj.images || []).map(function (img) {
      return { src: img.src || "", alt: img.alt || "" };
    });
    return "<!--gallery:" + JSON.stringify(images) + "-->\n";
  },
  toPreview: function (obj) {
    var images = obj.images || [];
    return images
      .map(function (img) {
        return '<figure style="display:inline-block;width:120px;margin:4px;vertical-align:top;"><img src="' + (img.src || "") + '" style="width:100%;display:block;" alt="' + (img.alt || "") + '"></figure>';
      })
      .join("");
  },
});

CMS.registerEditorComponent({
  id: "box",
  label: "Box con bordo",
  fields: [
    { name: "content", label: "Contenuto", widget: "markdown", buttons: ["bold", "italic", "link"] },
    { name: "color", label: "Colore personalizzato (opzionale)", widget: "color", required: false, allowInput: true },
  ],
  pattern: /^<!--box:(\{[\s\S]*?\})-->\n?/,
  fromBlock: function (match) {
    var data = {};
    try {
      data = JSON.parse(match[1]);
    } catch (e) {
      data = {};
    }
    return { content: data.content || "", color: data.color || "" };
  },
  toBlock: function (obj) {
    var data = { content: obj.content || "", color: obj.color || "" };
    return "<!--box:" + JSON.stringify(data) + "-->\n";
  },
  toPreview: function (obj) {
    var borderColor = obj.color || "#e2dacb";
    return '<div style="border:1px solid ' + borderColor + ';padding:1rem;border-radius:4px;">' + (obj.content || "") + "</div>";
  },
});

CMS.registerEditorComponent({
  id: "columns3",
  label: "3 colonne: testo/immagine/testo",
  fields: [
    { name: "leftText", label: "Testo sinistra", widget: "markdown", buttons: ["bold", "italic", "link"] },
    { name: "leftBorder", label: "Bordo per il testo sinistro", widget: "boolean", default: false },
    {
      name: "image",
      label: "Immagine centrale",
      widget: "object",
      fields: [
        { name: "src", label: "Immagine", widget: "image" },
        { name: "alt", label: "Testo alternativo (alt)", widget: "string", required: false },
      ],
    },
    { name: "imageBorder", label: "Bordo per l'immagine", widget: "boolean", default: false },
    { name: "rightText", label: "Testo destra", widget: "markdown", buttons: ["bold", "italic", "link"] },
    { name: "rightBorder", label: "Bordo per il testo destro", widget: "boolean", default: false },
  ],
  pattern: /^<!--columns3:(\{[\s\S]*?\})-->\n?/,
  fromBlock: function (match) {
    var data = {};
    try {
      data = JSON.parse(match[1]);
    } catch (e) {
      data = {};
    }
    return {
      leftText: data.leftText || "",
      leftBorder: !!data.leftBorder,
      image: data.image || { src: "", alt: "" },
      imageBorder: !!data.imageBorder,
      rightText: data.rightText || "",
      rightBorder: !!data.rightBorder,
    };
  },
  toBlock: function (obj) {
    var data = {
      leftText: obj.leftText || "",
      leftBorder: !!obj.leftBorder,
      image: { src: (obj.image && obj.image.src) || "", alt: (obj.image && obj.image.alt) || "" },
      imageBorder: !!obj.imageBorder,
      rightText: obj.rightText || "",
      rightBorder: !!obj.rightBorder,
    };
    return "<!--columns3:" + JSON.stringify(data) + "-->\n";
  },
  toPreview: function (obj) {
    var img = obj.image || {};
    var borderStyle = "border:1px solid #e2dacb;padding:0.5rem;";
    return (
      '<div style="display:flex;gap:8px;">' +
      '<div style="flex:1;' + (obj.leftBorder ? borderStyle : "") + '">' + (obj.leftText || "") + "</div>" +
      '<div style="flex:1;' + (obj.imageBorder ? borderStyle : "") + '"><img src="' + (img.src || "") + '" style="width:100%;display:block;" alt="' + (img.alt || "") + '"></div>' +
      '<div style="flex:1;' + (obj.rightBorder ? borderStyle : "") + '">' + (obj.rightText || "") + "</div>" +
      "</div>"
    );
  },
});

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
