const redis = require('../lib/redis');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sfma-staff';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, action, teamName } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect staff password.' });
  }

  const names = (await redis.smembers('teamnames')) || [];

  switch (action) {
    case 'list': {
      const rows = await Promise.all(names.map(n => redis.get(`team:${n}`)));
      const teams = rows
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
      return res.json({ ok: true, teams });
    }

    case 'reset': {
      // Keep teams + passwords, but wipe all progress and scores.
      await Promise.all(names.map(async n => {
        const key = `team:${n}`;
        let t = await redis.get(key);
        if (!t) return;
        if (typeof t === 'string') t = JSON.parse(t);
        t.currentSet = 0;
        t.scores = Array(8).fill(0);
        t.totalScore = 0;
        await redis.set(key, JSON.stringify(t));
      }));
      return res.json({ ok: true, message: `Reset progress for ${names.length} team(s).` });
    }

    case 'deleteAll': {
      await Promise.all(names.map(n => redis.del(`team:${n}`)));
      await redis.del('teamnames');
      return res.json({ ok: true, message: `Deleted ${names.length} team(s).` });
    }

    case 'deleteTeam': {
      const name = (teamName || '').trim();
      if (!name) return res.status(400).json({ error: 'No team specified.' });
      await redis.del(`team:${name}`);
      await redis.srem('teamnames', name);
      return res.json({ ok: true, message: `Deleted team "${name}".` });
    }

    default:
      return res.status(400).json({ error: 'Unknown action.' });
  }
};
