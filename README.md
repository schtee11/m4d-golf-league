# M4D Golf League

Weekly golf leaderboard for you and your buddies — play different courses, compete on a level playing field using GHIN Handicap Index + USGA slope/rating math.

## How the scoring works

- **Course Handicap** = Handicap Index × (Slope Rating / 113) + (Course Rating − Par)
- **Net Score** = Gross Score − Course Handicap
- **Net Stableford Points** (used for the season standings): points awarded per hole based on net score vs. par, with strokes allocated evenly across holes (see note in `server/scoring.js` if you want exact USGA stroke-index allocation later — just add a `stroke_index` array to the `courses` table)
- **Cap**: each hole score is capped at double par before totals are calculated (per your call — this differs slightly from USGA's "net double bogey" but is simpler to run without full stroke allocation)
- **Handicap entry**: manual for now. Each player updates their Handicap Index from GHIN.com/GHIN app whenever it changes. GHIN doesn't offer a public API without an approval process, so this avoids fragile scraping/unofficial integrations. Can revisit later if it becomes annoying.

## Structure

```
m4d-golf-league/
  server/   Express + Postgres API
  client/   React/Vite/Tailwind frontend
```

## Local setup

**Server:**
```bash
cd server
npm install
cp .env.example .env   # fill in your local/dev DATABASE_URL
psql $DATABASE_URL -f schema.sql
npm run dev
```

**Client:**
```bash
cd client
npm install
cp .env.example .env   # point at your local server
npm run dev
```

## Deploying (matches your usual stack)

**Backend → Railway:**
1. New Railway project, add a Postgres plugin.
2. Deploy `server/` (Railway auto-detects Node).
3. Run `schema.sql` against the Railway Postgres instance (Railway's query console or `psql`).
4. Set `DATABASE_URL` env var (Railway provides this automatically when you link the Postgres plugin).

**Frontend → Netlify:**
1. New site from the `client/` directory.
2. Build command: `npm run build`, publish directory: `dist`.
3. Set `VITE_API_URL` env var to your Railway backend URL + `/api`.
4. `_redirects` file is already included for SPA routing.

## Getting your league running

1. Go to `/commish`, add all your players with their current Handicap Index.
2. Add the courses you'll be playing (slope, rating, par, and hole-by-hole pars — get these off the scorecard or the course's GHIN listing).
3. Create Week 1.
4. Everyone submits scores at `/submit` after their round.
5. Check `/weekly` for that week's results, `/` for season standings.

## Notes / next steps if you want to extend this

- No auth yet — anyone with the link can submit for anyone. Fine for a trusted friend group; add simple player-select-lock or magic-link auth if that becomes a problem.
- Season leaderboard currently ranks by cumulative Stableford points. Could easily switch to average net score or a "weekly winner gets standings points" model if you'd rather do it Sleeper-style.
- 9-hole handicap calc is an approximation (halved index). USGA's official 9-hole formula is a bit more nuanced — fine for casual play, flag if you want it more precise.
