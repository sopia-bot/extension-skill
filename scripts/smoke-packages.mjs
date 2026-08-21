import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const plugin = join(root, 'plugins', 'sopia-extension-toolkit')
const canonicalSkill = join(plugin, 'skills', 'sopia-extension-create')
const output = join(root, '.tmp', 'install-smoke')

function parseJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })

const claudeMarketplace = parseJson(join(root, '.claude-plugin', 'marketplace.json'))
const codexMarketplace = parseJson(join(root, '.agents', 'plugins', 'marketplace.json'))
const claudeSource = resolve(root, claudeMarketplace.plugins[0].source)
const codexSource = resolve(root, codexMarketplace.plugins[0].source.path)

if (claudeSource !== plugin || codexSource !== plugin) {
  throw new Error('Marketplace source does not resolve to the shared plugin')
}

const claudeManifest = parseJson(join(claudeSource, '.claude-plugin', 'plugin.json'))
const codexManifest = parseJson(join(codexSource, '.codex-plugin', 'plugin.json'))
if (claudeManifest.name !== codexManifest.name || claudeManifest.version !== codexManifest.version) {
  throw new Error('Claude and Codex plugin identities differ')
}
if (codexManifest.skills !== './skills/') throw new Error('Codex skills path is invalid')

const installs = [
  join(output, 'claude-project', '.claude', 'skills', 'sopia-extension-create'),
  join(output, 'codex-project', '.agents', 'skills', 'sopia-extension-create')
]
for (const destination of installs) {
  mkdirSync(dirname(destination), { recursive: true })
  cpSync(canonicalSkill, destination, { recursive: true })
  if (!existsSync(join(destination, 'SKILL.md'))) throw new Error('Direct skill install is incomplete')
  if (digest(join(destination, 'SKILL.md')) !== digest(join(canonicalSkill, 'SKILL.md'))) {
    throw new Error('Direct skill install changed SKILL.md')
  }
}

console.log(`Claude and Codex package smoke passed: ${output}`)
