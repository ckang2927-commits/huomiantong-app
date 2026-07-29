export type QuestionIntentCategory =
  | 'location'
  | 'time'
  | 'project'
  | 'responsibility'
  | 'achievement'
  | 'process'
  | 'company'
  | 'salary'
  | 'motivation'
  | 'general'

export type QuestionIntent = {
  category: QuestionIntentCategory
  label: string
  summary: string
  keywords: string[]
  answerHint: string
  searchHints: string[]
}

const intents: Array<{
  category: QuestionIntentCategory
  label: string
  summary: string
  answerHint: string
  searchHints: string[]
  patterns: RegExp[]
}> = [
  {
    category: 'location',
    label: '地点信息',
    summary: '面试官在问公司/学校/住址/地点在哪里。',
    answerHint: '先直接回答地点，再补一句简短背景，不要绕到别的经历。',
    searchHints: ['地点', '地址', '城市', '在哪里', '哪儿'],
    patterns: [/在哪里/i, /在哪儿/i, /在哪/i, /地点/i, /地址/i, /住址/i, /城市/i, /第一家公司/i]
  },
  {
    category: 'time',
    label: '时间信息',
    summary: '面试官在问时间点、周期、年限、毕业时间或离职时间。',
    answerHint: '先报具体时间，再补一条简短解释。',
    searchHints: ['时间', '月份', '年份', '多久', '年限', '毕业时间', '离职时间'],
    patterns: [/什么时候/i, /多久/i, /多长时间/i, /哪一年/i, /哪年/i, /什么时候/i, /时间/i, /毕业/i, /离职/i, /空窗/i]
  },
  {
    category: 'project',
    label: '项目经历',
    summary: '面试官在问最深、最核心、代表性的项目或案例。',
    answerHint: '先讲项目背景，再讲你的动作，最后讲结果或复盘。',
    searchHints: ['项目', '案例', '经历', '印象最深', '最核心', '代表性'],
    patterns: [/项目/i, /案例/i, /经历/i, /印象最深/i, /最深刻/i, /最核心/i, /代表性/i]
  },
  {
    category: 'responsibility',
    label: '职责范围',
    summary: '面试官在问你具体负责什么、日常做什么、职能边界在哪里。',
    answerHint: '先说职责范围，再说你实际做的事情，最后补一个结果。',
    searchHints: ['职责', '负责', '日常', '主要做什么', '工作内容', '岗位职责'],
    patterns: [/负责/i, /职责/i, /日常/i, /主要做什么/i, /工作内容/i, /岗位职责/i, /做什么/i]
  },
  {
    category: 'achievement',
    label: '业绩结果',
    summary: '面试官在问成果、提升、增长、指标和成效。',
    answerHint: '先给结果，再补过程，最好带一个数字或对比。',
    searchHints: ['结果', '提升', '增长', '指标', '业绩', '成效', '收益'],
    patterns: [/结果/i, /提升/i, /增长/i, /指标/i, /业绩/i, /成效/i, /ROI/i, /ROAS/i, /ACOS/i, /转化率/i]
  },
  {
    category: 'process',
    label: '方法过程',
    summary: '面试官在问怎么做、流程、方法、技术方案或分析路径。',
    answerHint: '先讲步骤或方法，再讲你为什么这么做，最后补结果。',
    searchHints: ['怎么做', '如何', '步骤', '过程', '方法', '方案', '模型', 'SQL', 'Python'],
    patterns: [/怎么/i, /如何/i, /步骤/i, /过程/i, /方法/i, /方案/i, /模型/i, /SQL/i, /Python/i, /Excel/i, /BI/i]
  },
  {
    category: 'company',
    label: '公司背景',
    summary: '面试官在问公司、业务、团队、组织、主营内容。',
    answerHint: '先说公司或业务名，再给一两句客观描述。',
    searchHints: ['公司', '业务', '团队', '组织', '主营业务', '岗位'],
    patterns: [/公司/i, /业务/i, /团队/i, /组织/i, /主营业务/i, /岗位/i, /行业/i]
  },
  {
    category: 'salary',
    label: '薪资谈判',
    summary: '面试官在问薪资、期望、底线、涨幅或年包。',
    answerHint: '先说区间或预期，再补价值判断，不要把底线说死。',
    searchHints: ['薪资', '期望薪资', '底线', '涨幅', '年包', '月薪'],
    patterns: [/薪资/i, /工资/i, /期望薪资/i, /底线/i, /涨幅/i, /年包/i, /月薪/i, /offer/i]
  },
  {
    category: 'motivation',
    label: '意愿稳定',
    summary: '面试官在问家庭支持、求职意愿、城市选择、稳定性或到岗安排。',
    answerHint: '先明确态度，再补真实原因、稳定安排和边界，不要绕成项目经历。',
    searchHints: ['家庭支持', '求职意愿', '稳定性', '城市选择', '到岗安排'],
    patterns: [
      /家里/i,
      /家人/i,
      /父母/i,
      /支持/i,
      /意愿/i,
      /愿意/i,
      /想不想/i,
      /稳定/i,
      /长期/i,
      /定居/i,
      /城市选择/i,
      /到岗/i,
      /入职/i,
      /通勤/i,
      /租房/i,
      /为什么离职/i,
      /离职原因/i
    ]
  }
]

export function analyzeQuestionIntent(question: string): QuestionIntent {
  const normalized = normalizeQuestion(question)
  const matchedIntent = intents.find((intent) => intent.patterns.some((pattern) => pattern.test(normalized)))

  if (!matchedIntent) {
    return {
      category: 'general',
      label: '通用问题',
      summary: '这是一个通用面试问题。',
      keywords: [],
      answerHint: '先直接回答问题本身，再补一条和岗位相关的简短说明。',
      searchHints: ['通用问题', '面试问题']
    }
  }

  const keywords = matchedIntent.patterns
    .map((pattern) => extractKeyword(pattern, normalized))
    .filter((keyword): keyword is string => Boolean(keyword))

  return {
    category: matchedIntent.category,
    label: matchedIntent.label,
    summary: matchedIntent.summary,
    keywords,
    answerHint: matchedIntent.answerHint,
    searchHints: matchedIntent.searchHints
  }
}

export function formatQuestionIntentNotice(intent: QuestionIntent): string {
  return `识别为：${intent.label}｜${intent.answerHint}`
}

export function buildIntentPromptContext(question: string, intent: QuestionIntent): string {
  return [
    question.trim(),
    '',
    `【问题意图】${intent.label}`,
    `【意图说明】${intent.summary}`,
    `【回答提示】${intent.answerHint}`,
    `【检索提示】${intent.searchHints.join('、')}`
  ].join('\n')
}

function normalizeQuestion(question: string): string {
  return question
    .replace(/\s+/g, '')
    .replace(/低价公司|地家公司|第家公司|第一家公司司/g, '第一家公司')
    .replace(/低一个公司|第一个公/g, '第一个公司')
    .trim()
}

function extractKeyword(pattern: RegExp, text: string): string {
  const match = text.match(pattern)
  return match?.[0] || ''
}
