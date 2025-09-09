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
      if (response.data.data.message === 'User not found') {
        toast.error("This email is not registered please try again.")
      } else {
        toast.success(response.data.message)
        router.push('/member/sign-in')
      }
    } catch (error) {
      if (isAxiosError(error)) {
        const errorData = error.response?.data
        let userFriendlyMessage = ''
        
        // Use centralized error message handling
        userFriendlyMessage = errorData.data?.message
        
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
    <div className="flex flex-col lg:flex-row items-center justify-center h-fit bg-background px-4 sm:px-8">
      <Image 
        className='hidden lg:block transform scale-x-[-1] mr-8' 
        src={ResetPassword.src} 
        alt="Reset Password" 
        width={400} 
        height={400} 
      />
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="flex flex-col gap-1 px-4 sm:px-6">
          <h1 className="text-xl sm:text-2xl font-bold">Forgot Password</h1>
          <p className="text-sm sm:text-tiny text-foreground-500">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </CardHeader>
        <Divider />
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-4 px-4 sm:px-6">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onValueChange={setEmail}
              isRequired
              isDisabled={isLoading}
              size="sm"
            />
            <span className="block mt-1 text-xs sm:text-tiny text-center">May take a few minutes to receive the email or check your spam folder.</span>
          </CardBody>
          <Divider />
          <CardFooter className="flex flex-col gap-4 px-4 sm:px-6">
            <Button
              type="submit"
              color="secondary"
              className="w-full"
              isLoading={isLoading}
              size="sm"
            >
              Send Reset Link
            </Button>
            <div className="flex items-center justify-center gap-1 text-xs sm:text-sm">
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