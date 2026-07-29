import { useEffect, useRef } from 'react'
import { sampleQuestions } from '../lib/appHelpers'

type AddTranscriptLine = (text: string, shouldAutoAnswer?: boolean) => void

type UseInterviewSimulationOptions = {
  isSimulating: boolean
  onTranscriptLine: AddTranscriptLine
}

export function useInterviewSimulation({ isSimulating, onTranscriptLine }: UseInterviewSimulationOptions): void {
  const onTranscriptLineRef = useRef(onTranscriptLine)

  useEffect(() => {
    onTranscriptLineRef.current = onTranscriptLine
  }, [onTranscriptLine])

  useEffect(() => {
    if (!isSimulating) {
      return
    }

    const id = window.setInterval(() => {
      const question = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)]
      onTranscriptLineRef.current(question, true)
    }, 4500)

    return () => window.clearInterval(id)
  }, [isSimulating])
}
