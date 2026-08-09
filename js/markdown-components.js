/* Panel Pixel — configurazione condivisa di marked.js.
   Caricato SIA in articolo.html (sito pubblico) SIA in admin/index.html
   (editor Decap CMS), subito dopo marked.js e prima di js/main.js /
   admin/preview.js — entrambi i contesti chiamano semplicemente
   marked.parse(), la personalizzazione vive tutta qui in un solo posto
   invece di essere duplicata (e a rischio di divergere) in due file.

   Contiene:
   1. Il renderer personalizzato base (heading H2/H3 con classi del sito,
      image con <figure>, paragraph che salta il wrapper <p> per le
      immagini da sole su una riga) — spostato qui da js/main.js e
      admin/preview.js, prima duplicato in entrambi.
   2. Tre estensioni a blocco per i componenti editoriali extra (galleria
      a griglia, box con bordo, 3 colonne testo/immagine/testo), inserite
      dall'editor tramite CMS.registerEditorComponent (vedi
      admin/preview.js) e riconosciute qui in fase di rendering tramite
      un commento HTML con dentro JSON:
        <!--gallery:[{"src":"...","alt":"..."},...]-->
        <!--box:{"content":"...","color":"#rrggbb"}-->
        <!--columns3:{"leftText":"...","leftBorder":true,"image":{"src":"...","alt":"..."},"imageBorder":false,"rightText":"...","rightBorder":true}-->
      Scelto un commento HTML apposta: se per qualsiasi motivo queste
      estensioni non fossero caricate, marked lo passerebbe comunque
      attraverso come normale HTML (invisibile a schermo) invece di
      rompere il rendering o mostrare la sintassi grezza. */

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
    extensions: [
      {
        name: "ppGallery",
        level: "block",
        start(src) {
          const m = src.match(/<!--gallery:/);
          return m ? m.index : undefined;
        },
        tokenizer(src) {
          const rule = /^<!--gallery:(\[[\s\S]*?\])-->\n?/;
          const match = rule.exec(src);
          if (!match) return undefined;
          let images = [];
          try {
            images = JSON.parse(match[1]);
          } catch (e) {
            images = [];
          }
          return { type: "ppGallery", raw: match[0], images: Array.isArray(images) ? images : [] };
        },
        renderer(token) {
          const items = token.images
            .map((img) => `<figure class="article-inline-image"><img src="${img.src || ""}" alt="${img.alt || ""}" loading="lazy"></figure>`)
            .join("");
          return `<div class="article-gallery">${items}</div>`;
        },
      },
      {
        name: "ppBox",
        level: "block",
        start(src) {
          const m = src.match(/<!--box:/);
          return m ? m.index : undefined;
        },
        tokenizer(src) {
          const rule = /^<!--box:(\{[\s\S]*?\})-->\n?/;
          const match = rule.exec(src);
          if (!match) return undefined;
          let data = {};
          try {
            data = JSON.parse(match[1]);
          } catch (e) {
            data = {};
          }
          return { type: "ppBox", raw: match[0], content: data.content || "", color: data.color || "" };
        },
        renderer(token) {
          // Nested markdown-in-markdown: il contenuto del box può avere il
          // suo formato (grassetto, corsivo, link) — si riusa marked.parse
          // sulla singola stringa, invece di duplicare la logica di
          // parsing. Nessun rischio di ricorsione infinita nell'uso
          // previsto (un box non contiene un altro box).
          const html = marked.parse(token.content || "");
          if (token.color) {
            return `<div class="article-box article-box--custom" style="--box-color: ${token.color}">${html}</div>`;
          }
          return `<div class="article-box">${html}</div>`;
        },
      },
      {
        name: "ppColumns3",
        level: "block",
        start(src) {
          const m = src.match(/<!--columns3:/);
          return m ? m.index : undefined;
        },
        tokenizer(src) {
          const rule = /^<!--columns3:(\{[\s\S]*?\})-->\n?/;
          const match = rule.exec(src);
          if (!match) return undefined;
          let data = {};
          try {
            data = JSON.parse(match[1]);
          } catch (e) {
            data = {};
          }
          return {
            type: "ppColumns3",
            raw: match[0],
            leftText: data.leftText || "",
            leftBorder: !!data.leftBorder,
            image: data.image || {},
            imageBorder: !!data.imageBorder,
            rightText: data.rightText || "",
            rightBorder: !!data.rightBorder,
          };
        },
        renderer(token) {
          // Stessa logica nested markdown-in-markdown di ppBox, per i due
          // slot di testo. Il bordo per colonna riusa .article-box invece
          // di duplicarne le regole, aggiunta condizionalmente alla classe
          // della colonna in questione (vedi .article-box in css/style.css
          // per lo stile riusato: bordo 1px, sfondo neutro, padding).
          const leftHtml = marked.parse(token.leftText || "");
          const rightHtml = marked.parse(token.rightText || "");
          const leftCls = token.leftBorder ? "article-columns3-col article-box" : "article-columns3-col";
          const imgCls = token.imageBorder ? "article-columns3-col article-box" : "article-columns3-col";
          const rightCls = token.rightBorder ? "article-columns3-col article-box" : "article-columns3-col";
          const src = (token.image && token.image.src) || "";
          const alt = (token.image && token.image.alt) || "";
          return (
            `<div class="article-columns3">` +
            `<div class="${leftCls}">${leftHtml}</div>` +
            `<div class="${imgCls}"><img src="${src}" alt="${alt}" loading="lazy"></div>` +
            `<div class="${rightCls}">${rightHtml}</div>` +
            `</div>`
          );
        },
      },
    ],
  });
}
