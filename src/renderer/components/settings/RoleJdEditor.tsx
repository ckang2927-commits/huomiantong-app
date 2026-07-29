import { Loader2, Sparkles, RotateCcw } from 'lucide-react'
import { defaultRoleJdTemplates } from '../../../shared/roleJdTemplates'
import { generateRoleJdFromResume } from '../../lib/roleJdGenerator'
import type { AppSettings, InterviewMode } from '../../../shared/types'
import { ResumeJdMatchPanel } from './ResumeJdMatchPanel'

type RoleJdEditorProps = {
  settings: AppSettings
  generatingRoleJdMode: InterviewMode | null
  onGenerateRoleJdWithAi: (mode: InterviewMode) => void | Promise<void>
  onUpdateAnswer: (patch: Partial<AppSettings['answer']>) => void
}

export function RoleJdEditor({ settings, generatingRoleJdMode, onGenerateRoleJdWithAi, onUpdateAnswer }: RoleJdEditorProps): JSX.Element {
  const selectedMode = settings.answer.interviewMode
  const selectedTemplate = settings.answer.roleJdTemplates[selectedMode]
  const isGeneratingWithAi = generatingRoleJdMode === selectedMode

  function updateSelectedTemplate(value: string): void {
    onUpdateAnswer({
      roleJdTemplates: {
        ...settings.answer.roleJdTemplates,
        [selectedMode]: value
      }
    })
  }

  function resetSelectedTemplate(): void {
    updateSelectedTemplate(defaultRoleJdTemplates[selectedMode])
  }

  function generateFromCurrentResume(): void {
    updateSelectedTemplate(generateRoleJdFromResume(selectedMode, settings.resume))
  }

  return (
    <div className="role-jd-editor">
      <div className="role-jd-editor-heading">
        <div>
          <strong>当前岗位 JD / 招聘要求</strong>
          <span>会跟简历依据一起喂给 AI，用来让回答更贴目标岗位。</span>
        </div>
        <div className="button-row">
          <button className="ghost-button compact" type="button" onClick={() => onGenerateRoleJdWithAi(selectedMode)} disabled={Boolean(generatingRoleJdMode)}>
            {isGeneratingWithAi ? <Loader2 className="spin" size={14} /> : <Sparkles size={14} />}AI 深度生成
          </button>
          <button className="ghost-button compact" type="button" onClick={generateFromCurrentResume}>
            <Sparkles size={14} />按简历生成
          </button>
          <button className="ghost-button compact" type="button" onClick={resetSelectedTemplate}>
            <RotateCcw size={14} />恢复默认
          </button>
        </div>
      </div>
      <textarea
        value={selectedTemplate}
        onChange={(event) => updateSelectedTemplate(event.target.value)}
        placeholder="把目标公司的 JD、招聘要求、能力关键词粘到这里..."
        rows={7}
      />
      <ResumeJdMatchPanel jd={selectedTemplate} resume={settings.resume} />
      <p>小技巧：`按简历生成` 不花 Token；`AI 深度生成` 会调用当前回答模型，质量更好但会产生少量用量。改过 API Key、模型或 JD 后，请先点右上角“保存设置”，不然可能调用不到最新模型配置。</p>
    </div>
  )
}
