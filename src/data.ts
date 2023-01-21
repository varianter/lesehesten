import Surreal from "surrealdb.js";

export type Host = {
  slug: string;
  name: string;
  avatar: string;
  externalUrl: string;
  description: string;
  favouriteBook: {
    coverUrl: string;
    title: string;
    description: string;
    why: string;
  };
};

export type Opinion = {
  rating: number;
  recommend: boolean;
  quote: string;
  hostId: string;
};

export type Book = {
  coverUrl: string;
  title: string;
  description: string;
  link: string;
  expectations: [{ hostId: string; expectation: string }];
  opinions: Opinion[];
};

export type Season = Book[];

// Connect db
// Guess it is fine to just have this here as
// data.ts will be a singleton and this is used
// only for creating SSG site.
console.log(`Connecting to ${import.meta.env.DB_URL}`);
const db = new Surreal(import.meta.env.DB_URL);
await db.signin({
  user: import.meta.env.DB_USER!,
  pass: import.meta.env.DB_PASS!,
});
await db.use("web", "web");

export function getHosts() {
  return db.select<Host>("host");
}
export async function getHost(slug: string) {
  return (await db.select<Host>(`host:${slug}`))[0]; // yes this is dumb, todotodotodo
}
