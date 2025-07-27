"use client";

import React, { useState, useEffect } from "react";
import CourseCard from "../course/course-card";
import { useUserStore } from "@/stores/user.store";
import { SolarRefreshLineDuotone, MdiSearch } from "../icons/icons";
import { Alert, Input } from "@nextui-org/react";
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
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="text-center space-y-4">
          <div className="text-8xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-default-700">No Courses Available</h2>
          <p className="text-default-500 text-lg max-w-md">
            There are no courses available at the moment. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  if (filteredCourses.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="text-center space-y-4">
          <div className="text-8xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-default-700">All Caught Up!</h2>
          <p className="text-default-500 text-lg max-w-md">
            You're already enrolled in all available courses. Great job staying on top of your learning!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Search bar */}
      <div className="w-1/4">
        <Input
          placeholder="Search available courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<MdiSearch className="text-default-400" />}
          isClearable
          size="lg"
          className="w-full"
        />
      </div>
      
      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.map((course: CourseResponse, idx: number) => (
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
      
      {/* Results count */}
      <div className="text-center mt-8">
        <p className="text-default-500">
          Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available for enrollment
        </p>
      </div>
    </div>
  );
};

export default AvailableCourses;
