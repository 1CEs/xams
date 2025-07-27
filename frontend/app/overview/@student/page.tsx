
"use client";

import React from "react";
import { Tab, Tabs } from "@nextui-org/react";
import StudentUpcoming from "@/components/overview/student-upcoming";
import AvailableCourses from "@/components/overview/available-courses";
import StudentCourses from "@/components/overview/student-courses";

export default function StudentOverview() {
    return (
        <div className="p-6">
            <div className="w-full">
                <Tabs className="flex justify-center pb-3" size="lg">
                    <Tab key="upcoming" title="📅 Upcoming">
                        <StudentUpcoming />
                    </Tab>
                    
                    <Tab key="courses" title="📚 My Courses">
                        <div className="space-y-6">
                            <div className="text-start mb-6">
                                <h1 className="text-2xl font-bold text-default-700 mb-2">
                                    My Enrolled Courses
                                </h1>
                                <p className="text-default-500">
                                    Access your course materials, assignments, and exams
                                </p>
                            </div>
                            <StudentCourses />
                        </div>
                    </Tab>
                    
                    <Tab key="available" title="🔍 Available Courses">
                        <div className="space-y-6">
                            <div className="text-start mb-6">
                                <h1 className="text-2xl font-bold text-default-700 mb-2">
                                    Available Courses
                                </h1>
                                <p className="text-default-500">
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
