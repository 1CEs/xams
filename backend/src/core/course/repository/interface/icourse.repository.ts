import { IBaseRepository } from "../../../base/interface/ibase.repository";
import { ICourse } from "../../model/interface/icourse";
import { ISetting } from "../../model/interface/setting";

export interface ICourseRepository extends IBaseRepository<any> {
    // Implement course logic here.
    getCourseByInstructorId: (instructor_id: string) => Promise<ICourse[] | null>
    verifyPassword: (course_id: string, group_id: string, setting_id: string, password: string) => Promise<Boolean | null>

    // Implement setting logic here.
    getSetting: (course_id: string, group_id: string, setting_id: string) => Promise<ISetting | null | undefined>
} 