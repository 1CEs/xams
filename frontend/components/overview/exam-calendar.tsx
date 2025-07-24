"use client";

import React, { useState, useMemo } from "react";
import { Card, CardBody, CardHeader, Button, Chip, Divider, Tooltip, Link } from "@nextui-org/react";
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

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  exams: ExamScheduleDetail[];
}

const ExamCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { examSchedules, isLoading, error } = useExamSchedules();

  // Filter upcoming exams (within next 30 days or no date set)
  const upcomingExams = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return examSchedules.filter(exam => {
      if (!exam.open_time) return true; // Include exams with no set date
      return exam.open_time >= now && exam.open_time <= thirtyDaysFromNow;
    }).slice(0, 5);
  }, [examSchedules]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        exams: []
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      
      // Find exams for this day
      const dayExams = examSchedules.filter(exam => {
        if (!exam.open_time) return false;
        const examDate = new Date(exam.open_time);
        return examDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        exams: dayExams
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        exams: []
      });
    }
    
    return days;
  }, [currentDate, examSchedules]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

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

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          📅
          Exam Schedule Calendar
        </h2>
        <Button
          size="sm"
          variant="flat"
          color="primary"
          onPress={goToToday}
        >
          Today
        </Button>
      </div>
      
      <Card className="w-full">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={() => navigateMonth('prev')}
            >
              ←
            </Button>
            <h3 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={() => navigateMonth('next')}
            >
              →
            </Button>
          </div>
          <Chip
            size="sm"
            variant="flat"
            color="secondary"
            startContent={<UisSchedule />}
          >
            {examSchedules.length} Exams
          </Chip>
        </CardHeader>
        
        <Divider />
        
        <CardBody className="p-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-default-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  min-h-[80px] p-1 border border-default-200 rounded-lg
                  ${day.isCurrentMonth ? 'bg-background' : 'bg-default-50'}
                  ${day.isToday ? 'ring-2 ring-primary' : ''}
                  hover:bg-default-100 transition-colors
                `}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${day.isCurrentMonth ? 'text-foreground' : 'text-default-400'}
                  ${day.isToday ? 'text-primary font-bold' : ''}
                `}>
                  {day.date.getDate()}
                </div>
                
                {/* Exam indicators */}
                <div className="space-y-1">
                  {day.exams.slice(0, 2).map((exam, examIndex) => (
                    <Tooltip
                      key={examIndex}
                      content={`${exam.title} - ${exam.course_name}`}
                      placement="top"
                    >
                      <div className="bg-primary/20 text-primary text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:bg-primary/30">
                        {exam.title.length > 10 ? exam.title.substring(0, 10) + '...' : exam.title}
                      </div>
                    </Tooltip>
                  ))}
                  {day.exams.length > 2 && (
                    <div className="text-xs text-default-500 text-center">
                      +{day.exams.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Upcoming Exams List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🕒
            Upcoming Exams
          </h3>
        </CardHeader>
        <Divider />
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

export default ExamCalendar;
