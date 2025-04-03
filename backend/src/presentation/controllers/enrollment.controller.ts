import { CourseService } from "../../core/course/service/course.service";
import { ICourseService } from "../../core/course/service/interface/icourse.service";
import { IEnrollmentController } from "./interface/ienrollment.controller";

export class EnrollmentController implements IEnrollmentController {
    private _courseService: ICourseService;

    constructor() {
        this._courseService = new CourseService();
    }

    private _response<T>(message: string, code: number, data: T) {
        return {
            message,
            code,
            data
        };
    }

    async enrollStudent(courseId: string, groupName: string, studentId: string) {
        try {
            // Get the course
            const course = await this._courseService.getCourseById(courseId);
            
            if (!course) {
                return this._response('Course not found', 404, null);
            }

            // Check if groups exist
            if (!course.groups || !Array.isArray(course.groups)) {
                return this._response('Course has no groups', 404, null);
            }

            // Find the group
            const groupIndex = course.groups.findIndex(group => 
                group.group_name === groupName
            );

            if (groupIndex === -1) {
                return this._response('Group not found', 404, null);
            }

            // Check if student is already enrolled
            if (course.groups[groupIndex].students.includes(studentId)) {
                return this._response('Student already enrolled in this group', 400, null);
            }

            // Add student to the group
            course.groups[groupIndex].students.push(studentId);

            // Update the course with the modified groups array
            const updated = await this._courseService.updateCourse(courseId, { groups: course.groups });
            
            return this._response('Student enrolled successfully', 200, updated);
        } catch (error) {
            console.error('Error enrolling student:', error);
            return this._response('Error enrolling student', 500, null);
        }
    }

    async unenrollStudent(courseId: string, groupName: string, studentId: string) {
        try {
            // Get the course
            const course = await this._courseService.getCourseById(courseId);
            
            if (!course) {
                return this._response('Course not found', 404, null);
            }

            // Check if groups exist
            if (!course.groups || !Array.isArray(course.groups)) {
                return this._response('Course has no groups', 404, null);
            }

            // Find the group
            const groupIndex = course.groups.findIndex(group => 
                group.group_name === groupName
            );

            if (groupIndex === -1) {
                return this._response('Group not found', 404, null);
            }

            // Check if student is enrolled
            const studentIndex = course.groups[groupIndex].students.indexOf(studentId);
            if (studentIndex === -1) {
                return this._response('Student not enrolled in this group', 400, null);
            }

            // Remove student from the group
            course.groups[groupIndex].students.splice(studentIndex, 1);

            // Update the course with the modified groups array
            const updated = await this._courseService.updateCourse(courseId, { groups: course.groups });
            
            return this._response('Student unenrolled successfully', 200, updated);
        } catch (error) {
            console.error('Error unenrolling student:', error);
            return this._response('Error unenrolling student', 500, null);
        }
    }

    async getStudentEnrollments(studentId: string) {
        try {
            // Get all courses
            const courses = await this._courseService.getCourses();
            
            if (!courses || !Array.isArray(courses)) {
                return this._response('No courses found', 404, []);
            }
            
            // Filter courses where student is enrolled in any group
            const enrolledCourses = courses.map(course => {
                // Skip courses without groups
                if (!course.groups || !Array.isArray(course.groups)) {
                    return null;
                }
                
                // Find groups where student is enrolled
                const enrolledGroups = course.groups.filter(group => 
                    group.students.includes(studentId)
                );
                
                // If student is enrolled in any group, return course with only those groups
                if (enrolledGroups.length > 0) {
                    return {
                        ...course,
                        groups: enrolledGroups
                    };
                }
                
                // If student is not enrolled in any group, return null
                return null;
            }).filter(course => course !== null);
            
            return this._response('Student enrollments retrieved successfully', 200, enrolledCourses);
        } catch (error) {
            console.error('Error getting student enrollments:', error);
            return this._response('Error getting student enrollments', 500, null);
        }
    }

    async getGroupEnrollments(courseId: string, groupName: string) {
        try {
            // Get the course
            const course = await this._courseService.getCourseById(courseId);
            
            if (!course) {
                return this._response('Course not found', 404, null);
            }

            // Check if groups exist
            if (!course.groups || !Array.isArray(course.groups)) {
                return this._response('Course has no groups', 404, null);
            }

            // Find the group
            const group = course.groups.find(group => 
                group.group_name === groupName
            );

            if (!group) {
                return this._response('Group not found', 404, null);
            }

            return this._response('Group enrollments retrieved successfully', 200, {
                course: {
                    _id: course._id,
                    course_name: course.course_name
                },
                group: {
                    group_name: group.group_name,
                    students: group.students
                }
            });
        } catch (error) {
            console.error('Error getting group enrollments:', error);
            return this._response('Error getting group enrollments', 500, null);
        }
    }
}
