import { t } from "elysia";

export const CategoryBodySchema = t.Object({
    name: t.String({ maxLength: 255 }),
    color: t.String({ pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", description: 'Invalid hex color code.'})
})