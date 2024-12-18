import { Dropdown, DropdownTrigger, Button, DropdownMenu, DropdownItem, useDisclosure, Modal } from '@nextui-org/react'
import React, { useState } from 'react'
import { FluentClass24Filled, HealthiconsIExamMultipleChoice, MaterialSymbolsAssignment } from '../icons/icons'
import ExamFormModal from './modals/exam-form-modal'
import CategoryFormModal from './modals/category-form-modal'
import CourseFormModal from './modals/course-form-modal'

type Props = {}

const CreateAction = (props: Props) => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const modalRenderer = {
        category: <CategoryFormModal />,
        exam: <ExamFormModal />,
        course: <CourseFormModal />

    }
    const [modalSelector, setModalSelector] = useState<keyof typeof modalRenderer>('exam')
    const onModalOpen = (name: keyof typeof modalRenderer) => {
        setModalSelector(name)
        onOpen()
    }

    return (
        <div className='size-full'>
            <Dropdown backdrop="opaque" className='w-full'>
                <DropdownTrigger>
                    <Button
                        className='w-full'
                        variant="light"
                    ><div className="w-full text-start">
                            Create
                        </div>
                    </Button>
                </DropdownTrigger>
                <DropdownMenu variant="faded" aria-label="Dropdown menu with description">
                    <DropdownItem
                        key="new"
                        startContent={<FluentClass24Filled fontSize={24} />}
                        description="Create a new course"
                        onPress={() => onModalOpen('course')}
                    >
                        New Course
                    </DropdownItem>
                    <DropdownItem
                        startContent={<HealthiconsIExamMultipleChoice fontSize={24} />}
                        key="wxamination"
                        description="Create a new examination"
                        onPress={() => onModalOpen('exam')}
                    >
                        New Examination
                    </DropdownItem>
                    <DropdownItem
                        key="category"
                        description="Create a new category"
                        startContent={<MaterialSymbolsAssignment fontSize={24} />}
                        onPress={() => onModalOpen('category')}
                    >
                        Category
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
            <Modal size='2xl' isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
                {modalRenderer[modalSelector]}
            </Modal>

        </div>

    )
}

export default CreateAction