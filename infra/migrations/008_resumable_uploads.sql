ALTER TABLE intents ADD COLUMN IF NOT EXISTS expected_bytes bigint;
CREATE TABLE IF NOT EXISTS upload_parts (
 intent_id uuid NOT NULL REFERENCES intents(id),
 start_byte bigint NOT NULL CHECK(start_byte>=0),
 bytes integer NOT NULL CHECK(bytes>0 AND bytes<=1048576),
 checksum text NOT NULL,
 object_key text NOT NULL,
 PRIMARY KEY(intent_id,start_byte)
);
ALTER TABLE upload_parts ENABLE ROW LEVEL SECURITY;
