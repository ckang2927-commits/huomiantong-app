import { useMemo, useState } from 'react'
import { AlertTriangle, Bot, FileText, Globe2, Info, Save, Sparkles } from 'lucide-react'
import { syncResumeProfile } from '../../lib/resumeProfileHelpers'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useUIStore } from '../../stores/useUIStore'
import type {
  AppSettings,
  BackgroundPrepGenerateResult,
  BackgroundPrepInput,
  BackgroundPrepPackageType,
  BackgroundPublicSource,
  ResumeAttachment,
  ResumeFileMeta
} from '../../../shared/types'

const PACKAGE_LABELS: Record<BackgroundPrepPackageType, string> = {
  hr: 'HR 基础补充',
  salary: '薪资谈判补充',
  company: '公司背景补充',
  work: '工作细节补充',
  onboard: '入职后勤补充',
  risk: '风险回答补充'
}

const PACKAGE_HINTS: Record<BackgroundPrepPackageType, string> = {
  hr: '住址、通勤、学历、离职原因、空窗期、稳定性',
  salary: '期望薪资、上家薪资、涨幅理由、底线、谈薪话术',
  company: '公司公开信息、岗位理解、主营业务、行业位置',
  work: '部门职责、汇报对象、协作方式、日常工作细节',
  onboard: '入职后的业务名词、会议节奏、报表口径、学习计划',
  risk: '容易被追问的点、不要说死的内容、安全口径'
}

type LocalField = { title: string; detail: string }

const LOCAL_FIELDS: Record<BackgroundPrepPackageType, LocalField[]> = {
  hr: [
    { title: '现住址 / 通勤', detail: '按真实情况填写城市、区县、通勤方式和大概时间。' },
    { title: '学历 / 家庭 / 空窗', detail: '简历里没有就自己补，避免面试时现编。' },
    { title: '离职原因', detail: '先写真实版本，再让 AI 帮你整理成更自然的说法。' }
  ],
  salary: [
    { title: '期望薪资', detail: '填写目标区间、底线和可接受的谈薪方式。' },
    { title: '上家薪资', detail: '保留薪资结构，避免只写一个孤零零的数字。' },
    { title: '涨幅理由', detail: '写清楚你为什么值这个价。' }
  ],
  company: [
    { title: '公司信息', detail: '公司名、主营业务、行业位置、公开地址。' },
    { title: '岗位理解', detail: '你理解这个岗位的核心职责是什么。' },
    { title: '公开资料', detail: '招聘页、官网、公开报道里能确认的内容。' }
  ],
  work: [
    { title: '部门职责', detail: '你在哪个小组、做什么方向、和谁协作。' },
    { title: '项目流程', detail: '从需求、取数、分析到汇报的真实流程。' },
    { title: '日常协作', detail: '报表、会议、同步方式、汇报对象。' }
  ],
  onboard: [
    { title: '入职 30 天', detail: '准备先学什么、找谁确认、怎么交付。' },
    { title: '业务名词', detail: '把岗位里的黑话先记一轮。' },
    { title: '工作节奏', detail: '先适应什么节奏、怎么进入状态。' }
  ],
  risk: [
    { title: '容易被追问点', detail: '项目细节、数字、时间线、职责边界。' },
    { title: '不要说死', detail: '老板、同事、内部组织、未核实流程。' },
    { title: '安全口径', detail: '不会的内容就说“我会确认后再答”。' }
  ]
}

type SourceFlag = '简历依据' | '公开资料' | '用户确认' | 'AI模拟参考' | '待确认'

type RenderLine = {
  text: string
  flag: SourceFlag
}

type PreviewSection = {
  key: 'resume' | 'public' | 'confirmed' | 'ai'
  title: string
  hint: string
  items: string[]
  sources?: BackgroundPublicSource[]
  selectedCount?: number
  emptyText: string
}

type BackgroundPrepResultPreviewProps = {
  settings: AppSettings
}

export function BackgroundPrepResultPreview(): JSX.Element {
  const settings = useSettingsStore((state) => state.settings)
  const setSettings = useSettingsStore((state) => state.setSettings)
  const setSettingsStatus = useSettingsStore((state) => state.setSettingsStatus)
  const showToast = useUIStore((state) => state.showToast)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generated, setGenerated] = useState<BackgroundPrepGenerateResult | null>(null)
  const [selectedPublicSourceUrls, setSelectedPublicSourceUrls] = useState<string[]>([])
  const [input, setInput] = useState<BackgroundPrepInput>(() => ({
    packageType: 'hr',
    companyName: '',
    targetRole: settings.resume.targetRole || '',
    confirmedFacts: '',
    uncertainNotes: '',
    publicSources: []
  }))

  const packageLabel = PACKAGE_LABELS[input.packageType]
  const packageHint = PACKAGE_HINTS[input.packageType]
  const selectedPublicSources = useMemo(
    () => (input.publicSources ?? []).filter((source) => selectedPublicSourceUrls.includes(source.url)),
    [input.publicSources, selectedPublicSourceUrls]
  )
  const generationInput = useMemo(
    () => ({ ...input, publicSources: selectedPublicSources }),
    [input, selectedPublicSources]
  )
  const previewSections = useMemo(
    () => buildPreviewSections(settings, input, selectedPublicSources),
    [input, selectedPublicSources, settings]
  )
  const renderLines = useMemo(() => buildRenderLines(settings, generationInput), [generationInput, settings])
  const renderedContent = generated?.content || buildLocalBackgroundPrep(settings, generationInput)

  function updateInput(patch: Partial<BackgroundPrepInput>): void {
    setInput((current) => ({ ...current, ...patch }))
    setGenerated(null)
  }

  async function searchPublicInfo(): Promise<void> {
    if (isSearching) {
      return
    }

    setIsSearching(true)

    try {
      const result = await window.huomiantong.searchBackgroundPublicInfo({ input })
      const nextSources = result.sources
      setInput((current) => ({ ...current, publicSources: nextSources }))
      setSelectedPublicSourceUrls(nextSources.map((source) => source.url))
      setGenerated(null)
      showToast(nextSources.length ? `已找到 ${nextSources.length} 条公开资料。` : result.message || '没有找到公开资料。', nextSources.length ? 'success' : 'info')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '联网搜索失败', 'error')
    } finally {
      setIsSearching(false)
    }
  }

  function generateFromResume(): void {
    setGenerated({
      title: buildTitle(input.packageType, settings),
      content: buildLocalBackgroundPrep(settings, input),
      provider: 'local',
      latencyMs: 0
    })
    showToast('已按简历生成背景资料草稿。')
  }

  async function generateWithAi(): Promise<void> {
    if (isGenerating) {
      return
    }

    setIsGenerating(true)

    try {
      const result = await window.huomiantong.generateBackgroundPrep({ settings, input: generationInput })
      setGenerated(result)
      showToast(result.provider === 'local' ? 'AI 不可用，已回退到本地规则生成。' : 'AI 深度生成完成。')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'AI 深度生成失败', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  function togglePublicSource(url: string): void {
    setSelectedPublicSourceUrls((current) => (current.includes(url) ? current.filter((item) => item !== url) : [...current, url]))
    setGenerated(null)
  }

  function selectAllPublicSources(): void {
    setSelectedPublicSourceUrls((input.publicSources ?? []).map((source) => source.url))
    setGenerated(null)
  }

  function clearPublicSources(): void {
    setSelectedPublicSourceUrls([])
    setGenerated(null)
  }

  async function saveToOtherResume(): Promise<void> {
    if (!generated?.content) {
      showToast('先生成一版背景资料，再保存到其他简历。', 'info')
      return
    }

    if (isSaving) {
      return
    }

    const defaultTitle = generated.title || buildTitle(input.packageType, settings)
    const inputTitle = window.prompt('保存到其他简历的名称', defaultTitle)

    if (inputTitle === null) {
      return
    }

    const title = sanitizeFileStem((inputTitle.trim() || defaultTitle).replace(/\s+/g, '-'))
    const text = generated.content
    const now = Date.now()
    const file: ResumeFileMeta = {
      name: `${title}.md`,
      extension: 'md',
      size: new Blob([text]).size,
      addedAt: now,
      textLength: text.length
    }
    const attachment: ResumeAttachment = {
      id: crypto.randomUUID(),
      title,
      text,
      file,
      createdAt: now
    }
    const nextSettings = syncResumeProfile(settings, {
      ...settings.resume,
      otherResumes: [...(settings.resume.otherResumes ?? []), attachment]
    })

    setIsSaving(true)

    try {
      const saved = await window.huomiantong.saveSettings(nextSettings)
      setSettings(saved)
      setSettingsStatus('已保存')
      showToast('已保存到其他简历，后续回答和训练会参考这份资料。')
    } catch (error) {
      showToast(error instanceof Error ? `保存失败：${error.message}` : '保存失败：未知错误', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="panel settings-panel bg-prep-result-preview">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Background Prep Workbench</span>
          <h3>背景资料补全工作台</h3>
        </div>
      </div>

      <p className="bg-prep-intro">
        这里可以先按简历本地生成，再切到 AI 深度生成。资料会保留来源口径：简历依据、用户确认、AI 模拟参考、待确认。
      </p>

      <div className="bg-prep-workbench">
        <div className="bg-prep-left">
          <div className="bg-prep-card">
            <div className="bg-prep-card-head">
              <FileText size={16} />
              <strong>1. 基础填写</strong>
            </div>
            <div className="bg-prep-form">
              <label className="field-block">
                <span>资料包类型</span>
                <select value={input.packageType} onChange={(event) => updateInput({ packageType: event.target.value as BackgroundPrepPackageType })}>
                  {Object.entries(PACKAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-block">
                <span>公司名称</span>
                <input value={input.companyName} placeholder="例如：致欧家居科技" onChange={(event) => updateInput({ companyName: event.target.value })} />
              </label>
              <label className="field-block">
                <span>目标岗位</span>
                <input
                  value={input.targetRole}
                  placeholder="例如：数据分析师 / AI 产品经理"
                  onChange={(event) => updateInput({ targetRole: event.target.value })}
                />
              </label>
              <label className="field-block tall">
                <span>用户确认</span>
                <textarea
                  value={input.confirmedFacts}
                  placeholder="把你已经确认的信息写进来，比如住址、薪资、离职原因、公司信息等。"
                  onChange={(event) => updateInput({ confirmedFacts: event.target.value })}
                />
              </label>
              <label className="field-block tall">
                <span>AI 模拟参考 / 待确认</span>
                <textarea
                  value={input.uncertainNotes}
                  placeholder="这里写你想让 AI 帮你模拟补齐的部分，比如工作细节、入职后勤、风险回答等。"
                  onChange={(event) => updateInput({ uncertainNotes: event.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="bg-prep-card">
            <div className="bg-prep-card-head">
              <Bot size={16} />
              <strong>2. 可参考的字段方向</strong>
            </div>
            <div className="bg-prep-local-fields">
              {LOCAL_FIELDS[input.packageType].map((item) => (
                <article key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="bg-prep-actions">
            <button className="ghost-button" type="button" onClick={() => void searchPublicInfo()} disabled={isSearching || isGenerating}>
              <Globe2 size={15} />
              {isSearching ? '搜索中...' : '联网搜索公开资料'}
            </button>
            <button className="ghost-button" type="button" onClick={generateFromResume} disabled={isGenerating}>
              <Sparkles size={15} />
              按简历生成
            </button>
            <button className="primary-button" type="button" onClick={() => void generateWithAi()} disabled={isGenerating}>
              <Bot size={15} />
              {isGenerating ? 'AI 生成中...' : 'AI 深度生成'}
            </button>
          </div>
        </div>

        <div className="bg-prep-right">
          <div className="bg-prep-card bg-prep-summary-card">
            <div className="bg-prep-card-head">
              <Save size={16} />
              <strong>3. 结果预览</strong>
            </div>
            <p className="bg-prep-meta">
              当前包：{packageLabel} · {input.companyName || '未填写公司'} · {input.targetRole || '未填写岗位'}
            </p>
            <p className="bg-prep-meta">{packageHint}</p>
            <div className="bg-prep-meta-tags">
              {renderLines.map((item, index) => (
                <span key={`${item.text}-${index}`} className={`bg-prep-tag bg-prep-tag-${flagColor(item.flag)}`}>
                  {item.flag}
                </span>
              ))}
            </div>
            <div className="bg-prep-preview-grid">
              {previewSections.map((section) => (
                <article key={section.key} className="bg-prep-preview-section">
                  <div className="bg-prep-preview-section-head">
                    <div>
                      <strong>{section.title}</strong>
                      <p>{section.hint}</p>
                    </div>
                    <span>{section.key === 'public' ? `${section.selectedCount ?? 0}/${section.sources?.length ?? 0}` : `${section.items.length || 0}`} 条</span>
                  </div>
                  <div className="bg-prep-preview-section-body">
                    {section.key === 'public' ? (
                      section.sources?.length ? (
                        <>
                          <div className="bg-prep-public-source-toolbar">
                            <span>
                              已选 {selectedPublicSources.length} / {input.publicSources?.length ?? 0} 条公开资料进入生成内容
                            </span>
                            <div>
                              <button className="text-button" type="button" onClick={selectAllPublicSources}>
                                全选
                              </button>
                              <button className="text-button" type="button" onClick={clearPublicSources}>
                                清空
                              </button>
                            </div>
                          </div>
                          <div className="bg-prep-public-source-list">
                            {section.sources.map((source) => (
                              <label className={`bg-prep-public-source-card ${selectedPublicSourceUrls.includes(source.url) ? 'is-selected' : ''}`} key={source.url}>
                                <input type="checkbox" checked={selectedPublicSourceUrls.includes(source.url)} onChange={() => togglePublicSource(source.url)} />
                                <article>
                                  <strong>{source.title}</strong>
                                  <span>{source.source}</span>
                                  <p>{source.snippet || '暂无摘要，请打开来源自行核实。'}</p>
                                  <a href={source.url} target="_blank" rel="noreferrer">
                                    打开来源
                                  </a>
                                </article>
                              </label>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="bg-prep-preview-empty">{section.emptyText}</p>
                      )
                    ) : section.items.length ? (
                      <ul className="bg-prep-preview-list">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="bg-prep-preview-empty">{section.emptyText}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="bg-prep-card bg-prep-output-card">
            <div className="bg-prep-card-head">
              <Save size={16} />
              <strong>4. 结果正文与保存</strong>
            </div>
            <textarea className="bg-prep-output" value={renderedContent} onChange={(event) => setGenerated((current) => (current ? { ...current, content: event.target.value } : current))} />
            <div className="bg-prep-actions">
              <button className="primary-button" type="button" onClick={() => void saveToOtherResume()} disabled={isSaving}>
                <Save size={15} />
                {isSaving ? '正在保存...' : '保存到其他简历'}
              </button>
            </div>
            <p className="bg-prep-placeholder-note">
              保存后会进入当前候选人的“其他简历”，后续回答和训练会参考这份资料。
            </p>
          </div>

          <div className="bg-prep-note">
            <Info size={14} />
            <span>规则：简历里有依据的内容优先；AI 模拟只能当准备思路；不确定的信息不要写死成事实。</span>
          </div>

          <div className="bg-prep-note warning">
            <AlertTriangle size={14} />
            <span>老板名字、同事是谁、内部小组、真实运作方式这类内容不能硬编成事实。</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildLocalBackgroundPrep(settings: AppSettings, input: BackgroundPrepInput): string {
  const resume = settings.resume
  const title = buildTitle(input.packageType, settings)
  const resumeHints = extractResumeHints(settings, input)
  const packageAdvice = localPackageAdvice(input.packageType, input.targetRole || resume.targetRole)

  return [
    `# ${title}`,
    '',
    `候选人：${resume.profileName || resume.candidateName || '未命名候选人'}`,
    `公司：${input.companyName || '待填写'}`,
    `岗位：${input.targetRole || resume.targetRole || '待填写'}`,
    `生成时间：${new Date().toLocaleString('zh-CN')}`,
    '',
    '> 说明：本内容由本地规则按简历生成，不花 Token。AI 模拟参考只能当准备思路，不能当事实背诵。',
    '',
    '## 用户确认',
    input.confirmedFacts.trim() || '- 暂无用户确认信息，请先填写真实资料。',
    '',
    '## 公共资料来源',
    formatPublicSources(input.publicSources),
    '',
    '## 简历依据',
    resumeHints.length ? resumeHints.map((item) => `- ${item}`).join('\n') : '- 当前简历没有明显命中信息，建议先补充真实资料。',
    '',
    '## 需要准备的问答口径',
    packageAdvice.confirmed.map((item) => `- ${item}`).join('\n'),
    '',
    '## AI 模拟参考（低可信）',
    packageAdvice.simulated.map((item) => `- ${item}`).join('\n'),
    '',
    '## 待用户确认',
    [
      input.uncertainNotes.trim() ? `- ${input.uncertainNotes.trim()}` : '- 暂无。你可以在这里写希望 AI 帮你模拟补齐的内容。',
      '- 公司内部小组、同事姓名、老板/直属上级、真实运作方式等不能硬编成事实。',
      '- 如果只是为了练口径，可以保留为“AI 模拟参考”，不要保存成确定经历。'
    ].join('\n')
  ].join('\n')
}

function buildTitle(packageType: BackgroundPrepPackageType, settings: AppSettings): string {
  const candidateName = settings.resume.profileName || settings.resume.candidateName || '默认候选人'
  const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
  return `${PACKAGE_LABELS[packageType]}-${candidateName}-${date}`
}

function buildRenderLines(settings: AppSettings, input: BackgroundPrepInput): RenderLine[] {
  const lines: RenderLine[] = []

  if (input.confirmedFacts.trim()) {
    lines.push(...input.confirmedFacts.split('\n').filter(Boolean).slice(0, 8).map((text) => ({ text, flag: '用户确认' as const })))
  }

  extractResumeHints(settings, input).forEach((text) => lines.push({ text, flag: '简历依据' }))

  if (input.publicSources?.length) {
    input.publicSources.slice(0, 3).forEach((source) => {
      lines.push({ text: `${source.title} · ${source.source}`, flag: '公开资料' })
    })
  }

  if (input.uncertainNotes.trim()) {
    lines.push(...input.uncertainNotes.split('\n').filter(Boolean).slice(0, 8).map((text) => ({ text, flag: 'AI模拟参考' as const })))
  } else {
    lines.push({ text: '你可以在这里写希望 AI 帮你模拟的工作细节、入职后勤、风险回答。', flag: '待确认' })
  }

  return lines.slice(0, 12)
}

function buildPreviewSections(settings: AppSettings, input: BackgroundPrepInput, selectedPublicSources: BackgroundPublicSource[]): PreviewSection[] {
  const resumeHints = extractResumeHints(settings, input).slice(0, 6)
  const confirmed = input.confirmedFacts
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)
  const aiHints = input.uncertainNotes.trim()
    ? input.uncertainNotes
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6)
    : localPackageAdvice(input.packageType, input.targetRole || settings.resume.targetRole).simulated.slice(0, 6)

  return [
    {
      key: 'resume',
      title: '简历依据',
      hint: '从正式简历 / 万字简历 / 其他简历里命中的内容',
      items: resumeHints,
      emptyText: '当前没有命中的简历依据，建议先补充真实经历。'
    },
    {
      key: 'public',
      title: '公开资料',
      hint: '官网、招聘页、公开报道里可确认的内容',
      items: (input.publicSources ?? []).map((item) => `${item.title} · ${item.source}`),
      sources: input.publicSources ?? [],
      selectedCount: selectedPublicSources.length,
      emptyText: input.publicSources?.length
        ? '还没有勾选公开资料，勾选后才会进入生成内容。'
        : '还没有公开资料，先点“联网搜索公开资料”试试。'
    },
    {
      key: 'confirmed',
      title: '用户确认',
      hint: '你自己确认过、可以直接说的内容',
      items: confirmed,
      emptyText: '还没有填写用户确认内容。'
    },
    {
      key: 'ai',
      title: 'AI 模拟参考',
      hint: '只当练口径，不当事实背诵',
      items: aiHints,
      emptyText: '还没有 AI 模拟参考内容。'
    }
  ]
}

function extractResumeHints(settings: AppSettings, input: BackgroundPrepInput): string[] {
  const resume = settings.resume
  const text = `${resume.formalResume}\n${resume.detailedResume}\n${(resume.otherResumes ?? []).map((item) => item.text).join('\n')}`
  return extractResumeHintsText(text, input)
}

function extractResumeHintsText(text: string, input: BackgroundPrepInput): string[] {
  const keywords = [input.companyName, input.targetRole, '数据', '分析', '项目', '指标', '建模', 'SQL', 'Python']
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

function localPackageAdvice(type: BackgroundPrepPackageType, targetRole: string): { confirmed: string[]; simulated: string[] } {
  const role = targetRole || '目标岗位'

  if (type === 'salary') {
    return {
      confirmed: ['准备当前期望薪资、可接受底线、上家公司薪资结构和涨幅理由。', '回答时先讲市场匹配、岗位价值和过往结果，不要只报数字。'],
      simulated: [`如果对方压薪，可以从“${role} 岗位产出、经验匹配、入职后交付计划”三个角度稳住。`]
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

function formatPublicSources(sources?: BackgroundPublicSource[]): string {
  if (!sources?.length) {
    return '- 暂无公开搜索结果。你可以先点“联网搜索公开资料”。'
  }

  return sources
    .map((item, index) => `${index + 1}. ${item.title}\n   来源：${item.source}\n   链接：${item.url}\n   摘要：${item.snippet || '无摘要'}`)
    .join('\n')
}

function sanitizeFileStem(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '-').trim().replace(/\.+$/g, '') || 'background-prep'
}

function flagColor(flag: SourceFlag): string {
  if (flag === '简历依据') return 'green'
  if (flag === '公开资料') return 'purple'
  if (flag === '用户确认') return 'blue'
  if (flag === 'AI模拟参考') return 'orange'
  return 'red'
}
