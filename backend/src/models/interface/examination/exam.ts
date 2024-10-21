import { ObjectId } from "mongoose";
import { QuestionType } from "../../../enums/question-type";

export interface IExamination {
    _id:                ObjectId
    instructor_id:      ObjectId
    title:              string
    description:        string
    questions:{
        _id:                ObjectId
        question_type:      QuestionType
        content:            string
        choices:            string[]
        correct_ans:        string
        hint:               string
        manual_grading:     boolean
    }[]
}