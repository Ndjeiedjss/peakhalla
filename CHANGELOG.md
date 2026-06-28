# PeakHalla v7.56

- Fixed current-season 2v2 teammate discovery with an official leaderboard fallback and persistent PostgreSQL team caching.
- Prevented 2v2 team ratings and ranks from overwriting individual 1v1 player records.
- Verified profile global rank against the official 1v1 leaderboard before display.
- Fixed stale cached navigation data overwriting fresh profile rank and ELO values.
- Made legend portraits local-first and eager by default, with automatic multi-pass loading and retry behavior.
- Made background profile updates re-render when legends, weapons, play time, XP, images, or rank change.
- Hydrated missing teammate portraits in the browser without delaying the teammate list.
- Bumped frontend asset versions to clear old browser and CDN caches.
