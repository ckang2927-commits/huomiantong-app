import { UserCircle, DollarSign, Building2, Briefcase, Backpack, AlertTriangle, CheckSquare } from "lucide-react"

const PREP_PACKAGES = [
  {
    id: "hr",
    icon: UserCircle,
    title: "HR 基础信息包",
    desc: "住址、通勤、学历、离职原因、空窗期、稳定性",
    fields: 12,
    priority: "★★★★★",
  },
  {
    id: "salary",
    icon: DollarSign,
    title: "薪资谈判包",
    desc: "期望薪资、上家薪资、涨幅、底薪、福利、试用期",
    fields: 10,
    priority: "★★★★★",
  },
  {
    id: "company",
    icon: Building2,
    title: "公司背景包",
    desc: "主营业务、组织架构、岗位理解、行业竞品",
    fields: 10,
    priority: "★★★★☆",
  },
  {
    id: "work",
    icon: Briefcase,
    title: "工作细节包",
    desc: "部门、汇报关系、协作方式、数据分析工具链",
    fields: 9,
    priority: "★★★★☆",
  },
  {
    id: "onboard",
    icon: Backpack,
    title: "进公司后勤包",
    desc: "工位、设备、社保、公积金、合同、试用期考核",
    fields: 8,
    priority: "★★★☆☆",
  },
  {
    id: "risk",
    icon: AlertTriangle,
    title: "风险回答包",
    desc: "简历冲突点、解释口径、绕过思路",
    fields: 5,
    priority: "★★★★☆",
  },
  {
    id: "check",
    icon: CheckSquare,
    title: "一致性检查包",
    desc: "跨资料包字段冲突检测和标注",
    fields: 4,
    priority: "★★★☆☆",
  },
]

const SOURCE_TAGS = [
  { label: "正式简历", color: "green" },
  { label: "万字简历", color: "green" },
  { label: "其他简历", color: "green" },
  { label: "用户填写", color: "blue" },
  { label: "公开资料", color: "blue" },
  { label: "AI 模拟参考", color: "orange" },
  { label: "待确认", color: "red" },
]

const CREDIBILITY_LEVELS = [
  { level: "高", icon: "🟢", desc: "可直接使用" },
  { level: "中", icon: "🟡", desc: "建议复核后使用" },
  { level: "低", icon: "🟠", desc: "仅供准备思路" },
  { level: "待确认", icon: "🔴", desc: "不要在面试中说死" },
]

export function BackgroundPrepPreviewPanel(): JSX.Element {
  return (
    <div className="panel settings-panel bg-prep-preview-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Background Prep Center</span>
          <h3>背景资料补全中心</h3>
        </div>
      </div>
      <p className="bg-prep-intro">
        面试前补充简历上没有的 HR、薪资、公司、工作细节和入职信息。
        所有内容标注来源和可信度，AI 模拟内容仅供参考，正式面试前建议自行确认。
      </p>

      <div className="bg-prep-package-grid">
        {PREP_PACKAGES.map((pkg) => (
          <div className="bg-prep-package-card" key={pkg.id}>
            <div className="bg-prep-package-header">
              <pkg.icon size={18} />
              <strong>{pkg.title}</strong>
            </div>
            <p className="bg-prep-package-desc">{pkg.desc}</p>
            <div className="bg-prep-package-meta">
              <span className="bg-prep-package-fields">{pkg.fields} 个字段</span>
              <span className="bg-prep-package-priority">{pkg.priority}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-prep-source-section">
        <h4>来源标签</h4>
        <div className="bg-prep-tag-row">
          {SOURCE_TAGS.map((tag) => (
            <span className={`bg-prep-tag bg-prep-tag-${tag.color}`} key={tag.label}>
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-prep-credibility-section">
        <h4>可信度等级</h4>
        <div className="bg-prep-credibility-grid">
          {CREDIBILITY_LEVELS.map((cl) => (
            <div className="bg-prep-credibility-item" key={cl.level}>
              <span className="bg-prep-credibility-icon">{cl.icon}</span>
              <div>
                <strong>{cl.level}</strong>
                <p>{cl.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-prep-note">
        <AlertTriangle size={14} />
        <span>
          当前为静态预览版。联网搜索、AI 深度生成、保存到其他简历等核心功能由后续版本接入。
        </span>
      </div>
    </div>
  )
}
