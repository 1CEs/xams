"use client"

import React from 'react'
import Form from './form'
import { Input } from '@nextui-org/react'
import PasswordInput from './password-input'

type Props = {}

const SignInForm = (props: Props) => {

    return (
        <Form
            isSignUp={false}
            content='Sign In'
            buttonContent='Sign In'
            className='w-full max-w-md sm:max-w-lg lg:max-w-xl'
        >
            <Input name='identifier' type='text' label='Email or Username' placeholder='Enter your email or username' required isRequired />
            <PasswordInput name='password' />
        </Form>
    )
}

export default SignInForm