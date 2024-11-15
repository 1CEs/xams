"use client"
import React, { useState } from 'react'
import Form from './form'
import { DatePicker, Input } from '@nextui-org/react'
import PasswordInput from './password-input'

const SignUpForm = () => {
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [passwordMatchError, setPasswordMatchError] = useState<string>('')

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
      <DatePicker name='birth' size='sm' label='Birth date' showMonthAndYearPickers isRequired/>
      <Input name='username' size='sm' label='Username' placeholder='Enter your username' isRequired />
      <Input type='email' name='email' size='sm' label='Email' placeholder='Example@mail.com' isRequired />
      <div className='flex gap-x-3'>
        <PasswordInput size='sm' name="password" onChange={handlePasswordChange} />
        <PasswordInput
          size='sm'
          name="confirmPassword"
          label="Confirm password"
          placeholder="Enter your password again"
          onChange={handleConfirmPasswordChange}
          error={passwordMatchError}
        />
      </div>
    </Form>
  )
}

export default SignUpForm
