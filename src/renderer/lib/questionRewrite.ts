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
  return normalizeSpacing(value)
    .replace(/[，。！？、；;:,.]/g, '')
    .trim()
}

function normalizeSpacing(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/([，。！？、；;:,.])/g, '$1')
    .trim()
}
