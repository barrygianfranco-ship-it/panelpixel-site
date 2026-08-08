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
   2. Due estensioni a blocco per i componenti editoriali extra (galleria
      a griglia, box con bordo), inserite dall'editor tramite
      CMS.registerEditorComponent (vedi admin/preview.js) e riconosciute
      qui in fase di rendering tramite un commento HTML con dentro JSON:
        <!--gallery:[{"src":"...","alt":"..."},...]-->
        <!--box:{"content":"...","color":"#rrggbb"}-->
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
    ],
  });
}
