"use client";

import React, { useState, useEffect } from "react";
import CourseCard from "../course/course-card";
import { useUserStore } from "@/stores/user.store";
import { SolarRefreshLineDuotone, MdiSearch } from "../icons/icons";
import { Alert, Divider, Input } from "@nextui-org/react";
import { clientAPI } from "@/config/axios.config";
import { errorHandler } from "@/utils/error";

type Props = {};

const AvailableCourses = (props: Props) => {
  const { user } = useUserStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch courses with or without search parameter
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const endpoint = searchQuery 
          ? `course?search=${encodeURIComponent(searchQuery)}` 
          : 'course';
          
        const response = await clientAPI.get(endpoint);
        setCourses(response.data.data);
      } catch (err) {
        errorHandler(err);
        setError("Failed to fetch courses");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce search to avoid too many requests
    const timer = setTimeout(() => {
      fetchCourses();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Filter courses where the user is not enrolled
  useEffect(() => {
    if (courses && user) {
      const available = courses.filter((course) => 
        !course.groups.some((group) => 
          group.students.includes(user._id || "")
        )
      );
      setFilteredCourses(available);
    }
  }, [courses, user]);

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

  if (!courses || courses.length === 0) {
    return (
      <div className="size-full flex gap-4 justify-center items-center">
        <h1>No Courses Available</h1>
      </div>
    );
  }

  if (filteredCourses.length === 0) {
    return (
      <div className="size-full flex gap-4 justify-center items-center">
        <h1>No available courses to enroll</h1>
      </div>
    );
  }

  return (
    <div className="w-full mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Available Courses to Enroll</h2>
        <Divider className="my-2" />
        
        {/* Search bar */}
        <div className="mt-4 mb-2 max-w-md">
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<MdiSearch className="text-default-400" />}
            isClearable
            className="w-full"
          />
        </div>
      </div>
      <div className="w-fit p-4 flex gap-4 flex-wrap justify-start">
        {filteredCourses.map((course: CourseResponse, idx: number) => (
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

export default AvailableCourses;
