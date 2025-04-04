import { Button, Checkbox, Chip, Input } from '@nextui-org/react'
import React, { useState } from 'react'
import TextEditor from '../../text-editor'
import { MdiBin, MingcuteAddFill } from '../../icons/icons'
import { useFormikContext } from 'formik'

type ChoiceBoxProps = {
    number: number
}

const ChoiceBox: React.FC<ChoiceBoxProps> = ({ number }) => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()
    const [requiredInput, setRequiredInput] = useState<string>('')
    const [stateColor, setStateColor] = useState<'default' | 'danger' | 'warning' | 'secondary'>('default')

    const convertToAlphabet = (num: number) => String.fromCharCode(num + 'A'.charCodeAt(0))

    const handleRemoveChoice = () => {
        if (!values.choices) return
        setFieldValue('choices', values.choices.filter((_, i) => i !== number))
    }

    const handleToggleCorrectAnswer = (isSelected: boolean) => {
        if (!values.choices) return
        const choice = values.choices[number]

        if (!choice.content.trim()) {
            setRequiredInput('You must enter a choice first')
            setStateColor('danger')
            return
        }

        const isDupeChoice = new Set(values.choices.map(c => c.content)).size !== values.choices.length
        if (isDupeChoice) {
            setRequiredInput('You must have unique choices')
            setStateColor('warning')
            return
        }

        const newChoices = [...values.choices]
        newChoices[number] = { ...choice, isCorrect: isSelected }
        setFieldValue('choices', newChoices)
        setStateColor(isSelected ? 'secondary' : 'default')
        setRequiredInput('')
    }

    return (
        <div className="flex gap-x-6 w-full">
            <Chip
                color={values.choices?.[number]?.isCorrect ? 'secondary' : stateColor}
                variant="dot"
            >
                <span className='text-sm'>
                    {convertToAlphabet(number)}
                </span>
            </Chip>
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center pb-6">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            name={`choices.${number}.isCorrect`}
                            color="secondary"
                            isSelected={values.choices?.[number]?.isCorrect}
                            onValueChange={(isSelected) => handleToggleCorrectAnswer(isSelected)}
                            size="lg"
                        >
                            <span className={`text-tiny text-${stateColor}`}>{requiredInput ? requiredInput : 'Set as correct answer'}</span>
                        </Checkbox>
                    </div>
                    {number < 2 ? (
                        <span className="text-tiny text-foreground/50">Mandatory</span>
                    ) : (
                        <Button
                            size="sm"
                            color="danger"
                            isIconOnly
                            onPress={handleRemoveChoice}
                            isDisabled={number !== (values.choices?.length ?? 0) - 1}
                            startContent={<MdiBin />}
                        />
                    )}
                </div>
                <TextEditor 
                    name={`choices.${number}.content`} 
                    type='unnested' 
                    className="min-h-[100px] w-full" 
                />
            </div>
        </div>
    )
}

type MultipleChoiceFormProps = {}

const MultipleChoiceForm: React.FC<MultipleChoiceFormProps> = () => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()

    const handleAddChoice = () => {
        if (!values.choices) return
        setFieldValue('choices', [...values.choices, { content: '', isCorrect: false }])
    }

    return (
        <div className="px-10 flex flex-col gap-y-6">
            {values.choices?.map((_, idx) => (
                <ChoiceBox key={idx} number={idx} />
            ))}
            <Button
                variant="flat"
                color="secondary"
                startContent={<MingcuteAddFill />}
                size="sm"
                className="w-fit text-primary"
                onPress={handleAddChoice}
            >
                Add another answer
            </Button>
        </div>
    )
}

export default MultipleChoiceForm