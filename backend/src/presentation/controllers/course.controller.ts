import { ICourse } from "../../core/course/model/interface/icourse";
import { IGroup } from "../../core/course/model/interface/igroup";
import { ISetting } from "../../core/course/model/interface/setting";
import { CourseService } from "../../core/course/service/course.service";
import { ICourseService } from "../../core/course/service/interface/icourse.service";
import { ExaminationScheduleService } from "../../core/examination/service/exam-schedule.service";
import { IExaminationScheduleService } from "../../core/examination/service/interface/iexam-schedule.service";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { InstructorService } from "../../core/user/service/instructor.service";
import { StudentService } from "../../core/user/service/student.service";
import { UserServiceFactory } from "../../core/user/service/user.factory";
import { UserRole } from "../../types/user";
import { ICourseController } from "./interface/icourse.controller";

export class CourseController implements ICourseController {
    private _service: ICourseService
    private _examScheduleService: IExaminationScheduleService

    constructor() {
        this._service = new CourseService()
        this._examScheduleService = new ExaminationScheduleService()
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
        const courses = await this._service.getCourses()
        
        // Handle case where courses might be null
        if (!courses) {
            return this._response<[]>('No courses found', 200, [])
        }
        
        // If search parameter is provided, filter courses by name
        if (search && search.trim() !== '') {
            const searchLower = search.toLowerCase()
            const filteredCourses = courses.filter(course => 
                course.course_name.toLowerCase().includes(searchLower) ||
                course.description!.toLowerCase().includes(searchLower)
            )
            return this._response<typeof filteredCourses>('Done', 200, filteredCourses)
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
        if (groupToDelete.exam_setting && groupToDelete.exam_setting.length > 0) {
            for (const examSetting of groupToDelete.exam_setting) {
                try {
                    if (examSetting.schedule_id) {
                        await this._examScheduleService.deleteExaminationSchedule(examSetting.schedule_id)
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

        // Initialize exam_setting array if it doesn't exist
        if (!course.groups[groupIndex].exam_setting) {
            course.groups[groupIndex].exam_setting = []
        }

        try {
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
                    randomize_choice: examSettingData.randomize_choice
                },
                examSettingData.selected_questions // Pass the selected questions from frontend
            );

            if (!examSchedule) {
                return this._response('Failed to create examination schedule', 500, null);
            }

            // Create a simplified setting that only stores the schedule_id
            const setting: ISetting = {
                schedule_id: examSchedule._id?.toString() || ''
            };

            // Add the simplified setting to the group
            course.groups[groupIndex].exam_setting.push(setting);
            
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

        // Check if the group has exam settings
        if (!course.groups[groupIndex].exam_setting || course.groups[groupIndex].exam_setting.length === 0) {
            return this._response('No exam settings found for this group', 404, null)
        }

        // Check if the exam setting index is valid
        if (examSettingIndex < 0 || examSettingIndex >= course.groups[groupIndex].exam_setting.length) {
            return this._response('Invalid exam setting index', 404, null)
        }

        // Get the exam setting to be deleted to retrieve the schedule_id
        const examSettingToDelete = course.groups[groupIndex].exam_setting[examSettingIndex]
        
        try {
            // Delete the examination schedule from the database if it has a schedule_id
            if (examSettingToDelete.schedule_id) {
                await this._examScheduleService.deleteExaminationSchedule(examSettingToDelete.schedule_id)
            }
        } catch (error: any) {
            console.error('Error deleting examination schedule:', error)
            // Continue with deleting the exam setting even if schedule deletion fails
            // This prevents orphaned exam settings in case the schedule was already deleted
        }

        // Remove the exam setting from the array
        course.groups[groupIndex].exam_setting.splice(examSettingIndex, 1)
        
        // Update the course with the modified groups array
        const updated = await this._service.updateCourse(courseId, { groups: course.groups })
        
        return this._response('Exam setting deleted successfully', 200, updated)
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
                            if (group.exam_setting && group.exam_setting.length > 0) {
                                const hasSchedule = group.exam_setting.some(setting => 
                                    setting.schedule_id === scheduleId
                                )
                                
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
