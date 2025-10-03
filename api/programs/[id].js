// File: api/programs/[id].js
const KEY = 'programs';


async function kvGet() {
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
const url = `${process.env.KV_REST_API_URL}/get/${KEY}`;
const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` } });
if (!r.ok) return [];
const json = await r.json();
try { return JSON.parse(json.result || '[]'); } catch { return []; }
}


async function kvSet(arr) {
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return false;
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
if (req.method !== 'DELETE') {
res.setHeader('Allow', 'DELETE');
return res.status(405).end(JSON.stringify({ error: 'Method Not Allowed' }));
}
if (req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
return res.status(401).end(JSON.stringify({ error: 'Unauthorized' }));
}


const id = (req.url.split('/').pop() || '').trim();
if (!id) return res.status(400).end(JSON.stringify({ error: 'Bad Request' }));


const list = (await kvGet()) || [];
const rest = list.filter(x => x.id !== id);
const ok = await kvSet(rest);
return res.status(ok ? 200 : 500).end(JSON.stringify({ ok }));
};