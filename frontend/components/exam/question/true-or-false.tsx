import { Input, Radio, RadioGroup } from '@nextui-org/react'
import React, { useState } from 'react'

type Props = {}

const TrueOrFalseForm = (props: Props) => {
    const [select, setSelect] = useState<string>('true')
    return (
        <div className='px-10 flex flex-col' >
            <RadioGroup defaultValue={select} onValueChange={setSelect}>
                <div className='flex gap-x-6'>
                    <div className=' flex flex-col gap-y-4 w-full'>
                        <Radio color='secondary' value="true">True</Radio>
                        <Input className={`${select == 'true' && 'border border-secondary rounded-lg'}`} placeholder='Because ...'/>
                        <span className='text-tiny text-foreground/50'>Optional</span>
                    </div>
                    <div className='flex flex-col gap-y-4 w-full'>
                        <Radio color='secondary' value="false">False</Radio>
                        <Input className={`${select == 'false' && 'border border-secondary rounded-lg'}`} placeholder='Because ...'/>
                        <span className='text-tiny text-foreground/50'>Optional</span>
                    </div>
                </div>
            </RadioGroup>
        </div>
    )
}

export default TrueOrFalseForm