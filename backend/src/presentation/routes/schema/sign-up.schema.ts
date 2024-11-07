import { t } from "elysia";
import { emailRegex, passwordRegex, urlRegex } from "../../../utils/regex"

export const SignUpSchema = t.Object({
    username: t.String({ maxLength: 255, description: 'Username is required' }),
    email: t.RegExp(emailRegex, { description: 'Email is required' }),
    password: t.RegExp(passwordRegex, { description: 'Password is required' }),
    profile_url: t.RegExp(urlRegex, { description: 'Profile URL is required' }),
    bio: t.String({ default: 'Not set yet' }),
    role: t.Union([
        t.Literal('student'),
        t.Literal('instructor'),
        t.Literal('admin'),
        t.Literal('general')
    ], { description: 'Role is required' }),
    info: t.Object({
        first_name: t.String({ description: 'First name is required' }),
        last_name: t.String({ description: 'Last Name is required' }),
        birth: t.Date({ description: 'Birth date is required' })
    })
})