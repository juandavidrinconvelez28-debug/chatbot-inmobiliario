-- ============================================================
-- SCHEMA.SQL — Base de datos del Chatbot Inmobiliario
-- Ejecutado en cada inicio con IF NOT EXISTS (idempotente)
-- ============================================================

-- Función para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── SESIONES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           SERIAL PRIMARY KEY,
  phone        VARCHAR(30)  UNIQUE NOT NULL,
  state        VARCHAR(100) NOT NULL DEFAULT 'inicio',
  context_json JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_state      ON sessions(state);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at);

DROP TRIGGER IF EXISTS trg_sessions_updated_at ON sessions;
CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── LEADS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                 SERIAL PRIMARY KEY,
  phone              VARCHAR(30)  UNIQUE NOT NULL,
  full_name          VARCHAR(255),
  city               VARCHAR(120),
  budget             VARCHAR(120),
  apartment_type     VARCHAR(120),
  purchase_reason    VARCHAR(120),
  payment_preference VARCHAR(120),
  interest_level     VARCHAR(50),
  advisor_assigned   VARCHAR(120),
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_interest_level ON leads(interest_level);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at     ON leads(updated_at);

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── VISITAS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id          SERIAL PRIMARY KEY,
  lead_phone  VARCHAR(30) NOT NULL REFERENCES leads(phone) ON DELETE CASCADE,
  visit_date  VARCHAR(50),
  visit_time  VARCHAR(50),
  status      VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes       TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_lead_phone ON visits(lead_phone);
CREATE INDEX IF NOT EXISTS idx_visits_status     ON visits(status);

-- ── CONFIGURACIÓN DEL PROYECTO (editable desde panel) ─────────
CREATE TABLE IF NOT EXISTS project_config (
  id          SERIAL PRIMARY KEY,
  config_key  VARCHAR(100) UNIQUE NOT NULL,
  value_json  JSONB        NOT NULL,
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── MENSAJES EDITABLES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages_config (
  id          SERIAL PRIMARY KEY,
  message_key VARCHAR(100) UNIQUE NOT NULL,
  content     TEXT         NOT NULL,
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── FAQS EDITABLES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id           SERIAL PRIMARY KEY,
  trigger_text VARCHAR(255) NOT NULL,
  answer       TEXT         NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  active       BOOLEAN      NOT NULL DEFAULT TRUE,
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
