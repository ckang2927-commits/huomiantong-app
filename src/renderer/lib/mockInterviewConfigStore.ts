import {
  defaultMockInterviewConfig,
  mockInterviewFocusOptions,
  normalizeMockInterviewConfig,
  type MockInterviewConfig,
  type MockInterviewDifficulty,
  type MockInterviewerStyle,
  type MockQuestionStrategy
} from '../../shared/mockInterview'

const storageKey = 'huomiantong.mockInterviewConfig.v1'

export type { MockInterviewConfig, MockInterviewDifficulty, MockInterviewerStyle, MockQuestionStrategy }

export { defaultMockInterviewConfig, mockInterviewFocusOptions, normalizeMockInterviewConfig }

export function loadMockInterviewConfig(): MockInterviewConfig {
  const raw = window.localStorage.getItem(storageKey)

  if (!raw) {
    return defaultMockInterviewConfig
  }

  try {
    return normalizeMockInterviewConfig(JSON.parse(raw))
  } catch {
    return defaultMockInterviewConfig
  }
}

export function saveMockInterviewConfig(config: MockInterviewConfig): void {
  window.localStorage.setItem(storageKey, JSON.stringify(normalizeMockInterviewConfig(config)))
}
