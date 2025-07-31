import { Avatar, Button, Card, CardBody, CardFooter, CardHeader, Divider, Input, Radio, RadioGroup, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react'
import React, { ChangeEvent, FormEvent, useState } from 'react'
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
    editingQuestion?: QuestionWithIdentifier<QuestionForm> | null
    onEditComplete?: () => void
}

const NewQuestionForm = ({ examination_id, editingQuestion, onEditComplete }: Props) => {
    const { trigger, setTrigger } = useTrigger()
    const [formKey, setFormKey] = useState<number>(0)
    const [validationError, setValidationError] = useState<string>('')
    const [showValidationModal, setShowValidationModal] = useState<boolean>(false)
    const isEditing = !!editingQuestion
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
        },
        nested: {
            form: <div>Nested questions are not supported in this form</div>,
            content: 'Nested questions are not supported in this form'
        }
    }

    return (
        <>
            <Formik
                key={formKey}
                initialValues={{
                    question: editingQuestion?.question || '',
                    type: editingQuestion?.type || 'mc',
                    isRandomChoices: editingQuestion?.isRandomChoices ?? true,
                    choices: editingQuestion?.choices || [{ content: '', isCorrect: false, score: 0 }, { content: '', isCorrect: false, score: 0 }],
                    isTrue: editingQuestion?.isTrue ?? false,
                    expectedAnswers: editingQuestion?.expectedAnswers || (editingQuestion?.type === 'les' ? [] : ['']),
                    score: editingQuestion?.score || 1
                }}
                onSubmit={async (
                    values,
                    formikHelpers
                ) => {
                    try {
                        // Validate multiple choice questions have at least one correct answer
                        if (values.type === 'mc') {
                            const hasCorrectChoice = values.choices?.some(choice => choice.isCorrect) || false;
                            if (!hasCorrectChoice) {
                                setValidationError('You must select at least one correct answer for multiple choice questions.');
                                setShowValidationModal(true);
                                formikHelpers.setSubmitting(false);
                                return;
                            }
                        }
                        
                        // Validate short essay questions have at least one non-empty expected answer
                        if (values.type === 'ses') {
                            const hasValidExpectedAnswer = values.expectedAnswers && 
                                values.expectedAnswers.length > 0 && 
                                values.expectedAnswers.some(answer => answer.trim().length > 0);
                            if (!hasValidExpectedAnswer) {
                                setValidationError('Short essay questions must have at least one expected answer.');
                                setShowValidationModal(true);
                                formikHelpers.setSubmitting(false);
                                return;
                            }
                        }
                        
                        formikHelpers.setSubmitting(false)
                        
                        if (isEditing && editingQuestion?._id) {
                            // Update existing question
                            const res = await clientAPI.put(`exam/question/${examination_id}/${editingQuestion._id}`, {...values, score: Number(values.score)})
                            toast.success('Question updated successfully')
                            setTrigger(!trigger)
                            onEditComplete?.()
                        } else {
                            // Create new question
                            const res = await clientAPI.post(`exam/question/${examination_id}`, {...values, score: Number(values.score)})
                            toast.success(res.data.message)
                            setTrigger(!trigger)
                            // Reset the form by incrementing the key to force a complete re-render
                            setFormKey(prevKey => prevKey + 1)
                            formikHelpers.resetForm({
                                values: {
                                    question: '',
                                    type: 'mc',
                                    isRandomChoices: true,
                                    choices: [{ content: '', isCorrect: false, score: 0 }, { content: '', isCorrect: false, score: 0 }],
                                    isTrue: false,
                                    expectedAnswers: [''],
                                    score: 1
                                }
                            })
                        }
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
                        {isEditing && (
                            <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                <p className="text-sm text-primary font-medium">
                                    📝 Editing Question: {editingQuestion?.question?.substring(0, 50)}...
                                </p>
                            </div>
                        )}
                        <Card>
                            <CardHeader className="justify-between">
                                <div className='flex gap-x-4'>
                                    <Button size="sm" color="success" type='submit'>
                                        {isEditing ? 'Update Question' : 'Save'}
                                    </Button>
                                    {!isEditing && (
                                        <Button size="sm">Save and add new question</Button>
                                    )}
                                    {isEditing && (
                                        <Button size="sm" color="warning" onPress={onEditComplete}>
                                            Cancel Edit
                                        </Button>
                                    )}
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
            
            {/* Validation Error Modal */}
            <Modal 
                isOpen={showValidationModal} 
                onClose={() => setShowValidationModal(false)}
                classNames={{
                    base: "bg-gradient-to-b from-gray-900 to-black border border-red-500/30",
                    header: "border-b border-red-500/20",
                    footer: "border-t border-red-500/20",
                    closeButton: "text-red-400 hover:text-red-300"
                }}
                motionProps={{
                    variants: {
                        enter: {
                            y: 0,
                            opacity: 1,
                            transition: {
                                duration: 0.3,
                                ease: "easeOut"
                            }
                        },
                        exit: {
                            y: 20,
                            opacity: 0,
                            transition: {
                                duration: 0.2,
                                ease: "easeIn"
                            }
                        }
                    }
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-red-500/20 text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>
                        <span className="text-xl bg-gradient-to-r from-red-400 to-red-300 text-transparent bg-clip-text font-semibold">Validation Error</span>
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-gray-300 border-l-2 border-red-500/50 pl-3">{validationError}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button 
                            color="danger" 
                            className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-900/30 hover:shadow-lg hover:shadow-red-900/40 transition-all" 
                            onPress={() => setShowValidationModal(false)}
                        >
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>

    )
}

export default NewQuestionForm
