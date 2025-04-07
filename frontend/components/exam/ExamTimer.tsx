import { useEffect, useState, useMemo, useCallback, memo } from 'react'

interface ExamTimerProps {
  initialTime: number
  onTimeout: () => void
  hasSubmitted: boolean
}

const ExamTimer = memo(({ initialTime, onTimeout, hasSubmitted }: ExamTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime)

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  const formattedTime = useMemo(() => formatTime(timeRemaining), [timeRemaining, formatTime])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    if (!hasSubmitted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0) {
            if (timer) clearInterval(timer)
            if (!hasSubmitted) {
              onTimeout()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [hasSubmitted, onTimeout])

  const className = useMemo(() => 
    `${timeRemaining <= 300 ? 'text-danger' : ''}`, 
    [timeRemaining]
  )

  return (
    <span className={className}>
      {formattedTime}
    </span>
  )
})

ExamTimer.displayName = 'ExamTimer'

export default ExamTimer 