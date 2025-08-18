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
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 p-2 sm:p-3 content-center'>
            {
                questionTypes.map((item, idx: number) => (
                    <div className={`
                                    cursor-pointer border rounded-lg transition-all duration-200 hover:scale-105
                                    ${values.type == item.name ? 'border-secondary bg-secondary/10' : 'border-secondary/20 hover:border-secondary/40'} 
                                    flex flex-col gap-y-2 p-3 sm:p-4 lg:p-6 items-center justify-center min-h-[80px] sm:min-h-[100px]`}
                        key={idx}
                        onClick={() => onSelectChange(item.name)}
                    >
                        <div className="text-lg sm:text-xl lg:text-2xl">
                            {item.icon}
                        </div>
                        <span className='text-xs sm:text-sm text-center leading-tight'>{item.content}</span>
                    </div>
                ))
            }
        </div>
    )
}

export default QuestionTypeSelector