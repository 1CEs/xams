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
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4">
        <SolarRefreshLineDuotone className="text-secondary animate-spin text-3xl sm:text-4xl" />
        <p className="text-default-500 text-base sm:text-lg text-center">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="text-4xl sm:text-6xl mb-4">😞</div>
          <Alert color="danger" title="Something went wrong" description={error} className="text-left" />
          <Button 
            color="primary" 
            variant="flat" 
            onPress={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 px-4">
        <div className="text-center space-y-4 max-w-lg w-full">
          <div className="text-6xl sm:text-8xl mb-4">📚</div>
          <h1 className="text-xl sm:text-2xl font-bold text-default-700">No Courses Available</h1>
          <p className="text-default-500 text-base sm:text-lg max-w-md mx-auto">
            It looks like there are no courses available at the moment. Please contact your administrator or check back later.
          </p>
          <Button 
            color="primary" 
            variant="flat" 
            onPress={() => window.location.reload()}
            className="w-full sm:w-auto"
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
      <div className="min-h-screen px-4">
        {/* Welcome Header */}
        <div className="mb-6 md:mb-8">
          <Card className="bg-gradient-to-r from-primary-100 to-secondary-100 border-none">
            <CardBody className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-4">
                <Avatar 
                  src={user?.profile_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.info?.first_name} ${user?.info?.last_name}`}
                  size="lg"
                  className="ring-2 ring-primary-200 mx-auto sm:mx-0"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-default-700">
                    {getGreeting()}, {user?.info?.first_name || user?.username}! 👋
                  </h1>
                  <p className="text-default-600 text-sm sm:text-base md:text-lg mt-1">
                    Ready to start your learning journey?
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* No Courses Message */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="text-6xl sm:text-8xl mb-4">🎓</div>
          <h2 className="text-xl sm:text-2xl font-bold text-default-700 px-4">Welcome to Your Learning Dashboard!</h2>
          <p className="text-default-500 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            You're not enrolled in any courses yet, but don't worry! Once your instructor adds you to a course, 
            you'll see all your classes, exams, and assignments right here.
          </p>
          
          <Card className="max-w-md mx-auto mt-6">
            <CardBody className="text-center space-y-4 p-4 sm:p-6">
              <div className="text-3xl sm:text-4xl">💡</div>
              <h3 className="text-base sm:text-lg font-semibold">What's next?</h3>
              <ul className="text-default-600 space-y-2 text-left text-sm sm:text-base">
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
    <div className="min-h-screen space-y-6 md:space-y-8 px-4">
      {/* Welcome Header */}
      <div className="mb-6 md:mb-8">
        <Card className="bg-gradient-to-r from-primary-100 to-secondary-100 border-none">
          <CardBody className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-4">
                <Avatar 
                  src={user?.profile_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.info?.first_name} ${user?.info?.last_name}`}
                  size="lg"
                  className="ring-2 ring-primary-200 mx-auto sm:mx-0"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-default-700">
                    {getGreeting()}, {user?.info?.first_name || user?.username}! 👋
                  </h1>
                  <p className="text-default-600 text-sm sm:text-base md:text-lg mt-1">
                    You have {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} to explore today
                  </p>
                </div>
              </div>
              <div className="flex justify-center md:justify-end">
                <Chip 
                  size="lg" 
                  variant="flat" 
                  color="success"
                  startContent={<span className="text-sm sm:text-lg">🎯</span>}
                  className="text-sm sm:text-base"
                >
                  {enrolledCourses.length} Active Course{enrolledCourses.length !== 1 ? 's' : ''}
                </Chip>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Exam Calendar Section */}
      <div className="mb-6">
        <UpcomingExams />
      </div>
      
      {/* Student Portals Section */}
      <div className="space-y-4 md:space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-default-700 flex items-center justify-center md:justify-start gap-2">
            📚 My Courses
          </h2>
          <p className="text-default-500 mt-1 text-sm sm:text-base">
            Access your course materials, assignments, and exams
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
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
      <div className="mt-8 md:mt-12">
        <Card>
          <CardBody className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div className="text-center md:text-left">
                <h3 className="text-base sm:text-lg font-semibold text-default-700">Need help?</h3>
                <p className="text-default-500 mt-1 text-sm sm:text-base">
                  Get support or explore more features
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button 
                  color="primary" 
                  variant="flat" 
                  startContent={<span>📞</span>}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Contact Support
                </Button>
                <Button 
                  color="secondary" 
                  variant="flat" 
                  startContent={<span>📖</span>}
                  className="w-full sm:w-auto"
                  size="sm"
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
