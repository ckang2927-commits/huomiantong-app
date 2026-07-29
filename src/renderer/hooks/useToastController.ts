import { useCallback, useEffect, useState } from 'react'
import type { ToastMessage } from '../lib/appHelpers'

export function useToastController() {
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const showToast = useCallback((text: string, kind: ToastMessage['kind'] = 'success'): void => {
    setToast({ id: Date.now(), text, kind })
  }, [])

  return {
    showToast,
    toast
  }
}
