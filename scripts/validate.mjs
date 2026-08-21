import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const plugin = join(root, 'plugins', 'sopia-extension-toolkit')
const skill = join(plugin, 'skills', 'sopia-extension-create')
const templates = join(skill, 'templates')
const errors = []

function fail(message) {
  errors.push(message)
}

function walk(directory) {
  const files = []
  for (const entry of readdirSync(directory)) {
    if (['.git', 'node_modules', 'dist', '.tmp'].includes(entry)) continue
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) files.push(...walk(path))
    else files.push(path)
  }
  return files
}

function parseJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(`${relative(root, path)}: invalid JSON (${error.message})`)
    return null
  }
}

const required = [
  join(skill, 'SKILL.md'),
  join(skill, 'references', 'interview.md'),
  join(skill, 'references', 'extension-contract.md'),
  join(skill, 'references', 'manifest.md'),
  join(skill, 'references', 'design.md'),
  join(skill, 'references', 'build-and-verify.md'),
  join(skill, 'references', 'security.md'),
  join(skill, 'scripts', 'generate-extension-id.mjs'),
  join(plugin, '.claude-plugin', 'plugin.json'),
  join(plugin, '.codex-plugin', 'plugin.json'),
  join(root, '.claude-plugin', 'marketplace.json'),
  join(root, '.agents', 'plugins', 'marketplace.json')
]

for (const path of required) {
  try {
    if (!statSync(path).isFile()) fail(`${relative(root, path)}: required file missing`)
  } catch {
    fail(`${relative(root, path)}: required file missing`)
  }
}

const skillText = readFileSync(join(skill, 'SKILL.md'), 'utf8')
const frontmatter = skillText.match(/^---\r?\n([\s\S]*?)\r?\n---/)
if (!frontmatter) {
  fail('SKILL.md: YAML frontmatter missing')
} else {
  if (!/^name: sopia-extension-create$/m.test(frontmatter[1])) fail('SKILL.md: invalid name')
  if (!/^description: .+/m.test(frontmatter[1])) fail('SKILL.md: description missing')
  if (!/^license: MIT$/m.test(frontmatter[1])) fail('SKILL.md: MIT license metadata missing')
  if (/^allowed-tools:/m.test(frontmatter[1])) fail('SKILL.md: host-specific allowed-tools is not portable')
}

const variants = ['worker-only', 'vanilla-js', 'react-ts']
const allowedScopes = new Set(['read:lives', 'write:lives', 'sqlite'])
for (const variant of variants) {
  const directory = join(templates, variant)
  const manifestPath = join(directory, 'manifest.json')
  const manifest = parseJson(manifestPath)
  if (!manifest) continue

  for (const field of ['name', 'version', 'description', 'main', 'author']) {
    if (!manifest[field]) fail(`${variant}/manifest.json: ${field} missing`)
  }
  if (manifest._id !== '{{EXT_ID}}') {
    fail(`${variant}/manifest.json: _id placeholder missing`)
  }

  for (const permission of manifest.permissions?.sopia ?? []) {
    if (!allowedScopes.has(permission.scope)) {
      fail(`${variant}/manifest.json: unsupported scope ${permission.scope}`)
    }
    if (!permission.reason?.trim()) fail(`${variant}/manifest.json: permission reason missing`)
  }
  for (const path of walk(directory)) {
    if (!/\.(?:js|mjs|ts|tsx|html)$/.test(path)) continue
    if (readFileSync(path, 'utf8').includes('crypto.randomUUID')) {
      fail(`${variant}: embedded browser runtime does not provide crypto.randomUUID`)
    }
  }

  const mainPath = join(directory, manifest.main)
  try {
    if (!statSync(mainPath).isFile() && variant !== 'react-ts') {
      fail(`${variant}/manifest.json: main file missing`)
    }
  } catch {
    if (variant !== 'react-ts') fail(`${variant}/manifest.json: main file missing`)
  }
}

const claudePlugin = parseJson(join(plugin, '.claude-plugin', 'plugin.json'))
const codexPlugin = parseJson(join(plugin, '.codex-plugin', 'plugin.json'))
const claudeMarketplace = parseJson(join(root, '.claude-plugin', 'marketplace.json'))
const codexMarketplace = parseJson(join(root, '.agents', 'plugins', 'marketplace.json'))

if (claudePlugin && codexPlugin && claudePlugin.version !== codexPlugin.version) {
  fail('plugin manifests: versions differ')
}
if (codexPlugin?.skills !== './skills/') fail('Codex plugin: skills path must be ./skills/')
if (claudeMarketplace?.plugins?.[0]?.source !== './plugins/sopia-extension-toolkit') {
  fail('Claude marketplace: plugin source mismatch')
}
if (codexMarketplace?.plugins?.[0]?.source?.path !== './plugins/sopia-extension-toolkit') {
  fail('Codex marketplace: plugin source mismatch')
}


for (const path of walk(root)) {
  const rel = relative(root, path).replaceAll('\\', '/')
  if (rel === 'scripts/validate.mjs') continue
  if (!/\.(?:md|json|js|mjs|ts|tsx|css|html|yml|yaml)$/.test(path)) continue

  const text = readFileSync(path, 'utf8')
  if (/(?:from\s+|require\()\s*['"]@sopia-bot\//.test(text)) {
    fail(`${rel}: private package import found`)
  }

  if (/[A-Za-z]:\\(?:Users|home)\\/i.test(text) || /\/(?:Users|home)\//.test(text)) {
    fail(`${rel}: machine-absolute path found`)
  }

  const domainPattern = /(?:[a-z0-9-]+\.)+(?:sopia|zizi)\.[a-z]{2,}/gi
  if (domainPattern.test(text)) fail(`${rel}: first-party domain found`)

  for (const match of text.matchAll(/https?:\/\/[^\s)'"<>]+/g)) {
    try {
      const hostname = new URL(match[0].replace(/[.,;:]$/, '')).hostname.toLowerCase()
      if (hostname.includes('sopia') || hostname.includes('zizi')) {
        fail(`${rel}: first-party HTTP hostname found`)
      }
    } catch {
      fail(`${rel}: malformed URL ${match[0]}`)
    }
  }
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log('Validation passed')
}
