-- Waitlist for private beta access.
--
-- Deliberately small: an email, where they are in their search, and which page
-- they signed up from. That's enough to invite someone and to know which
-- surface actually converts. It is not a CRM.
--
-- Kept separate from `users` because a signup is not an account - most of
-- these people will never get an invite, and mixing them into users would
-- corrupt every metric that counts users.
--
-- MailerLite is the mailing list; this table is the record of who asked and
-- who's been let in. `invited_at` is the only piece of state, and it exists so
-- the same person isn't invited twice.

CREATE TABLE beta_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Citext isn't installed, so emails are lowercased in the route before
  -- insert. The unique index is what makes a repeat signup a no-op rather
  -- than a duplicate.
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Self-declared, from the signup form. Free-text rather than a CHECK: the
  -- options will change as we learn who's actually turning up, and a
  -- migration per copy change isn't worth it.
  stage VARCHAR(60),

  -- Which page the signup came from ('home', 'login', 'product/improve-your-cv').
  -- This is how we find out which story actually persuades people.
  source VARCHAR(120),

  invited_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_beta_signups_created_at ON beta_signups(created_at);
CREATE INDEX idx_beta_signups_invited_at ON beta_signups(invited_at);
