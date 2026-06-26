const redis = require('../lib/redis');
const { SETS, answersMatch } = require('../lib/data');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { teamName, password, answers } = req.body || {};
  if (!teamName || !password || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  const key = `team:${teamName.trim()}`;
  let team = await redis.get(key);
  if (!team) return res.status(404).json({ error: 'Team not found. Please log in again.' });
  if (typeof team === 'string') team = JSON.parse(team);

  if (team.password !== password) return res.status(401).json({ error: 'Authentication error.' });

  const setIdx = team.currentSet;
  if (setIdx >= SETS.length) return res.json({ ok: true, done: true });

  const set = SETS[setIdx];
  const results = answers.map((ans, i) => ({
    correct: answersMatch(String(ans), set.answers[i]),
    submitted: ans,
    expected: set.answers[i],
  }));

  const earned = results.filter(r => r.correct).length * set.points;
  team.scores[setIdx] = earned;
  team.totalScore = team.scores.reduce((a, b) => a + b, 0);
  team.currentSet = setIdx + 1;

  await redis.set(key, JSON.stringify(team));

  return res.json({
    ok: true,
    results,
    earned,
    totalScore: team.totalScore,
    nextSet: team.currentSet < SETS.length ? team.currentSet : null,
    done: team.currentSet >= SETS.length,
  });
};
