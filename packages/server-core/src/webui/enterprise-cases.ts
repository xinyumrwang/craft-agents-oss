import {
  createProject,
  listProjectAssets,
  loadWorkspaceProjects,
  projectExists,
  updateProject,
  uploadProjectAsset,
  type ProjectConfig,
} from '@craft-agent/shared/projects'

const STANDARD_CASE_NAME = 'STANDARD-01｜产品设计全流程标准样例'
const STANDARD_CASE_SLUG = 'standard-01'
const STANDARD_CASE_SKILLS = [
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
] as const

export const ENTERPRISE_CASE_COUNT = 1

export function enterpriseWorkspaceName(tenantId: string): string {
  const tenant = tenantId.trim().replace(/[\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').slice(0, 80)
  return `${tenant || 'Jonwork'} 企业工作区`
}

function guide(): string {
  return `# 产品设计全流程标准样例

## 样例目标

以一款面向年轻家庭的小户型智能清洁设备为例，演示从研究证据到可评审设计成果、三维交付和版本审查的完整闭环。请替换为真实企业材料后再执行。

## 流程与相关标准

1. **用户与市场证据**：上传访谈、评论、售后数据和竞品资料；区分事实、推断与待验证假设，并记录来源。
2. **需求定义**：形成目标用户、核心场景、痛点优先级、产品机会和可验证指标；保留需求到设计决策的追溯关系。
3. **设计提案**：依据品牌规范、尺寸包络、成本目标、结构边界和安全要求输出多方向方案。
4. **造型与 CMF**：记录轮廓比例、功能分区、交互区、人机尺寸、材料、颜色、纹理、表面工艺及禁用项。
5. **方案实现**：完成草图渲染、整图编辑、造型/局部/自定义融合；明确必须保留和允许变化的区域。
6. **诊断评估**：按品牌识别、造型一致性、CMF、人机、可制造性、成本和风险分层评分，并闭环高优问题。
7. **系列与三维**：提炼 PI 规则，验证系列一致性；由合格多视图生成 GLB，并记录缺失视角与精度限制。
8. **审查交付**：保存版本、输入、模型、参数、依据和产出；完成批准或修订意见后再作为正式成果交付。

## 建议材料

- 用户研究与市场资料，包含可核验来源
- 产品需求、品牌规范和目标价格带
- 尺寸、人机、安全、结构、工艺与制造约束
- 主体产品图、草图、多视图及合法授权的参考图
- 企业内部评审表、命名规范和交付清单

## 标准操作指令

> 请按产品设计全流程执行：先完成用户与竞品证据分析，建立需求与设计决策追溯表；再基于品牌、尺寸、人机、安全、结构、成本和制造约束形成三套设计方向；选择方向后完成造型、CMF、关键场景图与多视图，进行对标诊断和设计健康检查，闭环高优问题；最后生成可审查成果与 GLB，并附版本、依据、风险和交付检查表。任何缺失证据必须明确标注，不得虚构。

## 验收清单

- 研究结论可追溯到输入证据，假设与事实分离
- 需求、约束、方案决策和验证结果可双向追溯
- 品牌、造型、CMF、人机、安全和可制造性均有检查结果
- 图片、参考资料和品牌资产具备合法使用依据
- 所有成果包含版本、模型/参数记录、风险与审查状态
- 未通过审查的成果不得标记为最终定稿

此项目是标准流程模板，不会自动发起生成或计费任务。
`
}

function isLegacyCase(project: ProjectConfig): boolean {
  return /^CASE-(?:0[1-9]|1[0-4])(?:\s*[｜|]|$)/i.test(project.name)
    || project.name.trim() === '模型调用验证'
}

/** Keep one standards-based example. Legacy examples are archived so task and
 * audit history remain intact while they disappear from client/web project lists. */
export function seedEnterpriseCases(workspaceRootPath: string, allowedSkills: string[]): ProjectConfig[] {
  const projects = loadWorkspaceProjects(workspaceRootPath)
  for (const project of projects) {
    if (isLegacyCase(project.config) && !project.config.archivedAt) {
      updateProject(workspaceRootPath, project.config.slug, { archivedAt: Date.now() })
    }
  }

  if (!STANDARD_CASE_SKILLS.some(skill => allowedSkills.includes(skill))) return []

  let project = loadWorkspaceProjects(workspaceRootPath)
    .find(item => item.config.slug === STANDARD_CASE_SLUG || item.config.name === STANDARD_CASE_NAME)?.config
  if (!project && !projectExists(workspaceRootPath, STANDARD_CASE_SLUG)) {
    project = createProject(workspaceRootPath, {
      name: STANDARD_CASE_NAME,
      description: '覆盖洞察、需求、提案、造型、CMF、诊断、三维、审查与交付的产品设计标准流程。',
      details: '先阅读“产品设计全流程标准指南.md”，替换真实材料与约束，再按阶段推进并完成审查。',
      colorTheme: 'default',
    })
  }
  if (!project || project.archivedAt) return []

  const filename = '产品设计全流程标准指南.md'
  if (!listProjectAssets(workspaceRootPath, project.slug).some(asset => asset.filename === filename)) {
    uploadProjectAsset(workspaceRootPath, project.slug, { filename, text: guide() })
  }
  return [project]
}
