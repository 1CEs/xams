import { ICourse } from "../../model/interface/icourse"

export interface ICourseService {
    addCourse: (payload: Omit<ICourse, '_id'>) => Promise<ICourse | null>
    getCourses: () => Promise<ICourse[] | null>
    getCourseById: (id: string) => Promise<ICourse | null>
    getCourseByInstructorId: (instructor_id: string) => Promise<ICourse[] | null>
    updateCourse: (id: string, payload: Partial<ICourse>) => Promise<ICourse | null>
    deleteCourse: (id: string) => Promise<ICourse | null>
}