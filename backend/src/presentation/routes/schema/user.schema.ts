import { t } from "elysia";
import { emailRegex, urlRegex } from "../../../utils/regex";

export const updateUserSchema = t.Object({
    username: t.Optional(t.String({ maxLength: 255 })),
    email: t.Optional(t.String({ pattern: emailRegex, description: 'Invalid email format'})),
    profile_url: t.Optional(t.String({ pattern: urlRegex, description: 'Invalid URL format'})),
    bio: t.Optional(t.String()),
    info: t.Optional(t.Object(
        {
            first_name: t.String(),
            last_name: t.String(),
            birth: t.Date()
        }
    ))
})