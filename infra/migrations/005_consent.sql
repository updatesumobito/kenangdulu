ALTER TABLE guests ADD COLUMN IF NOT EXISTS consent_notice_version text NOT NULL DEFAULT 'privacy-v2';
ALTER TABLE guests ADD COLUMN IF NOT EXISTS consented_at timestamptz NOT NULL DEFAULT now();
