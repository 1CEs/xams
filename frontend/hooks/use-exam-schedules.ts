"use client";

import { useState, useEffect } from "react";
import { clientAPI } from "@/config/axios.config";
import { useUserStore } from "@/stores/user.store";

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

export const useExamSchedules = () => {
  const [examSchedules, setExamSchedules] = useState<ExamScheduleDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserStore();

  useEffect(() => {
    const fetchExamSchedules = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        // First, get all courses
        const coursesResponse = await clientAPI.get<ServerResponse<CourseResponse[]>>('/course');
        const courses = coursesResponse.data.data;

        // Filter enrolled courses
        const enrolledCourses = courses.filter((course) => 
          course.groups.some((group) => 
            group.students.includes(user._id)
          )
        );

        const schedulePromises: Promise<ExamScheduleDetail | null>[] = [];

        // For each enrolled course and group, fetch exam schedule details
        enrolledCourses.forEach(course => {
          course.groups.forEach(group => {
            if (group.students.includes(user._id) && group.schedule_ids) {
              group.schedule_ids.forEach(scheduleId => {
                const promise = clientAPI.get(`/exam-schedule/${scheduleId}`)
                  .then(response => {
                    const scheduleData = response.data.data;
                    return {
                      _id: scheduleData._id,
                      title: scheduleData.title,
                      description: scheduleData.description,
                      open_time: scheduleData.open_time ? new Date(scheduleData.open_time) : undefined,
                      close_time: scheduleData.close_time ? new Date(scheduleData.close_time) : undefined,
                      allowed_attempts: scheduleData.allowed_attempts,
                      course_name: course.course_name,
                      course_id: course._id,
                      group_name: group.group_name,
                      schedule_id: scheduleId,
                      instructor_id: scheduleData.instructor_id,
                      question_count: scheduleData.question_count,
                      exam_code: scheduleData.exam_code
                    } as ExamScheduleDetail;
                  })
                  .catch(error => {
                    console.error(`Failed to fetch schedule ${scheduleId}:`, error);
                    return null;
                  });
                
                schedulePromises.push(promise);
              });
            }
          });
        });

        // Wait for all schedule details to be fetched
        const scheduleResults = await Promise.allSettled(schedulePromises);
        const validSchedules = scheduleResults
          .filter((result): result is PromiseFulfilledResult<ExamScheduleDetail> => 
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value);

        // Sort by open_time (upcoming first, then by date)
        validSchedules.sort((a, b) => {
          if (!a.open_time && !b.open_time) return 0;
          if (!a.open_time) return 1; // No date goes to end
          if (!b.open_time) return -1; // No date goes to end
          return a.open_time.getTime() - b.open_time.getTime();
        });

        setExamSchedules(validSchedules);
      } catch (err) {
        console.error('Error fetching exam schedules:', err);
        setError('Failed to load exam schedules');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamSchedules();
  }, [user]);

  return { examSchedules, isLoading, error, refetch: () => {
    if (user) {
      setIsLoading(true);
      // Re-trigger the effect by updating a dependency
    }
  }};
};
