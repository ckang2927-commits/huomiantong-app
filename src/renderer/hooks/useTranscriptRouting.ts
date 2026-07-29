import { useCallback, useState } from 'react'
import { useSyncedRef } from './useSyncedRef'

export type TranscriptTarget = 'workspace' | 'training-answer'

type UseTranscriptRoutingOptions = {
  onWorkspaceTranscript: (text: string) => void
  onTrainingAnswerTranscript: (text: string) => void
}

export function useTranscriptRouting({
  onWorkspaceTranscript,
  onTrainingAnswerTranscript
}: UseTranscriptRoutingOptions) {
  const [transcriptTarget, setTranscriptTarget] = useState<TranscriptTarget>('workspace')
  const transcriptTargetRef = useSyncedRef(transcriptTarget)
  const onWorkspaceTranscriptRef = useSyncedRef(onWorkspaceTranscript)
  const onTrainingAnswerTranscriptRef = useSyncedRef(onTrainingAnswerTranscript)

  const routeFinalTranscript = useCallback((text: string) => {
    if (transcriptTargetRef.current === 'training-answer') {
      onTrainingAnswerTranscriptRef.current(text)
      return
    }

    onWorkspaceTranscriptRef.current(text)
  }, [])

  return {
    transcriptTarget,
    routeFinalTranscript,
    setTranscriptTarget
  }
}
