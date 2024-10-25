import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Image, Link, Radio, RadioGroup } from '@nextui-org/react'
import React, { DOMElement } from 'react'
import fullLogo from '@/public/images/logo/full-logo.png'

type Props = {
    content: string
    children: React.ReactNode
    buttonContent: string
    className?: string
    isSignUp: boolean
}

const Form = (props: Props) => {
    return (
        <form className={props.className}>
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
                        <Button className='hero-background text-background' color='primary'>{props.buttonContent}</Button>
                        {props.isSignUp ?
                            <div className='flex justify-between items-center gap-x-5'>
                                <span className='text-tiny text-white/50'>Sign up as a </span>
                                <RadioGroup size='sm' defaultValue='student' orientation='horizontal'>
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