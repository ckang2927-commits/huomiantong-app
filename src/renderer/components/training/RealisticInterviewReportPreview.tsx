import { BarChart3, CheckCircle2, AlertTriangle, Target, Lightbulb, FileText } from 'lucide-react'

/**
 * RealisticInterviewReportPreview
 *
 * 静态报告模板预览卡片，展示拟真面试结束后生成的详细报告样式。
 * 当前使用演示数据，不接入真实 AI 生成逻辑。
 * 后续由 Codex 接入真实评分、薄弱点分析和训练建议生成。
 */
export function RealisticInterviewReportPreview(): JSX.Element {
  return (
    <section className="mock-report-preview-panel">
      <div className="training-section-title">
        <div>
          <span className="eyebrow">Report Preview</span>
          <h3>拟真面试报告模板</h3>
        </div>
        <span className="status-pill idle">静态预览，尚未接入真实 AI 生成</span>
      </div>

      <p className="mock-report-intro">
        完成拟真面试后，系统会生成一份详细报告，涵盖每题评分、薄弱点、风险点和推荐训练方向。
        以下是报告模板样式预览：
      </p>

      {/* 总分与整体评价 */}
      <div className="mock-report-section">
        <div className="mock-report-section-header">
          <BarChart3 size={18} />
          <span>总分与整体评价</span>
        </div>
        <div className="mock-report-score-row">
          <div className="mock-report-score-card highlight">
            <strong>综合评分</strong>
            <span className="mock-report-big-score">78</span>
            <span className="mock-report-score-label">/ 100</span>
            <p>良好，具备较强竞争力</p>
          </div>
          <div className="mock-report-score-card">
            <strong>技术深度</strong>
            <span className="mock-report-big-score">82</span>
            <span className="mock-report-score-label">/ 100</span>
          </div>
          <div className="mock-report-score-card">
            <strong>表达沟通</strong>
            <span className="mock-report-big-score">75</span>
            <span className="mock-report-score-label">/ 100</span>
          </div>
          <div className="mock-report-score-card">
            <strong>简历证据</strong>
            <span className="mock-report-big-score">70</span>
            <span className="mock-report-score-label">/ 100</span>
          </div>
        </div>
      </div>

      {/* 每题评分 */}
      <div className="mock-report-section">
        <div className="mock-report-section-header">
          <FileText size={18} />
          <span>每题评分</span>
        </div>
        <div className="mock-report-question-list">
          {demoQuestions.map((q, i) => (
            <div className="mock-report-question-item" key={i}>
              <div className="mock-report-q-top">
                <strong>第 {i + 1} 题</strong>
                <span className={'mock-report-q-score' + (q.score >= 80 ? ' high' : q.score >= 60 ? ' mid' : ' low')}>
                  {q.score}/100
                </span>
              </div>
              <p className="mock-report-q-text">{q.question}</p>
              <div className="mock-report-q-tags">
                {q.tags.map((tag) => (
                  <span key={tag} className="mock-report-tag">{tag}</span>
                ))}
              </div>
              <p className="mock-report-q-feedback">{q.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 薄弱点 */}
      <div className="mock-report-section">
        <div className="mock-report-section-header">
          <AlertTriangle size={18} />
          <span>薄弱点与提升方向</span>
        </div>
        <ul className="mock-report-weakness-list">
          <li>
            <strong>数据量化不足</strong>
            <span>多个回答缺少具体数字和指标支撑，建议补充 KPI、规模、提升幅度等量化信息</span>
          </li>
          <li>
            <strong>项目角色描述模糊</strong>
            <span>部分项目未能清晰说明个人职责和贡献，建议使用 STAR 原则重新组织</span>
          </li>
          <li>
            <strong>简历证据引用偏少</strong>
            <span>仅 60% 的回答主动引用了简历中的项目经验，建议提高引用率</span>
          </li>
        </ul>
      </div>

      {/* 编造风险 */}
      <div className="mock-report-section">
        <div className="mock-report-section-header">
          <CheckCircle2 size={18} />
          <span>可能编造风险</span>
        </div>
        <div className="mock-report-risk-list">
          <div className="mock-report-risk-item">
            <span className="mock-report-risk-tag risk-medium">中风险</span>
            <span>第 3 题提到的"日活提升 300%"缺乏简历数据支撑</span>
          </div>
          <div className="mock-report-risk-item">
            <span className="mock-report-risk-tag risk-low">低风险</span>
            <span>第 5 题关于团队规模的描述与简历不完全一致</span>
          </div>
        </div>
      </div>

      {/* 推荐训练 */}
      <div className="mock-report-section">
        <div className="mock-report-section-header">
          <Target size={18} />
          <span>推荐补练方向</span>
        </div>
        <div className="mock-report-train-list">
          <div className="mock-report-train-item">
            <Lightbulb size={16} />
            <div>
              <strong>数据量化专项训练</strong>
              <p>重点练习如何用数字描述项目成果，建议准备 5 个可量化的项目案例</p>
            </div>
          </div>
          <div className="mock-report-train-item">
            <Lightbulb size={16} />
            <div>
              <strong>STAR 表达训练</strong>
              <p>使用 STAR 原则重组项目经验，确保每个项目都能清晰表达背景、任务、行动和结果</p>
            </div>
          </div>
          <div className="mock-report-train-item">
            <Lightbulb size={16} />
            <div>
              <strong>简历证据主动引用训练</strong>
              <p>练习在回答中自然引述简历中的项目经历，提高回答可信度</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mock-report-footer-note">
        以上为报告模板样式预览，真实报告数据将在后续版本中由 AI 评分系统生成。
        当前展示数据为演示示例，不反映实际面试表现。
      </p>
    </section>
  )
}

const demoQuestions = [
  {
    question: '请介绍一下你在上一家公司负责的核心项目，以及你在其中的具体角色。',
    score: 82,
    tags: ['项目经验', '角色描述'],
    feedback: '项目描述清晰，但个人贡献部分可以更具体。建议补充你主导的技术决策和量化成果。'
  },
  {
    question: '你们团队当时为什么要选择这种技术方案？有没有考虑过其他替代方案？',
    score: 75,
    tags: ['技术选型', '决策能力'],
    feedback: '提到了选型理由，但对替代方案的分析不够深入。建议准备 1-2 个对比方案。'
  },
  {
    question: '这个项目最终取得了什么成果？你是怎么衡量成功的？',
    score: 65,
    tags: ['量化成果', 'KPI'],
    feedback: '成果描述偏定性，缺少具体数据指标。建议补充用户量、性能提升、收入影响等量化信息。'
  },
  {
    question: '如果让你重新做这个项目，你会怎么改进？',
    score: 80,
    tags: ['复盘能力', '改进思路'],
    feedback: '复盘思路清晰，提到了架构和流程两方面的改进方向，体现了一定的技术视野。'
  },
  {
    question: '你带过团队吗？在协作中遇到过什么挑战？',
    score: 70,
    tags: ['团队协作', '管理经验'],
    feedback: '描述了协作场景，但对冲突解决和推动决策的过程可以展开更多细节。'
  }
]
