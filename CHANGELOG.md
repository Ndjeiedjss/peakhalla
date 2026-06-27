# Changelog

## 7.27.0
- Hid the clans lifetime-XP section from the standalone Arena Wall route.
- Added a polished clickable clan identity card to player profiles, including clan name, role, and guild ID.
- Strengthened old-name and unranked-profile discovery with GET, batch GET, POST, and raw tRPC fallbacks for Corehalla alias search.
- Broadened alias-page lookup and persist successful alias matches locally so repeat searches become faster.
- Added a complete local portrait pack for all 68 supplied legends, normalized to transparent 256×256 images with consistent centering and sizing.
- Made local portraits the primary source, with official/API artwork retained as automatic fallbacks for future legends.
- Improved old-name discovery for unranked and no-placement accounts, including valid one-character current aliases returned by alias search.
- Simplified top clan cards to focus on lifetime XP and moved complete clan information into a dedicated smooth clan page.
- Sorted top clans by lifetime XP and normalized the roster hierarchy as Recruit → Member → Officer → Leader.
- Enforced one Leader per clan display while preferring the official Brawlhalla guild roster whenever it is available.
- Added clear Current ELO and Peak ELO values to player search results and retained both values in the full player profile.
- Updated public asset versions and Node package metadata to 7.27.0.

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
