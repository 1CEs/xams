import { Input } from '@nextui-org/react'
import React from 'react'

type Props = {}

const ShortEssayForm = (props: Props) => {
  return (
    <div className='flex gap-x-4 px-10'>
        <Input placeholder='Enter your answer' maxLength={150}/>
    </div>
  )
}

export default ShortEssayForm