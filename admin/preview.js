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

CMS.registerEditorComponent({
  id: "footnotes",
  label: "Note a piè di pagina",
  fields: [
    {
      name: "notes",
      label: "Note",
      widget: "list",
      minimize_collapsed: true,
      fields: [
        { name: "id", label: "Numero (usa [^N] nel testo per il rimando)", widget: "number", value_type: "int" },
        { name: "text", label: "Testo della nota", widget: "string" },
      ],
    },
  ],
  pattern: /^<!--footnotes:(\[[\s\S]*?\])-->\n?/,
  fromBlock: function (match) {
    var notes = [];
    try {
      notes = JSON.parse(match[1]);
    } catch (e) {
      notes = [];
    }
    return { notes: notes };
  },
  toBlock: function (obj) {
    var notes = (obj.notes || []).map(function (n) {
      return { id: n.id, text: n.text || "" };
    });
    return "<!--footnotes:" + JSON.stringify(notes) + "-->\n";
  },
  toPreview: function (obj) {
    var notes = obj.notes || [];
    return (
      '<ol style="font-size:0.85rem;color:#6b6b63;">' +
      notes.map(function (n) { return "<li>" + (n.text || "") + "</li>"; }).join("") +
      "</ol>"
    );
  },
});

CMS.registerEditorComponent({
  id: "embed",
  label: "Embed video/tweet",
  fields: [
    {
      name: "type",
      label: "Tipo",
      widget: "select",
      options: [
        { label: "YouTube", value: "youtube" },
        { label: "Tweet (X/Twitter)", value: "tweet" },
      ],
    },
    { name: "url", label: "URL", widget: "string", hint: "Link completo al video YouTube o al post X/Twitter." },
  ],
  pattern: /^<!--embed:(\{[\s\S]*?\})-->\n?/,
  fromBlock: function (match) {
    var data = {};
    try {
      data = JSON.parse(match[1]);
    } catch (e) {
      data = {};
    }
    return { type: data.type || "youtube", url: data.url || "" };
  },
  toBlock: function (obj) {
    var data = { type: obj.type || "youtube", url: obj.url || "" };
    return "<!--embed:" + JSON.stringify(data) + "-->\n";
  },
  toPreview: function (obj) {
    return '<p style="padding:0.75rem;border:1px dashed #e2dacb;border-radius:4px;">Embed ' + (obj.type || "") + ": " + (obj.url || "") + "</p>";
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

  // Stesso meccanismo di applyArticleTheme() in js/main.js: legge
  // article.theme (se presente) e restituisce le custom property da
  // aggiungere allo style inline di .article-wrap. Nessuna proprietà
  // impostata se il tema è assente o un sotto-campo non è valorizzato —
  // stessi fallback CSS del sito pubblico, zero differenze per gli
  // articoli senza tema.
  buildThemeStyle: function (article) {
    var theme = article.get("theme");
    if (!theme) return {};
    var get = function (key) {
      return typeof theme.get === "function" ? theme.get(key) : theme[key];
    };
    var style = {};
    var bg = get("background");
    var accent = get("accent");
    var testoChiaro = get("testoChiaro");
    if (bg) style["--article-bg"] = bg;
    if (accent) style["--article-accent"] = accent;
    if (testoChiaro) style["--article-text"] = "var(--color-bg)";
    return style;
  },

  renderArticle: function (article, idx) {
    var wrapStyle = { marginBottom: "4rem", borderBottom: "1px solid var(--color-border, #e2dacb)", paddingBottom: "3rem" };
    var themeStyle = this.buildThemeStyle(article);
    for (var key in themeStyle) {
      wrapStyle[key] = themeStyle[key];
    }
    return h(
      "article",
      { key: idx, className: "article-wrap", style: wrapStyle },
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
