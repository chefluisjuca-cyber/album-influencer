import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { completedAlbums } from "../../db/schema.js";
import { sql } from "drizzle-orm";

export default async (req: Request) => {
  if (req.method === "GET") {
    const result = await db.select({ count: sql<number>`count(*)` }).from(completedAlbums);
    return Response.json({ count: Number(result[0].count) });
  }

  if (req.method === "POST") {
    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    await db
      .insert(completedAlbums)
      .values({ userId })
      .onConflictDoNothing();

    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/completed-albums",
};
