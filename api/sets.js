const { SETS } = require('../lib/data');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Never cache: problems must reflect the latest deploy immediately
  // (a stale CDN/browser copy would show old wording during a live round).
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  return res.json(SETS.map(s => ({
    number: s.number,
    points: s.points,
    level: s.level,
    problems: s.problems,
  })));
};
