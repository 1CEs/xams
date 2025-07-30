import { t } from "elysia";
import { passwordRegex } from "../../../utils/regex";

export const SignInSchema = t.Object({
    identifier: t.String({ description: 'Username or email is required' }),
    password: t.String({ pattern: passwordRegex, description: 'Invalid password format' })
})