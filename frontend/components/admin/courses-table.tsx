'use client'

import { useEffect, useState } from 'react'
import { clientAPI } from '@/config/axios.config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'react-toastify'
import { MdiBin, FaGroup, PhStudentFill, FeEdit } from '@/components/icons/icons'

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Courses ({courses.length})</h3>
        <Button onClick={fetchCourses} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No courses found
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course._id}>
                  <TableCell className="font-medium">
                    {course.course_name}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {course.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <FaGroup className="h-3 w-3" />
                      {getTotalGroups(course)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <PhStudentFill className="h-3 w-3" />
                      {getTotalStudents(course)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span className="text-xs">📅</span>
                      {course.created_at 
                        ? new Date(course.created_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <FeEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteCourse(course._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <MdiBin className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
