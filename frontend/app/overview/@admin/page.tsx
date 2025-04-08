"use client"

import React from 'react'
import { Card, CardBody, CardHeader } from "@nextui-org/card"
import { Tabs, Tab } from "@nextui-org/tabs"
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@nextui-org/table"
import { Avatar } from "@nextui-org/avatar"
import { Chip } from "@nextui-org/chip"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Mock data for the admin dashboard
const mockData = {
  // User statistics
  userStats: {
    totalUsers: 1250,
    students: 850,
    instructors: 350,
    admins: 50,
    newUsersThisMonth: 120,
    activeUsers: 980
  },
  
  // Course statistics
  courseStats: {
    totalCourses: 75,
    activeCourses: 68,
    totalGroups: 120,
    averageStudentsPerCourse: 15
  },
  
  // Examination statistics
  examStats: {
    totalExams: 250,
    examsThisMonth: 45,
    averageQuestionsPerExam: 20,
    totalQuestions: 5000
  },
  
  // Recent users
  recentUsers: [
    { id: 1, name: "John Doe", email: "john@example.com", role: "student", joinDate: "2023-03-15", status: "active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "instructor", joinDate: "2023-03-10", status: "active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "student", joinDate: "2023-03-05", status: "inactive" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", role: "instructor", joinDate: "2023-02-28", status: "active" },
    { id: 5, name: "Charlie Wilson", email: "charlie@example.com", role: "student", joinDate: "2023-02-20", status: "active" },
  ],
  
  // Recent courses
  recentCourses: [
    { id: 1, name: "Introduction to Mathematics", instructor: "Jane Smith", students: 25, groups: 3, status: "active" },
    { id: 2, name: "Advanced Physics", instructor: "Alice Brown", students: 18, groups: 2, status: "active" },
    { id: 3, name: "Computer Science Basics", instructor: "Jane Smith", students: 30, groups: 4, status: "active" },
    { id: 4, name: "History of Art", instructor: "Alice Brown", students: 15, groups: 2, status: "inactive" },
    { id: 5, name: "English Literature", instructor: "Jane Smith", students: 22, groups: 3, status: "active" },
  ],
  
  // Recent examinations
  recentExams: [
    { id: 1, title: "Math Midterm", instructor: "Jane Smith", questions: 25, category: "Mathematics", date: "2023-03-20" },
    { id: 2, title: "Physics Final", instructor: "Alice Brown", questions: 30, category: "Physics", date: "2023-03-18" },
    { id: 3, title: "CS Quiz", instructor: "Jane Smith", questions: 15, category: "Computer Science", date: "2023-03-15" },
    { id: 4, title: "Art History Test", instructor: "Alice Brown", questions: 20, category: "Art", date: "2023-03-10" },
    { id: 5, title: "English Essay", instructor: "Jane Smith", questions: 5, category: "English", date: "2023-03-05" },
  ],
  
  // User growth data for chart
  userGrowthData: [
    { month: 'Jan', users: 800 },
    { month: 'Feb', users: 900 },
    { month: 'Mar', users: 1000 },
    { month: 'Apr', users: 1100 },
    { month: 'May', users: 1200 },
    { month: 'Jun', users: 1250 },
  ],
  
  // Course categories data for pie chart
  courseCategoriesData: [
    { name: 'Mathematics', value: 20 },
    { name: 'Physics', value: 15 },
    { name: 'Computer Science', value: 25 },
    { name: 'Art', value: 10 },
    { name: 'English', value: 15 },
    { name: 'Other', value: 15 },
  ],
  
  // Colors for pie chart
  COLORS: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'],
}

const AdminOverview = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
          <div className="bg-secondary/10 px-4 py-3">
            <h4 className="font-medium">Total Users</h4>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold">{mockData.userStats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              +{mockData.userStats.newUsersThisMonth} this month
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
          <div className="bg-secondary/10 px-4 py-3">
            <h4 className="font-medium">Total Courses</h4>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold">{mockData.courseStats.totalCourses}</div>
            <p className="text-xs text-gray-500 mt-1">
              {mockData.courseStats.activeCourses} active courses
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
          <div className="bg-secondary/10 px-4 py-3">
            <h4 className="font-medium">Total Examinations</h4>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold">{mockData.examStats.totalExams}</div>
            <p className="text-xs text-gray-500 mt-1">
              +{mockData.examStats.examsThisMonth} this month
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
          <div className="bg-secondary/10 px-4 py-3">
            <h4 className="font-medium">Active Users</h4>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold">{mockData.userStats.activeUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((mockData.userStats.activeUsers / mockData.userStats.totalUsers) * 100)}% of total users
            </p>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
          <div className="bg-secondary/10 px-4 py-3">
            <h4 className="font-medium">User Growth</h4>
          </div>
          <div className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockData.userGrowthData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
          <div className="bg-secondary/10 px-4 py-3">
            <h4 className="font-medium">Course Categories</h4>
          </div>
          <div className="p-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockData.courseCategoriesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: { name: string, percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {mockData.courseCategoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={mockData.COLORS[index % mockData.COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for detailed data */}
      <Tabs aria-label="Admin Dashboard Tabs">
        <Tab key="users" title="Users">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
            <div className="bg-secondary/10 px-4 py-3">
              <h4 className="font-medium">Recent Users</h4>
            </div>
            <div className="p-4">
              <Table removeWrapper aria-label="Recent Users Table">
                <TableHeader>
                  <TableColumn>User</TableColumn>
                  <TableColumn>Email</TableColumn>
                  <TableColumn>Role</TableColumn>
                  <TableColumn>Join Date</TableColumn>
                  <TableColumn>Status</TableColumn>
                </TableHeader>
                <TableBody>
                  {mockData.recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                            fallback={user.name.substring(0, 2)}
                            size="sm"
                          />
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          color={
                            user.role === 'admin' 
                              ? 'danger' 
                              : user.role === 'instructor' 
                                ? 'primary' 
                                : 'secondary'
                          }
                          size="sm"
                        >
                          {user.role}
                        </Chip>
                      </TableCell>
                      <TableCell>{user.joinDate}</TableCell>
                      <TableCell>
                        <Chip 
                          color={user.status === 'active' ? 'success' : 'default'}
                          size="sm"
                        >
                          {user.status}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Tab>
        
        <Tab key="courses" title="Courses">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
            <div className="bg-secondary/10 px-4 py-3">
              <h4 className="font-medium">Recent Courses</h4>
            </div>
            <div className="p-4">
              <Table removeWrapper aria-label="Recent Courses Table">
                <TableHeader>
                  <TableColumn>Course Name</TableColumn>
                  <TableColumn>Instructor</TableColumn>
                  <TableColumn>Students</TableColumn>
                  <TableColumn>Groups</TableColumn>
                  <TableColumn>Status</TableColumn>
                </TableHeader>
                <TableBody>
                  {mockData.recentCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>{course.instructor}</TableCell>
                      <TableCell>{course.students}</TableCell>
                      <TableCell>{course.groups}</TableCell>
                      <TableCell>
                        <Chip 
                          color={course.status === 'active' ? 'success' : 'default'}
                          size="sm"
                        >
                          {course.status}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Tab>
        
        <Tab key="exams" title="Examinations">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl overflow-hidden shadow-sm border border-primary/10">
            <div className="bg-secondary/10 px-4 py-3">
              <h4 className="font-medium">Recent Examinations</h4>
            </div>
            <div className="p-4">
              <Table removeWrapper aria-label="Recent Examinations Table">
                <TableHeader>
                  <TableColumn>Title</TableColumn>
                  <TableColumn>Instructor</TableColumn>
                  <TableColumn>Questions</TableColumn>
                  <TableColumn>Category</TableColumn>
                  <TableColumn>Date</TableColumn>
                </TableHeader>
                <TableBody>
                  {mockData.recentExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>{exam.title}</TableCell>
                      <TableCell>{exam.instructor}</TableCell>
                      <TableCell>{exam.questions}</TableCell>
                      <TableCell>
                        <Chip variant="flat" size="sm">
                          {exam.category}
                        </Chip>
                      </TableCell>
                      <TableCell>{exam.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  )
}

export default AdminOverview