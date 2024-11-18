import TextEditor from '@/components/text-editor'
import React from 'react'

type Props = {}

const LongEssayForm = (props: Props) => {
  return (
    <div className='px-10'>
        <TextEditor name={`choices`} className='min-h-[100px] w-full' />
    </div>
  )
}

export default LongEssayForm