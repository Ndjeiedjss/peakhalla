# PeakHalla · Brawlhalla Tracker v7.7

## Brand and rights

- New PeakHalla logo in the header with smooth, reduced-motion-safe animation.
- Full copyright footer across the tracker, player pages, Queue and Arena Wall.
- Clear unofficial-project disclaimer for Ubisoft and Blue Mammoth Games.

## Leaderboard W/L

Each ranked row now shows compact green **W** and red **L** badges directly beside the player name. The record uses the official current-season leaderboard wins and losses and remains visible on mobile.

## Player search

The search now combines:

- Current ranked leaderboard matches.
- Corehalla historical-name results, including profiles without a current placement when Corehalla already knows the account.
- Direct Brawlhalla ID lookup by entering the numeric BH ID.
- The tracker's own previously observed names as a fallback.

Brawlhalla's public leaderboard does not provide a universal name directory for every unranked account. For an account that is not in the current rankings and has never been indexed by Corehalla, search by its BH ID.

## XP, levels, and match time

Player profiles prefer the legacy player-stat values exposed through Corehalla's public data layer because these match Corehalla's account XP, account level, legend XP/levels, and per-legend match-time display. Brawlhalla API v1 remains the fallback and supplies current ranked data.

## Previous names

Previous names come from Corehalla's historical alias database plus names observed by this tracker. They appear as compact chips below the player identity.

## Arena navigation

The header remains available on Arena Wall. Ranked 1v1, 2v2, and 3v3 choices now return directly to the matching leaderboard with a smooth page transition.

## Run

```cmd
npm.cmd install
set PORT=3001
npm.cmd start
```

Open `http://localhost:3001`.

To preserve Arena Wall accounts and images when upgrading, copy `data/arena-users.json`, `data/arena-posts.json`, and `uploads/arena` from the previous version.
