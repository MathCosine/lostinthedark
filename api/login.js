const redis = require('../lib/redis');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { teamName, password } = req.body || {};
  if (!teamName || !password) {
    return res.status(400).json({ error: 'Team name and password are required.' });
  }

  const name = teamName.trim();
  if (!name) return res.status(400).json({ error: 'Team name cannot be blank.' });

  const key = `team:${name}`;
  let team = await redis.get(key);

  if (!team) {
    team = { name, password, currentSet: 0, scores: Array(8).fill(0), totalScore: 0 };
    await redis.set(key, JSON.stringify(team));
    await redis.sadd('teamnames', name);
    return res.json({ ok: true, new: true, currentSet: 0, scores: team.scores, totalScore: 0 });
  }

  // redis.get returns parsed JSON automatically when stored as object; handle both
  if (typeof team === 'string') team = JSON.parse(team);

  if (team.password !== password) {
    return res.status(401).json({ error: 'Incorrect password for this team.' });
  }

  return res.json({ ok: true, new: false, currentSet: team.currentSet, scores: team.scores, totalScore: team.totalScore });
};
