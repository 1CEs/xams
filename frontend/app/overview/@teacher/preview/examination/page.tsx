import React from 'react'

type Props = {}

const PreviewExaminationPage = (props: Props) => {
  return (
    <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-2'>
            <h1 className='text-2xl font-bold'>Sorry, this feature is not available yet</h1>
            <p className='text-sm text-muted-foreground'>We are working on it</p>
        </div>
    </div>
  )
}

export default PreviewExaminationPage