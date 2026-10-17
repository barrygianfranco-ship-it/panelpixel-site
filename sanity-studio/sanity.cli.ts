import {defineCliConfig} from 'sanity/cli'

const dataset = process.env.SANITY_STUDIO_DATASET || 'staging'

export default defineCliConfig({
  api: {
    projectId: 'np9ttr0b',
    dataset,
  },
  deployment: {
    appId: 'xlypuv1ur403xwez95v8q1hl',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
