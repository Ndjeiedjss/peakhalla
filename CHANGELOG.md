# PeakHalla v7.50 — Persistent unranked search

- Fixes unranked profiles disappearing from search after the first profile view.
- Persists a viewed profile to PostgreSQL before returning the response.
- Returns exact PeakHalla database name matches before waiting for external providers.
- Stops caching empty search responses.
- Invalidates stale search results immediately when a current or previous name is saved.
