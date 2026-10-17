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
          href: `/articolo.html?slug=${encodeURIComponent(document.slug)}`,
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
        initial: `${previewOrigin}/articolo.html?slug=castlevania-belmonts-curse-recensione`,
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
