export interface IEnrollmentController {
    /**
     * Enrolls a student in a course group
     * @param courseId The ID of the course
     * @param groupName The name of the group to enroll in
     * @param studentId The ID of the student to enroll
     */
    enrollStudent(courseId: string, groupName: string, studentId: string): Promise<any>;

    /**
     * Un-enrolls a student from a course group
     * @param courseId The ID of the course
     * @param groupName The name of the group to un-enroll from
     * @param studentId The ID of the student to un-enroll
     */
    unenrollStudent(courseId: string, groupName: string, studentId: string): Promise<any>;

    /**
     * Gets all groups a student is enrolled in
     * @param studentId The ID of the student
     */
    getStudentEnrollments(studentId: string): Promise<any>;

    /**
     * Gets all students enrolled in a specific group
     * @param courseId The ID of the course
     * @param groupName The name of the group
     */
    getGroupEnrollments(courseId: string, groupName: string): Promise<any>;
}
