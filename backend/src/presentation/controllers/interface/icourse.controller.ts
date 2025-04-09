import { ICourse } from "../../../core/course/model/interface/icourse"
import { IGroup } from "../../../core/course/model/interface/igroup"
import { ISetting } from "../../../core/course/model/interface/setting"
import { IInstructor } from "../../../core/user/model/interface/iintructor"

export interface ICourseController {
    // Course-Only methods
    addCourse: (payload: Omit<ICourse, '_id'>, user: IInstructor) => Promise<ControllerResponse<ICourse | null>>
    getCourses: () => Promise<ControllerResponse<ICourse[] | null>>
    getCourseById: (id: string) => Promise<ControllerResponse<ICourse | null>>
    getCourseByInstructorId: (instructor_id: string) => Promise<ControllerResponse<ICourse[] | null>>
    updateCourse: (id: string, payload: Partial<ICourse>) => Promise<ControllerResponse<ICourse | null>>
    deleteCourse: (id: string) => Promise<ControllerResponse<ICourse | null>>
    verifyPassword: (course_id: string, group_id: string, setting_id: string, password: string) => Promise<ControllerResponse<Boolean | null>>

    // Group-Only methods
    addGroup: (courseId: string, groupData: Omit<IGroup, "_id">) => Promise<ControllerResponse<ICourse | null>>
    deleteGroup: (courseId: string, groupName: string) => Promise<ControllerResponse<ICourse | null>>
    
    // Setting-Only methods
    addGroupExamSetting: (courseId: string, groupName: string, examSetting: ISetting) => Promise<ControllerResponse<ICourse | null>>
    deleteGroupExamSetting: (courseId: string, groupName: string, examSettingIndex: number) => Promise<ControllerResponse<ICourse | null>>
}
