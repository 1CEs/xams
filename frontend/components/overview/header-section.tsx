import { Button } from '@nextui-org/react'
import React from 'react'

type Props = {
    content: string
    buttonContent: string
}

const HeaderSection = (props: Props) => {
  return (
    <div className='flex justify-between py-8 items-center'>
        <h1 className='text-3xl font-bold hero-foreground'>{props.content}</h1>
        <Button color='primary' variant='bordered'>{props.buttonContent}</Button>
    </div>
  )
}

export default HeaderSection