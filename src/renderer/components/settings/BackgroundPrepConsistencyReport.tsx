import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react"

type ConflictItem = {
  field: string
  packageA: string
  packageB: string
  severity: "high" | "medium" | "low"
  suggestion: string
}

const SAMPLE_CONFLICTS: ConflictItem[] = [
  {
    field: "期望薪资",
    packageA: "薪资包：22-25K",
    packageB: "HR 包：未填写",
    severity: "medium",
    suggestion: "建议在 HR 包中补充期望薪资信息",
  },
  {
    field: "离职原因",
    packageA: "HR 包：业务调整",
    packageB: "简历：个人发展",
    severity: "high",
    suggestion: "两个说法不一致，面试时可能被追问。建议统一为：业务调整为主，个人发展为辅",
  },
  {
    field: "工作年限",
    packageA: "简历：4 年",
    packageB: "HR 包：3.5 年",
    severity: "high",
    suggestion: "建议统一口径。如果用 3.5 年，可补充半年实习经历",
  },
  {
    field: "上家薪资",
    packageA: "薪资包：18K/月",
    packageB: "薪资包：25 万/年",
    severity: "low",
    suggestion: "两个数据可以对应上（18K×14 薪≈25 万），建议注明薪资结构",
  },
]

export function BackgroundPrepConsistencyReport(): JSX.Element {
  return (
    <div className="panel settings-panel bg-prep-consistency-report">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Consistency Check</span>
          <h3>一致性检查报告</h3>
        </div>
      </div>
      <p className="bg-prep-intro">
        检测跨资料包中的字段冲突。发现冲突后建议统一口径，避免面试时被问出矛盾。
      </p>

      <div className="bg-prep-conflict-list">
        {SAMPLE_CONFLICTS.map((conflict) => (
          <div className={`bg-prep-conflict-card bg-prep-conflict-${conflict.severity}`} key={conflict.field}>
            <div className="bg-prep-conflict-header">
              {conflict.severity === "high" ? (
                <AlertTriangle size={16} />
              ) : conflict.severity === "medium" ? (
                <HelpCircle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              <strong>{conflict.field}</strong>
              <span className={`bg-prep-conflict-badge bg-prep-conflict-badge-${conflict.severity}`}>
                {conflict.severity === "high" ? "高" : conflict.severity === "medium" ? "中" : "低"}
              </span>
            </div>
            <div className="bg-prep-conflict-detail">
              <p><b>包 A：</b>{conflict.packageA}</p>
              <p><b>包 B：</b>{conflict.packageB}</p>
              <p className="bg-prep-conflict-suggestion"><b>建议：</b>{conflict.suggestion}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-prep-note">
        <AlertTriangle size={14} />
        <span>
          一致性检查为静态示例，实际检测需要接入本地规则或 AI 审查（由 Codex 后续实现）。
        </span>
      </div>
    </div>
  )
}
