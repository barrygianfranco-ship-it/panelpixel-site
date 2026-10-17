import {execFileSync} from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..', '..')
const fromHead = process.argv.includes('--from-head')
const publishDir = path.join(root, '.netlify', fromHead ? 'production-publish' : 'preview-publish')
if (!publishDir.startsWith(path.join(root, '.netlify') + path.sep)) throw new Error('Percorso di anteprima non sicuro')

await fs.rm(publishDir, {recursive: true, force: true})
await fs.mkdir(publishDir, {recursive: true})

const tracked = execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'})
  .split('\0').filter(Boolean)
const rootFile = /^(?:[^/]+\.html|_headers|apple-touch-icon\.png|favicon\.ico|robots\.txt|site\.webmanifest|sitemap\.xml)$/
const publicDirectory = /^(?:admin|assets|css|data|images|js)\//
const files = tracked.filter((file) => rootFile.test(file) || publicDirectory.test(file))
files.push('js/sanity-adapter.js')
files.push('js/sanity-visual-editing.js', 'js/sanity-visual-editing.css')

for (const relative of [...new Set(files)]) {
  const source = path.join(root, relative)
  const target = path.join(publishDir, relative)
  await fs.mkdir(path.dirname(target), {recursive: true})
  if (fromHead) {
    const content = execFileSync('git', ['show', `HEAD:${relative}`], {cwd: root, encoding: null})
    await fs.writeFile(target, content)
  } else {
    await fs.copyFile(source, target)
  }
}

for (const forbidden of ['local-editorial', 'sanity-studio', 'tests', 'tools', '.env', 'localhost-key.pem']) {
  try {
    await fs.access(path.join(publishDir, forbidden))
    throw new Error(`File o cartella vietata nel pacchetto: ${forbidden}`)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

console.log(publishDir)
console.log(`${files.length} file pubblici preparati da ${fromHead ? 'HEAD' : 'workspace'}; backup, Studio, test, strumenti e credenziali esclusi`)
