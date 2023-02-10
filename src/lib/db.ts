import Surreal from "surrealdb.js";

const db = new Surreal(import.meta.env.DB_URL);

await db.signin({
  user: import.meta.env.DB_USER!,
  pass: import.meta.env.DB_PASS!,
});

await db.use("web", "web");

export default db;
