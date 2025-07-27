"use client";

import React, { useState, useMemo } from "react";
import CourseCard from "../course/course-card";
import { useFetch } from "@/hooks/use-fetch";
import { useUserStore } from "@/stores/user.store";
import { SolarRefreshLineDuotone, MdiSearch } from "../icons/icons";
import { Alert, Card, CardBody, Button, Chip, Avatar, Input, Select, SelectItem } from "@nextui-org/react";
import { 
  COURSE_CATEGORY_LABELS, 
  sortCoursesAlphabetically, 
  filterCoursesByCategory, 
  searchCourses 
} from "@/constants/course.constants";

type Props = {};

const StudentCourses = (props: Props) => {
  const { user } = useUserStore();
  const { data, error, isLoading } = useFetch<ServerResponse<CourseResponse[]>>(
    `course`
  );
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<'en' | 'th'>('en');

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Process courses data (must be before any early returns to follow Rules of Hooks)
  const enrolledCourses = useMemo(() => {
    if (!data?.data || !user) return [];
    return data.data.filter((course) => 
      course.groups.some((group) => 
        group.students.includes(user._id || "")
      )
    );
  }, [data?.data, user]);
  
  // Apply search, filter, and sort to enrolled courses
  const processedCourses = useMemo(() => {
    let filtered = enrolledCourses;
    
    // Apply search
    filtered = searchCourses(filtered, searchQuery);
    
    // Apply category filter
    filtered = filterCoursesByCategory(filtered, selectedCategory);
    
    // Apply sorting
    filtered = sortCoursesAlphabetically(filtered, sortOrder);
    
    return filtered;
  }, [enrolledCourses, searchQuery, selectedCategory, sortOrder]);

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
      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Search Input */}
          <Input
            placeholder="Search my courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<MdiSearch className="text-default-400" />}
            isClearable
            size="md"
            className="w-full sm:w-80"
          />
          
          {/* Category Filter */}
          <Select
            placeholder="All Categories"
            selectedKeys={[selectedCategory]}
            onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
            size="md"
            className="w-full sm:w-48"
            items={[
              { key: 'all', label: 'All Categories' },
              ...Object.entries(COURSE_CATEGORY_LABELS).map(([key, label]) => ({ key, label }))
            ]}
          >
            {(item) => (
              <SelectItem key={item.key}>
                {item.label}
              </SelectItem>
            )}
          </Select>
        </div>
        
        {/* Sort Options */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={sortOrder === 'en' ? 'solid' : 'bordered'}
            color="secondary"
            onPress={() => setSortOrder('en')}
          >
            A-Z
          </Button>
          <Button
            size="sm"
            variant={sortOrder === 'th' ? 'solid' : 'bordered'}
            color="secondary"
            onPress={() => setSortOrder('th')}
          >
            ก-ฮ
          </Button>
        </div>
      </div>
      
      {/* Results Info */}
      {(searchQuery || selectedCategory !== 'all') && (
        <div className="flex items-center gap-2 text-sm text-default-500">
          <span>Showing {processedCourses.length} of {enrolledCourses.length} courses</span>
          {searchQuery && (
            <Chip size="sm" variant="flat" color="primary">
              Search: "{searchQuery}"
            </Chip>
          )}
          {selectedCategory !== 'all' && (
            <Chip size="sm" variant="flat" color="secondary">
              Category: {COURSE_CATEGORY_LABELS[selectedCategory as keyof typeof COURSE_CATEGORY_LABELS]}
            </Chip>
          )}
        </div>
      )}
      
      {/* Student Courses Grid */}
      <div className="space-y-6">
        {processedCourses.length === 0 && (searchQuery || selectedCategory !== 'all') ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center space-y-4">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-default-700">No courses found</h3>
              <p className="text-default-500 max-w-md">
                No courses match your current search or filter criteria. Try adjusting your search terms or category filter.
              </p>
              <Button 
                color="primary" 
                variant="flat" 
                onPress={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {processedCourses.map((course, idx: number) => (
              <div key={course._id} className="transform transition-all duration-300 hover:scale-105">
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
        )}
      </div>
    </div>
  );
};

export default StudentCourses;
