import { Copy, Loader2, Pencil, PlayCircle, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { modeOptions } from '../../lib/appHelpers'
import { trainingModeLabels, trainingPresetOptions } from '../../../shared/trainingOptions'
import type { TrainingMode, TrainingPreset, TrainingQuestionCount } from '../../../shared/types'

const questionCountOptions: TrainingQuestionCount[] = [10, 15, 20]

type TrainingPresetDraft = Omit<TrainingPreset, 'id' | 'isCustom' | 'updatedAt'> & {
  id?: string
  focusText: string
  questionOutlineText: string
}

type TrainingPresetPanelProps = {
  customPresets: TrainingPreset[]
  isGeneratingTraining: boolean
  hasActiveTraining: boolean
  onSaveCustomPresets: (presets: TrainingPreset[]) => void | Promise<void>
  onStartTrainingPreset: (preset: TrainingPreset) => void | Promise<void>
}

export function TrainingPresetPanel({
  customPresets,
  isGeneratingTraining,
  hasActiveTraining,
  onSaveCustomPresets,
  onStartTrainingPreset
}: TrainingPresetPanelProps): JSX.Element {
  const [editingPreset, setEditingPreset] = useState<TrainingPresetDraft | null>(null)
  const [isSavingPreset, setIsSavingPreset] = useState(false)
  const mergedPresets = useMemo(
    () => [
      ...trainingPresetOptions,
      ...customPresets.map((preset) => ({
        ...preset,
        isCustom: true
      }))
    ],
    [customPresets]
  )

  async function saveEditingPreset(): Promise<void> {
    if (!editingPreset) {
      return
    }

    const label = editingPreset.label.trim()

    if (!label) {
      window.alert('模板名称不能为空')
      return
    }

    const nextPreset: TrainingPreset = {
      id: editingPreset.id || `custom-training-${crypto.randomUUID()}`,
      label,
      roleLabel: editingPreset.roleLabel.trim() || '自定义岗位',
      hint: editingPreset.hint.trim() || '自定义训练模板',
      interviewMode: editingPreset.interviewMode,
      trainingMode: editingPreset.trainingMode,
      roundCount: editingPreset.roundCount,
      focus: editingPreset.focusText
        .split(/[，,、\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8),
      questionOutline: editingPreset.questionOutlineText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20),
      isCustom: true,
      updatedAt: Date.now()
    }
    const nextPresets = customPresets.some((preset) => preset.id === nextPreset.id)
      ? customPresets.map((preset) => (preset.id === nextPreset.id ? nextPreset : preset))
      : [...customPresets, nextPreset]

    setIsSavingPreset(true)

    try {
      await onSaveCustomPresets(nextPresets)
      setEditingPreset(null)
    } finally {
      setIsSavingPreset(false)
    }
  }

  async function deleteCustomPreset(preset: TrainingPreset): Promise<void> {
    if (!window.confirm(`确定删除“${preset.label}”这个自定义训练模板吗？`)) {
      return
    }

    await onSaveCustomPresets(customPresets.filter((item) => item.id !== preset.id))
  }

  return (
    <div className="training-preset-panel">
      <div className="training-section-title">
        <div>
          <span className="eyebrow">Preset Training Pack</span>
          <h3>训练模板预设</h3>
        </div>
        <button className="ghost-button compact" type="button" onClick={() => setEditingPreset(createPresetDraft())}>
          <Plus size={15} />
          新增模板
        </button>
      </div>

      {editingPreset && (
        <div className="training-preset-editor">
          <div className="training-preset-editor-title">
            <strong>{editingPreset.id ? '编辑自定义模板' : '新增自定义模板'}</strong>
            <button className="icon-button" type="button" onClick={() => setEditingPreset(null)} aria-label="关闭模板编辑">
              <X size={16} />
            </button>
          </div>
          <div className="training-preset-form">
            <label className="field-block">
              <span>模板名称</span>
              <input value={editingPreset.label} onChange={(event) => setEditingPreset({ ...editingPreset, label: event.target.value })} placeholder="例如：康超帅数据分析冲刺 15 题" />
            </label>
            <label className="field-block">
              <span>岗位标签</span>
              <input value={editingPreset.roleLabel} onChange={(event) => setEditingPreset({ ...editingPreset, roleLabel: event.target.value })} placeholder="例如：数据分析岗" />
            </label>
            <label className="field-block">
              <span>岗位 JD</span>
              <select value={editingPreset.interviewMode} onChange={(event) => setEditingPreset({ ...editingPreset, interviewMode: event.target.value as TrainingPreset['interviewMode'] })}>
                {modeOptions.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-block">
              <span>训练类型 <span className='field-hint'>(决定 AI 出题方向)</span></span>
              <select value={editingPreset.trainingMode} onChange={(event) => setEditingPreset({ ...editingPreset, trainingMode: event.target.value as TrainingMode })}>
                {(Object.keys(trainingModeLabels) as TrainingMode[]).map((mode) => (
                  <option key={mode} value={mode}>
                    {trainingModeLabels[mode].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-block">
              <span>问题数量</span>
              <select value={editingPreset.roundCount} onChange={(event) => setEditingPreset({ ...editingPreset, roundCount: Number(event.target.value) as TrainingQuestionCount })}>
                {questionCountOptions.map((count) => (
                  <option key={count} value={count}>
                    {count} 题
                  </option>
                ))}
              </select>
            </label>
            <label className="field-block">
              <span>训练重点 <span className='field-hint'>(让 AI 侧重这些方向出题)</span></span>
              <input value={editingPreset.focusText} onChange={(event) => setEditingPreset({ ...editingPreset, focusText: event.target.value })} placeholder="逗号分隔，例如 SQL, 建模, 指标体系" />
            </label>
            <label className="field-block training-preset-form-wide">
              <span>模板说明</span>
              <textarea value={editingPreset.hint} onChange={(event) => setEditingPreset({ ...editingPreset, hint: event.target.value })} placeholder="这个模板主要训练什么？" />
            </label>
            <label className="field-block training-preset-form-wide">
              <span>固定题纲</span>
              <textarea
                value={editingPreset.questionOutlineText}
                onChange={(event) => setEditingPreset({ ...editingPreset, questionOutlineText: event.target.value })}
                placeholder={'每行一题，前几行会优先固定追问。\n例如：\n请做 1 分钟自我介绍。\n讲一个最能体现岗位匹配的项目。\n如果结果被质疑，你怎么证明？'}
              />
            </label>
          </div>
          <div className="button-row">
            <button className="primary-button compact" type="button" onClick={saveEditingPreset} disabled={isSavingPreset}>
              {isSavingPreset ? <Loader2 className="spin" size={15} /> : null}
              保存模板
            </button>
            <button className="ghost-button compact" type="button" onClick={() => setEditingPreset(null)}>
              取消
            </button>
          </div>
        </div>
      )}

      <div className="training-preset-grid">
        {mergedPresets.map((preset) => (
          <article className={preset.isCustom ? 'training-preset-card custom' : 'training-preset-card'} key={preset.id}>
            <div className="training-preset-top">
              <strong>{preset.label}</strong>
              <span>{preset.isCustom ? '自定义' : `${preset.roundCount} 题`}</span>
            </div>
            <small>
              {preset.roleLabel} · {trainingModeLabels[preset.trainingMode].label} · {preset.roundCount} 题
            </small>
            <p>{preset.hint}</p>
            <div className="training-focus-tags">
              {preset.focus.map((item) => (
                <span key={item}>{item}</span>
              ))}
              {(preset.questionOutline?.length ?? 0) > 0 && <span>固定题纲 {preset.questionOutline?.length} 题</span>}
            </div>
            <div className="training-preset-actions">
              <button className="primary-button compact" type="button" onClick={() => onStartTrainingPreset(preset)} disabled={isGeneratingTraining || hasActiveTraining}>
                {isGeneratingTraining ? <Loader2 className="spin" size={15} /> : <PlayCircle size={15} />}
                套用并开始
              </button>
              {preset.isCustom ? (
                <>
                  <button className="ghost-button compact" type="button" onClick={() => setEditingPreset(presetToDraft(preset))}>
                    <Pencil size={15} />
                    编辑
                  </button>
                  <button className="ghost-button compact" type="button" onClick={() => deleteCustomPreset(preset)}>
                    <Trash2 size={15} />
                    删除
                  </button>
                </>
              ) : (
                <button className="ghost-button compact" type="button" onClick={() => setEditingPreset(presetToDraft(preset, true))}>
                  <Copy size={15} />
                  复制编辑
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function createPresetDraft(): TrainingPresetDraft {
  return {
    label: '',
    roleLabel: '',
    hint: '',
    interviewMode: 'dataAnalyst',
    trainingMode: 'comprehensive',
    roundCount: 15,
    focus: [],
    focusText: '',
    questionOutline: [],
    questionOutlineText: ''
  }
}

function presetToDraft(preset: TrainingPreset, copy = false): TrainingPresetDraft {
  return {
    id: copy ? undefined : preset.id,
    label: copy ? `${preset.label} 自定义版` : preset.label,
    roleLabel: preset.roleLabel,
    hint: preset.hint,
    interviewMode: preset.interviewMode,
    trainingMode: preset.trainingMode,
    roundCount: preset.roundCount,
    focus: preset.focus,
    focusText: preset.focus.join('，'),
    questionOutline: preset.questionOutline || [],
    questionOutlineText: (preset.questionOutline || []).join('\n')
  }
}





