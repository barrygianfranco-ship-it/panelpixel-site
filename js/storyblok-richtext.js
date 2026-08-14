/* Panel Pixel — lettura contenuti da Storyblok (Content Delivery API).
   Fa due cose:

   1. fetchStoryblokArticles(): chiama la Content Delivery API di
      Storyblok e restituisce un array di articoli nella STESSA forma che
      js/main.js si aspettava da data/articles.json — vedi
      adaptStoryblokStory() più sotto per la mappatura campo per campo.
      Il campo "corpo" (richtext) viene già convertito in HTML qui
      dentro, così renderMarkdownBody() in js/main.js fa solo un
      innerHTML diretto, senza passare da marked.js.

   2. storyblokRichtextToHtml(doc): converte un documento richtext
      Storyblok nello STESSO HTML che produceva js/markdown-components.js
      per il markdown — stesse classi CSS (article-box, article-gallery,
      article-columns3, article-embed, article-footnotes...), quindi il
      CSS del sito si applica identico.

   Limiti noti (vedi il piano discusso prima di scrivere questo file):
   - Il nodo "image" nativo di richtext non ha un campo per "destra"/
     "sinistra" (quella scelta in markdown viveva nel prefisso dell'alt)
     — qui va sempre in variante centrata. Nessuno dei due articoli
     migrati usa varianti flottanti, quindi non blocca l'uso attuale.
   - I mark "highlight" (==testo==) e i rimandi nota [^N] non sono mai
     stati verificati contro un vero documento richtext (nessuno dei due
     articoli li usa): il supporto qui sotto è "best effort", non
     testato. Se un giorno servono, vanno confermati con un caso reale
     prima di fidarsene, stesso principio già seguito in fase di
     migrazione dei contenuti. */

const STORYBLOK_SPACE_ID = "294520547534020";
// Token pubblico Content Delivery API: per design è pensato per stare
// nel codice lato client (a differenza del Management API token, che
// non va MAI scritto qui o in qualunque file del repo).
const STORYBLOK_CDA_TOKEN = "zjdMUlID8QrxZOsD4l9W4Qtt";

/* ---- Helper: marks inline (bold/italic/link/code) su un nodo "text" ---- */
function applyStoryblokMarks(text, marks) {
  if (!marks || marks.length === 0) return text;
  return marks.reduce((html, mark) => {
    switch (mark.type) {
      case "bold":
        return `<strong>${html}</strong>`;
      case "italic":
        return `<em>${html}</em>`;
      case "code":
        return `<code>${html}</code>`;
      case "link": {
        const href = (mark.attrs && mark.attrs.href) || "";
        return `<a href="${href}">${html}</a>`;
      }
      // Best effort, non verificato contro un documento reale (vedi
      // commento in cima al file): nessuno dei due articoli migrati usa
      // ==testo==, quindi questo ramo non è mai stato esercitato.
      case "highlight": {
        const color = (mark.attrs && mark.attrs.color) || "";
        const style = color ? ` style="color: ${color}"` : "";
        return `<mark class="article-highlight"${style}>${html}</mark>`;
      }
      default:
        return html;
    }
  }, text);
}

/* ---- Helper: contenuto inline di un paragrafo/heading (array di nodi "text") ---- */
function storyblokInlineToHtml(content) {
  if (!content) return "";
  return content
    .map((node) => {
      if (node.type === "text") return applyStoryblokMarks(node.text || "", node.marks);
      return "";
    })
    .join("");
}

/* ---- Componenti annidati (nodo "blok"): stesso HTML/classi prodotte da
   js/markdown-components.js per <!--box:...-->, <!--gallery:...-->,
   <!--columns3:...-->, <!--embed:...-->, <!--footnotes:...--> ---- */
function storyblokBlokToHtml(blokNode) {
  const body = (blokNode.attrs && blokNode.attrs.body) || [];
  const comp = body[0];
  if (!comp) return "";

  switch (comp.component) {
    case "box": {
      // box.content è un campo testo semplice (textarea), non richtext:
      // paragrafi separati da riga vuota.
      const html = String(comp.content || "")
        .split(/\n\n+/)
        .map((p) => `<p>${p.trim()}</p>`)
        .join("");
      if (comp.color) {
        return `<div class="article-box article-box--custom" style="--box-color: ${comp.color}">${html}</div>`;
      }
      return `<div class="article-box">${html}</div>`;
    }

    case "gallery": {
      const images = comp.images || [];
      const items = images
        .map((img) => {
          const src = (img && img.filename) || "";
          const alt = (img && img.alt) || "";
          return `<figure class="article-inline-image"><img src="${src}" alt="${alt}" loading="lazy"></figure>`;
        })
        .join("");
      return `<div class="article-gallery">${items}</div>`;
    }

    case "columns3": {
      const leftHtml = String(comp.left_text || "")
        .split(/\n\n+/)
        .map((p) => `<p>${p.trim()}</p>`)
        .join("");
      const rightHtml = String(comp.right_text || "")
        .split(/\n\n+/)
        .map((p) => `<p>${p.trim()}</p>`)
        .join("");
      const leftCls = comp.left_border ? "article-columns3-col article-box" : "article-columns3-col";
      const imgCls = comp.image_border ? "article-columns3-col article-box" : "article-columns3-col";
      const rightCls = comp.right_border ? "article-columns3-col article-box" : "article-columns3-col";
      const src = (comp.image && comp.image.filename) || "";
      const alt = (comp.image && comp.image.alt) || "";
      return (
        `<div class="article-columns3">` +
        `<div class="${leftCls}">${leftHtml}</div>` +
        `<div class="${imgCls}"><img src="${src}" alt="${alt}" loading="lazy"></div>` +
        `<div class="${rightCls}">${rightHtml}</div>` +
        `</div>`
      );
    }

    case "embed": {
      if (comp.type === "youtube") {
        const m = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(comp.url || "");
        const videoId = m ? m[1] : "";
        if (!videoId) return `<p class="article-embed-error">Video YouTube non riconosciuto.</p>`;
        return `<div class="article-embed article-embed--video"><iframe src="https://www.youtube.com/embed/${videoId}" title="Video YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
      }
      if (comp.type === "tweet") {
        const looksValid = /^https?:\/\/(www\.)?(twitter|x)\.com\/[^/\s]+\/status\/\d+/i.test(comp.url || "");
        if (!looksValid) return `<p class="article-embed-error">Link a un post X/Twitter non riconosciuto.</p>`;
        loadTwitterWidgetsScript();
        return `<div class="article-embed article-embed--tweet"><blockquote class="twitter-tweet"><a href="${comp.url}"></a></blockquote></div>`;
      }
      return `<p class="article-embed-error">Embed non riconosciuto.</p>`;
    }

    case "footnotes": {
      const notes = comp.note || [];
      if (!notes.length) return "";
      const items = notes
        .map((n) => {
          if (n.numero === undefined || n.numero === null || n.numero === "") return "";
          return `<li id="fn-${n.numero}" value="${n.numero}">${n.text || ""} <a class="article-footnote-back" href="#fnref-${n.numero}">↩</a></li>`;
        })
        .join("");
      return `<div class="article-footnotes"><ol class="article-footnotes-list">${items}</ol></div>`;
    }

    default:
      return "";
  }
}

// Stessa logica di ppLoadTwitterWidgets in js/markdown-components.js: un
// <script> dentro una stringa assegnata a innerHTML non si esegue mai,
// va creato via DOM reale, al massimo una volta per pagina.
function loadTwitterWidgetsScript() {
  if (window.__ppTwitterWidgetsRequested) {
    if (window.twttr && window.twttr.widgets) window.twttr.widgets.load();
    return;
  }
  window.__ppTwitterWidgetsRequested = true;
  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  document.head.appendChild(script);
}

/* ---- Nodo singolo del documento richtext → HTML ---- */
function storyblokNodeToHtml(node) {
  switch (node.type) {
    case "paragraph":
      return `<p>${storyblokInlineToHtml(node.content)}</p>`;
    case "heading": {
      const level = (node.attrs && node.attrs.level) || 2;
      const tag = level <= 2 ? "h2" : "h3";
      const cls = level <= 2 ? "article-heading" : "article-subheading";
      return `<${tag} class="${cls}">${storyblokInlineToHtml(node.content)}</${tag}>`;
    }
    case "image": {
      const src = (node.attrs && node.attrs.src) || "";
      const alt = (node.attrs && node.attrs.alt) || "";
      const title = node.attrs && node.attrs.title;
      const caption = title ? `<figcaption>${title}</figcaption>` : "";
      // Sempre centrata: il nodo image nativo non ha un campo per
      // destra/sinistra, vedi limite noto in cima al file.
      return `<figure class="article-inline-image article-inline-image--standalone article-inline-image--center"><img src="${src}" alt="${alt}" loading="lazy">${caption}</figure>`;
    }
    case "blok":
      return storyblokBlokToHtml(node);
    case "bullet_list": {
      const items = (node.content || []).map((li) => `<li>${storyblokInlineToHtml((li.content && li.content[0] && li.content[0].content) || [])}</li>`).join("");
      return `<ul>${items}</ul>`;
    }
    case "ordered_list": {
      const items = (node.content || []).map((li) => `<li>${storyblokInlineToHtml((li.content && li.content[0] && li.content[0].content) || [])}</li>`).join("");
      return `<ol>${items}</ol>`;
    }
    case "blockquote": {
      const inner = (node.content || []).map(storyblokNodeToHtml).join("");
      return `<blockquote>${inner}</blockquote>`;
    }
    default:
      return "";
  }
}

/* ---- Documento richtext completo → HTML ---- */
function storyblokRichtextToHtml(doc) {
  if (!doc || !doc.content) return "";
  return doc.content.map(storyblokNodeToHtml).join("");
}

/* ---- Adatta una story Storyblok alla forma che js/main.js si aspettava
   da un articolo di data/articles.json ---- */
function adaptStoryblokStory(story) {
  const c = story.content;
  const theme =
    c.tema && c.tema.length > 0
      ? {
          background: c.tema[0].background || "",
          accent: c.tema[0].accent || "",
          testoChiaro: !!c.tema[0].testo_chiaro,
        }
      : undefined;

  return {
    title: c.title,
    slug: c.slug,
    category: c.category,
    type: c.type,
    excerpt: c.excerpt,
    author: c.author,
    date: c.date,
    image: (c.image && c.image.filename) || "",
    featured: !!c.featured,
    theme: theme,
    triedOn: c.tried_on || "",
    seoTitle: c.seo_title || "",
    seoDescription: c.seo_description || "",
    seoKeywords: c.seo_keywords ? c.seo_keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
    // Già HTML pronto, non markdown: vedi renderMarkdownBody in js/main.js.
    content: storyblokRichtextToHtml(c.corpo),
  };
}

/* ---- Fetch dalla Content Delivery API, solo content_type "articolo",
   solo contenuti pubblicati ---- */
async function fetchStoryblokArticles() {
  const url = `https://api.storyblok.com/v2/cdn/stories?token=${encodeURIComponent(
    STORYBLOK_CDA_TOKEN
  )}&version=published&content_type=articolo&per_page=100`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Storyblok CDA: HTTP ${res.status}`);
  const data = await res.json();
  return (data.stories || []).map(adaptStoryblokStory);
}

/* ---- Fetch di UNA sola story per slug, in una versione specifica
   ("draft" o "published"). Usata da initStoryblokPreview() in
   js/main.js per l'anteprima live nel Visual Editor di Storyblok:
   dentro l'editor si vuole vedere la bozza corrente, non l'ultima
   versione pubblicata. Riusa lo stesso adaptStoryblokStory() di
   fetchStoryblokArticles(), quindi il risultato ha sempre la stessa
   forma che js/main.js si aspetta.

   cache: "no-store" + il parametro cb (cache-buster, un timestamp)
   servono a evitare che il browser risponda con una versione già in
   cache di questa stessa URL: durante l'anteprima live il redattore
   si aspetta sempre l'ultimissima bozza, mai una risposta vecchia. ---- */
async function fetchStoryblokStoryBySlug(slug, version) {
  version = version || "published";
  const url = `https://api.storyblok.com/v2/cdn/stories/${encodeURIComponent(
    slug
  )}?token=${encodeURIComponent(STORYBLOK_CDA_TOKEN)}&version=${encodeURIComponent(
    version
  )}&cb=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Storyblok CDA: HTTP ${res.status}`);
  const data = await res.json();
  return adaptStoryblokStory(data.story);
}
