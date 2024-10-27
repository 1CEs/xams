import { Elysia } from "elysia";
import './database/db'
import { indexRouter } from "./presentation/routes/index.route";
import cors from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())
  .use(indexRouter)
  .get("/", () => "Hello Elysia")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
