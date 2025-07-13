'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, Divider, Chip, Tabs, Tab, Spinner } from '@nextui-org/react'
import { clientAPI } from '@/config/axios.config'
import { FaGroup, PhStudentFill, FeEdit, SolarRefreshLineDuotone } from '@/components/icons/icons'
import { UsersTable } from '@/components/admin/users-table'
import { CoursesTable } from '@/components/admin/courses-table'
import { ExaminationsTable } from '@/components/admin/examinations-table'

interface StatCardProps {
  title: string
  value: number
  description: string
  icon: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

function StatCard({ title, value, description, icon, color = 'primary' }: StatCardProps) {
  return (
    <Card className="bg-gradient-to-br from-background to-default-100 border-none shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-default-600">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`p-2 rounded-lg bg-${color}/10`}>
              <div className={`text-${color}`}>
                {icon}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="text-3xl font-bold text-foreground mb-1">{value.toLocaleString()}</div>
        <p className="text-xs text-default-500">{description}</p>
      </CardBody>
    </Card>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    userCount: 0,
    courseCount: 0,
    examinationCount: 0,
    activeExamCount: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        // Fetch all the data needed for stats
        const [usersRes, coursesRes, examsRes] = await Promise.all([
          clientAPI.get('/user'),
          clientAPI.get('/course'),
          clientAPI.get('/exam')
        ])

        // Calculate stats
        const users = usersRes.data.data || []
        const courses = coursesRes.data.data || []
        const examinations = examsRes.data.data || []
        
        // Count active exams (exams with schedules)
        const activeExams = examinations.filter((exam: any) => exam.schedules && exam.schedules.length > 0).length

        setStats({
          userCount: users.length,
          courseCount: courses.length,
          examinationCount: examinations.length,
          activeExamCount: activeExams
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-default-50">
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20">
            <FeEdit className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-default-600 mt-1">
              Comprehensive system management and analytics
            </p>
          </div>
        </div>
        
        <Divider className="bg-gradient-to-r from-primary/30 to-secondary/30" />
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Users" 
              value={stats.userCount} 
              description="Active system users"
              icon={<FaGroup className="h-5 w-5" />}
              color="primary"
            />
            
            <StatCard 
              title="Total Courses" 
              value={stats.courseCount} 
              description="Created courses"
              icon={<PhStudentFill className="h-5 w-5" />}
              color="secondary"
            />
            
            <StatCard 
              title="Total Exams" 
              value={stats.examinationCount} 
              description="Created examinations"
              icon={<FeEdit className="h-5 w-5" />}
              color="success"
            />
            
            <StatCard 
              title="Active Exams" 
              value={stats.activeExamCount} 
              description="Exams with schedules"
              icon={<SolarRefreshLineDuotone className="h-5 w-5" />}
              color="warning"
            />
          </div>

          {/* Main Content Tabs */}
          <Card className="bg-gradient-to-br from-background to-default-50 border-none shadow-xl">
            <CardBody className="p-0">
              <Tabs 
                aria-label="Admin management tabs"
                color="primary"
                variant="underlined"
                classNames={{
                  tabList: "gap-6 w-full relative rounded-none p-6 border-b border-divider bg-gradient-to-r from-primary/5 to-secondary/5",
                  cursor: "w-full bg-gradient-to-r from-primary to-secondary",
                  tab: "max-w-fit px-4 h-12 text-base font-medium",
                  tabContent: "group-data-[selected=true]:text-primary"
                }}
              >
                <Tab 
                  key="users" 
                  title={
                    <div className="flex items-center space-x-2">
                      <FaGroup className="h-4 w-4" />
                      <span>Users</span>
                      <Chip size="sm" color="primary" variant="flat">
                        {stats.userCount}
                      </Chip>
                    </div>
                  }
                >
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">User Management</h2>
                      <p className="text-default-600">
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
                      <PhStudentFill className="h-4 w-4" />
                      <span>Courses</span>
                      <Chip size="sm" color="secondary" variant="flat">
                        {stats.courseCount}
                      </Chip>
                    </div>
                  }
                >
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Course Management</h2>
                      <p className="text-default-600">
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
                      <FeEdit className="h-4 w-4" />
                      <span>Examinations</span>
                      <Chip size="sm" color="success" variant="flat">
                        {stats.examinationCount}
                      </Chip>
                    </div>
                  }
                >
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Examination Management</h2>
                      <p className="text-default-600">
                        Monitor and manage all examinations, schedules, and assessment activities.
                      </p>
                    </div>
                    <ExaminationsTable />
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}
