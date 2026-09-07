/** Shared-process SDK execution is NOT a tenant/project sandbox.
 * Deliberately no environment flag, permission-mode exception or client override.
 * Replace this gate only when a server-owned isolated executor is integrated and
 * its filesystem, process, network, credential and context boundaries are tested.
 */
export function rejectUnisolatedAgentExecution(): never {
  throw new Error('多账号代理执行已暂停：未绑定用户及项目级隔离策略，不会执行或扣费')
}
