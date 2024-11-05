import { Elysia } from "elysia";
import { Database } from "./database/database";

const runServer = async () => {
  const { db, err } = await new Database().connect(process.env.DB_CONN!)

  if(err != null) {
    console.log(`Error: ${err}`)
  }
  
  console.log('Connected to database')
  const app = new Elysia().get("/", () => "Hello Elysia").listen(3000)
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  )
}

(async () => await runServer())()

