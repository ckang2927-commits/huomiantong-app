export type LocalTtsVoiceEngine = 'piper-pinyin' | 'piper-espeak'

export interface LocalTtsVoiceOption {
  id: string
  name: string
  label: string
  lang: string
  modelName: string
  engine: LocalTtsVoiceEngine
  genderHint: 'female' | 'male'
}

export const localTtsVoices: LocalTtsVoiceOption[] = [
  {
    id: 'piper:zh_CN-xiao_ya-medium',
    name: '小雅',
    label: '本地声音 · 小雅（女声，柔和）',
    lang: 'zh-CN',
    modelName: 'zh_CN-xiao_ya-medium',
    engine: 'piper-pinyin',
    genderHint: 'female'
  },
  {
    id: 'piper:zh_CN-huayan-medium',
    name: '华妍',
    label: '本地声音 · 华妍（女声，清晰）',
    lang: 'zh-CN',
    modelName: 'zh_CN-huayan-medium',
    engine: 'piper-espeak',
    genderHint: 'female'
  },
  {
    id: 'piper:zh_CN-chaowen-medium',
    name: '朝文',
    label: '本地声音 · 朝文（男声，沉稳）',
    lang: 'zh-CN',
    modelName: 'zh_CN-chaowen-medium',
    engine: 'piper-pinyin',
    genderHint: 'male'
  }
]

export function isLocalTtsVoiceId(value: string | undefined): value is `piper:${string}` {
  return typeof value === 'string' && value.startsWith('piper:')
}

export function findLocalTtsVoice(value: string | undefined): LocalTtsVoiceOption | undefined {
  return localTtsVoices.find((voice) => voice.id === value)
}
