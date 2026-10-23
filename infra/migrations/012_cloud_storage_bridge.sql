CREATE TABLE IF NOT EXISTS komukuna_runtime_config (
 id text PRIMARY KEY,token_hash text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE komukuna_runtime_config ENABLE ROW LEVEL SECURITY;
