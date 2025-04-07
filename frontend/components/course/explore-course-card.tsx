import { Card, CardBody, CardFooter, CardHeader, Image, CardProps, Button, AvatarGroup, Avatar } from '@nextui-org/react'
import React from 'react'
import { useUserStore } from '@/stores/user.store'
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
              {
                Array.from({ length: Math.random() * 10 + 1 }).map((_, idx: number) => (
                  <Avatar src='https://pic.re/image' key={idx} />
                ))
              }
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
              href="/auth/signin"
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