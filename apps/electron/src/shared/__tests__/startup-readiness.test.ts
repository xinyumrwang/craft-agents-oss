import { describe, expect, test } from 'bun:test'
import { productionSetupBlocker, shouldEnforceProductionSetup } from '../startup-readiness'

describe('production setup readiness', () => {
  test('enforces readiness in production builds but not local development builds', () => {
    expect(shouldEnforceProductionSetup('production', false)).toBe(true)
    expect(shouldEnforceProductionSetup('production', true)).toBe(false)
    expect(shouldEnforceProductionSetup('development', false)).toBe(false)
  })
  test('allows authenticated users to enter before a shared model connection is configured', () => {
    expect(productionSetupBlocker({ isFullyConfigured: false, needsBillingConfig: true, needsCredentials: true })).toBeNull()
    expect(productionSetupBlocker({ isFullyConfigured: false, needsBillingConfig: false, needsCredentials: true })).toBeNull()
  })
  test('blocks migration and accepts configured state without claiming connectivity', () => {
    expect(productionSetupBlocker({} as any)).toContain('无效结果')
    expect(productionSetupBlocker({ isFullyConfigured: true, needsBillingConfig: false, needsCredentials: false, needsMigration: { reason: 'legacy_token', message: 'old' } })).toContain('重新认证')
    expect(productionSetupBlocker({ isFullyConfigured: true, needsBillingConfig: false, needsCredentials: false })).toBeNull()
  })
})
