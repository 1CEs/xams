import { Card, CardBody, CardFooter, CardHeader, Image, CardProps, Button, Tooltip, Modal, Link, AvatarGroup, Avatar, DropdownTrigger, Dropdown, DropdownItem, DropdownMenu, useDisclosure } from '@nextui-org/react'
import React, { useMemo } from 'react'
import { FluentSettings16Filled, MdiBin } from '../icons/icons'
import ConfirmModal from '../modals/confirm-modal'
import { errorHandler } from '@/utils/error'
import { clientAPI } from '@/config/axios.config'
import { toast } from 'react-toastify'
import { useTrigger } from '@/stores/trigger.store'
import { useUserStore } from '@/stores/user.store'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import EnrollmentActions from './enrollment-actions'

type CourseCardProps = {
  id: string
  title: string
  description: string
  bgSrc: string
  groups?: IGroup[]
} & CardProps

const CourseCard: React.FC<CourseCardProps> = ({ id, title, description, bgSrc, groups = [], ...props }) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure()
  const { trigger, setTrigger } = useTrigger()
  const { user } = useUserStore()

  // Check if the user is a student and if they're enrolled in any group of this course
  const isStudent = user?.role === 'student'
  const isEnrolled = isStudent && groups.some(group => 
    group.students.includes(user?._id || '')
  )
  
  const groupNames = groups.find(group => 
    group.students.includes(user?._id || '')
  )?.group_name

  // Get all student IDs from all groups for avatar display
  const allStudentIds = useMemo(() => {
    const studentIds = groups.flatMap(group => group.students)
    // Remove duplicates and limit to first 4 for performance
    return Array.from(new Set(studentIds)).slice(0, 4)
  }, [groups])

  // Fetch student profiles for avatars
  const { profiles: studentProfiles, isLoading: profilesLoading } = useStudentProfiles(allStudentIds)
  const totalStudentCount = groups.reduce((total, group) => total + group.students.length, 0)

  const onCourseDelete = async () => {
    try {
      const res = await clientAPI.delete(`course/${id}`)
      toast.success(res.data.message)
      setTrigger(!trigger)
    } catch (error) {
      errorHandler(error)
    }
  }

  return (
    <Card {...props} className={`${props.className} transition duration-500 hover:-translate-y-2 max-w-[250px]`}>
      <CardHeader className='p-0 rounded-b-none'>
        <Card isFooterBlurred className="border-none" radius="lg">
          <Image
            alt="Woman listing to music"
            className="object-cover"
            height={175}
            src={bgSrc}
            width={250}
          />
          <CardFooter className="justify-center before:bg-white/10 border-white/20 border-1 overflow-hidden py-2 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <AvatarGroup max={3} isBordered size='sm'>
              {profilesLoading ? (
                // Show loading skeleton avatars
                Array.from({ length: Math.min(3, totalStudentCount) }).map((_, idx) => (
                  <Avatar key={`loading-${idx}`} className="animate-pulse bg-default-300" />
                ))
              ) : (
                // Show real student avatars with profile data
                studentProfiles.slice(0, 3).map((profile, idx) => (
                  <Tooltip key={profile._id} content={profile.username} placement="top">
                    <Avatar 
                      src={profile.profile_url}
                      name={profile.username.slice(0, 2).toUpperCase()}
                      className="cursor-pointer hover:scale-110 transition-transform"
                    />
                  </Tooltip>
                ))
              )}
              {/* Show total student count if there are more than 3 students */}
              {totalStudentCount > 3 && (
                <Tooltip content={`${totalStudentCount - 3} more students`} placement="top">
                  <Avatar 
                    name={`+${totalStudentCount - 3}`}
                    className="bg-primary text-white text-xs cursor-pointer hover:scale-110 transition-transform"
                  />
                </Tooltip>
              )}
              {/* Show message when no students */}
              {totalStudentCount === 0 && (
                <div className="text-xs text-default-500 px-2">
                  No students enrolled
                </div>
              )}
            </AvatarGroup>
          </CardFooter>
        </Card>
      </CardHeader>
      <CardBody>
        <div>
          <h1 className='font-bold'>{title}</h1>
          <p className='text-sm text-white/50 line-clamp-1'>{description}</p>
        </div>
      </CardBody>
      <CardFooter className='justify-between'>
        <div className='w-full flex items-center gap-x-3'>
          {(isEnrolled || !isStudent) && (
            <Button
              className='w-full text-secondary hover:text-white'
              as={Link}
              href={`overview/course?id=${id}`}
              variant='ghost'
              color='secondary'
              size='sm'
            >
              Visit
          </Button>)
          }
          
          {/* Show different actions based on user role */}
          {isStudent ? (
            /* Student actions - show enrollment button if there are groups */
            groups.length > 0 ? (
              <EnrollmentActions 
                courseId={id} 
                groupName={groupNames || ''} 
                isEnrolled={isEnrolled}
                groups={groups}
                courseName={title}
              />
            ) : (
              <p className='text-gray-500'>Groups not found</p>
            )
          ) : (
            /* Instructor actions - show settings dropdown with delete option */
            <>
              <Dropdown>
                <DropdownTrigger>
                  <Button size='sm' isIconOnly><FluentSettings16Filled fontSize={20} /></Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions">
                  <DropdownItem onPress={onOpen} startContent={<MdiBin fontSize={20} />} key="delete" className="text-danger" color="danger">
                    Delete Course
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ConfirmModal
                  content={`${title} will be delete after you confirm it.`}
                  header={`Delete ${title}`}
                  subHeader={`After you confirm it won't be revert.`}
                  onAction={onCourseDelete}
                />
              </Modal>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

export default CourseCard
