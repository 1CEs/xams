import { Document } from "mongoose";
import { BaseRepository } from "../../base/base.repository";
import { ICourse } from "../model/interface/icourse";
import { ICourseRepository } from "./interface/icourse.repository";
import { CourseModel } from "../model/course.model";
import { IGroup } from "../model/interface/igroup";
import { ExaminationScheduleModel } from "../../examination/model/examination-schedule.model";
import { UserModel } from "../../user/model/user.model";

export class CourseRepository extends BaseRepository<ICourse & Document> implements ICourseRepository {
    constructor() {
        super(CourseModel)
    }

    async getCourseByStudentId (student_id: string) {
        const courses = await this._model.find({"groups.students": student_id}).exec()
        return courses
    }

    async getCourseByInstructorId (instructor_id: string) {
        console.log(instructor_id)
        const courses = await this._model.find({instructor_id}).exec()
        return courses
    }

    async verifyPassword(course_id: string, group_id: string, setting_id: string, password: string) {
        const course = await this._model.findOne({ _id: course_id }).exec() as ICourse & Document
        if (!course) {
            return null
        }
        
        // Find the setting in the course
        const group = course.groups?.find((group: IGroup) => group._id == group_id)
        if (!group) {
            return null
        }
        
        // Find the schedule ID directly from the schedule_ids array
        const scheduleId = group.schedule_ids.find((id: string) => id === setting_id)
        if (!scheduleId) {
            return null
        }
        
        // Get the exam schedule using the schedule_id
        const examSchedule = await ExaminationScheduleModel.findById(scheduleId).exec()
        if (!examSchedule) {
            return null
        }
        
        // Check if the password matches the exam_code in the schedule
        const result = examSchedule.exam_code === password
        console.log('Password verification result:', result)
        
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
        
        // Find the schedule ID directly from the schedule_ids array
        const scheduleId = group.schedule_ids.find((id: string) => id === setting_id)
        if (!scheduleId) {
            return null
        }
        
        // Get the exam schedule using the schedule_id and return it
        const examSchedule = await ExaminationScheduleModel.findById(scheduleId).exec()
        return examSchedule
    }

    async searchCourses(search: string) {
        const searchLower = search.toLowerCase()
        
        // Use aggregation pipeline to join with users collection and search
        const courses = await this._model.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'instructor_id',
                    foreignField: '_id',
                    as: 'instructor'
                }
            },
            {
                $unwind: '$instructor'
            },
            {
                $match: {
                    $or: [
                        { course_name: { $regex: searchLower, $options: 'i' } },
                        { description: { $regex: searchLower, $options: 'i' } },
                        { 'instructor.info.first_name': { $regex: searchLower, $options: 'i' } },
                        { 'instructor.info.last_name': { $regex: searchLower, $options: 'i' } },
                        { 'instructor.username': { $regex: searchLower, $options: 'i' } }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    instructor_id: 1,
                    background_src: 1,
                    course_name: 1,
                    description: 1,
                    category: 1,
                    groups: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]).exec()
        
        return courses
    }
}
