const { SETS } = require('../lib/data');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 'public, max-age=3600');

  return res.json(SETS.map(s => ({
    number: s.number,
    points: s.points,
    level: s.level,
    problems: s.problems,
  })));
};
