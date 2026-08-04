import type { TranscriptLine } from '../../shared/types'

export type AnswerQueueItem = {
  id: string
  question: string
  transcript: TranscriptLine[]
}

export type AnswerQueueMachineState = {
  activeQuestion: string
  isGenerating: boolean
  queuedAnswers: AnswerQueueItem[]
}

type IdFactory = () => string

export function createQueuedAnswer(question: string, transcript: TranscriptLine[], idFactory: IdFactory = createQueueId): AnswerQueueItem {
  return {
    id: idFactory(),
    question: question.trim(),
    transcript: [...transcript]
  }
}

export function appendQueuedAnswer(queue: AnswerQueueItem[], item: AnswerQueueItem): AnswerQueueItem[] {
  return [...queue, item]
}

export function shiftQueuedAnswer(queue: AnswerQueueItem[]): { nextQueued?: AnswerQueueItem; remainingQueue: AnswerQueueItem[] } {
  const [nextQueued, ...remainingQueue] = queue
  return { nextQueued, remainingQueue }
}

export function createAnswerQueueState(overrides: Partial<AnswerQueueMachineState> = {}): AnswerQueueMachineState {
  const { queuedAnswers, ...rest } = overrides

  return {
    activeQuestion: '',
    isGenerating: false,
    ...rest,
    queuedAnswers: [...(queuedAnswers ?? [])]
  }
}

export function receiveQuestionWhileGenerating(
  state: AnswerQueueMachineState,
  item: AnswerQueueItem
): { state: AnswerQueueMachineState; queued: boolean } {
  if (!state.isGenerating) {
    return {
      state: {
        ...state,
        activeQuestion: item.question,
        isGenerating: true
      },
      queued: false
    }
  }

  return {
    state: {
      ...state,
      queuedAnswers: appendQueuedAnswer(state.queuedAnswers, item)
    },
    queued: true
  }
}

export function finishCurrentQuestion(state: AnswerQueueMachineState): { state: AnswerQueueMachineState; nextQueued?: AnswerQueueItem } {
  const { nextQueued, remainingQueue } = shiftQueuedAnswer(state.queuedAnswers)

  if (!nextQueued) {
    return {
      state: {
        ...state,
        activeQuestion: '',
        isGenerating: false,
        queuedAnswers: []
      }
    }
  }

  return {
    nextQueued,
    state: {
      ...state,
      activeQuestion: nextQueued.question,
      isGenerating: true,
      queuedAnswers: remainingQueue
    }
  }
}

export function resetAnswerQueueState(): AnswerQueueMachineState {
  return createAnswerQueueState()
}

function createQueueId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `queued-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
