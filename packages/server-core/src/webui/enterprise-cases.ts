import {
  createProject,
  listProjectAssets,
  loadWorkspaceProjects,
  projectExists,
  uploadProjectAsset,
  type ProjectConfig,
} from '@craft-agent/shared/projects'

interface EnterpriseCase {
  order: number
  skill: string
  business: string
  caseName: string
  objective: string
  inputs: string[]
  deliverables: string[]
  prompt: string
}

const CASES: EnterpriseCase[] = [
  { order: 1, skill: 'jonwork-user-insight', business: '用户洞察', caseName: '家电新品机会识别', objective: '从访谈、评论和售后反馈中识别目标用户、关键痛点与产品机会。', inputs: ['用户访谈或评论材料', '目标市场与价格带', '已有产品和约束'], deliverables: ['用户画像与场景', '痛点优先级', '机会点与验证建议'], prompt: '@用户洞察 请分析已上传的访谈和评论，聚焦年轻家庭的小户型清洁场景，输出画像、痛点优先级和可验证的产品机会。' },
  { order: 2, skill: 'jonwork-competitor-insight', business: '竞品洞察', caseName: '清洁电器竞品空白分析', objective: '比较关键竞品的定位、功能、设计语言与用户评价，找到差异化空间。', inputs: ['3–8 个竞品名称或链接', '竞品图片与参数', '目标市场'], deliverables: ['竞品矩阵', '优势与短板', '市场空白与差异化建议'], prompt: '@竞品洞察 对比已上传的 5 款清洁电器，重点分析定位、核心卖点、设计语言和差评，给出可进入的市场空白。' },
  { order: 3, skill: 'jonwork-design-proposal', business: '设计提案', caseName: '智能咖啡机概念提案', objective: '把业务目标、用户需求和工程约束转化为可评审的工业设计方向。', inputs: ['产品需求与目标人群', '尺寸、成本和工艺约束', '品牌与参考图片'], deliverables: ['概念方向', '造型与 CMF 建议', '人机与结构要点'], prompt: '@设计提案 为都市白领设计一款紧凑型智能咖啡机，结合附件中的品牌规范和尺寸约束，形成三套可评审方向。' },
  { order: 4, skill: 'jonwork-design-decomposition', business: '智能设计解构', caseName: '标杆产品设计解构', objective: '将产品证据拆分为功能、几何造型和视觉风格，并判断哪些字段可迁移。', inputs: ['主体产品图', '参考产品图', '迁移目标'], deliverables: ['功能层拆解', '几何与风格证据', '可迁移字段清单'], prompt: '请使用智能设计解构，拆解主体产品与参考图的功能、几何和视觉风格，标出可安全迁移到下一版方案的字段。' },
  { order: 5, skill: 'jonwork-sketch-render', business: '草图渲染', caseName: '手持工具草图提案化', objective: '把产品线稿或概念草图转成用于内部评审的提案级效果图。', inputs: ['清晰线稿或草图', '材质与颜色要求', '视角和背景要求'], deliverables: ['提案级效果图', '关键材质说明', '可继续迭代的方向'], prompt: '请使用草图渲染，把附件中的手持工具线稿转为提案级效果图，保留比例和结构，采用深灰工程塑料与橙色操作件。' },
  { order: 6, skill: 'jonwork-form-fusion', business: '造型融合', caseName: '品牌造型语言迁移', objective: '将参考产品的造型语言或表面处理融入主体产品，同时保留主体结构。', inputs: ['主体产品图', '造型参考图', '需要迁移与保留的特征'], deliverables: ['融合效果图', '保留/迁移说明', '差异化检查'], prompt: '请使用造型融合，将参考图 2 的曲面转折和细节节奏融入主体产品，保留主体尺寸、功能分区和品牌标识。' },
  { order: 7, skill: 'jonwork-custom-fusion', business: '自定义融合', caseName: '多参考图定向融合', objective: '从多张参考图中按指定部位提取元素，组合成一套新的产品方案。', inputs: ['主体图与最多五张参考图', '各图采用的具体部位', '必须保留的主体特征'], deliverables: ['融合效果图', '来源部位说明', '一致性检查'], prompt: '@自定义模式 以图 1 为主体，采用图 2 的手柄、图 3 的进风口和图 4 的 CMF，保持图 1 的比例及核心结构。' },
  { order: 8, skill: 'jonwork-local-remodel', business: '局部改型', caseName: '操作区局部升级', objective: '仅修改指定零件或区域，并保持整机比例、结构和设计语言一致。', inputs: ['产品主体图', '需要圈定的修改区域', '功能与工艺约束'], deliverables: ['局部改型效果图', '修改点说明', '整机一致性检查'], prompt: '请使用局部改型，仅重设计圈选的按键与显示区域，提高戴手套操作时的辨识度，其他区域保持不变。' },
  { order: 9, skill: 'jonwork-scene-edit', business: '整图编辑', caseName: '产品上市场景适配', objective: '保持产品主体不变，替换场景、光线或整体氛围，生成渠道所需视觉。', inputs: ['产品效果图', '目标渠道和场景', '时段、光线与风格要求'], deliverables: ['场景化主视觉', '主体一致性检查', '渠道适配建议'], prompt: '请使用整图编辑，保持产品和构图不变，将背景改为清晨自然光的现代厨房，用于电商首屏。' },
  { order: 10, skill: 'jonwork-cmf-divergence', business: 'CMF 发散', caseName: '消费电子 CMF 系列探索', objective: '保持几何不变，系统探索颜色、材质、纹理、光泽与表面工艺。', inputs: ['产品图或三维渲染', '品牌色与禁用项', '目标人群与成本区间'], deliverables: ['多套 CMF 方向', '材料与工艺建议', '量产风险提示'], prompt: '请使用 CMF 发散，保持几何完全不变，为附件产品探索商务、年轻和户外三组 CMF，并说明材料、表面工艺及量产风险。' },
  { order: 11, skill: 'jonwork-pi-series', business: 'PI 系列化', caseName: '工具家族产品识别构建', objective: '从种子产品提炼共享 PI 语言，扩展成一致且可区分的产品系列。', inputs: ['2–4 个种子产品', '计划扩展的产品清单', '品牌识别与结构约束'], deliverables: ['共享 PI 规则', '10 款系列方向', '一致性与差异化说明'], prompt: '请使用 PI 系列化，从附件的 3 款种子产品提炼品牌识别语言，并扩展为 10 款工具产品系列。' },
  { order: 12, skill: 'jonwork-benchmark-diagnosis', business: '对标诊断', caseName: '自有方案与标杆对比', objective: '比较自有方案和参考方案的比例、细节、CMF、品牌识别与迁移风险。', inputs: ['自有方案图', '标杆方案图', '目标用户与品牌策略'], deliverables: ['分项对比', '差距与机会', '可执行改进建议'], prompt: '请使用对标诊断，对比自有方案与两款标杆产品，重点检查轮廓比例、细节层级、CMF 和品牌识别，输出优先改进项。' },
  { order: 13, skill: 'jonwork-design-health-check', business: '方案评估', caseName: '量产前设计健康检查', objective: '对工业设计方案进行分层评分，识别优先问题并给出后续工作流建议。', inputs: ['当前方案多视图', '产品目标与评审标准', '工程和成本约束'], deliverables: ['分层评分', '问题优先级', '修订与下一步建议'], prompt: '请使用方案评估，对附件方案做量产前健康检查，按品牌、造型、CMF、人机和可制造性评分，并列出前三项修订任务。' },
  { order: 14, skill: 'jonwork-image-to-3d', business: '图片转 3D', caseName: '产品概念三维重建', objective: '从单张或多视角产品图片生成可预览、可下载的 GLB 三维模型。', inputs: ['清晰产品图或多视角图', '真实尺寸或比例参照', '需要保留的细节'], deliverables: ['GLB 三维模型', '预览结果', '缺失视角与精度说明'], prompt: '请使用图片转3D，根据附件的正面、侧面和背面图生成 GLB，保持真实比例并优先还原外轮廓和主要分件。' },
]

export const ENTERPRISE_CASE_COUNT = CASES.length

export function enterpriseWorkspaceName(tenantId: string): string {
  const tenant = tenantId.trim().replace(/[\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').slice(0, 80)
  return `${tenant || 'Jonwork'} 企业工作区`
}

function projectName(item: EnterpriseCase): string {
  // Keep CASE-XX first so the storage-generated slug is deterministic even
  // when a Chinese display name contains terms such as CMF, PI or 3D.
  return `CASE-${String(item.order).padStart(2, '0')}｜${item.business}企业案例`
}

function projectSlug(item: EnterpriseCase): string {
  return projectName(item).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
}

function guide(item: EnterpriseCase): string {
  return `# ${item.business}企业案例：${item.caseName}\n\n## 业务目标\n\n${item.objective}\n\n## 开始前准备\n\n${item.inputs.map(value => `- ${value}`).join('\n')}\n\n## 推荐操作\n\n1. 将本项目复制为您的正式项目，或直接在本项目中上传企业材料。\n2. 替换示例中的产品、用户、市场和约束，避免把示例结论当作真实业务结论。\n3. 新建会话，选择本项目，并发送下面的示例指令。\n4. 检查事实、图片版权、品牌规范与工程约束后，再用于评审或生产。\n\n## 示例指令\n\n> ${item.prompt}\n\n## 预期产出\n\n${item.deliverables.map(value => `- ${value}`).join('\n')}\n\n## 使用提示\n\n- 对话中可继续补充材料和约束，要求 Jonwork 针对上一版逐项修订。\n- 涉及图片的业务请上传清晰原图，并明确哪部分必须保留。\n- 企业案例是操作模板，不是测试数据，也不会自动发起计费任务。\n`
}

/** Add only missing guides. Existing case projects and user edits are preserved. */
export function seedEnterpriseCases(workspaceRootPath: string, allowedSkills: string[]): ProjectConfig[] {
  const allowed = new Set(allowedSkills)
  const bySlug = new Map(loadWorkspaceProjects(workspaceRootPath).map(project => [project.config.slug, project.config]))
  const seeded: ProjectConfig[] = []
  for (const item of CASES) {
    if (!allowed.has(item.skill)) continue
    const slug = projectSlug(item)
    let project = bySlug.get(slug)
    if (!project && !projectExists(workspaceRootPath, slug)) {
      project = createProject(workspaceRootPath, {
        name: projectName(item),
        description: `${item.caseName}：${item.objective}`,
        details: `这是 ${item.business} 业务的企业案例模板。先查看“企业案例使用指南.md”，再上传真实业务材料并新建会话。`,
        colorTheme: 'default',
      })
      bySlug.set(project.slug, project)
    }
    if (!project) continue
    const hasGuide = listProjectAssets(workspaceRootPath, project.slug).some(asset => asset.filename === '企业案例使用指南.md')
    if (!hasGuide) uploadProjectAsset(workspaceRootPath, project.slug, { filename: '企业案例使用指南.md', text: guide(item) })
    seeded.push(project)
  }
  return seeded
}
