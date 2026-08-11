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
      rompere il rendering o mostrare la sintassi grezza.
   3. Un'estensione INLINE (==testo==, grassetto + colore accento; o
      ==#RRGGBB|testo== per un colore libero, stesso pattern del color
      picker di --box-color) per evidenziare una frase dentro un
      paragrafo senza spezzarne il flusso — a differenza dei tre
      componenti sopra, si scrive a mano liberamente nel testo, non
      viene inserita da un bottone editor.
   4. Un'estensione INLINE per il rimando a nota a piè di pagina ([^N]
      nel testo, si scrive a mano) e una a BLOCCO per il testo delle
      note stesse (<!--footnotes:[{"id":1,"text":"..."},...]-->,
      inserita dal bottone editor, posizionabile ovunque
      nell'articolo). Un rimando senza nota corrispondente, o
      viceversa, non rompe nulla: il link punta a un'ancora che
      semplicemente non esiste, nessun errore.
   5. Un'estensione a BLOCCO per embed video YouTube o post X/Twitter
      (<!--embed:{"type":"youtube"|"tweet","url":"..."}-->). URL non
      riconosciuto o tipo sconosciuto: messaggio discreto invece di un
      componente vuoto o un errore JS. Lo script di X
      (platform.twitter.com/widgets.js) viene creato ed eseguito via
      DOM reale, non incluso nell'HTML restituito dal renderer — un
      <script> dentro una stringa assegnata a innerHTML non si esegue
      mai, è un limite del DOM — e al massimo una volta per pagina. */

function ppExtractYouTubeId(url) {
  if (!url) return "";
  const m = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(url);
  return m ? m[1] : "";
}

function ppLoadTwitterWidgets() {
  if (window.__ppTwitterWidgetsRequested) {
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load();
    }
    return;
  }
  window.__ppTwitterWidgetsRequested = true;
  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  document.head.appendChild(script);
}

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
        // article-inline-image--standalone: SOLO questa funzione la applica
        // (galleria e colonne 3 costruiscono il proprio <figure>/<img> a
        // mano, senza mai chiamare image()) — distingue esplicitamente
        // "immagine singola nel corpo" da "immagine dentro un componente".
        //
        // Allineamento scelto via prefisso nel testo alternativo, stesso
        // pattern pipe-delimited già usato per ==#RRGGBB|testo==:
        // "destra|"/"sinistra|" attivano il float (45%, vedi CSS), rimosso
        // sempre dall'alt effettivo — mai letto da uno screen reader.
        // Nessun prefisso: centrata, non flottante (default).
        let alt = text || "";
        let variantCls = "article-inline-image--center";
        const variantMatch = /^(destra|sinistra)\|([\s\S]*)$/.exec(alt);
        if (variantMatch) {
          variantCls = variantMatch[1] === "destra" ? "article-inline-image--right" : "article-inline-image--left";
          alt = variantMatch[2];
        }
        return `<figure class="article-inline-image article-inline-image--standalone ${variantCls}"><img src="${href}" alt="${alt}" loading="lazy">${caption}</figure>`;
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
        // Evidenziazione in linea dentro un paragrafo: ==testo== -> grassetto
        // + colore accento (vedi .article-highlight in css/style.css), senza
        // spezzare il flusso del paragrafo come farebbe il componente box
        // (che è invece a blocco, su righe proprie). Estensione INLINE (non
        // block come le tre sotto): serve tokenizzare il contenuto catturato
        // con lexer.inlineTokens così dentro ==...== restano utilizzabili
        // anche **grassetto**/corsivo/link, invece di trattarlo come testo
        // puro — stesso pattern consigliato dalla documentazione di marked
        // per le estensioni inline con contenuto annidato.
        name: "ppHighlight",
        level: "inline",
        start(src) {
          const m = src.match(/==/);
          return m ? m.index : undefined;
        },
        tokenizer(src) {
          const rule = /^==([^=\n]+)==/;
          const match = rule.exec(src);
          if (!match) return undefined;

          // ==#RRGGBB|testo== — prefisso colore opzionale, stesso pattern
          // del color picker libero già usato per --box-color. Regex
          // ANCORATA (^...$) e whitelist stretta (solo # + 3 o 6 cifre
          // esadecimali): è l'unico modo in cui "color" può finire
          // nell'attributo style del renderer qui sotto, quindi non c'è
          // spazio per iniettare altro CSS (punti e virgola, parentesi,
          // url(...), virgolette) — se non combacia esattamente, niente
          // colore, fallback silenzioso al testo normale con colore di
          // default (nessuna eccezione, nessuna sintassi rotta).
          let text = match[1];
          let color = "";
          const colorMatch = /^(#[0-9a-f]{3}|#[0-9a-f]{6})\|([\s\S]+)$/i.exec(text);
          if (colorMatch) {
            color = colorMatch[1];
            text = colorMatch[2];
          }

          return {
            type: "ppHighlight",
            raw: match[0],
            color,
            tokens: this.lexer.inlineTokens(text),
          };
        },
        renderer(token) {
          // Colore come style inline sul singolo <mark>, non una classe:
          // altrimenti servirebbe generare/registrare una classe CSS per
          // ogni colore scelto dall'autore. Sicuro da interpolare: "color"
          // può arrivare solo dalla whitelist esadecimale sopra, mai da
          // testo libero dell'autore.
          const style = token.color ? ` style="color: ${token.color}"` : "";
          return `<mark class="article-highlight"${style}>${this.parser.parseInline(token.tokens)}</mark>`;
        },
      },
      {
        name: "ppFootnoteRef",
        level: "inline",
        start(src) {
          const m = src.match(/\[\^\d+\]/);
          return m ? m.index : undefined;
        },
        tokenizer(src) {
          const rule = /^\[\^(\d+)\]/;
          const match = rule.exec(src);
          if (!match) return undefined;
          return { type: "ppFootnoteRef", raw: match[0], id: match[1] };
        },
        renderer(token) {
          return `<sup><a class="article-footnote-ref" href="#fn-${token.id}" id="fnref-${token.id}">${token.id}</a></sup>`;
        },
      },
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
      {
        name: "ppFootnotes",
        level: "block",
        start(src) {
          const m = src.match(/<!--footnotes:/);
          return m ? m.index : undefined;
        },
        tokenizer(src) {
          const rule = /^<!--footnotes:(\[[\s\S]*?\])-->\n?/;
          const match = rule.exec(src);
          if (!match) return undefined;
          let notes = [];
          try {
            notes = JSON.parse(match[1]);
          } catch (e) {
            notes = [];
          }
          return { type: "ppFootnotes", raw: match[0], notes: Array.isArray(notes) ? notes : [] };
        },
        renderer(token) {
          if (!token.notes.length) return "";
          const items = token.notes
            .map((note) => {
              if (note.id === undefined || note.id === null || note.id === "") return "";
              // parseInline (non parse): una nota è una riga, non un
              // blocco — evita di avvolgerla in un <p> ridondante
              // dentro il <li>, restano comunque utilizzabili
              // grassetto/corsivo/link.
              const text = typeof marked.parseInline === "function" ? marked.parseInline(note.text || "") : (note.text || "");
              return `<li id="fn-${note.id}" value="${note.id}">${text} <a class="article-footnote-back" href="#fnref-${note.id}">↩</a></li>`;
            })
            .join("");
          return `<div class="article-footnotes"><ol class="article-footnotes-list">${items}</ol></div>`;
        },
      },
      {
        name: "ppEmbed",
        level: "block",
        start(src) {
          const m = src.match(/<!--embed:/);
          return m ? m.index : undefined;
        },
        tokenizer(src) {
          const rule = /^<!--embed:(\{[\s\S]*?\})-->\n?/;
          const match = rule.exec(src);
          if (!match) return undefined;
          let data = {};
          try {
            data = JSON.parse(match[1]);
          } catch (e) {
            data = {};
          }
          return { type: "ppEmbed", raw: match[0], embedType: data.type || "", url: data.url || "" };
        },
        renderer(token) {
          if (token.embedType === "youtube") {
            const videoId = ppExtractYouTubeId(token.url);
            if (!videoId) {
              return `<p class="article-embed-error">Video YouTube non riconosciuto.</p>`;
            }
            return `<div class="article-embed article-embed--video"><iframe src="https://www.youtube.com/embed/${videoId}" title="Video YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
          }
          if (token.embedType === "tweet") {
            const looksValid = /^https?:\/\/(www\.)?(twitter|x)\.com\/[^/\s]+\/status\/\d+/i.test(token.url || "");
            if (!looksValid) {
              return `<p class="article-embed-error">Link a un post X/Twitter non riconosciuto.</p>`;
            }
            ppLoadTwitterWidgets();
            return `<div class="article-embed article-embed--tweet"><blockquote class="twitter-tweet"><a href="${token.url}"></a></blockquote></div>`;
          }
          return `<p class="article-embed-error">Embed non riconosciuto.</p>`;
        },
      },
    ],
  });
}
