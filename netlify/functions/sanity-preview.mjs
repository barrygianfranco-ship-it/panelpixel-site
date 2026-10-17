import {createClient} from '@sanity/client'
import {validatePreviewUrl} from '@sanity/preview-url-secret'
import {perspectiveCookieName} from '@sanity/preview-url-secret/constants'
import {withoutSecretSearchParams} from '@sanity/preview-url-secret/without-secret-search-params'
import {COOKIE_NAME, SESSION_SECONDS, createPreviewSession} from '../lib/preview-session.mjs'

const PROJECT_ID = 'np9ttr0b'
const API_VERSION = '2026-10-17'

function datasetFor(url) {
  return ['localhost', '127.0.0.1'].includes(url.hostname) ? 'staging' : 'production'
}

function cookie(name, value, url) {
  const secure = url.protocol === 'https:' ? '; Secure; SameSite=None' : '; SameSite=Lax'
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; Max-Age=${SESSION_SECONDS}${secure}`
}

export default async (request) => {
  if (request.method !== 'GET') return new Response('Metodo non consentito', {status: 405})

  const url = new URL(request.url)
  const token = Netlify.env.get('SANITY_READ_TOKEN') || ''
  const sessionSecret = Netlify.env.get('SANITY_PREVIEW_SECRET') || ''
  if (!token || !sessionSecret) {
    return new Response('Anteprima non configurata sul server', {status: 503})
  }

  const client = createClient({
    projectId: PROJECT_ID,
    dataset: datasetFor(url),
    apiVersion: API_VERSION,
    useCdn: false,
    token,
  })
  const validation = await validatePreviewUrl(client, url.toString())
  if (!validation.isValid) return new Response('Anteprima non autorizzata', {status: 401})

  const target = withoutSecretSearchParams(new URL(validation.redirectTo || '/', url.origin))
  if (target.origin !== url.origin) return new Response('Destinazione non consentita', {status: 400})
  target.searchParams.set('cms', 'sanity')
  target.searchParams.set('sanity-preview', '1')

  const headers = new Headers({
    location: `${target.pathname}${target.search}${target.hash}`,
    'cache-control': 'private, no-store',
  })
  headers.append('set-cookie', cookie(COOKIE_NAME, await createPreviewSession(sessionSecret), url))
  headers.append(
    'set-cookie',
    cookie(perspectiveCookieName, validation.studioPreviewPerspective || 'drafts', url),
  )
  return new Response(null, {status: 307, headers})
}

export const config = {path: '/api/sanity-preview/enable'}
