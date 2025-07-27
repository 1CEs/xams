'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { clientAPI } from '@/config/axios.config'
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  Chip, 
  Divider, 
  Spinner, 
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Progress,
  Select,
  SelectItem
} from '@nextui-org/react'
import { ArrowLeft, FileDocument, TrophyIcon, ClockIcon, CheckCircleIcon } from '@/components/icons/icons'
import { useUserStore } from '@/stores/user.store'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

interface StudentScore {
  student_id: string
  student_name: string
  student_email: string
  profile_url?: string
  submissions: {
    schedule_id: string
    schedule_title: string
    submission_id: string
    percentage_score?: number
    total_score?: number
    max_possible_score: number
    is_graded: boolean
    submission_time: Date
    attempt_number: number
    status: 'submitted' | 'graded' | 'reviewed'
  }[]
  averageScore: number
  totalSubmissions: number
  gradedSubmissions: number
}

interface ExamSchedule {
  _id: string
  title: string
  description: string
  created_at: Date
}

const StudentScoresPage = () => {
  const params = useSearchParams()
  const courseId = params.get('courseId')
  const { user } = useUserStore()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [studentScores, setStudentScores] = useState<StudentScore[]>([])
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<string>('all')
  const [courseData, setCourseData] = useState<any>(null)

  useEffect(() => {
    if (!courseId || user?.role !== 'instructor') {
      router.push('/overview')
      return
    }

    fetchData()
  }, [courseId, user, router])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch course data to get student IDs
      const courseResponse = await clientAPI.get(`/course/${courseId}`)
      const course = courseResponse.data.data
      setCourseData(course)
      console.log('Course data:', course)

      // Get all students from all groups
      const allStudents = new Set<string>()
      const allExamSettings: any[] = []
      
      course.groups.forEach((group: any) => {
        console.log(`Processing group: ${group.group_name}, students: ${group.students?.length || 0}, exam_settings: ${group.schedule_ids?.length || 0}`)
        group.students.forEach((studentId: string) => allStudents.add(studentId))
        if (group.schedule_ids) {
          // Convert schedule_ids to objects with schedule_id for compatibility
          const examSettings = group.schedule_ids.map((scheduleId: string) => ({ schedule_id: scheduleId }))
          allExamSettings.push(...examSettings)
        }
      })
      
      console.log(`Total students: ${allStudents.size}, Total exam settings: ${allExamSettings.length}`)
      console.log('All exam settings:', allExamSettings)

      // Fetch exam schedules for this course
      const uniqueScheduleIds = Array.from(new Set(allExamSettings.map(setting => setting.schedule_id)))
      const schedulePromises = uniqueScheduleIds.map((scheduleId: string) => 
        clientAPI.get(`/exam-schedule/${scheduleId}`)
      )
      const scheduleResponses = await Promise.all(schedulePromises)
      const schedules = scheduleResponses.map(res => res.data.data)
      setExamSchedules(schedules)

      // Fetch student data and submissions
      const studentPromises = Array.from(allStudents).map(async (studentId: string) => {
        try {
          // Get student info
          const studentResponse = await clientAPI.get(`/user/${studentId}`)
          const student = studentResponse.data.data

          // Get student submissions for all schedules
          const submissionPromises = allExamSettings.map(async (setting: any) => {
            try {
              console.log(`Fetching submissions for schedule ${setting.schedule_id}`)
              const submissionResponse = await clientAPI.get(`/submission/schedule/${setting.schedule_id}`)
              console.log(`Response for schedule ${setting.schedule_id}:`, submissionResponse.data)
              
              if (submissionResponse.data.success) {
                const submissions = submissionResponse.data.data || []
                console.log(`Found ${submissions.length} total submissions for schedule ${setting.schedule_id}`)
                
                // Filter submissions for this specific student
                const studentSubmissions = submissions.filter((sub: any) => sub.student_id === studentId)
                console.log(`Found ${studentSubmissions.length} submissions for student ${studentId} in schedule ${setting.schedule_id}`)
                
                return studentSubmissions.map((submission: any) => ({
                  schedule_id: setting.schedule_id,
                  schedule_title: schedules.find(s => s._id === setting.schedule_id)?.title || 'Unknown',
                  submission_id: submission._id,
                  percentage_score: submission.percentage_score,
                  total_score: submission.total_score,
                  max_possible_score: submission.max_possible_score,
                  is_graded: submission.is_graded,
                  submission_time: submission.submission_time,
                  attempt_number: submission.attempt_number,
                  status: submission.status
                }))
              } else {
                console.warn(`API returned success: false for schedule ${setting.schedule_id}`)
                return []
              }
            } catch (error) {
              console.error(`Error fetching submissions for schedule ${setting.schedule_id}:`, error)
              return []
            }
          })

          const submissionResults = await Promise.all(submissionPromises)
          const allSubmissions = submissionResults.flat()

          // Calculate statistics
          const gradedSubmissions = allSubmissions.filter(sub => sub.is_graded && sub.percentage_score !== undefined)
          const averageScore = gradedSubmissions.length > 0 
            ? gradedSubmissions.reduce((sum, sub) => sum + (sub.percentage_score || 0), 0) / gradedSubmissions.length
            : 0

          return {
            student_id: studentId,
            student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.username || 'Unknown',
            student_email: student.email || 'No email',
            profile_url: student.profile_url || `https://i.pravatar.cc/150?u=${studentId}`,
            submissions: allSubmissions,
            averageScore,
            totalSubmissions: allSubmissions.length,
            gradedSubmissions: gradedSubmissions.length
          }
        } catch (error) {
          console.error(`Error fetching data for student ${studentId}:`, error)
          return null
        }
      })

      const studentResults = await Promise.all(studentPromises)
      const validStudentResults = studentResults.filter(Boolean) as StudentScore[]
      console.log('Final student results:', validStudentResults)
      setStudentScores(validStudentResults)

    } catch (error) {
      console.error('Error fetching student scores:', error)
      toast.error('Failed to load student scores')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudentScores = useMemo(() => {
    if (selectedSchedule === 'all') {
      return studentScores
    }

    return studentScores.map(student => ({
      ...student,
      submissions: student.submissions.filter(sub => sub.schedule_id === selectedSchedule),
      averageScore: (() => {
        const filteredGradedSubs = student.submissions
          .filter(sub => sub.schedule_id === selectedSchedule && sub.is_graded && sub.percentage_score !== undefined)
        return filteredGradedSubs.length > 0
          ? filteredGradedSubs.reduce((sum, sub) => sum + (sub.percentage_score || 0), 0) / filteredGradedSubs.length
          : 0
      })(),
      totalSubmissions: student.submissions.filter(sub => sub.schedule_id === selectedSchedule).length,
      gradedSubmissions: student.submissions.filter(sub => sub.schedule_id === selectedSchedule && sub.is_graded).length
    }))
  }, [studentScores, selectedSchedule])

  const overallStats = useMemo(() => {
    const totalStudents = filteredStudentScores.length
    const studentsWithScores = filteredStudentScores.filter(s => s.gradedSubmissions > 0).length
    const classAverage = totalStudents > 0 
      ? filteredStudentScores.reduce((sum, s) => sum + s.averageScore, 0) / totalStudents
      : 0
    const highestScore = Math.max(...filteredStudentScores.map(s => s.averageScore), 0)

    return {
      totalStudents,
      studentsWithScores,
      classAverage,
      highestScore
    }
  }, [filteredStudentScores])

  // Create dynamic columns based on available exam schedules
  const columns = useMemo(() => {
    const baseColumns = [
      { name: "STUDENT", uid: "student" },
    ]
    
    // Add columns for each exam schedule
    const examColumns = examSchedules.map(schedule => ({
      name: schedule.title.toUpperCase(),
      uid: `exam_${schedule._id}`,
      scheduleId: schedule._id
    }))
    
    const endColumns = [
      { name: "TOTAL SCORE", uid: "total" },
    ]
    
    return [...baseColumns, ...examColumns, ...endColumns]
  }, [examSchedules])

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Define column headers in the desired order
      const headers = ['Student Name', ...examSchedules.map(schedule => schedule.title), 'Total Score']
      
      // Prepare data for export with explicit column order
      const exportData = filteredStudentScores.map(student => {
        const row: any[] = []
        
        // Add student name as first column
        row.push(student.student_name)
        
        // Add scores for each exam in order
        examSchedules.forEach(schedule => {
          const examSubmissions = student.submissions.filter(sub => sub.schedule_id === schedule._id)
          if (examSubmissions.length > 0) {
            const bestSubmission = examSubmissions.reduce((best, current) => {
              if (!best.is_graded && current.is_graded) return current
              if (best.is_graded && current.is_graded) {
                return (current.percentage_score || 0) > (best.percentage_score || 0) ? current : best
              }
              return current.attempt_number > best.attempt_number ? current : best
            })
            
            if (bestSubmission.is_graded) {
              row.push(`${bestSubmission.percentage_score?.toFixed(1)}% (${bestSubmission.total_score}/${bestSubmission.max_possible_score})`)
            } else {
              row.push('Pending')
            }
          } else {
            row.push('No Submission')
          }
        })
        
        // Add total score as last column
        const totalScore = student.submissions
          .filter(sub => sub.is_graded && sub.percentage_score !== undefined)
          .reduce((sum, sub) => sum + (sub.percentage_score || 0), 0)
        const examCount = student.submissions
          .filter(sub => sub.is_graded && sub.percentage_score !== undefined).length
        const averageTotal = examCount > 0 ? totalScore / examCount : 0
        
        row.push(examCount > 0 ? `${averageTotal.toFixed(1)}% (${examCount} exams)` : 'No Graded Exams')
        
        return row
      })
      
      // Create workbook and worksheet with explicit headers
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...exportData])
      
      // Set column widths
      const colWidths = [
        { wch: 25 }, // Student Name
        ...examSchedules.map(() => ({ wch: 18 })), // Exam columns
        { wch: 20 }, // Total Score
      ]
      ws['!cols'] = colWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Student Scores')
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      const filename = `student-scores-${courseData?.course_name || 'course'}-${date}.xlsx`
      
      // Save file
      XLSX.writeFile(wb, filename)
      
      toast.success('Excel file exported successfully!')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Failed to export Excel file')
    }
  }

  const renderCell = React.useCallback((student: StudentScore, columnKey: string) => {
    switch (columnKey) {
      case "student":
        return (
          <User
            avatarProps={{ radius: "lg", src: student.profile_url }}
            description={student.student_email}
            name={student.student_name}
          >
            {student.student_email}
          </User>
        )
      case "total":
        // Calculate total score across all exams
        const totalScore = student.submissions
          .filter(sub => sub.is_graded && sub.percentage_score !== undefined)
          .reduce((sum, sub) => sum + (sub.percentage_score || 0), 0)
        const examCount = student.submissions
          .filter(sub => sub.is_graded && sub.percentage_score !== undefined).length
        const averageTotal = examCount > 0 ? totalScore / examCount : 0
        
        return (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Progress 
                size="sm" 
                value={averageTotal} 
                color={
                  averageTotal >= 80 ? "success" : 
                  averageTotal >= 60 ? "warning" : "danger"
                }
                className="max-w-[80px]"
              />
              <span className="text-sm font-bold">{averageTotal.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-default-400">{examCount} exam{examCount !== 1 ? 's' : ''}</p>
          </div>
        )

      default:
        // Handle individual exam columns
        if (columnKey.startsWith('exam_')) {
          const scheduleId = columnKey.replace('exam_', '')
          const examSubmissions = student.submissions.filter(sub => sub.schedule_id === scheduleId)
          
          if (examSubmissions.length === 0) {
            return (
              <div className="flex flex-col items-center">
                <span className="text-sm text-default-400">No submission</span>
              </div>
            )
          }
          
          // Get the best/latest submission for this exam
          const bestSubmission = examSubmissions.reduce((best, current) => {
            if (!best.is_graded && current.is_graded) return current
            if (best.is_graded && current.is_graded) {
              return (current.percentage_score || 0) > (best.percentage_score || 0) ? current : best
            }
            return current.attempt_number > best.attempt_number ? current : best
          })
          
          return (
            <div className="flex flex-col items-center">
              {bestSubmission.is_graded ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${
                      (bestSubmission.percentage_score || 0) >= 80 ? 'text-success' : 
                      (bestSubmission.percentage_score || 0) >= 60 ? 'text-warning' : 'text-danger'
                    }`}>
                      {bestSubmission.percentage_score?.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-default-400">
                    {bestSubmission.total_score}/{bestSubmission.max_possible_score}
                  </p>
                </>
              ) : (
                <>
                  <Chip size="sm" color="warning" variant="flat">
                    Pending
                  </Chip>
                  <p className="text-xs text-default-400">
                    Attempt {bestSubmission.attempt_number}
                  </p>
                </>
              )}
            </div>
          )
        }
        return null
    }
  }, [courseId, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="secondary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <Button
            variant="light"
            onPress={() => router.back()}
            startContent={<ArrowLeft className="w-4 h-4" />}
            size="sm"
            className="self-start"
          >
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Student Scores</h1>
            <p className="text-sm sm:text-base text-default-600 truncate">
              {courseData?.course_name}
            </p>
          </div>
        </div>

        {/* Filter and Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Filter */}
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardBody className="p-4">
              <Select
                label="Filter by Exam"
                placeholder="Select exam schedule"
                selectedKeys={[selectedSchedule]}
                onSelectionChange={(keys) => setSelectedSchedule(Array.from(keys)[0] as string)}
                size="sm"
                classNames={{
                  label: "text-xs sm:text-sm",
                  value: "text-xs sm:text-sm"
                }}
              >
              {[<SelectItem key="all" value="all">All Exams</SelectItem>].concat(
                examSchedules.map((schedule) => (
                  <SelectItem key={schedule._id} value={schedule._id}>
                    {schedule.title}
                  </SelectItem>
                ))
              )}
            </Select>
          </CardBody>
        </Card>

          {/* Stats Cards */}
          <Card>
            <CardBody className="flex flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <FileDocument className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-default-600">Total Students</p>
                <p className="text-base sm:text-lg font-semibold">{overallStats.totalStudents}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4">
              <div className="p-1.5 sm:p-2 bg-success/10 rounded-lg flex-shrink-0">
                <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-default-600">Class Average</p>
                <p className="text-base sm:text-lg font-semibold">{overallStats.classAverage.toFixed(1)}%</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4">
              <div className="p-1.5 sm:p-2 bg-warning/10 rounded-lg flex-shrink-0">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-default-600">Highest Score</p>
                <p className="text-base sm:text-lg font-semibold">{overallStats.highestScore.toFixed(1)}%</p>
              </div>
            </CardBody>
          </Card>
      </div>

        {/* Students Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold">Student Performance</h3>
            <Button
              color="success"
              variant="flat"
              onPress={exportToExcel}
              startContent={<FileDocument className="w-3 h-3 sm:w-4 sm:h-4" />}
              size="sm"
              className="self-start sm:self-center"
            >
              <span className="text-xs sm:text-sm">Export to Excel</span>
            </Button>
          </CardHeader>
          <Divider />
          <CardBody className="p-0 sm:p-0">
            <div className="overflow-x-auto">
              <Table 
                aria-label="Student scores table"
                classNames={{
                  wrapper: "min-h-[400px]",
                  th: "text-xs sm:text-sm",
                  td: "text-xs sm:text-sm"
                }}
              >
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn 
                      key={column.uid} 
                      align={column.uid === "student" ? "start" : "center"}
                      className="text-xs sm:text-sm font-medium"
                    >
                      {column.name}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody>
                  {filteredStudentScores.map((item) => (
                    <TableRow key={item.student_id}>
                      {columns.map((column) => (
                        <TableCell 
                          key={column.uid}
                          className={column.uid === "student" ? "text-left" : "text-center"}
                        >
                          {renderCell(item, column.uid)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default StudentScoresPage
