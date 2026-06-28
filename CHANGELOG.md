# PeakHalla v7.37

- Removed the ranked-mode selector from the main player search. The search now focuses only on player profiles by current name, old name, or BH ID.
- Reduced old-name search delays with local alias-first lookup, shorter external timeouts, background alias warming, and short-lived response caching.
- Added progressive leaderboard pagination. The first 20 players load normally, then **Load next 20 players** appends the next page without replacing the existing list.
- Kept region and ranked-mode filters on the leaderboard itself.
- Preserved the permanent Railway-to-peakhalla.com redirect.
