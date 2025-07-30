
import { Input } from '@nextui-org/react'
import React, { useState, useMemo } from 'react'
import { PhEyeDuotone, PhEyeSlash } from '../icons/icons'
import { getPasswordRequirements } from '@/utils/auth-errors'

type Props = {
  name: string
  label?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  error?: string | null
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  showPasswordHints?: boolean
  isValid?: boolean
}

const PasswordInput = (props: Props) => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const toggleVisibility = () => setIsVisible(!isVisible)
  
  // Track individual password requirements
  const passwordRequirements = useMemo(() => {
    if (!props.showPasswordHints || !currentPassword) {
      return getPasswordRequirements().map(req => ({ text: req, met: false }))
    }
    
    return [
      { text: 'At least 8 characters', met: currentPassword.length >= 8 },
      { text: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(currentPassword) },
      { text: 'One lowercase letter (a-z)', met: /[a-z]/.test(currentPassword) },
      { text: 'One number (0-9)', met: /\d/.test(currentPassword) },
      { text: 'One special character (@$!%*?&)', met: /[@$!%*?&]/.test(currentPassword) }
    ]
  }, [currentPassword, props.showPasswordHints])
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value)
    if (props.onChange) {
      props.onChange(e)
    }
  }

  return (
    <div className="w-full">
      <Input
        size={props.size || 'md'}
        name={props.name}
        isRequired
        isInvalid={!!props.error}
        errorMessage={props.error || ''}
        label={props.label || "Password"}
        placeholder={props.placeholder || "Enter your password"}
        color={props.isValid ? "success" : "default"}
        classNames={{
          input: props.isValid ? "text-success" : "",
          inputWrapper: props.isValid ? "border-success data-[hover=true]:border-success group-data-[focus=true]:border-success" : ""
        }}
        endContent={
          <button
            className="focus:outline-none"
            type="button"
            onClick={toggleVisibility}
            aria-label="toggle password visibility"
          >
            {isVisible ? (
              <PhEyeSlash className={`text-2xl pointer-events-none ${
                props.isValid ? "text-success" : "text-default-400"
              }`} />
            ) : (
              <PhEyeDuotone className={`text-2xl pointer-events-none ${
                props.isValid ? "text-success" : "text-default-400"
              }`} />
            )}
          </button>
        }
        type={isVisible ? "text" : "password"}
        onChange={handlePasswordChange}
      />
      {props.showPasswordHints && (
        <div className="mt-2 text-xs">
          <p className="mb-2 text-default-500">Password must contain:</p>
          <ul className="space-y-1">
            {passwordRequirements.map((requirement, index) => (
              <li key={index} className={`flex items-center gap-2 ${
                requirement.met ? 'text-success' : 'text-default-500'
              }`}>
                <span className={`text-sm ${
                  requirement.met ? 'text-success' : 'text-default-400'
                }`}>
                  {requirement.met ? '✓' : '○'}
                </span>
                <span className={requirement.met ? 'font-medium' : ''}>
                  {requirement.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default PasswordInput
