import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..', '..')
const backupDir = path.join(root, 'local-editorial', 'backup-storyblok', '2026-10-17')
const reportJson = path.join(backupDir, 'fase5-confronto-html.json')
const reportMd = path.join(backupDir, 'fase5-confronto-html.md')
const client = globalThis.__PANEL_PIXEL_SANITY_CLIENT__

if (!client) throw new Error('Avviare tramite sanity-studio/scripts/compare-html-staging.mjs')
const config = client.config()
if (config.projectId !== 'np9ttr0b' || config.dataset !== 'staging') {
  throw new Error('Blocco di sicurezza: atteso np9ttr0b/staging')
}

const imageProjection = 'asset->{_id,url,metadata{dimensions}}'
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
}`

function loadStoryblokAdapter(source) {
  const window = {}
  const document = {createElement: () => ({}), head: {appendChild: () => {}}}
  const context = vm.createContext({window, document, URL, URLSearchParams, fetch: async () => { throw new Error('fetch inatteso') }})
  vm.runInContext(source, context)
  return context.adaptStoryblokStory
}

function loadSanityAdapter(source) {
  const window = {
    storyblokImageUrl: (url) => url,
    storyblokImageAttrs: () => '',
  }
  const context = vm.createContext({window, URL, URLSearchParams, fetch: async () => { throw new Error('fetch inatteso') }})
  vm.runInContext(source, context)
  return window.adaptSanityArticle
}

function decodeEntities(value) {
  return String(value)
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(parseInt(number, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function normalizeHtml(html) {
  return decodeEntities(html)
    .replace(/\s(?:src|srcset|sizes|width|height)="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
  }
  return value === undefined ? null : value
}

function same(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right))
}

function snippet(left, right) {
  let index = 0
  while (index < left.length && index < right.length && left[index] === right[index]) index += 1
  const start = Math.max(0, index - 90)
  return {
    index,
    storyblok: left.slice(start, index + 180),
    sanity: right.slice(start, index + 180),
  }
}

const draftBundle = JSON.parse(await fs.readFile(path.join(backupDir, 'stories-draft.json'), 'utf8'))
const publishedBundle = JSON.parse(await fs.readFile(path.join(backupDir, 'stories-published.json'), 'utf8'))
const storyblokSource = await fs.readFile(path.join(root, 'js', 'storyblok-richtext.js'), 'utf8')
const sanitySource = await fs.readFile(path.join(root, 'js', 'sanity-adapter.js'), 'utf8')
const adaptStoryblok = loadStoryblokAdapter(storyblokSource)
const adaptSanity = loadSanityAdapter(sanitySource)
const stories = draftBundle.stories
  .filter((story) => story.content?.component === 'articolo')
  .sort((left, right) => String(left.content.slug).localeCompare(String(right.content.slug)))
const slugs = stories.map((story) => String(story.content.slug || story.slug || story.full_slug).trim())
const publishedIds = new Set(publishedBundle.stories.map((story) => story.id))

const sanityDocuments = await client.fetch(
  `*[_type == "articolo" && slug.current in $slugs]${projection}`,
  {slugs},
  {perspective: 'raw'},
)
const sanityBySlug = new Map()
for (const document of sanityDocuments.sort((left, right) => Number(left._id.startsWith('drafts.')) - Number(right._id.startsWith('drafts.')))) {
  sanityBySlug.set(document.slug?.current, document)
}

const comparedFields = [
  'title', 'slug', 'category', 'type', 'excerpt', 'author', 'date', 'imageAlt', 'imageCredits',
  'featured', 'theme', 'layout', 'masthead', 'pattern', 'triedOn', 'seoTitle', 'seoDescription',
  'seoKeywords', 'hasContent',
]
const articles = []
for (const story of stories) {
  const slug = String(story.content.slug || story.slug || story.full_slug).trim()
  const document = sanityBySlug.get(slug)
  if (!document) {
    articles.push({slug, published: publishedIds.has(story.id), missingInSanity: true, fieldDifferences: ['documento assente'], htmlEqual: false})
    continue
  }
  const fromStoryblok = adaptStoryblok(story)
  const fromSanity = adaptSanity(document)
  const fieldDifferences = comparedFields.filter((field) => !same(fromStoryblok[field], fromSanity[field]))
    .map((field) => ({field, storyblok: stable(fromStoryblok[field]), sanity: stable(fromSanity[field])}))
  const storyblokHtml = normalizeHtml(fromStoryblok.content)
  const sanityHtml = normalizeHtml(fromSanity.content)
  const htmlEqual = storyblokHtml === sanityHtml
  articles.push({
    slug,
    published: publishedIds.has(story.id),
    sanityId: document._id,
    fieldDifferences,
    htmlEqual,
    htmlLengths: {storyblok: storyblokHtml.length, sanity: sanityHtml.length},
    firstHtmlDifference: htmlEqual ? null : snippet(storyblokHtml, sanityHtml),
  })
}

const report = {
  generatedAt: new Date().toISOString(),
  projectId: config.projectId,
  dataset: config.dataset,
  source: 'backup Storyblok draft confrontato con Sanity raw/staging',
  normalization: 'URL e attributi responsive delle immagini ignorati; testo ed entità HTML normalizzati',
  summary: {
    totalSlugs: articles.length,
    missingInSanity: articles.filter((item) => item.missingInSanity).length,
    matchingFields: articles.filter((item) => !item.missingInSanity && item.fieldDifferences.length === 0).length,
    matchingHtml: articles.filter((item) => item.htmlEqual).length,
    differingHtml: articles.filter((item) => !item.htmlEqual).length,
  },
  articles,
}

await fs.writeFile(reportJson, JSON.stringify(report, null, 2) + '\n')
const lines = [
  '# Fase 5 — confronto HTML Storyblok / Sanity', '',
  `Generato: ${report.generatedAt}`, '',
  `- Dataset Sanity: **${report.dataset}**`,
  `- Slug confrontati: **${report.summary.totalSlugs}**`,
  `- Documenti mancanti in Sanity: **${report.summary.missingInSanity}**`,
  `- Articoli con campi adattati identici: **${report.summary.matchingFields}**`,
  `- Articoli con HTML normalizzato identico: **${report.summary.matchingHtml}**`,
  `- Articoli con differenze HTML: **${report.summary.differingHtml}**`, '',
  '> Nel confronto HTML sono neutralizzati soltanto URL, srcset e dimensioni delle immagini, perché i due CMS usano CDN diverse. Testo, struttura, classi e attributi funzionali restano nel confronto.', '',
  '## Dettaglio', '',
]
for (const article of articles) {
  const fieldCount = Array.isArray(article.fieldDifferences) ? article.fieldDifferences.length : 1
  lines.push(`- \`${article.slug}\` — campi: ${fieldCount ? `**${fieldCount} differenze**` : 'OK'}; HTML: ${article.htmlEqual ? 'OK' : '**differente**'}${article.missingInSanity ? '; documento Sanity assente' : ''}`)
  for (const difference of article.fieldDifferences || []) {
    if (typeof difference === 'string') continue
    lines.push(`  - \`${difference.field}\`: Storyblok \`${JSON.stringify(difference.storyblok)}\`; Sanity \`${JSON.stringify(difference.sanity)}\``)
  }
  if (article.firstHtmlDifference) {
    lines.push(`  - prima differenza HTML all'indice ${article.firstHtmlDifference.index}`)
    lines.push(`  - Storyblok: \`${article.firstHtmlDifference.storyblok.replace(/`/g, '\\`')}\``)
    lines.push(`  - Sanity: \`${article.firstHtmlDifference.sanity.replace(/`/g, '\\`')}\``)
  }
}
await fs.writeFile(reportMd, lines.join('\n') + '\n')
console.log(JSON.stringify(report.summary, null, 2))
console.log(`Report: ${reportMd}`)

if (report.summary.missingInSanity) process.exitCode = 2
