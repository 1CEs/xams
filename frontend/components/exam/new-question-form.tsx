import { Avatar, Button, Card, CardBody, CardHeader, Divider, Image, Input, Link, Select, SelectItem } from '@nextui-org/react'
import React, { useState } from 'react'
import TextEditor from '../text-editor'
import { questionTypes } from '@/constants/attribute'
import { StepProvider } from '../provider'
import MultipleChoiceForm from './multiple-choice'
import TrueOrFalseForm from './true_or_false'

export const HeadLine = ({ number, content, isOptional }: { number: number, content: string, isOptional?:boolean }) => {
    return (
        <div className='flex gap-x-8 items-center'>
            <Avatar size='sm' name={number.toString()} />
            <h1 className='text-xl'>{content} { isOptional && <span className='text-tiny text-foreground/50'>Optional</span>}</h1>
            
        </div>
    )
}

const NewQuestionForm = () => {
    const [selectedType, setSelectedType] = useState<QuestionSelector>('mc')
    const formRenderer = {
        mc: <MultipleChoiceForm />,
        tf: <TrueOrFalseForm />

    }
    return (
        <form className="col-span-2 pl-32">
            <Card>
                <CardHeader className="gap-x-3">
                    <Button size="sm" color="success">Save</Button>
                    <Button size="sm">Save and add new question</Button>
                </CardHeader>
                <Divider />
                <CardBody className='gap-y-9'>
                    <StepProvider number={1} content='Select Question Type'>
                        <ul className='flex items-center h-fit justify-center p-3 gap-x-3'>
                            {
                                questionTypes.map((item, idx: number) => (
                                    <li className={`
                                    w-[18%] cursor-pointer border 
                                    ${selectedType == item.name ? 'border-secondary' : 'border-secondary/20'} 
                                    flex flex-col gap-y-2 p-6 items-center justify-between`}
                                        key={idx}
                                        onClick={() => setSelectedType(item.name)}
                                    >
                                        {item.icon}
                                        <span className='text-sm'>{item.content}</span>
                                    </li>
                                ))
                            }
                        </ul>
                    </StepProvider>
                    <StepProvider number={2} content='Write your question'>
                        <div className='px-10'>
                            <TextEditor className='min-h-[150px]'/>
                        </div>
                        
                    </StepProvider>
                    <StepProvider number={3} content='Add your multiple choice' >
                        { formRenderer[selectedType as Exclude<QuestionSelector, string>]}
                    </StepProvider>
                    <StepProvider number={4} content='Give feedback' isOptional={true}>
                        <div className='flex gap-x-6'>
                            <div className='flex w-full text-nowrap items-center gap-x-3'>
                                <span className='text-sm w-fit text-secondary'>Correctly answered</span>
                                <Input color='secondary' variant='bordered'/>
                            </div>
                            <div className='flex w-full text-nowrap items-center gap-x-3'>
                                <span className='text-sm text-danger'>Incorrectly answered</span>
                                <Input color='danger' variant='bordered'/>
                            </div>
                        </div>
                    </StepProvider>
                    <StepProvider number={5} content='Category' >
                        <div className='flex gap-x-6 items-center'>
                            <Select placeholder='Select your categories here' className='w-fit'>
                                <SelectItem key={'default'}>Default</SelectItem>
                            </Select>
                            <Button size='sm'>New Category</Button>
                        </div>
                    </StepProvider>
                </CardBody>
            </Card>
        </form>
    )
}

export default NewQuestionForm