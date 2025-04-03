
"use client";

import StudentDashboard from "@/components/overview/student-dashboard";
import AvailableCourses from "@/components/overview/available-courses";

export default function StudentOverview() {
    return (
        <div className="p-6">
            
            {/* Dashboard section showing enrolled courses */}
            <StudentDashboard />
            
            {/* Section for available courses to enroll */}
            <AvailableCourses />
        </div>
    );
}
