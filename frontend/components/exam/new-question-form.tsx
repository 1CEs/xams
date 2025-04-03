import { Avatar, Button, Card, CardBody, CardFooter, CardHeader, Divider, Input, Radio, RadioGroup } from '@nextui-org/react'
import React, { ChangeEvent, FormEvent } from 'react'
import TextEditor from '../text-editor'
import { StepProvider } from '../provider'
import MultipleChoiceForm from './question/multiple-choice'
import TrueOrFalseForm from './question/true-or-false'
import { Formik, FormikHelpers } from 'formik'
import QuestionTypeSelector from './question-type-selector'
import ShortEssayForm from './question/short-essay'
import LongEssayForm from './question/long-essay'
import { clientAPI } from '@/config/axios.config'
import { errorHandler } from '@/utils/error'
import { toast } from 'react-toastify'
import { useTrigger } from '@/stores/trigger.store'

export const HeadLine = ({ number, content, isOptional }: { number: number, content: string, isOptional?: boolean }) => {
    return (
        <div className='flex gap-x-8 items-center'>
            <Avatar size='sm' name={number.toString()} />
            <h1 className='text-xl'>{content} {isOptional && <span className='text-tiny text-foreground/50'>Optional</span>}</h1>
        </div>
    )
}

type Props = {
    examination_id: string
}

const NewQuestionForm = ({ examination_id }: Props) => {
    const { trigger, setTrigger } = useTrigger()
    const formRenderer = {
        mc: {
            form: <MultipleChoiceForm />,
            content: 'Add your multiple choices'
        },
        tf: {
            form: <TrueOrFalseForm />,
            content: 'Add your true or false choices'
        },
        ses: {
            form: <ShortEssayForm />,
            content: 'Add your short essay'
        },
        les: {
            form: <LongEssayForm />,
            content: 'Add your long essay'
        }
    }

    return (
        <Formik
            initialValues={{
                question: '',
                type: 'mc',
                choices: ["", ""],
                answer: [],
                score: 1
            }}
            onSubmit={async (
                values: QuestionForm,
                { setSubmitting }: FormikHelpers<QuestionForm>
            ) => {
                try {
                    setSubmitting(false)
                    console.log(values)
                    const res = await clientAPI.post(`exam/question/${examination_id}`, values)
                    toast.success(res.data.message)
                    setTrigger(!trigger)
                } catch (error) {
                    errorHandler(error)
                }
            }}
        >
            {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting,
            }) => {
                const handleScoreChange = (e: ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value
                    if (/^\d*\.?\d*$/.test(value)) {
                        handleChange(e)
                    }
                }

                return (
                    <form className="col-span-2 pl-32" onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader className="justify-between">
                                <div className='flex gap-x-4'>
                                    <Button size="sm" color="success" type='submit'>Save</Button>
                                    <Button size="sm">Save and add new question</Button>
                                </div>

                                <Input
                                    className='w-[100px] text-secondary'
                                    size='sm'
                                    maxLength={4}
                                    startContent={<span className='text-sm text-foreground/50'>Score: </span>}
                                    onChange={handleScoreChange}
                                    value={values.score.toString()}
                                    name='score'
                                />
                            </CardHeader>
                            <Divider />
                            <CardBody className='gap-y-9'>
                                <StepProvider number={1} content='Select Question Type'>
                                    <QuestionTypeSelector />
                                </StepProvider>
                                <StepProvider number={2} content='Write your question'>
                                    <div className='px-10'>
                                        <TextEditor
                                            className='min-h-[150px]'
                                            name='question'
                                            type='unnested'
                                        />
                                    </div>
                                </StepProvider>
                                <StepProvider number={3} content={formRenderer[values.type].content}>
                                    {formRenderer[values.type].form}
                                </StepProvider>
                            </CardBody>
                            <CardFooter></CardFooter>
                        </Card>
                    </form>
                )
            }}

        </Formik>

    )
}

export default NewQuestionForm
