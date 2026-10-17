const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

const source = fs.readFileSync('js/main.js', 'utf8')
const bootstrap = source.slice(0, source.indexOf('function loadSanityAdapterScript'))

function select(search, storedValue) {
  let stored = storedValue
  const context = vm.createContext({
    URLSearchParams,
    window: {location: {search}},
    sessionStorage: {
      getItem: () => stored,
      setItem: (_key, value) => { stored = value },
    },
  })
  vm.runInContext(bootstrap, context)
  return {source: vm.runInContext('getCmsSource()', context), stored}
}

assert.deepEqual(select('', null), {source: 'sanity', stored: null})
assert.deepEqual(select('?cms=storyblok', null), {source: 'storyblok', stored: 'storyblok'})
assert.deepEqual(select('', 'storyblok'), {source: 'storyblok', stored: 'storyblok'})
assert.deepEqual(select('?cms=sanity', 'storyblok'), {source: 'sanity', stored: 'sanity'})

console.log('Sorgente CMS: OK (Sanity predefinito, Storyblok come paracadute)')
