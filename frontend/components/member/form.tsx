import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Image, Link, Radio, RadioGroup } from '@nextui-org/react'
import React, { FormEvent, useState } from 'react'
import fullLogo from '@/public/images/logo/full-logo.png'
import { isAxiosError } from 'axios'
import { useUserStore } from '@/stores/user.store'
import { useRouter } from 'nextjs-toploader/app'
import { useCookies } from 'next-client-cookies'
import { clientAPI } from '@/config/axios.config'
import { toast } from 'react-toastify'
import { getAuthErrorMessage, AUTH_ERROR_MESSAGES, isValidEmail, isValidPassword } from '@/utils/auth-errors'

type Props = {
    content: string
    children: React.ReactNode
    buttonContent: string
    className?: string
    isSignUp: boolean
}

const Form = (props: Props) => {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const { user, setUser } = useUserStore()
    const router = useRouter()
    const cookies = useCookies()

    const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        
        const formData = new FormData(e.currentTarget)
        
        // Client-side validation before API call
        if (props.isSignUp) {
            const signUpData = Object.fromEntries(formData.entries())
            
            // Validate required fields
            if (!signUpData.first_name) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNUP.FIRST_NAME_REQUIRED
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
            
            if (!signUpData.last_name) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNUP.LAST_NAME_REQUIRED
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
            
            if (!signUpData.username) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNUP.USERNAME_REQUIRED
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
            
            if (!signUpData.email) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNUP.EMAIL_REQUIRED
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
            
            if (!signUpData.password) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNUP.PASSWORD_REQUIRED
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
            
            if (!signUpData.confirmPassword) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNUP.CONFIRM_PASSWORD_REQUIRED
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
            
            // Validate password match
            if (signUpData.password !== signUpData.confirmPassword) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNUP.PASSWORDS_NOT_MATCH
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
            
            // Validate email format
            if (!isValidEmail(signUpData.email as string)) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNUP.INVALID_EMAIL
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
            
            // Validate password strength
            if (!isValidPassword(signUpData.password as string)) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNUP.WEAK_PASSWORD
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
        } else {
            const signInData = Object.fromEntries(formData.entries())
            
            // Validate required fields for sign-in
            if (!signInData.identifier) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNIN.IDENTIFIER_REQUIRED
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
            
            if (!signInData.password) {
                const errorMsg = AUTH_ERROR_MESSAGES.SIGNIN.PASSWORD_REQUIRED
                toast.error(errorMsg)
                setError(errorMsg)
                setLoading(false)
                return
            }
        }
        
        try {
            // FormData already created above
            if (props.isSignUp) {
                const signUpFormEntries = Object.fromEntries(formData.entries())

                const signUpPayload: UserSignUpPayload | any = {
                    ...signUpFormEntries,
                    info: {
                        first_name: signUpFormEntries.first_name as string,
                        last_name: signUpFormEntries.last_name as string
                    },
                    profile_url: 'https://miscmedia-9gag-fun.9cache.com/images/thumbnail-facebook/1656473044.0987_Y3UVY8_n.jpg'
                }

                delete signUpPayload.first_name
                delete signUpPayload.last_name
                const res = await clientAPI.post('auth/sign-up', signUpPayload)
                const userData = res.data.data as UserResponse
                setUser(userData)
                
                // Set cookie with the user data from the API response
                const oneDay = 24 * 60 * 60 * 1000
                cookies.set('user', JSON.stringify(userData), { expires: Date.now() + oneDay})
                
                // Show success message from backend
                toast.success(res.data.message || AUTH_ERROR_MESSAGES.SIGNUP.SUCCESS)

            } else {
                const signInFormEntries = Object.fromEntries(formData.entries())
                const res = await clientAPI.post('auth/sign-in', signInFormEntries)
                const userData = res.data.data as UserResponse
                
                // Add login time for session monitoring
                const userDataWithLoginTime = {
                    ...userData,
                    loginTime: Date.now()
                }
                
                setUser(userDataWithLoginTime)
                
                // Set cookie with the user data from the API response
                const oneDay = 24 * 60 * 60 * 1000
                cookies.set('user', JSON.stringify(userDataWithLoginTime), { expires: Date.now() + oneDay})
                
                // Show success message from backend
                toast.success(res.data.message || AUTH_ERROR_MESSAGES.SIGNIN.SUCCESS)
            }
            
            // Use replace instead of push to prevent back navigation to login
            // Add a small delay to ensure cookies are set before redirect
            setTimeout(() => {
                router.replace('/overview')
            }, 100)
        } catch (error) {
            if (isAxiosError(error)) {
                const errorData = error.response?.data
                let userFriendlyMessage = ''
                
                // Use centralized error message handling
                userFriendlyMessage = getAuthErrorMessage(errorData, props.isSignUp)
                
                // Handle legacy string-based errors if no message was found
                if (userFriendlyMessage === 'An unexpected error occurred') {
                    const splitWords = errorData?.split?.(" ") || []
                    if (splitWords[0] === 'E11000') {
                        userFriendlyMessage = AUTH_ERROR_MESSAGES.SIGNUP.ACCOUNT_EXISTS
                    } else {
                        userFriendlyMessage = error.response?.statusText || AUTH_ERROR_MESSAGES.GENERAL.UNEXPECTED_ERROR
                    }
                }
                
                // Show user-friendly error message
                if (userFriendlyMessage) {
                    toast.error(userFriendlyMessage)
                    setError(userFriendlyMessage)
                } else {
                    const errorMsg = AUTH_ERROR_MESSAGES.GENERAL.UNEXPECTED_ERROR
                    toast.error(errorMsg)
                    setError(errorMsg)
                }
            } else {
                // Handle non-axios errors
                const errorMessage = AUTH_ERROR_MESSAGES.GENERAL.UNEXPECTED_ERROR
                toast.error(errorMessage)
                setError(errorMessage)
            }

        } finally {
            setLoading(false)
        }
    }


    return (
        <form onSubmit={onFormSubmit} className={props.className}>
            <Card >
                <CardHeader className='justify-center flex-col'>
                    <Image src={fullLogo.src} width={200} fallbackSrc="https://placehold.co/500x400/353535/FFFFFF/webp?text=Loading"/>
                    <p>きょういくざむす</p>
                </CardHeader>
                <CardBody className='flex-col gap-y-3'>
                    {error && <span className='text-danger text-tiny'>*{error}</span>}
                    {props.children}
                </CardBody>
                <CardFooter className='flex-col gap-y-6'>
                    <div className='size-full flex justify-between items-center'>
                        <Button isDisabled={loading} isLoading={loading} type='submit' className='hero-background text-background' color='primary'>{loading ? null : props.buttonContent}</Button>
                        {props.isSignUp ?
                            <div className='flex justify-between items-center gap-x-5'>
                                <span className='text-tiny text-white/50'>Sign up as a </span>
                                <RadioGroup name='role' size='sm' defaultValue='student' orientation='horizontal'>
                                    <Radio value='student'>Student</Radio>
                                    <Radio value='instructor'>Instructor</Radio>
                                </RadioGroup>
                            </div>
                            :
                            <Link href="/member/forgot-password" size='sm'>Forgot password</Link>
                        }
                    </div>
                    <Divider />
                    <div className='flex gap-x-4 pb-3 text-sm items-center'>
                        <span className='text-white/30'>{props.isSignUp ? 'Already have an account?' : `Don't have an accounr?`}</span>
                        <Link className='hero-foreground' href={`/member/${props.isSignUp ? 'sign-in' : 'sign-up'}`}>{props.isSignUp ? 'Sign In' : 'Sign Up'}</Link>
                    </div>
                </CardFooter>
            </Card>
        </form>
    )
}

export default Form
