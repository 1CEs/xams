import { Button, Checkbox, Chip } from '@nextui-org/react'
import React, { Dispatch, useState } from 'react'
import TextEditor from '../text-editor'
import { MdiBin, MingcuteAddFill } from '../icons/icons'

type Props = {}

const ChoiceBox = (
    { number, choiceCount, setChoiceCount }:
        { number: number, choiceCount: number, setChoiceCount: Dispatch<React.SetStateAction<number>> }
) => {
    const [isSelected, setIsSelected] = useState<boolean>(false)

    const convertToAlphabet = (num: number) => String.fromCharCode(num + 'A'.charCodeAt(0))

    return (
        <div className='flex gap-x-6 w-full'>
            <Chip color={isSelected ? 'secondary' : 'default'} variant='dot'>{convertToAlphabet(number)}</Chip>
            <div className='flex flex-col w-full'>
                <div className='flex justify-between items-center pb-6'>
                    <Checkbox
                        color='secondary'
                        isSelected={isSelected}
                        onValueChange={setIsSelected}
                        size='lg'>
                        <span className='text-tiny'>Set as correct answer</span>
                    </Checkbox>
                    {
                        number < 2 ? <span className='text-tiny text-foreground/50'>Mandatory</span> :
                            <Button
                                size='sm'
                                color='danger'
                                isIconOnly onPress={() => setChoiceCount(prev => prev - 1)}
                                isDisabled={number != choiceCount - 1}
                                startContent={<MdiBin />}
                            ></Button>
                    }
                </div>

                <TextEditor className='min-h-[100px] w-full' />
            </div>
        </div>
    )
}

const MultipleChoiceForm = (props: Props) => {
    const [choiceCount, setChoiceCount] = useState<number>(2)
    return (
        <div className='px-10 flex flex-col gap-y-6'>
            {
                Array.from({ length: choiceCount }).map((_, idx: number) => (
                    <ChoiceBox choiceCount={choiceCount} setChoiceCount={setChoiceCount} key={idx} number={idx} />
                ))
            }
            <Button
                variant='flat'
                color='secondary'
                startContent={<MingcuteAddFill />}
                size='sm' className='w-fit text-primary'
                onPress={() => setChoiceCount(prev => prev + 1)}
            >Add another answer</Button>
        </div>
    )
}

export default MultipleChoiceForm