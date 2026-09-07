import type { LlmConnection } from '@config/llm-connections'

export type ModelEntitlement =
  | { status: 'unmanaged' }
  | { status: 'loading' | 'error' }
  | { status: 'managed'; models: string[]; defaultModel?: string }

export interface EntitledModelOption {
  id: string
  name: string
  description?: string
  descriptionKey?: string
}

/** Fail closed: missing, inactive or malformed ERP policy is never a default model grant. */
export function parseModelEntitlement(value: unknown): ModelEntitlement {
  const p = value as Record<string, unknown> | null
  if (!p || p.configured !== true || p.enforcement !== 'server' || p.active !== true
    || p.schema_version !== 2 || p.execution_mode !== 'server_only'
    || !Array.isArray(p.models) || !p.models.every(m => typeof m === 'string' && m.trim().length > 0)
    || (p.default_model !== undefined && (typeof p.default_model !== 'string' || !p.models.includes(p.default_model)))) {
    return { status: 'error' }
  }
  return {
    status: 'managed',
    models: [...new Set(p.models as string[])],
    ...(typeof p.default_model === 'string' ? { defaultModel: p.default_model } : {}),
  }
}

export function maySelectModel(policy: ModelEntitlement, model: string): boolean {
  return policy.status === 'unmanaged' || (policy.status === 'managed' && policy.models.includes(model))
}

export function modelEntitlementLabel(policy: ModelEntitlement): string {
  if (policy.status === 'loading') return '正在读取 ERP 模型授权'
  if (policy.status === 'error') return '模型授权不可用，请重试'
  if (policy.status === 'managed' && !policy.models.length) return '暂无模型授权，请联系企业管理员'
  return '请选择已授权模型'
}

/**
 * ERP remains the authorization authority. Connection metadata is presentation
 * only, so a client-defined model can supply a friendly name and description but
 * can never add a model that ERP did not grant.
 */
export function entitledModelOptions(
  policy: ModelEntitlement,
  connections: Pick<LlmConnection, 'models'>[],
): EntitledModelOption[] {
  if (policy.status !== 'managed') return []

  const displayById = new Map<string, Omit<EntitledModelOption, 'id'>>()
  for (const connection of connections) {
    for (const model of connection.models ?? []) {
      if (typeof model === 'string' || displayById.has(model.id)) continue
      const name = typeof model.name === 'string' ? model.name.trim() : ''
      const description = typeof model.description === 'string' ? model.description.trim() : ''
      const descriptionKey = typeof model.descriptionKey === 'string' ? model.descriptionKey.trim() : ''
      displayById.set(model.id, {
        name: name || model.id,
        ...(description ? { description } : {}),
        ...(descriptionKey ? { descriptionKey } : {}),
      })
    }
  }

  const ids = policy.defaultModel
    ? [policy.defaultModel, ...policy.models.filter(id => id !== policy.defaultModel)]
    : policy.models
  return ids.map(id => ({ id, ...(displayById.get(id) ?? { name: id }) }))
}
