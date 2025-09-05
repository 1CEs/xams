"use client"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Checkbox, Card, CardBody, Divider } from "@nextui-org/react"
import { useState } from "react"

interface Question {
    question: string
    type: string
    choices: Array<{
        content: string
        isCorrect: boolean
        score: number
    }>
    score: number
    isRandomChoices?: boolean
}

interface QuestionRandomizationModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    questions: Question[]
    onConfirm: (questionsWithRandomization: Question[]) => void
    onCancel: () => void
}

export default function QuestionRandomizationModal({
    isOpen,
    onOpenChange,
    questions,
    onConfirm,
    onCancel
}: QuestionRandomizationModalProps) {
    const [questionRandomization, setQuestionRandomization] = useState<Record<number, boolean>>(
        questions.reduce((acc, _, index) => {
            acc[index] = true // Default to randomized
            return acc
        }, {} as Record<number, boolean>)
    )

    const handleRandomizationChange = (questionIndex: number, isRandomized: boolean) => {
        setQuestionRandomization(prev => ({
            ...prev,
            [questionIndex]: isRandomized
        }))
    }

    const handleSelectAll = (isRandomized: boolean) => {
        const newRandomization = questions.reduce((acc, _, index) => {
            acc[index] = isRandomized
            return acc
        }, {} as Record<number, boolean>)
        setQuestionRandomization(newRandomization)
    }

    const handleConfirm = () => {
        const questionsWithRandomization = questions.map((question, index) => ({
            ...question,
            isRandomChoices: questionRandomization[index]
        }))
        onConfirm(questionsWithRandomization)
    }

    const randomizedCount = Object.values(questionRandomization).filter(Boolean).length
    const totalQuestions = questions.length

    return (
        <Modal 
            isOpen={isOpen} 
            onOpenChange={onOpenChange}
            size="4xl"
            scrollBehavior="inside"
            isDismissable={false}
            hideCloseButton
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-secondary">Question Randomization Settings</h2>
                    <p className="text-sm text-default-500">
                        Configure randomization for each imported question ({totalQuestions} questions found)
                    </p>
                </ModalHeader>
                <ModalBody className="gap-4">
                    {/* Summary and Bulk Actions */}
                    <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">
                                    {randomizedCount} of {totalQuestions} questions will have randomized choices
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => handleSelectAll(true)}
                                >
                                    Randomize All
                                </Button>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="default"
                                    onPress={() => handleSelectAll(false)}
                                >
                                    None
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-3">
                        {questions.map((question, index) => (
                            <Card key={index} className="w-full">
                                <CardBody className="gap-3">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            color="secondary"
                                            isSelected={questionRandomization[index]}
                                            onValueChange={(isSelected) => handleRandomizationChange(index, isSelected)}
                                            size="sm"
                                        >
                                            <span className="font-medium text-sm">
                                                Randomize choices for this question
                                            </span>
                                        </Checkbox>
                                    </div>
                                    
                                    <Divider />
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                                Question {index + 1}
                                            </span>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {question.type.toUpperCase()}
                                            </span>
                                        </div>
                                        
                                        <p className="text-sm font-medium text-default-700 line-clamp-2">
                                            {question.question}
                                        </p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                            {question.choices.map((choice, choiceIndex) => (
                                                <div 
                                                    key={choiceIndex}
                                                    className={`text-xs p-2 rounded border ${
                                                        choice.isCorrect 
                                                            ? 'bg-success-50 border-success-200 text-success-800' 
                                                            : 'bg-default-50 border-default-200 text-default-600'
                                                    }`}
                                                >
                                                    <span className="font-medium">
                                                        {String.fromCharCode(65 + choiceIndex)}.
                                                    </span> {choice.content}
                                                    {choice.isCorrect && (
                                                        <span className="ml-2 text-success-600">✓</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>

                    {/* Information Box */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2">ℹ️ About Choice Randomization</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• <strong>Randomized:</strong> Answer choices will be shuffled for each student</li>
                            <li>• <strong>Fixed:</strong> Answer choices will appear in the same order for all students</li>
                            <li>• You can change these settings later when editing individual questions</li>
                        </ul>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="flat" onPress={onCancel}>
                        Cancel Import
                    </Button>
                    <Button color="secondary" onPress={handleConfirm}>
                        Import {totalQuestions} Questions
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
