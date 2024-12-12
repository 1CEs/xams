import { t } from "elysia";
import { urlRegex } from "../../../utils/regex";

export const AddCourseSchema = t.Object({
    course_name: t.String({ description: 'Title is required' }),
    background_src: t.String({ pattern: urlRegex, description: 'Profile URL is required' }),
    description: t.String({ description: 'Description is required' }),
})

export const updateCourseSchema = t.Object({
    course_name: t.String({ description: 'Title is required' }),
    background_src: t.String({ pattern: urlRegex, description: 'Profile URL is required' }),
    description: t.String({ description: 'Description is required' }),
})