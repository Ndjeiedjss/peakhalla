# PeakHalla v7.30.0

- Ranked name-search results now prioritize exact matches by current ELO, peak ELO, and global rank.
- Old-name matches are enriched with current ranked data instead of appearing as duplicate unranked rows.
- Player profiles now repaint automatically when live ELO, peak, tier, rank, or season stats change.
- Fresh search-result ELO is shown immediately when opening a profile.
- Reduced background prefetch load to improve Railway responsiveness.
- Shortened stale server profile cache windows.

# PeakHalla Changelog

## 7.29.0
- Fixed the Clans section appearing below standalone player profiles.
- Made clan discovery lazy and removed heavy startup warm-up requests.
- Prevented clan enrichment from delaying player profile responses.
- Added request timeouts so loading states cannot hang indefinitely.
- Embedded the header/footer logo directly in the page so it always renders on the custom domain.
- Updated canonical and social URLs to `https://peakhalla.com`.

# Changelog

## 7.28.0
- Fixed the root cause of broken old-name search: Corehalla's numeric tRPC inputs must be sent as strings, while PeakHalla was converting alias-search `page` values to numbers.
- Old aliases now resolve to the correct BH ID even when the player is unranked or has never completed placements.
- Exact and punctuation-variant aliases such as `MEZX10` and `MEZX10?` are prioritized above unrelated ranked substring results.
- Unranked alias matches open the full player profile directly; ranked ELO is shown only when it exists.
- Updated public asset versions and package metadata to 7.28.0.

## 7.23.0
- Rebranded the complete site identity to **PeakHalla** with a new angular PH logo.
- Added compact, color-coded **W/L** badges directly beside every player name in the ranked leaderboard.
- Added a fallback that derives losses from games minus wins when an API response omits the loss field.
- Preserved smooth header and row motion with reduced-motion accessibility.
- Updated browser metadata, footer rights, package identity, health endpoint and deployment name.

## 7.6.0
- Introduced the animated brand system, responsive copyright footer and legal disclaimer.

# v7.4.0

- Added player search beyond current-season placements by combining ranked results with Corehalla's historical alias index and direct BH ID lookup.
- Unranked profiles can now appear in search and autocomplete when their BH ID is known by Corehalla; direct BH ID lookup always works.
- Account XP, account level, per-legend XP/levels, and online match time now prefer the legacy player-stat values used by Corehalla, with Brawlhalla API v1 as a fallback.
- Restored previous names using Corehalla's alias history instead of scraping page text.
- Added a compact Corehalla-style alias strip to player profiles, recolored for the purple PeakHalla theme.
- Ranked 1v1, 2v2, and 3v3 navigation now works directly from Arena Wall.
- Esports and About header links now use absolute tracker anchors so they work from standalone pages.
- Updated cache-busting asset versions and health version to 7.4.0.
