import type { SetupNeeds } from '@craft-agent/shared/auth/types'

export function shouldEnforceProductionSetup(channel: string, developmentBuild: boolean): boolean {
  return channel === 'production' && !developmentBuild
}

/**
 * Authentication and model setup are separate concerns. A signed-in production
 * user may enter the desktop without a shared model connection; model-backed
 * actions still fail closed at execution time until credentials are configured.
 */
export function productionSetupBlocker(needs: SetupNeeds): string | null {
  if (!needs || typeof needs.needsBillingConfig !== 'boolean' || typeof needs.needsCredentials !== 'boolean') return '模型配置检查返回无效结果，请重试或联系管理员。'
  if (needs.needsMigration) return '模型连接需要重新认证，请联系管理员更新企业模型授权。'
  return null
}
