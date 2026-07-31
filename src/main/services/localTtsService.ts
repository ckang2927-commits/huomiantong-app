import { app } from 'electron'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import * as ort from 'onnxruntime-node'
import { pinyin } from 'pinyin-pro'
import { findLocalTtsVoice, type LocalTtsVoiceOption } from '../../shared/piperVoices'
import type { LocalSpeechSynthesisRequest, LocalSpeechSynthesisResult } from '../../shared/types'

type PiperVoiceConfig = {
  audio: { sample_rate: number }
  inference: { noise_scale?: number; length_scale?: number; noise_w?: number }
  phoneme_id_map: Record<string, number[]>
}

type CachedPinyinVoice = {
  config: PiperVoiceConfig
  session: ort.InferenceSession
}

const pinyinVoiceCache = new Map<string, Promise<CachedPinyinVoice>>()

const pinyinInitials = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w']

const punctuationMap: Record<string, string> = {
  '。': '.',
  '，': ',',
  '、': ',',
  '！': '!',
  '？': '?',
  '：': ':',
  '；': ';',
  '（': '(',
  '）': ')',
  '—': '-',
  '-': '-',
  ' ': ' '
}

export async function synthesizeLocalSpeech(request: LocalSpeechSynthesisRequest): Promise<LocalSpeechSynthesisResult> {
  const voice = findLocalTtsVoice(request.voiceURI)
  const text = sanitizeSpeechText(request.text)

  if (!voice) {
    throw new Error('未找到本地面试官声音')
  }

  if (!text) {
    throw new Error('朗读内容为空')
  }

  const piperRoot = resolvePiperRoot()

  if (voice.engine === 'piper-espeak') {
    return synthesizeEspeakVoice(piperRoot, voice, text)
  }

  return synthesizePinyinVoice(piperRoot, voice, text, request.speed)
}

function sanitizeSpeechText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 1200)
}

function resolvePiperRoot(): string {
  const candidates = [
    path.join(process.resourcesPath, 'piper'),
    path.join(process.resourcesPath, 'resources', 'piper'),
    path.join(app.getAppPath(), 'resources', 'piper'),
    path.join(process.cwd(), 'resources', 'piper')
  ]

  return candidates.find((candidate) => existsSync(path.join(candidate, 'voices'))) ?? candidates[candidates.length - 1]
}

async function synthesizePinyinVoice(
  piperRoot: string,
  voice: LocalTtsVoiceOption,
  text: string,
  speed?: number
): Promise<LocalSpeechSynthesisResult> {
  const cached = await loadPinyinVoice(piperRoot, voice)
  const phonemeIds = buildPinyinPhonemeIds(text, cached.config.phoneme_id_map)

  if (phonemeIds.length <= 2) {
    throw new Error('本地声音无法解析这段文本')
  }

  const lengthScale = speed && Number.isFinite(speed) && speed > 0 ? 1 / speed : cached.config.inference.length_scale ?? 1
  const feeds: Record<string, ort.Tensor> = {
    input: new ort.Tensor('int64', BigInt64Array.from(phonemeIds, BigInt), [1, phonemeIds.length]),
    input_lengths: new ort.Tensor('int64', BigInt64Array.from([phonemeIds.length], BigInt), [1]),
    scales: new ort.Tensor('float32', Float32Array.from([cached.config.inference.noise_scale ?? 0.667, lengthScale, cached.config.inference.noise_w ?? 0.8]), [3])
  }
  const output = await cached.session.run(feeds)
  const audioTensor = output.output ?? Object.values(output)[0]
  const samples = audioTensor.data as Float32Array
  const wav = floatSamplesToWav(samples, cached.config.audio.sample_rate, true)

  return {
    voiceURI: voice.id,
    mimeType: 'audio/wav',
    sampleRate: cached.config.audio.sample_rate,
    audio: toArrayBuffer(wav)
  }
}

function loadPinyinVoice(piperRoot: string, voice: LocalTtsVoiceOption): Promise<CachedPinyinVoice> {
  const cached = pinyinVoiceCache.get(voice.id)

  if (cached) {
    return cached
  }

  const promise = (async () => {
    const voiceDir = path.join(piperRoot, 'voices', voice.modelName)
    const configPath = path.join(voiceDir, `${voice.modelName}.onnx.json`)
    const modelPath = path.join(voiceDir, `${voice.modelName}.onnx`)
    const config = JSON.parse(await readFile(configPath, 'utf-8')) as PiperVoiceConfig
    const session = await ort.InferenceSession.create(modelPath, { executionProviders: ['cpu'] })

    return { config, session }
  })()

  pinyinVoiceCache.set(voice.id, promise)
  return promise
}

function buildPinyinPhonemeIds(text: string, idMap: Record<string, number[]>): number[] {
  const phonemes = ['^']

  for (const char of text.replace(/^\uFEFF/, '')) {
    const direct = punctuationMap[char] ?? char

    if (idMap[direct]) {
      phonemes.push(direct)
      if (direct !== '^' && direct !== '$') {
        phonemes.push('_')
      }
      continue
    }

    const syllable = pinyin(char, { toneType: 'num', type: 'array', nonZh: 'removed' })[0]
    const parts = normalizePinyinSyllable(syllable)

    if (!parts) {
      continue
    }

    const [initial, final, tone] = parts
    for (const phoneme of [initial || 'Ø', final, tone]) {
      if (idMap[phoneme]) {
        phonemes.push(phoneme)
      }
    }
    phonemes.push('_')
  }

  phonemes.push('$')
  return phonemes.flatMap((phoneme) => idMap[phoneme] ?? [])
}

function normalizePinyinSyllable(syllable: string | undefined): [string, string, string] | null {
  if (!syllable) {
    return null
  }

  const normalized = syllable.toLowerCase().replace('u:', 'v').replace('ü', 'v')
  const match = normalized.match(/^([a-zv]+?)([1-5])$/)

  if (!match) {
    return null
  }

  const base = match[1]
  const tone = match[2]
  const initial = pinyinInitials.find((candidate) => base.startsWith(candidate)) ?? ''
  const final = base.slice(initial.length)

  return final ? [initial, final, tone] : null
}

async function synthesizeEspeakVoice(piperRoot: string, voice: LocalTtsVoiceOption, text: string): Promise<LocalSpeechSynthesisResult> {
  const voiceDir = path.join(piperRoot, 'voices', voice.modelName)
  const runtimeDir = path.join(piperRoot, 'piper')
  const executable = path.join(runtimeDir, 'piper.exe')
  const workDir = await mkdtemp(path.join(tmpdir(), 'huomiantong-tts-'))
  const outputPath = path.join(workDir, 'output.wav')

  try {
    await mkdir(workDir, { recursive: true })
    await runPiperExecutable(executable, runtimeDir, [
      '--model',
      path.join(voiceDir, `${voice.modelName}.onnx`),
      '--config',
      path.join(voiceDir, `${voice.modelName}.onnx.json`),
      '--output_file',
      outputPath,
      '--data-dir',
      path.join(runtimeDir, 'espeak-ng-data')
    ], text)

    const wav = await readFile(outputPath)

    return {
      voiceURI: voice.id,
      mimeType: 'audio/wav',
      sampleRate: 22050,
      audio: toArrayBuffer(wav)
    }
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength)
  new Uint8Array(arrayBuffer).set(buffer)
  return arrayBuffer
}

function runPiperExecutable(executable: string, runtimeDir: string, args: string[], input: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: runtimeDir,
      env: { ...process.env, PATH: `${runtimeDir};${process.env.PATH ?? ''}` },
      stdio: ['pipe', 'ignore', 'pipe'],
      windowsHide: true
    })
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error('本地声音合成超时'))
    }, 30000)
    let errorText = ''

    child.stderr.setEncoding('utf-8')
    child.stderr.on('data', (chunk) => {
      errorText += chunk
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(errorText.trim() || `本地声音合成失败：${code}`))
    })
    child.stdin.end(input)
  })
}

function floatSamplesToWav(samples: Float32Array, sampleRate: number, normalize: boolean): Buffer {
  let gain = 1

  if (normalize) {
    let peak = 0
    for (const sample of samples) {
      peak = Math.max(peak, Math.abs(sample))
    }
    gain = peak > 1e-8 ? 1 / peak : 1
  }

  const dataBytes = samples.length * 2
  const wav = Buffer.alloc(44 + dataBytes)
  wav.write('RIFF', 0)
  wav.writeUInt32LE(36 + dataBytes, 4)
  wav.write('WAVE', 8)
  wav.write('fmt ', 12)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(sampleRate, 24)
  wav.writeUInt32LE(sampleRate * 2, 28)
  wav.writeUInt16LE(2, 32)
  wav.writeUInt16LE(16, 34)
  wav.write('data', 36)
  wav.writeUInt32LE(dataBytes, 40)

  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-32768, Math.min(32767, Math.round(samples[index] * gain * 32767)))
    wav.writeInt16LE(value, 44 + index * 2)
  }

  return wav
}
