"use client";

import Loading from "@/components/state/loading";
import NotFound from "@/components/state/not-found";
import { useFetch } from "@/hooks/use-fetch";
import ExamScheduleCard from "@/components/overview/exam-schedule-card";
import { Tab, Tabs } from "@nextui-org/react";
import Image from "next/image";
import { useUserStore } from "@/stores/user.store";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { clientAPI } from "@/config/axios.config";

export default function StudentCoursePage() {
  const params = useSearchParams();
  const courseId = params.get("id");
  const { data, error, isLoading } = useFetch<ServerResponse<CourseResponse>>(
    `/course/${courseId}`
  );
  const { user: student } = useUserStore();
  const [instructor, setInstructor] = useState<UserResponse | null>(null);
  const [instructorLoading, setInstructorLoading] = useState(false);
  const currentUserId = student?._id || "";

  // Fetch instructor data when course data becomes available
  useEffect(() => {
    if (data?.data?.instructor_id) {
      setInstructorLoading(true);
      clientAPI
        .get<ServerResponse<UserResponse>>(`/user/${data.data.instructor_id}`)
        .then((response: any) => {
          setInstructor(response.data.data);
        })
        .catch((error: any) => {
          console.error("Error fetching instructor:", error);
        })
        .finally(() => {
          setInstructorLoading(false);
        });
    }
  }, [data?.data?.instructor_id]);

  // Find groups where the current student is enrolled
  const studentGroups = (data?.data.groups || []).filter((group: IGroup) =>
    group.students?.some((studentId: string) => studentId === currentUserId)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center size-full p-4">
        <Loading />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex justify-center items-center size-full p-4">
        <NotFound content={courseId || "Course not found"} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row size-full gap-6 lg:gap-8 xl:gap-14 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-32">
      <div className="flex flex-col lg:basis-9/12 gap-y-4 lg:gap-y-6">
        <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 w-full rounded-lg overflow-hidden">
          <Image
            unoptimized
            className="h-full w-full object-cover"
            src={data.data.background_src}
            width={900}
            height={600}
            alt="course background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/25" />
          <div className="absolute inset-0 p-4 sm:p-6 md:p-8 flex flex-col justify-start">
            <div className="h-full w-full flex flex-col justify-between">
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  {data.data.course_name}
                </h1>
                <p className="text-white/90 text-sm sm:text-base md:indent-16 text-justify line-clamp-3 md:line-clamp-none">
                  {data.data.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm sm:text-base">
                    {student?.info.first_name} {student?.info.last_name}
                  </span>
                </div>
                {studentGroups.length > 0 && (
                  <div className="flex items-center gap-2 bg-background/70 p-2 rounded-xl">
                    <span className="text-white text-xs sm:text-sm">
                      Group:
                    </span>
                    <span className="text-white text-xs sm:text-sm">
                      {studentGroups[0].group_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {studentGroups.length > 0 ? (
          studentGroups.map((group: IGroup, index: number) => (
            <div className="mt-4">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold mb-2">
                  {group.group_name}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {group.join_code ? (
                    <span className="text-xs sm:text-sm bg-secondary/20 px-2 py-1 rounded-full">
                      Join Code: {group.join_code}
                    </span>
                  ) : (
                    <span className="text-xs sm:text-sm bg-success/20 px-2 py-1 rounded-full">
                      Open Access
                    </span>
                  )}
                  <span className="text-xs sm:text-sm bg-primary/20 px-2 py-1 rounded-full">
                    {group.students.length} Learners
                  </span>
                </div>
              </div>

              {group.schedule_ids && group.schedule_ids.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    Upcoming Exams
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {group.schedule_ids.map(
                      (scheduleId: string, idx: number) => (
                        <ExamScheduleCard
                          isStudent
                          key={idx}
                          courseId={courseId!}
                          groupId={group._id}
                          setting={{
                            _id: scheduleId,
                            schedule_id: scheduleId,
                          }}
                          index={idx}
                          groupName={group.group_name}
                        />
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 mt-4 border border-dashed rounded-lg">
            <p className="text-foreground/60 mb-4 text-center text-sm sm:text-base">
              You are not enrolled in any groups for this course
            </p>
            <p className="text-xs sm:text-sm text-foreground/50 text-center">
              Please contact your instructor for a join code
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-y-4 sm:gap-y-6 lg:basis-3/12 order-first lg:order-last">
        <div className="bg-content1 p-3 sm:p-4 rounded-lg">
          <h3 className="font-medium mb-3 text-sm sm:text-base">
            Course Information
          </h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div>
              <p className="text-foreground/60">Instructor</p>
              <p className="font-medium">
                {instructorLoading
                  ? "Loading..."
                  : instructor
                  ? `${instructor.info.first_name} ${instructor.info.last_name}`
                  : "Not available"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-content1 p-3 sm:p-4 rounded-lg">
          <h3 className="font-medium mb-3 text-sm sm:text-base">Your Groups</h3>
          {studentGroups.length > 0 ? (
            <div className="space-y-2">
              {studentGroups.map((group: IGroup) => (
                <div
                  key={group._id}
                  className="p-2 sm:p-3 bg-content2 rounded-md"
                >
                  <p className="font-medium text-xs sm:text-sm">
                    {group.group_name}
                  </p>
                  <p className="text-xs text-foreground/60">
                    {group.join_code
                      ? `Code: ${group.join_code}`
                      : "Open Access"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-foreground/60">
              Not enrolled in any groups
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
