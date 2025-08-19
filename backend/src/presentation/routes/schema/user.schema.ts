import { t } from "elysia";
import { emailRegex, hexRegex, urlRegex } from "../../../utils/regex";

export const updateUserSchema = t.Object({
    username: t.Optional(t.String({ maxLength: 255 })),
    email: t.Optional(t.String({ pattern: emailRegex, description: 'Invalid email format'})),
    password: t.Optional(t.String({ 
        minLength: 8, 
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
        description: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
    })),
    role: t.Optional(t.Union([t.Literal('admin'), t.Literal('instructor'), t.Literal('student')], { description: 'User role' })),
    profile_url: t.Optional(t.String({ pattern: urlRegex, description: 'Invalid URL format'})),
    bio: t.Optional(t.String()),
    status: t.Optional(t.Object({
        is_banned: t.Boolean({ description: 'Whether the user is banned' }),
        ban_until: t.Optional(t.Date({ description: 'Ban expiration date' })),
        ban_reason: t.Optional(t.String({ description: 'Reason for the ban' }))
    })),
    info: t.Optional(t.Object(
        {
            first_name: t.String(),
            last_name: t.String()
        }
    ))
})

export const banUserSchema = t.Object({
    is_banned: t.Boolean({ description: 'Whether to suspend or unsuspend the user' }),
    ban_until: t.Optional(t.Date({ description: 'Suspension expiration date (required if suspending)' })),
    ban_reason: t.Optional(t.String({ description: 'Reason for the suspension' }))
})

export const updateCategorySchema = t.Object({
    name: t.String({ description: 'Category name is required'}),
    color: t.String({ pattern: hexRegex, description: 'Color is required'})
})