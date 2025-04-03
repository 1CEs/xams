"use client"

import { FluentSettings16Filled, MdiBin, MingcuteAddFill, UisSchedule } from "@/components/icons/icons"
import Loading from "@/components/state/loading"
import NotFound from "@/components/state/not-found"
import { useFetch } from "@/hooks/use-fetch"
import { Accordion, AccordionItem, Avatar, AvatarGroup, Button, Calendar, Modal, Tab, Tabs, Tooltip, useDisclosure } from "@nextui-org/react"
import ConfirmModal from "@/components/modals/confirm-modal"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"
import { toast } from "react-toastify"
import { useTrigger } from "@/stores/trigger.store"

import GroupFormModal from "@/components/overview/modals/group-form-modal"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { today, getLocalTimeZone } from '@internationalized/date'
import { LearnersTable } from "@/components/course/learner-table"

export default function CoursePage() {
    const params = useSearchParams()
    const _id = params.get('id')
    const { data, error, isLoading } = useFetch<ServerResponse<CourseResponse>>(`/course/${_id}`)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const { trigger, setTrigger } = useTrigger()
    
    // State for delete confirmation modal
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null)
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalOpenChange } = useDisclosure()
    
    const openDeleteConfirmation = (groupName: string) => {
        setGroupToDelete(groupName)
        onDeleteModalOpen()
    }
    
    const handleDeleteGroup = async () => {
        if (!groupToDelete) return
        
        try {
            const res = await clientAPI.delete(`/course/${_id}/group/${encodeURIComponent(groupToDelete)}`)
            toast.success('Group deleted successfully')
            setTrigger(!trigger)
            setGroupToDelete(null)
        } catch (err) {
            console.error(err)
            errorHandler(err)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center size-full">
                <Loading />
            </div>
        )
    }

    if (!data?.data) {
        return (
            <div className="flex justify-center items-center size-full">
                <NotFound content={_id as string} />
            </div>
        )
    }

    return (
        <div className="flex size-full gap-y-8 gap-x-14 px-32">
            <div className="flex flex-col basis-9/12 gap-y-8">
                <Image unoptimized className="h-[24rem] w-full rounded-lg" src={data.data.background_src} width={900} height={600} alt="course background" />
                <Tabs>
                    <Tab title="Examination">
                        <Accordion variant="splitted">
                            {
                                Array.from({ length: Math.random() * 10 + 1 }).map((_, idx: number) => (
                                    <AccordionItem title={`Examination ${idx + 1}`} key={idx}>
                                        <div className="flex p-2 text-tiny text-gray-400 justify-center">
                                            Empty
                                        </div>
                                    </AccordionItem>
                                ))
                            }
                        </Accordion>

                    </Tab>
                    <Tab title="Learners">
                        <LearnersTable />
                    </Tab>
                </Tabs>
            </div>
            <div className="flex flex-col gap-y-6 basis-3/12">
                <AvatarGroup size="md" isBordered max={5}>
                    {
                        Array.from({ length: Math.random() * 10 + 1 }).map(() => (
                            <Avatar src="https://pic.re/image" />
                        ))
                    }
                </AvatarGroup>
                <Accordion className="p-0" isCompact variant="splitted">
                    <AccordionItem
                        startContent={
                            <Button 
                                size="sm" 
                                variant="light" 
                                isIconOnly
                                onPress={onOpen}
                            >
                                <MingcuteAddFill />
                            </Button>
                        }
                        key={1}
                        aria-label="Group"
                        title="Group"
                    >
                        {data.data.groups && data.data.groups.length > 0 ? (
                            <div className="flex flex-col gap-y-2">
                                {data.data.groups.map((group: IGroup, index: number) => (
                                    <div key={index} className="p-2 border border-secondary/50 rounded-md">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-semibold">{group.group_name}</h3>
                                            <div className="flex items-center gap-x-2">
                                                <span className="text-xs bg-secondary/20 px-2 py-1 rounded-full">
                                                    Code: {group.join_code}
                                                </span>
                                                <span className="text-xs bg-primary/20 px-2 py-1 rounded-full">
                                                    {group.students.length} students
                                                </span>
                                                <Tooltip content={`Delete ${group.group_name}`}>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        color="danger"
                                                        onPress={() => openDeleteConfirmation(group.group_name)}
                                                    >
                                                        <MdiBin fontSize={16} />
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex p-2 text-tiny text-gray-400 justify-center">
                                No groups created yet
                            </div>
                        )}
                    </AccordionItem>
                </Accordion>
                
                {/* Group creation modal */}
                <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                    <GroupFormModal courseId={_id as string} />
                </Modal>
                
                {/* Group deletion confirmation modal */}
                <Modal isOpen={isDeleteModalOpen} onOpenChange={onDeleteModalOpenChange}>
                    <ConfirmModal 
                        header="Delete Group"
                        subHeader="Are you sure you want to delete this group?"
                        content={`This will permanently delete the group "${groupToDelete}" and remove all students from it. This action cannot be undone.`}
                        onAction={handleDeleteGroup}
                    />
                </Modal>
                <div className="flex flex-wrap gap-x-2">
                    <Tooltip content="Examination Schedule">
                        <Button color="secondary" isIconOnly>
                            <UisSchedule />
                        </Button>
                    </Tooltip>

                    <Button color="warning" isIconOnly>
                        <FluentSettings16Filled fontSize={24} />
                    </Button>
                    <Button color="danger" isIconOnly>
                        <MdiBin fontSize={24} />
                    </Button>
                </div>
                <Calendar color="secondary" isReadOnly aria-label="Schedule" value={today(getLocalTimeZone())} />
            </div>

        </div>
    )
}
