import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

const FAQ_ITEMS = [
  {
    q: "测试连接返回 401/402/403/429 怎么办？",
    a: "401 是 Key 无效，重新复制粘贴后再试。402 是余额不足，去服务商后台充值。403 是 Key 没有模型权限，检查是否需申请白名单。429 是请求太频繁，等 30 秒再试。",
    category: "API"
  },
  {
    q: "麦克风转写没有反应？",
    a: "先检查 Deepgram 配置是否测试通过，再去 Windows 设置检查麦克风权限。在语音设置里选择正确的设备，用\"本地麦克风诊断\"排查硬件。Deepgram 免费额度用完也会返回 402。",
    category: "语音"
  },
  {
    q: "电脑音频无法使用？",
    a: "确保 Windows 版本 >= 10 1903。点击\"刷新来源\"选择整个屏幕或具体窗口。如果仍然提示不支持，暂时用麦克风转写代替。",
    category: "语音"
  },
  {
    q: "保存会话失败怎么办？",
    a: "检查磁盘空间是否充足，重启应用后重试。如果持续失败，先导出备份再重新安装。",
    category: "数据"
  },
  {
    q: "导出的 Word 或 MD 文件是空的？",
    a: "确保会话中有问答内容。如果有内容但导出为空，尝试重新保存会话后再导出。隐私模式下内容会脱敏但不会为空。",
    category: "数据"
  },
  {
    q: "AI 回答速度太慢？",
    a: "切换为 DeepSeek v4 Flash 或阿里 qwen3.6-flash 等快速模型。检查网络延迟（设置页测试连接会显示）。简历过长也会增加等待时间。",
    category: "性能"
  },
  {
    q: "回答太长或太短，能不能控制？",
    a: "在设置页切换回答风格：fast（简短）/ standard（标准）/ star（详细）。不同模型的输出长度也不同。",
    category: "回答"
  },
  {
    q: "模拟训练没有出题？",
    a: "没有 API Key 时会进入本地兜底训练。如果配置了 Key 仍不出题，检查 Key 是否测试通过，以及训练模板是否选择正确。",
    category: "训练"
  },
]

export function FAQPanel(): JSX.Element {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="panel settings-panel faq-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">FAQ</span>
          <h3>常见问题</h3>
        </div>
      </div>
      <div className="faq-list">
        {FAQ_ITEMS.map((item, index) => (
          <div className={`faq-item ${openIndex === index ? "open" : ""}`} key={index}>
            <button className="faq-question" type="button" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
              <HelpCircle size={15} />
              <span>{item.q}</span>
              {openIndex === index ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {openIndex === index && (
              <div className="faq-answer">
                <p>{item.a}</p>
                <span className="faq-category">{item.category}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
