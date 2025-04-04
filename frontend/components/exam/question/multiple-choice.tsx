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
        setFieldValue('choices', values.choices.filter((_, i) => i !== number))
    }

    const calculatePercentages = (currentAnswers: string[]) => {
        const checkedCount = currentAnswers.length
        if (checkedCount === 0) return {}
        
        const percentage = 100 / checkedCount
        const percentages: Record<number, number> = {}
        
        values.choices.forEach((choice, idx) => {
            if (currentAnswers.includes(choice)) {
                percentages[idx] = percentage
            }
        })
        
        return percentages
    }

    const handleToggleCorrectAnswer = (isSelected: boolean) => {
        const choiceValue = values.choices[number]

        if (choiceValue.replace(/<(?:.|\n)*?>/gm, '') == '') {
            setRequiredInput('You must enter a choice first')
            setStateColor('danger')
            return
        }

        const isDupeChoice = new Set(values.choices).size !== values.choices.length
        if (isDupeChoice) {
            setRequiredInput('You must have unique choices')
            setStateColor('warning')
            return
        }

        let newAnswers: string[]
        if (isSelected) {
            newAnswers = [...values.answer, choiceValue]
            setFieldValue('answer', newAnswers)
            setStateColor('secondary')
        } else {
            newAnswers = values.answer.filter((ans) => ans !== choiceValue)
            setFieldValue('answer', newAnswers)
            setStateColor('default')
        }

        // Calculate and update percentages for all correct answers
        const percentages = calculatePercentages(newAnswers)
        setFieldValue('percentages', percentages)
        
        setRequiredInput('')
    }

    return (
        <div className="flex gap-x-6 w-full">
            <Chip
                color={values.answer.includes(values.choices[number]) ? 'secondary' : stateColor }
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
                            name={`choices.${number}.is_correct`}
                            color="secondary"
                            isSelected={values.answer.includes(values.choices[number])}
                            onValueChange={(isSelected) => handleToggleCorrectAnswer(isSelected)}
                            size="lg"
                        >
                            <span className={`text-tiny text-${stateColor}`}>{requiredInput ? requiredInput : 'Set as correct answer'}</span>
                        </Checkbox>
                        {values.answer.includes(values.choices[number]) && (
                            <Input
                                type="number"
                                size="sm"
                                min={-100}
                                max={100}
                                value={values.percentages?.[number]?.toString() || '0'}
                                isReadOnly
                                className="w-20"
                                classNames={{
                                    input: "text-center"
                                }}
                            />
                        )}
                    </div>
                    {number < 2 ? (
                        <span className="text-tiny text-foreground/50">Mandatory</span>
                    ) : (
                        <Button
                            size="sm"
                            color="danger"
                            isIconOnly
                            onPress={handleRemoveChoice}
                            isDisabled={number !== values.choices.length - 1}
                            startContent={<MdiBin />}
                        />
                    )}
                </div>
                <TextEditor name={`choices.${number}`} type='unnested' className="min-h-[100px] w-full" />
            </div>
        </div>
    )
}

type MultipleChoiceFormProps = {}

const MultipleChoiceForm: React.FC<MultipleChoiceFormProps> = () => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()

    const handleAddChoice = () => {
        setFieldValue('choices', [...values.choices, ''])
    }

    return (
        <div className="px-10 flex flex-col gap-y-6">
            {values.choices.map((_, idx) => (
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