import { Document } from "mongoose";
import { BaseRepository } from "../../base/base.repository";
import { ICourse } from "../model/interface/icourse";
import { ICourseRepository } from "./interface/icourse.repository";
import { CourseModel } from "../model/course.model";

export class CourseRepository extends BaseRepository<ICourse & Document> implements ICourseRepository {
    constructor() {
        super(CourseModel)
    }

    async getCourseByInstructorId (instructor_id: string) {
        const courses = await this._model.find({ instructor_id }).exec()
        return courses
    }
}