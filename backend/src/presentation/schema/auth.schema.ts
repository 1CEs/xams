import { t } from "elysia"
import { emailRegex, passwordRegex } from "../validators/regex"

export const SignUpSchema = t.Object({
    username: t.String(),
    email: t.RegExp(emailRegex, { description: 'Invalid email address.' }),
    password: t.RegExp(passwordRegex, { description: 'Password must be at least 8 characters, with 1 uppercase letter, 1 number, and 1 special character.' }),
    info: t.Object({
        first_name: t.String(),
        last_name: t.String(),
        birth: t.Date({ description: 'Please enter your birth date.' })
    }),
    role: t.String(),
    profile_url: t.String({ default: 'url' }),
    bio: t.String({ default: "N/A" })
})

export const SignInSchema = t.Object({
    identifier: t.String(),
    password: t.RegExp(passwordRegex, { description: 'Invalid email address.' })
})