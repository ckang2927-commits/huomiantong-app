export type TranscriptFilterResult = {
  accepted: boolean
  text: string
  reason?: string
}

const fillerPattern = /^(嗯+|啊+|哦+|哎+|呃+|额+|行+|好+|可以+|对+|是+|ok+|okay+|hello+|hi+)$/i
const audioCheckPattern = /(听得到|听得见|听不到|听不见|听不清|有声音吗|没声音|麦克风|耳机|外放|收音|系统声音|电脑音频)/i
const waitingOrLagPattern = /(稍等一下|等我一下|让我想想|我想一下|我看一下|我确认一下|卡住了|有点慢|反应慢|稍微等一下|等一会)/i
const interviewCuePattern = /(介绍|项目|经历|经验|为什么|怎么|如何|哪里|哪儿|在哪|什么时候|多久|多少|第几|优缺点|亮点|指标|模型|sql|python|excel|bi|roi|roas|acos|rfm|a\/b|转化|复盘|数据分析|业务|离职|薪资|公司|团队|岗位|技术栈|挑战|结果|贡献)/i

export function filterWorkspaceTranscript(text: string): TranscriptFilterResult {
  const normalized = normalizeTranscriptText(text)

  if (!normalized) {
    return {
      accepted: false,
      text: '',
      reason: '空文本'
    }
  }

  const compact = compactTranscriptText(normalized)

  if (fillerPattern.test(compact)) {
    return {
      accepted: false,
      text: normalized,
      reason: '语气词'
    }
  }

  if (audioCheckPattern.test(compact)) {
    return {
      accepted: false,
      text: normalized,
      reason: '音频测试'
    }
  }

  if (waitingOrLagPattern.test(compact) && !interviewCuePattern.test(compact)) {
    return {
      accepted: false,
      text: normalized,
      reason: '等待沟通'
    }
  }

  if (visibleLength(compact) <= 4 && !interviewCuePattern.test(compact)) {
    return {
      accepted: false,
      text: normalized,
      reason: '太短'
    }
  }

  return {
    accepted: true,
    text: normalized
  }
}

function normalizeTranscriptText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[，。！？、；;:,\s]+|[，。！？、；;:,\s]+$/g, '')
    .trim()
}

function compactTranscriptText(text: string): string {
  return text
    .replace(/\s+/g, '')
    .replace(/[，。！？、；;:,.]/g, '')
    .trim()
}

function visibleLength(text: string): number {
  return Array.from(text).length
}
