import { Button, Checkbox, Chip, Input, Radio } from '@nextui-org/react'
import React, { useEffect, useState } from 'react'
import TextEditor from '../../text-editor'
import { MdiBin, MingcuteAddFill } from '../../icons/icons'
import { useFormikContext } from 'formik'

type ChoiceBoxProps = {
    number: number
    correctCount: number
}

const ChoiceBox: React.FC<ChoiceBoxProps> = ({ number, correctCount }) => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()
    const [requiredInput, setRequiredInput] = useState<string>('')
    const [stateColor, setStateColor] = useState<'default' | 'danger' | 'warning' | 'secondary'>('default')
    
    // Get current choices with fallback
    const currentChoices = values.choices || []

    const convertToAlphabet = (num: number) => String.fromCharCode(num + 'A'.charCodeAt(0))

    const handleRemoveChoice = () => {
        setFieldValue('choices', currentChoices.filter((_: any, i: number) => i !== number))
    }

    const handleToggleCorrectAnswer = (isSelected: boolean) => {
        const choice = currentChoices[number]

        if (!choice.content.trim()) {
            setRequiredInput('You must enter a choice first')
            setStateColor('danger')
            return
        }

        const isDupeChoice = new Set(currentChoices.map((c: any) => c.content)).size !== currentChoices.length
        if (isDupeChoice) {
            setRequiredInput('You must have unique choices')
            setStateColor('warning')
            return
        }

        const newChoices = [...currentChoices]
        newChoices[number] = { ...choice, isCorrect: isSelected }
        
        // Calculate new correct count after this change
        const newCorrectCount = newChoices.filter(c => c.isCorrect).length
        
        // Update scores for all choices based on new correct count
        if (newCorrectCount > 0) {
            newChoices.forEach((c, index) => {
                if (c.isCorrect) {
                    newChoices[index] = { ...c, score: values.score / newCorrectCount }
                } else {
                    newChoices[index] = { ...c, score: (values.score / newCorrectCount) * -1 }
                }
            })
        }
        
        setFieldValue('choices', newChoices)
        setStateColor(isSelected ? 'secondary' : 'default')
        setRequiredInput('')
    }

    return (
        <div className="flex gap-x-6 w-full">
            <Chip
                color={currentChoices[number]?.isCorrect ? 'secondary' : stateColor}
                variant="dot"
            >
                <span className='text-sm'>
                    {convertToAlphabet(number)}
                </span>
            </Chip>
            <div className="flex flex-col w-full">
                <div className="flex justify-between items-center pb-6">
                    <div className="flex gap-2 gap-x-8 w-full ">
                        <Checkbox
                            name={`choices.${number}.isCorrect`}
                            color="secondary"
                            isSelected={currentChoices[number]?.isCorrect}
                            onValueChange={(isSelected) => handleToggleCorrectAnswer(isSelected)}
                            size="lg"
                        >
                            <span className={`text-tiny text-${stateColor}`}>{requiredInput ? requiredInput : 'Set as correct answer'}</span>
                        </Checkbox>
                        {correctCount > 1 &&
                            <Input
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-small">Score:</span>
                                    </div>
                                }
                                disabled={true}
                                className='w-[135px] min-w-[60px]'
                                type="number"
                                size='sm'
                                value={
                                    (currentChoices[number]?.isCorrect) ?
                                        (correctCount > 0 ? (values.score / correctCount).toFixed(2) : '0')
                                        :
                                        (correctCount > 0 ? ((values.score / correctCount) * -1).toFixed(2) : '0')
                                }
                                onChange={(e) => setFieldValue(`choices.${number}.score`, e.target.value)}
                            />
                        }
                    </div>
                    {number < 2 ? (
                        <span className="text-tiny text-foreground/50">Mandatory</span>
                    ) : (
                        <Button
                            size="sm"
                            color="danger"
                            isIconOnly
                            onPress={handleRemoveChoice}
                            isDisabled={number !== currentChoices.length - 1}
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
    const [correctCount, setCorrectCount] = useState<number>(0)

    // Initialize choices array if it doesn't exist
    useEffect(() => {
        if (!values.choices || values.choices.length === 0) {
            setFieldValue('choices', [
                { content: '', isCorrect: false, score: 0 },
                { content: '', isCorrect: false, score: 0 }
            ])
        }
    }, [])

    useEffect(() => {
        const currentChoices = values.choices || []
        const correctCount = currentChoices.filter((choice: any) => choice.isCorrect).length
        setCorrectCount(correctCount)
        console.log('Correct count updated:', correctCount)
    }, [values.choices])

    const handleAddChoice = () => {
        const currentChoices = values.choices || []
        setFieldValue('choices', [...currentChoices, { content: '', isCorrect: false, score: 0 }])
    }

    return (
        <div className="px-10 flex flex-col gap-y-4">
            <p className='text-sm text-foreground/50'>
                <span className='text-danger'>* </span>
                <span>You can select multiple correct answers, but wrong choices will deduct points.</span>
            </p>
            {(values.choices || []).map((_: any, idx: number) => (
                <ChoiceBox correctCount={correctCount} key={idx} number={idx} />
            ))}
            <div className='flex justify-between items-center'>
                <Checkbox
                    isSelected={!values.isRandomChoices}
                    onValueChange={(isSelected) => setFieldValue('isRandomChoices', !isSelected)}
                    size='md'
                    color='secondary'
                >
                    <span className='text-sm'>Don't randomize choices (Only for this question)</span>
                </Checkbox>
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

        </div>
    )
}

export default MultipleChoiceForm