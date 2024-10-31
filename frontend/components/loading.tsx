import React from 'react'

type Props = {}

const Loading = (props: Props) => {
  return (
    <div className='flex flex-col justify-center items-center animate-pulse pt-72'>
        <h1 className='text-9xl hero-foreground font-bold'>XAMS</h1>
        <span>きょういくざむす</span>
    </div>
  )
}

export default Loading