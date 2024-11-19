import { questionTypes } from '@/constants/attribute'
import { useFormikContext } from 'formik'
import React from 'react'

type Props = {}

const QuestionTypeSelector = (props: Props) => {
    const { values, setFieldValue } = useFormikContext<QuestionForm>()
    const onSelectChange = (name: string) => {
        setFieldValue('type', name)
        if (name == 'mc') {
            setFieldValue('choices', ['', ''])
            return
        }
        setFieldValue('choices', [])
        setFieldValue('answer', [])
    }
    return (
        <ul className='flex items-center h-fit justify-center p-3 gap-x-3'>
            {
                questionTypes.map((item, idx: number) => (
                    <li className={`
                                    w-[18%] cursor-pointer border 
                                    ${values.type == item.name ? 'border-secondary' : 'border-secondary/20'} 
                                    flex flex-col gap-y-2 p-6 items-center justify-between`}
                        key={idx}

                        onClick={() => onSelectChange(item.name)}
                    >
                        {item.icon}
                        <span className='text-sm'>{item.content}</span>
                    </li>
                ))
            }
        </ul>
    )
}

export default QuestionTypeSelector