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
      className='w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl'
      isSignUp={true}
    >
      <div className='flex flex-col sm:flex-row gap-3'>
        <Input name='first_name' size='sm' label="First name" placeholder='Enter your first name' isRequired className='flex-1'/>
        <Input name='last_name' size='sm' label="Last name" placeholder='Enter your last name' isRequired className='flex-1'/>
      </div>
      <DatePicker name='birth' size='sm' label='Birth date' showMonthAndYearPickers isRequired/>
      <Input name='username' size='sm' label='Username' placeholder='Enter your username' isRequired />
      <Input type='email' name='email' size='sm' label='Email' placeholder='Example@mail.com' isRequired />
      <div className='flex flex-col sm:flex-row gap-3'>
        <div className='flex-1'>
          <PasswordInput size='sm' name="password" onChange={handlePasswordChange} />
        </div>
        <div className='flex-1'>
          <PasswordInput
            size='sm'
            name="confirmPassword"
            label="Confirm password"
            placeholder="Enter your password again"
            onChange={handleConfirmPasswordChange}
            error={passwordMatchError}
          />
        </div>
      </div>
    </Form>
  )
}

export default SignUpForm
