import { Elysia } from "elysia"
import { Database } from "./database/database"
import { indexRouter } from "./presentation/routes/index.route"
import { indexMiddleware } from "./presentation/middleware/index.middleware"

const runServer = async () => {
  // pick a connection string
  const mode = process.env.MODE ?? "prod"
  const connection_string =
    mode === "dev" ? process.env.DB_CONN_LOCAL! : process.env.DB_CONN!

  console.log("DB:", connection_string)

  const { db, err } = await new Database().connect(connection_string)
  if (err) {
    console.error(`Error: ${err}`)
    // optionally return or throw here
    // throw err
  } else {
    console.log("Connected to database")
  }

  const app = new Elysia()
    .use(indexMiddleware)
    .use(indexRouter)
    .get("/", () => "Hello Elysia")

  // If you're on Elysia v1+, await listen for readiness
  await app.listen(3000)

  console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
}

// --- pick one of these boot styles ---

// 1) Simple promise style (no IIFE needed)
runServer().catch((e) => {
  console.error("Fatal:", e)
})

// 2) If you really want an IIFE, make sure to start it with a semicolon:
// ;(async () => {
//   await runServer()
// })()
