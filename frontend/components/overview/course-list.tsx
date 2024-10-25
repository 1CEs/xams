import React from 'react'
import CourseCard from '../course-card'

type Props = {}

const CourseList = (props: Props) => {
  return (
    <div className='size-full flex gap-4 flex-wrap justify-center'>
        {
            Array.from({ length: 12 }).map((_, idx: number) => (
                <CourseCard 
                className=' w-1/5'
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