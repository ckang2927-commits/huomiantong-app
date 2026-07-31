export type QuestionRewriteResult = {
  original: string
  corrected: string
  changed: boolean
  reason?: string
}

const replacements: Array<[RegExp, string]> = [
  [/低价公司/g, '第一家公司'],
  [/低假公司/g, '第一家公司'],
  [/第一家公司/g, '第一家公司'],
  [/第一家公司是哪里/g, '第一家公司在哪里'],
  [/第一家公司是在哪/g, '第一家公司在哪里'],
  [/第一家公司在哪儿/g, '第一家公司在哪里'],
  [/第一家公司在哪/g, '第一家公司在哪里'],
  [/第一家公司是在哪里/g, '第一家公司在哪里']
]

export function rewriteInterviewQuestion(input: string): QuestionRewriteResult {
  const original = normalizeQuestion(input)

  if (!original) {
    return {
      original: '',
      corrected: '',
      changed: false
    }
  }

  let corrected = original

  for (const [pattern, replacement] of replacements) {
    corrected = corrected.replace(pattern, replacement)
  }

  corrected = normalizeSpacing(corrected)
  corrected = simplifyFirstCompanyQuestion(corrected)

  if (corrected === original) {
    return {
      original,
      corrected,
      changed: false
    }
  }

  return {
    original,
    corrected,
    changed: true,
    reason: buildReason(original, corrected)
  }
}

function simplifyFirstCompanyQuestion(text: string): string {
  if (!/第一家公司/.test(text)) {
    return text
  }

  return text
    .replace(/第一家公司是在哪里/g, '第一家公司在哪里')
    .replace(/第一家公司是哪里/g, '第一家公司在哪里')
    .replace(/第一家公司在哪儿/g, '第一家公司在哪里')
    .replace(/第一家公司在哪/g, '第一家公司在哪里')
}

function buildReason(original: string, corrected: string): string {
  if (original.includes('低价公司') || original.includes('低假公司')) {
    return '已把“低价公司”改成“第一家公司”'
  }

  if (original.includes('第一家公司') && !original.includes('在哪里') && corrected.includes('在哪里')) {
    return '已补成更标准的“第一家公司在哪里”'
  }

  return '已自动改写为更自然的问题'
}

function normalizeQuestion(value: string): string {
  return cleanupSpeechRepeats(normalizeSpacing(value))
    .replace(/[，。！？、；;:,.]/g, '')
    .trim()
}

function normalizeSpacing(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/([，。！？、；;:,.])/g, '$1')
    .trim()
}

function cleanupSpeechRepeats(value: string): string {
  let cleaned = value.trim()

  for (let i = 0; i < 4; i += 1) {
    const next = cleaned
      .replace(/哪里里+$/g, '哪里')
      .replace(/哪儿儿+$/g, '哪儿')
      .replace(/在哪哪+$/g, '在哪')
      .replace(/什么么+$/g, '什么')
      .replace(/怎么么+$/g, '怎么')
      .replace(/如何何+$/g, '如何')
      .replace(/项目目+$/g, '项目')
      .replace(/公司司+$/g, '公司')
      .replace(/经历历+$/g, '经历')
      .replace(/介绍绍+$/g, '介绍')
      .replace(/([的了过])\1+$/g, '$1')
      .replace(/(哪里|哪儿|在哪|什么|怎么|如何|项目|公司|经历|介绍)\1+$/g, '$1')
      .replace(/([\u4e00-\u9fff])\1{2,}$/g, '$1')
      .replace(/([呢吗吧啊呀噢哦嘛])\1+$/g, '$1')

    if (next === cleaned) break
    cleaned = next
  }

  return cleaned
}
