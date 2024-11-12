import mongoose from "mongoose";
import { ExaminationDocument } from "../../../types/exam";
import { QuestionSchema } from "./question.model";

const { Schema, model } = mongoose

export const ExaminationSchema = new Schema<ExaminationDocument>({
    instructor_id: {
        type: Schema.Types.String,
        required: true
    },
    title: {
        type: Schema.Types.String,
        required: true
    },
    description: { type: Schema.Types.String },
    questions: { type: [QuestionSchema] }

})