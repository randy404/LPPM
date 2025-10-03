// /api/programs/[id].js
import { Redis } from "@upstash/redis";

const KV_URL =
  process.env.KV_REST_API_URL ||
  process.env.KV_REST_API_KV_REST_API_URL;

const KV_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.KV_REST_API_KV_REST_API_TOKEN;

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const redis = new Redis({ url: KV_URL, token: KV_TOKEN });
const INDEX_KEY = "lppm:index";
const ITEM = (id) => `lppm:program:${id}`;

function isAdmin(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token && ADMIN_TOKEN && token === ADMIN_TOKEN;
}

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (req.method === "DELETE") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
      await redis.del(ITEM(id));
      await redis.srem(INDEX_KEY, id);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("API /programs/[id] error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
