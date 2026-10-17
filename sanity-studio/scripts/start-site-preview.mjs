import crypto from 'node:crypto'
import {spawn} from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const token = getCliClient({apiVersion: '2026-10-17'}).config().token
if (!token) throw new Error('Credenziale CLI non disponibile: usare sanity exec --with-user-token')

const previewSecret = crypto.randomBytes(24).toString('hex')
const port = process.env.PANEL_PIXEL_PREVIEW_PORT || '8888'
const publishedUrl = `http://localhost:${port}/articolo.html?slug=alpha-nomos-recensione&cms=sanity`

console.log(`Confronto pubblicato: ${publishedUrl}`)
console.log('Anteprima bozze: aprire “Anteprima sito” nello Studio locale; l’autorizzazione passa da Sanity.')
console.log('Storyblok resta disponibile con ?cms=storyblok')

const command = process.platform === 'win32' ? (process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe') : 'npx'
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npx.cmd', '--yes', 'netlify-cli', 'dev', '--dir', root, '--port', port]
  : ['--yes', 'netlify-cli', 'dev', '--dir', root, '--port', port]
const child = spawn(command, args, {
  cwd: root,
  stdio: 'inherit',
  env: {...process.env, SANITY_READ_TOKEN: token, SANITY_PREVIEW_SECRET: previewSecret},
})
child.on('exit', (code) => { process.exitCode = code ?? 1 })
