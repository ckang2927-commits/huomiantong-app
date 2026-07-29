import { Mic, MonitorSpeaker, ShieldCheck, RefreshCw, Volume2, WifiOff } from "lucide-react"

const AUDIO_TOPICS = [
  {
    icon: ShieldCheck,
    title: "麦克风权限被拒绝",
    steps: [
      '点击语音设置中的"授权麦克风"跳转到系统设置',
      '在 Windows 设置中开启麦克风权限',
      '返回应用重新点击麦克风按钮'
    ]
  },
  {
    icon: Volume2,
    title: "麦克风无输入音量",
    steps: [
      '检查麦克风物理开关是否打开',
      '在 Windows 系统音量中检查是否被静音',
      '在语音设置下拉列表中切换其他设备',
      '使用"本地麦克风诊断"排查硬件'
    ]
  },
  {
    icon: RefreshCw,
    title: "麦克风设备找不到",
    steps: [
      '确认麦克风已正确插入电脑',
      '点击语音设置中的"刷新设备"重新枚举',
      '重启获面通后重试',
      '在 Windows 声音设置中确认设备正常'
    ]
  },
  {
    icon: MonitorSpeaker,
    title: "电脑音频不支持",
    steps: [
      '确保 Windows 版本 >= 10 1903',
      '更新音频驱动',
      '点击"刷新来源"选择"整个屏幕"',
      '仍不支持则改用麦克风转写'
    ]
  },
  {
    icon: WifiOff,
    title: "Deepgram 连接失败",
    steps: [
      '去设置页测试 Deepgram 连接',
      '检查 Key 是否正确',
      '检查网络能否访问 Deepgram API',
      '402 错误说明余额不足，去 deepgram.com 充值'
    ]
  },
  {
    icon: Mic,
    title: "转写过程中突然断开",
    steps: [
      '停止转写后重新开始',
      '检查网络是否稳定',
      '频繁断开时尝试切换网络环境'
    ]
  }
]

export function AudioTroubleshootingPanel(): JSX.Element {
  return (
    <div className="panel settings-panel audio-troubleshooting-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Audio Troubleshooting</span>
          <h3>语音排障</h3>
        </div>
      </div>
      <div className="audio-troubleshooting-grid">
        {AUDIO_TOPICS.map((topic) => (
          <div className="audio-troubleshooting-card" key={topic.title}>
            <div className="audio-troubleshooting-header">
              <topic.icon size={16} />
              <strong>{topic.title}</strong>
            </div>
            <ol className="audio-troubleshooting-steps">
              {topic.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  )
}
