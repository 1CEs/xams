"use client"

import React, { useState } from 'react'
import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Input, Link } from '@nextui-org/react'
import { clientAPI } from '@/config/axios.config'
import { isAxiosError } from 'axios'
import { getAuthErrorMessage, AUTH_ERROR_MESSAGES, isValidEmail } from '@/utils/auth-errors'
import { toast } from 'react-toastify'
import { useRouter } from 'nextjs-toploader/app'
import ResetPassword from '@/public/images/reset-password.png'
import { Image } from '@nextui-org/react'

type Props = {}

const ForgotPasswordPage = (props: Props) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Client-side validation
    if (!email.trim()) {
      const errorMsg = AUTH_ERROR_MESSAGES.FORGOT_PASSWORD.EMAIL_REQUIRED
      toast.error(errorMsg)
      setIsLoading(false)
      return
    }

    if (!isValidEmail(email)) {
      const errorMsg = AUTH_ERROR_MESSAGES.FORGOT_PASSWORD.INVALID_EMAIL
      toast.error(errorMsg)
      setIsLoading(false)
      return
    }

    try {
      const response = await clientAPI.post('/auth/forgot-password', { email })
      toast.success(response.data.message || AUTH_ERROR_MESSAGES.FORGOT_PASSWORD.SUCCESS)
      router.push('/member/sign-in')
    } catch (error) {
      if (isAxiosError(error)) {
        const errorData = error.response?.data
        let userFriendlyMessage = ''
        
        // Use centralized error message handling
        userFriendlyMessage = getAuthErrorMessage(errorData, false)
        
        // Handle specific forgot password errors
        if (userFriendlyMessage === 'An unexpected error occurred') {
          userFriendlyMessage = AUTH_ERROR_MESSAGES.FORGOT_PASSWORD.ERROR
        }
        
        toast.error(userFriendlyMessage)
      } else {
        toast.error(AUTH_ERROR_MESSAGES.GENERAL.UNEXPECTED_ERROR)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center pt-16 bg-background">
      <Image className='transform scale-x-[-1]' src={ResetPassword.src} alt="Reset Password" width={500} height={500} />
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-tiny text-foreground-500">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </CardHeader>
        <Divider />
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onValueChange={setEmail}
              isRequired
              isDisabled={isLoading}
            />
          </CardBody>
          <Divider />
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              color="secondary"
              className="w-full"
              isLoading={isLoading}
            >
              Send Reset Link
            </Button>
            <div className="flex justify-center gap-1 text-sm">
              <span>Back to</span>
              <Link href="/member/sign-in" color="secondary">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default ForgotPasswordPage