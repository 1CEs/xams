"use client"
import React from 'react'
import Form from './form'
import { DatePicker, Input } from '@nextui-org/react'
import PasswordInput from './password-input'

type Props = {}

const SignUpForm = (props: Props) => {
  return (
    <Form
      content='Sign Up'
      buttonContent='Sign Up'
      className=' w-1/3'
      isSignUp={true}
    >
      <div className='flex gap-x-3'>
        <Input name='firstName' size='sm' label="First name" placeholder='Enter your first name' isRequired/>
        <Input name='lastName' size='sm' label="Last name" placeholder='Enter your last name' isRequired/>
      </div>
      <DatePicker name='birth' size='sm' label='Birth date' showMonthAndYearPickers isRequired/>
      <Input name='username' size='sm' label='Username' placeholder='Enter your username' isRequired />
      <Input name='email' size='sm' label='Email' placeholder='Example@mail.com' isRequired />
      <div className='flex gap-x-3'>
        <PasswordInput size='sm' name="password" />
        <PasswordInput size='sm' label='Confirm password' placeholder='Enter your password again' name="confirmPassword" />
      </div>
    </Form>
  )
}

export default SignUpForm