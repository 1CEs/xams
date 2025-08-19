import { t } from "elysia";

export const SignInSchema = t.Object({
    identifier: t.String({ description: 'Username or email is required' }),
    password: t.String({ description: 'Password is required' })
})