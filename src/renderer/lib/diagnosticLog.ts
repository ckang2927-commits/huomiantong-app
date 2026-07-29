export type DiagnosticSeverity = 'info' | 'warn' | 'error' | 'success'

export type DiagnosticCategory = 'api' | 'model' | 'speech' | 'audio' | 'system' | 'backup' | 'resume' | 'training' | 'unknown'

export type DiagnosticLogEntry = {
  id: string
  at: number
  severity: DiagnosticSeverity
  category: DiagnosticCategory
  source: string
  title: string
  message: string
  reason: string
  action: string
  details?: string
}

export type DiagnosticLogInput = {
  severity?: DiagnosticSeverity
  category?: DiagnosticCategory
  source?: string
  title?: string
  message: string
  details?: string
}

const STORAGE_KEY = 'huomiantong.diagnosticLog.v1'
const EVENT_NAME = 'huomiantong-diagnostic-log-change'
const MAX_LOGS = 80

export function loadDiagnosticLogs(): DiagnosticLogEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    const logs = JSON.parse(raw) as DiagnosticLogEntry[]
    return Array.isArray(logs) ? logs.filter(isDiagnosticLogEntry) : []
  } catch {
    return []
  }
}

export function recordDiagnosticLog(input: DiagnosticLogInput): DiagnosticLogEntry {
  const explanation = explainDiagnostic(input.message, input.source, input.category)
  const entry: DiagnosticLogEntry = {
    id: crypto.randomUUID(),
    at: Date.now(),
    severity: input.severity || explanation.severity,
    category: input.category || explanation.category,
    source: input.source || explanation.source,
    title: input.title || explanation.title,
    message: input.message,
    reason: explanation.reason,
    action: explanation.action,
    details: input.details
  }
  const logs = [entry, ...loadDiagnosticLogs()].slice(0, MAX_LOGS)
  saveDiagnosticLogs(logs)

  return entry
}

export function clearDiagnosticLogs(): void {
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function subscribeDiagnosticLogs(callback: () => void): () => void {
  window.addEventListener(EVENT_NAME, callback)
  window.addEventListener('storage', callback)

  return () => {
    window.removeEventListener(EVENT_NAME, callback)
    window.removeEventListener('storage', callback)
  }
}

export function explainDiagnostic(message: string, source = '', category?: DiagnosticCategory): Omit<DiagnosticLogEntry, 'id' | 'at' | 'message' | 'details'> {
  const text = `${source} ${message}`.toLowerCase()
  const detectedCategory = category || detectCategory(text)
  const sourceLabel = source || defaultSource(detectedCategory)

  if (/402|payment required|余额|额度|quota|credits|billing/.test(text)) {
    return {
      severity: 'error',
      category: 'api',
      source: sourceLabel,
      title: '额度或付费状态异常',
      reason: '服务商返回 402，通常表示余额不足、赠送额度过期、账号未开通付费，或当前 Key 没有可用额度。',
      action: '去对应服务商控制台看余额/账单；如果是 Deepgram，就先检查 $200 额度是否还在；如果是模型服务商，就换一个有余额的 Key 后点“测试连接”。'
    }
  }

  if (/401|unauthorized|invalid api key|invalid x-api-key|authentication|鉴权|无效.*key|key.*无效/.test(text)) {
    return {
      severity: 'error',
      category: 'api',
      source: sourceLabel,
      title: 'API Key 鉴权失败',
      reason: '服务商拒绝了这个 Key，常见原因是 Key 填错、复制时多了空格、Key 被撤销，或填到了错误服务商。',
      action: '重新复制 Key，确认没有空格；DeepSeek/阿里/OpenAI/Anthropic 不要填混；保存设置后再点“测试连接”。'
    }
  }

  if (/429|rate limit|too many requests|限流|频率/.test(text)) {
    return {
      severity: 'warn',
      category: 'api',
      source: sourceLabel,
      title: '请求太频繁被限流',
      reason: '服务商短时间收到太多请求，或者账号套餐限制了并发/速率。',
      action: '等 30-60 秒再试；实时面试时建议关闭重复生成，或临时切换到另一个模型服务商。'
    }
  }

  if (/deepgram|websocket|语音转写|transcript|stt/.test(text)) {
    return {
      severity: 'error',
      category: 'speech',
      source: sourceLabel || 'Deepgram 语音',
      title: '语音转写连接异常',
      reason: '问题通常在 Deepgram Key、余额、网络连通性、VPN/代理，或者 WebSocket 被拦截。',
      action: '先到 API 设置测试 Deepgram；测试通过后再开麦克风；如果不开 VPN 不通，就换网络或开启代理。'
    }
  }

  if (/requested device not found|notfounderror|没有检测到麦克风|无法读取麦克风|麦克风.*失败|麦克风.*卡住|音频流|input device|device/.test(text)) {
    return {
      severity: 'error',
      category: 'audio',
      source: sourceLabel || '本机音频',
      title: '本机麦克风设备异常',
      reason: '系统没有返回可用麦克风，可能是默认输入设备不存在、设备被占用、驱动异常，或软件保存了一个已经失效的设备 ID。',
      action: '在 Windows 设置里选一个默认输入设备；回软件点“刷新/授权”；如果仍失败，把麦克风选择切回“系统默认麦克风”。'
    }
  }

  if (/notallowederror|securityerror|permission|权限|拒绝/.test(text)) {
    return {
      severity: 'error',
      category: 'audio',
      source: sourceLabel || '系统权限',
      title: '系统权限被拒绝',
      reason: 'Windows 或 Electron 没有给软件麦克风/屏幕采集权限。',
      action: '打开 Windows 隐私设置，允许桌面应用访问麦克风；重新打开获面通后再点“刷新/授权”。'
    }
  }

  if (/not supported|不支持|电脑音频|screen|window|desktop/.test(text)) {
    return {
      severity: 'warn',
      category: 'audio',
      source: sourceLabel || '电脑音频',
      title: '电脑音频采集不可用',
      reason: '当前 Electron/系统环境没有成功暴露屏幕或窗口音频采集能力。',
      action: '先点“刷新来源”，优先选择“整个屏幕”；如果还是不支持，暂时用麦克风转写或升级采集方案。'
    }
  }

  if (/base url|404|model|模型|endpoint|unexpected message|协议|responses|chat/.test(text)) {
    return {
      severity: 'error',
      category: 'model',
      source: sourceLabel,
      title: '模型地址或协议不匹配',
      reason: '模型名、Base URL 或接口协议可能不对应，比如把非 OpenAI 兼容接口当成 OpenAI 兼容接口调用。',
      action: '检查 Base URL 是否以服务商文档为准；确认模型名存在；保存后先点“测试连接”，再回面试台生成答案。'
    }
  }

  if (/network|fetch|timeout|超时|连接失败|failed to fetch|vpn|proxy/.test(text)) {
    return {
      severity: 'warn',
      category: detectedCategory,
      source: sourceLabel,
      title: '网络连接不稳定',
      reason: '请求没有及时连到服务商，可能是网络波动、代理/VPN、DNS 或服务商临时不可用。',
      action: '先点对应服务商“测试连接”；如果国内直连失败，试试 VPN/代理；如果只有某一家失败，可以临时切换模型。'
    }
  }

  return {
    severity: detectedCategory === 'unknown' ? 'info' : 'warn',
    category: detectedCategory,
    source: sourceLabel,
    title: '需要人工确认的异常',
    reason: '这条错误没有命中明确规则，但已经记录下来，方便我们对照时间和操作继续排查。',
    action: '看一下发生时间和来源；如果重复出现，把这条日志内容发给我，我再给它补成明确规则。'
  }
}

function saveDiagnosticLogs(logs: DiagnosticLogEntry[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

function detectCategory(text: string): DiagnosticCategory {
  if (/deepgram|语音|转写|stt|websocket/.test(text)) return 'speech'
  if (/麦克风|电脑音频|device|audio|screen|window|权限/.test(text)) return 'audio'
  if (/api|key|401|402|429|quota|billing|base url|endpoint/.test(text)) return 'api'
  if (/模型|model|llm|openai|deepseek|dashscope|anthropic/.test(text)) return 'model'
  if (/备份|导出|导入/.test(text)) return 'backup'
  if (/简历/.test(text)) return 'resume'
  if (/训练|模拟/.test(text)) return 'training'
  return 'unknown'
}

function defaultSource(category: DiagnosticCategory): string {
  const sources: Record<DiagnosticCategory, string> = {
    api: 'API 设置',
    model: '回答模型',
    speech: 'Deepgram 语音',
    audio: '本机音频',
    system: '系统',
    backup: '备份恢复',
    resume: '简历库',
    training: '模拟训练',
    unknown: '获面通'
  }

  return sources[category]
}

function isDiagnosticLogEntry(value: DiagnosticLogEntry): value is DiagnosticLogEntry {
  return Boolean(value && typeof value.id === 'string' && typeof value.at === 'number' && typeof value.message === 'string')
}
