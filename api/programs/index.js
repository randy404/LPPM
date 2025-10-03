// /api/programs/index.js
import { Redis } from "@upstash/redis";

// ambil ENV baik yang “normal” maupun yang ter-prefix
const KV_URL =
  process.env.KV_REST_API_URL ||
  process.env.KV_REST_API_KV_REST_API_URL;

const KV_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.KV_REST_API_KV_REST_API_TOKEN;

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!KV_URL || !KV_TOKEN) {
  console.error("Missing Upstash ENV. KV_URL=", !!KV_URL, " KV_TOKEN=", !!KV_TOKEN);
}

const redis = new Redis({ url: KV_URL, token: KV_TOKEN });

// kita simpan data di Set index + key per-item:
// index: lppm:index -> [id, id, ...]
// item:  lppm:program:<id> -> JSON string
const INDEX_KEY = "lppm:index";
const ITEM = (id) => `lppm:program:${id}`;

// helper auth admin
function isAdmin(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token && ADMIN_TOKEN && token === ADMIN_TOKEN;
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // ambil semua id dari index, lalu ambil itemnya
      const ids = (await redis.smembers(INDEX_KEY)) || [];
      if (!ids.length) return res.status(200).json([]);
      const items = await Promise.all(ids.map((id) => redis.get(ITEM(id))));
      const parsed = items
        .map((x) => {
          try { return typeof x === "string" ? JSON.parse(x) : x; }
          catch { return null; }
        })
        .filter(Boolean);
      return res.status(200).json(parsed);
    }

    if (req.method === "POST") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
      const body = req.body || {};
      if (!body.id || !body.judul || !body.pi) {
        return res.status(400).json({ error: "id, judul, pi wajib" });
      }
      await redis.set(ITEM(body.id), JSON.stringify(body));
      await redis.sadd(INDEX_KEY, body.id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("API /programs error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
