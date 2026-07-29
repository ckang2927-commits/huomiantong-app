import { AlertTriangle, Coins, DollarSign, Info, PiggyBank, TrendingUp } from 'lucide-react'

const BUDGET_EXPLAINER_SECTIONS = [
  {
    icon: Coins,
    title: '什么是 Token？',
    desc: 'Token 是 AI 模型计费的最小单位，可以粗略理解为模型处理文字的数量。每次回答消耗多少，取决于问题、简历、JD、历史上下文和答案长度。',
  },
  {
    icon: DollarSign,
    title: '金额预算怎么用？',
    desc: '在各提供商设置卡片中可分别设置金额预算上限。软件会按内置估算价计算累计花费，达到预算后停用对应模型，帮助你控制大概支出。',
  },
  {
    icon: PiggyBank,
    title: '省钱技巧',
    desc: '日常训练和面试优先用 fast/flash 类模型，复杂问题或重要面试再切到 pro/max/高级模型。同一模型下，短答通常比 STAR 详细回答更省 Token。',
  },
  {
    icon: TrendingUp,
    title: '费用参考怎么看？',
    desc: '软件内费用只做预算估算，不代表服务商实时账单。不同模型、汇率、缓存、优惠和免费额度都会影响最终价格，实际扣费请以各厂商官网和账单为准。',
  },
  {
    icon: AlertTriangle,
    title: '剩余额度在哪看？',
    desc: '在各提供商设置卡片下方可以看到当前模型 Token、估算花费和剩余预算。真正的账户余额仍然要去服务商后台查看。',
  },
  {
    icon: Info,
    title: 'Deepgram 语音计费',
    desc: 'Deepgram 通常按音频时长计费，免费额度和分钟单价会随账户政策变化。建议在 Deepgram 后台查看余额、账单和额度有效期。',
  },
]

export function BudgetExplainerPanel(): JSX.Element {
  return (
    <div className="panel settings-panel budget-explainer-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Budget & Cost Guide</span>
          <h3>用量预算说明</h3>
        </div>
      </div>
      <div className="budget-explainer-list">
        {BUDGET_EXPLAINER_SECTIONS.map((section) => (
          <div className="budget-explainer-card" key={section.title}>
            <div className="budget-explainer-card-header">
              <section.icon size={18} />
              <strong>{section.title}</strong>
            </div>
            <p className="budget-explainer-card-desc">{section.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
