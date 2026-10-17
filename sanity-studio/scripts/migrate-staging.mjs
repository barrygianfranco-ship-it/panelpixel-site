import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-10-17'}).withConfig({
  projectId: 'np9ttr0b',
  dataset: 'staging',
  useCdn: false,
})

globalThis.__PANEL_PIXEL_SANITY_CLIENT__ = client
await import('../../tools/migrazione/migra-storyblok-sanity.mjs')
