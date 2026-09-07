import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { listProjectAssets, loadWorkspaceProjects } from '@craft-agent/shared/projects'
import { ENTERPRISE_CASE_COUNT, enterpriseWorkspaceName, seedEnterpriseCases } from '../enterprise-cases'

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) {
    if (!resolve(root).startsWith(resolve(tmpdir()))) throw new Error('Unsafe cleanup')
    rmSync(root, { recursive: true, force: true })
  }
})

const skills = [
  'jonwork-user-insight',
  'jonwork-competitor-insight',
  'jonwork-design-proposal',
  'jonwork-design-decomposition',
  'jonwork-sketch-render',
  'jonwork-form-fusion',
  'jonwork-custom-fusion',
  'jonwork-local-remodel',
  'jonwork-scene-edit',
  'jonwork-cmf-divergence',
  'jonwork-pi-series',
  'jonwork-benchmark-diagnosis',
  'jonwork-design-health-check',
  'jonwork-image-to-3d',
]

describe('ERP enterprise workspace onboarding', () => {
  it('uses a readable tenant workspace name and sanitizes control characters', () => {
    expect(enterpriseWorkspaceName('customer-a')).toBe('customer-a 企业工作区')
    expect(enterpriseWorkspaceName('  XZ.\nCOM  ')).toBe('XZ.COM 企业工作区')
    expect(enterpriseWorkspaceName('   ')).toBe('Jonwork 企业工作区')
  })

  it('seeds one guided enterprise case per allowed business without duplication', () => {
    const root = mkdtempSync(join(tmpdir(), 'jonwork-enterprise-cases-'))
    roots.push(root)
    expect(ENTERPRISE_CASE_COUNT).toBe(14)
    expect(seedEnterpriseCases(root, skills)).toHaveLength(14)
    expect(seedEnterpriseCases(root, skills)).toHaveLength(14)

    const projects = loadWorkspaceProjects(root)
    expect(projects).toHaveLength(14)
    expect(new Set(projects.map(project => project.config.slug)).size).toBe(14)
    for (const project of projects) {
      expect(project.config.name).toContain('企业案例')
      expect(listProjectAssets(root, project.config.slug).map(asset => asset.filename)).toEqual(['企业案例使用指南.md'])
    }
  })

  it('creates only cases for skills granted by ERP', () => {
    const root = mkdtempSync(join(tmpdir(), 'jonwork-enterprise-cases-'))
    roots.push(root)
    seedEnterpriseCases(root, ['jonwork-user-insight', 'not-a-jonwork-skill'])
    expect(loadWorkspaceProjects(root).map(project => project.config.slug)).toEqual(['case-01'])
  })
})
