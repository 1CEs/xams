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

    async getCourseById (id: string) {
        const course = await this._repository.findById(id)
        return course
    }

    async getCourseByInstructorId (instructor_id: string) {
        const courses = await this._repository.getCourseByInstructorId(instructor_id)
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
}