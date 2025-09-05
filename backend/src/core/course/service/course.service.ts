import { ICourse } from "../model/interface/icourse";
import { CourseRepository } from "../repository/course.repository";
import { ICourseRepository } from "../repository/interface/icourse.repository";
import { ICourseService } from "./interface/icourse.service";

export class CourseService implements ICourseService {
    private _repository: ICourseRepository

    constructor() {
        this._repository = new CourseRepository
    }

    async addCourse (payload: Omit<ICourse, "_id">) {
        const result = await this._repository.save(payload)
        return result
    }

    async getCourses () {
        const courses = await this._repository.find()
        return courses 
    }

    async searchCourses (search: string) {
        const courses = await this._repository.searchCourses(search)
        return courses
    }

    async getCourseById (id: string) {
        const course = await this._repository.findById(id)
        return course
    }

    async getCourseByInstructorId (instructor_id: string) {
        const courses = await this._repository.getCourseByInstructorId(instructor_id)
        return courses
    }

    async getCourseByStudentId (student_id: string) {
        const courses = await this._repository.getCourseByStudentId(student_id)
        return courses
    }

    async updateCourse (id: string, payload: Partial<ICourse>) {
        const updated = await this._repository.update(id, payload)
        return updated
    }

    async deleteCourse (id: string) {
        const deleted = await this._repository.delete(id)
        return deleted
    }

    async verifyPassword(course_id: string, group_id: string, setting_id: string, password: string) {
        const result = await this._repository.verifyPassword(course_id, group_id, setting_id, password)
        return result
    }

    async getSetting(course_id: string, group_id: string, setting_id: string) {
        const result = await this._repository.getSetting(course_id, group_id, setting_id)
        return result
    }
}