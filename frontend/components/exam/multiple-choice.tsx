import { Button, Checkbox, Chip } from '@nextui-org/react'
import React, { Dispatch, useState } from 'react'
import TextEditor from '../text-editor'
import { MdiBin, MingcuteAddFill } from '../icons/icons'
import { useFormikContext } from 'formik'

type Props = {}

const ChoiceBox = (
    { number }:
        { number: number }
) => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()
    const convertToAlphabet = (num: number) => String.fromCharCode(num + 'A'.charCodeAt(0))

    return (
        <div className='flex gap-x-6 w-full'>
            <Chip color={values.choices[number].is_correct ? 'secondary' : 'default'} variant='dot'>{convertToAlphabet(number)}</Chip>
            <div className='flex flex-col w-full'>
                <div className='flex justify-between items-center pb-6'>
                    <Checkbox
                        name={`choices.${number}.is_correct`}
                        color='secondary'
                        isSelected={values.choices[number].is_correct}
                        onValueChange={(isSelected) => {
                            const updatedChoices = [...values.choices]
                            updatedChoices[number].is_correct = isSelected
                            setFieldValue('choices', updatedChoices)
                        }}
                        size='lg'>
                        <span className='text-tiny'>Set as correct answer</span>
                    </Checkbox>
                    {
                        number < 2 ? <span className='text-tiny text-foreground/50'>Mandatory</span> :
                            <Button
                                size='sm'
                                color='danger'
                                isIconOnly onPress={() => setFieldValue('choices', values.choices.filter((_, i) => i !== number))}
                                isDisabled={number != values.choices.length - 1}
                                startContent={<MdiBin />}
                            ></Button>
                    }
                </div>

                <TextEditor name={`choices.${number}`} className='min-h-[100px] w-full' />
            </div>
        </div>
    )
}

const MultipleChoiceForm = (props: Props) => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()
    const handleAddChoice = () => {
        
        const newChoice = {
            content: '',
            number: values.choices.length + 1,
            is_correct: false,
        };
        setFieldValue('choices', [...values.choices, newChoice]);
        
    };


    return (
        <div className='px-10 flex flex-col gap-y-6'>
            {
                values.choices.map((choice, idx) => (
                    <ChoiceBox key={idx} number={idx} />
                ))
            }
            <Button
                variant='flat'
                color='secondary'
                startContent={<MingcuteAddFill />}
                size='sm' className='w-fit text-primary'
                onPress={handleAddChoice}
            >Add another answer</Button>
        </div>
    )
}

export default MultipleChoiceForm