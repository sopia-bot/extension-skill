import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const templates = join(root, 'plugins', 'sopia-extension-toolkit', 'skills', 'sopia-extension-create', 'templates')
const idGenerator = join(root, 'plugins', 'sopia-extension-toolkit', 'skills', 'sopia-extension-create', 'scripts', 'generate-extension-id.mjs')
const idResult = spawnSync(process.execPath, [idGenerator], { encoding: 'utf8' })
const extensionId = idResult.stdout
if (idResult.status !== 0 || !/^[A-Za-z0-9_-]{12}$/.test(extensionId)) {
  throw new Error(`Extension ID generator failed: ${idResult.stderr || idResult.stdout}`)
}
const output = join(root, '.tmp', 'smoke')
const replacements = new Map([
  ['{{EXT_NAME}}', 'Public Smoke Extension'],
  ['{{EXT_SLUG}}', 'public-smoke-extension'],
  ['{{DESCRIPTION}}', 'Exercises the public extension templates'],
  ['{{AUTHOR}}', 'SOPIA'],
  ['{{VERSION}}', '1.0.0'],
  ['{{EXT_ID}}', extensionId]
])

function walk(directory) {
  const files = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) files.push(...walk(path))
    else files.push(path)
  }
  return files
}

function checkJavaScript(path) {
  const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`${path}: ${result.stderr || result.stdout}`)
}

rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })

try {
  for (const variant of ['worker-only', 'vanilla-js', 'react-ts']) {
    const destination = join(output, variant)
    cpSync(join(templates, variant), destination, { recursive: true })

    for (const path of walk(destination)) {
      let content
      try {
        content = readFileSync(path, 'utf8')
      } catch {
        continue
      }
      for (const [token, value] of replacements) content = content.replaceAll(token, value)
      if (/\{\{[^}]+\}\}/.test(content)) throw new Error(`${path}: unresolved placeholder`)
      writeFileSync(path, content)
    }

    const manifest = JSON.parse(readFileSync(join(destination, 'manifest.json'), 'utf8'))
    if (manifest._id !== extensionId) {
      throw new Error(`${variant}: generated extension ID is missing or changed`)
    }

    if (variant !== 'react-ts') {
      const worker = join(destination, manifest.main)
      if (!existsSync(worker)) throw new Error(`${variant}: worker entry missing`)
      checkJavaScript(worker)
    }

    if (variant === 'vanilla-js') {
      const rendererRoot = join(destination, manifest.renderer.baseUrl)
      const html = join(rendererRoot, manifest.renderer.url)
      if (!existsSync(html)) throw new Error('vanilla-js: renderer entry missing')
      checkJavaScript(join(rendererRoot, 'script.js'))
    }
  }

  console.log(`Smoke scaffolds ready: ${output}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
