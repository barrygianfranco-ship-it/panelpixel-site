import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-10-17'}).withConfig({
  projectId: 'np9ttr0b', dataset: 'production', useCdn: false, perspective: 'raw',
})
const config = client.config()
if (config.projectId !== 'np9ttr0b' || config.dataset !== 'production') throw new Error('Dataset inatteso')

const documents = await client.fetch(`*[_type == "articolo"]{_id,"slug":slug.current,stato}`)
const published = documents.filter((document) => !document._id.startsWith('drafts.'))
const drafts = documents.filter((document) => document._id.startsWith('drafts.'))
const result = {
  projectId: config.projectId,
  dataset: config.dataset,
  documents: documents.length,
  uniqueSlugs: new Set(documents.map((document) => document.slug)).size,
  publishedDocuments: published.length,
  draftDocuments: drafts.length,
  approvedPublishedDocuments: published.filter((document) => document.stato === 'approvato').length,
  fixtureSurvivalPresent: documents.some((document) => document.slug === 'test-survival-preview'),
}

if (result.documents !== 20 || result.uniqueSlugs !== 20 || result.publishedDocuments !== 18 || result.draftDocuments !== 2 || result.approvedPublishedDocuments !== 18 || result.fixtureSurvivalPresent) {
  throw new Error(`Verifica production fallita: ${JSON.stringify(result)}`)
}
console.log(JSON.stringify(result, null, 2))
