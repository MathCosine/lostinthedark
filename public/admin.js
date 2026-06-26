/* ── State ───────────────────────────────────────────────────────────────── */
let adminPassword = null;
let teams = [];
let pollTimer = null;

/* ── Screen helpers ──────────────────────────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ── API ─────────────────────────────────────────────────────────────────── */
async function adminFetch(action, extra = {}) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminPassword, action, ...extra }),
  });
  let data;
  try { data = await res.json(); } catch (_) { data = {}; }
  return { ok: res.ok, status: res.status, data };
}

/* ── Login ───────────────────────────────────────────────────────────────── */
document.getElementById('admin-login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const pw    = document.getElementById('admin-password').value;
  const errEl = document.getElementById('admin-login-error');
  errEl.classList.add('hidden');

  if (!pw) {
    errEl.textContent = 'Please enter the staff password.';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = e.target.querySelector('button');
  btn.disabled = true; btn.textContent = 'Signing in…';

  adminPassword = pw;
  try {
    const { ok, status, data } = await adminFetch('list');
    if (!ok) {
      adminPassword = null;
      errEl.textContent = data.error || `Sign-in failed (${status}).`;
      errEl.classList.remove('hidden');
      return;
    }
    teams = data.teams || [];
    enterDashboard();
  } catch (_) {
    adminPassword = null;
    errEl.textContent = 'Could not reach the server.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
});

/* ── Dashboard ───────────────────────────────────────────────────────────── */
function enterDashboard() {
  showScreen('admin-screen');
  render();
  if (!pollTimer) pollTimer = setInterval(refresh, 10000);
}

async function refresh() {
  const { ok, data } = await adminFetch('list');
  if (ok) { teams = data.teams || []; render(); }
}

function render() {
  // Stats
  const total     = teams.length;
  const finished  = teams.filter(t => t.finished).length;
  const topScore  = teams.length ? teams[0].totalScore : 0;
  const avgScore  = teams.length
    ? Math.round(teams.reduce((a, t) => a + t.totalScore, 0) / teams.length)
    : 0;

  document.getElementById('admin-status').textContent =
    `${total} team${total !== 1 ? 's' : ''} · live`;

  document.getElementById('admin-stats').innerHTML = `
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Teams</div></div>
    <div class="stat-card"><div class="stat-num">${finished}</div><div class="stat-label">Finished</div></div>
    <div class="stat-card"><div class="stat-num">${topScore}</div><div class="stat-label">Top Score</div></div>
    <div class="stat-card"><div class="stat-num">${avgScore}</div><div class="stat-label">Avg Score</div></div>
  `;

  document.getElementById('admin-team-count').textContent =
    `${total} team${total !== 1 ? 's' : ''}`;

  // Table
  const tbody = document.getElementById('admin-tbody');
  const empty = document.getElementById('admin-empty');
  if (total === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = teams.map((t, i) => {
    const rank    = i + 1;
    const rankCls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
    const medal   = rank;
    const done    = Math.min(t.currentSet - 1, 8);
    const bars    = Array.from({ length: 8 }, (_, si) => {
      const cls = si < done ? 'done' : (si === done && !t.finished ? 'active' : '');
      return `<div class="lb-bar ${cls}"></div>`;
    }).join('');
    const setCells = (t.scores || []).map((s, si) =>
      `<span class="set-chip ${s > 0 ? 'scored' : (si < done ? 'zero' : 'pending')}">${s}</span>`
    ).join('');

    return `
      <tr>
        <td class="rank-cell ${rankCls}">${medal}</td>
        <td class="name-cell">${escHtml(t.name)}</td>
        <td class="score-cell">${t.totalScore}</td>
        <td class="progress-cell">
          <div class="lb-set-bars">${bars}</div>
          <div class="progress-label">${t.finished ? 'Finished' : `Set ${t.currentSet}`}</div>
        </td>
        <td class="breakdown-cell">${setCells}</td>
        <td class="action-cell">
          <button class="btn-mini-danger" data-team="${escHtml(t.name)}">Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  // Wire per-team delete buttons
  tbody.querySelectorAll('.btn-mini-danger').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-team');
      confirmAction({
        title: `Delete "${name}"?`,
        text: 'This permanently removes the team and its score. This cannot be undone.',
        confirmLabel: 'Delete Team',
        run: async () => {
          const { ok, data } = await adminFetch('deleteTeam', { teamName: name });
          flash(ok ? data.message : (data.error || 'Failed.'), ok);
          await refresh();
        },
      });
    });
  });
}

/* ── Bulk actions ────────────────────────────────────────────────────────── */
document.getElementById('btn-refresh').addEventListener('click', refresh);

document.getElementById('btn-reset').addEventListener('click', () => {
  confirmAction({
    title: 'Reset all scores?',
    text: 'Every team keeps its name and password, but all progress and scores return to zero. Teams will restart from Set 1.',
    confirmLabel: 'Reset Scores',
    danger: false,
    run: async () => {
      const { ok, data } = await adminFetch('reset');
      flash(ok ? data.message : (data.error || 'Failed.'), ok);
      await refresh();
    },
  });
});

document.getElementById('btn-delete-all').addEventListener('click', () => {
  confirmAction({
    title: 'Delete ALL teams?',
    text: 'This permanently wipes every team, password, and score from the competition. This cannot be undone.',
    confirmLabel: 'Delete Everything',
    run: async () => {
      const { ok, data } = await adminFetch('deleteAll');
      flash(ok ? data.message : (data.error || 'Failed.'), ok);
      await refresh();
    },
  });
});

/* ── Confirm modal ───────────────────────────────────────────────────────── */
let pendingAction = null;
function confirmAction({ title, text, confirmLabel, run, danger = true }) {
  pendingAction = run;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent  = text;
  const okBtn = document.getElementById('confirm-ok');
  okBtn.textContent = confirmLabel || 'Confirm';
  okBtn.className = danger ? 'btn-danger' : 'btn-warn';
  document.getElementById('confirm-icon').textContent = danger ? '⚠️' : '↻';
  document.getElementById('confirm-overlay').classList.remove('hidden');
}

document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
document.getElementById('confirm-ok').addEventListener('click', async () => {
  const fn = pendingAction;
  closeConfirm();
  if (fn) await fn();
});
function closeConfirm() {
  document.getElementById('confirm-overlay').classList.add('hidden');
  pendingAction = null;
}

/* ── Flash message ───────────────────────────────────────────────────────── */
function flash(msg, ok = true) {
  const el = document.getElementById('admin-msg');
  el.textContent = msg;
  el.className = `admin-msg ${ok ? 'ok' : 'err'}`;
  el.classList.remove('hidden');
  clearTimeout(flash._t);
  flash._t = setTimeout(() => el.classList.add('hidden'), 4000);
}

/* ── Util ────────────────────────────────────────────────────────────────── */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
