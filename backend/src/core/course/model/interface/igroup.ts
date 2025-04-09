import { ISetting } from "./setting";

export interface IGroup {
    _id?: string
    group_name: string
    join_code: string
    students: string[]
    exam_setting: ISetting[]
}