import { Input, Button, Card, CardBody, CardHeader } from '@nextui-org/react'
import { useFormikContext } from 'formik'
import { useState, useEffect } from 'react'
import TextEditor from '../../text-editor'

const LongEssayForm = () => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()
    const [editorKeys, setEditorKeys] = useState<number[]>([0])

    // Initialize expectedAnswers as empty array if it doesn't exist (optional for long essays)
    useEffect(() => {
        if (!values.expectedAnswers) {
            setFieldValue('expectedAnswers', [])
        }
    }, [])

    const addExpectedAnswer = () => {
        const currentAnswers = values.expectedAnswers || []
        const newAnswers = [...currentAnswers, '']
        setFieldValue('expectedAnswers', newAnswers)
        setEditorKeys(prev => {
            const maxKey = prev.length > 0 ? Math.max(...prev) : -1
            return [...prev, maxKey + 1]
        })
    }

    const removeExpectedAnswer = (index: number) => {
        const currentAnswers = values.expectedAnswers || []
        if (currentAnswers.length > 0) {
            const newAnswers = currentAnswers.filter((_, i) => i !== index)
            setFieldValue('expectedAnswers', newAnswers)
            setEditorKeys(prev => prev.filter((_, i) => i !== index))
        }
    }

    const expectedAnswers = values.expectedAnswers || []

    return (
        <div className="px-2 sm:px-6 lg:px-10 flex flex-col gap-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex flex-col gap-y-2">
                    <h3 className="text-lg font-medium">Expected Answers (Optional)</h3>
                    <p className="text-sm text-gray-500">
                        Add expected answers to help with grading. Leave empty if this is an open-ended question.
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
                        <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => removeExpectedAnswer(index)}
                            className="w-full sm:w-auto"
                        >
                            Remove
                        </Button>
                    </CardHeader>
                    <CardBody className="pt-0">
                        <TextEditor
                            key={editorKeys[index]}
                            name={`expectedAnswers.${index}`}
                            type="unnested"
                            className="min-h-[200px] sm:min-h-[300px]"
                        />
                    </CardBody>
                </Card>
            ))}
            
            {expectedAnswers.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                        No expected answers added. This will be treated as an open-ended question.
                    </p>
                </div>
            )}
            
            {expectedAnswers.length > 0 && (
                <p className="text-sm text-gray-500">
                    Tip: Add multiple expected answers to allow for different correct responses. 
                    Students can submit any answer that matches one of these expected answers.
                </p>
            )}
        </div>
    )
}

export default LongEssayForm