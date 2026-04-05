const pool = require("../db/pool");

async function upsertLead(lead) {
  const result = await pool.query(
    `
    INSERT INTO leads (
      phone, full_name, city, budget, apartment_type,
      purchase_reason, payment_preference, interest_level,
      advisor_assigned, created_at, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
    ON CONFLICT (phone)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      city = EXCLUDED.city,
      budget = EXCLUDED.budget,
      apartment_type = EXCLUDED.apartment_type,
      purchase_reason = EXCLUDED.purchase_reason,
      payment_preference = EXCLUDED.payment_preference,
      interest_level = EXCLUDED.interest_level,
      advisor_assigned = EXCLUDED.advisor_assigned,
      updated_at = NOW()
    RETURNING *;
    `,
    [
      lead.phone,
      lead.full_name || null,
      lead.city || null,
      lead.budget || null,
      lead.apartment_type || null,
      lead.purchase_reason || null,
      lead.payment_preference || null,
      lead.interest_level || null,
      lead.advisor_assigned || null,
    ]
  );

  return result.rows[0];
}

module.exports = {
  upsertLead,
};