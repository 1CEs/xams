import { useFormikContext } from 'formik'
import { Button, Card, CardBody, CardHeader } from '@nextui-org/react'
import TextEditor from '../../text-editor'
import { useState, useEffect } from 'react'

const ShortEssayForm = () => {
    const { setFieldValue, values } = useFormikContext<QuestionForm>()
    const [editorKeys, setEditorKeys] = useState<number[]>([0])

    // Initialize expectedAnswers if it doesn't exist
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
        if (currentAnswers.length > 1) {
            const newAnswers = currentAnswers.filter((_, i) => i !== index)
            setFieldValue('expectedAnswers', newAnswers)
            setEditorKeys(prev => prev.filter((_, i) => i !== index))
        }
    }

    const expectedAnswers = values.expectedAnswers || ['']

    return (
        <div className="px-10 flex flex-col gap-y-4">
            <div className="flex justify-between items-center">
                <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={addExpectedAnswer}
                >
                    + Add Answer
                </Button>
            </div>
            
            {expectedAnswers.map((answer, index) => (
                <Card key={editorKeys[index]} className="w-full">
                    <CardHeader className="flex justify-between items-center pb-2">
                        <span className="text-sm font-medium">Expected Answer {index + 1}</span>
                        {expectedAnswers.length > 1 && (
                            <Button
                                size="sm"
                                color="danger"
                                variant="flat"
                                onPress={() => removeExpectedAnswer(index)}
                            >
                                Remove
                            </Button>
                        )}
                    </CardHeader>
                    <CardBody className="pt-0">
                        <TextEditor
                            key={editorKeys[index]}
                            name={`expectedAnswers.${index}`}
                            type="unnested"
                            className="min-h-[150px]"
                        />
                    </CardBody>
                </Card>
            ))}
            
            <p className="text-sm text-gray-500">
                Tip: Add multiple expected answers to allow for different correct responses. 
                Students can submit any answer that matches one of these expected answers.
            </p>
        </div>
    )
}

export default ShortEssayForm