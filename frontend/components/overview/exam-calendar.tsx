"use client";

import React, { useMemo } from "react";
import { Card, CardBody, Button, Chip, Tooltip, Link } from "@nextui-org/react";
import { useExamSchedules } from "@/hooks/use-exam-schedules";
import { SolarRefreshLineDuotone, UisSchedule } from "../icons/icons";

interface ExamScheduleDetail {
  _id: string;
  title: string;
  description?: string;
  open_time?: Date;
  close_time?: Date;
  allowed_attempts: number;
  course_name: string;
  course_id: string;
  group_name: string;
  schedule_id: string;
  instructor_id: string;
  question_count: number;
  exam_code?: string;
}



const UpcomingExams = () => {
  const { examSchedules, isLoading, error } = useExamSchedules();

  // Filter upcoming exams (within next 30 days or no date set)
  const upcomingExams = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return examSchedules.filter(exam => {
      if (!exam.open_time) return true; // Include exams with no set date
      return exam.open_time >= now && exam.open_time <= thirtyDaysFromNow;
    }).slice(0, 10); // Show more exams since we removed the calendar
  }, [examSchedules]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardBody className="flex items-center justify-center p-8">
          <SolarRefreshLineDuotone className="text-secondary animate-spin text-2xl" />
          <p className="text-default-500 mt-2">Loading exam calendar...</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-default-700 flex items-center gap-2">
          ⏰ Upcoming Exams
        </h2>
        <Chip size="sm" variant="flat" color="secondary">
          {examSchedules.length} Total
        </Chip>
      </div>

      {/* Compact Upcoming Exams List */}
      {upcomingExams.length > 0 ? (
        <div className="space-y-2">
          {upcomingExams.slice(0, 3).map((exam, index) => {
            const isOpenNow = !exam.open_time || new Date() >= exam.open_time;
            const isClosed = exam.close_time && new Date() > exam.close_time;
            
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">📝</span>
                        <h4 className="font-semibold text-foreground truncate">
                          {exam.title}
                        </h4>
                        {exam.exam_code && (
                          <Chip size="sm" color="warning" variant="flat">
                            🔒
                          </Chip>
                        )}
                      </div>
                      <p className="text-xs text-default-600 truncate">
                        {exam.course_name} • {exam.question_count}Q • {exam.allowed_attempts} attempts
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Chip 
                        size="sm" 
                        color={isClosed ? "danger" : isOpenNow ? "success" : "primary"} 
                        variant="flat"
                      >
                        {isClosed ? "Closed" : isOpenNow ? "Open" : "Upcoming"}
                      </Chip>
                      <Button
                        as={Link}
                        href={`/overview/course?id=${exam.course_id}`}
                        size="sm"
                        color="primary"
                        variant="flat"
                        isIconOnly
                      >
                        🎯
                      </Button>
                    </div>
                  </div>
                  
                  {exam.open_time && (
                    <div className="mt-2 text-xs text-default-500">
                      {exam.open_time > new Date() && (
                        <span>📅 {exam.open_time.toLocaleDateString()} {exam.open_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      {exam.close_time && exam.close_time > new Date() && (
                        <span className="ml-3">⏰ Due: {exam.close_time.toLocaleDateString()} {exam.close_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
          
          {upcomingExams.length > 3 && (
            <Card>
              <CardBody className="p-3">
                <div className="text-center">
                  <Button 
                    size="sm" 
                    variant="flat" 
                    color="primary"
                    className="text-xs"
                  >
                    View {upcomingExams.length - 3} more exam{upcomingExams.length - 3 !== 1 ? 's' : ''}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-sm text-default-600">
              No upcoming exams in the next 30 days
            </p>
            {examSchedules.length > 0 && (
              <p className="text-xs text-default-500 mt-1">
                {examSchedules.length} exam{examSchedules.length !== 1 ? 's' : ''} scheduled for later
              </p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default UpcomingExams;
