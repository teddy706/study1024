import React, { useEffect, useRef, useState } from 'react'

interface ScoreboardNumberProps {
  value: number
  duration?: number // ms
  className?: string
  locale?: string
  prefix?: string
  suffix?: string
}

// Simple count-up animation with requestAnimationFrame
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const ScoreboardNumber: React.FC<ScoreboardNumberProps> = ({
  value,
  duration = 800,
  className = '',
  locale = 'ko-KR',
  prefix = '',
  suffix = '',
}) => {
  const prevRef = useRef<number>(value)
  const startRef = useRef<number | null>(null)
  const [display, setDisplay] = useState<number>(value)

  useEffect(() => {
    const startValue = prevRef.current
    const endValue = value
    if (startValue === endValue) {
      setDisplay(endValue)
      return
    }

    startRef.current = null
    let raf: number

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - (startRef.current || 0)
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      const current = lerp(startValue, endValue, eased)
      setDisplay(current)
      if (t < 1) {
        raf = requestAnimationFrame(step)
      } else {
        prevRef.current = endValue
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  const formatted = `${prefix}${Math.round(display).toLocaleString(locale)}${suffix}`

  return (
    <span className={`font-mono tabular-nums tracking-widest ${className}`}>
      {formatted}
    </span>
  )
}

export default ScoreboardNumber
