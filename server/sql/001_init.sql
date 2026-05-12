CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'therapist', 'parent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_type AS ENUM ('homework', 'classwork');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('pending', 'in-progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'adjusted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  name text NOT NULL,
  email text,
  phone_number text,
  password_hash text NOT NULL,
  credential_status text NOT NULL DEFAULT 'active',
  last_signed_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_or_phone CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_unique_email ON users (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_unique_phone_per_clinic ON users (clinic_id, regexp_replace(phone_number, '\D', '', 'g')) WHERE phone_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  display_name text NOT NULL,
  avatar text,
  birth_date date,
  diagnosis text,
  notes text NOT NULL DEFAULT '',
  personalization_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  skill_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  progression_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_child_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship text NOT NULL,
  invited_at timestamptz,
  invite_code_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(child_id, user_id)
);

CREATE TABLE IF NOT EXISTS therapy_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  domain text NOT NULL,
  title text NOT NULL,
  target_level integer NOT NULL CHECK (target_level BETWEEN 0 AND 100),
  status text NOT NULL CHECK (status IN ('active', 'paused', 'achieved')) DEFAULT 'active',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assigned_family_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type assignment_type NOT NULL,
  game_ids text[] NOT NULL DEFAULT '{}',
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  mode text NOT NULL CHECK (mode IN ('single', 'shared', 'multiplayer')),
  notes text NOT NULL DEFAULT '',
  due_date date NOT NULL,
  status assignment_status NOT NULL DEFAULT 'pending',
  skill_focus text[] NOT NULL DEFAULT '{}',
  support_level text CHECK (support_level IN ('high', 'moderate', 'light')),
  system_suggested_difficulty text CHECK (system_suggested_difficulty IN ('easy', 'medium', 'hard')),
  therapist_approval approval_status NOT NULL DEFAULT 'pending',
  approved_at timestamptz,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  monthly_plan jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL CHECK (duration_seconds >= 0),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  interactions integer NOT NULL CHECK (interactions >= 0),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  skill_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, game_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_role user_role,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS children_clinic_idx ON children(clinic_id);
CREATE INDEX IF NOT EXISTS assignments_child_idx ON assignments(child_id);
CREATE INDEX IF NOT EXISTS results_child_idx ON game_results(child_id);
CREATE INDEX IF NOT EXISTS audit_clinic_created_idx ON audit_log(clinic_id, created_at DESC);
