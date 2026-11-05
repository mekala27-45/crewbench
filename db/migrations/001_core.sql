CREATE SCHEMA IF NOT EXISTS crewbench;
CREATE TABLE IF NOT EXISTS crewbench.schema_version(version integer PRIMARY KEY, installed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS crewbench.admission(id integer PRIMARY KEY CHECK(id=1), session_count integer NOT NULL DEFAULT 0 CHECK(session_count BETWEEN 0 AND 1000));
INSERT INTO crewbench.admission(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS crewbench.sessions(id text PRIMARY KEY, capability_digest text UNIQUE NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, requests integer NOT NULL DEFAULT 0 CHECK(requests BETWEEN 0 AND 500));
ALTER TABLE crewbench.sessions ADD COLUMN IF NOT EXISTS creation_key text UNIQUE;
CREATE TABLE IF NOT EXISTS crewbench.cases(id text PRIMARY KEY, packet_digest text NOT NULL, packet jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS crewbench.snapshots(case_id text NOT NULL REFERENCES crewbench.cases(id), id text NOT NULL, packet_digest text NOT NULL, PRIMARY KEY(case_id,id));
CREATE TABLE IF NOT EXISTS crewbench.trials(
 id text PRIMARY KEY, session_id text REFERENCES crewbench.sessions(id), plan_digest text NOT NULL, case_id text NOT NULL,
 snapshot_id text NOT NULL, method text NOT NULL CHECK(method IN ('deterministic_baseline','solo_agent','split_review')),
 repetition text NOT NULL, state jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(case_id,snapshot_id) REFERENCES crewbench.snapshots(case_id,id),
 UNIQUE(plan_digest,case_id,method,repetition),
 CHECK((state->'spent'->>'model_requests')::int BETWEEN 0 AND (state->'budget'->>'model_requests')::int),
 CHECK((state->'spent'->>'tool_requests')::int BETWEEN 0 AND (state->'budget'->>'tool_requests')::int),
 CHECK((state->'spent'->>'input_bytes')::int BETWEEN 0 AND (state->'budget'->>'input_bytes')::int),
 CHECK((state->'spent'->>'output_reserved_tokens')::int BETWEEN 0 AND (state->'budget'->>'output_reserved_tokens')::int)
);
CREATE INDEX IF NOT EXISTS trials_session ON crewbench.trials(session_id);
CREATE TABLE IF NOT EXISTS crewbench.roles(trial_id text NOT NULL REFERENCES crewbench.trials(id), role text NOT NULL, state jsonb NOT NULL, PRIMARY KEY(trial_id,role));
CREATE TABLE IF NOT EXISTS crewbench.budget_reservations(trial_id text NOT NULL, role text NOT NULL, operation_id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(trial_id,operation_id), FOREIGN KEY(trial_id,role) REFERENCES crewbench.roles(trial_id,role));
CREATE TABLE IF NOT EXISTS crewbench.provider_attempts(trial_id text NOT NULL, operation_id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(trial_id,operation_id), FOREIGN KEY(trial_id,operation_id) REFERENCES crewbench.budget_reservations(trial_id,operation_id));
CREATE TABLE IF NOT EXISTS crewbench.tool_requests(trial_id text NOT NULL, role text NOT NULL, operation_id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(trial_id,role,operation_id), FOREIGN KEY(trial_id,role) REFERENCES crewbench.roles(trial_id,role));
CREATE TABLE IF NOT EXISTS crewbench.tool_receipts(trial_id text NOT NULL, role text NOT NULL, id text NOT NULL, operation_id text NOT NULL, payload jsonb NOT NULL, payload_digest text NOT NULL, sequence integer NOT NULL, PRIMARY KEY(trial_id,id), UNIQUE(trial_id,role,operation_id), FOREIGN KEY(trial_id,role,operation_id) REFERENCES crewbench.tool_requests(trial_id,role,operation_id));
CREATE TABLE IF NOT EXISTS crewbench.child_packets(trial_id text NOT NULL, role text NOT NULL CHECK(role IN ('tests','staging')), receipt_id text NOT NULL, payload jsonb NOT NULL, payload_digest text NOT NULL, generation integer NOT NULL, PRIMARY KEY(trial_id,role), FOREIGN KEY(trial_id,role) REFERENCES crewbench.roles(trial_id,role), FOREIGN KEY(trial_id,receipt_id) REFERENCES crewbench.tool_receipts(trial_id,id));
CREATE TABLE IF NOT EXISTS crewbench.join_receipts(trial_id text PRIMARY KEY REFERENCES crewbench.trials(id), payload jsonb NOT NULL, payload_digest text NOT NULL);
CREATE TABLE IF NOT EXISTS crewbench.assessments(trial_id text PRIMARY KEY REFERENCES crewbench.trials(id), receipt_id text NOT NULL, payload jsonb NOT NULL, payload_digest text NOT NULL, FOREIGN KEY(trial_id,receipt_id) REFERENCES crewbench.tool_receipts(trial_id,id));
CREATE TABLE IF NOT EXISTS crewbench.trial_events(trial_id text NOT NULL REFERENCES crewbench.trials(id), sequence integer NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(trial_id,sequence));
CREATE TABLE IF NOT EXISTS crewbench.grade_manifests(trial_id text NOT NULL REFERENCES crewbench.trials(id), grader_digest text NOT NULL, assessment_digest text, payload jsonb NOT NULL, PRIMARY KEY(trial_id,grader_digest));
CREATE TABLE IF NOT EXISTS crewbench.api_operations(session_id text NOT NULL REFERENCES crewbench.sessions(id), operation text NOT NULL, operation_id text NOT NULL, request_digest text NOT NULL, response jsonb NOT NULL, PRIMARY KEY(session_id,operation,operation_id));
CREATE TABLE IF NOT EXISTS crewbench.pinned_evidence(digest text PRIMARY KEY, path text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE OR REPLACE FUNCTION crewbench.prevent_change() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'IMMUTABLE_EVIDENCE'; END $$;
DO $$ DECLARE item text; BEGIN
 FOREACH item IN ARRAY ARRAY['cases','snapshots','budget_reservations','tool_receipts','child_packets','join_receipts','assessments','trial_events','grade_manifests'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='immutable_'||item AND tgrelid=('crewbench.'||item)::regclass) THEN
   EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON crewbench.%I FOR EACH ROW EXECUTE FUNCTION crewbench.prevent_change()', 'immutable_'||item,item);
  END IF;
 END LOOP;
END $$;
INSERT INTO crewbench.schema_version(version) VALUES(1) ON CONFLICT DO NOTHING;
