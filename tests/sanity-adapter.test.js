const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

const source = fs.readFileSync('js/sanity-adapter.js', 'utf8')
const window = {
  storyblokImageUrl: (url) => url,
  storyblokImageAttrs: () => '',
}
const context = vm.createContext({window, URL, URLSearchParams, fetch: async () => { throw new Error('fetch inatteso') }})
vm.runInContext(source, context)

const image = (name, alt = 'Alt') => ({
  _type: 'immagineEditoriale', alt, copyright: '© Panel Pixel', fonte: 'Archivio',
  asset: {url: `https://cdn.sanity.io/images/np9ttr0b/staging/${name}-1600x900.jpg`},
})
const document = {
  _type: 'articolo', title: 'Prova Sanity', slug: {current: 'prova-sanity'}, category: 'videogiochi',
  type: 'approfondimento', excerpt: 'Sommario', author: 'Gianfranco Barry', date: '2026-10-17',
  image: image('cover', 'Copertina'), featured: false, stato: 'approvato', impaginazione: 'survival',
  tema: {accent: '#9f251f', testo_chiaro: true}, testata_titolo: 'Resident Evil', testata_sottotitolo: 'Dossier',
  corpo: [
    {_type: 'block', style: 'normal', markDefs: [{_type: 'link', _key: 'l1', href: 'https://panelpixel.it'}], children: [{_type: 'span', text: 'Testo', marks: ['strong', 'l1']}]},
    {_type: 'survival_chapter', number: '01', eyebrow: 'Origini', title: 'La villa', years: '1996', summary: 'Inizio.'},
    {_type: 'survival_timeline', title: 'Cronologia', items: [{year: '1996', title: 'La soglia', text: 'Inizio.'}]},
    {_type: 'survival_compare', title: 'Confronto', left_image: image('left'), left_title: 'Prima', left_text: 'Testo', right_image: image('right'), right_title: 'Dopo', right_text: 'Testo'},
    {_type: 'survival_panorama', image: image('wide'), caption: 'Panorama'},
    {_type: 'survival_dossier', label: 'Documento', code: 'RE-01', title: 'Archivio', text: 'Nota.'},
  ],
}
const article = window.adaptSanityArticle(document)
assert.equal(article.slug, 'prova-sanity')
assert.equal(article.layout, 'survival')
assert.equal(article.imageAlt, 'Copertina')
assert.deepEqual(JSON.parse(JSON.stringify(article.imageCredits)), {owners: ['© Panel Pixel'], sources: ['Archivio']})
for (const className of ['survival-chapter', 'survival-timeline', 'survival-compare', 'survival-panorama', 'survival-dossier']) assert.match(article.content, new RegExp(`class="${className}`))
assert.match(article.content, /<strong>.*Testo.*<\/strong>/)
assert.match(window.storyblokImageUrl(article.image, 900), /[?&]w=900/)
assert.match(window.storyblokImageAttrs(article.image, 900), /srcset=/)
console.log('Sanity adapter: OK')
