# PeakHalla v7.49 — Discovery Engine

- Scans multiple official Brawlhalla leaderboard pages per cycle.
- Covers 1v1 and 2v2 across All Regions, EU, US-E, US-W, BRZ, SEA, AUS, JPS, SA, and ME.
- Uses adaptive pagination instead of stopping at page 20.
- Refreshes the global top page periodically while deeper discovery continues.
- Stores discovery progress, total pages scanned, players seen, and newly added players in PostgreSQL.
- Expands `/api/system/database` with discovery progress and regional coverage.
- Keeps conservative request pacing and environment-variable controls.
