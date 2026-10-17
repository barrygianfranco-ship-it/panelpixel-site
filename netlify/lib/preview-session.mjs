const COOKIE_NAME = 'pp_sanity_preview'
const SESSION_SECONDS = 8 * 60 * 60

function toBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

async function signature(secret, timestamp) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  )
  return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp))))
}

function sameText(left, right) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

export async function createPreviewSession(secret, now = Date.now()) {
  if (!secret) throw new Error('SANITY_PREVIEW_SECRET non configurato')
  const timestamp = String(Math.floor(now / 1000))
  return `${timestamp}.${await signature(secret, timestamp)}`
}

export async function verifyPreviewSession(value, secret, now = Date.now()) {
  if (!value || !secret) return false
  const [timestamp, supplied, extra] = value.split('.')
  if (!timestamp || !supplied || extra || !/^\d+$/u.test(timestamp)) return false
  const age = Math.floor(now / 1000) - Number(timestamp)
  if (age < -60 || age > SESSION_SECONDS) return false
  return sameText(supplied, await signature(secret, timestamp))
}

export {COOKIE_NAME, SESSION_SECONDS}
