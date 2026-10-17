import assert from 'node:assert/strict'
import {createPreviewSession, verifyPreviewSession} from '../netlify/lib/preview-session.mjs'

const secret = 'segreto-di-test-non-usato-in-produzione'
const now = Date.UTC(2026, 9, 17, 12, 0, 0)
const session = await createPreviewSession(secret, now)

assert.equal(await verifyPreviewSession(session, secret, now), true)
assert.equal(await verifyPreviewSession(session, 'altro-segreto', now), false)
assert.equal(await verifyPreviewSession(`${session}x`, secret, now), false)
assert.equal(await verifyPreviewSession(session, secret, now + 8 * 60 * 60 * 1000 + 1000), false)

console.log('Sessione anteprima Sanity: firma, manomissione e scadenza verificate.')
