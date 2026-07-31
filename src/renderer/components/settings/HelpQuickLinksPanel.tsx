import { Book, AlertCircle, ClipboardCheck, ListChecks, ExternalLink, Compass, Cpu, Mic, DollarSign, HelpCircle, FileText } from "lucide-react"

import { useState } from 'react'

const DOC_GROUPS = [
  {
    label: "上手入门",
    links: [
      { icon: Book, title: "新手教程", desc: "从安装到第一次训练完整走一遍", path: "docs/new-user-guide.md" },
      { icon: Compass, title: "五分钟上手指南", desc: "7 步完成首次面试辅助流程", path: "docs/quick-start.md" },
      { icon: Book, title: "完整用户手册", desc: "安装到常见问题全覆盖", path: "docs/deepseek-phase1-docs.md（第一部分）" },
    ]
  },
  {
    label: "配置说明",
    links: [
      { icon: Cpu, title: "模型与提供商选择", desc: "DeepSeek、阿里、OpenAI 何时用", path: "docs/model-provider-guide.md" },
      { icon: DollarSign, title: "用量预算与费用", desc: "Token 计费、省钱技巧、预算设置", path: "docs/usage-budget-guide.md" },
    ]
  },
  {
    label: "故障排查",
    links: [
      { icon: Mic, title: "语音与音频排障", desc: "麦克风权限、设备、电脑音频问题", path: "docs/audio-troubleshooting.md" },
      { icon: AlertCircle, title: "常见问题与错误索引", desc: "401/402/保存失败/导出空白", path: "docs/faq-and-troubleshooting.md" },
      { icon: AlertCircle, title: "错误解释词典", desc: "各错误码的详细原因和解决方法", path: "docs/deepseek-phase1-docs.md（第三部分）" },
    ]
  },
  {
    label: "质量与发布",
    links: [
      { icon: FileText, title: "v0.1.2 更新说明", desc: "查看本次新增、优化和升级方式", path: "docs/release-notes-v0.1.2.md" },
      { icon: ClipboardCheck, title: "发布前检查表", desc: "给朋友使用前逐项检查", path: "docs/deepseek-phase1-docs.md（第四部分）" },
      { icon: ListChecks, title: "回归测试清单", desc: "每次修改后逐模块点测", path: "docs/regression-checklist.md" },
      { icon: FileText, title: "产品说明与隐私", desc: "版本、数据存储、隐私说明", path: "docs/product-info.md" },
    ]
  }
]

export function HelpQuickLinksPanel(): JSX.Element {
  const [openStatus, setOpenStatus] = useState('')

  const handleOpenDoc = async (docPath: string, title: string): Promise<void> => {
    setOpenStatus(`正在打开：${title}...`)

    try {
      const result = await window.huomiantong.openDoc(docPath)
      setOpenStatus(result.ok ? `已打开：${title}` : `打开失败：${result.message || docPath}`)
    } catch (error) {
      setOpenStatus(error instanceof Error ? `打开失败：${error.message}` : '打开失败：未知错误')
    }
  }

  return (
    <div className="panel settings-panel help-quicklinks-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Help & Docs</span>
          <h3>帮助与文档</h3>
        </div>
      </div>
      {openStatus && <p className="help-quicklinks-status">{openStatus}</p>}
      <div className="help-quicklinks-groups">
        {DOC_GROUPS.map((group) => (
          <div className="help-quicklinks-group" key={group.label}>
            <strong className="help-quicklinks-group-label">{group.label}</strong>
            <div className="help-quicklinks-grid">
              {group.links.map((link) => (
                <button
                  className="help-quicklink-card"
                  key={link.title}
                  onClick={() => void handleOpenDoc(link.path, link.title)}
                  title={`打开 ${link.path}`}
                  type="button"
                >
                  <link.icon size={16} />
                  <div>
                    <strong>{link.title}</strong>
                    <p>{link.desc}</p>
                    <span className="help-quicklink-path">
                      <ExternalLink size={10} />
                      {link.path}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
