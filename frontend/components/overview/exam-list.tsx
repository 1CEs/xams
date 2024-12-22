import { clientAPI } from '@/config/axios.config'
import { errorHandler } from '@/utils/error'
import { Accordion, AccordionItem, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Modal, useDisclosure } from '@nextui-org/react'
import React, { useEffect, useState } from 'react'
import { FluentSettings16Filled, MdiBin, MdiPaper } from '../icons/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUserStore } from '@/stores/user.store'
import { title } from 'process'
import ConfirmModal from '../modals/confirm-modal'
import { toast } from 'react-toastify'
import { useTrigger } from '@/stores/trigger.store'

type Props = {}

const ExamList = (props: Props) => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [exams, setExams] = useState<ExamResponse[]>([])
    const { user } = useUserStore()
    const pathName = usePathname()
    const { trigger, setTrigger } = useTrigger()

    const onExamDelete = async (id: string) => {
        try {
          const res = await clientAPI.delete(`exam/${id}`)
          toast.success(res.data.message)
          setTrigger(!trigger)
        } catch (error) {
          errorHandler(error)
        }
      }

    useEffect(() => {
        const getExams = async () => {
            try {
                const res = await clientAPI.get(`exam?instructor_id=${user?._id}`)
                setExams(res.data.data)
                console.log(res.data)
            } catch (error) {
                errorHandler(error)
            }
        }
        getExams()
    }, [trigger])

    return (
        <div className='flex flex-col pl-24'>
            <Accordion variant='splitted'>
                {exams.length > 0 ? (
                    exams.map((exam: ExamResponse) => (
                        <AccordionItem
                            startContent={<MdiPaper fontSize={24} />}
                            key={exam._id}
                            title={exam.title}
                        >
                            <div className='flex flex-col'>
                                <div className='flex justify-between items-center'>
                                    <h1 className='text-sm text-foreground/50'>Questions: {exam.questions.length} items</h1>
                                    <div className='flex gap-x-3'>
                                        <Button as={Link} href={pathName + '/create/examination?id=' + exam._id} color='warning' size='sm'>Manage</Button>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button size='sm' isIconOnly><FluentSettings16Filled fontSize={20} /></Button>
                                            </DropdownTrigger>
                                            <DropdownMenu aria-label="Static Actions">
                                                <DropdownItem onPress={onOpen} startContent={<MdiBin fontSize={20} />} key="delete" className="text-danger" color="danger">
                                                    Delete Examination
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                                            <ConfirmModal
                                                content={`${exam.title} will be delete after you confirm it.`}
                                                header={`Delete ${exam.title}`}
                                                subHeader={`After you confirm it won't be revert.`}
                                                onAction={() => {onExamDelete(exam._id)}}
                                            />
                                        </Modal>
                                    </div>

                                </div>

                            </div>
                        </AccordionItem>
                    ))
                ) : (
                    <AccordionItem title="No exams available">
                        Currently, there are no exams to display.
                    </AccordionItem>
                )}
            </Accordion>
        </div>
    )
}

export default ExamList
