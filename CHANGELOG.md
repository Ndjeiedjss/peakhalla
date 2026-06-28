# PeakHalla v7.47 — Official Brawlhalla Data Trial

- Official-only mode is now the default (`PEAKHALLA_DATA_MODE=official`).
- Disables all CoreHalla and BrawlTools network calls.
- Player stats, ranked data, 2v2 teams, guilds, legends, and leaderboards use the official Brawlhalla v1 API.
- Esports power rankings and tournament news use official Brawlhalla pages.
- Old names are limited to names PeakHalla previously observed from official Brawlhalla responses.
- Ignores old third-party-enriched profile and guild cache entries.
- Reversible: set Railway variable `PEAKHALLA_DATA_MODE=hybrid` or upload the supplied v7.46 rollback package.
