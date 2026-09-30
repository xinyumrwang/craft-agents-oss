import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createProject, listProjectAssets, loadWorkspaceProjects } from '@craft-agent/shared/projects'
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

  it('seeds one standards-based full workflow without duplication', () => {
    const root = mkdtempSync(join(tmpdir(), 'jonwork-enterprise-cases-'))
    roots.push(root)
    expect(ENTERPRISE_CASE_COUNT).toBe(1)
    expect(seedEnterpriseCases(root, skills)).toHaveLength(1)
    expect(seedEnterpriseCases(root, skills)).toHaveLength(1)

    const projects = loadWorkspaceProjects(root).filter(project => !project.config.archivedAt)
    expect(projects).toHaveLength(1)
    expect(projects[0]!.config.name).toBe('STANDARD-01｜产品设计全流程标准样例')
    expect(listProjectAssets(root, projects[0]!.config.slug).map(asset => asset.filename)).toEqual(['产品设计全流程标准指南.md'])
  })

  it('requires a relevant ERP skill and archives only known legacy examples', () => {
    const root = mkdtempSync(join(tmpdir(), 'jonwork-enterprise-cases-'))
    roots.push(root)
    createProject(root, { name: 'CASE-01｜用户洞察企业案例' })
    createProject(root, { name: '模型调用验证' })
    createProject(root, { name: '客户正式项目' })
    expect(seedEnterpriseCases(root, ['not-a-jonwork-skill'])).toEqual([])
    const afterCleanup = loadWorkspaceProjects(root)
    expect(afterCleanup.filter(project => project.config.archivedAt).map(project => project.config.name).sort()).toEqual(['CASE-01｜用户洞察企业案例', '模型调用验证'])
    expect(afterCleanup.filter(project => !project.config.archivedAt).map(project => project.config.name)).toEqual(['客户正式项目'])
    expect(seedEnterpriseCases(root, ['jonwork-user-insight'])).toHaveLength(1)
    expect(loadWorkspaceProjects(root).filter(project => !project.config.archivedAt).map(project => project.config.name).sort()).toEqual(['STANDARD-01｜产品设计全流程标准样例', '客户正式项目'])
  })
})
