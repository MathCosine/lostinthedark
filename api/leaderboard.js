const redis = require('../lib/redis');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 'no-store');

  const names = await redis.smembers('teamnames');
  if (!names || names.length === 0) return res.json([]);

  const rows = await Promise.all(names.map(n => redis.get(`team:${n}`)));

  const board = rows
    .filter(Boolean)
    .map(raw => {
      const t = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return {
        name: t.name,
        totalScore: t.totalScore,
        currentSet: t.currentSet + 1,
        scores: t.scores,
        finished: t.currentSet >= 8,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));

  return res.json(board);
};
