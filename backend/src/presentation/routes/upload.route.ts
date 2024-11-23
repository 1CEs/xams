import Elysia, { t } from "elysia";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { AikenUploadSchema } from "./schema/upload.schema";
import { UploadController } from "../controllers/upload.controller";

export const UploadRoute = new Elysia({ prefix: '/upload' })
    .use(tokenVerifier)
    .derive(() => { return { controller: new UploadController() }})
    .group('', (app) =>
        app.post('/aiken', async ({user, body: { file }, controller}) => await controller.readAikenFormat(user, file), {
            body: AikenUploadSchema
        })
    )