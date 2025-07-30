import { t } from "elysia";
import { emailRegex, hexRegex, urlRegex } from "../../../utils/regex";

export const updateUserSchema = t.Object({
    username: t.Optional(t.String({ maxLength: 255 })),
    email: t.Optional(t.String({ pattern: emailRegex, description: 'Invalid email format'})),
    profile_url: t.Optional(t.String({ pattern: urlRegex, description: 'Invalid URL format'})),
    bio: t.Optional(t.String()),
    info: t.Optional(t.Object(
        {
            first_name: t.String(),
            last_name: t.String()
        }
    ))
})

export const updateCategorySchema = t.Object({
    name: t.String({ description: 'Category name is required'}),
    color: t.String({ pattern: hexRegex, description: 'Color is required'})
})