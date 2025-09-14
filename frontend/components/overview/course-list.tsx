"use client";

import React, { useMemo } from "react";
import CourseCard from "../course/course-card";
import { useFetch } from "@/hooks/use-fetch";
import { useUserStore } from "@/stores/user.store";
import { SolarRefreshLineDuotone } from "../icons/icons";
import { Alert } from "@nextui-org/react";

type Props = {
  searchQuery?: string;
  sortBy?: string;
};

const CourseList = ({ searchQuery = "", sortBy = "" }: Props) => {
  const { user } = useUserStore();
  const { data, error, isLoading } = useFetch<ServerResponse<CourseResponse[]>>(
    `course/instructor/${user?._id}`
  );

  // Filter and sort courses based on search query and sort option
  const filteredAndSortedCourses = useMemo(() => {
    if (!data || !data.data) return [];
    
    let courses = [...data.data];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      courses = courses.filter(course => 
        course.course_name.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.category?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortBy) {
      courses.sort((a, b) => {
        switch (sortBy) {
          case "name_asc":
            return a.course_name.localeCompare(b.course_name);
          case "name_desc":
            return b.course_name.localeCompare(a.course_name);
          case "created_newest":
            // Since createdAt is not available in CourseResponse, sort by name as fallback
            return b.course_name.localeCompare(a.course_name);
          case "created_oldest":
            // Since createdAt is not available in CourseResponse, sort by name as fallback
            return a.course_name.localeCompare(b.course_name);
          default:
            return 0;
        }
      });
    }
    
    return courses;
  }, [data, searchQuery, sortBy]);

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

  if (filteredAndSortedCourses.length === 0 && searchQuery.trim()) {
    return (
      <div className="size-full flex flex-col gap-4 justify-center items-center">
        <h1>No courses found</h1>
        <p className="text-sm text-gray-500">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="w-fit p-4 flex gap-4 flex-wrap justify-start">
      {filteredAndSortedCourses.map((course, idx: number) => (
        <CourseCard
          id={course._id}
          groups={course.groups}
          className="w-[222px]"
          key={idx}
          title={course.course_name}
          description={course.description}
          bgSrc={course.background_src}
          category={course.category}
        />
      ))}
    </div>
  );
};

export default CourseList;
