import type { HuomiantongApi } from '../preload'

declare global {
  interface Window {
    huomiantong: HuomiantongApi
  }
}
