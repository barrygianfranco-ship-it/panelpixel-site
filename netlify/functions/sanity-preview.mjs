function redirect(location, cookie) {
  return new Response(null, {status: 302, headers: {location, 'set-cookie': cookie, 'cache-control': 'private, no-store'}})
}

export default async (request) => {
  const url = new URL(request.url)
  const configured = Netlify.env.get('SANITY_PREVIEW_SECRET') || ''
  const supplied = url.searchParams.get('secret') || ''
  const slug = String(url.searchParams.get('slug') || '').split(/[/?#]/, 1)[0]
  if (!configured || supplied !== configured || !slug) return new Response('Anteprima non autorizzata', {status: 401})
  const secure = url.protocol === 'https:' ? '; Secure' : ''
  const cookie = `pp_sanity_preview=${encodeURIComponent(configured)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${secure}`
  const target = `/articolo.html?slug=${encodeURIComponent(slug)}&cms=sanity&sanity-preview=1`
  return redirect(target, cookie)
}

export const config = {path: '/api/sanity-preview'}
