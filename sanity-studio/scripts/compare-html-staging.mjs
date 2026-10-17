import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-10-17'}).withConfig({
  projectId: 'np9ttr0b',
  dataset: 'staging',
  useCdn: false,
  perspective: 'raw',
})

const config = client.config()
if (config.projectId !== 'np9ttr0b' || config.dataset !== 'staging') {
  throw new Error('Blocco di sicurezza: il confronto può leggere soltanto np9ttr0b/staging')
}
if (process.argv.some((argument) => /production/i.test(argument))) {
  throw new Error('Questo script non può operare su production')
}

globalThis.__PANEL_PIXEL_SANITY_CLIENT__ = client
await import('../../tools/migrazione/confronta-html-cms.mjs')
