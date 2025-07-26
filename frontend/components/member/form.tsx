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
