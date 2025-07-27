"use client";

import React from "react";
import CourseCard from "../course/course-card";
import { useFetch } from "@/hooks/use-fetch";
import { useUserStore } from "@/stores/user.store";
import { SolarRefreshLineDuotone } from "../icons/icons";
import { Alert } from "@nextui-org/react";

type Props = {};

const CourseList = (props: Props) => {
  const { user } = useUserStore();
  const { data, error, isLoading } = useFetch<ServerResponse<CourseResponse[]>>(
    `course/instructor/${user?._id}`
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
        <h1>No Course Created</h1>
      </div>
    );
  }

  return (
    <div className="w-fit p-4 flex gap-4 flex-wrap justify-start">
      {data.data.map((course, idx: number) => (
        <CourseCard
          id={course._id}
          groups={course.groups}
          className="w-[222px]"
          key={idx}
          title={course.course_name}
          description={course.description}
          bgSrc={course.background_src}
        />
      ))}
    </div>
  );
};

export default CourseList;
