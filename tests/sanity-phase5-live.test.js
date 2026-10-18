const assert = require('node:assert/strict')
const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const baseUrl = process.argv[2] || 'http://localhost:8888'
const reportPath = path.resolve('local-editorial/backup-storyblok/2026-10-17/fase5-site-checks.json')
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean)

function meta(html, id) {
  return html.match(new RegExp(`<meta[^>]+id="${id}"[^>]+content="([^"]*)"`, 'i'))?.[1] || ''
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function browserChecks(url) {
  const executable = chromeCandidates.find((candidate) => fs.existsSync(candidate))
  if (!executable) throw new Error('Chrome/Edge non trovato: impostare CHROME_PATH')
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'panel-pixel-phase5-'))
  const browser = childProcess.spawn(executable, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
    '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], {stdio: 'ignore'})

  let socket
  try {
    const portFile = path.join(profile, 'DevToolsActivePort')
    for (let attempt = 0; attempt < 100 && !fs.existsSync(portFile); attempt += 1) await wait(50)
    if (!fs.existsSync(portFile)) throw new Error('Chrome DevTools non disponibile')
    const port = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0]
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    const target = targets.find((item) => item.type === 'page')
    if (!target) throw new Error('Scheda Chrome non trovata')
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once: true}); socket.addEventListener('error', reject, {once: true}) })
    let nextId = 0
    const pending = new Map()
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (!message.id || !pending.has(message.id)) return
      const {resolve, reject} = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result)
    })
    const command = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, {resolve, reject})
      socket.send(JSON.stringify({id, method, params}))
    })
    const evaluate = async (expression) => {
      const response = await command('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true})
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Errore JavaScript nella pagina')
      return response.result.value
    }
    const navigate = async (targetUrl) => {
      await command('Page.navigate', {url: targetUrl})
      for (let attempt = 0; attempt < 100; attempt += 1) {
        await wait(100)
        const ready = await evaluate(`document.readyState === 'complete' && !document.querySelector('main.is-loading')`)
        if (ready) return
      }
      throw new Error(`Timeout caricamento pagina: ${targetUrl}`)
    }

    await navigate(`${url}/autore.html?nome=gianfranco-barry&cms=sanity`)
    const author = await evaluate(`({name: document.querySelector('#author-page h1')?.textContent || '', articles: document.querySelectorAll('#author-articles-list article').length, error: !!document.querySelector('.data-load-error')})`)
    assert.equal(author.name, 'Gianfranco Barry')
    assert.ok(author.articles > 0)
    assert.equal(author.error, false)

    await navigate(`${url}/archivio.html?cms=sanity&q=Castlevania`)
    const archive = await evaluate(`({count: document.querySelector('#archive-count')?.textContent || '', articles: document.querySelectorAll('#archive-list article').length, error: !!document.querySelector('.data-load-error')})`)
    assert.equal(archive.articles, 1)
    assert.match(archive.count, /1 articolo/)
    assert.equal(archive.error, false)

    await navigate(`${url}/index.html?cms=sanity`)
    const search = await evaluate(`(() => { const input = document.querySelector('#search-input'); input.value = 'Castlevania'; input.dispatchEvent(new Event('input', {bubbles: true})); return {articles: document.querySelectorAll('#search-results article').length, title: document.querySelector('#search-results-title')?.textContent || '', hidden: document.querySelector('#search-results')?.hidden}; })()`)
    assert.equal(search.articles, 1)
    assert.match(search.title, /Castlevania/)
    assert.equal(search.hidden, false)

    return {author, archive, search, browser: path.basename(executable)}
  } finally {
    if (socket) socket.close()
    browser.kill()
    await wait(250)
    try { fs.rmSync(profile, {recursive: true, force: true}) } catch (_) {}
  }
}

async function main() {
  const articlesResponse = await fetch(`${baseUrl}/api/sanity-content`)
  assert.equal(articlesResponse.status, 200)
  const articles = (await articlesResponse.json()).documents
  assert.equal(articles.length, 18)

  const social = []
  for (const article of articles) {
    const slug = article.slug.current
    const response = await fetch(`${baseUrl}/articolo.html?slug=${encodeURIComponent(slug)}&cms=sanity`)
    assert.equal(response.status, 200)
    const html = await response.text()
    const expectedTitle = article.seo_title || `${article.title} | Panel Pixel`
    assert.equal(meta(html, 'og-title'), expectedTitle)
    assert.ok(meta(html, 'og-description'))
    assert.match(meta(html, 'og-image'), /^https:\/\/cdn\.sanity\.io\/images\//)
    assert.equal(meta(html, 'twitter-title'), expectedTitle)
    assert.ok(meta(html, 'twitter-description'))
    assert.match(meta(html, 'twitter-image'), /^https:\/\/cdn\.sanity\.io\/images\//)
    assert.match(html, new RegExp(`<link id="canonical-link" rel="canonical" href="https://panelpixel\\.it/articolo\\.html\\?slug=${slug}">`))
    const jsonLd = html.match(/<script type="application\/ld\+json" id="article-jsonld">(.*?)<\/script>/s)?.[1]
    assert.ok(jsonLd)
    const schema = JSON.parse(jsonLd)
    assert.equal(schema['@type'], 'Article')
    assert.equal(schema.headline, article.title)
    social.push(slug)
  }

  const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`)
  assert.equal(sitemapResponse.status, 200)
  const sitemap = await sitemapResponse.text()
  for (const page of ['index.html', 'archivio.html', 'autore.html?nome=gianfranco-barry']) assert.ok(sitemap.includes(`https://panelpixel.it/${page}`))
  for (const article of articles) assert.ok(sitemap.includes(`/articoli/${article.slug.current}`), `Slug assente dalla sitemap: ${article.slug.current}`)

  const notFoundResponse = await fetch(`${baseUrl}/fase5-pagina-inesistente`)
  assert.equal(notFoundResponse.status, 404)
  const notFound = await notFoundResponse.text()
  assert.match(notFound, /<meta name="robots" content="noindex">/)
  assert.match(notFound, /Questa storia non è qui\./)

  const browser = await browserChecks(baseUrl)
  const report = {
    generatedAt: new Date().toISOString(), dataset: 'staging', publishedArticles: articles.length,
    socialMetaChecked: social, sitemapArticleSlugsChecked: articles.map((article) => article.slug.current),
    authorPage: browser.author, archivePage: browser.archive, search: browser.search,
    notFound: {status: notFoundResponse.status, noindex: true}, browser: browser.browser,
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n')
  console.log(`Fase 5 sito: OK (${articles.length} meta social, sitemap, autore, archivio, ricerca, 404)`)
  console.log(`Report: ${reportPath}`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
