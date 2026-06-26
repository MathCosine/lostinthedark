/* ── State ───────────────────────────────────────────────────────────────── */
let session = null;  // { teamName, password, currentSet, totalScore, scores }
let sets = [];
let leaderboardData = [];
let pollTimer = null;

/* ── Boot ────────────────────────────────────────────────────────────────── */
(async () => {
  const res = await fetch('/api/sets');
  sets = await res.json();
})();

/* ── Screens ─────────────────────────────────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ── Login ───────────────────────────────────────────────────────────────── */
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const teamName = document.getElementById('team-name').value.trim();
  const password = document.getElementById('password').value;
  const errEl    = document.getElementById('login-error');

  if (!teamName || !password) {
    errEl.textContent = 'Please enter both a team name and password.';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  const btn = e.target.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Logging in…';

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, password }),
    });
    let data;
    try { data = await res.json(); } catch (_) { data = {}; }
    if (!res.ok) {
      errEl.textContent = data.error || `Server error (${res.status}). Is the server running?`;
      errEl.classList.remove('hidden');
      return;
    }
    session = { teamName, password, currentSet: data.currentSet, totalScore: data.totalScore, scores: data.scores };
    enterCompetition();
  } catch (err) {
    errEl.textContent = 'Could not reach the server. Make sure it is running.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enter Competition';
  }
});

/* ── Competition ─────────────────────────────────────────────────────────── */
function enterCompetition() {
  showScreen('comp-screen');
  document.getElementById('hdr-team').textContent = session.teamName;
  updateHeaderScore();
  startPolling();

  if (session.currentSet >= sets.length) {
    showFinished();
  } else {
    renderSet(session.currentSet);
  }
}

function updateHeaderScore() {
  document.getElementById('hdr-score').textContent = session.totalScore;
}

/* ── Leaderboard polling ─────────────────────────────────────────────────── */
async function fetchLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    if (res.ok) {
      leaderboardData = await res.json();
      renderLeaderboard();
    }
  } catch (_) { /* ignore transient errors */ }
}

function startPolling() {
  fetchLeaderboard();
  if (!pollTimer) pollTimer = setInterval(fetchLeaderboard, 10000);
}

/* ── Progress pips ───────────────────────────────────────────────────────── */
function renderPips() {
  const container = document.getElementById('set-progress');
  if (!container || !sets.length) return;
  container.innerHTML = '<div class="pips">' + sets.map((_, i) => {
    const cls = i < session.currentSet ? 'done' : i === session.currentSet ? 'active' : '';
    return `<div class="pip ${cls}"></div>`;
  }).join('') + '</div>';
}

/* ── Render set ──────────────────────────────────────────────────────────── */
function renderSet(idx) {
  const set = sets[idx];
  if (!set) return;

  document.getElementById('set-num').textContent = `Set ${set.number}`;
  document.getElementById('set-meta').textContent =
    `  ·  ${set.points} pts each  ·  ${set.level}`;
  renderPips();

  // Answer inputs FIRST, so the competition is usable even if math rendering
  // ever fails (e.g. KaTeX blocked). The grid must never depend on renderMath.
  document.getElementById('answer-grid').innerHTML = [1, 2, 3, 4].map(n => `
    <div class="answer-field">
      <label>Problem ${n}</label>
      <input type="text" id="ans-${n}" placeholder="Answer ${n}" autocomplete="off" />
    </div>
  `).join('');

  const list = document.getElementById('problems-list');
  list.innerHTML = set.problems.map((p, i) => `
    <div class="problem-card">
      <div class="prob-num">${i + 1}</div>
      <div class="prob-text">${escHtml(p)}</div>
    </div>
  `).join('');
  renderMath(list);

  setTimeout(() => document.getElementById('ans-1')?.focus(), 50);

  document.getElementById('submit-error').classList.add('hidden');
  document.getElementById('result-overlay').classList.add('hidden');
  document.getElementById('finished-overlay').classList.add('hidden');
}

/* ── Submit ──────────────────────────────────────────────────────────────── */
document.getElementById('submit-btn').addEventListener('click', submitSet);

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement?.id?.startsWith('ans-')) {
    const n = parseInt(document.activeElement.id.split('-')[1]);
    const next = document.getElementById(`ans-${n + 1}`);
    if (next) { next.focus(); }
    else { submitSet(); }
  }
});

async function submitSet() {
  const answers = [1, 2, 3, 4].map(n => (document.getElementById(`ans-${n}`)?.value ?? '').trim());
  const errEl   = document.getElementById('submit-error');
  errEl.classList.add('hidden');

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Grading…';

  try {
    const res  = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: session.teamName, password: session.password, answers }),
    });
    let data;
    try { data = await res.json(); } catch (_) { data = {}; }
    if (!res.ok) {
      errEl.textContent = data.error || `Server error (${res.status}).`;
      errEl.classList.remove('hidden');
      return;
    }

    session.totalScore = data.totalScore;
    session.currentSet++;
    updateHeaderScore();
    renderPips();
    fetchLeaderboard();
    showResult(data);
  } catch (err) {
    errEl.textContent = 'Could not reach the server.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Set';
  }
}

/* ── Result overlay ──────────────────────────────────────────────────────── */
function showResult(data) {
  const set     = sets[session.currentSet - 1];
  const correct = data.results.filter(r => r.correct).length;

  document.getElementById('result-icon').textContent =
    correct === 4 ? '✦' : correct === 0 ? '—' : '✓';
  document.getElementById('result-icon').className =
    'result-icon ' + (correct === 4 ? 'r-perfect' : correct === 0 ? 'r-none' : 'r-some');
  document.getElementById('result-title').textContent =
    correct === 4 ? 'Perfect Set!' : `${correct} / 4 Correct`;

  data.results.forEach((r, i) => {
    const inp = document.getElementById(`ans-${i + 1}`);
    if (inp) { inp.classList.add(r.correct ? 'correct' : 'wrong'); inp.disabled = true; }
  });

  document.getElementById('result-breakdown').innerHTML = data.results.map((r, i) => `
    <div class="rb-item ${r.correct ? 'correct' : 'wrong'}">
      <div class="rb-label">Problem ${i + 1}</div>
      <div class="rb-ans">${r.correct ? '✓' : '✗ ' + escHtml(r.expected)}</div>
    </div>
  `).join('');

  document.getElementById('result-earned').textContent =
    `+${data.earned} pts  ·  Total: ${data.totalScore}`;

  const nextBtn = document.getElementById('result-next');
  if (data.done) {
    nextBtn.textContent = 'View Final Results';
    nextBtn.onclick = showFinished;
  } else {
    nextBtn.textContent = `Continue to Set ${session.currentSet + 1} →`;
    nextBtn.onclick = () => {
      document.getElementById('result-overlay').classList.add('hidden');
      renderSet(session.currentSet);
    };
  }

  document.getElementById('result-overlay').classList.remove('hidden');
}

function showFinished() {
  document.getElementById('result-overlay').classList.add('hidden');
  document.getElementById('finished-score').textContent = session.totalScore;
  document.getElementById('finished-overlay').classList.remove('hidden');
}

/* ── Leaderboard ─────────────────────────────────────────────────────────── */
function renderLeaderboard() {
  const list  = document.getElementById('lb-list');
  const count = document.getElementById('lb-count');
  if (!list) return;

  count.textContent = `${leaderboardData.length} team${leaderboardData.length !== 1 ? 's' : ''}`;

  if (leaderboardData.length === 0) {
    list.innerHTML = '<div style="padding:1.25rem;text-align:center;color:var(--ink-3);font-size:.82rem">No teams yet</div>';
    return;
  }

  list.innerHTML = leaderboardData.map((team, i) => {
    const rank    = i + 1;
    const rankCls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
    const rankStr = rank;
    const isMe    = session && team.name === session.teamName;
    const done    = Math.min(team.currentSet - 1, 8);

    const bars = Array.from({ length: 8 }, (_, si) => {
      const cls = si < done ? 'done' : (si === done && !team.finished ? 'active' : '');
      return `<div class="lb-bar ${cls}"></div>`;
    }).join('');

    return `
      <div class="lb-row${isMe ? ' me' : ''}">
        <div class="lb-rank ${rankCls}">${rankStr}</div>
        <div class="lb-info">
          <div class="lb-name">${escHtml(team.name)}${isMe ? ' ★' : ''}</div>
          <div class="lb-set-bars">${bars}</div>
          <div class="lb-set">${team.finished ? 'Finished' : `On Set ${team.currentSet}`}</div>
        </div>
        <div class="lb-score">${team.totalScore}</div>
      </div>
    `;
  }).join('');
}

/* ── KaTeX ───────────────────────────────────────────────────────────────── */
function renderMath(el) {
  // Never let a missing/slow KaTeX break the page — the raw $...$ text simply
  // stays visible and the competition remains fully usable.
  if (typeof renderMathInElement !== 'function') return;
  try {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true  },
        { left: '$',  right: '$',  display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true  },
      ],
      throwOnError: false,
    });
  } catch (_) { /* leave raw LaTeX visible */ }
}

/* ── Util ────────────────────────────────────────────────────────────────── */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
