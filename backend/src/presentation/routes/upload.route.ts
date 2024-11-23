import Elysia, { t } from "elysia";
import { tokenVerifier } from "../middleware/token-verify.middleware";
import { AikenUploadSchema } from "./schema/upload.schema";

const UploadRoute = new Elysia({ prefix: '/upload' })
    .use(tokenVerifier)
    .group('', (app) =>
        app.post('/aiken', ({user, body: { file }}) => {}, {
            body: AikenUploadSchema
        })
    )