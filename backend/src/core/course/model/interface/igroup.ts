import { ISetting } from "./setting";

export interface IGroup {
    group_name: string
    join_code: string
    students: string[]
    exam_setting: ISetting[]
}