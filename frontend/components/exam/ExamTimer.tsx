import { useEffect, useState } from 'react'

interface ExamTimerProps {
  initialTime: number
  onTimeout: () => void
}

const ExamTimer = ({ initialTime, onTimeout }: ExamTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime)

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          if (timer) clearInterval(timer)
          onTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [onTimeout])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <span className={`${timeRemaining <= 300 ? 'text-danger' : ''}`}>
      {formatTime(timeRemaining)}
    </span>
  )
}

export default ExamTimer 