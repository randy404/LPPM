// File: api/programs/index.js
// Runtime: Node.js (Serverless Function)


const KEY = 'programs';


async function kvGet() {
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
return null; // KV belum dikonfigurasi
}
const url = `${process.env.KV_REST_API_URL}/get/${KEY}`;
const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } });
if (!r.ok) return [];
const json = await r.json();
try { return JSON.parse(json.result || '[]'); } catch { return []; }
}


async function kvSet(arr) {
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
return false;
}
const url = `${process.env.KV_REST_API_URL}/set/${KEY}`;
const r = await fetch(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
body: JSON.stringify({ value: JSON.stringify(arr) })
});
return r.ok;
}


module.exports = async (req, res) => {
res.setHeader('Content-Type', 'application/json');


if (req.method === 'GET') {
const data = await kvGet();
if (data === null) {
// KV belum siap – kembalikan array kosong agar UI tetap jalan
return res.status(200).end('[]');
}
return res.status(200).end(JSON.stringify(data));
}


if (req.method === 'POST') {
if (req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
return res.status(401).end(JSON.stringify({ error: 'Unauthorized' }));
}
let body = '';
for await (const chunk of req) body += chunk;
const item = JSON.parse(body || '{}');
if (!item || !item.id || !item.judul || !item.pi) {
return res.status(400).end(JSON.stringify({ error: 'Bad Request' }));
}
const list = (await kvGet()) || [];
const rest = list.filter(x => x.id !== item.id);
rest.push(item);
const ok = await kvSet(rest);
return res.status(ok ? 200 : 500).end(JSON.stringify({ ok }));
}


res.setHeader('Allow', 'GET, POST');
return res.status(405).end(JSON.stringify({ error: 'Method Not Allowed' }));
};