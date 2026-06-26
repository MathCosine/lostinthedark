// Local development server — uses in-memory storage, no Redis needed.
// For production, deploy to Vercel (the api/ directory handles requests there).
const express = require('express');
const path    = require('path');
const { SETS, answersMatch } = require('./lib/data');

const app  = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── In-memory store ───────────────────────────────────────────────────────────
const teams = {};  // { [name]: { name, password, currentSet, scores, totalScore } }

// ── API routes ────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { teamName, password } = req.body || {};
  if (!teamName || !password) {
    return res.status(400).json({ error: 'Team name and password are required.' });
  }
  const name = teamName.trim();
  if (!name) return res.status(400).json({ error: 'Team name cannot be blank.' });

  if (!teams[name]) {
    teams[name] = { name, password, currentSet: 0, scores: Array(8).fill(0), totalScore: 0 };
    return res.json({ ok: true, new: true, currentSet: 0, scores: teams[name].scores, totalScore: 0 });
  }
  if (teams[name].password !== password) {
    return res.status(401).json({ error: 'Incorrect password for this team.' });
  }
  const t = teams[name];
  return res.json({ ok: true, new: false, currentSet: t.currentSet, scores: t.scores, totalScore: t.totalScore });
});

app.post('/api/submit', (req, res) => {
  const { teamName, password, answers } = req.body || {};
  if (!teamName || !password || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  const t = teams[teamName?.trim()];
  if (!t) return res.status(404).json({ error: 'Team not found. Please log in again.' });
  if (t.password !== password) return res.status(401).json({ error: 'Authentication error.' });

  const setIdx = t.currentSet;
  if (setIdx >= SETS.length) return res.json({ ok: true, done: true });

  const set = SETS[setIdx];
  const results = answers.map((ans, i) => ({
    correct: answersMatch(String(ans), set.answers[i]),
    submitted: ans,
    expected: set.answers[i],
  }));

  const earned = results.filter(r => r.correct).length * set.points;
  t.scores[setIdx] = earned;
  t.totalScore = t.scores.reduce((a, b) => a + b, 0);
  t.currentSet = setIdx + 1;

  return res.json({
    ok: true, results, earned, totalScore: t.totalScore,
    nextSet: t.currentSet < SETS.length ? t.currentSet : null,
    done: t.currentSet >= SETS.length,
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const board = Object.values(teams)
    .map(t => ({
      name: t.name,
      totalScore: t.totalScore,
      currentSet: t.currentSet + 1,
      scores: t.scores,
      finished: t.currentSet >= SETS.length,
    }))
    .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));
  return res.json(board);
});

app.get('/api/sets', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.json(SETS.map(s => ({
    number: s.number, points: s.points, level: s.level, problems: s.problems,
  })));
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SFMA Guts Round running at http://localhost:${PORT}`);
  console.log('(In-memory mode — data resets on restart)');
});
