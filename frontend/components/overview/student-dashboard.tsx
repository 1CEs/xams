"use client";

import React from "react";
import CourseCard from "../course/course-card";
import UpcomingExams from "./exam-calendar";
import { useFetch } from "@/hooks/use-fetch";
import { useUserStore } from "@/stores/user.store";
import { SolarRefreshLineDuotone } from "../icons/icons";
import { Alert, Divider } from "@nextui-org/react";

type Props = {};

const StudentDashboard = (props: Props) => {
  const { user } = useUserStore();
  const { data, error, isLoading } = useFetch<ServerResponse<CourseResponse[]>>(
    `course`
  );

  if (isLoading) {
    return (
      <div className="size-full flex gap-4 justify-center items-center">
        <SolarRefreshLineDuotone className="text-secondary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="size-full flex gap-4 justify-center items-center">
        <Alert color="danger" title={error} />
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="size-full flex gap-4 justify-center items-center">
        <h1>No Courses Available</h1>
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
      <div className="w-full">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Student Portals</h2>
          <Divider className="my-2" />
          <p className="text-default-500 mt-4">
            You are not enrolled in any courses yet. Browse available courses below to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Exam Calendar Section */}
      <div className="mb-6">
        <UpcomingExams />
      </div>
      
      {/* Student Portals Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">Student Portals</h2>
        <Divider className="my-2" />
      </div>
      <div className="w-fit p-4 flex gap-4 flex-wrap justify-start">
        {enrolledCourses.map((course, idx: number) => (
          <CourseCard
            id={course._id}
            className="w-[222px]"
            key={idx}
            title={course.course_name}
            description={course.description}
            bgSrc={course.background_src}
            groups={course.groups}
          />
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
