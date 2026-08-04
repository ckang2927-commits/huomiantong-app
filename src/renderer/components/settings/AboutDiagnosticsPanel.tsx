import { ClipboardList, FolderOpen, Info, ShieldCheck } from 'lucide-react'
import { startNewUserOnboarding } from '../NewUserOnboarding'

export function AboutDiagnosticsPanel(): JSX.Element {
  return (
    <div className="panel settings-panel about-diagnostics-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">About & Diagnostics</span>
          <h3>关于与诊断</h3>
        </div>
        <button className="ghost-button compact" type="button" onClick={startNewUserOnboarding}>
          新手引导
        </button>
      </div>

      <div className="about-section">
        <div className="about-icon-row">
          <Info size={18} />
          <div>
            <strong>版本信息</strong>
            <p>获面通 v0.1.4</p>
            <span className="about-note">当前版本已补齐漫游式新手引导、更新日志和面试台精准跳转。</span>
          </div>
        </div>

        <div className="about-icon-row">
          <FolderOpen size={18} />
          <div>
            <strong>数据存储位置</strong>
            <p>所有数据存储在本地计算机，路径为：</p>
            <code className="about-path">%APPDATA%/huomiantong/</code>
            <span className="about-note">包含设置、会话记录、训练成绩和用量数据。建议定期导出备份。</span>
          </div>
        </div>

        <div className="about-icon-row">
          <ShieldCheck size={18} />
          <div>
            <strong>作战室入口说明</strong>
            <p>
              作战室（面试前体检）在左侧导航栏的盾牌图标进入。它可以一键检查候选人简历、回答模型、
              Deepgram 语音、麦克风/电脑音频和悬浮窗是否就绪，避免面试中途发现问题。
            </p>
          </div>
        </div>

        <div className="about-icon-row">
          <ClipboardList size={18} />
          <div>
            <strong>错误日志说明</strong>
            <p>
              诊断日志位于作战室下方，会自动记录 API 服务商测试失败、Deepgram 连接异常、
              麦克风/电脑音频问题。每条日志都会给出中文原因说明和解决建议。
            </p>
            <span className="about-note">
              遇到错误弹窗时，点击“查看详情”可直接跳转到诊断日志区域。
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
