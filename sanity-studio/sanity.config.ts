import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

const dataset = process.env.SANITY_STUDIO_DATASET || 'staging'

export default defineConfig({
  name: 'default',
  title: dataset === 'production' ? 'Panel Pixel — Redazione' : 'Panel Pixel — Prove (staging)',

  projectId: 'np9ttr0b',
  dataset,

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
