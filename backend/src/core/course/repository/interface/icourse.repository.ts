import { IBaseRepository } from "../../../base/interface/ibase.repository";
import { ICourse } from "../../model/interface/icourse";

export interface ICourseRepository extends IBaseRepository<ICourse> {
    // Implement course logic here.

    getCourseByInstructorId: (instructor_id: string) => Promise<ICourse[] | null>
} 