import type { SpeechExpressionScore } from '../../shared/types'

type AnalyzeSpeechExpressionOptions = {
  text: string
  startedAt?: number
  endedAt?: number
  finalTranscriptCount?: number
}

const fillerPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: '嗯', pattern: /嗯+/g },
  { label: '呃', pattern: /呃+/g },
  { label: '额', pattern: /额+/g },
  { label: '那个', pattern: /那个/g },
  { label: '就是', pattern: /就是/g },
  { label: '其实', pattern: /其实/g },
  { label: '然后', pattern: /然后/g },
  { label: '怎么说', pattern: /怎么说/g },
  { label: '对吧', pattern: /对吧/g },
  { label: '你知道', pattern: /你知道/g }
]

const structurePatterns = [
  /首先|其次|再次|最后|总之|总结|一方面|另一方面|第一|第二|第三/,
  /背景|目标|任务|行动|结果|复盘|影响|价值|方案|取舍|验证/,
  /先说|再说|然后|接着|最终|因此|所以/
]

export function analyzeSpeechExpression({
  text,
  startedAt,
  endedAt,
  finalTranscriptCount = 0
}: AnalyzeSpeechExpressionOptions): SpeechExpressionScore {
  const normalizedText = normalizeText(text)
  const speechUnits = countSpeechUnits(normalizedText)
  const durationMs = calculateDurationMs({
    startedAt,
    endedAt,
    text: normalizedText,
    finalTranscriptCount
  })
  const durationSec = Math.max(1, Math.round(durationMs / 1000))
  const charsPerMinute = Math.round((speechUnits / durationSec) * 60)
  const fillerCount = countFillerWords(normalizedText)
  const pauseHintCount = countPauseHints(normalizedText)
  const sentenceCount = Math.max(1, splitSentences(normalizedText).length)
  const averageSentenceLength = speechUnits / sentenceCount

  const pace = scorePace(charsPerMinute, speechUnits, durationSec)
  const clarity = scoreClarity({
    averageSentenceLength,
    fillerCount,
    pauseHintCount,
    speechUnits
  })
  const structure = scoreStructure(normalizedText)
  const confidence = scoreConfidence({
    speechUnits,
    durationSec,
    fillerCount,
    finalTranscriptCount
  })
  const total = clampScore(Math.round(pace * 0.28 + clarity * 0.3 + structure * 0.22 + confidence * 0.2))
  const notes = buildNotes({
    charsPerMinute,
    durationSec,
    fillerCount,
    pauseHintCount,
    averageSentenceLength,
    estimatedDuration: startedAt ? endedAt ? false : true : true,
    finalTranscriptCount,
    pace,
    clarity,
    structure
  })

  return {
    total,
    pace,
    clarity,
    structure,
    confidence,
    durationSec,
    estimatedDuration: startedAt ? endedAt ? false : true : true,
    charsPerMinute,
    fillerCount,
    pauseHintCount,
    notes
  }
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function countSpeechUnits(text: string): number {
  const chineseCharacters = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const latinWords = (text.match(/[a-zA-Z0-9]+/g) || []).length
  return chineseCharacters + Math.round(latinWords * 1.5)
}

function calculateDurationMs({
  startedAt,
  endedAt,
  text,
  finalTranscriptCount
}: {
  startedAt?: number
  endedAt?: number
  text: string
  finalTranscriptCount: number
}): number {
  const now = Date.now()
  const actualDuration = startedAt ? Math.max(0, (endedAt || now) - startedAt) : 0

  if (actualDuration >= 1000) {
    return actualDuration
  }

  const estimatedByText = estimateDurationFromText(text, finalTranscriptCount)
  return Math.max(1000, estimatedByText)
}

function estimateDurationFromText(text: string, finalTranscriptCount: number): number {
  const speechUnits = Math.max(1, countSpeechUnits(text))
  const baseMs = (speechUnits / 2.6) * 1000
  const segmentMs = finalTranscriptCount > 0 ? Math.min(5000, finalTranscriptCount * 550) : 0
  return Math.round(baseMs + segmentMs)
}

function countFillerWords(text: string): number {
  return fillerPatterns.reduce((sum, item) => sum + (text.match(item.pattern)?.length || 0), 0)
}

function countPauseHints(text: string): number {
  const pausePatterns = [
    /…+/g,
    /\.{2,}/g,
    /，{2,}/g,
    /,{2,}/g,
    /、{2,}/g,
    /！{2,}/g,
    /？{2,}/g
  ]

  return pausePatterns.reduce((sum, pattern) => sum + (text.match(pattern)?.length || 0), 0)
}

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？!?；;\n]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function scorePace(charsPerMinute: number, speechUnits: number, durationSec: number): number {
  if (speechUnits < 10) {
    return 55
  }

  if (durationSec <= 2) {
    return 50
  }

  if (charsPerMinute < 90) {
    return clampScore(45 + Math.round(charsPerMinute / 3))
  }

  if (charsPerMinute <= 120) {
    return clampScore(68 + Math.round((charsPerMinute - 90) / 2))
  }

  if (charsPerMinute <= 240) {
    return clampScore(88 + Math.round((charsPerMinute - 120) / 20))
  }

  if (charsPerMinute <= 320) {
    return clampScore(92 - Math.round((charsPerMinute - 240) / 4))
  }

  return clampScore(60 - Math.round((charsPerMinute - 320) / 8))
}

function scoreClarity({
  averageSentenceLength,
  fillerCount,
  pauseHintCount,
  speechUnits
}: {
  averageSentenceLength: number
  fillerCount: number
  pauseHintCount: number
  speechUnits: number
}): number {
  let score = 76

  if (speechUnits < 24) {
    score -= 10
  }

  if (averageSentenceLength < 14) {
    score -= 10
  }

  if (averageSentenceLength > 58) {
    score -= 8
  }

  score -= Math.min(20, fillerCount * 4)
  score -= Math.min(12, pauseHintCount * 2)

  return clampScore(score)
}

function scoreStructure(text: string): number {
  const hitCount = structurePatterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0)
  let score = 58 + hitCount * 14

  if (text.length > 180) {
    score += 8
  }

  if (text.length > 320) {
    score += 4
  }

  if (!/背景|目标|行动|结果|复盘|首先|其次|最后|第一|第二/.test(text)) {
    score -= 12
  }

  return clampScore(score)
}

function scoreConfidence({
  speechUnits,
  durationSec,
  fillerCount,
  finalTranscriptCount
}: {
  speechUnits: number
  durationSec: number
  fillerCount: number
  finalTranscriptCount: number
}): number {
  let score = 62

  if (speechUnits > 80) {
    score += 10
  }

  if (durationSec >= 45) {
    score += 8
  }

  score -= Math.min(16, fillerCount * 3)
  score -= Math.min(8, Math.max(0, finalTranscriptCount - 1) * 2)

  return clampScore(score)
}

function buildNotes({
  charsPerMinute,
  durationSec,
  fillerCount,
  pauseHintCount,
  averageSentenceLength,
  estimatedDuration,
  finalTranscriptCount,
  pace,
  clarity,
  structure
}: {
  charsPerMinute: number
  durationSec: number
  fillerCount: number
  pauseHintCount: number
  averageSentenceLength: number
  estimatedDuration: boolean
  finalTranscriptCount: number
  pace: number
  clarity: number
  structure: number
}): string[] {
  const notes: string[] = []

  if (estimatedDuration) {
    notes.push('当前时长是估算值，开启语音作答后会更准。')
  }

  if (charsPerMinute < 100) {
    notes.push('语速偏慢，试着把停顿收紧一点。')
  } else if (charsPerMinute > 300) {
    notes.push('语速偏快，留一点停顿给面试官消化。')
  } else {
    notes.push('语速基本在可接受区间。')
  }

  if (fillerCount >= 4) {
    notes.push('口头禅偏多，建议把“嗯、就是、然后”换成直接结论。')
  } else if (fillerCount > 0) {
    notes.push('有少量口头禅，继续压一压会更稳。')
  } else {
    notes.push('口头禅控制得不错。')
  }

  if (pauseHintCount >= 3) {
    notes.push('断句偏多，建议按“背景-行动-结果”分段回答。')
  } else if (pauseHintCount === 0 && durationSec > 30) {
    notes.push('没有明显停顿提示，回答连贯度不错。')
  }

  if (averageSentenceLength < 12) {
    notes.push('句子偏碎，适合先说结论再展开。')
  } else if (averageSentenceLength > 60) {
    notes.push('单句偏长，建议主动分成几段。')
  }

  if (finalTranscriptCount >= 4) {
    notes.push('转写分段较多，说明你在回答中停顿了几次。')
  }

  if (pace < 60) {
    notes.push('语速分偏低，重点先练“说完整”和“少卡顿”。')
  }

  if (clarity < 60) {
    notes.push('清晰度还可以再提，尽量让每段话只表达一个意思。')
  }

  if (structure < 60) {
    notes.push('结构感偏弱，下轮优先练“背景-动作-结果-复盘”。')
  }

  return notes.slice(0, 6)
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}
