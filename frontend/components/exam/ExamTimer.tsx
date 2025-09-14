import { useEffect, useState, useMemo, useCallback, memo } from 'react'

interface ExamTimerProps {
  onTimeout: () => void
  hasSubmitted: boolean
  scheduleId?: string
  timeLimitMinutes?: number
}

const ExamTimer = memo(({ onTimeout, hasSubmitted, scheduleId, timeLimitMinutes }: ExamTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(0)

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  const formattedTime = useMemo(() => formatTime(timeRemaining), [timeRemaining, formatTime])

  // Calculate and update time remaining based on persistent start time
  const updateTimeRemaining = useCallback(() => {
    if (!scheduleId || !timeLimitMinutes) {
      setTimeRemaining(0)
      return
    }
    
    const storageKey = `exam_start_time_${scheduleId}`
    let startTimeStr = localStorage.getItem(storageKey)
    
    // If no start time exists, create it now
    if (!startTimeStr) {
      const now = new Date().getTime()
      localStorage.setItem(storageKey, now.toString())
      startTimeStr = now.toString()
    }
    
    const startTime = parseInt(startTimeStr)
    const now = new Date().getTime()
    const elapsedSeconds = Math.floor((now - startTime) / 1000)
    const timeLimitSeconds = timeLimitMinutes * 60
    const remainingTime = Math.max(timeLimitSeconds - elapsedSeconds, 0)
    
    setTimeRemaining(remainingTime)
    
    // Trigger timeout if time runs out
    if (remainingTime <= 0 && !hasSubmitted) {
      onTimeout()
    }
  }, [scheduleId, timeLimitMinutes, hasSubmitted, onTimeout])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    if (!hasSubmitted) {
      // Update immediately
      updateTimeRemaining()
      
      // Then update every second
      timer = setInterval(updateTimeRemaining, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [hasSubmitted, updateTimeRemaining])

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