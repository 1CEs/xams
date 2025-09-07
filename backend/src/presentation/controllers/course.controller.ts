import { ICourse } from "../../core/course/model/interface/icourse";
import { IGroup } from "../../core/course/model/interface/igroup";
import { CourseService } from "../../core/course/service/course.service";
import { ICourseService } from "../../core/course/service/interface/icourse.service";
import { ExaminationScheduleService } from "../../core/examination/service/exam-schedule.service";
import { IExaminationScheduleService } from "../../core/examination/service/interface/iexam-schedule.service";
import { ExamSubmissionService } from "../../core/examination/service/exam-submission.service";
import { IExamSubmissionService } from "../../core/examination/service/interface/iexam-submission.service";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { InstructorService } from "../../core/user/service/instructor.service";
import { StudentService } from "../../core/user/service/student.service";
import { UserServiceFactory } from "../../core/user/service/user.factory";
import { UserRole } from "../../types/user";
import { ICourseController } from "./interface/icourse.controller";

export class CourseController implements ICourseController {
    private _service: ICourseService
    private _examScheduleService: IExaminationScheduleService
    private _submissionService: IExamSubmissionService

    constructor() {
        this._service = new CourseService()
        this._examScheduleService = new ExaminationScheduleService()
        this._submissionService = new ExamSubmissionService()
    }

    private _response<T>(message: string, code: number, data: T) {
        return {
            message,
            code,
            data
        }
    }

    // Course-Only methods
    async addCourse(payload: Omit<ICourse, "_id">, user: IInstructor) {
        console.log(user)
        const course = await this._service.addCourse(payload)
        const service = new UserServiceFactory().createService(user.role)

        const update = (service as InstructorService).updateCourse(user._id as unknown as string, course?._id as unknown as string)

        return this._response<typeof course>('Create Course Successfully', 200, course)
    }

    async getCourses(search?: string) {
        // If search parameter is provided, use enhanced search that includes instructor names
        if (search && search.trim() !== '') {
            const searchResults = await this._service.searchCourses(search.trim())
            
            // Handle case where search results might be null
            if (!searchResults) {
                return this._response<[]>('No courses found', 200, [])
            }
            
            return this._response<typeof searchResults>('Done', 200, searchResults)
        }
        
        // If no search parameter, return all courses
        const courses = await this._service.getCourses()
        
        // Handle case where courses might be null
        if (!courses) {
            return this._response<[]>('No courses found', 200, [])
        }
        
        return this._response<typeof courses>('Done', 200, courses)
    }

    async getCourseByStudentId (student_id: string) {
        const courses = await this._service.getCourseByStudentId(student_id)
        return this._response<typeof courses>('Done', 200, courses)
    }

    async getCourseById(id: string) {
        const course = await this._service.getCourseById(id)
        return this._response<typeof course>('Done', 200, course)
    }

    async getCourseByInstructorId (instructor_id: string) {
        const courses = await this._service.getCourseByInstructorId(instructor_id)
        return this._response<typeof courses>('Done', 200, courses)
    }

    async getCoursesByInstructorName (instructorName: string) {
        const courses = await this._service.getCoursesByInstructorName(instructorName)
        return this._response<typeof courses>('Done', 200, courses)
    }

    async updateCourse(id: string, payload: Partial<ICourse>) {
        const updated = await this._service.updateCourse(id, payload)
        return this._response<typeof updated>('Update Course Successfully', 200, updated)
    }

    async deleteCourse(id: string) {
        const deleted = await this._service.deleteCourse(id)
        return this._response<typeof deleted>('Delete Course Successfully', 200, deleted)
    }

    async verifyPassword(course_id: string, group_id: string, setting_id: string, password: string, user?: IInstructor) {
        const service = new UserServiceFactory().createService(user?.role as UserRole)
        if(user?.role !== "student") {
            const verified = await this._service.verifyPassword(course_id, group_id, setting_id, password)

            if(!verified) {
                return this._response<null>('Incorrect password', 400, null)
            }

            return this._response<typeof verified>('Password Verified Successfully', 200, verified)
        }
        
        const isUserAlreadyInGroup = await (service as StudentService).isUserAlreadyInGroup(user?._id as unknown as string, group_id)
        if (!isUserAlreadyInGroup) {
            return this._response<null>('User is not in the group', 400, null)
        }
        const verified = await this._service.verifyPassword(course_id, group_id, setting_id, password)
        if(!verified) {
            return this._response<null>('Incorrect password', 400, null)
        }
        return this._response<Boolean | null>('Password Verified Successfully', 200, verified)
        
    }

    // Group methods
    async addGroup(courseId: string, groupData: Omit<IGroup, "_id">) {
        const course = await this._service.getCourseById(courseId)
        
        if (!course) {
            return this._response('Course not found', 404, null)
        }

        // Initialize groups array if it doesn't exist
        if (!course.groups) {
            course.groups = []
        }

        // Check if a group with the same name already exists
        const groupNameExists = course.groups.some(group => 
            group.group_name.toLowerCase() === groupData.group_name.toLowerCase()
        )

        if (groupNameExists) {
            return this._response('A group with this name already exists', 400, null)
        }

        // Add the new group to the course
        course.groups.push(groupData as IGroup)
        
        // Update the course with the new group
        const updated = await this._service.updateCourse(courseId, { groups: course.groups })
        
        return this._response('Group added successfully', 200, updated)
    }

    async deleteGroup(courseId: string, groupName: string) {
        const course = await this._service.getCourseById(courseId)
        
        if (!course) {
            return this._response('Course not found', 404, null)
        }

        // Check if the course has groups
        if (!course.groups || course.groups.length === 0) {
            return this._response('No groups found in this course', 404, null)
        }

        // Find the index of the group with the given name
        const groupIndex = course.groups.findIndex(group => 
            group.group_name === groupName
        )

        // If group not found
        if (groupIndex === -1) {
            return this._response('Group not found', 404, null)
        }

        // Get the group to be deleted to clean up its examination schedules
        const groupToDelete = course.groups[groupIndex]
        
        // Delete all examination schedules associated with this group
        if (groupToDelete.schedule_ids && groupToDelete.schedule_ids.length > 0) {
            for (const scheduleId of groupToDelete.schedule_ids) {
                try {
                    if (scheduleId) {
                        await this._examScheduleService.deleteExaminationSchedule(scheduleId)
                    }
                } catch (error: any) {
                    console.error('Error deleting examination schedule:', error)
                    // Continue with group deletion even if some schedules fail to delete
                }
            }
        }

        // Remove the group from the array
        course.groups.splice(groupIndex, 1)
        
        // Update the course with the modified groups array
        const updated = await this._service.updateCourse(courseId, { groups: course.groups })
        
        return this._response('Group deleted successfully', 200, updated)
    }

    async updateGroup(courseId: string, groupName: string, updateData: { group_name: string; join_code?: string }) {
        const course = await this._service.getCourseById(courseId)
        
        if (!course) {
            return this._response('Course not found', 404, null)
        }

        // Check if the course has groups
        if (!course.groups || course.groups.length === 0) {
            return this._response('No groups found in this course', 404, null)
        }

        // Find the index of the group with the given name
        const groupIndex = course.groups.findIndex(group => 
            group.group_name === groupName
        )

        // If group not found
        if (groupIndex === -1) {
            return this._response('Group not found', 404, null)
        }

        // Check if the new group name already exists (if it's different from current name)
        if (updateData.group_name !== groupName) {
            const existingGroup = course.groups.find(group => 
                group.group_name === updateData.group_name
            )
            
            if (existingGroup) {
                return this._response('A group with this name already exists', 400, null)
            }
        }

        // Use MongoDB's positional operator to update only the specific group
        // This preserves all other group data including students and schedule_ids
        const updateQuery = {
            [`groups.${groupIndex}.group_name`]: updateData.group_name,
            [`groups.${groupIndex}.join_code`]: updateData.join_code
        }
        
        console.log('Updating group at index:', groupIndex)
        console.log('Original group name:', course.groups[groupIndex].group_name)
        console.log('New group name:', updateData.group_name)
        console.log('Students count before update:', course.groups[groupIndex].students?.length || 0)
        console.log('Schedule IDs count before update:', course.groups[groupIndex].schedule_ids?.length || 0)
        
        // Update only the specific fields without affecting other group data
        const updated = await this._service.updateCourse(courseId, updateQuery)
        
        return this._response('Group updated successfully', 200, updated)
    }

    // Setting methods
    async addGroupExamSetting(courseId: string, groupName: string, examSettingData: any) {
        const course = await this._service.getCourseById(courseId)
        
        if (!course) {
            return this._response('Course not found', 404, null)
        }

        // Check if the course has groups
        if (!course.groups || course.groups.length === 0) {
            return this._response('No groups found in this course', 404, null)
        }

        // Find the group with the given name
        const groupIndex = course.groups.findIndex(group => 
            group.group_name === groupName
        )

        // If group not found
        if (groupIndex === -1) {
            return this._response('Group not found', 404, null)
        }

        // Initialize schedule_ids array if it doesn't exist
        if (!course.groups[groupIndex].schedule_ids) {
            course.groups[groupIndex].schedule_ids = []
        }

        try {
        // Debug logging for total_score
        console.log('=== CONTROLLER DEBUG ===');
        console.log('examSettingData.total_score:', examSettingData.total_score);
        console.log('examSettingData keys:', Object.keys(examSettingData));
        
        // Create an examination schedule to snapshot the questions
        const examSchedule = await this._examScheduleService.createExaminationSchedule(
                examSettingData.exam_ids,
                course.instructor_id,
                examSettingData.question_count,
                examSettingData.schedule_name,
                {
                    open_time: examSettingData.open_time,
                    close_time: examSettingData.close_time,
                    ip_range: examSettingData.ip_range,
                    exam_code: examSettingData.exam_code,
                    allowed_attempts: examSettingData.allowed_attempts,
                    allowed_review: examSettingData.allowed_review,
                    show_answer: examSettingData.show_answer,
                    randomize_question: examSettingData.randomize_question,
                    randomize_choice: examSettingData.randomize_choice,
                    total_score: examSettingData.total_score,
                    assistant_grading: examSettingData.assistant_grading
                },
                examSettingData.selected_questions // Pass the selected questions from frontend
            );

            if (!examSchedule) {
                return this._response('Failed to create examination schedule', 500, null);
            }

            // Add the schedule ID to the group
            course.groups[groupIndex].schedule_ids.push(examSchedule._id?.toString() || '');
            
            // Update the course with the modified groups array
            const updated = await this._service.updateCourse(courseId, { groups: course.groups });
            
            return this._response('Exam setting added successfully', 200, updated);
        } catch (error: any) {
            console.error('Error creating examination schedule:', error);
            return this._response(`Failed to create examination schedule: ${error.message || 'Unknown error'}`, 500, null);
        }
    }

    async deleteGroupExamSetting(courseId: string, groupName: string, examSettingIndex: number) {
        const course = await this._service.getCourseById(courseId)
        
        if (!course) {
            return this._response('Course not found', 404, null)
        }

        // Check if the course has groups
        if (!course.groups || course.groups.length === 0) {
            return this._response('No groups found in this course', 404, null)
        }

        // Find the group with the given name
        const groupIndex = course.groups.findIndex(group => 
            group.group_name === groupName
        )

        // If group not found
        if (groupIndex === -1) {
            return this._response('Group not found', 404, null)
        }

        // Check if the group has schedule IDs
        if (!course.groups[groupIndex].schedule_ids || course.groups[groupIndex].schedule_ids.length === 0) {
            return this._response('No exam settings found for this group', 404, null)
        }

        // Check if the exam setting index is valid
        if (examSettingIndex < 0 || examSettingIndex >= course.groups[groupIndex].schedule_ids.length) {
            return this._response('Invalid exam setting index', 404, null)
        }

        // Get the schedule ID to be deleted
        const scheduleIdToDelete = course.groups[groupIndex].schedule_ids[examSettingIndex]
        
        try {
            // First, delete all related submissions for this schedule
            if (scheduleIdToDelete) {
                console.log(`🗑️ Deleting submissions for schedule: ${scheduleIdToDelete}`)
                await this._submissionService.deleteSubmissionsByScheduleId(scheduleIdToDelete)
                console.log(`✅ Successfully deleted submissions for schedule: ${scheduleIdToDelete}`)
            }
            
            // Then delete the examination schedule from the database
            if (scheduleIdToDelete) {
                console.log(`🗑️ Deleting examination schedule: ${scheduleIdToDelete}`)
                await this._examScheduleService.deleteExaminationSchedule(scheduleIdToDelete)
                console.log(`✅ Successfully deleted examination schedule: ${scheduleIdToDelete}`)
            }
        } catch (error: any) {
            console.error('Error deleting examination schedule and related submissions:', error)
            // Continue with deleting the exam setting even if schedule/submission deletion fails
            // This prevents orphaned exam settings in case the schedule was already deleted
        }

        // Remove the schedule ID from the array
        course.groups[groupIndex].schedule_ids.splice(examSettingIndex, 1)
        
        // Update the course with the modified groups array
        const updated = await this._service.updateCourse(courseId, { groups: course.groups })
        
        return this._response('Exam setting deleted successfully', 200, updated)
    }

    async updateGroupExamSetting(courseId: string, groupName: string, scheduleId: string, examSettingData: any) {
        try {
            console.log('=== UPDATE GROUP EXAM SETTING DEBUG ===');
            console.log('Course ID:', courseId);
            console.log('Group Name:', groupName);
            console.log('Schedule ID:', scheduleId);
            console.log('Exam Setting Data:', examSettingData);
            
            // Update the examination schedule directly
            const updatedSchedule = await this._examScheduleService.updateExaminationSchedule(scheduleId, {
                title: examSettingData.schedule_name,
                open_time: examSettingData.open_time,
                close_time: examSettingData.close_time,
                ip_range: examSettingData.ip_range,
                exam_code: examSettingData.exam_code,
                allowed_attempts: examSettingData.allowed_attempts,
                allowed_review: examSettingData.allowed_review,
                show_answer: examSettingData.show_answer,
                randomize_question: examSettingData.randomize_question,
                randomize_choice: examSettingData.randomize_choice,
                question_count: examSettingData.question_count,
                total_score: examSettingData.total_score,
                exam_ids: examSettingData.exam_ids,
                selected_questions: examSettingData.selected_questions
            });
            
            console.log('✅ Successfully updated examination schedule:', updatedSchedule);
            
            return this._response('Exam setting updated successfully', 200, updatedSchedule)
        } catch (error: any) {
            console.error('❌ Error updating examination schedule:', error)
            throw error
        }
    }

    async getSetting(course_id: string, group_id: string, setting_id: string) {
        const setting = await this._service.getSetting(course_id, group_id, setting_id)
        return this._response<typeof setting>('Done', 200, setting)
    }

    // Validation method for exam access (students and instructors)
    async validateStudentExamAccess(userId: string, scheduleId: string) {
        try {
            // First, check if the user is the instructor who owns this exam schedule
            const examSchedule = await this._examScheduleService.getExaminationScheduleById(scheduleId)
            
            if (!examSchedule) {
                return this._response('Exam schedule not found', 404, { hasAccess: false })
            }

            // Check if the user is the instructor who created this exam schedule
            if (examSchedule.instructor_id === userId) {
                return this._response('Instructor has access to their own exam', 200, { 
                    hasAccess: true,
                    accessType: 'instructor',
                    scheduleId: examSchedule._id,
                    scheduleTitle: examSchedule.title
                })
            }

            // If not the instructor, check if user is a student with group access
            const studentCourses = await this._service.getCourseByStudentId(userId)
            
            if (!studentCourses || studentCourses.length === 0) {
                return this._response('User is not enrolled in any courses and is not the exam owner', 403, { hasAccess: false })
            }

            // Check each course and its groups for the schedule_id
            for (const course of studentCourses) {
                if (course.groups && course.groups.length > 0) {
                    for (const group of course.groups) {
                        // Check if student is in this group
                        if (group.students && group.students.includes(userId)) {
                            // Check if this group has the exam schedule
                            if (group.schedule_ids && group.schedule_ids.length > 0) {
                                const hasSchedule = group.schedule_ids.includes(scheduleId)
                                
                                if (hasSchedule) {
                                    return this._response('Student has access to this exam', 200, { 
                                        hasAccess: true,
                                        accessType: 'student',
                                        courseId: course._id,
                                        courseName: course.course_name,
                                        groupId: group._id,
                                        groupName: group.group_name
                                    })
                                }
                            }
                        }
                    }
                }
            }

            // If we reach here, user doesn't have access
            return this._response('User does not have access to this exam', 403, { hasAccess: false })
            
        } catch (error: any) {
            console.error('Error validating exam access:', error)
            return this._response(`Error validating access: ${error.message || 'Unknown error'}`, 500, { hasAccess: false })
        }
    }
}
