import { useFormikContext } from 'formik'
import { Button, Card, CardBody, CardHeader } from '@nextui-org/react'
import TextEditor from '../../text-editor'
import { useState, useEffect } from 'react'

const ShortEssayForm = () => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()
    const [editorKeys, setEditorKeys] = useState<number[]>([0])

    // Initialize expectedAnswers with at least one answer (required for short essays)
    useEffect(() => {
        if (!values.expectedAnswers || values.expectedAnswers.length === 0) {
            setFieldValue('expectedAnswers', [''])
        }
    }, [])

    const addExpectedAnswer = () => {
        const currentAnswers = values.expectedAnswers || ['']
        const newAnswers = [...currentAnswers, '']
        setFieldValue('expectedAnswers', newAnswers)
        setEditorKeys(prev => [...prev, Math.max(...prev) + 1])
    }

    const removeExpectedAnswer = (index: number) => {
        const currentAnswers = values.expectedAnswers || ['']
        // Always maintain at least one expected answer for short essays
        if (currentAnswers.length > 1) {
            const newAnswers = currentAnswers.filter((_, i) => i !== index)
            setFieldValue('expectedAnswers', newAnswers)
            setEditorKeys(prev => prev.filter((_, i) => i !== index))
        }
    }

    const expectedAnswers = values.expectedAnswers || ['']

    return (
        <div className="px-2 sm:px-6 lg:px-10 flex flex-col gap-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex flex-col gap-y-2">
                    <h3 className="text-lg font-medium">Expected Answers <span className="text-red-500">*</span></h3>
                    <p className="text-sm text-gray-500">
                        Short essay questions require at least one expected answer for grading.
                    </p>
                </div>
                <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={addExpectedAnswer}
                    className="w-full sm:w-auto"
                >
                    + Add Answer
                </Button>
            </div>
            
            {expectedAnswers.map((answer, index) => (
                <Card key={editorKeys[index]} className="w-full">
                    <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-2">
                        <span className="text-sm font-medium">Expected Answer {index + 1}</span>
                        {expectedAnswers.length > 1 && (
                            <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                onPress={() => removeExpectedAnswer(index)}
                                className="w-full sm:w-auto"
                            >
                                Remove
                            </Button>
                        )}
                        {expectedAnswers.length === 1 && (
                            <span className="text-xs text-gray-400">
                                Required
                            </span>
                        )}
                    </CardHeader>
                    <CardBody className="pt-0">
                        <TextEditor
                            key={editorKeys[index]}
                            name={`expectedAnswers.${index}`}
                            type="unnested"
                            className="min-h-[120px] sm:min-h-[150px]"
                        />
                    </CardBody>
                </Card>
            ))}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium mb-2">
                    📝 Short Essay Requirements:
                </p>
                <ul className="text-sm text-blue-600 space-y-1">
                    <li>• At least one expected answer is required</li>
                    <li>• Add multiple expected answers to allow for different correct responses</li>
                    <li>• Learners can submit any answer that matches one of these expected answers</li>
                </ul>
            </div>
        </div>
    )
}

export default ShortEssayForm