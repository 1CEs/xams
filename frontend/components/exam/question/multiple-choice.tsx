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
        <div className="bg-default-50 p-3 sm:p-4 rounded-lg border border-default-200">
            <div className="flex flex-col gap-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-x-3">
                            <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                {convertToAlphabet(number)}
                            </div>
                            <Checkbox
                                isSelected={currentChoices[number]?.isCorrect || false}
                                onValueChange={handleToggleCorrectAnswer}
                                size="md"
                                color="secondary"
                            >
                                <span className="text-sm font-medium">Correct Answer</span>
                            </Checkbox>
                        </div>
                        <Input
                            size="sm"
                            className="w-full sm:w-20"
                            label="Score"
                            type="number"
                            step="0.01"
                            value={
                                currentChoices[number]?.isCorrect
                                    ? (correctCount > 0 ? (values.score / correctCount).toFixed(2) : '0')
                                    :
                                    (correctCount > 0 ? ((values.score / correctCount) * -1).toFixed(2) : '0')
                            }
                            onChange={(e) => setFieldValue(`choices.${number}.score`, e.target.value)}
                        />
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
                            className="self-end sm:self-auto"
                        />
                    )}
                </div>
                <TextEditor
                    name={`choices.${number}.content`}
                    type='unnested'
                    className="min-h-[80px] sm:min-h-[100px] w-full"
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
        <div className="px-2 sm:px-6 lg:px-10 flex flex-col gap-y-4">
            <p className='text-sm text-foreground/50'>
                <span className='text-danger'>* </span>
                <span>You can select multiple correct answers, but wrong choices will deduct points.</span>
            </p>
            {(values.choices || []).map((_: any, idx: number) => (
                <ChoiceBox correctCount={correctCount} key={idx} number={idx} />
            ))}
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3'>
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
                    className="w-full sm:w-fit text-primary"
                    onPress={handleAddChoice}
                >
                    Add another answer
                </Button>
            </div>

        </div>
    )
}

export default MultipleChoiceForm