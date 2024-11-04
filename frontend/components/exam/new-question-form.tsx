import { Avatar, Button, Card, CardBody, CardFooter, CardHeader, Chip, Divider, Input, Radio, RadioGroup, Select, SelectItem } from '@nextui-org/react'
import React, { ChangeEvent, FormEvent } from 'react'
import TextEditor from '../text-editor'
import { StepProvider } from '../provider'
import MultipleChoiceForm from './multiple-choice'
import TrueOrFalseForm from './true_or_false'
import { Formik, FormikHelpers } from 'formik'
import QuestionTypeSelector from './question-type-selector'
import CategorySelector from './category-selector'

export const HeadLine = ({ number, content, isOptional }: { number: number, content: string, isOptional?: boolean }) => {
    return (
        <div className='flex gap-x-8 items-center'>
            <Avatar size='sm' name={number.toString()} />
            <h1 className='text-xl'>{content} {isOptional && <span className='text-tiny text-foreground/50'>Optional</span>}</h1>
        </div>
    )
}

const NewQuestionForm = () => {
    const formRenderer = {
        mc: <MultipleChoiceForm />,
        tf: <TrueOrFalseForm />

    }

    const onFormChange = (e: ChangeEvent<HTMLFormElement>) => {
        console.log('hi')
    }

    const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formEntries = Object.fromEntries(new FormData(e.currentTarget).entries())
        console.log(formEntries)

    }

    return (
        <Formik
            initialValues={{
                question: '',
                type: 'mc',
                choices: [
                    {
                        number: 1,
                        content: '',
                        is_correct: false
                    },
                    {
                        number: 2,
                        content: '',
                        is_correct: false
                    },
                ],
                feedback: {
                    correct: '',
                    incorrect: ''
                },
                category: [''],
                settings: {
                    point: 1,
                    is_random: 'no'
                }
            }}
            onSubmit={(
                values: QuestionForm,
                { setSubmitting }: FormikHelpers<QuestionForm>
            ) => {
                setSubmitting(false);
                console.log(values)
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
            }) => (
                <form className="col-span-2 pl-32" onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader className="gap-x-3">
                            <Button size="sm" color="success" type='submit'>Save</Button>
                            <Button size="sm">Save and add new question</Button>
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
                                    />
                                </div>
                            </StepProvider>
                            <StepProvider number={3} content='Add your multiple choice' >
                                {formRenderer[values.type as Exclude<QuestionSelector, string>]}
                            </StepProvider>
                            <StepProvider number={4} content='Give feedback' isOptional={true}>
                                <div className='flex gap-x-6 px-10'>
                                    <div className='flex w-full text-nowrap items-center gap-x-3'>
                                        <span className='text-sm w-fit text-secondary'>Correctly answered</span>
                                        <Input
                                            color='secondary'
                                            variant='bordered'
                                            name='feedback.correct'
                                            onChange={handleChange}
                                            value={values.feedback.correct}
                                        />
                                    </div>
                                    <div className='flex w-full text-nowrap items-center gap-x-3'>
                                        <span className='text-sm text-danger'>Incorrectly answered</span>
                                        <Input
                                            color='danger'
                                            variant='bordered'
                                            name='feedback.incorrect'
                                            onChange={handleChange}
                                            value={values.feedback.incorrect}
                                        />
                                    </div>
                                </div>
                            </StepProvider>
                            <StepProvider number={5} content='Category' >
                                <CategorySelector handleChange={handleChange} values={values}/>
                            </StepProvider>
                            <StepProvider number={6} content='Question settings' >
                                <div className='flex gap-x-9 px-10'>
                                    <div className='flex flex-col items-center gap-y-4'>
                                        <span className='text-sm'>Points Available</span>
                                        <Input
                                            size='sm'
                                            onChange={handleChange}
                                            value={values.settings.point.toString()}
                                            name='settings.point'
                                        />
                                    </div>
                                    <div className='flex flex-col items-center gap-y-4'>
                                        <span className='text-sm'>Randomize Answer</span>
                                        <RadioGroup
                                            size='sm'
                                            color='secondary'
                                            defaultValue={values.settings.is_random}
                                            onChange={handleChange} orientation='horizontal'
                                            name='settings.is_random'>
                                            <Radio value={'no'}>No</Radio>
                                            <Radio value={'yes'}>Yes</Radio>
                                        </RadioGroup>
                                    </div>
                                </div>
                            </StepProvider>
                        </CardBody>
                        <CardFooter>

                        </CardFooter>
                    </Card>
                </form>
            )}

        </Formik>

    )
}

export default NewQuestionForm