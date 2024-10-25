import { t } from "elysia"
import { emailRegex, passwordRegex } from "../../validators/regex"

export const SignUpSchema = t.Object({
    username: t.String(),
    email: t.String({ pattern: emailRegex }),
    password: t.String({ pattern: passwordRegex }),
    info: t.Object({
        first_name: t.String(),
        last_name: t.String(),
        birth: t.Date()
    }),
    role: t.String(),
    profile_url: t.String(),
})

export const SignInSchema = t.Object({
    identifier: t.String(),
    password: t.String({ pattern: passwordRegex })
})