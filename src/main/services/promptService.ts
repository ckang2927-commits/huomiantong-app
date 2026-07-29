import { evidenceSourceLabel } from './evidenceService'
import { roleJdForMode } from '../../shared/roleJdTemplates'
import { analyzeQuestionIntent, buildIntentPromptContext } from '../../shared/questionIntent'
import { buildTranscriptContext, formatTranscriptContext } from '../../shared/transcriptContext'
import type { AppSettings, AnswerRequest, EvidenceSnippet } from '../../shared/types'

export function buildFastAnswer(question: string, settings: AppSettings, evidence: EvidenceSnippet[]): string {
  const specialAnswer = buildSpecialCaseAnswer(question)

  if (specialAnswer) {
    return specialAnswer
  }

  const role = settings.resume.targetRole || '目标岗位'

  if (evidence.length === 0) {
    return '稍等，我先把这个问题捋一下。我会按真实经历能支撑的部分来讲，没有依据的地方我不会硬编。'
  }

  if (isProjectDeepDiveQuestion(question)) {
    const projectName = inferProjectName(evidence)
    return projectName
      ? `稍等，我先挑一个项目讲清楚：${projectName}。我会按背景、动作、结果、复盘这几个点说，不展开成简历复读。`
      : '稍等，我先挑一个最能体现我分析能力的项目，按背景、动作、结果、复盘这几个点说。'
  }

  return `稍等，我结合${role}经历用简短版本先答一下，优先说清楚结论，再补一条真实经历支撑。`
}

export function buildPrompt(request: AnswerRequest, evidence: EvidenceSnippet[]): string {
  const { question, settings, transcript } = request
  const intent = analyzeQuestionIntent(question)
  const modeGuideMap: Record<AppSettings['answer']['interviewMode'], string> = {
    dataAnalyst: '数据分析岗：突出业务目标、指标口径、SQL/分析路径、结论落地和复盘。',
    aiProductManager: 'AI 产品经理岗：突出 AI 场景判断、模型能力边界、需求拆解、数据指标、Prompt/工作流和落地效果。',
    backendEngineer: '后端开发岗：突出系统设计、接口边界、稳定性、性能、排障、工程取舍和数据一致性。',
    frontendEngineer: '前端工程岗：突出组件设计、状态管理、性能优化、工程化、跨端适配和用户体验。',
    fullstackEngineer: '全栈工程岗：突出前后端协作、接口设计、数据库、部署交付、系统设计和端到端问题定位。',
    general: '通用面试：突出问题理解、行动过程、结果影响、个人思考和岗位匹配。'
  }

  const modeGuide = modeGuideMap[settings.answer.interviewMode]
  const roleJd = roleJdForMode(settings.answer.interviewMode, settings.answer.roleJdTemplates)
  const transcriptContext = buildTranscriptContext(transcript, { recentLineCount: 6 })
  const history = formatTranscriptContext(transcriptContext)

  const evidenceText =
    evidence.length > 0
      ? evidence.slice(0, 3).map((item, index) => `${index + 1}. [${evidenceSourceLabel(item)}] ${compactEvidenceText(item.text)}`).join('\n')
      : '暂无明确简历依据。'

  const styleGuide = buildStyleGuide(settings.answer.answerStyle, question, intent)

  const questionGuide = isProjectDeepDiveQuestion(question)
    ? '当前问题是项目深挖：只选一个项目讲，按“背景 -> 目标 -> 动作 -> 结果/复盘”回答，不要把所有项目都铺开。'
    : buildQuestionGuide(intent)

  const intentContext = buildIntentPromptContext(question, intent)

  return [
    `候选人姓名：${settings.resume.candidateName || '未填写'}`,
    `目标岗位：${settings.resume.targetRole || '未填写'}`,
    `面试模式：${modeGuide}`,
    `回答风格：${settings.answer.answerStyle}`,
    '',
    '当前岗位 JD / 招聘要求：',
    roleJd,
    '',
    '最近转写上下文：',
    history || '暂无',
    '',
    '面试官当前问题：',
    question,
    '',
    '问题意图识别：',
    intentContext,
    '',
    '当前问题处理策略：',
    questionGuide,
    '',
    '可引用的简历依据：',
    evidenceText,
    '',
    '请生成中文面试回答，要求：',
    `1. ${styleGuide}`,
    '2. 语气像真人面试现场说话，可以自然口语化，但不要啰嗦、不要官话、不要“AI味”。',
    `3. ${transcriptContext.compressed ? '这是长会话，前文已经压缩，只需要结合摘要和最近上下文回答。' : '优先依据简历和已有资料，不要编造没有依据的经历、公司、数字。'}`,
    '4. 如果依据不够，就给出一个安全的泛化回答，别硬编。',
    '5. 回答要尽量贴合岗位关键词，但不能为了贴合 JD 去编造简历里没有的事实。',
    '6. 可以适度优化表达，但不要改变简历事实。',
    '7. 严禁逐字粘贴简历原文，严禁输出长清单式内容，严禁把多段工作经历整段铺出来。',
    '8. 先回答面试官问的那个点；问地点就先说地点，问时间就先说时间，问项目才讲项目。',
    '9. 只输出候选人可以直接说出口的回答，不要标题、编号、Markdown、解释或备注。'
  ].join('\n')
}

export function buildSpecialCaseAnswer(question: string): string {
  const normalized = normalizeQuestion(question)

  if (!normalized) {
    return ''
  }

  if (/^(嗨|hi|hello|你好|可以|嗯|哦)$/.test(normalized)) {
    return '可以，我在，你继续问就行。'
  }

  if (/(听得到|听得见|听不到|听不见|声音|麦克风|能听到吗|能听见吗)/i.test(normalized)) {
    return '听得到，我这边声音正常。你那边如果不清楚，我可以再说慢一点。'
  }

  if (/(太慢|有点慢|卡住|延迟|反应慢)/i.test(normalized)) {
    return '不好意思，我刚才稍微想了一下。我现在直接说重点。'
  }

  return ''
}

export function normalizeAnswerText(answer: string, style: AppSettings['answer']['answerStyle'], question = ''): string {
  const intent = question ? analyzeQuestionIntent(question) : null
  const isShortFact = intent?.category === 'location' || intent?.category === 'time' || intent?.category === 'company'
  const isProject = question ? isProjectDeepDiveQuestion(question) : false
  const maxChars = isShortFact ? 95 : style === 'fast' ? 110 : style === 'star' ? 320 : isProject ? 260 : 210
  const maxSentences = isShortFact ? 2 : style === 'fast' ? 2 : style === 'star' ? 5 : isProject ? 5 : 4
  let cleaned = answer
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^(项目描述|工作经历|技能特长|教育经历|自我介绍|正式简历|万字简历|候选人简历材料)\s*[:：]?/gm, '')
    .replace(/比如我简历里这块经历可以展开[:：]?.*$/g, '')
    .replace(/比如我简历里.*$/g, '')
    .replace(/(?:\s*[-·•]\s*)?(?:负责|构建|搭建|设计并执行|分析|监控)(?:[^。！？；;]{18,}[；;]){2,}/g, '')
    .replace(/\s*##\s*.+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (isShortFact) {
    cleaned = cleaned
      .replace(/^稍等一下[，,。]?\s*/g, '')
      .replace(/^我(?:先)?(?:结合|从).{0,18}?(?:讲一下|说一下|回答一下)[，,。]?\s*/g, '')
      .replace(/^这个问题.{0,20}?(?:回答|说)[，,。]?\s*/g, '')
      .trim()
  }

  if (!cleaned) {
    if (intent?.category === 'location') {
      return '这个地点我会按真实情况直接说；如果资料里没写清楚，我不会现场硬编。'
    }

    if (intent?.category === 'time' || intent?.category === 'company') {
      return '这个我会先按真实信息直接回答，资料里没有依据的部分我不会说死。'
    }

    return '这个问题我先说重点：我会基于真实经历回答，没有依据的部分不会硬编。'
  }

  if (cleaned.length <= maxChars) {
    return cleaned
  }

  const sentences = cleaned.match(/[^。！？?]+[。！？?]?/g) || [cleaned]
  const compact = sentences.slice(0, maxSentences).join('').trim()

  if (compact.length <= maxChars) {
    return compact
  }

  const safeCut = compact.slice(0, maxChars)
  const lastPunctuation = Math.max(safeCut.lastIndexOf('。'), safeCut.lastIndexOf('！'), safeCut.lastIndexOf('？'), safeCut.lastIndexOf('?'))
  return (lastPunctuation > 60 ? safeCut.slice(0, lastPunctuation + 1) : safeCut).trim()
}

export function answerRuntimeConfig(style: AppSettings['answer']['answerStyle']): { maxTokens: number; timeoutMs: number } {
  if (style === 'fast') {
    return { maxTokens: 130, timeoutMs: 4500 }
  }

  if (style === 'star') {
    return { maxTokens: 420, timeoutMs: 8000 }
  }

  return { maxTokens: 240, timeoutMs: 5500 }
}

function isProjectDeepDiveQuestion(question: string): boolean {
  return /(印象最深|最深刻|最核心|代表性|项目|案例|经历).*?(项目|案例|经历)?/.test(normalizeQuestion(question))
}

function inferProjectName(evidence: EvidenceSnippet[]): string {
  const text = evidence.map((item) => item.text).join(' ')
  const candidates = [
    /(发制品随机森林爆品预测模型)/,
    /(随机森林(?:选品|爆品预测)?模型)/,
    /(RFM\s*用户价值分层体系)/i,
    /(Listing\s*转化率\s*A\/B\s*实验)/i,
    /(广告\s*ROI\s*分析体系)/i,
    /([\u4e00-\u9fa5A-Za-z0-9/+\-\s]{0,16}(?:随机森林|爆品预测|用户分层|RFM|A\/B|ROI|ROAS|ACOS)[\u4e00-\u9fa5A-Za-z0-9/+\-\s]{0,14}(?:项目|模型|体系|实验)?)/i
  ]

  for (const pattern of candidates) {
    const match = text.match(pattern)

    if (match?.[1]) {
      return compactProjectName(match[1])
    }
  }

  return ''
}

function compactProjectName(value: string): string {
  return value
    .replace(/\s+/g, '')
    .replace(/^[，。；、\s]+|[，。；、\s]+$/g, '')
    .slice(0, 28)
}

function compactEvidenceText(text: string): string {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/(工作经历|技能特长|项目描述|自我介绍|教育经历)\s*[:：]?/g, '')
    .replace(/\d{4}[-/年]\d{1,2}(?:[-/月]\d{1,2})?(?:\s*[~至]\s*\d{4}[-/年]\d{1,2}(?:[-/月]\d{1,2})?)?/g, '')
    .replace(/[·•]/g, '，')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned.length > 150 ? `${cleaned.slice(0, 150)}…` : cleaned
}

function normalizeQuestion(question: string): string {
  return question
    .replace(/\s+/g, '')
    .replace(/[。！？?，,；;：:]/g, '')
    .trim()
}

function buildQuestionGuide(intent: ReturnType<typeof analyzeQuestionIntent>): string {
  switch (intent.category) {
    case 'location':
      return '这是地点类问题：先直接答地点，再补一句相关背景，不要绕到其他经历。'
    case 'time':
      return '这是时间类问题：先给具体时间，再补简短说明，不要把时间说模糊。'
    case 'project':
      return '这是项目类问题：按背景、目标、动作、结果、复盘来答，不要把多个项目混在一起。'
    case 'responsibility':
      return '这是职责类问题：先说你负责什么，再说你实际做了什么，最后补一个结果。'
    case 'achievement':
      return '这是结果类问题：先说结果，再说过程，最好带一个数字或对比。'
    case 'process':
      return '这是方法类问题：先讲步骤或方法，再讲为什么这么做，最后补结果。'
    case 'company':
      return '这是公司类问题：先答公司/业务，再给客观描述，不要硬编内部细节。'
    case 'salary':
      return '这是薪资类问题：先给区间或预期，再补价值判断，不要把底线说死。'
    default:
      return '这是通用问题：先直接回答，再补一条和岗位相关的简短说明。'
  }
}

function buildStyleGuide(
  style: AppSettings['answer']['answerStyle'],
  question: string,
  intent: ReturnType<typeof analyzeQuestionIntent>
): string {
  if (intent.category === 'location') {
    return '控制在 30-70 个中文字符。先直接回答地点，再补一句背景；不要讲项目、不要展开简历。'
  }

  if (intent.category === 'time' || intent.category === 'company') {
    return '控制在 40-90 个中文字符。先直接回答事实，再补一句自然解释；不要铺经历。'
  }

  if (isProjectDeepDiveQuestion(question)) {
    return style === 'fast'
      ? '控制在 80-130 个中文字符。只讲一个项目，按背景、动作、结果三点说。'
      : '控制在 160-260 个中文字符。只讲一个项目，按背景、目标、动作、结果/复盘自然表达。'
  }

  if (style === 'fast') {
    return '控制在 50-90 个中文字符，只给一句到两句能直接说出口的短答。'
  }

  if (style === 'star') {
    return '控制在 220-300 个中文字符，可以讲背景、做法、结果、复盘，但不要写成模板。'
  }

  return '控制在 100-180 个中文字符，三到四句话，别展开成简历复述。'
}
