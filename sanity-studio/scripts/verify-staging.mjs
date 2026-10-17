import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-10-17'}).withConfig({
  projectId: 'np9ttr0b', dataset: 'staging', useCdn: false, perspective: 'raw',
})
const config = client.config()
if (config.projectId !== 'np9ttr0b' || config.dataset !== 'staging') throw new Error('Dataset inatteso')

const documents = await client.fetch(`*[_type == "articolo"]{_id, "slug": slug.current, stato, impaginazione, corpo, image}`)
const slugs = new Set(documents.map((document) => document.slug))
const walk = (value, visit) => {
  if (!value || typeof value !== 'object') return
  visit(value)
  for (const child of Object.values(value)) Array.isArray(child) ? child.forEach((item) => walk(item, visit)) : walk(child, visit)
}
let imagesDaCompletare = 0
for (const document of documents) walk(document, (value) => {
  if (value._type === 'immagineEditoriale' && value.da_completare) imagesDaCompletare += 1
})
const fixture = documents.find((document) => document.slug === 'test-survival-preview')
const survivalTypes = [...new Set((fixture?.corpo || []).map((block) => block._type).filter((type) => type.startsWith('survival_')))].sort()
console.log(JSON.stringify({
  projectId: config.projectId, dataset: config.dataset,
  documents: documents.length, uniqueSlugs: slugs.size,
  publishedDocuments: documents.filter((document) => !document._id.startsWith('drafts.')).length,
  draftDocuments: documents.filter((document) => document._id.startsWith('drafts.')).length,
  states: Object.fromEntries(['approvato', 'bozza', 'in_revisione'].map((state) => [state, documents.filter((document) => document.stato === state).length])),
  imagesDaCompletare,
  survivalFixture: {present: !!fixture, layout: fixture?.impaginazione, blockTypes: survivalTypes},
}, null, 2))
