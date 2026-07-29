import { addUsage, defaultSettings, normalizeSettings } from './appStorage'
import { callOpenAiCompatible } from './modelClient'
import type {
  AppSettings,
  BackgroundPrepGenerateRequest,
  BackgroundPrepGenerateResult,
  BackgroundPrepInput,
  BackgroundPrepPackageType,
  BackgroundPrepSearchRequest,
  BackgroundPrepSearchResult,
  BackgroundPublicSource,
  ResumeProfile
} from '../../shared/types'

const packageLabels: Record<BackgroundPrepPackageType, string> = {
  hr: 'HR基础补充',
  salary: '薪资谈判补充',
  company: '公司背景补充',
  work: '工作细节补充',
  onboard: '入职后勤补充',
  risk: '风险回答补充'
}

export async function generateBackgroundPrep(request: BackgroundPrepGenerateRequest): Promise<BackgroundPrepGenerateResult> {
  const startedAt = Date.now()
  const settings = normalizeSettings(request.settings)
  const provider = settings.answer.llmProvider
  const config = settings.providers[provider]
  const fallback = buildLocalBackgroundPrep(settings, request.input)

  if (!config.enabled || !config.apiKey) {
    return {
      ...fallback,
      content: `${fallback.content}\n\n> 未调用 AI：请先在 API 设置里填写并启用 ${provider} API Key。当前内容由本地规则按简历生成。`,
      provider: 'local',
      latencyMs: Date.now() - startedAt
    }
  }

  try {
    const result = await callOpenAiCompatible(provider, config, buildPrompt(settings, request.input), 1200, 15000, {
      systemPrompt: '你是获面通的背景资料补全助手。你必须区分简历依据、用户填写、AI模拟参考和待确认信息，不能把模拟内容写成事实。',
      temperature: 0.45
    })

    await addUsage(provider, config.model || defaultSettings.providers[provider].model, result.usage)

    return {
      title: fallback.title,
      content: result.answer || fallback.content,
      provider,
      latencyMs: Date.now() - startedAt,
      usage: result.usage
    }
  } catch (error) {
    return {
      ...fallback,
      content: `${fallback.content}\n\n> AI 深度生成失败：${error instanceof Error ? error.message : '未知错误'}。当前内容由本地规则按简历生成。`,
      provider: 'local',
      latencyMs: Date.now() - startedAt
    }
  }
}

export async function searchBackgroundPublicInfo(request: BackgroundPrepSearchRequest): Promise<BackgroundPrepSearchResult> {
  const startedAt = Date.now()
  const query = buildSearchQuery(request.input)

  if (!query.trim()) {
    return {
      query,
      sources: [],
      latencyMs: Date.now() - startedAt,
      message: '请先填写公司名称或目标岗位。'
    }
  }

  try {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 Huomiantong/0.1 public-info-search',
        accept: 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(12000)
    })

    if (!response.ok) {
      throw new Error(`公开搜索请求失败：HTTP ${response.status}`)
    }

    const html = await response.text()
    const sources = parseDuckDuckGoHtml(html).slice(0, 6)

    return {
      query,
      sources,
      latencyMs: Date.now() - startedAt,
      message: sources.length ? undefined : '没有解析到公开搜索结果，可以换一个公司名或岗位关键词。'
    }
  } catch (error) {
    return {
      query,
      sources: [],
      latencyMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : '公开搜索失败'
    }
  }
}

function buildPrompt(settings: AppSettings, input: BackgroundPrepInput): string {
  const resume = settings.resume
  const title = buildTitle(settings, input)

  return [
    `请生成一份「${title}」。`,
    '',
    '核心要求：',
    '1. 必须输出 Markdown。',
    '2. 简历里有依据的内容标注【简历依据】。',
    '3. 用户明确填写的内容标注【用户确认】。',
    '4. 需要推测的内容标注【AI模拟参考/低可信】，只能作为准备思路。',
    '5. 没有依据但面试可能被问到的内容标注【待确认】，不要硬编事实。',
    '6. 输出要能保存到“其他简历”，后续会被 RAG 和训练参考。',
    '',
    `资料包类型：${packageLabels[input.packageType]}`,
    `公司名：${input.companyName || '未填写'}`,
    `目标岗位：${input.targetRole || resume.targetRole || '未填写'}`,
    '',
    '用户已确认事实：',
    input.confirmedFacts || '暂无',
    '',
    '用户不确定/希望 AI 模拟的地方：',
    input.uncertainNotes || '暂无',
    '',
    '联网公开资料来源：',
    formatPublicSources(input.publicSources),
    '',
    '候选人简历材料：',
    compactResumeText(resume) || '暂无简历材料',
    '',
    '请按以下结构输出：',
    `# ${title}`,
    '## 可直接使用的确认信息',
    '## 需要准备的问答口径',
    '## AI模拟参考（低可信）',
    '## 待用户确认',
    '## 面试提醒'
  ].join('\n')
}

function buildLocalBackgroundPrep(settings: AppSettings, input: BackgroundPrepInput): Omit<BackgroundPrepGenerateResult, 'provider' | 'latencyMs' | 'usage'> {
  const resume = settings.resume
  const title = buildTitle(settings, input)
  const resumeHints = extractResumeHints(resume, input)
  const packageAdvice = localPackageAdvice(input.packageType, input.targetRole || resume.targetRole)

  return {
    title,
    content: [
      `# ${title}`,
      '',
      `候选人：${resume.profileName || resume.candidateName || '未命名候选人'}`,
      `公司：${input.companyName || '待填写'}`,
      `岗位：${input.targetRole || resume.targetRole || '待填写'}`,
      `生成时间：${new Date().toLocaleString('zh-CN')}`,
      '',
      '> 说明：本内容由本地规则按简历生成，不花 Token。AI模拟参考只能当准备思路，不能当事实背诵。',
      '',
      '## 可直接使用的确认信息',
      input.confirmedFacts.trim() || '- 暂无用户确认信息，请先填写住址、薪资、公司背景、工作细节等真实信息。',
      '',
      '## 简历依据',
      resumeHints.length ? resumeHints.map((item) => `- ${item}`).join('\n') : '- 当前简历没有明显命中信息，建议先补充真实资料。',
      '',
      '## 公开资料来源',
      formatPublicSources(input.publicSources),
      '',
      '## 需要准备的问答口径',
      packageAdvice.confirmed.map((item) => `- ${item}`).join('\n'),
      '',
      '## AI模拟参考（低可信）',
      packageAdvice.simulated.map((item) => `- ${item}`).join('\n'),
      '',
      '## 待用户确认',
      [
        input.uncertainNotes.trim() ? `- ${input.uncertainNotes.trim()}` : '- 哪些内容不确定，需要你面试前确认后再说。',
        '- 公司内部小组、同事姓名、老板/直属上级、真实运作方式等不能硬编成事实。',
        '- 如果只是为了练口径，可以保留为“AI模拟参考”，不要保存成确定经历。'
      ].join('\n')
    ].join('\n')
  }
}

function buildSearchQuery(input: BackgroundPrepInput): string {
  const parts = [
    input.companyName,
    input.targetRole,
    packageLabels[input.packageType],
    input.packageType === 'company' ? '官网 主营业务 招聘' : '招聘 JD 面试'
  ]

  return parts.map((item) => item?.trim()).filter(Boolean).join(' ')
}

function parseDuckDuckGoHtml(html: string): BackgroundPublicSource[] {
  const blocks = html.split(/<div class="result(?:__body)?"/i).slice(1)
  const now = Date.now()
  const results: BackgroundPublicSource[] = []
  const seen = new Set<string>()

  for (const block of blocks) {
    const linkMatch = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)

    if (!linkMatch) {
      continue
    }

    const url = normalizeDuckDuckGoUrl(decodeHtml(linkMatch[1]))
    const title = stripHtml(linkMatch[2])
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)(?:<\/a>|<\/div>)/i)
    const snippet = snippetMatch ? stripHtml(snippetMatch[1]) : ''

    if (!url || !title || seen.has(url)) {
      continue
    }

    seen.add(url)
    results.push({
      title,
      url,
      snippet,
      source: hostFromUrl(url),
      checkedAt: now
    })
  }

  return results
}

function normalizeDuckDuckGoUrl(value: string): string {
  try {
    const url = new URL(value, 'https://duckduckgo.com')
    const redirected = url.searchParams.get('uddg')
    return redirected ? decodeURIComponent(redirected) : url.href
  } catch {
    return ''
  }
}

function hostFromUrl(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return '公开网页'
  }
}

function stripHtml(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function formatPublicSources(sources?: BackgroundPublicSource[]): string {
  if (!sources?.length) {
    return '暂无。可以先点击“联网搜索公开资料”，再生成资料包。'
  }

  return sources
    .map((item, index) => `${index + 1}. ${item.title}\n   来源：${item.source}\n   链接：${item.url}\n   摘要：${item.snippet || '无摘要'}`)
    .join('\n')
}

function buildTitle(settings: AppSettings, input: BackgroundPrepInput): string {
  const candidateName = settings.resume.profileName || settings.resume.candidateName || '默认候选人'
  const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
  return `${packageLabels[input.packageType]}-${candidateName}-${date}`
}

function localPackageAdvice(type: BackgroundPrepPackageType, targetRole: string): { confirmed: string[]; simulated: string[] } {
  const role = targetRole || '目标岗位'

  if (type === 'salary') {
    return {
      confirmed: ['准备当前期望薪资、可接受底线、上家公司薪资结构和涨幅理由。', '回答时先讲市场匹配、岗位价值和过往结果，不要只报数字。'],
      simulated: [`如果对方压薪，可以从“${role}岗位产出、经验匹配、入职后交付计划”三个角度稳住。`]
    }
  }

  if (type === 'company') {
    return {
      confirmed: ['填写公司公开业务、岗位 JD、通勤地址和你已经核实的信息。', '面试时可以讲“我看到贵司主要做……，所以我理解岗位重点是……”。'],
      simulated: ['未核实的组织架构、团队人数、内部流程只能说“我初步理解/我会入职后确认”。']
    }
  }

  if (type === 'work') {
    return {
      confirmed: ['准备部门职责、上下游协作、日常报表、工具链、会议节奏和汇报方式。', '尽量和简历项目里的真实动作对应，避免另起一套说法。'],
      simulated: ['可以模拟“分析师常见工作流：取数、清洗、建模/分析、复盘、汇报”，但不要编具体同事和内部系统。']
    }
  }

  if (type === 'onboard') {
    return {
      confirmed: ['准备入职后 30 天学习计划、业务口径熟悉方式、协作对象和交付节奏。'],
      simulated: ['可以模拟入职后先熟悉数据口径、看历史报表、和业务确认指标定义，再做专题分析。']
    }
  }

  if (type === 'risk') {
    return {
      confirmed: ['列出简历里最容易被追问的数字、项目、时间线和职责边界。', '准备“我能确认的是……不确定的部分我不会说死”的安全表达。'],
      simulated: ['遇到内部细节不知道时，可以说“这块我不会假设具体组织细节，但我会按业务目标和协作流程去确认”。']
    }
  }

  return {
    confirmed: ['准备现住址、通勤、学历、离职原因、空窗期、稳定性和到岗时间。', 'HR 问题优先讲真实情况，表达自然即可，不要包装过度。'],
    simulated: ['如果被问稳定性，可以从目标岗位匹配、城市/通勤可接受、长期发展意愿三个角度组织回答。']
  }
}

function extractResumeHints(resume: ResumeProfile, input: BackgroundPrepInput): string[] {
  const text = compactResumeText(resume)
  const keywords = [input.companyName, input.targetRole, resume.targetRole, '数据', '分析', '项目', '指标', '建模', 'SQL', 'Python']
    .map((item) => item?.trim())
    .filter(Boolean)
  const sentences = text
    .split(/[。！？\n\r；;]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 12)

  return sentences
    .filter((sentence) => keywords.some((keyword) => sentence.toLowerCase().includes(keyword!.toLowerCase())))
    .slice(0, 8)
}

function compactResumeText(resume: ResumeProfile): string {
  return [
    section('正式简历', resume.formalResume),
    section('万字简历', resume.detailedResume),
    ...(resume.otherResumes || []).map((item) => section(item.title || item.file?.name || '其他简历', item.text))
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 16000)
}

function section(title: string, text?: string): string {
  const content = text?.trim()
  return content ? `【${title}】\n${content}` : ''
}
