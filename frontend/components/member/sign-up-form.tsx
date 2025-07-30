"use client"
import React, { useState } from 'react'
import Form from './form'
import { Input } from '@nextui-org/react'
import PasswordInput from './password-input'
import { isValidPassword } from '@/utils/auth-errors'

const SignUpForm = () => {
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [passwordMatchError, setPasswordMatchError] = useState<string>('')
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(false)
  const [isPasswordsMatch, setIsPasswordsMatch] = useState<boolean>(false)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordMatchError('')
    
    // Check if password meets the requirements
    setIsPasswordValid(isValidPassword(newPassword))
    
    // Re-validate confirm password if it exists
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordMatchError("Passwords do not match")
      setIsPasswordsMatch(false)
    } else if (confirmPassword && newPassword === confirmPassword) {
      setPasswordMatchError('')
      setIsPasswordsMatch(true)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value
    setConfirmPassword(newConfirmPassword)
    
    if (password && newConfirmPassword !== password) {
      setPasswordMatchError("Passwords do not match")
      setIsPasswordsMatch(false)
    } else if (password && newConfirmPassword === password) {
      setPasswordMatchError('')
      setIsPasswordsMatch(true)
    } else {
      setIsPasswordsMatch(false)
    }
  }

  return (
    <Form
      content='Sign Up'
      buttonContent='Sign Up'
      className='w-1/3'
      isSignUp={true}
    >
      <div className='flex gap-x-3'>
        <Input name='first_name' size='sm' label="First name" placeholder='Enter your first name' isRequired/>
        <Input name='last_name' size='sm' label="Last name" placeholder='Enter your last name' isRequired/>
      </div>
      <Input name='username' size='sm' label='Username' placeholder='Enter your username' isRequired />
      <Input type='email' name='email' size='sm' label='Email' placeholder='Example@mail.com' isRequired />
      <div className='flex gap-x-3'>
        <PasswordInput 
          size='sm' 
          name="password" 
          onChange={handlePasswordChange} 
          showPasswordHints={true}
          isValid={isPasswordValid}
        />
        <PasswordInput
          size='sm'
          name="confirmPassword"
          label="Confirm password"
          placeholder="Enter your password again"
          onChange={handleConfirmPasswordChange}
          error={passwordMatchError}
          isValid={isPasswordsMatch && !passwordMatchError}
        />
      </div>
    </Form>
  )
}

export default SignUpForm
