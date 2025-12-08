import { Context, Hono } from "hono";

const app = new Hono();
const port = Number(Deno.env.get("PORT")) || 8000;

app.get("/", (c: Context) => {
  return c.text(`Hello Hono from port ${port}!`);
});

Deno.serve({ port: port }, app.fetch);
