"use client";

import React from "react";
import CourseCard from "../course/course-card";
import UpcomingExams from "./exam-calendar";
import { useFetch } from "@/hooks/use-fetch";
import { useUserStore } from "@/stores/user.store";
import { SolarRefreshLineDuotone } from "../icons/icons";
import { Alert, Card, CardBody, Button, Chip, Link, Avatar } from "@nextui-org/react";

type Props = {};

const StudentDashboard = (props: Props) => {
  const { user } = useUserStore();
  const { data, error, isLoading } = useFetch<ServerResponse<CourseResponse[]>>(
    `course`
  );

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <SolarRefreshLineDuotone className="text-secondary animate-spin text-4xl" />
        <p className="text-default-500 text-lg">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">😞</div>
          <Alert color="danger" title="Something went wrong" description={error} />
          <Button 
            color="primary" 
            variant="flat" 
            onPress={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-4">
          <div className="text-8xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-default-700">No Courses Available</h1>
          <p className="text-default-500 text-lg max-w-md">
            It looks like there are no courses available at the moment. Please contact your administrator or check back later.
          </p>
          <Button 
            color="primary" 
            variant="flat" 
            onPress={() => window.location.reload()}
          >
            Refresh Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Filter courses where the student is enrolled in any group
  const enrolledCourses = data.data.filter((course) => 
    course.groups.some((group) => 
      group.students.includes(user?._id || "")
    )
  );

  if (enrolledCourses.length === 0) {
    return (
      <div className="min-h-screen">
        {/* Welcome Header */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-primary-100 to-secondary-100 border-none">
            <CardBody className="p-8">
              <div className="flex items-center space-x-4">
                <Avatar 
                  src={user?.profile_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.info?.first_name} ${user?.info?.last_name}`}
                  size="lg"
                  className="ring-2 ring-primary-200"
                />
                <div>
                  <h1 className="text-3xl font-bold text-default-700">
                    {getGreeting()}, {user?.info?.first_name || user?.username}! 👋
                  </h1>
                  <p className="text-default-600 text-lg mt-1">
                    Ready to start your learning journey?
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* No Courses Message */}
        <div className="text-center space-y-6">
          <div className="text-8xl mb-4">🎓</div>
          <h2 className="text-2xl font-bold text-default-700">Welcome to Your Learning Dashboard!</h2>
          <p className="text-default-500 text-lg max-w-2xl mx-auto">
            You're not enrolled in any courses yet, but don't worry! Once your instructor adds you to a course, 
            you'll see all your classes, exams, and assignments right here.
          </p>
          
          <Card className="max-w-md mx-auto mt-6">
            <CardBody className="text-center space-y-4">
              <div className="text-4xl">💡</div>
              <h3 className="text-lg font-semibold">What's next?</h3>
              <ul className="text-default-600 space-y-2 text-left">
                <li>• Contact your instructor for course enrollment</li>
                <li>• Check your email for course invitations</li>
                <li>• Ask for a course join code</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-primary-100 to-secondary-100 border-none">
          <CardBody className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar 
                  src={user?.profile_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.info?.first_name} ${user?.info?.last_name}`}
                  size="lg"
                  className="ring-2 ring-primary-200"
                />
                <div>
                  <h1 className="text-3xl font-bold text-default-700">
                    {getGreeting()}, {user?.info?.first_name || user?.username}! 👋
                  </h1>
                  <p className="text-default-600 text-lg mt-1">
                    You have {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} to explore today
                  </p>
                </div>
              </div>
              <Chip 
                size="lg" 
                variant="flat" 
                color="success"
                startContent={<span className="text-lg">🎯</span>}
              >
                {enrolledCourses.length} Active Course{enrolledCourses.length !== 1 ? 's' : ''}
              </Chip>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Exam Calendar Section */}
      <div className="mb-8">
        <UpcomingExams />
      </div>
      
      {/* Student Portals Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-default-700 flex items-center gap-2">
              📚 My Courses
            </h2>
            <p className="text-default-500 mt-1">
              Access your course materials, assignments, and exams
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {enrolledCourses.map((course, idx: number) => (
            <div key={idx} className="transform transition-all duration-300 hover:scale-105">
              <CourseCard
                id={course._id}
                className="h-full"
                title={course.course_name}
                description={course.description}
                bgSrc={course.background_src}
                groups={course.groups}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-default-700">Need help?</h3>
                <p className="text-default-500 mt-1">
                  Get support or explore more features
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  color="primary" 
                  variant="flat" 
                  startContent={<span>📞</span>}
                >
                  Contact Support
                </Button>
                <Button 
                  color="secondary" 
                  variant="flat" 
                  startContent={<span>📖</span>}
                >
                  User Guide
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
