# PeakHalla v7.48 — Database Foundation

- Added PostgreSQL as PeakHalla's durable player database.
- Automatically creates the required database tables on startup.
- Imports the existing local name history, profile cache, and snapshots once.
- Stores every visited player profile, current name, old names, rank data, main legend, and daily snapshots.
- Searches the PeakHalla database before external fallbacks, prioritizing exact-name and higher-ELO matches.
- Opens previously visited player profiles instantly from PostgreSQL while fresh data updates in the background.
- Added a conservative official Brawlhalla discovery worker that indexes one leaderboard page at a time.
- Keeps the existing JSON files as a fallback so the site continues working if PostgreSQL is temporarily unavailable.
- Added `/api/system/database` for safe database health and record counts (no credentials are exposed).

Rollback: restore the previous `server.js`, `package.json`, and `package-lock.json` files.
