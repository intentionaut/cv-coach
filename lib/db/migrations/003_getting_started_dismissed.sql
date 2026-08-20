-- Track whether a user has dismissed the dashboard's "Getting Started" guide.
-- Persists per-account (not per-browser) so it stays dismissed across devices.

ALTER TABLE users ADD COLUMN getting_started_dismissed_at TIMESTAMP WITH TIME ZONE;
