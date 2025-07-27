import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Image, Link, Radio, RadioGroup } from '@nextui-org/react'
import React, { FormEvent, useState } from 'react'
import fullLogo from '@/public/images/logo/full-logo.png'
import { isAxiosError } from 'axios'
import { useUserStore } from '@/stores/user.store'
import { useRouter } from 'nextjs-toploader/app'
import { useCookies } from 'next-client-cookies'
import { clientAPI } from '@/config/axios.config'
import { toast } from 'react-toastify'

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
        console.log('asdasd')
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const formData = new FormData(e.currentTarget)
            if (props.isSignUp) {
                const signUpFormEntries = Object.fromEntries(formData.entries())

                const signUpPayload: UserSignUpPayload | any = {
                    ...signUpFormEntries,
                    info: {
                        first_name: signUpFormEntries.first_name as string,
                        last_name: signUpFormEntries.last_name as string,
                        birth: signUpFormEntries.birth
                    },
                    profile_url: 'https://miscmedia-9gag-fun.9cache.com/images/thumbnail-facebook/1656473044.0987_Y3UVY8_n.jpg'
                }

                delete signUpPayload.first_name
                delete signUpPayload.last_name
                delete signUpPayload.birth
                const res = await clientAPI.post('auth/sign-up', signUpPayload)
                const userData = res.data.data as UserResponse
                setUser(userData)
                
                // Set cookie with the user data from the API response
                const oneDay = 24 * 60 * 60 * 1000
                cookies.set('user', JSON.stringify(userData), { expires: Date.now() + oneDay})
                console.log("dadasdxx")

            } else {
                const signInFormEntries = Object.fromEntries(formData.entries())
                const res = await clientAPI.post('auth/sign-in', signInFormEntries)
                const userData = res.data.data as UserResponse
                setUser(userData)
                
                // Set cookie with the user data from the API response
                const oneDay = 24 * 60 * 60 * 1000
                cookies.set('user', JSON.stringify(userData), { expires: Date.now() + oneDay})
                
                // Show success message
                toast.success('Sign in successful!')
            }
            
            // Use replace instead of push to prevent back navigation to login
            // Add a small delay to ensure cookies are set before redirect
            setTimeout(() => {
                router.replace('/overview')
            }, 100)
        } catch (error) {
            if (isAxiosError(error)) {
                const splitWords = error.response?.data.split(" ")
                if (splitWords[0] === 'E11000') {
                    toast.error('Username or Email is already exists')
                } else {
                    toast.error(error.response?.statusText)
                }
                
        
                const { err, errors } = error.response?.data || {};
                
                if (err) {
                    setError(err.message);
                } else if (errors?.length) {
                    setError(errors[0].schema.description);
                }
            }

        } finally {
            setLoading(false)
        }
    }


    return (
        <form onSubmit={onFormSubmit} className={props.className}>
            <Card className='w-full'>
                <CardHeader className='justify-center flex-col p-4 sm:p-6'>
                    <Image 
                        src={fullLogo.src} 
                        width={150} 
                        className='w-32 sm:w-40 md:w-48 lg:w-52'
                        fallbackSrc="https://placehold.co/500x400/353535/FFFFFF/webp?text=Loading"
                    />
                    <p className='text-sm sm:text-base mt-2'>きょういくざむす</p>
                </CardHeader>
                <CardBody className='flex-col gap-y-4 p-4 sm:p-6'>
                    {error && <span className='text-danger text-xs sm:text-sm'>*{error}</span>}
                    <div className='space-y-4'>
                        {props.children}
                    </div>
                </CardBody>
                <CardFooter className='flex-col gap-y-4 sm:gap-y-6 p-4 sm:p-6'>
                    <div className='w-full flex flex-col sm:flex-row justify-between items-center gap-4'>
                        <Button 
                            isDisabled={loading} 
                            isLoading={loading} 
                            type='submit' 
                            className='hero-background text-background w-full sm:w-auto min-w-[120px]' 
                            color='primary'
                            size='md'
                        >
                            {loading ? null : props.buttonContent}
                        </Button>
                        {props.isSignUp ?
                            <div className='flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4'>
                                <span className='text-xs sm:text-sm text-white/50'>Sign up as a</span>
                                <RadioGroup 
                                    name='role' 
                                    size='sm' 
                                    defaultValue='student' 
                                    orientation='horizontal'
                                    classNames={{
                                        wrapper: "gap-2 sm:gap-4"
                                    }}
                                >
                                    <Radio value='student' classNames={{ label: "text-xs sm:text-sm" }}>Student</Radio>
                                    <Radio value='instructor' classNames={{ label: "text-xs sm:text-sm" }}>Instructor</Radio>
                                </RadioGroup>
                            </div>
                            :
                            <Link href="/member/forgot-password" size='sm' className='text-xs sm:text-sm'>Forgot password</Link>
                        }
                    </div>
                    <Divider />
                    <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 pb-3 text-xs sm:text-sm items-center justify-center'>
                        <span className='text-white/30 text-center'>{props.isSignUp ? 'Already have an account?' : `Don't have an account?`}</span>
                        <Link 
                            className='hero-foreground text-xs sm:text-sm font-medium' 
                            href={`/member/${props.isSignUp ? 'sign-in' : 'sign-up'}`}
                        >
                            {props.isSignUp ? 'Sign In' : 'Sign Up'}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </form>
    )
}

export default Form
