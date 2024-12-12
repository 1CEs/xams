import { ICourse } from "../../core/course/model/interface/icourse";
import { CourseService } from "../../core/course/service/course.service";
import { ICourseService } from "../../core/course/service/interface/icourse.service";
import { IInstructor } from "../../core/user/model/interface/iintructor";
import { InstructorService } from "../../core/user/service/instructor.service";
import { UserServiceFactory } from "../../core/user/service/user.factory";
import { ICourseController } from "./interface/icourse.controller";

export class CourseController implements ICourseController {
    private _service: ICourseService

    constructor() {
        this._service = new CourseService()
    }

    private _response<T>(message: string, code: number, data: T) {
        return {
            message,
            code,
            data
        }
    }

    // Course-Only methods
    async addCourse(payload: Omit<ICourse, "_id" | "questions">, user: IInstructor) {
        console.log(user)
        const course = await this._service.addCourse(payload)
        const service = new UserServiceFactory().createService(user.role)

        const update = (service as InstructorService).updateCourse(user._id as unknown as string, course?._id as unknown as string)

        return this._response<typeof course>('Create Course Successfully', 200, course)
    }

    async getCourses() {
        const courses = await this._service.getCourses()
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
}