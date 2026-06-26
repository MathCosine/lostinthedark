const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Competition data ──────────────────────────────────────────────────────────

const SETS = [
  {
    number: 1,
    points: 4,
    level: 'AMC 8 (Easy)',
    problems: [
      'The sum of 5 consecutive odd integers is 95. What is the largest of the five integers?',
      'If 40\\% of a number equals 24, what is 75\\% of that number?',
      "A rectangle's length is twice its width. If its perimeter is 48, what is its area?",
      'What is the remainder when $2^{100}$ is divided by 7?',
    ],
    answers: ['23', '45', '128', '2'],
  },
  {
    number: 2,
    points: 6,
    level: 'AMC 8 (Mid)',
    problems: [
      'In a class, the ratio of boys to girls is $3:5$. After 6 more boys join and 2 girls leave, the ratio becomes $3:4$. How many students were in the class originally?',
      'The product of two positive integers is 180, and their greatest common divisor is 6. What is their sum?',
      'What is the largest two-digit prime $p$ such that reversing the digits of $p$ also gives a prime?',
      'A bag contains 4 red marbles and some blue marbles. The probability of drawing 2 red marbles at random without replacement is $\\dfrac{2}{5}$. How many blue marbles are in the bag?',
    ],
    answers: ['80', '36', '97', '2'],
  },
  {
    number: 3,
    points: 8,
    level: 'AMC 8 (Hard)',
    problems: [
      'A three-digit positive integer has all three digits distinct and summing to 14. The hundreds digit is twice the units digit. How many such integers are there?',
      'What is the sum of all positive two-digit multiples of 7?',
      'In rectangle $ABCD$ with $AB = 12$ and $BC = 8$, point $M$ is the midpoint of $\\overline{BC}$ and point $N$ is the midpoint of $\\overline{CD}$. Find the area of triangle $AMN$.',
      'Compute $1^3 + 2^3 + 3^3 + \\cdots + 10^3$.',
    ],
    answers: ['3', '728', '36', '3025'],
  },
  {
    number: 4,
    points: 10,
    level: 'MATHCOUNTS Chapter',
    problems: [
      'A jar contains red, blue, and green marbles in the ratio $3:4:5$. After 12 green marbles are removed, the ratio becomes $3:4:3$. How many red marbles does the jar contain?',
      'A positive integer $N$ has exactly 3 positive divisors. How many positive divisors does $N^4$ have?',
      'What is the smallest positive integer that leaves a remainder of 3 when divided by 7 and a remainder of 5 when divided by 9?',
      'How many diagonals does a convex 12-gon have?',
    ],
    answers: ['18', '9', '59', '54'],
  },
  {
    number: 5,
    points: 12,
    level: 'MATHCOUNTS Chapter/State',
    problems: [
      'How many ordered pairs of positive integers $(a, b)$ satisfy $a + b + ab = 47$?',
      'A point $P$ lies inside an equilateral triangle with side length 6. The perpendicular distances from $P$ to the three sides are in the ratio $1:2:3$. What is the distance from $P$ to the nearest side? Express your answer in simplest radical form.',
      'A four-digit positive integer has the property that removing its leading digit yields a number equal to exactly $\\dfrac{1}{9}$ of the original. How many such four-digit integers exist?',
      'Compute $\\dfrac{1}{1 \\cdot 2} + \\dfrac{1}{2 \\cdot 3} + \\dfrac{1}{3 \\cdot 4} + \\cdots + \\dfrac{1}{19 \\cdot 20}$. Express as a fraction.',
    ],
    answers: ['8', 'sqrt(3)/2', '7', '19/20'],
  },
  {
    number: 6,
    points: 14,
    level: 'MATHCOUNTS State',
    problems: [
      'Define $a \\oplus b = \\dfrac{ab}{a + b}$ for positive reals $a$ and $b$. Compute $(2 \\oplus 3) \\oplus 6$.',
      'A sequence satisfies $a_1 = 1$ and $a_{n+1} = a_n + \\lfloor\\sqrt{a_n}\\rfloor$ for all positive integers $n$. Find $a_{10}$.',
      'In how many ways can a $2 \\times 8$ rectangle be tiled by $1 \\times 2$ dominoes?',
      'The polynomial $p(x) = x^3 - 7x + 6$ has three integer roots. Find the sum of the squares of its roots.',
    ],
    answers: ['1', '20', '34', '14'],
  },
  {
    number: 7,
    points: 16,
    level: 'MATHCOUNTS State/National',
    problems: [
      'A function $f$ satisfies $f(x) + f(x + 1) = 2x$ for all integers $x$, and $f(1) = 3$. Find $f(7)$.',
      'In triangle $ABC$, $AB = 13$, $BC = 14$, $CA = 15$. Find the length of the altitude from $A$ to $\\overline{BC}$.',
      'How many integers from 1 to 1000 are divisible by at least one of 3, 5, or 7?',
      'A point is chosen uniformly at random from the interior of a square with side length 4. What is the probability that the chosen point is closer to the center of the square than to any of its four corners? Express as a fraction.',
    ],
    answers: ['9', '12', '543', '1/2'],
  },
  {
    number: 8,
    points: 18,
    level: 'MATHCOUNTS National',
    problems: [
      'How many ordered triples of positive integers $(a, b, c)$ with $a \\le b \\le c$ satisfy $a + b + c = 15$?',
      'Square $ABCD$ has side length 4. Point $E$ lies on $\\overline{AB}$ with $AE = 1$, and point $F$ lies on $\\overline{BC}$ with $BF = 1$. Find the area of triangle $DEF$. Express as a fraction.',
      'How many integers from 1 to 500 have an odd number of positive divisors?',
      'Find the largest integer $n$ for which $n^2 - 19n + 99$ is a perfect square.',
    ],
    answers: ['19', '13/2', '22', '18'],
  },
];

// ── Answer checking ───────────────────────────────────────────────────────────

function parseAnswer(raw) {
  let s = raw.trim().toLowerCase().replace(/\s+/g, '');

  // Normalise √n  →  sqrt(n)  (bare √ without parens)
  s = s.replace(/√(\d+(?:\.\d+)?)/g, 'sqrt($1)');
  // Also accept written "sqrt" without parens: sqrt3 → sqrt(3)
  s = s.replace(/sqrt(\d+(?:\.\d+)?)/g, 'sqrt($1)');

  // Match sqrt(n)/m
  let m = s.match(/^sqrt\((\d+(?:\.\d+)?)\)\/(\d+(?:\.\d+)?)$/);
  if (m) return Math.sqrt(parseFloat(m[1])) / parseFloat(m[2]);

  // Match sqrt(n)
  m = s.match(/^sqrt\((\d+(?:\.\d+)?)\)$/);
  if (m) return Math.sqrt(parseFloat(m[1]));

  // Match a/b  (simple fraction)
  m = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (m) {
    const den = parseFloat(m[2]);
    if (den === 0) return NaN;
    return parseFloat(m[1]) / den;
  }

  // Plain number
  const n = parseFloat(s);
  return isNaN(n) ? s : n;
}

function answersMatch(submitted, correct) {
  const s = parseAnswer(submitted);
  const c = parseAnswer(correct);
  if (typeof s === 'number' && typeof c === 'number') {
    return Math.abs(s - c) < 0.0001;
  }
  return String(s).trim().toLowerCase() === String(c).trim().toLowerCase();
}

// ── In-memory state ───────────────────────────────────────────────────────────

// teams[name] = { password, currentSet (0-based), scores[8], totalScore, socketId }
const teams = {};

function leaderboard() {
  return Object.entries(teams)
    .map(([name, t]) => ({
      name,
      totalScore: t.totalScore,
      currentSet: t.currentSet + 1,    // 1-based for display
      scores: t.scores,
      finished: t.currentSet >= SETS.length,
    }))
    .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));
}

function broadcastLeaderboard() {
  io.emit('leaderboard', leaderboard());
}

// ── REST API ──────────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { teamName, password } = req.body;
  if (!teamName || !password) {
    return res.status(400).json({ error: 'Team name and password are required.' });
  }
  const name = teamName.trim();
  if (!name) return res.status(400).json({ error: 'Team name cannot be blank.' });

  if (!teams[name]) {
    // Register new team
    teams[name] = {
      password,
      currentSet: 0,
      scores: Array(SETS.length).fill(0),
      totalScore: 0,
    };
    broadcastLeaderboard();
    return res.json({ ok: true, new: true, currentSet: 0, scores: teams[name].scores, totalScore: 0 });
  }

  if (teams[name].password !== password) {
    return res.status(401).json({ error: 'Incorrect password for this team.' });
  }

  const t = teams[name];
  return res.json({ ok: true, new: false, currentSet: t.currentSet, scores: t.scores, totalScore: t.totalScore });
});

app.post('/api/submit', (req, res) => {
  const { teamName, password, answers } = req.body;
  if (!teamName || !password || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  const t = teams[teamName];
  if (!t) return res.status(404).json({ error: 'Team not found. Please log in again.' });
  if (t.password !== password) return res.status(401).json({ error: 'Authentication error.' });

  const setIdx = t.currentSet;
  if (setIdx >= SETS.length) {
    return res.json({ ok: true, done: true, message: 'You have completed all sets!' });
  }

  const set = SETS[setIdx];
  const results = answers.map((ans, i) => {
    const correct = answersMatch(ans, set.answers[i]);
    return { correct, submitted: ans, expected: set.answers[i] };
  });

  const earned = results.filter(r => r.correct).length * set.points;
  t.scores[setIdx] = earned;
  t.totalScore = t.scores.reduce((a, b) => a + b, 0);
  t.currentSet = setIdx + 1;

  broadcastLeaderboard();

  return res.json({
    ok: true,
    results,
    earned,
    totalScore: t.totalScore,
    nextSet: t.currentSet < SETS.length ? t.currentSet : null,
    done: t.currentSet >= SETS.length,
  });
});

// Serve sets metadata (problems) — no answers
app.get('/api/sets', (req, res) => {
  res.json(SETS.map(s => ({
    number: s.number,
    points: s.points,
    level: s.level,
    problems: s.problems,
  })));
});

// ── Socket.io ─────────────────────────────────────────────────────────────────

io.on('connection', socket => {
  socket.emit('leaderboard', leaderboard());
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`SFMA Guts Round running at http://localhost:${PORT}`));
