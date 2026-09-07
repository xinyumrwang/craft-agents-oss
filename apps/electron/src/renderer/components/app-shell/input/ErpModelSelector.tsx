import type { LlmConnection } from '@config/llm-connections'
import { cn } from '@/lib/utils'
import {
  entitledModelOptions,
  modelEntitlementLabel,
  type ModelEntitlement,
} from '@/lib/model-entitlement'

export function ErpModelSelector({ policy, currentModel, connections }: {
  policy: ModelEntitlement
  currentModel: string
  connections: Pick<LlmConnection, 'models'>[]
}) {
  const models = entitledModelOptions(policy, connections)
  const label = modelEntitlementLabel(policy)
  const selected = models.find(model => model.id === currentModel)
    ?? models.find(model => model.id === (policy.status === 'managed' ? policy.defaultModel : undefined))
    ?? models[0]

  // Managed users cannot change providers, models or reasoning settings. The
  // label is informational; all runtime details are owned by the server.
  return <button type="button" aria-label="服务器托管模型" title={label} disabled
    className={cn(
      'input-toolbar-btn inline-flex h-7 max-w-[min(260px,45vw)] min-w-0 items-center rounded-[6px] px-1.5 text-[13px]',
      'cursor-default disabled:opacity-100',
      !models.length && 'text-muted-foreground',
    )}>
    <span className="truncate">{selected?.name ?? label}</span>
  </button>
}
