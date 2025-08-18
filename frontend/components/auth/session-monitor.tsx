"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/user.store'
import { useCookies } from 'next-client-cookies'
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  Progress,
  useDisclosure
} from '@nextui-org/react'
import { toast } from 'react-toastify'
import { ClockIcon } from '@/components/icons/icons'

interface SessionMonitorProps {
  warningTimeMinutes?: number // Time before expiration to show warning (default: 5 minutes)
  checkIntervalSeconds?: number // How often to check session (default: 30 seconds)
  idleTimeoutHours?: number // Hours of inactivity before session expires (default: 1 hour)
}

export default function SessionMonitor({ 
  warningTimeMinutes = 5, 
  checkIntervalSeconds = 30,
  idleTimeoutHours = 1
}: SessionMonitorProps) {
  const router = useRouter()
  const { user, setUser } = useUserStore()
  const cookies = useCookies()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isWarningShown, setIsWarningShown] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  // Check if session is valid by verifying user cookie exists and is not expired
  const checkSessionValidity = useCallback((): { valid: boolean; expiresAt?: number; idleExpired?: boolean } => {
    try {
      const userCookie = cookies.get('user')
      if (!userCookie) {
        return { valid: false }
      }
      
      const userData = JSON.parse(userCookie)
      if (!userData._id || !userData.role) {
        return { valid: false }
      }
      
      // Calculate session expiration time (24 hours from login)
      const loginTime = userData.loginTime || Date.now()
      const sessionExpiresAt = loginTime + (24 * 60 * 60 * 1000) // 24 hours from login
      
      // Calculate idle timeout (1 hour from last activity)
      const idleTimeoutMs = idleTimeoutHours * 60 * 60 * 1000
      const idleExpiresAt = lastActivity + idleTimeoutMs
      
      const now = Date.now()
      
      // Check if session has expired due to time limit
      if (now >= sessionExpiresAt) {
        return { valid: false }
      }
      
      // Check if session has expired due to inactivity
      if (now >= idleExpiresAt) {
        return { valid: false, idleExpired: true }
      }
      
      // Use the earlier of the two expiration times for warning
      const expiresAt = Math.min(sessionExpiresAt, idleExpiresAt)
      
      return { valid: true, expiresAt }
    } catch (error) {
      console.error('Error checking session validity:', error)
      return { valid: false }
    }
  }, [cookies, lastActivity, idleTimeoutHours])

  // Get session expiration time from user data
  const getSessionExpiration = useCallback((): number | null => {
    try {
      const userCookie = cookies.get('user')
      if (!userCookie) return null

      const userData = JSON.parse(userCookie)
      
      // Use stored login time or current time as fallback
      const loginTime = userData.loginTime || Date.now()
      const expirationTime = loginTime + (24 * 60 * 60 * 1000) // 24 hours from login
      
      return expirationTime
    } catch (error) {
      console.error('Error getting session expiration:', error)
      return null
    }
  }, [cookies])

  // Handle session expiration
  const handleSessionExpired = useCallback((isIdleExpired?: boolean) => {
    setUser(null)
    cookies.remove('user')
    const message = isIdleExpired 
      ? 'Your session has expired due to inactivity. Please sign in again.'
      : 'Your session has expired. Please sign in again.'
    toast.warning(message)
    router.replace('/member/sign-in')
  }, [setUser, cookies, router])

  // Handle user choosing to logout
  const handleLogout = useCallback(() => {
    setUser(null)
    cookies.remove('user')
    onClose()
    toast.info('You have been signed out.')
    router.replace('/member/sign-in')
  }, [setUser, cookies, onClose, router])

  // Extend session by updating the user cookie with new login time and reset activity
  const extendSession = useCallback(async () => {
    setIsExtending(true)
    try {
      const currentUser = user
      if (currentUser) {
        // Update the user cookie with new login time
        const updatedUserData = {
          ...currentUser,
          loginTime: Date.now()
        }
        
        const oneDay = 24 * 60 * 60 * 1000
        cookies.set('user', JSON.stringify(updatedUserData), { 
          expires: Date.now() + oneDay 
        })
        
        setUser(updatedUserData)
        setLastActivity(Date.now()) // Reset activity timer
        setIsWarningShown(false)
        onClose()
        
        toast.success('Session extended successfully!')
      } else {
        throw new Error('No user data available')
      }
    } catch (error) {
      console.error('Error extending session:', error)
      toast.error('Failed to extend session. Please sign in again.')
      handleSessionExpired()
    } finally {
      setIsExtending(false)
    }
  }, [user, cookies, setUser, onClose, handleSessionExpired])

  // Track user activity
  const trackActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  // Check session status
  const checkSession = useCallback(() => {
    if (!user) return

    // Check if session is still valid
    const sessionCheck = checkSessionValidity()
    
    if (!sessionCheck.valid) {
      handleSessionExpired(sessionCheck.idleExpired)
      return
    }

    const expirationTime = sessionCheck.expiresAt || getSessionExpiration()
    if (!expirationTime) return

    const now = Date.now()
    const timeUntilExpiration = expirationTime - now
    const warningTime = warningTimeMinutes * 60 * 1000 // Convert to milliseconds

    // Update time left for display
    setTimeLeft(Math.max(0, Math.floor(timeUntilExpiration / 1000)))

    // Check if session has expired
    if (timeUntilExpiration <= 0) {
      handleSessionExpired(sessionCheck.idleExpired)
      return
    }

    // Check if we should show warning
    if (timeUntilExpiration <= warningTime && !isWarningShown && !isOpen) {
      setIsWarningShown(true)
      onOpen()
    }
  }, [user, checkSessionValidity, getSessionExpiration, warningTimeMinutes, isWarningShown, isOpen, onOpen, handleSessionExpired])

  // Set up activity tracking
  useEffect(() => {
    if (!user) return

    // List of events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    // Throttle activity tracking to avoid excessive updates
    let activityTimeout: ReturnType<typeof setTimeout> | null = null
    const throttledTrackActivity = () => {
      if (activityTimeout) return
      activityTimeout = setTimeout(() => {
        trackActivity()
        activityTimeout = null
      }, 1000) // Track activity at most once per second
    }

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledTrackActivity, true)
    })

    return () => {
      // Clean up event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledTrackActivity, true)
      })
      if (activityTimeout) {
        clearTimeout(activityTimeout)
      }
    }
  }, [user, trackActivity])

  // Set up interval to check session
  useEffect(() => {
    if (!user) return

    // Check immediately
    checkSession()

    // Set up interval
    const interval = setInterval(checkSession, checkIntervalSeconds * 1000)

    return () => clearInterval(interval)
  }, [user, checkSession, checkIntervalSeconds])

  // Format time for display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    const warningTime = warningTimeMinutes * 60 // Convert to seconds
    return Math.max(0, Math.min(100, (timeLeft / warningTime) * 100))
  }

  if (!user) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} // Prevent closing by clicking outside
      hideCloseButton
      isDismissable={false}
      backdrop="blur"
      size="md"
      classNames={{
        backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-warning flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
            <span>Session Expiring Soon</span>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            <p className="text-default-600">
              Your session will expire soon due to inactivity. Would you like to continue working?
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-default-500" />
                  <span className="text-sm text-default-600">Time remaining:</span>
                </div>
                <span className="font-mono text-lg font-semibold text-warning">
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <Progress
                value={getProgressPercentage()}
                color={getProgressPercentage() > 50 ? "success" : getProgressPercentage() > 25 ? "warning" : "danger"}
                className="w-full"
                size="sm"
              />
            </div>
            
            <div className="bg-default-50 rounded-lg p-3">
              <p className="text-sm text-default-600">
                <strong>Continue Session:</strong> Extend your session for another 24 hours and reset the 1-hour idle timer
              </p>
              <p className="text-sm text-default-600 mt-1">
                <strong>Sign Out:</strong> End your session and return to sign-in page
              </p>
              <p className="text-xs text-default-500 mt-2">
                💡 <em>Sessions automatically expire after 1 hour of inactivity to protect your account</em>
              </p>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            color="default"
            variant="light"
            onPress={handleLogout}
            disabled={isExtending}
          >
            Sign Out
          </Button>
          <Button
            color="primary"
            onPress={extendSession}
            isLoading={isExtending}
          >
            {isExtending ? 'Extending...' : 'Continue Session'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
