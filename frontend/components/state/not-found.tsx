import React from 'react'

type NotFoundProps = {
    content: string
}

const NotFound: React.FC<NotFoundProps> = ({content}) => {
  return (
    <div className='flex flex-col justify-center items-center pt-72 gap-y-3'>
        <h1 className='text-6xl font-bold hero-foreground'>Content Not Found</h1>
        <p className='text-gray-400'>Cannot find any content of {content}</p>
    </div>
  )
}

export default NotFound