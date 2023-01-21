// @ts-check
import * as dotenv from "dotenv";
import Surreal from "surrealdb.js";
dotenv.config();

try {
  console.log("Connecting to", process.env.DB_URL);
  const db = new Surreal(process.env.DB_URL);

  console.log("Signing in", process.env.DB_USER);
  // @ts-ignore
  await db.signin({
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
  });

  console.log("Setting NS/DB");
  await db.use("web", "web");

  console.log("Creates host");
  let created = await db.create("host:mikael_brevik", {
    slug: "mikael_brevik",
    name: "Mikael Brevik",
    avatar:
      "https://www.variant.no/_next/image?url=https%3A%2F%2Fvariantno.blob.core.windows.net%2Femployees%2F-39c27de9.png&w=640&q=75",
    externalUrl: "https://mib.im",
    description: "Mikael",
    // favouriteBook: {
    //   coverUrl: "",
    //   title: "",
    //   description: "",
    //   why: "",
    // },
  });

  console.log(created);
} catch (e) {
  console.log(e);
}
