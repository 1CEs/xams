import { t } from "elysia";

export const CreateBankSchema = t.Object({
    bank_name: t.String(),
    exam_id: t.Optional(t.Union([
        t.String(),
        t.Array(t.String())
    ]))
});

export const UpdateBankSchema = t.Object({
    bank_name: t.Optional(t.String()),
    exam_id: t.Optional(t.Union([
        t.String(),
        t.Array(t.String())
    ]))
});

export const CreateSubBankSchema = t.Object({
    name: t.String(),
    exam_ids: t.Optional(t.Union([
        t.String(),
        t.Array(t.String())
    ])),
    parent_id: t.Optional(t.String())
});
