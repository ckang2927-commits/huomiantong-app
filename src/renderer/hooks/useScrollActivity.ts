import { useEffect, useState } from 'react'

export function useScrollActivity(): boolean {
  const [isScrollActive, setIsScrollActive] = useState(false)

  useEffect(() => {
    let timer = 0
    const markScrolling = () => {
      setIsScrollActive(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setIsScrollActive(false), 1000)
    }

    window.addEventListener('scroll', markScrolling, true)
    window.addEventListener('wheel', markScrolling, { passive: true })

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', markScrolling, true)
      window.removeEventListener('wheel', markScrolling)
    }
  }, [])

  return isScrollActive
}
