import Elysia, { t } from "elysia";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { AikenUploadSchema } from "./schema/upload.schema";
import { UploadController } from "../controllers/upload.controller";
import { catchAsync } from "../../utils/error";
import { Static } from "@sinclair/typebox";
import { Context } from "elysia";

type UploadContext = Context & {
    controller: UploadController;
    user: any;
}

type AikenUploadBody = Static<typeof AikenUploadSchema>

export const UploadRoute = new Elysia({ prefix: '/upload' })
    .use(tokenVerifier)
    .derive(() => { return { controller: new UploadController() }})
    .group('', (app) =>
        app.post('/aiken', catchAsync(async ({user, body: { file }, controller}: UploadContext & { body: AikenUploadBody }) => await controller.readAikenFormat(user, file)), {
            body: AikenUploadSchema
        })
    )