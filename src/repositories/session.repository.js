const pool = require("../db/pool");

async function getSession(phone) {
  const result = await pool.query(
    `SELECT * FROM sessions WHERE phone = $1 LIMIT 1`,
    [phone]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    phone: row.phone,
    state: row.state,
    context: row.context_json || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function upsertSession(phone, state, context = {}) {
  const result = await pool.query(
    `
    INSERT INTO sessions (phone, state, context_json, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    ON CONFLICT (phone)
    DO UPDATE SET
      state = EXCLUDED.state,
      context_json = EXCLUDED.context_json,
      updated_at = NOW()
    RETURNING *;
    `,
    [phone, state, JSON.stringify(context)]
  );

  return result.rows[0];
}

module.exports = {
  getSession,
  upsertSession,
};