import { Document } from "mongoose"
import { IExamination } from "../core/examination/model/interface/iexamination"
import { IQuestion } from "../core/examination/model/interface/iquestion"

declare type QuestionType = 'mc' | 'tf' | 'ses' | 'les' | 'nested'
declare type Choice = {
    content: string
}

declare type ExaminationDocument = IExamination & Document
declare type QuestionDocument = IQuestion & Document