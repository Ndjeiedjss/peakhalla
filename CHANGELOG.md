# PeakHalla v7.52 — Arena Accounts & Notifications

- Arena Wall accounts are stored in PostgreSQL and survive Railway deployments.
- Arena posts, comments, reactions, new screenshots, and new profile photos are persisted in PostgreSQL.
- Existing Arena users and posts are imported automatically from the old JSON files once.
- Login sessions are database-backed and remain active for up to 90 days.
- Added a site-wide Arena account button with direct profile access from every page.
- Added comment and reply notifications with unread badges and a smooth notification panel.
- Added dedicated profile URLs: `/arena/profile/<username>`.
- Clicking a notification opens and highlights the related Arena post.
- Added Arena user/session/post/comment/notification counts to `/api/system/database`.
