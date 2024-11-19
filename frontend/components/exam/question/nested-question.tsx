import { MingcuteAddFill } from '@/components/icons/icons'
import { StepProvider } from '@/components/provider'
import TextEditor from '@/components/text-editor'
import { Button, Card, CardBody, CardHeader} from '@nextui-org/react'
import { Formik } from 'formik'
import React from 'react'
import DroppableQuestion from './droppable-question'
import { useParentStore } from '@/stores/parent.store'

type Props = {}

const NestedQuestionForm = (props: Props) => {
    const { parent, setParent } = useParentStore()
    return (
        <Formik
            initialValues={{
                question: '',
                questions: [],
            }}
            onSubmit={(
                values: NestedQuestionForm,
            ) => {
                console.log(values)
            }}
        >
            {({
                handleSubmit,
            }) => (
                <>
                    <form className='col-span-2 pl-32' onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <div className='flex gap-x-4'>
                                    <Button size="sm" color="success" type='submit'>Save</Button>
                                    <Button size="sm">Save and add new question</Button>
                                </div>
                            </CardHeader>
                            <CardBody className='gap-y-9'>
                                <StepProvider number={1} content='Write down your question'>
                                    <div className='px-10'>
                                        <TextEditor className='min-h-[150px] w-full' name='question' type='nested' />
                                    </div>
                                </StepProvider>
                                <StepProvider number={2} content='Add your questions'>
                                    <div className='px-10'>
                                        <Button startContent={<MingcuteAddFill />} size='sm'>Add</Button>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <DroppableQuestion id="droppable-1">
                                                        x
                                                    </DroppableQuestion>
                                                </div>
                                            </div>
                                    </div>
                                </StepProvider>
                            </CardBody>
                        </Card>
                    </form>
                </>
            )}
        </Formik>
    )
}

export default NestedQuestionForm