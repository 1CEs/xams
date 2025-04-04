"use client"

import { FluentSettings16Filled, MdiBin, MingcuteAddFill, UisSchedule } from "@/components/icons/icons"
import Loading from "@/components/state/loading"
import NotFound from "@/components/state/not-found"
import { useFetch } from "@/hooks/use-fetch"
import { Accordion, AccordionItem, Avatar, AvatarGroup, Button, Calendar, Chip, Modal, Tab, Tabs, Tooltip, useDisclosure } from "@nextui-org/react"
import ConfirmModal from "@/components/modals/confirm-modal"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"
import { toast } from "react-toastify"
import { useTrigger } from "@/stores/trigger.store"

import GroupFormModal from "@/components/overview/modals/group-form-modal"
import ExamScheduleModal from "@/components/overview/modals/exam-schedule-modal"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { today, getLocalTimeZone } from '@internationalized/date'
import { LearnersTable } from "@/components/course/learner-table"
import { useRouter } from "next/navigation"
import CourseUpdateModal from "@/components/overview/modals/course-update-modal"

export default function CoursePage() {
    const params = useSearchParams()
    const _id = params.get('id')
    const { data, error, isLoading } = useFetch<ServerResponse<CourseResponse>>(`/course/${_id}`)
    const { data: instructor } = useFetch<ServerResponse<UserResponse>>(`/user/${data?.data.instructor_id}`)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const { trigger, setTrigger } = useTrigger()
    const router = useRouter()

    // State for modals
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null)
    const [examToDelete, setExamToDelete] = useState<{ groupName: string, examSettingIndex: number } | null>(null)
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalOpenChange } = useDisclosure()
    const { isOpen: isDeleteExamModalOpen, onOpen: onDeleteExamModalOpen, onOpenChange: onDeleteExamModalOpenChange } = useDisclosure()
    const { isOpen: isScheduleModalOpen, onOpen: onScheduleModalOpen, onOpenChange: onScheduleModalOpenChange } = useDisclosure()
    const { isOpen: isDeleteCourseModalOpen, onOpen: onDeleteCourseModalOpen, onOpenChange: onDeleteCourseModalOpenChange } = useDisclosure()
    const { isOpen: isUpdateModalOpen, onOpen: onUpdateModalOpen, onOpenChange: onUpdateModalOpenChange } = useDisclosure()

    const openDeleteConfirmation = (groupName: string) => {
        setGroupToDelete(groupName)
        onDeleteModalOpen()
    }

    const openDeleteExamConfirmation = (groupName: string, examSettingIndex: number) => {
        setExamToDelete({ groupName, examSettingIndex })
        onDeleteExamModalOpen()
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

    const handleDeleteExam = async () => {
        if (!examToDelete) return

        try {
            const res = await clientAPI.delete(
                `/course/${_id}/group/${encodeURIComponent(examToDelete.groupName)}/exam-setting/${examToDelete.examSettingIndex}`
            )
            toast.success('Examination schedule deleted successfully')
            setTrigger(!trigger)
            setExamToDelete(null)
        } catch (err) {
            console.error(err)
            errorHandler(err)
        }
    }

    const handleDeleteCourse = async () => {
        try {
            const res = await clientAPI.delete(`/course/${_id}`)
            toast.success('Course deleted successfully')
            // Redirect to courses page after deletion
            router.push('/overview')
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
            <div className="flex flex-col basis-9/12 gap-y-4">
                <div className="relative h-[24rem] w-full rounded-lg overflow-hidden">
                    <Image
                        unoptimized
                        className="h-full w-full object-cover"
                        src={data.data.background_src}
                        width={900}
                        height={600}
                        alt="course background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/25" />
                    <div className="absolute inset-0 p-8 flex flex-col justify-start">
                        <div className="h-full w-full flex flex-col justify-between">
                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold text-white">{data.data.course_name}</h1>
                                <p className="text-white/90 indent-16 text-justify">{data.data.description}</p>
                            </div>

                            <div className="flex items-center justify-between gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-bold">{instructor?.data.info.first_name} {instructor?.data.info.last_name}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-background/70 p-2 rounded-xl">
                                    <span className="text-white text-sm">Groups:</span>
                                    <span className="text-white text-sm">{data.data.groups?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Tabs aria-label="Course Groups">
                    {data.data.groups && data.data.groups.length > 0 ? (
                        data.data.groups.map((group: IGroup, index: number) => (
                            <Tab key={index} title={group.group_name}>
                                <div className="">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold">{group.group_name}</h2>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs bg-secondary/20 px-2 py-1 rounded-full">
                                                    Join Code: {group.join_code}
                                                </span>
                                                <span className="text-xs bg-primary/20 px-2 py-1 rounded-full">
                                                    {group.students.length} students
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                color="danger"
                                                variant="light"
                                                startContent={<MdiBin />}
                                                onPress={() => openDeleteConfirmation(group.group_name)}
                                            >
                                                Delete Group
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        <div className="mt-4">
                                            <h3 className="text-lg font-semibold mb-4">Students</h3>
                                            {group.students.length > 0 ? (
                                                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
                                                    <div className="bg-secondary/10 px-4 py-3">
                                                        <h4 className="font-medium">Enrolled Students ({group.students.length})</h4>
                                                    </div>
                                                    <div className="p-4">
                                                        <LearnersTable studentIds={group.students} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg">
                                                    <p className="text-gray-500 mb-4">No students have joined this group yet</p>
                                                    <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-lg">
                                                        <span className="font-medium">Share join code:</span>
                                                        <span className="font-bold">{group.join_code}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {group.exam_setting && group.exam_setting.length > 0 && (
                                            <div className="mt-4">
                                                <h3 className="text-lg font-semibold mb-4">Scheduled Exams</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {group.exam_setting.map((setting, idx) => (
                                                        <div key={idx} className="bg-gradient-to-r from-secondary/5 to-primary/5 rounded-xl overflow-hidden shadow-sm border border-secondary/10">
                                                            <div className="bg-secondary/10 px-4 py-3 flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="bg-secondary text-white p-1.5 rounded-full">
                                                                        <UisSchedule fontSize={16} />
                                                                    </div>
                                                                    <h4 className="font-medium">Exam #{idx + 1}</h4>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Chip size="sm" color="primary" variant="flat" className="font-mono">
                                                                        {setting.exam_code}
                                                                    </Chip>
                                                                    <Tooltip content="Delete this exam schedule">
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="light"
                                                                            color="danger"
                                                                            onPress={() => openDeleteExamConfirmation(group.group_name, idx)}
                                                                        >
                                                                            <MdiBin fontSize={16} />
                                                                        </Button>
                                                                    </Tooltip>
                                                                </div>
                                                            </div>

                                                            <div className="p-4">
                                                                <div className="flex justify-between items-center mb-3">
                                                                    <span className="text-xs font-medium text-gray-500">EXAM ID</span>
                                                                    <span className="font-mono text-sm">{setting.exam_id}</span>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                                    <div className="bg-secondary/10 p-3 rounded-lg">
                                                                        <div className="text-xs font-medium text-gray-500 mb-1">OPENS</div>
                                                                        <div className="text-sm">{new Date(setting.open_time).toLocaleString()}</div>
                                                                    </div>
                                                                    <div className="bg-secondary/10 p-3 rounded-lg">
                                                                        <div className="text-xs font-medium text-gray-500 mb-1">CLOSES</div>
                                                                        <div className="text-sm">{new Date(setting.close_time).toLocaleString()}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-wrap gap-2 mt-3">
                                                                    <Chip size="sm" variant="flat" color="default">
                                                                        {setting.allowed_attempts} attempt{setting.allowed_attempts !== 1 ? 's' : ''}
                                                                    </Chip>
                                                                    <Chip size="sm" variant="flat" color={setting.allowed_review ? "success" : "danger"}>
                                                                        {setting.allowed_review ? 'Review allowed' : 'No review'}
                                                                    </Chip>
                                                                    <Chip size="sm" variant="flat" color={setting.show_answer ? "success" : "danger"}>
                                                                        {setting.show_answer ? 'Show answers' : 'Hide answers'}
                                                                    </Chip>
                                                                    <Chip size="sm" variant="flat" color={setting.randomize_question ? "warning" : "default"}>
                                                                        {setting.randomize_question ? 'Random questions' : 'Fixed order'}
                                                                    </Chip>
                                                                </div>

                                                                {setting.ip_range && (
                                                                    <div className="mt-3 text-xs">
                                                                        <span className="font-medium text-gray-500">IP RANGE: </span>
                                                                        <span className="font-mono">{setting.ip_range}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </Tab>
                        ))
                    ) : (
                        <Tab key="no-groups" title="No Groups">
                            <div className="flex flex-col items-center justify-center p-8 mt-4">
                                <p className="text-gray-500 mb-4">No groups have been created for this course yet</p>
                                <Button
                                    color="secondary"
                                    startContent={<MingcuteAddFill />}
                                    onPress={onOpen}
                                >
                                    Create Group
                                </Button>
                            </div>
                        </Tab>
                    )}
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

                {/* Exam deletion confirmation modal */}
                <Modal isOpen={isDeleteExamModalOpen} onOpenChange={onDeleteExamModalOpenChange}>
                    <ConfirmModal
                        header="Delete Examination Schedule"
                        subHeader="Are you sure you want to delete this examination schedule?"
                        content={`This will permanently delete the examination schedule from the group "${examToDelete?.groupName}". This action cannot be undone.`}
                        onAction={handleDeleteExam}
                    />
                </Modal>

                {/* Course deletion confirmation modal */}
                <Modal isOpen={isDeleteCourseModalOpen} onOpenChange={onDeleteCourseModalOpenChange}>
                    <ConfirmModal
                        header="Delete Course"
                        subHeader="Are you sure you want to delete this course?"
                        content={`This will permanently delete the course "${data.data.course_name}" and all associated groups, exams, and student data. This action cannot be undone.`}
                        onAction={handleDeleteCourse}
                    />
                </Modal>

                <div className="flex flex-wrap gap-x-2">
                    <Tooltip content="Examination Schedule">
                        <Button
                            color="secondary"
                            isIconOnly
                            onPress={() => {
                                if (!data.data.groups || data.data.groups.length === 0) {
                                    toast.warning('Please create a group first')
                                    return
                                }

                                // Open the modal directly, group selection is handled in the modal
                                onScheduleModalOpen()
                            }}
                        >
                            <UisSchedule />
                        </Button>
                    </Tooltip>

                    <Tooltip content="Update Course">
                        <Button color="warning" isIconOnly onPress={onUpdateModalOpen}>
                            <FluentSettings16Filled fontSize={24} />
                        </Button>
                    </Tooltip>
                    <Tooltip content="Delete Course">
                        <Button color="danger" isIconOnly onPress={onDeleteCourseModalOpen}>
                            <MdiBin fontSize={24} />
                        </Button>
                    </Tooltip>
                </div>

                {/* Examination Schedule Modal */}
                <Modal isOpen={isScheduleModalOpen} onOpenChange={onScheduleModalOpenChange} size="3xl">
                    {data.data.groups && (
                        <ExamScheduleModal
                            courseId={_id as string}
                            groups={data.data.groups}
                        />
                    )}
                </Modal>

                {/* Course Update Modal */}
                <Modal size="2xl" isOpen={isUpdateModalOpen} onOpenChange={onUpdateModalOpenChange}>
                    {data.data && (
                        <CourseUpdateModal
                            courseId={_id as string}
                            initialData={{
                                course_name: data.data.course_name,
                                description: data.data.description,
                                background_src: data.data.background_src
                            }}
                        />
                    )}
                </Modal>

                <Calendar color="secondary" isReadOnly aria-label="Schedule" value={today(getLocalTimeZone())} />
            </div>

        </div>
    )
}
