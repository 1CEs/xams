"use client"

import React, { useState } from 'react'
import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Input, Link } from '@nextui-org/react'
import { clientAPI } from '@/config/axios.config'
import { errorHandler } from '@/utils/error'
import { toast } from 'react-toastify'
import { useRouter } from 'nextjs-toploader/app'
import { useSearchParams } from 'next/navigation'
import ResetPassword from '@/public/images/reset-password.png'
import { Image } from '@nextui-org/react'
import PasswordInput from '@/components/member/password-input'

type Props = {}

const ResetPasswordPage = (props: Props) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMatchError, setPasswordMatchError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setPasswordMatchError('')
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    if (password && e.target.value !== password) {
      setPasswordMatchError("Passwords do not match")
    } else {
      setPasswordMatchError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error('Invalid reset link')
      router.push('/member/sign-in')
      return
    }

    if (password !== confirmPassword) {
      setPasswordMatchError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      await clientAPI.post('/auth/reset-password', { 
        token,
        password 
      })
      toast.success('Password has been reset successfully')
      router.push('/member/sign-in')
    } catch (error) {
      errorHandler(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 sm:px-8">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="flex flex-col gap-1 px-4 sm:px-6">
          <h1 className="text-xl sm:text-2xl font-bold">Reset Password</h1>
          <p className="text-sm sm:text-tiny text-foreground-500">
            Enter your new password and confirm it to reset your password.
          </p>
        </CardHeader>
        <Divider />
        <form onSubmit={handleSubmit}>
          <CardBody className="flex flex-col gap-4 px-4 sm:px-6">
            <PasswordInput
              name="password"
              label="New Password"
              placeholder="Enter your new password"
              onChange={handlePasswordChange}
              size="sm"
            />
            <PasswordInput
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Enter your password again"
              onChange={handleConfirmPasswordChange}
              error={passwordMatchError}
              size="sm"
            />
          </CardBody>
          <Divider />
          <CardFooter className="flex flex-col gap-4 px-4 sm:px-6">
            <Button
              type="submit"
              color="secondary"
              className="w-full"
              isLoading={isLoading}
              isDisabled={!password || !confirmPassword || !!passwordMatchError}
              size="sm"
            >
              Reset Password
            </Button>
            <div className="flex justify-center gap-1 text-xs sm:text-sm">
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

export default ResetPasswordPage