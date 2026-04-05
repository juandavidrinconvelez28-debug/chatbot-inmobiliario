const pool = require("../db/pool");

async function createVisit(visit) {
  const result = await pool.query(
    `
    INSERT INTO visits (
      lead_phone, visit_date, visit_time, status, notes, created_at
    )
    VALUES ($1,$2,$3,$4,$5,NOW())
    RETURNING *;
    `,
    [
      visit.lead_phone,
      visit.visit_date || null,
      visit.visit_time || null,
      visit.status || "pending",
      visit.notes || null,
    ]
  );

  return result.rows[0];
}

module.exports = {
  createVisit,
};