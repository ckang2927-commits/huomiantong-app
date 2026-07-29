const completionCuePatterns = [
  /大概就是这些/,
  /我(?:的)?回答完毕/,
  /我说完了/,
  /就先这样/,
  /以上就是/,
  /差不多就是这些/,
  /大概就是这样/,
  /我的回答就这些/,
  /以上就是我的回答/
]

export function stripTrainingAnswerCompletionCue(text: string): { text: string; completed: boolean } {
  const normalized = normalizeText(text)

  if (!normalized) {
    return { text: '', completed: false }
  }

  for (const pattern of completionCuePatterns) {
    if (pattern.test(normalized)) {
      const cleaned = normalized.replace(pattern, '').trim()
      return { text: cleaned, completed: true }
    }
  }

  return { text: normalized, completed: false }
}

export function appendSpokenAnswer(previous: string, incoming: string): string {
  const base = previous.trim()
  const addition = normalizeText(incoming)

  if (!addition) {
    return base
  }

  if (!base) {
    return addition
  }

  if (/[。！？；…]$/.test(base)) {
    return `${base}${addition}`
  }

  return `${base}，${addition}`
}

export function isTrainingAnswerCompletionCue(text: string): boolean {
  const normalized = normalizeText(text)
  return completionCuePatterns.some((pattern) => pattern.test(normalized))
}

function normalizeText(value: string): string {
  return value
    .replace(/\s+/g, '')
    .replace(/[。！？；,.，、]/g, '，')
    .trim()
}
