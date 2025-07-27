import { Card, CardBody, CardFooter, CardHeader, Image, CardProps, Button, AvatarGroup, Avatar, Tooltip } from '@nextui-org/react'
import React, { useMemo } from 'react'
import { useUserStore } from '@/stores/user.store'
import { useStudentProfiles } from '@/hooks/use-student-profiles'
import EnrollmentActions from './enrollment-actions'
import Link from 'next/link'

type ExploreCourseCardProps = {
  id: string
  title: string
  description: string
  bgSrc: string
  groups?: IGroup[]
} & CardProps

const ExploreCourseCard: React.FC<ExploreCourseCardProps> = ({ id, title, description, bgSrc, groups = [], ...props }) => {
  const { user } = useUserStore()

  // Check if the user is a student and if they're enrolled in any group of this course
  const isStudent = user?.role === 'student'
  const isEnrolled = isStudent && groups.some(group => 
    group.students.includes(user?._id || '')
  )

  // Get all student IDs from all groups for avatar display
  const allStudentIds = useMemo(() => {
    const studentIds = groups.flatMap(group => group.students)
    // Remove duplicates for randomization
    return Array.from(new Set(studentIds))
  }, [groups])

  // Fetch randomized student profiles for avatars
  const { profiles: studentProfiles, isLoading: profilesLoading } = useStudentProfiles(
    allStudentIds, 
    true, // Enable randomization
    3    // Maximum 3 avatars to display
  )
  const totalStudentCount = groups.reduce((total, group) => total + group.students.length, 0)

  return (
    <Card {...props} className={'transition duration-500 hover:-translate-y-2 max-w-[250px]'}>
      <CardHeader className='p-0 rounded-b-none'>
        <Card isFooterBlurred className="border-none" radius="lg">
          <Image
            alt="Course background"
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
                // Show randomized student avatars with profile data
                studentProfiles.map((profile, idx) => (
                  <Tooltip key={`${profile._id}-${idx}`} content={`${profile.username} (Random Student)`} placement="top">
                    <Avatar 
                      src={profile.profile_url}
                      name={profile.username.slice(0, 2).toUpperCase()}
                      className="cursor-pointer hover:scale-110 transition-transform ring-2 ring-primary/20"
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
          {!user ? (
            <Button
              className='w-full text-secondary hover:text-white'
              as={Link}
              href="/member/sign-in"
              variant='ghost'
              color='secondary'
              size='sm'
            >
              Sign in to Enroll
            </Button>
          ) : isEnrolled ? (
            <Button
              className='w-full text-secondary hover:text-white'
              as="a"
              href={`overview/course?id=${id}`}
              variant='ghost'
              color='secondary'
              size='sm'
            >
              Visit
            </Button>
          ) : isStudent && groups.length > 0 ? (
            <EnrollmentActions 
              courseId={id} 
              groupName={groups[0].group_name} 
              isEnrolled={isEnrolled}
              groups={groups}
              courseName={title}
            />
          ) : null}
        </div>
      </CardFooter>
    </Card>
  )
}

export default ExploreCourseCard 