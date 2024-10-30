import React from 'react'
import CourseCard from '../course-card'

type Props = {}

const CourseList = (props: Props) => {
  return (
    <div className='w-fit  flex gap-4 flex-wrap justify-end'>
      {
        Array.from({ length: 8 }).map((_, idx: number) => (
          <CourseCard
            className=' w-[222px]'
            key={idx}
            title='Just a example course name'
            description='This is just a course description that explain about your course.'
            examCount={5}
            groupCount={3}
            studentCount={22}
          />
        ))
      }
    </div>
  )
}

export default CourseList