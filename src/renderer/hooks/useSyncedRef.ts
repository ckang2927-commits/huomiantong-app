import { useEffect, useRef, type MutableRefObject } from 'react'

export function useSyncedRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref
}
