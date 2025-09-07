'use client'

import { useEffect, useState } from 'react'
import { clientAPI } from '@/config/axios.config'
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Chip,
  Spinner,
  Card,
  CardBody
} from '@nextui-org/react'
import { toast } from 'react-toastify'
import { MdiBin, FaGroup, PhStudentFill, FeEdit, SolarRefreshLineDuotone } from '@/components/icons/icons'

interface Course {
  _id: string
  course_name: string
  description?: string
  instructor_id: string
  groups?: Array<{
    group_name: string
    students: string[]
    schedule_ids: string[]
  }>
  created_at?: string
  updated_at?: string
}

export function CoursesTable() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await clientAPI.get('/course')
      setCourses(response.data.data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      await clientAPI.delete(`/course/${courseId}`)
      toast.success('Course deleted successfully')
      fetchCourses() // Refresh the list
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course')
    }
  }

  const getTotalStudents = (course: Course) => {
    if (!course.groups) return 0
    return course.groups.reduce((total, group) => total + (group.students?.length || 0), 0)
  }

  const getTotalGroups = (course: Course) => {
    return course.groups?.length || 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Spinner size="lg" color="primary" label="Loading courses..." />
      </div>
    )
  }

  return (
    <Card className="border-none shadow-lg">
      <CardBody className="p-0">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-divider">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg hero-background">
              <FaGroup className="h-5 w-5 text-background" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Courses Management</h3>
              <p className="text-sm text-default-500">{courses.length} total courses</p>
            </div>
          </div>
          <Button 
            onClick={fetchCourses} 
            variant="flat" 
            color="primary"
            size="sm"
            startContent={<SolarRefreshLineDuotone className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>

        <Table 
          aria-label="Courses table"
          classNames={{
            wrapper: "shadow-none",
            th: "bg-default-50 text-default-700 font-semibold",
            td: "py-4"
          }}
        >
          <TableHeader>
            <TableColumn>COURSE</TableColumn>
            <TableColumn>DESCRIPTION</TableColumn>
            <TableColumn>GROUPS</TableColumn>
            <TableColumn>LEARNERS</TableColumn>
            <TableColumn>CREATED</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No courses found">
            {courses.map((course) => (
              <TableRow key={course._id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-foreground">{course.course_name}</p>
                    <p className="text-xs text-default-500">ID: {course._id.slice(-6)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-default-600 max-w-[200px] truncate">
                    {course.description || 'No description available'}
                  </p>
                </TableCell>
                <TableCell>
                  <Chip 
                    color="primary" 
                    variant="flat"
                    size="sm"
                    startContent={<FaGroup className="h-3 w-3" />}
                  >
                    {course.groups?.length || 0} groups
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip 
                    color="secondary" 
                    variant="flat"
                    size="sm"
                    startContent={<PhStudentFill className="h-3 w-3" />}
                  >
                    {course.groups?.reduce((total, group) => total + (group.students?.length || 0), 0) || 0} learners
                  </Chip>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-default-600">
                    {course.created_at 
                      ? new Date(course.created_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="light" 
                      size="sm"
                      isIconOnly
                      color="primary"
                    >
                      <FeEdit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm"
                      isIconOnly
                      color="danger"
                      onClick={() => handleDeleteCourse(course._id)}
                    >
                      <MdiBin className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  )
}
