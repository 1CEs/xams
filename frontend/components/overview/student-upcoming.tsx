"use client";

import React from "react";
import UpcomingExams from "./exam-calendar";
import { useFetch } from "@/hooks/use-fetch";
import { useUserStore } from "@/stores/user.store";
import { SolarRefreshLineDuotone } from "../icons/icons";
import { Alert, Card, CardBody, Button, Chip, Avatar } from "@nextui-org/react";

type Props = {};

const StudentUpcoming = (props: Props) => {
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
        <p className="text-default-500 text-lg">Loading your dashboard...</p>
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

  // Filter courses where the student is enrolled in any group
  const enrolledCourses = data?.data?.filter((course) => 
    course.groups.some((group) => 
      group.students.includes(user?._id || "")
    )
  ) || [];

  return (
    <div className="space-y-8">
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
                    {enrolledCourses.length > 0 
                      ? `You have ${enrolledCourses.length} course${enrolledCourses.length !== 1 ? 's' : ''} to explore today`
                      : "Ready to start your learning journey?"
                    }
                  </p>
                </div>
              </div>
              {enrolledCourses.length > 0 && (
                <Chip 
                  size="lg" 
                  variant="flat" 
                  color="success"
                  startContent={<span className="text-lg">🎯</span>}
                >
                  {enrolledCourses.length} Active Course{enrolledCourses.length !== 1 ? 's' : ''}
                </Chip>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Upcoming Exams Section */}
      <div className="space-y-6">
        <UpcomingExams />
      </div>
    </div>
  );
};

export default StudentUpcoming;
