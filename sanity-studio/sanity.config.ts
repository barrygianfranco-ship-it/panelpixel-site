import {defineConfig} from 'sanity'
import {defineLocations, presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

const dataset = process.env.SANITY_STUDIO_DATASET || 'staging'
const previewOrigin = process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:8888'

const articleLocations = defineLocations({
  select: {
    title: 'title',
    slug: 'slug.current',
  },
  resolve: (document) => {
    if (!document?.slug) return null
    return {
      locations: [
        {
          title: document.title || 'Articolo',
          // I parametri tengono attiva l'anteprima: senza, il sito mostra solo i pubblicati.
          href: `/articolo.html?slug=${encodeURIComponent(document.slug)}&cms=sanity&sanity-preview=1`,
        },
      ],
    }
  },
})

export default defineConfig({
  name: 'default',
  title: dataset === 'production' ? 'Panel Pixel — Redazione' : 'Panel Pixel — Prove (staging)',

  projectId: 'np9ttr0b',
  dataset,

  plugins: [
    structureTool({structure}),
    presentationTool({
      title: 'Anteprima sito',
      previewUrl: {
        initial: `${previewOrigin}/index.html`,
        previewMode: {
          enable: '/api/sanity-preview/enable',
          shareAccess: false,
        },
      },
      allowOrigins: [previewOrigin],
      resolve: {
        locations: {
          articolo: articleLocations,
        },
      },
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
