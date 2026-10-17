const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

const baseUrl = process.argv[2] || 'http://localhost:8888'
const targetShape = ['title', 'slug', 'category', 'type', 'excerpt', 'author', 'date', 'image', 'imageAlt', 'imageCredits', 'featured', 'theme', 'layout', 'masthead', 'pattern', 'triedOn', 'seoTitle', 'seoDescription', 'seoKeywords', 'hasContent', 'content']

async function main() {
  const response = await fetch(`${baseUrl}/api/sanity-content`)
  assert.equal(response.status, 200)
  const payload = await response.json()
  const window = {storyblokImageUrl: (url) => url, storyblokImageAttrs: () => ''}
  const context = vm.createContext({window, URL, URLSearchParams, fetch})
  vm.runInContext(fs.readFileSync('js/sanity-adapter.js', 'utf8'), context)
  const articles = payload.documents.map(window.adaptSanityArticle)
  assert.equal(articles.length, 18)
  assert.equal(new Set(articles.map((article) => article.slug)).size, articles.length)
  for (const article of articles) {
    assert.deepEqual(Object.keys(article), targetShape)
    assert.doesNotMatch(article.content, /\bundefined\b/)
    assert.match(article.image, /^https:\/\/cdn\.sanity\.io\/images\//)
  }
  console.log(`Sanity adapter live: OK (${articles.length} articoli)`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
