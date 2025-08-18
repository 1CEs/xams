
"use client";

import React from "react";
import { Tab, Tabs } from "@nextui-org/react";
import StudentUpcoming from "@/components/overview/student-upcoming";
import AvailableCourses from "@/components/overview/available-courses";
import StudentCourses from "@/components/overview/student-courses";

export default function StudentOverview() {
    return (
        <div className="p-3 sm:p-4 md:p-6">
            <div className="w-full max-w-7xl mx-auto">
                <Tabs 
                    className="flex justify-center pb-3" 
                    size="lg"
                    classNames={{
                        tabList: "flex-wrap gap-1 sm:gap-2",
                        tab: "px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base",
                        tabContent: "text-xs sm:text-sm md:text-base"
                    }}
                >
                    <Tab key="upcoming" title="📅 Upcoming">
                        <div className="mt-2 sm:mt-4">
                            <StudentUpcoming />
                        </div>
                    </Tab>
                    
                    <Tab key="courses" title="📚 My Courses">
                        <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
                            <div className="text-start mb-4 sm:mb-6">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-default-700 mb-2">
                                    My Enrolled Courses
                                </h1>
                                <p className="text-sm sm:text-base text-default-500">
                                    Access your course materials, assignments, and exams
                                </p>
                            </div>
                            <StudentCourses />
                        </div>
                    </Tab>
                    
                    <Tab key="available" title="🔍 Available Courses">
                        <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
                            <div className="text-start mb-4 sm:mb-6">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-default-700 mb-2">
                                    Available Courses
                                </h1>
                                <p className="text-sm sm:text-base text-default-500">
                                    Discover and enroll in new courses to expand your learning
                                </p>
                            </div>
                            <AvailableCourses />
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}
