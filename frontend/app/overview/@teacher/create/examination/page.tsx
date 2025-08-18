"use client"
import NewQuestionForm from "@/components/exam/new-question-form"
import DraggableQuestion from "@/components/exam/question/draggable-question"
import NestedQuestionForm from "@/components/exam/question/nested-question"

import ConfirmModal from "@/components/modals/confirm-modal"
import { IconParkOutlineCheckCorrect, IconParkTwotoneNestedArrows, IcRoundFolder, MdiBin, MingcuteAddFill, MingcuteFileNewFill, PhEyeDuotone, SystemUiconsReuse } from "@/components/icons/icons"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"
import { Button, Card, CardBody, CardFooter, Checkbox, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Modal, ModalContent, ModalHeader, ModalBody, Textarea, Tooltip, useDisclosure } from "@nextui-org/react"
import { useSearchParams, useRouter } from "next/navigation"
import { ChangeEvent, useEffect, useState } from "react"
import { toast } from 'react-toastify'
import { validateAikenFormat, formatValidationErrors } from '@/utils/aiken-validator'
import { useQuestionListStore } from "@/stores/question.store/question-list.store"
import { useNestedQuestionsStore } from "@/stores/question.store/nested-question.store"
import { useTrigger } from "@/stores/trigger.store"
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'

export default function CreateExaminationPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const _id = searchParams.get('id')
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const { isOpen: isAikenModalOpen, onOpen: onAikenModalOpen, onOpenChange: onAikenModalOpenChange } = useDisclosure()
    const [deleteQuestionModal, setDeleteQuestionModal] = useState({ isOpen: false, questionId: '' })
    const [deleteAllModal, setDeleteAllModal] = useState({ isOpen: false })
    const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
    const [selectAll, setSelectAll] = useState(false)
    const [exam, setExam] = useState<any>(null)
    const [isNewQuestion, setIsNewQuestion] = useState<boolean>(false)
    const [isNestedQuestion, setIsNestedQuestion] = useState<boolean>(false)
    const { questionList, setQuestionList, initializeQuestionList } = useQuestionListStore()
    const { nestedQuestions, setNestedQuestions } = useNestedQuestionsStore()
    const [activeId, setActiveId] = useState<number | null>(null)
    const { trigger, setTrigger } = useTrigger()
    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [editingQuestion, setEditingQuestion] = useState<QuestionWithIdentifier<QuestionForm> | null>(null)
    const [formValues, setFormValues] = useState({
        title: '',
        description: ''
    })
    const [currentPage, setCurrentPage] = useState(1)
    const questionsPerPage = 5

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        const getExam = async () => {
            try {
                const res = await clientAPI.get(`exam/${_id}`)
                setExam(res.data.data)
                initializeQuestionList(res.data.data.questions)

                // Initialize form values
                setFormValues({
                    title: res.data.data.title || '',
                    description: res.data.data.description || ''
                })

                // Clear selection when data changes
                setSelectedQuestions(new Set())
                setSelectAll(false)

                console.log(res.data)
            } catch (error) {
                console.log(error)
                errorHandler(error)
            }
        }
        getExam()
    }, [_id, trigger])

    function handleDragStart(event: DragStartEvent) {
        const { active } = event
        const { id } = active

        setActiveId(id as number)
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        if (overId === "nested-questions") {
            const draggedItem = questionList.find((item) => item.id === activeId)
            if (draggedItem) {
                setQuestionList((prev) => prev.filter((item) => item.id !== activeId))
                setNestedQuestions((prev) => [...prev, draggedItem])
            }
        } else {
            setQuestionList((items) => {
                const oldIndex = items.findIndex((item) => item.id === activeId)
                const newIndex = items.findIndex((item) => item.id === overId)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const onAikenImportClick = () => {
        const el = document.getElementById('aiken-import')
        if (el) {
            el.click()
            el.addEventListener('change', async (e: Event) => {
                const file = (e as unknown as ChangeEvent<HTMLInputElement>).target.files?.[0]
                if (file) {
                    // Validate file type
                    if (!file.name.endsWith('.txt')) {
                        toast.error('Please upload a .txt file')
                        return
                    }

                    // Validate file size (max 1MB)
                    if (file.size > 1024 * 1024) {
                        toast.error('File size should be less than 1MB')
                        return
                    }

                    try {
                        toast.info('Validating Aiken format...')
                        
                        // Read and validate file content first
                        const fileContent = await file.text()
                        const validationResult = validateAikenFormat(fileContent)
                        
                        if (!validationResult.isValid) {
                            const errorMessage = formatValidationErrors(validationResult)
                            console.error('Aiken validation failed:', errorMessage)
                            toast.error(`Invalid Aiken format detected. Please fix the following issues:\n\n${errorMessage}`)
                            return
                        }
                        
                        if (validationResult.warnings.length > 0) {
                            console.warn('Aiken validation warnings:', validationResult.warnings)
                            toast.warning(`File has ${validationResult.warnings.length} warning(s) but will proceed with import.`)
                        }
                        
                        toast.success(`✅ Valid Aiken format with ${validationResult.questionCount} questions. Processing...`)

                        const formData = new FormData()
                        formData.append('file', file)

                        const res = await clientAPI.post('/upload/aiken', formData, {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        })

                        const { message, code, data } = res.data

                        if (code !== 200 || !data || data.length === 0) {
                            toast.error(message || 'Failed to import questions')
                            return
                        }

                        // Get existing questions from current exam to check for duplicates
                        const existingQuestions = questionList.map(q => q.question?.trim().toLowerCase())
                        
                        // Filter out duplicate questions by comparing question content
                        const uniqueQuestions = data.filter((newQuestion: any) => {
                            const newQuestionText = newQuestion.question?.trim().toLowerCase()
                            const isDuplicate = existingQuestions.includes(newQuestionText)
                            
                            if (isDuplicate) {
                                console.log(`Skipping duplicate question: "${newQuestion.question}"`)
                            }
                            
                            return !isDuplicate
                        })

                        if (uniqueQuestions.length === 0) {
                            toast.warning('All questions from the Aiken file already exist in this exam. No new questions were added.')
                            return
                        }

                        if (uniqueQuestions.length < data.length) {
                            const duplicateCount = data.length - uniqueQuestions.length
                            toast.info(`Found ${duplicateCount} duplicate question(s) that will be skipped. Importing ${uniqueQuestions.length} new questions...`)
                        } else {
                            toast.info(`Importing ${uniqueQuestions.length} questions...`)
                        }

                        // Upload each unique question to the exam
                        let successCount = 0
                        let failedCount = 0
                        
                        for (let i = 0; i < uniqueQuestions.length; i++) {
                            try {
                                const update = await clientAPI.post(`exam/question/${_id}`, uniqueQuestions[i])
                                if (update.data.code === 200) {
                                    successCount++
                                } else {
                                    failedCount++
                                    console.error(`Failed to add question ${i + 1}:`, update.data.message)
                                }
                            } catch (error) {
                                failedCount++
                                console.error(`Failed to add question ${i + 1}:`, error)
                            }
                        }

                        // Show appropriate success/error messages
                        if (successCount > 0 && failedCount === 0) {
                            toast.success(`Successfully imported ${successCount} new questions`)
                        } else if (successCount > 0 && failedCount > 0) {
                            toast.warning(`Successfully imported ${successCount} questions, but ${failedCount} failed to import`)
                        } else {
                            toast.error('Failed to import any questions. Please check the file format and try again.')
                        }

                        // Refresh the question list if any questions were added
                        if (successCount > 0) {
                            setTrigger(!trigger)
                        }

                    } catch (error) {
                        console.error('Error uploading file:', error)
                        toast.error('Failed to process the Aiken file. Please check the format and try again.')
                    }
                }
            })
        }
    }

    const onDeleteQuestion = async (id: string) => {
        try {
            const res = await clientAPI.delete(`exam/question?examination_id=${_id}&question_id=${id}`)
            toast.success('Question deleted successfully')
            setTrigger(!trigger)
        } catch (error) {
            console.error('Error deleting question:', error)
            toast.error('Failed to delete question')
            errorHandler(error)
        }
    }

    const handleDeleteQuestion = async () => {
        await onDeleteQuestion(deleteQuestionModal.questionId)
        setDeleteQuestionModal({ isOpen: false, questionId: '' })
    }

    const handleDeleteExamination = async () => {
        try {
            const res = await clientAPI.delete(`exam/${_id}`)
            toast.success(res.data.message || "Examination deleted successfully")
            router.push('/overview') // Redirect to overview page
        } catch (error) {
            console.error('Error deleting examination:', error)
            errorHandler(error)
        }
    }

    const handleDeleteAllQuestions = async () => {
        try {
            const res = await clientAPI.delete(`exam/question/all/${_id}`)
            toast.success(res.data.message)
            setTrigger(!trigger)
            setDeleteAllModal({ isOpen: false })
            setSelectedQuestions(new Set())
            setSelectAll(false)
        } catch (error) {
            console.log(error)
            errorHandler(error)
        }
    }

    const handleEditQuestion = (question: QuestionWithIdentifier<QuestionForm>) => {
        setEditingQuestion(question)
        setIsNewQuestion(true)
        setIsNestedQuestion(false)
    }

    const handleCancelEdit = () => {
        setEditingQuestion(null)
        setIsNewQuestion(false)
    }

    // Add pagination logic
    const indexOfLastQuestion = currentPage * questionsPerPage
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage
    const currentQuestions = questionList.slice(indexOfFirstQuestion, indexOfLastQuestion)
    const totalPages = Math.ceil(questionList.length / questionsPerPage)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        // Update select all state based on current selections
        setSelectAll(selectedQuestions.size === questionList.length && questionList.length > 0)
    }

    const handleQuestionSelect = (questionId: string, isSelected: boolean) => {
        const newSelected = new Set(selectedQuestions)
        if (isSelected) {
            newSelected.add(questionId)
        } else {
            newSelected.delete(questionId)
        }
        setSelectedQuestions(newSelected)
        
        // Update select all state
        setSelectAll(newSelected.size === questionList.length)
    }

    const handleSelectAll = (isSelected: boolean) => {
        if (isSelected) {
            const allQuestionIds = new Set(questionList.map(q => q._id!))
            setSelectedQuestions(allQuestionIds)
        } else {
            setSelectedQuestions(new Set())
        }
        setSelectAll(isSelected)
    }

    const handleDeleteSelected = async () => {
        try {
            // Use bulk delete API for better performance
            await clientAPI.delete('exam/questions/bulk', {
                data: {
                    examination_id: _id!,
                    question_ids: Array.from(selectedQuestions)
                }
            })
            
            toast.success(`${selectedQuestions.size} questions deleted successfully`)
            setSelectedQuestions(new Set())
            setSelectAll(false)
            setDeleteAllModal({ isOpen: false })
            setTrigger(!trigger)
        } catch (error) {
            console.error('Error deleting questions:', error)
            errorHandler(error)
        }
    }



    if (exam) {
        return (
            <DndContext
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[]}
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    <div className="lg:col-span-1 flex flex-col gap-y-4 lg:gap-y-8">
                        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 lg:gap-6">
                            <div className="flex flex-col gap-y-3">
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            startContent={<MingcuteAddFill fontSize={14} />}
                                            variant="flat"
                                            className="text-primary w-full sm:w-auto"
                                            color="primary"
                                            size="sm"
                                        > Add Question </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Static Actions" variant="faded">
                                        <DropdownItem
                                            startContent={<MingcuteFileNewFill />}
                                            key="add-question"
                                            onPress={() => {
                                                setIsNewQuestion(true)
                                                setIsNestedQuestion(false)
                                            }}
                                            isDisabled={isNewQuestion}
                                            className={`${isNewQuestion ? 'cursor-not-allowed' : ''}`}
                                        >
                                            New Question
                                        </DropdownItem>
                                        <DropdownItem
                                            onPress={() => {
                                                setIsNewQuestion(false)
                                                setIsNestedQuestion(true)
                                            }}
                                            startContent={<IconParkTwotoneNestedArrows />}
                                            description='' key="nested-question"
                                            isDisabled={isNestedQuestion}
                                        >
                                            <h1>Add Nested Question</h1>
                                            <span className="text-tiny text-foreground/50">add your nested question.</span>
                                        </DropdownItem>
                                        <DropdownItem startContent={<SystemUiconsReuse />} description='' key="reuse-question">
                                            <h1>Reuse Question</h1>
                                            <span className="text-tiny text-foreground/50">use your questions from question bank.</span>
                                        </DropdownItem>
                                        <DropdownItem onPress={onAikenImportClick} startContent={<IcRoundFolder />} description="" key="import-aiken">
                                            <h1>Import Aiken</h1>
                                            <span className="text-tiny text-foreground/50">Import your question using an Aiken file.</span>
                                            <label className="relative">
                                                <Input
                                                    className="absolute inset-0 opacity-0"
                                                    id="aiken-import" type="file" variant="faded"
                                                    size="sm" accept=".txt"
                                                />
                                            </label>

                                        </DropdownItem>

                                    </DropdownMenu>
                                </Dropdown>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                                    <Button
                                        variant="flat"
                                        color='warning'
                                        size="sm"
                                        onPress={onAikenModalOpen}
                                        className="w-full"
                                    > What's aiken? </Button>
                                    <Button
                                        startContent={<MdiBin fontSize={14} />}
                                        variant="flat"
                                        color='danger'
                                        size="sm"
                                        onPress={onOpen}
                                        className="w-full"
                                    > Delete </Button>
                                    <Button
                                        startContent={<MdiBin fontSize={14} />}
                                        variant="flat"
                                        color='danger'
                                        size="sm"
                                        onPress={() => setDeleteAllModal({ isOpen: true })}
                                        isDisabled={questionList.length === 0}
                                        className="w-full"
                                    > 
                                        <span className="hidden sm:inline">Delete All Questions</span>
                                        <span className="sm:hidden">Delete All</span>
                                    </Button>
                                    <div className="flex gap-x-2">
                                        <Button
                                            startContent={<IconParkOutlineCheckCorrect fontSize={14} />}
                                            variant="flat"
                                            className="text-blue-300 bg-blue-500/30 flex-1"
                                            size="sm"
                                        > Finish </Button>
                                        <Tooltip content='Preview your examination'>
                                            <Button
                                                onPress={() => {
                                                    window.location.href = `http://localhost:8080/overview/preview/examination?id=${_id}`
                                                }}
                                                startContent={<PhEyeDuotone fontSize={14} />}
                                                variant="flat"
                                                size="sm"
                                                isIconOnly
                                            > </Button>
                                        </Tooltip>
                                    </div>
                                </div>

                            </div>
                            <form className="w-full" onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    const res = await clientAPI.put(`exam/${_id}`, formValues);
                                    toast.success(res.data.message);
                                    setIsEditing(false);
                                    setTrigger(!trigger);
                                } catch (error) {
                                    errorHandler(error);
                                }
                            }}>
                                <Card>
                                    <CardBody className="gap-y-3">
                                        <Input
                                            size='sm'
                                            label='Examination Name'
                                            value={formValues.title}
                                            onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                                            isDisabled={!isEditing}
                                        />
                                        <Textarea
                                            label="Description"
                                            placeholder="Limit 1,000 characters."
                                            value={formValues.description}
                                            onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                                            isDisabled={!isEditing}
                                        />

                                    </CardBody>
                                    <CardFooter className="pt-0 flex justify-between">
                                        <Button
                                            size="sm"
                                            color="success"
                                            isDisabled={!isEditing}
                                            type="submit"
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            color="warning"
                                            onPress={() => setIsEditing(!isEditing)}
                                        >
                                            {isEditing ? 'Cancel' : 'Edit'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </form>
                        </div>
                        {questionList.length == 0 ?
                            <div className="flex flex-col gap-y-3">
                                <p className="text-center text-sm text-foreground/50">No question added yet.</p>
                            </div>
                            :

                            <div className="flex flex-col gap-y-3">
                                {/* Selection Controls */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            color="secondary"
                                            isSelected={selectAll}
                                            isIndeterminate={selectedQuestions.size > 0 && selectedQuestions.size < questionList.length}
                                            onValueChange={handleSelectAll}
                                            size="sm"
                                        >
                                            <span className="hidden sm:inline">Select All ({questionList.length} questions)</span>
                                            <span className="sm:hidden">All ({questionList.length})</span>
                                        </Checkbox>
                                        {selectedQuestions.size > 0 && (
                                            <span className="text-sm text-foreground/70">
                                                {selectedQuestions.size} selected
                                            </span>
                                        )}
                                    </div>
                                    {selectedQuestions.size > 0 && (
                                        <Button
                                            startContent={<MdiBin fontSize={14} />}
                                            variant="flat"
                                            color="danger"
                                            size="sm"
                                            onPress={() => setDeleteAllModal({ isOpen: true })}
                                            className="w-full sm:w-auto"
                                        >
                                            <span className="hidden sm:inline">Delete Selected ({selectedQuestions.size})</span>
                                            <span className="sm:hidden">Delete ({selectedQuestions.size})</span>
                                        </Button>
                                    )}
                                </div>
                                
                                <SortableContext items={currentQuestions} strategy={verticalListSortingStrategy}>
                                    {currentQuestions.map((question, index) => (
                                        <div className="flex gap-x-3 items-start" key={index}>
                                            <Checkbox
                                                color="secondary"
                                                isSelected={selectedQuestions.has(question._id!)}
                                                onValueChange={(isSelected) => handleQuestionSelect(question._id!, isSelected)}
                                                size="sm"
                                                className="mt-2"
                                            />
                                            <DraggableQuestion 
                                                question={question} 
                                                id={question.id} 
                                                onEdit={handleEditQuestion}
                                            />
                                            <Tooltip content="Delete question">
                                                <Button
                                                    size="sm"
                                                    isIconOnly
                                                    variant="flat"
                                                    color="danger"
                                                    className="hover:animate-pulse"
                                                    onPress={() => setDeleteQuestionModal({ isOpen: true, questionId: question._id! })}
                                                >
                                                    <MdiBin fontSize={16} />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    ))}
                                </SortableContext>
                                
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row gap-2 mt-4 items-center">
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            isDisabled={currentPage === 1}
                                            onPress={() => handlePageChange(currentPage - 1)}
                                            className="w-full sm:w-auto"
                                        >
                                            <span className="hidden sm:inline">Previous</span>
                                            <span className="sm:hidden">Prev</span>
                                        </Button>
                                        <div className="flex gap-1 flex-wrap justify-center">
                                            {currentPage > 1 && (
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => handlePageChange(1)}
                                                >
                                                    1
                                                </Button>
                                            )}
                                            {currentPage > 2 && (
                                                <span className="flex items-center text-xs">...</span>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="solid"
                                                color="secondary"
                                            >
                                                {currentPage}
                                            </Button>
                                            {currentPage < totalPages - 1 && (
                                                <span className="flex items-center text-xs">...</span>
                                            )}
                                            {currentPage < totalPages && (
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => handlePageChange(totalPages)}
                                                >
                                                    {totalPages}
                                                </Button>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            isDisabled={currentPage === totalPages}
                                            onPress={() => handlePageChange(currentPage + 1)}
                                            className="w-full sm:w-auto"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>}
                    </div>
                    <div className="lg:col-span-2">
                        {isNewQuestion ?
                            <NewQuestionForm 
                                examination_id={_id!} 
                                editingQuestion={editingQuestion}
                                onEditComplete={handleCancelEdit}
                            />
                            : null
                        }
                        {isNestedQuestion ?
                            <NestedQuestionForm examinationId={_id || ''} />
                            : null
                        }
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                    <ConfirmModal 
                        header="Delete Examination" 
                        subHeader="Are you sure you want to delete this examination?" 
                        content="This action cannot be undone. All questions and data associated with this examination will be permanently deleted."
                        onAction={handleDeleteExamination}
                    />
                </Modal>

                {/* Delete Question Confirmation Modal */}
                <Modal isOpen={deleteQuestionModal.isOpen} onOpenChange={() => setDeleteQuestionModal({ isOpen: false, questionId: '' })}>
                    <ConfirmModal 
                        header="Delete Question" 
                        subHeader="Are you sure you want to delete this question?" 
                        content="This action cannot be undone. The question will be permanently deleted."
                        onAction={handleDeleteQuestion}
                    />
                </Modal>

                {/* Delete All/Selected Questions Confirmation Modal */}
                <Modal isOpen={deleteAllModal.isOpen} onOpenChange={() => setDeleteAllModal({ isOpen: false })}>
                    <ConfirmModal 
                        header={selectedQuestions.size > 0 ? "Delete Selected Questions" : "Delete All Questions"}
                        subHeader={selectedQuestions.size > 0 
                            ? `Are you sure you want to delete ${selectedQuestions.size} selected questions?` 
                            : `Are you sure you want to delete all ${questionList.length} questions?`
                        }
                        content="This action cannot be undone. The questions will be permanently deleted."
                        onAction={selectedQuestions.size > 0 ? handleDeleteSelected : handleDeleteAllQuestions}
                    />
                </Modal>

                {/* Aiken Format Information Modal */}
                <Modal 
                    isOpen={isAikenModalOpen} 
                    onOpenChange={onAikenModalOpenChange}
                    size="4xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <h2 className="text-2xl font-bold text-primary">What is Aiken Format?</h2>
                                    <p className="text-sm text-default-500">Learn about the Aiken question format for importing multiple choice questions</p>
                                </ModalHeader>
                                <ModalBody className="pb-6">
                                    <div className="space-y-6">
                                        {/* Introduction */}
                                        <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                                            <h3 className="font-semibold text-primary mb-2">📚 Overview</h3>
                                            <p className="text-sm text-default-700">
                                                Aiken format is a simple text-based format for creating multiple choice questions. 
                                                It's widely used in educational systems and can be easily imported into XAMS to quickly 
                                                create multiple choice questions for your exams.
                                            </p>
                                        </div>

                                        {/* Format Structure */}
                                        <div>
                                            <h3 className="font-semibold text-lg mb-3">📋 Format Structure</h3>
                                            <div className="bg-default-100 p-4 rounded-lg">
                                                <p className="text-sm mb-2">Each question follows this structure:</p>
                                                <ol className="list-decimal list-inside text-sm space-y-1 text-default-700">
                                                    <li>Question text (can span multiple lines)</li>
                                                    <li>Answer choices labeled A, B, C, D, etc.</li>
                                                    <li>Correct answer indicated by "ANSWER: X" (where X is the correct choice letter)</li>
                                                    <li>Empty line to separate questions</li>
                                                </ol>
                                            </div>
                                        </div>

                                        {/* Examples */}
                                        <div>
                                            <h3 className="font-semibold text-lg mb-3">💡 Examples</h3>
                                            
                                            {/* Example 1 */}
                                            <div className="mb-4">
                                                <h4 className="font-medium text-primary mb-2">Example 1: Basic Question</h4>
                                                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                                    <pre>{`What is the capital of Thailand?
A. Bangkok
B. Chiang Mai
C. Phuket
D. Pattaya
ANSWER: A`}</pre>
                                                </div>
                                            </div>

                                            {/* Example 2 */}
                                            <div className="mb-4">
                                                <h4 className="font-medium text-primary mb-2">Example 2: Programming Question</h4>
                                                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                                    <pre>{`Which programming language is known for its use in web development?
A. COBOL
B. JavaScript
C. FORTRAN
D. Assembly
ANSWER: B`}</pre>
                                                </div>
                                            </div>

                                            {/* Example 3 */}
                                            <div className="mb-4">
                                                <h4 className="font-medium text-primary mb-2">Example 3: Multiple Questions in One File</h4>
                                                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                                    <pre>{`What is 2 + 2?
A. 3
B. 4
C. 5
D. 6
ANSWER: B

Which planet is closest to the Sun?
A. Venus
B. Earth
C. Mercury
D. Mars
ANSWER: C

What is the largest mammal?
A. Elephant
B. Blue Whale
C. Giraffe
D. Hippopotamus
ANSWER: B`}</pre>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rules and Tips */}
                                        <div>
                                            <h3 className="font-semibold text-lg mb-3">⚠️ Important Rules</h3>
                                            <div className="bg-warning-50 p-4 rounded-lg border border-warning-200">
                                                <ul className="list-disc list-inside text-sm space-y-2 text-default-700">
                                                    <li><strong>Answer choices must start with letters:</strong> A, B, C, D, E, etc.</li>
                                                    <li><strong>ANSWER line is required:</strong> Must be exactly "ANSWER: X" format</li>
                                                    <li><strong>Separate questions:</strong> Use empty lines between questions</li>
                                                    <li><strong>File format:</strong> Save as .txt file with UTF-8 encoding</li>
                                                    <li><strong>Question limit:</strong> Each question can have up to 6 choices (A-F)</li>
                                                    <li><strong>No HTML:</strong> Plain text only, HTML tags will be treated as text</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* How to Use */}
                                        <div>
                                            <h3 className="font-semibold text-lg mb-3">🚀 How to Import</h3>
                                            <div className="bg-success-50 p-4 rounded-lg border border-success-200">
                                                <ol className="list-decimal list-inside text-sm space-y-2 text-default-700">
                                                    <li>Create your questions in Aiken format using any text editor</li>
                                                    <li>Save the file with .txt extension</li>
                                                    <li>Click the "Import Questions" dropdown above</li>
                                                    <li>Select "Import from Aiken File"</li>
                                                    <li>Choose your .txt file</li>
                                                    <li>Questions will be automatically imported and added to your exam</li>
                                                </ol>
                                            </div>
                                        </div>

                                        {/* Benefits */}
                                        <div>
                                            <h3 className="font-semibold text-lg mb-3">✨ Benefits</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                    <h4 className="font-medium text-blue-800 mb-1">⚡ Fast Import</h4>
                                                    <p className="text-xs text-blue-700">Import multiple questions at once instead of creating them one by one</p>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                    <h4 className="font-medium text-green-800 mb-1">📝 Easy to Write</h4>
                                                    <p className="text-xs text-green-700">Simple text format that anyone can create with basic text editors</p>
                                                </div>
                                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                                    <h4 className="font-medium text-purple-800 mb-1">🔄 Reusable</h4>
                                                    <p className="text-xs text-purple-700">Save question banks as Aiken files for future use</p>
                                                </div>
                                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                                    <h4 className="font-medium text-orange-800 mb-1">🌐 Universal</h4>
                                                    <p className="text-xs text-orange-700">Widely supported format across different educational platforms</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ModalBody>
                            </>
                        )}
                    </ModalContent>
                </Modal>

            </DndContext>
        )
    } else {
        return (
            <div>No content</div>
        )
    }
}
