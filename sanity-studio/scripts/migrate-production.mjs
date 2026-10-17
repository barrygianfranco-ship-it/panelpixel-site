import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-10-17'}).withConfig({
  projectId: 'np9ttr0b',
  dataset: 'production',
  useCdn: false,
  perspective: 'raw',
})

const config = client.config()
if (config.projectId !== 'np9ttr0b' || config.dataset !== 'production') {
  throw new Error('Blocco di sicurezza: atteso np9ttr0b/production')
}

globalThis.__PANEL_PIXEL_SANITY_CLIENT__ = client
globalThis.__PANEL_PIXEL_ALLOW_PRODUCTION_IMPORT__ = true
await import('../../tools/migrazione/migra-storyblok-sanity.mjs')
