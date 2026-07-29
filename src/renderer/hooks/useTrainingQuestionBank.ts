import { useEffect, useRef, useState } from 'react'
import type { TrainingMode, TrainingRound } from '../../shared/types'
import {
  buildQuestionBankFocusPlan,
  clearTrainingQuestionBankItems,
  isRoundInQuestionBank,
  loadTrainingQuestionBankItems,
  removeTrainingQuestionBankItem,
  saveTrainingQuestionBankItem,
  type TrainingQuestionBankItem
} from '../lib/trainingQuestionBankStore'
import type { TrainingFocusPlan } from '../lib/trainingInsights'

type UseTrainingQuestionBankOptions = {
  trainingMode: TrainingMode
  rounds: TrainingRound[]
  finalReport: string
}

export function useTrainingQuestionBank({
  trainingMode,
  rounds,
  finalReport
}: UseTrainingQuestionBankOptions) {
  const [questionBankItems, setQuestionBankItems] = useState<TrainingQuestionBankItem[]>(() => loadTrainingQuestionBankItems())
  const autoCollectFingerprintRef = useRef('')

  useEffect(() => {
    if (!finalReport.trim()) {
      return
    }

    const lowScoreRounds = rounds.filter((round) => round.answer?.trim() && typeof round.score === 'number' && round.score < 75)

    if (lowScoreRounds.length === 0) {
      return
    }

    const fingerprint = lowScoreRounds.map((round) => `${round.id}:${round.score || 0}:${round.answeredAt || 0}`).join('|')

    if (fingerprint === autoCollectFingerprintRef.current) {
      return
    }

    autoCollectFingerprintRef.current = fingerprint

    let nextItems = loadTrainingQuestionBankItems()

    lowScoreRounds.forEach((round) => {
      const result = saveTrainingQuestionBankItem({
        round,
        trainingMode,
        source: 'low-score',
        tags: ['自动收集']
      })
      nextItems = result.items
    })

    setQuestionBankItems(nextItems)
  }, [finalReport, rounds, trainingMode])

  function bookmarkRound(round: TrainingRound): boolean {
    const result = saveTrainingQuestionBankItem({
      round,
      trainingMode,
      source: 'manual',
      tags: ['手动收藏']
    })
    setQuestionBankItems(result.items)
    return result.saved
  }

  function removeQuestionBankItem(id: string): void {
    setQuestionBankItems(removeTrainingQuestionBankItem(id))
  }

  function clearQuestionBank(): void {
    if (questionBankItems.length === 0) {
      return
    }

    if (!window.confirm('确定清空错题/高频问题收藏夹吗？这不会删除训练记录。')) {
      return
    }

    clearTrainingQuestionBankItems()
    setQuestionBankItems([])
  }

  function buildFocusedPlan(items: TrainingQuestionBankItem[], label?: string): TrainingFocusPlan | null {
    return buildQuestionBankFocusPlan(items, label)
  }

  function isBookmarked(round: TrainingRound): boolean {
    return isRoundInQuestionBank(round, questionBankItems)
  }

  return {
    questionBankItems,
    bookmarkRound,
    removeQuestionBankItem,
    clearQuestionBank,
    buildFocusedPlan,
    isBookmarked
  }
}
