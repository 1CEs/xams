'use client'

import { Tabs, Tab } from '@nextui-org/react'
import { UsersTable } from '@/components/admin/users-table'
import { CoursesTable } from '@/components/admin/courses-table'

export default function AdminDashboard() {
  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold hero-foreground mb-2">
            🛠️ Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-default-600">
            System management for courses and users
          </p>
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
            title="👥 Users"
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
            title="📚 Courses"
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
        </Tabs>
      </div>
    </div>
  )
}
