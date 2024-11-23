import { IExamination } from "../../../core/examination/model/interface/iexamination";
import { IInstructor } from "../../../core/user/model/interface/iintructor";
import { IStudent } from "../../../core/user/model/interface/istudent";
import { IUser } from "../../../core/user/model/interface/iuser";

export interface IUploadController {
    readAikenFormat: (user:IUser | IStudent | IInstructor, file:File) => Promise<ControllerResponse<IExamination['questions']>>
}