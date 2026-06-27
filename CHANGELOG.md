# Changelog

## 7.25.0
- Removed the region selector from the homepage player search; searches now run across all regions automatically.
- Expanded old-name and unranked profile discovery through deeper alias lookup and BH ID fallback.
- Added a new Clans section with discovered official guild rankings, member counts, weekly points, XP, recruiting status, and a detailed roster modal with Leader, Officer, and Member roles.
- Added official guild endpoints and background clan discovery/caching.
- Reworked legend image loading with parallel image sources, shorter timeouts, async decoding, smooth fades, and reliable fallbacks.
- Updated public asset versions and Node package metadata to 7.25.0.

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
