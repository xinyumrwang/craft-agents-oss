import { describe, it, expect } from 'bun:test'
import { resolveInheritedFilterParams, withDefaultRemoteProject, type FilterMode } from './inherited-filter-params'

const m = (...entries: [string, FilterMode][]) => new Map(entries)

describe('resolveInheritedFilterParams (#970)', () => {
  it('inherits a sole include-mode status', () => {
    expect(resolveInheritedFilterParams(m(['todo', 'include']), m(), m())).toEqual({ status: 'todo' })
  })

  it('does NOT inherit an excluded status (the bug)', () => {
    // With only `Done → exclude`, a new session must fall back to the workspace
    // default, not be created as Done.
    expect(resolveInheritedFilterParams(m(['done', 'exclude']), m(), m())).toBeNull()
  })

  it('counts only includes — a single include alongside an exclude still inherits the include', () => {
    expect(resolveInheritedFilterParams(m(['todo', 'include'], ['done', 'exclude']), m(), m())).toEqual({ status: 'todo' })
  })

  it('returns null for multiple includes (ambiguous)', () => {
    expect(resolveInheritedFilterParams(m(['todo', 'include'], ['wip', 'include']), m(), m())).toBeNull()
  })

  it('inherits a sole include label or project', () => {
    expect(resolveInheritedFilterParams(m(), m(['bug', 'include']), m())).toEqual({ label: 'bug' })
    expect(resolveInheritedFilterParams(m(), m(), m(['proj1', 'include']))).toEqual({ project: 'proj1' })
  })

  it('returns null with no filters', () => {
    expect(resolveInheritedFilterParams(m(), m(), m())).toBeNull()
  })

  it('returns null for cross-dimension ambiguity (one status + one label include)', () => {
    expect(resolveInheritedFilterParams(m(['todo', 'include']), m(['bug', 'include']), m())).toBeNull()
  })
})

describe('withDefaultRemoteProject', () => {
  const projects = [
    { id: 'case-13', name: 'CASE-13｜方案评估企业案例' },
    { id: 'case-02', name: 'CASE-02｜竞品洞察企业案例' },
    { id: 'case-01', name: 'CASE-01｜用户洞察企业案例' },
  ]

  it('keeps an explicitly selected project', () => {
    expect(withDefaultRemoteProject({ project: 'case-13' }, projects)).toEqual({ project: 'case-13' })
  })

  it('adds the first active business project while preserving other inherited filters', () => {
    expect(withDefaultRemoteProject({ status: 'todo' }, projects)).toEqual({ status: 'todo', project: 'case-01' })
    expect(withDefaultRemoteProject(null, projects)).toEqual({ project: 'case-01' })
  })

  it('ignores archived projects and leaves empty project lists unchanged', () => {
    expect(withDefaultRemoteProject(null, [
      { id: 'case-01', name: 'CASE-01', archivedAt: 1 },
      { id: 'case-02', name: 'CASE-02' },
    ]))
      .toEqual({ project: 'case-02' })
    expect(withDefaultRemoteProject(null, [])).toBeNull()
  })
})
