"use client"

import { FluentSettings16Filled, MdiBin, MingcuteAddFill, UisSchedule } from "@/components/icons/icons"
import Loading from "@/components/state/loading"
import NotFound from "@/components/state/not-found"
import { useFetch } from "@/hooks/use-fetch"
import { Accordion, AccordionItem, Avatar, AvatarGroup, Button, Calendar, Checkbox, Chip, Modal, Tab, Tabs, Tooltip, useDisclosure } from "@nextui-org/react"
import ConfirmModal from "@/components/modals/confirm-modal"
import { clientAPI } from "@/config/axios.config"
import { errorHandler } from "@/utils/error"
import { toast } from "react-toastify"
import { useTrigger } from "@/stores/trigger.store"

import GroupFormModal from "@/components/overview/modals/group-form-modal"
import GroupEditModal from "@/components/overview/modals/group-edit-modal"
import ExamScheduleModal from "@/components/overview/modals/exam-schedule-modal"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useStudentProfiles } from "@/hooks/use-student-profiles"
import { LearnersTable } from "@/components/course/learner-table"
import { useRouter } from "nextjs-toploader/app"
import CourseUpdateModal from "@/components/overview/modals/course-update-modal"
import ExamScheduleCard from "@/components/overview/exam-schedule-card"

export default function CoursePage() {

    const params = useSearchParams()
    const _id = params.get('id')
    const { data, error, isLoading } = useFetch<ServerResponse<CourseResponse>>(`/course/${_id}`)
    console.log('Course data:', data?.data)
    console.log('Groups:', data?.data?.groups)
    console.log('Groups length:', data?.data?.groups?.length)
    
    // Fetch instructor data when course data becomes available
    const [instructor, setInstructor] = useState<ServerResponse<UserResponse> | null>(null)
    const [instructorLoading, setInstructorLoading] = useState(false)
    
    useEffect(() => {
        if (data?.data?.instructor_id) {
            setInstructorLoading(true)
            clientAPI.get<ServerResponse<UserResponse>>(`/user/${data.data.instructor_id}`)
                .then(response => {
                    setInstructor(response.data)
                })
                .catch(error => {
                    console.error('Error fetching instructor:', error)
                    setInstructor(null)
                })
                .finally(() => {
                    setInstructorLoading(false)
                })
        }
    }, [data?.data?.instructor_id])
    
    // Get all student IDs from all groups for avatar display
    const allStudentIds = useMemo(() => {
        if (!data?.data?.groups || data.data.groups.length === 0) {
            console.log('No groups found or groups array is empty')
            return []
        }
        const studentIds = data.data.groups.flatMap(group => {
            console.log(`Group ${group.group_name} has ${group.students?.length || 0} students:`, group.students)
            return group.students || []
        })
        console.log('All student IDs:', studentIds)
        // Remove duplicates for randomization
        return Array.from(new Set(studentIds))
    }, [data?.data?.groups])

    // Calculate total student count with debugging
    const totalStudentCount = useMemo(() => {
        if (!data?.data?.groups) {
            console.log('No groups data available for student count')
            return 0
        }
        const count = data.data.groups.reduce((total, group) => {
            const groupStudentCount = group.students?.length || 0
            console.log(`Group ${group.group_name}: ${groupStudentCount} students`)
            return total + groupStudentCount
        }, 0)
        console.log('Total student count:', count)
        return count
    }, [data?.data?.groups])

    // Fetch randomized student profiles for avatars
    const { profiles: studentProfiles, isLoading: profilesLoading } = useStudentProfiles(
        allStudentIds, 
        true, // Enable randomization
        5    // Maximum 5 avatars to display
    )
    
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const { trigger, setTrigger } = useTrigger()
    const router = useRouter()

    // State for modals
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null)
    const [groupToEdit, setGroupToEdit] = useState<{ groupName: string, group_name: string, join_code?: string } | null>(null)
    const [examToDelete, setExamToDelete] = useState<{ groupName: string, examSettingIndex: number } | null>(null)
    
    // State for bulk exam schedule deletion
    const [selectedExamSchedules, setSelectedExamSchedules] = useState<Set<string>>(new Set())
    const [selectAllExamSchedules, setSelectAllExamSchedules] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const { isOpen: isBulkDeleteModalOpen, onOpen: onBulkDeleteModalOpen, onOpenChange: onBulkDeleteModalOpenChange } = useDisclosure()
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalOpenChange } = useDisclosure()
    const { isOpen: isDeleteExamModalOpen, onOpen: onDeleteExamModalOpen, onOpenChange: onDeleteExamModalOpenChange } = useDisclosure()
    const { isOpen: isScheduleModalOpen, onOpen: onScheduleModalOpen, onOpenChange: onScheduleModalOpenChange } = useDisclosure()
    const { isOpen: isDeleteCourseModalOpen, onOpen: onDeleteCourseModalOpen, onOpenChange: onDeleteCourseModalOpenChange } = useDisclosure()
    const { isOpen: isUpdateModalOpen, onOpen: onUpdateModalOpen, onOpenChange: onUpdateModalOpenChange } = useDisclosure()
    const { isOpen: isEditGroupModalOpen, onOpen: onEditGroupModalOpen, onOpenChange: onEditGroupModalOpenChange } = useDisclosure()

    const openDeleteConfirmation = (groupName: string) => {
        setGroupToDelete(groupName)
        onDeleteModalOpen()
    }

    const openEditGroupModal = (group: IGroup) => {
        setGroupToEdit({
            groupName: group.group_name,
            group_name: group.group_name,
            join_code: group.join_code
        })
        onEditGroupModalOpen()
    }

    const openDeleteExamConfirmation = (groupName: string, examSettingIndex: number) => {
        setExamToDelete({ groupName, examSettingIndex })
        onDeleteExamModalOpen()
    }
    
    // Handle individual exam schedule selection
    const handleExamScheduleSelect = (scheduleId: string, groupName: string, index: number) => {
        const selectionKey = `${groupName}-${index}-${scheduleId}`
        const newSelected = new Set(selectedExamSchedules)
        
        if (newSelected.has(selectionKey)) {
            newSelected.delete(selectionKey)
        } else {
            newSelected.add(selectionKey)
        }
        
        setSelectedExamSchedules(newSelected)
        
        // Update select all state based on current selections
        const totalExamSchedules = getTotalExamScheduleCount()
        setSelectAllExamSchedules(newSelected.size === totalExamSchedules && totalExamSchedules > 0)
    }
    
    // Get total count of all exam schedules across all groups
    const getTotalExamScheduleCount = () => {
        if (!data?.data?.groups) return 0
        return data.data.groups.reduce((total, group) => {
            return total + (group.schedule_ids?.length || 0)
        }, 0)
    }
    
    // Handle select all exam schedules
    const handleSelectAllExamSchedules = () => {
        if (!data?.data?.groups) return
        
        const newSelected = new Set<string>()
        
        if (!selectAllExamSchedules) {
            // Select all
            data.data.groups.forEach(group => {
                group.schedule_ids?.forEach((scheduleId, index) => {
                    const selectionKey = `${group.group_name}-${index}-${scheduleId}`
                    newSelected.add(selectionKey)
                })
            })
        }
        // If selectAllExamSchedules is true, newSelected remains empty (deselect all)
        
        setSelectedExamSchedules(newSelected)
        setSelectAllExamSchedules(!selectAllExamSchedules)
    }
    
    // Handle bulk delete exam schedules
    const handleBulkDeleteExamSchedules = async () => {
        if (selectedExamSchedules.size === 0) {
            toast.warning('No exam schedules selected')
            return
        }
        
        setIsBulkDeleting(true)
        
        try {
            const deletePromises: Promise<any>[] = []
            
            // Group selections by group name for efficient processing
            const selectionsByGroup = new Map<string, Array<{ index: number; scheduleId: string }>>()
            
            selectedExamSchedules.forEach(selectionKey => {
                const [groupName, indexStr, scheduleId] = selectionKey.split('-')
                const index = parseInt(indexStr, 10)
                
                if (!selectionsByGroup.has(groupName)) {
                    selectionsByGroup.set(groupName, [])
                }
                selectionsByGroup.get(groupName)!.push({ index, scheduleId })
            })
            
            // Sort by index in descending order to avoid index shifting issues
            selectionsByGroup.forEach((selections, groupName) => {
                selections.sort((a, b) => b.index - a.index)
                
                selections.forEach(({ index }) => {
                    deletePromises.push(
                        clientAPI.delete(`/course/${_id}/group/${groupName}/exam-setting/${index}`)
                    )
                })
            })
            
            await Promise.all(deletePromises)
            
            toast.success(`Successfully deleted ${selectedExamSchedules.size} exam schedule(s)`)
            setSelectedExamSchedules(new Set())
            setSelectAllExamSchedules(false)
            setTrigger(!trigger)
            onBulkDeleteModalOpenChange()
            
        } catch (error: any) {
            console.error('Error during bulk delete:', error)
            toast.error('Failed to delete some exam schedules')
        } finally {
            setIsBulkDeleting(false)
        }
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
            <div className="flex justify-center items-center size-full p-4">
                <Loading />
            </div>
        )
    }

    if (!data?.data) {
        return (
            <div className="flex justify-center items-center size-full p-4">
                <NotFound content={_id as string} />
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row size-full gap-6 lg:gap-8 xl:gap-14 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32">
            <div className="flex flex-col lg:basis-9/12 gap-y-4 lg:gap-y-6">
                <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 w-full rounded-lg overflow-hidden">
                    <Image
                        unoptimized
                        className="h-full w-full object-cover"
                        src={data.data.background_src}
                        width={900}
                        height={600}
                        alt="course background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/25" />
                    <div className="absolute inset-0 p-4 sm:p-6 md:p-8 flex flex-col justify-start">
                        <div className="h-full w-full flex flex-col justify-between">
                            <div className="space-y-2 sm:space-y-3">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{data.data.course_name}</h1>
                                <p className="text-white/90 text-sm sm:text-base md:indent-16 text-justify line-clamp-3 md:line-clamp-none">{data.data.description}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-bold text-sm sm:text-base">{instructor?.data.info.first_name} {instructor?.data.info.last_name}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-background/70 p-2 rounded-xl">
                                    <span className="text-white text-xs sm:text-sm">Groups:</span>
                                    <span className="text-white text-xs sm:text-sm">{data.data.groups?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Tabs 
                    aria-label="Course Groups"
                    classNames={{
                        tabList: "flex-wrap gap-1 sm:gap-2",
                        tab: "px-3 sm:px-4 py-2 text-sm sm:text-base",
                        tabContent: "text-sm sm:text-base"
                    }}
                >
                    {data.data.groups && data.data.groups.length > 0 ? (
                        data.data.groups.map((group: IGroup, index: number) => (
                            <Tab key={index} title={group.group_name}>
                                <div className="mt-4">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold">{group.group_name}</h2>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {group.join_code ? (
                                                    <span className="text-xs sm:text-sm bg-secondary/20 px-2 py-1 rounded-full">
                                                        Join Code: {group.join_code}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs sm:text-sm bg-success/20 px-2 py-1 rounded-full">
                                                        Open Access
                                                    </span>
                                                )}
                                                <span className="text-xs sm:text-sm bg-primary/20 px-2 py-1 rounded-full">
                                                    {group.students.length} students
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                                color="warning"
                                                variant="light"
                                                size="sm"
                                                startContent={<FluentSettings16Filled />}
                                                onPress={() => openEditGroupModal(group)}
                                                className="w-full sm:w-auto"
                                            >
                                                <span className="hidden sm:inline">Edit Group</span>
                                                <span className="sm:hidden">Edit</span>
                                            </Button>
                                            <Button
                                                color="danger"
                                                variant="light"
                                                size="sm"
                                                startContent={<MdiBin />}
                                                onPress={() => openDeleteConfirmation(group.group_name)}
                                                className="w-full sm:w-auto"
                                            >
                                                <span className="hidden sm:inline">Delete Group</span>
                                                <span className="sm:hidden">Delete</span>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        <div className="mt-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                                                <h3 className="text-base sm:text-lg font-semibold">Students</h3>
                                                <Button
                                                    color="primary"
                                                    variant="flat"
                                                    size="sm"
                                                    onPress={() => router.push(`/student-scores?courseId=${_id}`)}
                                                    className="w-full sm:w-auto"
                                                >
                                                    View Scores
                                                </Button>
                                            </div>
                                            {group.students.length > 0 ? (
                                                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
                                                    <div className="bg-secondary/10 px-3 sm:px-4 py-3">
                                                        <h4 className="font-medium text-sm sm:text-base">Enrolled Students ({group.students.length})</h4>
                                                    </div>
                                                    <div className="p-3 sm:p-4">
                                                        <LearnersTable 
                                                            studentIds={group.students} 
                                                            courseId={_id as string}
                                                            groupName={group.group_name}
                                                            onStudentRemoved={() => setTrigger(!trigger)}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-6 sm:p-8 border border-dashed border-gray-300 rounded-lg">
                                                    <p className="text-gray-500 mb-4 text-center text-sm sm:text-base">No students have joined this group yet</p>
                                                    {group.join_code ? (
                                                        <div className="flex flex-col sm:flex-row items-center gap-2 bg-secondary/10 px-3 sm:px-4 py-2 rounded-lg">
                                                            <span className="font-medium text-sm sm:text-base">Share join code:</span>
                                                            <span className="font-bold text-sm sm:text-base">{group.join_code}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col sm:flex-row items-center gap-2 bg-success/10 px-3 sm:px-4 py-2 rounded-lg">
                                                            <span className="font-medium text-success text-sm sm:text-base">✓ Open Access Group</span>
                                                            <span className="text-xs sm:text-sm text-success/80 text-center">Students can join without a code</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {group.schedule_ids && group.schedule_ids.length > 0 && (
                                            <div className="mt-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                                                    <h3 className="text-base sm:text-lg font-semibold">Scheduled Exams</h3>
                                                    
                                                    {/* Bulk Selection Controls */}
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                                        <Checkbox
                                                            isSelected={selectAllExamSchedules}
                                                            onValueChange={handleSelectAllExamSchedules}
                                                            color="primary"
                                                            size="sm"
                                                        >
                                                            <span className="text-xs sm:text-sm">Select All</span>
                                                        </Checkbox>
                                                        
                                                        {selectedExamSchedules.size > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <Chip color="primary" variant="flat" size="sm">
                                                                    <span className="text-xs">{selectedExamSchedules.size} selected</span>
                                                                </Chip>
                                                                <Button
                                                                    color="danger"
                                                                    variant="flat"
                                                                    size="sm"
                                                                    startContent={<MdiBin />}
                                                                    onPress={onBulkDeleteModalOpen}
                                                                    isLoading={isBulkDeleting}
                                                                    className="text-xs sm:text-sm"
                                                                >
                                                                    <span className="hidden sm:inline">Delete Selected</span>
                                                                    <span className="sm:hidden">Delete</span>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                                    {group.schedule_ids.map((scheduleId, idx) => {
                                                        const selectionKey = `${group.group_name}-${idx}-${scheduleId}`
                                                        return (
                                                             <ExamScheduleCard
                                                                 courseId={_id as string}
                                                                 key={idx}
                                                                 groupId={group._id}
                                                                 setting={{
                                                                     _id: scheduleId,
                                                                     schedule_id: scheduleId
                                                                 }}
                                                                 index={idx}
                                                                 groupName={group.group_name}
                                                                 onDelete={openDeleteExamConfirmation}
                                                                 onEdit={(scheduleId, courseId, groupName) => {
                                                                     router.push(`/overview/create/schedule?courseId=${courseId}&groupId=${encodeURIComponent(groupName)}&scheduleId=${scheduleId}&mode=edit`)
                                                                 }}
                                                                 // Selection props
                                                                 isSelected={selectedExamSchedules.has(selectionKey)}
                                                                 onSelectionChange={() => handleExamScheduleSelect(scheduleId, group.group_name, idx)}
                                                                 showCheckbox={true}
                                                             />
                                                        )
                                                    })}
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
            <div className="flex flex-col gap-y-4 sm:gap-y-6 lg:basis-3/12 order-first lg:order-last">
                <div className="flex justify-center lg:justify-start">
                    <AvatarGroup size="sm" className="sm:size-md" isBordered max={5}>
                        {isLoading || !data?.data ? (
                            // Show loading skeleton avatars when main data is loading
                            Array.from({ length: 3 }).map((_, idx) => (
                                <Avatar key={`main-loading-${idx}`} className="animate-pulse bg-default-300" />
                            ))
                        ) : profilesLoading && totalStudentCount > 0 ? (
                            // Show loading skeleton avatars when profiles are loading
                            Array.from({ length: Math.min(5, totalStudentCount) }).map((_, idx) => (
                                <Avatar key={`profile-loading-${idx}`} className="animate-pulse bg-default-300" />
                            ))
                        ) : studentProfiles.length > 0 ? (
                            // Show randomized student avatars with profile data
                            <>
                                {studentProfiles.map((profile, idx) => (
                                    <Tooltip key={`${profile._id}-${idx}`} content={`${profile.username} (Random Student)`} placement="top">
                                        <Avatar 
                                            src={profile.profile_url}
                                            name={profile.username.slice(0, 2).toUpperCase()}
                                            className="cursor-pointer hover:scale-110 transition-transform ring-2 ring-primary/20"
                                        />
                                    </Tooltip>
                                ))}
                                {/* Show total student count if there are more than 5 students */}
                                {totalStudentCount > 5 && (
                                    <Tooltip content={`${totalStudentCount - 5} more students`} placement="top">
                                        <Avatar 
                                            name={`+${totalStudentCount - 5}`}
                                            className="bg-primary text-white text-xs cursor-pointer hover:scale-110 transition-transform"
                                        />
                                    </Tooltip>
                                )}
                            </>
                        ) : (
                            // Show message when no students are enrolled
                            <div className="text-xs text-default-500 px-2 py-1 bg-default-100 rounded-lg">
                                {totalStudentCount === 0 ? 'No students enrolled' : 'Loading student profiles...'}
                            </div>
                        )}
                    </AvatarGroup>
                </div>
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

                {/* Bulk exam schedule deletion confirmation modal */}
                <Modal isOpen={isBulkDeleteModalOpen} onOpenChange={onBulkDeleteModalOpenChange}>
                    <ConfirmModal
                        header="Delete Selected Exam Schedules"
                        subHeader={`Are you sure you want to delete ${selectedExamSchedules.size} exam schedule(s)?`}
                        content="This will permanently delete the selected examination schedules from their respective groups. This action cannot be undone."
                        onAction={handleBulkDeleteExamSchedules}
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

                                router.push(`/overview/create/schedule?courseId=${_id}`)
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
                                background_src: data.data.background_src,
                                category: data.data.category
                            }}
                        />
                    )}
                </Modal>

                {/* Group Edit Modal */}
                <Modal size="lg" isOpen={isEditGroupModalOpen} onOpenChange={onEditGroupModalOpenChange}>
                    {groupToEdit && (
                        <GroupEditModal
                            courseId={_id as string}
                            groupName={groupToEdit.groupName}
                            initialData={{
                                group_name: groupToEdit.group_name,
                                join_code: groupToEdit.join_code
                            }}
                        />
                    )}
                </Modal>
            </div>

        </div>
    )
}
