# SFMA Guts Round

A live, team-based math competition system for the San Francisco Math Academy
Guts Round. Teams log in, work through 8 sets of 4 problems (one set at a time),
get auto-graded, and watch a live leaderboard. Staff get a password-protected
control panel to monitor teams, reset scores, and remove teams.

## Running locally

```bash
npm install
npm start          # → http://localhost:3000
```

Local mode uses an in-memory store (`dev-server.js`) — no database needed.
**Data resets when the server restarts.**

- Competition: <http://localhost:3000/>
- Staff panel:  <http://localhost:3000/admin.html>

## Staff / admin

The staff control panel (`/admin.html`) lets you:

- **Monitor** every team's score, current set, and per-set breakdown (auto-refreshes every 10 s)
- **Reset All Scores** — keeps teams + passwords, sends everyone back to Set 1 at 0 points
- **Delete All Teams** — wipes the whole competition
- **Delete** an individual team

The staff password is read from the `ADMIN_PASSWORD` environment variable and
defaults to `sfma-staff` if unset. **Set a real one before any live event.**

```bash
ADMIN_PASSWORD="your-secret" npm start
```

## Deploying to Vercel

The `api/` directory contains serverless functions; persistent state lives in
**Upstash Redis** (Vercel KV's successor).

1. In the Vercel dashboard, add an **Upstash Redis** integration to the project.
   It injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
2. Add an `ADMIN_PASSWORD` environment variable for the staff panel.
3. Deploy (push to the connected branch, or `vercel`).

For local dev against the real functions: `vercel env pull .env.local && vercel dev`.

## Notes

- **LaTeX** is rendered with [KaTeX](https://katex.org/), vendored locally under
  `public/vendor/katex/` so it works even if a venue's wifi blocks public CDNs.
- **Answer grading** is tolerant: it accepts integers, fractions (`19/20`),
  square-root forms (`sqrt(3)/2` or `√3/2`), and decimal approximations.
- Problems, answers, and the grader live in `lib/data.js` (shared by both the
  local dev server and the Vercel functions).
