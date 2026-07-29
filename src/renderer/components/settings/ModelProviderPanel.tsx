import { Cpu, DollarSign, ShieldCheck } from 'lucide-react'

const MODEL_PROVIDERS = [
  {
    name: 'DeepSeek',
    models: 'deepseek-v4-flash / deepseek-v4-pro',
    bestFor: '日常面试实时回答、性价比优先',
    note: '推荐首选。速度快、中文好，flash 够日常用，pro 适合复杂问题。',
    pricing: '低价位 · 以官方账单为准'
  },
  {
    name: '阿里百炼 DashScope',
    models: 'qwen3.7-plus / qwen3.7-max',
    bestFor: '国内网络直连、低延迟',
    note: '国内服务器无需代理。首次使用需开通模型服务，Base URL 用兼容模式。',
    pricing: '低到中价位 · 以官方账单为准'
  },
  {
    name: 'OpenAI',
    models: 'gpt-4.1-mini / gpt-4.1',
    bestFor: '高质量回答、复杂推理、英文面试',
    note: '能力强，但通常更贵且网络环境要求更高，建议重要面试或复杂问题时使用。',
    pricing: '中到高价位 · 以官方账单为准'
  },
  {
    name: 'Anthropic Claude',
    models: 'claude-3-5-haiku / claude-3-5-sonnet',
    bestFor: '长对话、需要稳健表达',
    note: '上下文窗口大，适合超长材料和长对话场景；部分模型可能需要申请或开通。',
    pricing: '中到高价位 · 以官方账单为准'
  },
  {
    name: 'Deepgram（语音）',
    models: '无需选择',
    bestFor: '麦克风和电脑音频实时转写',
    note: '按音频时长计费，免费额度和单价会随 Deepgram 账户政策变化，建议以后台余额页为准。',
    pricing: '按分钟计费 · 以官方账单为准'
  }
]

export function ModelProviderPanel(): JSX.Element {
  return (
    <div className="panel settings-panel model-provider-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Model & Cost Reference</span>
          <h3>模型与费用说明</h3>
        </div>
      </div>
      <div className="model-provider-ref-list">
        {MODEL_PROVIDERS.map((provider) => (
          <div className="model-provider-ref-card" key={provider.name}>
            <div className="model-provider-ref-top">
              <Cpu size={16} />
              <strong>{provider.name}</strong>
              <span className="model-provider-ref-models">{provider.models}</span>
            </div>
            <div className="model-provider-ref-body">
              <p><b>适合：</b>{provider.bestFor}</p>
              <p><b>说明：</b>{provider.note}</p>
              <span className="model-provider-ref-pricing"><DollarSign size={12} />{provider.pricing}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="model-provider-ref-tip">
        <ShieldCheck size={14} />
        <span>设置页展示的是预算估算，不是实时账单；价格、汇率和免费额度会变化，实际扣费请以服务商官网和账单为准。</span>
      </div>
    </div>
  )
}
