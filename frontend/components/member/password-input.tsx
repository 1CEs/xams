
import { Input } from '@nextui-org/react'
import React, { useState } from 'react'
import { PhEyeDuotone, PhEyeSlash } from '../icons/icons'

type Props = {
  name: string
  label?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  error?: string | null
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const PasswordInput = (props: Props) => {
  const [isVisible, setIsVisible] = useState(false)
  const toggleVisibility = () => setIsVisible(!isVisible)

  return (
    <Input
      size={props.size || 'md'}
      name={props.name}
      isRequired
      isInvalid={!!props.error}
      errorMessage={props.error || ''}
      label={props.label || "Password"}
      placeholder={props.placeholder || "Enter your password"}
      endContent={
        <button
          className="focus:outline-none"
          type="button"
          onClick={toggleVisibility}
          aria-label="toggle password visibility"
        >
          {isVisible ? (
            <PhEyeSlash className="text-2xl text-default-400 pointer-events-none" />
          ) : (
            <PhEyeDuotone className="text-2xl text-default-400 pointer-events-none" />
          )}
        </button>
      }
      type={isVisible ? "text" : "password"}
      onChange={props.onChange}
    />
  )
}

export default PasswordInput
