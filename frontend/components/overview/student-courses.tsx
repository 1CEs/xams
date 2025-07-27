"use client";

import React from "react";
import CourseCard from "../course/course-card";
import { useFetch } from "@/hooks/use-fetch";
import { useUserStore } from "@/stores/user.store";
import { SolarRefreshLineDuotone } from "../icons/icons";
import { Alert, Card, CardBody, Button, Chip, Avatar } from "@nextui-org/react";

type Props = {};

const StudentCourses = (props: Props) => {
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
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <SolarRefreshLineDuotone className="text-secondary animate-spin text-4xl" />
        <p className="text-default-500 text-lg">Loading your courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
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
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-4">
          <div className="text-8xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-default-700">No Courses Available</h2>
          <p className="text-default-500 text-lg max-w-md">
            It looks like there are no courses available at the moment. Please contact your administrator or check back later.
          </p>
          <Button 
            color="primary" 
            variant="flat" 
            onPress={() => window.location.reload()}
          >
            Refresh Courses
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
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-4">
          <div className="text-8xl mb-4">🎓</div>
          <h2 className="text-2xl font-bold text-default-700">No Courses Enrolled</h2>
          <p className="text-default-500 text-lg max-w-2xl mx-auto">
            You haven't enrolled in any courses yet. Get started by exploring available courses in the "Available Courses" tab, or contact your instructor for a course join code.
          </p>
          
          <Card className="max-w-2xl mx-auto">
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-default-700 mb-3">How to get started:</h3>
              <ul className="text-left text-default-600 space-y-2">
                <li>• Browse the "Available Courses" tab to find courses you can join</li>
                <li>• Contact your instructor for assistance</li>
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
    <div className="space-y-8">
      
      {/* Student Courses Grid */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-6">
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
    </div>
  );
};

export default StudentCourses;
