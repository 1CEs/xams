import { Elysia } from "elysia"
import { Database } from "./database/database"
import { indexRouter } from "./presentation/routes/index.route"
import { indexMiddleware } from "./presentation/middleware/index.middleware"

const runServer = async () => {
  let connection_string = ''
  if(process.env.MODE! === 'dev') {
    connection_string = process.env.DB_CONN_LOCAL!
  } else {
    connection_string = process.env.DB_CONN!
  }
  console.log(connection_string)
  const { db, err } = await new Database().connect(connection_string)

  if(err != null) {
    console.log(`Error: ${err}`)
  }
  
  console.log('Connected to database')

  const app = new Elysia()
    .use(indexMiddleware)
    .use(indexRouter)
    .get("/", () => "Hello Elysia")
    .listen(3000)
  

  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  )
}

(async () => await runServer())()

