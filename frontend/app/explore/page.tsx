"use client";

import React, { useState, useEffect, useMemo } from "react";
import ExploreCourseCard from "@/components/course/explore-course-card";
import { useUserStore } from "@/stores/user.store";
import { SolarRefreshLineDuotone, MdiSearch } from "@/components/icons/icons";
import { Alert, Divider, Input, Select, SelectItem, Button, Chip } from "@nextui-org/react";
import { clientAPI } from "@/config/axios.config";
import { errorHandler } from "@/utils/error";
import Loading from "@/components/state/loading";
import { 
  COURSE_CATEGORY_LABELS, 
  sortCoursesAlphabetically, 
  filterCoursesByCategory, 
  searchCourses 
} from "@/constants/course.constants";

type Props = {};

const ExplorePage = (props: Props) => {
  const { user } = useUserStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<'en' | 'th'>('en');
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await clientAPI.get('course');
        setCourses(response.data.data);
      } catch (err) {
        errorHandler(err);
        setError("Failed to fetch courses");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, []);
  
  // Apply search, filter, and sort to courses
  const processedCourses = useMemo(() => {
    let filtered = courses;
    
    // Apply search
    filtered = searchCourses(filtered, searchQuery);
    
    // Apply category filter
    filtered = filterCoursesByCategory(filtered, selectedCategory);
    
    // Apply sorting
    filtered = sortCoursesAlphabetically(filtered, sortOrder);
    
    return filtered;
  }, [courses, searchQuery, selectedCategory, sortOrder]);

  if (isLoading) {
    return (
      <div className="size-full flex gap-4 justify-center pt-20 items-center">
        <Loading />
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

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="text-start">
        <h2 className="text-2xl font-bold text-default-700 mb-2">Explore Courses</h2>
        <p className="text-default-500">
          Discover and explore all available courses in the system
        </p>
        <Divider className="my-4" />
      </div>
      
      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search Input */}
          <Input
            placeholder="Search courses..."
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
          <span>Showing {processedCourses.length} of {courses.length} courses</span>
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
      
      {/* Course Grid */}
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
          <div className="flex flex-wrap justify-start gap-4">
            {processedCourses.map((course: CourseResponse, idx: number) => (
              <div key={course._id} className="transform transition-all duration-300 hover:scale-105">
                <ExploreCourseCard
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
      
      {/* Results count */}
      {processedCourses.length > 0 && (
        <div className="text-center mt-8">
          <p className="text-default-500">
            Showing {processedCourses.length} course{processedCourses.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;