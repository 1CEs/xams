import { ICourse } from "../../../core/course/model/interface/icourse"
import { IInstructor } from "../../../core/user/model/interface/iintructor"

export interface ICourseController {
    // Course-Only methods
    addCourse: (payload: Omit<ICourse, '_id'>, user: IInstructor) => Promise<ControllerResponse<ICourse | null>>
    getCourses: () => Promise<ControllerResponse<ICourse[] | null>>
    getCourseById: (id: string) => Promise<ControllerResponse<ICourse | null>>
    getCourseByInstructorId: (instructor_id: string) => Promise<ControllerResponse<ICourse[] | null>>
    updateCourse: (id: string, payload: Partial<ICourse>) => Promise<ControllerResponse<ICourse | null>>
    deleteCourse: (id: string) => Promise<ControllerResponse<ICourse | null>>

    // Group-Only  methods
    // Setting-Only  methods
}