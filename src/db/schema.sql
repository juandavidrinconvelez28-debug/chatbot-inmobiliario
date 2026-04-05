CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(30) UNIQUE NOT NULL,
  state VARCHAR(100) DEFAULT 'MENU',
  context_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  city VARCHAR(120),
  budget VARCHAR(120),
  apartment_type VARCHAR(120),
  purchase_reason VARCHAR(120),
  payment_preference VARCHAR(120),
  interest_level VARCHAR(50),
  advisor_assigned VARCHAR(120),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  lead_phone VARCHAR(30) NOT NULL,
  visit_date VARCHAR(50),
  visit_time VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  value_json JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages_config (
  id SERIAL PRIMARY KEY,
  message_key VARCHAR(100) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  trigger_text VARCHAR(255) NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);