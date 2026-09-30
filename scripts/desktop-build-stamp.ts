import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const hash = (data: string | Buffer) => createHash('sha256').update(data).digest('hex')
const configFile = 'packages/shared/src/desktop-release.json'

function sourceCommit(root: string): string {
  if (execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8' }).trim()) throw new Error('Tracked source changes must be committed before a desktop build')
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
}

export function outputHashes(root: string): Record<string, string> {
  const dist = join(root, 'apps/electron/dist')
  const files = ['main.cjs', 'bootstrap-preload.cjs', 'renderer/index.html']
  const walk = (relative: string) => {
    for (const entry of readdirSync(join(dist, relative), { withFileTypes: true })) {
      const path = `${relative}/${entry.name}`
      if (entry.isSymbolicLink()) throw new Error('Linked renderer assets are not allowed')
      if (entry.isDirectory()) walk(path)
      else if (entry.isFile()) files.push(path)
    }
  }
  walk('renderer')
  return Object.fromEntries([...new Set(files)].sort().map(file => [file, hash(readFileSync(join(dist, file)))]))
}

export function verifyBuildStamp(root: string): void {
  const stamp = JSON.parse(readFileSync(join(root, 'apps/electron/dist/release-build.json'), 'utf8'))
  if (stamp.schemaVersion !== 2 || !/^[a-f0-9]{40}$/.test(stamp.sourceCommit) || stamp.profileHash !== hash(readFileSync(join(root, configFile)))) throw new Error('Release source or profile changed; rebuild all desktop components')
  if (JSON.stringify(stamp.outputs) !== JSON.stringify(outputHashes(root))) throw new Error('Desktop build output changed or is incomplete; rebuild before packaging')
}

if (import.meta.main) {
  const root = resolve(import.meta.dir, '..')
  const dist = join(root, 'apps/electron/dist')
  const startFile = join(dist, '.release-build-start.json')
  try {
    const command = process.argv[2]
    if (command === 'begin') {
      mkdirSync(dist, { recursive: true })
      writeFileSync(startFile, JSON.stringify({ profileHash: hash(readFileSync(join(root, configFile))), sourceCommit: sourceCommit(root) }))
    } else if (command === 'finish') {
      const start = JSON.parse(readFileSync(startFile, 'utf8'))
      if (start.profileHash !== hash(readFileSync(join(root, configFile)))) throw new Error('Release profile changed during build')
      if (start.sourceCommit !== sourceCommit(root)) throw new Error('Release source changed during build')
      writeFileSync(join(dist, 'release-build.json'), JSON.stringify({ schemaVersion: 2, ...start, outputs: outputHashes(root), builtAt: new Date().toISOString() }, null, 2))
      rmSync(startFile)
    } else if (command === 'verify') verifyBuildStamp(root)
    else throw new Error('Expected begin, finish or verify')
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Build provenance failed')
    process.exitCode = 1
  }
}
