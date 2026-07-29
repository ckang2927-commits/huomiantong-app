import { addUsage, defaultSettings, normalizeSettings } from './appStorage'
import { callOpenAiCompatible } from './modelClient'
import { defaultRoleJdTemplates, roleJdForMode } from '../../shared/roleJdTemplates'
import type { AppSettings, InterviewMode, RoleJdGenerateRequest, RoleJdGenerateResult, ResumeProfile } from '../../shared/types'

export async function generateRoleJd(request: RoleJdGenerateRequest): Promise<RoleJdGenerateResult> {
  const startedAt = Date.now()
  const settings = normalizeSettings(request.settings)
  const provider = settings.answer.llmProvider
  const config = settings.providers[provider]
  const fallbackJd = buildLocalRoleJd(settings, request.interviewMode)

  if (!config.enabled || !config.apiKey) {
    return {
      jd: `${fallbackJd}\n\nAI 深度生成未调用：请先在 API 设置里填写并启用 ${provider} API Key。`,
      provider: 'local',
      latencyMs: Date.now() - startedAt
    }
  }

  try {
    const result = await callOpenAiCompatible(provider, config, buildRoleJdPrompt(settings, request.interviewMode), 900, 12000)
    await addUsage(provider, config.model || defaultSettings.providers[provider].model, result.usage)

    return {
      jd: result.answer || fallbackJd,
      provider,
      latencyMs: Date.now() - startedAt,
      usage: result.usage
    }
  } catch (error) {
    return {
      jd: `${fallbackJd}\n\nAI 深度生成失败：${error instanceof Error ? error.message : '未知错误'}`,
      provider: 'local',
      latencyMs: Date.now() - startedAt
    }
  }
}

function buildRoleJdPrompt(settings: AppSettings, mode: InterviewMode): string {
  const resume = settings.resume
  const resumeText = compactResumeText(resume)
  const currentJd = roleJdForMode(mode, settings.answer.roleJdTemplates)

  return [
    '请你为面试辅助软件生成一版“岗位 JD / 招聘要求模板”。',
    '',
    '目标：',
    '1. 这不是要伪造简历，而是根据候选人真实材料，生成更适合当前候选人准备面试的岗位要求参考。',
    '2. 输出要像真实招聘 JD，但要明确哪些是岗位要求，哪些是候选人简历中已有优势。',
    '3. 如果简历没有依据，不要编造候选人做过某项经历，只能写成“可补强方向”。',
    '',
    `当前岗位模式：${mode}`,
    `候选人姓名：${resume.candidateName || resume.profileName || '未填写'}`,
    `候选人目标岗位：${resume.targetRole || '未填写'}`,
    '',
    '当前默认 JD：',
    currentJd,
    '',
    '候选人简历材料（含正式简历、万字简历、其他简历）：',
    resumeText || '暂无简历材料',
    '',
    '请严格按以下格式输出中文，不要输出额外解释：',
    '岗位定位：...',
    '核心要求：...',
    '进阶/加分项：...',
    '候选人已具备优势：...',
    '可补强方向：...',
    '回答侧重：...'
  ].join('\n')
}

function buildLocalRoleJd(settings: AppSettings, mode: InterviewMode): string {
  const resume = settings.resume
  return [
    defaultRoleJdTemplates[mode],
    '',
    '--- 根据当前候选人简历生成的适配建议 ---',
    `候选人：${resume.profileName || resume.candidateName || '未命名候选人'}`,
    `目标岗位：${resume.targetRole || '未填写'}`,
    'AI 深度生成暂不可用时，先使用默认成熟模板；建议补充正式简历、万字简历和其他项目材料后再次生成。',
    '回答策略：优先讲简历里已经出现的项目、工具、指标和结果；JD 里有但简历没有的能力，只能表达学习理解、方法论或可迁移经验，不要硬编具体经历。'
  ].join('\n')
}

function compactResumeText(resume: ResumeProfile): string {
  return [
    section('正式简历', resume.formalResume),
    section('万字简历', resume.detailedResume),
    ...(resume.otherResumes || []).map((item) => section(item.title || item.file?.name || '其他简历', item.text))
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 14000)
}

function section(title: string, text?: string): string {
  const content = text?.trim()
  return content ? `【${title}】\n${content}` : ''
}
