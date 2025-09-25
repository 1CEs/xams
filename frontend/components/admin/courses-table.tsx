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
  CardBody,
  Input,
  Pagination,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/react'
import { toast } from 'react-toastify'
import { MdiBin, FaGroup, PhStudentFill, FeEdit, SolarRefreshLineDuotone, MdiSearch } from '@/components/icons/icons'

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
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure()

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchQuery])

  const filterCourses = () => {
    let filtered = courses

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(course => 
        course.course_name.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course._id.toLowerCase().includes(query)
      )
    }

    setFilteredCourses(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await clientAPI.get('/course')
      const courseData = response.data.data || []
      setCourses(courseData)
      setFilteredCourses(courseData)
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course)
    onDeleteModalOpen()
  }

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return

    try {
      await clientAPI.delete(`/course/${courseToDelete._id}`)
      toast.success('Course deleted successfully')
      fetchCourses() // Refresh the list
      onDeleteModalClose()
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
    <>
      <Card className="border-none shadow-lg">
        <CardBody className="p-0">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-divider">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg hero-background">
                <FaGroup className="h-5 w-5 text-background" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">Courses Management</h3>
                <p className="text-sm text-default-500">
                  {filteredCourses.length} of {courses.length} courses
                  {searchQuery && ` (filtered by "${searchQuery}")`}
                </p>
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

          {/* Search and Filters */}
          <div className="px-4 sm:px-6 py-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                className="flex-1"
                placeholder="Search courses by name, description, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<MdiSearch className="h-4 w-4 text-default-400" />}
                isClearable
                onClear={() => setSearchQuery('')}
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-500">Show:</span>
                <Select
                  className="w-20"
                  selectedKeys={[rowsPerPage.toString()]}
                  onSelectionChange={(keys) => setRowsPerPage(Number(Array.from(keys)[0]))}
                >
                  <SelectItem key="5" value="5">5</SelectItem>
                  <SelectItem key="10" value="10">10</SelectItem>
                  <SelectItem key="25" value="25">25</SelectItem>
                  <SelectItem key="50" value="50">50</SelectItem>
                </Select>
                <span className="text-sm text-default-500">per page</span>
              </div>
            </div>
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
            <TableBody emptyContent={searchQuery ? "No courses match the current search" : "No courses found"}>
              {filteredCourses
                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                .map((course) => (
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
                        color="danger"
                        onClick={() => handleDeleteCourse(course)}
                      >
                        <MdiBin className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {filteredCourses.length > rowsPerPage && (
            <div className="flex justify-center items-center p-4">
              <Pagination
                total={Math.ceil(filteredCourses.length / rowsPerPage)}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
                color="primary"
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Course Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} size="md">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold text-danger-600">⚠️ Delete Course</h3>
          </ModalHeader>
          <ModalBody>
            {courseToDelete && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-danger-50 rounded-lg border border-danger-200">
                  <div className="p-2 rounded-lg bg-danger-100">
                    <FaGroup className="h-5 w-5 text-danger-600" />
                  </div>
                  <div>
                    <p className="font-medium text-danger-800">{courseToDelete.course_name}</p>
                    <p className="text-sm text-danger-600">ID: {courseToDelete._id}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-danger-200 text-danger-700 px-2 py-1 rounded">
                        {courseToDelete.groups?.length || 0} groups
                      </span>
                      <span className="text-xs bg-danger-200 text-danger-700 px-2 py-1 rounded">
                        {courseToDelete.groups?.reduce((total, group) => total + (group.students?.length || 0), 0) || 0} students
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
                  <p className="text-sm text-danger-800 font-medium mb-2">
                    🚨 <strong>Warning: This action cannot be undone!</strong>
                  </p>
                  <p className="text-sm text-danger-700">
                    Deleting this course will:
                  </p>
                  <ul className="text-sm text-danger-700 mt-2 ml-4 space-y-1">
                    <li>• Permanently remove the course and all its content</li>
                    <li>• Delete all groups and exam schedules</li>
                    <li>• Remove all student enrollments</li>
                    <li>• Delete all exam submissions and results</li>
                    <li>• This action is irreversible</li>
                  </ul>
                  
                  {(courseToDelete.groups?.length || 0) > 0 && (
                    <div className="mt-3 p-2 bg-warning-100 rounded border border-warning-300">
                      <p className="text-xs text-warning-700 font-medium">
                        📊 This course contains {courseToDelete.groups?.length || 0} group(s) with {courseToDelete.groups?.reduce((total, group) => total + (group.students?.length || 0), 0) || 0} enrolled student(s)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteModalClose}>
              Cancel
            </Button>
            <Button 
              color="danger"
              onPress={confirmDeleteCourse}
            >
              Delete Course Permanently
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
