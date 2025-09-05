import { t } from "elysia"
import { emailRegex, passwordRegex, urlRegex } from "../../../utils/regex"

export const SignUpSchema = t.Object({
    username: t.String({ maxLength: 255, description: 'Username is required and must be less than 255 characters' }),
    email: t.String({ pattern: emailRegex, description: 'Please enter a valid email address' }),
    password: t.String({ pattern: passwordRegex, description: 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)' }),
    profile_url: t.String({ pattern: urlRegex, description: 'Profile URL must be a valid URL' }),
    bio: t.String({ default: 'Not set yet' }),
    status: t.Optional(t.Object({
        is_banned: t.Boolean({ description: 'Whether the user is banned' }),
        ban_until: t.Optional(t.Date({ description: 'Ban expiration date' })),
        ban_reason: t.Optional(t.String({ description: 'Reason for the ban' }))
    })),
    role: t.Union([
        t.Literal('student'),
        t.Literal('instructor'),
        t.Literal('admin'),
        t.Literal('general')
    ], { description: 'Please select a valid role' }),
    info: t.Object({
        first_name: t.String({ description: 'First name is required' }),
        last_name: t.String({ description: 'Last name is required' })
    })
})
