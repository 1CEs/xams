import { t } from "elysia"

export const SignUpSchema = t.Object({
    username: t.String(),
    email: t.String(),
    password: t.String(),
    info: t.Object({
        first_name: t.String(),
        last_name: t.String(),
        birth: t.Date()
    }),
    role: t.String(),
    bio: t.String().default(''),
    profile_url: t.String(),
})