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
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-default-700 flex items-center gap-2">
            ⏰ Upcoming Exams
          </h2>
          <p className="text-default-500 mt-1">
            Stay on top of your exam schedule
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Chip
            size="lg"
            variant="flat"
            color="secondary"
            startContent={<UisSchedule />}
          >
            {examSchedules.length} Total Exam{examSchedules.length !== 1 ? 's' : ''}
          </Chip>
        </div>
      </div>

      {/* Upcoming Exams List */}
      <Card className="shadow-lg">
        <CardBody className="p-6">
          {upcomingExams.length > 0 ? (
            <div className="space-y-4">
              {upcomingExams.map((exam, index) => {
                const isOpenNow = !exam.open_time || new Date() >= exam.open_time;
                const isClosed = exam.close_time && new Date() > exam.close_time;
                
                return (
                  <div key={index} className="group relative">
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-default-50 via-default-100 to-primary-50 rounded-xl border border-default-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">📝</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-lg group-hover:text-primary-600 transition-colors">
                              {exam.title}
                            </h4>
                            <p className="text-sm text-default-600 font-medium">
                              {exam.course_name} • {exam.group_name}
                            </p>
                          </div>
                          {exam.exam_code && (
                            <Chip size="sm" color="warning" variant="flat" className="ml-2">
                              🔒 Password Required
                            </Chip>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-default-500 ml-13">
                          <div className="flex items-center gap-1">
                            <span className="text-primary-500">📋</span>
                            <span>{exam.question_count} questions</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-secondary-500">🔄</span>
                            <span>{exam.allowed_attempts} attempt{exam.allowed_attempts !== 1 ? 's' : ''} allowed</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1/2 text-right space-y-3">
                        {exam.open_time ? (
                          <div className="space-y-2">
                            <Chip 
                              size="md" 
                              color={isClosed ? "danger" : isOpenNow ? "success" : "primary"} 
                              variant="flat"
                              startContent={
                                <span className="text-sm">
                                  {isClosed ? "🔒" : isOpenNow ? "✅" : "⏳"}
                                </span>
                              }
                              className="font-semibold"
                            >
                              {isClosed ? "Closed" : isOpenNow ? "Open Now" : "Upcoming"}
                            </Chip>
                            <div className="space-y-1">
                              <p className="text-xs text-default-600 font-medium">
                                📅 Opens: {exam.open_time.toLocaleDateString()} at {exam.open_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {exam.close_time && (
                                <p className="text-xs text-default-600 font-medium">
                                  ⏰ Closes: {exam.close_time.toLocaleDateString()} at {exam.close_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Chip size="md" color="success" variant="flat" className="font-semibold">
                            <span className="mr-1">🌟</span>
                            Available Anytime
                          </Chip>
                        )}
                        <div className="pt-2">
                          <Button
                            as={Link}
                            href={`/overview/course?id=${exam.schedule_id.split('-')[0]}`}
                            size="sm"
                            color="secondary"
                            variant="solid"
                            className="font-medium"
                            startContent={<span>🎯</span>}
                          >
                            Start Exam
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <div className="text-8xl mb-6">📅</div>
              <h3 className="text-xl font-semibold text-default-700">No Upcoming Exams</h3>
              <p className="text-default-500 text-lg max-w-md mx-auto">
                Great news! You don't have any exams scheduled for the next 30 days. 
                {examSchedules.length > 0 && (
                  <span className="block mt-2 text-sm">
                    You have {examSchedules.length} total exam{examSchedules.length !== 1 ? 's' : ''} scheduled for later
                  </span>
                )}
              </p>
              <div className="pt-4">
                <Button 
                  color="primary" 
                  variant="flat" 
                  startContent={<span>🔍</span>}
                >
                  Browse All Exams
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default UpcomingExams;
