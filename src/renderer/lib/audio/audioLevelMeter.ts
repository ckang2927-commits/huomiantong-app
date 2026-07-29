type StopAudioLevelMeter = () => void

export function startAudioLevelMeter(stream: MediaStream, onLevel: (level: number) => void): StopAudioLevelMeter {
  const AudioContextConstructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextConstructor) {
    onLevel(0)
    return () => onLevel(0)
  }

  const context = new AudioContextConstructor()
  const source = context.createMediaStreamSource(stream)
  const analyser = context.createAnalyser()
  const samples = new Uint8Array(analyser.fftSize)
  let animationFrameId = 0
  let stopped = false

  analyser.fftSize = 1024
  source.connect(analyser)

  function tick(): void {
    if (stopped) {
      return
    }

    analyser.getByteTimeDomainData(samples)
    let squareSum = 0

    for (const sample of samples) {
      const normalized = (sample - 128) / 128
      squareSum += normalized * normalized
    }

    const rms = Math.sqrt(squareSum / samples.length)
    onLevel(Math.min(1, rms * 4))
    animationFrameId = window.requestAnimationFrame(tick)
  }

  tick()

  return () => {
    stopped = true
    window.cancelAnimationFrame(animationFrameId)
    source.disconnect()
    analyser.disconnect()
    void context.close()
    onLevel(0)
  }
}
