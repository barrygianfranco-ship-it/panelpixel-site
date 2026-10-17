const assert = require('node:assert/strict')

async function query(groq, params = {}) {
  const url = new URL('https://np9ttr0b.apicdn.sanity.io/v2026-10-17/data/query/production')
  url.searchParams.set('query', groq)
  url.searchParams.set('perspective', 'published')
  for (const [name, value] of Object.entries(params)) url.searchParams.set(`$${name}`, JSON.stringify(value))
  const response = await fetch(url)
  assert.equal(response.status, 200)
  return (await response.json()).result
}

async function main() {
  const articles = await query('*[_type == "articolo" && stato == "approvato"]{"slug":slug.current,_id}')
  assert.equal(articles.length, 18)
  assert.equal(new Set(articles.map((article) => article.slug)).size, 18)
  assert.ok(articles.every((article) => !article._id.startsWith('drafts.')))
  assert.equal(await query('count(*[_type == "articolo" && slug.current == $slug])', {slug: 'test-survival-preview'}), 0)
  console.log('Sanity production CDN: OK (18 pubblicati, nessuna bozza/fixture)')
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
