import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Image, Link, Radio, RadioGroup } from '@nextui-org/react'
import React, { FormEvent } from 'react'
import fullLogo from '@/public/images/logo/full-logo.png'

type Props = {
    content: string
    children: React.ReactNode
    buttonContent: string
    className?: string
    isSignUp: boolean
}

const Form = (props: Props) => {
    const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        if(props.isSignUp) {
            const signUpFormEntries = Object.fromEntries(formData.entries())
            const signUpPayload: UserSignUpPayload | any = {
                ...signUpFormEntries,
                info: {
                    firstName: signUpFormEntries.firstName as string,
                    lastName: signUpFormEntries.lastName as string,
                    birth: signUpFormEntries.birth as unknown as Date
                }
            }
            {
                delete signUpPayload.firstName
                delete signUpPayload.lastName
                delete signUpPayload.birth

            }
            console.log(signUpPayload)
        }

    }

    return (
        <form onSubmit={onFormSubmit} className={props.className}>
            <Card>
                <CardHeader className='justify-center flex-col'>
                    <Image fetchPriority='high' src={fullLogo.src} width={200} />
                    <p>きょういくざむす</p>
                </CardHeader>
                <CardBody className='flex-col gap-y-3'>
                    {props.children}
                </CardBody>
                <CardFooter className='flex-col gap-y-6'>
                    <div className='size-full flex justify-between items-center'>
                        <Button type='submit' className='hero-background text-background' color='primary'>{props.buttonContent}</Button>
                        {props.isSignUp ?
                            <div className='flex justify-between items-center gap-x-5'>
                                <span className='text-tiny text-white/50'>Sign up as a </span>
                                <RadioGroup name='role' size='sm' defaultValue='student' orientation='horizontal'>
                                    <Radio value='student'>Student</Radio>
                                    <Radio value='instructor'>Instructor</Radio>
                                </RadioGroup>
                            </div>
                            :
                            <Link href="#" size='sm'>Forgot password</Link>
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