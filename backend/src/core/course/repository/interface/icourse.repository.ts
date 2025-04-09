import { IBaseRepository } from "../../../base/interface/ibase.repository";
import { ICourse } from "../../model/interface/icourse";

export interface ICourseRepository extends IBaseRepository<any> {
    // Implement course logic here.

    getCourseByInstructorId: (instructor_id: string) => Promise<ICourse[] | null>
} 