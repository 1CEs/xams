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
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🕒
          Upcoming Exams
        </h2>
        <Chip
          size="sm"
          variant="flat"
          color="secondary"
          startContent={<UisSchedule />}
        >
          {examSchedules.length} Total Exams
        </Chip>
      </div>

      {/* Upcoming Exams List */}
      <Card>
        <CardBody className="space-y-3">
          {upcomingExams.length > 0 ? (
            upcomingExams.map((exam, index) => {
              const isOpenNow = !exam.open_time || new Date() >= exam.open_time;
              const isClosed = exam.close_time && new Date() > exam.close_time;
              
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-default-50 to-default-100 rounded-xl border border-default-200 hover:shadow-md transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{exam.title}</h4>
                      {exam.exam_code && (
                        <Chip size="sm" color="warning" variant="flat">
                          🔒 Password Required
                        </Chip>
                      )}
                    </div>
                    <p className="text-sm text-default-600 mb-2">
                      {exam.course_name} • {exam.group_name}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-default-500">
                      <span>📝 {exam.question_count} questions</span>
                      <span>🔄 {exam.allowed_attempts} attempt{exam.allowed_attempts !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    {exam.open_time ? (
                      <div className="space-y-1">
                        <Chip 
                          size="sm" 
                          color={isClosed ? "danger" : isOpenNow ? "success" : "primary"} 
                          variant="flat"
                          startContent={<span>🕐</span>}
                        >
                          {isClosed ? "Closed" : isOpenNow ? "Open Now" : "Upcoming"}
                        </Chip>
                        <p className="text-xs text-default-500">
                          Opens: {exam.open_time.toLocaleDateString()} at {exam.open_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {exam.close_time && (
                          <p className="text-xs text-default-500">
                            Closes: {exam.close_time.toLocaleDateString()} at {exam.close_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Chip size="sm" color="success" variant="flat">
                        Available Anytime
                      </Chip>
                    )}
                    <div>
                      <Button
                        as={Link}
                        href={`/overview/course?id=${exam.schedule_id.split('-')[0]}`}
                        size="sm"
                        color="primary"
                        variant="flat"
                        className="text-xs"
                      >
                        View Course
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-default-500">
              <UisSchedule className="mx-auto text-4xl mb-2" />
              <p>No upcoming exams in the next 30 days</p>
              {examSchedules.length > 0 && (
                <p className="text-sm mt-1">You have {examSchedules.length} total exam{examSchedules.length !== 1 ? 's' : ''} scheduled</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default UpcomingExams;
