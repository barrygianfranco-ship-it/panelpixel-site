/* Sanity adapter: i pubblicati di production arrivano direttamente dalla CDN pubblica.
   Staging e bozze restano dietro l'endpoint same-origin autenticato. */
(function () {
  const endpoint = '/api/sanity-content';
  const projectId = 'np9ttr0b';
  const productionDataset = 'production';
  const apiVersion = '2026-10-17';
  const imageProjection = 'asset->{_id,url,metadata{dimensions}}';
  const projection = `{...,
    image{...,${imageProjection}},
    corpo[]{
      ...,
      _type == "immagineEditoriale" => {...,${imageProjection}},
      _type == "gallery" => {...,images[]{...,${imageProjection}}},
      _type == "columns3" => {...,image{...,${imageProjection}}},
      _type == "survival_compare" => {...,left_image{...,${imageProjection}},right_image{...,${imageProjection}}},
      _type == "survival_panorama" => {...,image{...,${imageProjection}}}
    }
  }`;
  const originalImageUrl = window.storyblokImageUrl;
  const originalImageAttrs = window.storyblokImageAttrs;

  function esc(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function imageSource(image) {
    return typeof image === 'string' ? image : image && image.asset && image.asset.url || '';
  }
  function sanityImageUrl(value, width, height, format) {
    const src = imageSource(value);
    if (!/^https:\/\/cdn\.sanity\.io\/images\//.test(src)) return originalImageUrl(src, width, height, format);
    const url = new URL(src);
    if (width) url.searchParams.set('w', String(width));
    if (height) { url.searchParams.set('h', String(height)); url.searchParams.set('fit', 'crop'); }
    if (format === 'jpeg') url.searchParams.set('fm', 'jpg'); else url.searchParams.set('auto', 'format');
    url.searchParams.set('q', '80');
    return url.toString();
  }
  function sanityImageAttrs(value, width) {
    const src = imageSource(value);
    if (!/^https:\/\/cdn\.sanity\.io\/images\//.test(src)) return originalImageAttrs(src, width);
    const match = /-(\d+)x(\d+)(?:-[^.]+)?\.[a-z0-9]+$/i.exec(src.split('?')[0]);
    if (!match) return '';
    const ow = Number(match[1]); const oh = Number(match[2]); const w = Math.min(width, ow); const h = Math.round(w * oh / ow);
    const candidates = [...new Set([480, 900, w].filter((item) => item <= ow && item <= width))].sort((a, b) => a - b);
    const srcset = candidates.map((item) => `${sanityImageUrl(src, item)} ${item}w`).join(', ');
    return ` width="${w}" height="${h}"${srcset ? ` srcset="${esc(srcset)}" sizes="(max-width: 720px) 100vw, ${w}px"` : ''}`;
  }
  window.storyblokImageUrl = sanityImageUrl;
  window.storyblokImageAttrs = sanityImageAttrs;

  function imageHtml(image, width, extraClass) {
    if (!imageSource(image)) return '';
    const caption = image.didascalia ? `<figcaption>${esc(image.didascalia)}</figcaption>` : '';
    return `<figure class="article-inline-image${extraClass || ''}"><img src="${sanityImageUrl(image, width)}"${sanityImageAttrs(image, width)} alt="${esc(image.alt)}" loading="lazy">${caption}</figure>`;
  }
  function paragraphs(value, className) {
    return String(value || '').trim().split(/\n\n+/).filter(Boolean).map((part) => `<p${className ? ` class="${className}"` : ''}>${esc(part).replace(/\n/g, '<br>')}</p>`).join('');
  }
  function inline(block) {
    const defs = new Map((block.markDefs || []).map((item) => [item._key, item]));
    return (block.children || []).map((span) => {
      let html = esc(span.text).replace(/\n/g, '<br>');
      for (const mark of span.marks || []) {
        if (mark === 'strong') html = `<strong>${html}</strong>`;
        else if (mark === 'em') html = `<em>${html}</em>`;
        else if (mark === 'code') html = `<code>${html}</code>`;
        else if (mark === 'highlight') html = `<mark class="article-highlight">${html}</mark>`;
        else if (defs.has(mark)) {
          const def = defs.get(mark); const target = def.blank ? ' target="_blank" rel="noopener noreferrer"' : '';
          html = `<a href="${esc(def.href)}"${target}>${html}</a>`;
        }
      }
      return html;
    }).join('');
  }
  function custom(block) {
    switch (block._type) {
      case 'immagineEditoriale': {
        const alignment = ['left', 'right'].includes(block.allineamento) ? block.allineamento : 'center';
        const feature = alignment === 'center' ? '' : ' article-inline-image--feature';
        return imageHtml(block, 1400, ` article-inline-image--standalone article-inline-image--${alignment}${feature}`);
      }
      case 'box': return `<div class="article-box${block.color ? ' article-box--custom' : ''}"${block.color ? ` style="--box-color: ${esc(block.color)}"` : ''}>${paragraphs(block.content)}</div>`;
      case 'gallery': return `<div class="article-gallery">${(block.images || []).map((item) => imageHtml(item, 1400)).join('')}</div>`;
      case 'columns3': return `<div class="article-columns3"><div class="article-columns3-col${block.left_border ? ' article-box' : ''}">${paragraphs(block.left_text)}</div><div class="article-columns3-col${block.image_border ? ' article-box' : ''}">${imageSource(block.image) ? `<img src="${sanityImageUrl(block.image, 800)}"${sanityImageAttrs(block.image, 800)} alt="${esc(block.image.alt)}" loading="lazy">` : ''}</div><div class="article-columns3-col${block.right_border ? ' article-box' : ''}">${paragraphs(block.right_text)}</div></div>`;
      case 'embed': {
        if (block.type === 'youtube') { const id = String(block.url || '').match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)?.[1]; return id ? `<div class="article-embed article-embed--video"><iframe src="https://www.youtube.com/embed/${esc(id)}" title="Video YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>` : '<p class="article-embed-error">Video YouTube non riconosciuto.</p>'; }
        if (block.type === 'tweet') { if (typeof window.loadTwitterWidgetsScript === 'function') window.loadTwitterWidgetsScript(); return `<div class="article-embed article-embed--tweet"><blockquote class="twitter-tweet"><a href="${esc(block.url)}"></a></blockquote></div>`; }
        return '<p class="article-embed-error">Embed non riconosciuto.</p>';
      }
      case 'footnotes': return `<div class="article-footnotes"><ol class="article-footnotes-list">${(block.note || []).map((item) => `<li id="fn-${Number(item.numero)}" value="${Number(item.numero)}">${esc(item.text)} <a class="article-footnote-back" href="#fnref-${Number(item.numero)}">↩</a></li>`).join('')}</ol></div>`;
      case 'pullquote': return block.text ? `<aside class="article-pullquote" aria-label="Citazione in evidenza"><p class="article-pullquote-kicker">Passaggio chiave</p><blockquote>${esc(block.text)}</blockquote>${block.source ? `<cite>${esc(block.source)}</cite>` : ''}</aside>` : '';
      case 'takeaway': return block.text ? `<section class="article-takeaway" aria-label="${esc(block.title || 'Cosa ci resta')}"><div class="article-takeaway-heading"><p class="article-takeaway-kicker">Il punto</p><h2>${esc(block.title || 'Cosa ci resta')}</h2></div><p class="article-takeaway-statement">${esc(block.text)}</p>${block.note ? `<div class="article-takeaway-note"><span>${esc(block.note_label || 'Vale il viaggio?')}</span><p>${esc(block.note)}</p></div>` : ''}</section>` : '';
      case 'work_card': {
        const items = [1,2,3,4].map((n) => [block[`item_${n}_label`], block[`item_${n}_value`]]).filter((item) => item[0] || item[1]);
        return block.title && items.length ? `<section class="article-work-card" aria-label="Scheda dell'opera"><div class="article-work-card-heading"><p class="article-work-card-kicker">In breve</p><h2>${esc(block.title)}</h2></div><dl class="article-work-card-list">${items.map((item) => `<div><dt>${esc(item[0])}</dt><dd>${esc(item[1])}</dd></div>`).join('')}</dl></section>` : '';
      }
      case 'survival_chapter': return block.title ? `<section class="survival-chapter"><div class="survival-chapter-index" aria-hidden="true">${esc(block.number || 'FILE')}</div><div class="survival-chapter-copy"><p class="survival-chapter-eyebrow">${esc(block.eyebrow || 'Archivio')}</p><h2 class="article-heading">${esc(block.title)}</h2>${block.years ? `<p class="survival-chapter-years">${esc(block.years)}</p>` : ''}${paragraphs(block.summary, 'survival-chapter-summary')}</div></section>` : '';
      case 'survival_timeline': return `<section class="survival-timeline" aria-label="${esc(block.title || 'Cronologia')}"><p class="survival-block-label">Sequenza eventi</p><h2>${esc(block.title || 'Cronologia')}</h2><ol>${(block.items || []).map((item) => `<li class="survival-timeline-item"><p class="survival-timeline-year">${esc(item.year)}</p><div><h3>${esc(item.title)}</h3>${item.text ? `<p>${esc(item.text)}</p>` : ''}</div></li>`).join('')}</ol></section>`;
      case 'survival_compare': {
        const side = (pos, image, title, text) => `<article class="survival-compare-side survival-compare-side--${pos}">${imageSource(image) ? `<img src="${sanityImageUrl(image, 1100)}"${sanityImageAttrs(image, 1100)} alt="${esc(image.alt)}" loading="lazy">` : ''}<div><h3>${esc(title)}</h3>${paragraphs(text)}</div></article>`;
        return `<section class="survival-compare"><header><p class="survival-block-label">Doppia esposizione</p><h2>${esc(block.title || 'Allora / Adesso')}</h2></header><div class="survival-compare-grid">${side('left', block.left_image, block.left_title, block.left_text)}${side('right', block.right_image, block.right_title, block.right_text)}</div></section>`;
      }
      case 'survival_panorama': return imageSource(block.image) ? `<figure class="survival-panorama"><img src="${sanityImageUrl(block.image, 2000)}"${sanityImageAttrs(block.image, 2000)} alt="${esc(block.image.alt)}" loading="lazy">${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ''}</figure>` : '';
      case 'survival_dossier': return block.title || block.text ? `<aside class="survival-dossier"><header><p class="survival-dossier-label">${esc(block.label || 'Documento riservato')}</p>${block.code ? `<p class="survival-dossier-code">${esc(block.code)}</p>` : ''}</header>${block.title ? `<h2>${esc(block.title)}</h2>` : ''}<div class="survival-dossier-copy">${paragraphs(block.text)}</div></aside>` : '';
      default: return '';
    }
  }
  function portableTextToHtml(blocks) {
    let html = ''; let list = '';
    const closeList = () => { if (list) { html += `</${list}>`; list = ''; } };
    for (const block of blocks || []) {
      if (block._type === 'block') {
        if (block.listItem) {
          const tag = block.listItem === 'number' ? 'ol' : 'ul'; if (list !== tag) { closeList(); html += `<${tag}>`; list = tag; }
          html += `<li>${inline(block)}</li>`; continue;
        }
        closeList(); const content = inline(block);
        if (block.style === 'h2') html += `<h2 class="article-heading">${content}</h2>`;
        else if (block.style === 'h3') html += `<h3 class="article-subheading">${content}</h3>`;
        else if (block.style === 'blockquote') html += `<blockquote><p>${content}</p></blockquote>`;
        else if (content) html += `<p>${content}</p>`;
      } else { closeList(); html += custom(block); }
    }
    closeList(); return html;
  }
  function imageCredits(document) {
    const owners = []; const sources = []; const add = (list, value) => { const text = String(value || '').trim().replace(/\.$/, ''); if (text && !list.includes(text)) list.push(text); };
    (function walk(value) { if (!value || typeof value !== 'object') return; if (value._type === 'immagineEditoriale') { add(owners, value.copyright); add(sources, value.fonte); } Object.values(value).forEach(walk); })([document.image, document.corpo]);
    return {owners, sources};
  }
  function adaptSanityArticle(document) {
    const image = imageSource(document.image); const theme = document.tema ? {background: document.tema.background || '', accent: document.tema.accent || '', accent2: document.tema.accento_2 || '', accent3: document.tema.accento_3 || '', testoChiaro: !!document.tema.testo_chiaro} : undefined;
    return {title: document.title, slug: document.slug && document.slug.current || '', category: document.category, type: document.type, excerpt: document.excerpt, author: document.author, date: document.date, image, imageAlt: document.image && document.image.alt || '', imageCredits: imageCredits(document), featured: !!document.featured, theme, layout: ['tavola','survival'].includes(document.impaginazione) ? document.impaginazione : 'standard', masthead: {line1: String(document.testata_titolo || '').trim(), line2: String(document.testata_sottotitolo || '').trim()}, pattern: document.motivo || '', triedOn: document.tried_on || '', seoTitle: document.seo_title || '', seoDescription: document.seo_description || '', seoKeywords: document.seo_keywords || [], hasContent: !!(document.corpo && document.corpo.length), content: portableTextToHtml(document.corpo)};
  }
  function usePrivateStaging(params) {
    if (params.get('preview') === '1') return true;
    if (typeof window.location === 'undefined') return false;
    const requestedDataset = new URLSearchParams(window.location.search || '').get('sanity-dataset');
    return requestedDataset === 'staging' || ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  }
  async function publicProductionRequest(params) {
    const slug = params.get('slug');
    const filter = `_type == "articolo" && stato == "approvato"`;
    const query = slug
      ? `*[${filter} && slug.current == $slug][0]${projection}`
      : `*[${filter}] | order(date desc) ${projection}`;
    const url = new URL(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${productionDataset}`);
    url.searchParams.set('query', query);
    url.searchParams.set('perspective', 'published');
    if (slug) url.searchParams.set('$slug', JSON.stringify(slug));
    const response = await fetch(url, {cache: 'default'});
    if (!response.ok) throw new Error(`Sanity CDN: HTTP ${response.status}`);
    const result = (await response.json()).result;
    return slug ? {document: result, preview: false} : {documents: result || [], preview: false};
  }
  async function request(params) {
    if (!usePrivateStaging(params)) return publicProductionRequest(params);
    const response = await fetch(`${endpoint}?${params.toString()}`, {credentials: 'same-origin', cache: params.get('preview') === '1' ? 'no-store' : 'default'});
    if (!response.ok) throw new Error(`Sanity endpoint: HTTP ${response.status}`);
    return response.json();
  }
  window.adaptSanityArticle = adaptSanityArticle;
  window.fetchSanityArticles = async () => (await request(new URLSearchParams())).documents.map(adaptSanityArticle);
  window.fetchSanityArticleBySlug = async (slug, preview) => {
    const params = new URLSearchParams({slug}); if (preview) params.set('preview', '1');
    const document = (await request(params)).document; if (!document) throw new Error(`Articolo Sanity non trovato: ${slug}`);
    return adaptSanityArticle(document);
  };
})();
