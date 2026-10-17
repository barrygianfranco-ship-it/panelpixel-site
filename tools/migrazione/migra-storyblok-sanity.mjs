import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import {createReadStream} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..', '..')
const backupDir = path.join(root, 'local-editorial', 'backup-storyblok', '2026-10-17')
const projectId = 'np9ttr0b'

const client = globalThis.__PANEL_PIXEL_SANITY_CLIENT__
if (!client) throw new Error('Avviare questo script tramite uno dei runner in sanity-studio/scripts')
const configured = client.config()
const dataset = configured.dataset
if (configured.projectId !== projectId || !['staging', 'production'].includes(dataset)) {
  throw new Error(`Blocco di sicurezza: progetto/dataset non consentito (${configured.projectId}/${dataset})`)
}
if (dataset === 'production' && globalThis.__PANEL_PIXEL_ALLOW_PRODUCTION_IMPORT__ !== true) {
  throw new Error('Blocco di sicurezza: production richiede il runner migrate-production.mjs')
}
const reportJson = path.join(backupDir, `migration-report-${dataset}.json`)
const reportMd = path.join(backupDir, `migration-report-${dataset}.md`)

const draftBundle = JSON.parse(await fs.readFile(path.join(backupDir, 'stories-draft.json'), 'utf8'))
const publishedBundle = JSON.parse(await fs.readFile(path.join(backupDir, 'stories-published.json'), 'utf8'))
const assets = JSON.parse(await fs.readFile(path.join(backupDir, 'assets.json'), 'utf8'))
const previewHtml = await fs.readFile(path.join(root, 'tests', 'survival-preview.html'), 'utf8')
const publishedIds = new Set(publishedBundle.stories.map((story) => story.id))
const assetInfo = new Map(assets.map((asset) => [normalizeUrl(asset.url), asset]))
const assetRefs = new Map()
const report = {
  generatedAt: new Date().toISOString(), projectId, dataset,
  source: 'local-editorial/backup-storyblok/2026-10-17',
  articles: {total: 0, published: 0, drafts: 0, created: 0, replaced: 0},
  fixtureSurvival: {created: false, skipped: dataset !== 'staging', source: 'tests/survival-preview.html'},
  assets: {referenced: assets.length, uploaded: 0, reused: 0, failed: []},
  daCompletare: [], missingAssets: [], unrecognized: [],
}

let keyIndex = 0
const key = (prefix = 'k') => `${prefix}${(++keyIndex).toString(36)}`
const clean = (value) => JSON.parse(JSON.stringify(value))
function normalizeUrl(value) {
  return typeof value === 'string' ? value.split('/m/')[0].split('?')[0] : ''
}
function articleId(slug) {
  return `articolo-${crypto.createHash('sha1').update(slug).digest('hex').slice(0, 32)}`
}
function recordUnrecognized(kind, value, slug) {
  const found = report.unrecognized.find((item) => item.kind === kind && item.value === value)
  if (found) { found.count += 1; if (!found.slugs.includes(slug)) found.slugs.push(slug) }
  else report.unrecognized.push({kind, value, count: 1, slugs: [slug]})
}

async function uploadFile(localFile, sourceId, sourceName) {
  const bytes = await fs.readFile(localFile)
  const sha1 = crypto.createHash('sha1').update(bytes).digest('hex')
  const existing = await client.fetch(`*[_type == "sanity.imageAsset" && sha1hash == $sha1][0]._id`, {sha1})
  if (existing) { report.assets.reused += 1; return existing }
  const uploaded = await client.assets.upload('image', createReadStream(localFile), {filename: path.basename(localFile)})
  await client.patch(uploaded._id).set({source: {id: sourceId, name: sourceName, url: sourceId.startsWith('http') ? sourceId : undefined}}).commit()
  report.assets.uploaded += 1
  return uploaded._id
}

async function prepareAssets() {
  for (const asset of assets) {
    const url = normalizeUrl(asset.url)
    if (!asset.localFile || asset.downloadStatus !== 'ok') {
      report.assets.failed.push({url, reason: asset.downloadError || 'File locale non disponibile'})
      continue
    }
    try {
      const id = await uploadFile(path.join(backupDir, asset.localFile), url, 'Storyblok')
      assetRefs.set(url, id)
      const missing = ['alt', 'copyright', 'source'].filter((name) => !String(asset[name] || '').trim())
      if (missing.length) report.daCompletare.push({url, localFile: asset.localFile, missing, references: asset.references || []})
    } catch (error) {
      report.assets.failed.push({url, reason: error.message})
    }
  }
}

function imageValue(source, slug, alignment) {
  const url = normalizeUrl(source?.filename || source?.src || '')
  const info = assetInfo.get(url) || {}
  const ref = assetRefs.get(url)
  if (!ref) {
    if (url) report.missingAssets.push({slug, url})
    return null
  }
  const value = {
    _type: 'immagineEditoriale', _key: key('img'), asset: {_type: 'reference', _ref: ref},
    alt: source?.alt || info.alt || source?.title || info.title || '',
    didascalia: source?.title || info.title || '',
    copyright: source?.copyright || info.copyright || '',
    fonte: source?.source || info.source || '', importata_da_storyblok: true,
    allineamento: ['left', 'right'].includes(alignment) ? alignment : 'center',
  }
  value.da_completare = !value.alt.trim() || !value.copyright.trim() || !value.fonte.trim()
  return value
}

function inline(content, slug, markDefs) {
  const spans = []
  for (const node of content || []) {
    if (node.type === 'hard_break') {
      if (spans.length) spans[spans.length - 1].text += '\n'
      else spans.push({_type: 'span', _key: key('s'), text: '\n', marks: []})
      continue
    }
    if (node.type === 'emoji') {
      spans.push({_type: 'span', _key: key('s'), text: node.attrs?.emoji || '', marks: []})
      continue
    }
    if (node.type !== 'text') { recordUnrecognized('inline-node', node.type || 'unknown', slug); continue }
    const marks = []
    for (const mark of node.marks || []) {
      if (mark.type === 'bold') marks.push('strong')
      else if (mark.type === 'italic') marks.push('em')
      else if (mark.type === 'code') marks.push('code')
      else if (mark.type === 'highlight') marks.push('highlight')
      else if (mark.type === 'link') {
        const markKey = key('link')
        markDefs.push({_type: 'link', _key: markKey, href: mark.attrs?.href || '', blank: mark.attrs?.target === '_blank'})
        marks.push(markKey)
      } else if (mark.type !== 'textStyle') recordUnrecognized('mark', mark.type || 'unknown', slug)
    }
    spans.push({_type: 'span', _key: key('s'), text: node.text || '', marks})
  }
  return spans
}

function textBlock(node, slug, style = 'normal', listItem, level = 1) {
  const markDefs = []
  const block = {_type: 'block', _key: key('b'), style, markDefs, children: inline(node.content, slug, markDefs)}
  if (listItem) { block.listItem = listItem; block.level = level }
  return block
}

function component(comp, slug) {
  const base = {_type: comp.component, _key: key('c')}
  switch (comp.component) {
    case 'box': return {...base, content: comp.content || '', color: comp.color || ''}
    case 'gallery': return {...base, images: (comp.images || []).map((item) => imageValue(item, slug)).filter(Boolean)}
    case 'columns3': return {...base, left_text: comp.left_text || '', left_border: !!comp.left_border, image: imageValue(comp.image, slug), image_border: !!comp.image_border, right_text: comp.right_text || '', right_border: !!comp.right_border}
    case 'embed': return {...base, type: comp.type || '', url: comp.url || ''}
    case 'footnotes': return {...base, note: (comp.note || []).map((item) => ({_type: 'footnoteItem', _key: key('fn'), numero: Number(item.numero), text: item.text || ''}))}
    case 'pullquote': return {...base, text: comp.text || '', source: comp.source || ''}
    case 'takeaway': return {...base, title: comp.title || '', text: comp.text || '', note_label: comp.note_label || '', note: comp.note || ''}
    case 'work_card': return {...base, title: comp.title || '', ...Object.fromEntries([1,2,3,4].flatMap((n) => [[`item_${n}_label`, comp[`item_${n}_label`] || ''], [`item_${n}_value`, comp[`item_${n}_value`] || '']]))}
    case 'survival_chapter': return {...base, number: comp.number || comp.numero || '', eyebrow: comp.eyebrow || comp.occhiello || '', title: comp.title || comp.titolo || '', years: comp.years || comp.anni || '', summary: comp.summary || comp.sommario || ''}
    case 'survival_timeline': return {...base, title: comp.title || comp.titolo || '', items: (comp.items || comp.entries || comp.eventi || []).map((item) => ({_type: 'survival_timeline_item', _key: key('tl'), year: item.year || item.anno || '', title: item.title || item.titolo || '', text: item.text || item.testo || ''}))}
    case 'survival_compare': return {...base, title: comp.title || comp.titolo || '', left_image: imageValue(comp.left_image || comp.immagine_sinistra, slug), left_title: comp.left_title || comp.titolo_sinistra || '', left_text: comp.left_text || comp.testo_sinistra || '', right_image: imageValue(comp.right_image || comp.immagine_destra, slug), right_title: comp.right_title || comp.titolo_destra || '', right_text: comp.right_text || comp.testo_destra || ''}
    case 'survival_panorama': return {...base, image: imageValue(comp.image, slug), caption: comp.caption || comp.didascalia || ''}
    case 'survival_dossier': return {...base, label: comp.label || comp.etichetta || '', code: comp.code || comp.codice || '', title: comp.title || comp.titolo || '', text: comp.text || comp.testo || ''}
    default: recordUnrecognized('custom-block', comp.component || 'unknown', slug); return null
  }
}

function convertNode(node, slug, listItem, level = 1, imageAlignment) {
  if (!node) return []
  if (node.type === 'paragraph') {
    const result = []; let pending = []
    const flush = () => { if (pending.length) result.push(textBlock({...node, content: pending}, slug, 'normal', listItem, level)); pending = [] }
    for (const child of node.content || []) {
      if (child.type === 'image' || child.type === 'blok') {
        flush()
        result.push(...convertNode(child, slug, undefined, 1, node.attrs?.textAlign))
      } else pending.push(child)
    }
    flush(); return result
  }
  if (node.type === 'heading') return [textBlock(node, slug, Number(node.attrs?.level) <= 2 ? 'h2' : 'h3')]
  if (node.type === 'blockquote') return (node.content || []).flatMap((child) => child.type === 'paragraph' ? [textBlock(child, slug, 'blockquote')] : convertNode(child, slug))
  if (node.type === 'image') { const image = imageValue(node.attrs, slug, imageAlignment || node.attrs?.textAlign); return image ? [image] : [] }
  if (node.type === 'blok') return (node.attrs?.body || []).map((item) => component(item, slug)).filter(Boolean)
  if (node.type === 'bullet_list' || node.type === 'ordered_list') {
    const kind = node.type === 'bullet_list' ? 'bullet' : 'number'
    return (node.content || []).flatMap((item) => (item.content || []).flatMap((child) => convertNode(child, slug, kind, level)))
  }
  if (node.type === 'list_item') return (node.content || []).flatMap((child) => convertNode(child, slug, listItem || 'bullet', level))
  if (node.type === 'horizontal_rule') { recordUnrecognized('block-node', 'horizontal_rule', slug); return [] }
  recordUnrecognized('block-node', node.type || 'unknown', slug); return []
}

function articleDocument(story) {
  keyIndex = 0
  const c = story.content
  const slug = String(c.slug || story.slug || '').trim()
  const isPublished = publishedIds.has(story.id)
  const id = articleId(slug)
  const cover = imageValue(c.image, slug)
  if (!cover) report.missingAssets.push({slug, url: '(copertina assente)'})
  return clean({
    _id: isPublished ? id : `drafts.${id}`, _type: 'articolo', title: c.title || story.name,
    slug: {_type: 'slug', current: slug}, category: c.category || '', type: c.type || '', excerpt: c.excerpt || '',
    author: c.author || '', date: c.date || null, image: cover, featured: !!c.featured,
    stato: isPublished ? 'approvato' : 'bozza', corpo: (c.corpo?.content || []).flatMap((node) => convertNode(node, slug)),
    tema: c.tema?.[0] ? {_type: 'temaArticolo', background: c.tema[0].background || '', accent: c.tema[0].accent || '', accento_2: c.tema[0].accento_2 || '', accento_3: c.tema[0].accento_3 || '', testo_chiaro: !!c.tema[0].testo_chiaro} : undefined,
    impaginazione: ['standard', 'tavola', 'survival'].includes(c.impaginazione) ? c.impaginazione : 'standard',
    testata_titolo: c.testata_titolo || '', testata_sottotitolo: c.testata_sottotitolo || '', motivo: c.motivo || '', tried_on: c.tried_on || '',
    seo_title: c.seo_title || '', seo_description: c.seo_description || '', seo_keywords: String(c.seo_keywords || '').split(',').map((v) => v.trim()).filter(Boolean),
  })
}

const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/&(?:#039|apos);/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim()
const find = (pattern, fallback = '') => strip(previewHtml.match(pattern)?.[1] || fallback)
async function survivalFixture() {
  for (const requiredClass of ['survival-timeline', 'survival-chapter', 'survival-compare', 'survival-panorama', 'survival-dossier']) {
    if (!previewHtml.includes(requiredClass)) throw new Error(`Fixture Survival incompleto: manca ${requiredClass}`)
  }
  const fixtureImages = {}
  for (const rel of ['assets/images/chrono-valley-anatomia-di-un-culto.svg', 'assets/images/ombre-di-vetro-nuovo-capitolo.svg', 'assets/images/nova-terra-open-world-che-respira.svg', 'assets/images/miyazaki-trent-anni-di-mondi.svg']) {
    fixtureImages[rel] = await uploadFile(path.join(root, rel), `fixture:${rel}`, 'Preview locale Panel Pixel')
  }
  const img = (rel, alt) => ({_type: 'immagineEditoriale', _key: key('img'), asset: {_type: 'reference', _ref: fixtureImages[rel]}, alt, copyright: '© Panel Pixel', fonte: 'tests/survival-preview.html', didascalia: ''})
  keyIndex = 0
  const body = [
    textBlock({content: [{type: 'text', text: find(/<div class="article-body">\s*<p>(.*?)<\/p>/s)}]}, 'test-survival-preview'),
    {_type: 'survival_timeline', _key: key('c'), title: 'La saga in quattro svolte', items: [['1996','La soglia','La villa definisce il survival horror.'],['1998','La città','L’epidemia invade lo spazio urbano.'],['2005','La mutazione','L’azione riscrive il linguaggio della serie.'],['2017','La rinascita','La prima persona riporta la paura vicino al corpo.']].map(([year,title,text]) => ({_type: 'survival_timeline_item', _key: key('tl'), year,title,text}))},
    {_type: 'survival_chapter', _key: key('c'), number: '01', eyebrow: 'Le origini', title: 'La villa e il contagio', years: '1996—1998', summary: 'Spazi chiusi, risorse limitate e la sensazione che ogni porta possa nascondere qualcosa.'},
    {_type: 'survival_dossier', _key: key('c'), label: 'Documento riservato', code: 'RE / 001', title: 'La porta come montaggio', text: 'Quelle animazioni nascondevano i caricamenti, ma finirono per diventare uno dei simboli più riconoscibili della serie.'},
    {_type: 'survival_compare', _key: key('c'), title: 'Originale / Remake', left_image: img('assets/images/ombre-di-vetro-nuovo-capitolo.svg','Segnaposto originale'), left_title: '1998', left_text: 'La geometria fissa, il fuori campo e l’immaginazione del giocatore.', right_image: img('assets/images/nova-terra-open-world-che-respira.svg','Segnaposto remake'), right_title: '2019', right_text: 'La città riemerge attraverso luce dinamica, prossimità e materia.'},
    {_type: 'survival_panorama', _key: key('c'), image: img('assets/images/miyazaki-trent-anni-di-mondi.svg','Segnaposto panoramico'), caption: 'Spazio riservato a una delle illustrazioni originali.'},
  ]
  const doc = {_id: 'drafts.test-survival-preview', _type: 'articolo', title: find(/<h1 class="article-title">(.*?)<\/h1>/s, 'Preview layout Survival'), slug: {_type: 'slug', current: 'test-survival-preview'}, category: 'Approfondimento', type: 'approfondimento', excerpt: find(/<p class="article-subtitle">(.*?)<\/p>/s), author: 'Gianfranco Barry', date: '2026-10-31', image: img('assets/images/chrono-valley-anatomia-di-un-culto.svg','Immagine segnaposto'), featured: false, stato: 'bozza', corpo: body, impaginazione: 'survival', testata_titolo: find(/<p class="survival-cover-line1">(.*?)<\/p>/s), testata_sottotitolo: find(/<p class="survival-cover-line2">(.*?)<\/p>/s), tema: {_type: 'temaArticolo', accent: '#9f251f', testo_chiaro: true}}
  await client.createOrReplace(clean(doc)); report.fixtureSurvival.created = true
}

await prepareAssets()
const stories = draftBundle.stories.filter((story) => story.content?.component === 'articolo' && String(story.content.slug || story.slug || story.full_slug || '').trim())
const ids = stories.map((story) => articleId(story.content.slug || story.slug || story.full_slug)).flatMap((id) => [id, `drafts.${id}`])
const existing = new Set(
  (await Promise.all(ids.map((id) => client.getDocument(id))))
    .filter(Boolean)
    .map((document) => document._id),
)
for (const story of stories) {
  const doc = articleDocument(story)
  await client.createOrReplace(doc)
  report.articles.total += 1
  if (publishedIds.has(story.id)) report.articles.published += 1; else report.articles.drafts += 1
  if (existing.has(doc._id)) report.articles.replaced += 1; else report.articles.created += 1
}
if (dataset === 'staging') await survivalFixture()
report.daCompletare.sort((a, b) => a.localFile.localeCompare(b.localFile))
report.missingAssets = [...new Map(report.missingAssets.map((item) => [`${item.slug}|${item.url}`, item])).values()]
await fs.writeFile(reportJson, JSON.stringify(report, null, 2) + '\n')
const lines = [`# Report migrazione Storyblok → Sanity ${dataset}`, '', `Generato: ${report.generatedAt}`, '', `- Articoli migrati: **${report.articles.total}** (${report.articles.published} pubblicati, ${report.articles.drafts} bozze)`, `- Documenti nuovi: **${report.articles.created}**; sostituiti idempotentemente: **${report.articles.replaced}**`, `- Asset caricati: **${report.assets.uploaded}**; riutilizzati: **${report.assets.reused}**; falliti: **${report.assets.failed.length}**`, `- Asset da completare: **${report.daCompletare.length}**`, `- Blocchi/nodi non riconosciuti: **${report.unrecognized.reduce((sum, item) => sum + item.count, 0)}**`, `- Fixture Survival: **${report.fixtureSurvival.created ? 'creata come bozza' : 'non importata in questo dataset'}**`, '', '## Asset da completare', '']
for (const item of report.daCompletare) lines.push(`- \`${item.localFile}\` — manca: ${item.missing.join(', ')} — ${item.url}`)
lines.push('', '## Elementi non riconosciuti', '')
for (const item of report.unrecognized) lines.push(`- ${item.kind} \`${item.value}\`: ${item.count} (${item.slugs.join(', ')})`)
if (!report.unrecognized.length) lines.push('- Nessuno')
lines.push('', '## Asset mancanti o falliti', '')
for (const item of [...report.assets.failed, ...report.missingAssets]) lines.push(`- ${item.url}: ${item.reason || item.slug}`)
if (!report.assets.failed.length && !report.missingAssets.length) lines.push('- Nessuno')
await fs.writeFile(reportMd, lines.join('\n') + '\n')
console.log(JSON.stringify(report, null, 2))
if (report.assets.failed.length) process.exitCode = 2
