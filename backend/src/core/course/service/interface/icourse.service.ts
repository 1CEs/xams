import { ICourse } from "../../model/interface/icourse"
import { ISetting } from "../../model/interface/setting"

export interface ICourseService {
    addCourse: (payload: Omit<ICourse, '_id'>) => Promise<ICourse | null>
    getCourses: () => Promise<ICourse[] | null>
    getCourseById: (id: string) => Promise<ICourse | null>
    getCourseByInstructorId: (instructor_id: string) => Promise<ICourse[] | null>
    updateCourse: (id: string, payload: Partial<ICourse>) => Promise<ICourse | null>
    deleteCourse: (id: string) => Promise<ICourse | null>
    verifyPassword: (course_id: string, group_id: string, setting_id: string, password: string) => Promise<Boolean | null>
    getSetting: (course_id: string, group_id: string, setting_id: string) => Promise<ISetting | null | undefined>
}