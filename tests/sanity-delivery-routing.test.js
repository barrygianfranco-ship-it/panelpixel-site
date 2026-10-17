const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

const source = fs.readFileSync('js/sanity-adapter.js', 'utf8')

async function run(location, preview = false) {
  const requests = []
  const window = {
    location,
    storyblokImageUrl: (url) => url,
    storyblokImageAttrs: () => '',
  }
  const fetch = async (url, options) => {
    requests.push({url: String(url), options})
    return {
      ok: true,
      json: async () => String(url).startsWith('/api/')
        ? (preview ? {document: {title: 'Bozza', slug: {current: 'bozza'}, corpo: []}} : {documents: []})
        : {result: []},
    }
  }
  vm.runInContext(source, vm.createContext({window, URL, URLSearchParams, fetch}))
  if (preview) await window.fetchSanityArticleBySlug('bozza', true)
  else await window.fetchSanityArticles()
  return requests[0]
}

async function main() {
  const production = await run({hostname: 'panelpixel.it', search: '?cms=sanity'})
  assert.match(production.url, /^https:\/\/np9ttr0b\.apicdn\.sanity\.io\/v2026-10-17\/data\/query\/production\?/)
  assert.match(production.url, /perspective=published/)
  assert.doesNotMatch(production.url, /token|staging|drafts/i)

  const staging = await run({hostname: 'localhost', search: '?cms=sanity'})
  assert.equal(staging.url, '/api/sanity-content?')
  assert.equal(staging.options.credentials, 'same-origin')

  const explicitStaging = await run({hostname: 'deploy-preview.example.netlify.app', search: '?cms=sanity&sanity-dataset=staging'})
  assert.equal(explicitStaging.url, '/api/sanity-content?')

  const preview = await run({hostname: 'panelpixel.it', search: '?cms=sanity'}, true)
  assert.match(preview.url, /^\/api\/sanity-content\?slug=bozza&preview=1$/)
  assert.equal(preview.options.cache, 'no-store')

  console.log('Routing Sanity: OK (production CDN; staging/bozze via server)')
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
