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
import { useQuestionListStore } from "@/stores/question.store/question-list.store"
import { useNestedQuestionsStore } from "@/stores/question.store/nested-question.store"
import { useTrigger } from "@/stores/trigger.store"
import { toast } from "react-toastify"

export default function CreateExaminationPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const _id = searchParams.get('id')
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
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

                    const formData = new FormData()
                    formData.append('file', file)

                    try {
                        toast.info('Uploading questions...')
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

                        // Upload each question to the exam
                        let successCount = 0
                        for (let i = 0; i < data.length; i++) {
                            try {
                                const update = await clientAPI.post(`exam/question/${_id}`, data[i])
                                if (update.data.code === 200) {
                                    successCount++
                                }
                            } catch (error) {
                                console.error(`Failed to add question ${i + 1}:`, error)
                            }
                        }

                        if (successCount > 0) {
                            toast.success(`Successfully imported ${successCount} questions`)
                            setTrigger(!trigger)
                        } else {
                            toast.error('Failed to add any questions to the exam')
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

    const handleDeleteAllQuestions = async () => {
        try {
            // Use bulk delete API for better performance
            const allQuestionIds = questionList.map(question => question._id!)
            await clientAPI.delete('exam/questions/bulk', {
                data: {
                    examination_id: _id!,
                    question_ids: allQuestionIds
                }
            })
            
            toast.success('All questions deleted successfully')
            setSelectedQuestions(new Set())
            setSelectAll(false)
            setDeleteAllModal({ isOpen: false })
            setTrigger(!trigger)
        } catch (error) {
            console.error('Error deleting all questions:', error)
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
                <div className="grid grid-cols-3">
                    <div className="col-span-1 flex flex-col gap-y-8">
                        <div className="flex flex-row-reverse gap-x-6">
                            <div className="flex flex-col gap-y-3">
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            startContent={<MingcuteAddFill fontSize={14} />}
                                            variant="flat"
                                            className="text-primary"
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
                                <Button
                                    startContent={<MdiBin fontSize={14} />}
                                    variant="flat"
                                    color='danger'
                                    size="sm"
                                    onPress={onOpen}
                                > Delete </Button>
                                <Button
                                    startContent={<MdiBin fontSize={14} />}
                                    variant="flat"
                                    color='danger'
                                    size="sm"
                                    onPress={() => setDeleteAllModal({ isOpen: true })}
                                    isDisabled={questionList.length === 0}
                                > Delete All Questions </Button>
                                <div className="flex gap-x-2">
                                    <Button
                                        startContent={<IconParkOutlineCheckCorrect fontSize={14} />}
                                        variant="flat"
                                        className="text-blue-300 bg-blue-500/30 w-full"
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
                                <div className="flex items-center justify-between py-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            color="secondary"
                                            isSelected={selectAll}
                                            isIndeterminate={selectedQuestions.size > 0 && selectedQuestions.size < questionList.length}
                                            onValueChange={handleSelectAll}
                                            size="sm"
                                        >
                                            Select All ({questionList.length} questions)
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
                                        >
                                            Delete Selected ({selectedQuestions.size})
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
                                            <DraggableQuestion question={question} id={question.id} />
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
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            isDisabled={currentPage === 1}
                                            onPress={() => handlePageChange(currentPage - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <div className="flex gap-1">
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
                                                <span className="flex items-center">...</span>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="solid"
                                                color="secondary"
                                            >
                                                {currentPage}
                                            </Button>
                                            {currentPage < totalPages - 1 && (
                                                <span className="flex items-center">...</span>
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
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>}
                    </div>
                    {isNewQuestion ?
                        <NewQuestionForm examination_id={_id!} />
                        : null
                    }
                    {isNestedQuestion ?
                        <NestedQuestionForm examinationId={_id || ''} />
                        : null
                    }
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

            </DndContext>
        )
    } else {
        return (
            <div>No content</div>
        )
    }
}
