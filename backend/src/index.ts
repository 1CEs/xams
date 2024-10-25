import { Elysia } from "elysia";
import './database/db'
import { indexRouter } from "./presentation/routes/index.route";

const app = new Elysia()
  .use(indexRouter)
  .get("/", () => "Hello Elysia")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
