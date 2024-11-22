import { Input, Radio, RadioGroup } from '@nextui-org/react'
import { useFormikContext } from 'formik'
import React, { useState } from 'react'

type Props = {}

const TrueOrFalseForm = (props: Props) => {
    const [select, setSelect] = useState<string | null>(null)
    const { values, setFieldValue } = useFormikContext<QuestionForm>()
    const onSelectChange = (e: string) => {
        setSelect(e)
        setFieldValue('answer', [e])
    }
    const onInputValueChange = (value: string) => {
        setFieldValue('choices', [value])
    }
    return (
        <div className='px-10 flex flex-col' >
            <RadioGroup defaultValue={select} onValueChange={onSelectChange}>
                <div className='flex gap-x-6'>
                    <div className=' flex flex-col gap-y-4 w-full'>
                        <Radio color='secondary' value="true">True</Radio>
                        <Input onValueChange={onInputValueChange} disabled={select == 'false' || select == null} className={`${select == 'true' && 'border border-secondary rounded-lg'}`} placeholder='Because ...'/>
                        <span className='text-tiny text-foreground/50'>Optional</span>
                    </div>
                    <div className='flex flex-col gap-y-4 w-full'>
                        <Radio color='secondary' value="false">False</Radio>
                        <Input onValueChange={onInputValueChange} disabled={select == 'true' || select == null} className={`${select == 'false' && 'border border-secondary rounded-lg'}`} placeholder='Because ...'/>
                        <span className='text-tiny text-foreground/50'>Optional</span>
                    </div>
                </div>
            </RadioGroup>
        </div>
    )
}

export default TrueOrFalseForm