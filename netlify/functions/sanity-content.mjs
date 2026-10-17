const PROJECT_ID = 'np9ttr0b'
const DATASET = 'staging'
const API_VERSION = '2026-10-17'

const imageProjection = `asset->{_id,url,metadata{dimensions}}`
const projection = `{
  ...,
  image{...,${imageProjection}},
  corpo[]{
    ...,
    _type == "immagineEditoriale" => {...,${imageProjection}},
    _type == "gallery" => {...,images[]{...,${imageProjection}}},
    _type == "columns3" => {...,image{...,${imageProjection}}},
    _type == "survival_compare" => {...,left_image{...,${imageProjection}},right_image{...,${imageProjection}}},
    _type == "survival_panorama" => {...,image{...,${imageProjection}}}
  }
}`

function cookieValue(request, name) {
  const cookies = request.headers.get('cookie') || ''
  const item = cookies.split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))
  return item ? decodeURIComponent(item.slice(name.length + 1)) : ''
}

function json(body, status = 200, preview = false) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': preview ? 'private, no-store' : 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      'x-content-type-options': 'nosniff',
    },
  })
}

async function querySanity(query, params, token, raw = false) {
  const url = new URL(`https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`)
  url.searchParams.set('query', query)
  if (raw) url.searchParams.set('perspective', 'raw')
  for (const [name, value] of Object.entries(params || {})) url.searchParams.set(`$${name}`, JSON.stringify(value))
  const response = await fetch(url, {headers: {authorization: `Bearer ${token}`, accept: 'application/json'}})
  if (!response.ok) throw new Error(`Sanity HTTP ${response.status}`)
  const payload = await response.json()
  return payload.result
}

export default async (request) => {
  if (request.method !== 'GET') return json({error: 'Metodo non consentito'}, 405)
  const token = Netlify.env.get('SANITY_READ_TOKEN')
  if (!token) return json({error: 'SANITY_READ_TOKEN non configurato sul server'}, 503)

  const url = new URL(request.url)
  const slug = String(url.searchParams.get('slug') || '').trim()
  const previewRequested = url.searchParams.get('preview') === '1'
  const previewSecret = Netlify.env.get('SANITY_PREVIEW_SECRET') || ''
  const previewAllowed = previewRequested && previewSecret && cookieValue(request, 'pp_sanity_preview') === previewSecret
  if (previewRequested && !previewAllowed) return json({error: 'Anteprima Sanity non autorizzata'}, 401, true)

  try {
    if (previewAllowed) {
      if (!slug) return json({error: 'Slug richiesto per l’anteprima'}, 400, true)
      const query = `coalesce(
        *[_type == "articolo" && _id in path("drafts.**") && slug.current == $slug][0]${projection},
        *[_type == "articolo" && !(_id in path("drafts.**")) && slug.current == $slug][0]${projection}
      )`
      return json({document: await querySanity(query, {slug}, token, true), preview: true}, 200, true)
    }

    const filter = `_type == "articolo" && !(_id in path("drafts.**")) && stato == "approvato"`
    if (slug) {
      const document = await querySanity(`*[${filter} && slug.current == $slug][0]${projection}`, {slug}, token)
      return json({document, preview: false})
    }
    const documents = await querySanity(`*[${filter}] | order(date desc) ${projection}`, {}, token)
    return json({documents: documents || [], preview: false})
  } catch (error) {
    console.error('sanity-content:', error)
    return json({error: 'Impossibile leggere i contenuti Sanity'}, 502, previewAllowed)
  }
}

export const config = {path: '/api/sanity-content'}
