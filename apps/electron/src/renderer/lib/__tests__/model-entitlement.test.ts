import { describe, expect, test } from 'bun:test'
import { entitledModelOptions, parseModelEntitlement, maySelectModel, modelEntitlementLabel } from '../model-entitlement'

const base = { configured: true, enforcement: 'server', active: true, schema_version: 2, execution_mode: 'server_only', models: [] }
describe('ERP model picker boundary', () => {
  test('empty grants do not fall back to Opus', () => {
    const policy = parseModelEntitlement(base)
    expect(policy).toEqual({ status: 'managed', models: [] })
    expect(maySelectModel(policy, 'claude-opus-4-8')).toBe(false)
    expect(modelEntitlementLabel(policy)).toContain('暂无模型授权')
  })
  test('only exact model ids are selectable', () => {
    const policy = parseModelEntitlement({ ...base, models: ['allowed', 'allowed'] })
    expect(policy).toEqual({ status: 'managed', models: ['allowed'] })
    expect(maySelectModel(policy, 'allowed')).toBe(true)
    expect(maySelectModel(policy, 'other')).toBe(false)
    expect(maySelectModel(policy, 'ALLOWED')).toBe(false)
  })
  test('preserves and prioritizes the ERP central default model', () => {
    const policy = parseModelEntitlement({ ...base, models: ['secondary', 'central'], default_model: 'central' })
    expect(policy).toEqual({ status: 'managed', models: ['secondary', 'central'], defaultModel: 'central' })
    expect(entitledModelOptions(policy, [])).toEqual([
      { id: 'central', name: 'central' },
      { id: 'secondary', name: 'secondary' },
    ])
  })
  test('revoked grants reject a formerly selected model', () => {
    expect(maySelectModel(parseModelEntitlement(base), 'allowed')).toBe(false)
  })
  test('uses client display metadata only for ERP-authorized model ids', () => {
    const policy = parseModelEntitlement({ ...base, models: ['allowed', 'erp-only'] })
    const options = entitledModelOptions(policy, [{ models: [
      { id: 'allowed', name: 'Sonnet 5', description: '最适合日常任务' },
      { id: 'client-only', name: 'Unapproved', description: 'must not appear' },
    ] as any }])
    expect(options).toEqual([
      { id: 'allowed', name: 'Sonnet 5', description: '最适合日常任务' },
      { id: 'erp-only', name: 'erp-only' },
    ])
  })
  test.each([null, {}, { ...base, active: false }, { ...base, models: null }, { ...base, models: [42] }, { ...base, models: [''] }, { ...base, models: ['allowed'], default_model: 'other' }, { ...base, configured: false }, { ...base, enforcement: 'local' }])('malformed or inactive policy fails closed: %j', value => {
    expect(parseModelEntitlement(value)).toEqual({ status: 'error' })
  })
  test('loading and failures cannot send, desktop stays unmanaged', () => {
    expect(maySelectModel({ status: 'loading' }, 'model')).toBe(false)
    expect(maySelectModel({ status: 'error' }, 'model')).toBe(false)
    expect(maySelectModel({ status: 'unmanaged' }, 'model')).toBe(true)
  })
})
