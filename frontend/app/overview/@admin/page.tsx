'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, Divider, Chip, Tabs, Tab, Spinner } from '@nextui-org/react'
import { clientAPI } from '@/config/axios.config'
import { FaGroup, PhStudentFill, FeEdit, SolarRefreshLineDuotone } from '@/components/icons/icons'
import { UsersTable } from '@/components/admin/users-table'
import { CoursesTable } from '@/components/admin/courses-table'
import { ExaminationsTable } from '@/components/admin/examinations-table'
import { SchedulesTable } from '@/components/admin/schedules-table'

interface StatCardProps {
  title: string
  value: number
  description: string
  icon: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

function StatCard({ title, value, description, icon, color = 'primary' }: StatCardProps) {
  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm">
      <CardBody className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 sm:p-3 rounded-xl hero-background">
                <div className="text-background">
                  {icon}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-default-600">{title}</p>
                <div className="text-2xl sm:text-3xl font-bold hero-foreground mt-1">
                  {value.toLocaleString()}
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-default-500">{description}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    userCount: 0,
    studentCount: 0,
    instructorCount: 0,
    courseCount: 0,
    examinationCount: 0,
    totalGroups: 0,
    totalSubmissions: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        // Fetch all the data needed for stats
        const [usersRes, coursesRes, examsRes, submissionsRes] = await Promise.all([
          clientAPI.get('/user').catch((err) => {
            console.error('Error fetching users:', err)
            return { data: { data: [] } }
          }),
          clientAPI.get('/course').catch((err) => {
            console.error('Error fetching courses:', err)
            return { data: { data: [] } }
          }),
          clientAPI.get('/exam/all').catch((err) => {
            console.error('Error fetching exams:', err)
            return { data: { data: [] } }
          }),
          clientAPI.get('/exam-submission').catch((err) => {
            console.error('Error fetching submissions:', err)
            return { data: { data: [] } }
          })
        ])

        // Calculate stats
        const users = usersRes.data?.data || usersRes.data || []
        const courses = coursesRes.data?.data || coursesRes.data || []
        const examinations = examsRes.data?.data || examsRes.data || []
        const submissions = submissionsRes.data?.data || submissionsRes.data || []
        
        console.log('Fetched data:', { 
          users: users.length, 
          courses: courses.length, 
          examinations: examinations.length,
          submissions: submissions.length 
        })
        
        // Count users by role
        const students = users.filter((user: any) => user.role === 'student')
        const instructors = users.filter((user: any) => user.role === 'instructor')
        
        // Count total groups across all courses
        const totalGroups = courses.reduce((total: number, course: any) => {
          return total + (course.groups?.length || 0)
        }, 0)

        const newStats = {
          userCount: users.length,
          studentCount: students.length,
          instructorCount: instructors.length,
          courseCount: courses.length,
          examinationCount: examinations.length,
          totalGroups,
          totalSubmissions: submissions.length
        }
        
        console.log('Calculated stats:', newStats)
        setStats(newStats)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold hero-foreground mb-2">
            🛠️ Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-default-600">
            Comprehensive system management and analytics
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
            <Spinner 
              size="lg" 
              color="secondary" 
              label="Loading dashboard data..."
              labelColor="secondary"
            />
          </div>
        ) : (
          <>
            {/* Statistics Overview */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
              <StatCard 
                title="Total Users" 
                value={stats.userCount} 
                description="All registered users"
                icon={<FaGroup className="h-5 w-5" />}
                color="primary"
              />
              
              <StatCard 
                title="Students" 
                value={stats.studentCount} 
                description="Enrolled students"
                icon={<PhStudentFill className="h-5 w-5" />}
                color="secondary"
              />
              
              <StatCard 
                title="Instructors" 
                value={stats.instructorCount} 
                description="Active instructors"
                icon={<FeEdit className="h-5 w-5" />}
                color="success"
              />
              
              <StatCard 
                title="Total Courses" 
                value={stats.courseCount} 
                description="Created courses"
                icon={<SolarRefreshLineDuotone className="h-5 w-5" />}
                color="warning"
              />
              
              <StatCard 
                title="Course Groups" 
                value={stats.totalGroups} 
                description="Total course groups"
                icon={<FaGroup className="h-5 w-5" />}
                color="primary"
              />
              
              <StatCard 
                title="Total Exams" 
                value={stats.examinationCount} 
                description="Created examinations"
                icon={<FeEdit className="h-5 w-5" />}
                color="secondary"
              />
              
              
              <StatCard 
                title="Submissions" 
                value={stats.totalSubmissions} 
                description="Total exam submissions"
                icon={<PhStudentFill className="h-5 w-5" />}
                color="warning"
              />
            </div>

            {/* Main Content Tabs */}
            <Tabs 
              className="flex justify-center pb-3" 
              size="lg"
              classNames={{
                tabList: "gap-1 sm:gap-2",
                tab: "px-3 sm:px-4 py-2 text-sm sm:text-base",
                tabContent: "text-sm sm:text-base"
              }}
            >
              <Tab 
                key="users" 
                title={
                  <div className="flex items-center space-x-2">
                    <span>👥 Users</span>
                    <Chip size="sm" color="primary" variant="flat">
                      {stats.userCount}
                    </Chip>
                  </div>
                }
              >
                <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
                  <div className="text-start mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-default-700 mb-2">
                      User Management
                    </h2>
                    <p className="text-sm sm:text-base text-default-500">
                      View and manage all users in the system. Monitor user activity and permissions.
                    </p>
                  </div>
                  <UsersTable />
                </div>
              </Tab>
              
              <Tab 
                key="courses" 
                title={
                  <div className="flex items-center space-x-2">
                    <span>📚 Courses</span>
                    <Chip size="sm" color="secondary" variant="flat">
                      {stats.courseCount}
                    </Chip>
                  </div>
                }
              >
                <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
                  <div className="text-start mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-default-700 mb-2">
                      Course Management
                    </h2>
                    <p className="text-sm sm:text-base text-default-500">
                      Oversee all courses, enrollments, and academic content in the system.
                    </p>
                  </div>
                  <CoursesTable />
                </div>
              </Tab>
              
              <Tab 
                key="examinations" 
                title={
                  <div className="flex items-center space-x-2">
                    <span>📝 Examinations</span>
                    <Chip size="sm" color="success" variant="flat">
                      {stats.examinationCount}
                    </Chip>
                  </div>
                }
              >
                <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
                  <div className="text-start mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-default-700 mb-2">
                      Examination Management
                    </h2>
                    <p className="text-sm sm:text-base text-default-500">
                      Monitor and manage all examinations, schedules, and assessment activities.
                    </p>
                  </div>
                  <ExaminationsTable />
                </div>
              </Tab>

              <Tab 
                key="schedules" 
                title={
                  <div className="flex items-center space-x-2">
                    <span>📅 Schedules</span>
                  </div>
                }
              >
                <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
                  <div className="text-start mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-default-700 mb-2">
                      Schedule Management
                    </h2>
                    <p className="text-sm sm:text-base text-default-500">
                      View and manage exam schedules, timing, and access codes.
                    </p>
                  </div>
                  <SchedulesTable />
                </div>
              </Tab>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
