import { Document } from "mongoose";
import { BaseRepository } from "../../base/base.repository";
import { ICourse } from "../model/interface/icourse";
import { ICourseRepository } from "./interface/icourse.repository";
import { CourseModel } from "../model/course.model";
import { IGroup } from "../model/interface/igroup";
import { ISetting } from "../model/interface/setting";

export class CourseRepository extends BaseRepository<ICourse & Document> implements ICourseRepository {
    constructor() {
        super(CourseModel)
    }

    async getCourseByInstructorId (instructor_id: string) {
        const courses = await this._model.find({ instructor_id }).exec()
        return courses
    }

    async verifyPassword(course_id: string, group_id: string, setting_id: string, password: string) {
        const course = await this._model.findOne({ _id: course_id }).exec() as ICourse & Document
        if (!course) {
            return null
        }
        let result = false
        course.groups?.forEach((group: IGroup) => {
            group.exam_setting.forEach((setting: ISetting) => {
                if (setting._id == setting_id && setting.exam_code == password && group._id == group_id) {
                    result = true
                }
            })
        })
        console.log(result)

        return result
    }

    async getSetting(course_id: string, group_id: string, setting_id: string) {
        const course = await this._model.findOne({ _id: course_id }).exec() as ICourse & Document
        if (!course) {
            return null
        }
        const group = course.groups?.find((group: IGroup) => group._id == group_id)
        if (!group) {
            return null
        }
        const setting = group.exam_setting.find((setting: ISetting) => setting._id == setting_id)
        return setting
    }
}
