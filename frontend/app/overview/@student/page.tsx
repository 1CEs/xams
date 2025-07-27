
"use client";

import StudentDashboard from "@/components/overview/student-dashboard";
import AvailableCourses from "@/components/overview/available-courses";

export default function StudentOverview() {
    return (
        <div className="p-2 sm:p-4 md:p-6 min-h-screen">
            {/* Dashboard section showing enrolled courses */}
            <div className="mb-6 md:mb-8">
                <StudentDashboard />
            </div>
            
            {/* Section for available courses to enroll */}
            <div className="mt-4 md:mt-6">
                <AvailableCourses />
            </div>
        </div>
    );
}
