import { Application, Router } from "@oak/mod.ts";

const app = new Application();
const router = new Router();
const port = Number(Deno.env.get("PORT")) ?? 8080;

app.use(router.routes());
app.use(router.allowedMethods());

console.log(`Server running on http://localhost:${port}`);
await app.listen({ port: port });
