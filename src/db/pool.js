"use strict";

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  // Límites de conexión recomendados para producción
  max:             10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  process.stderr.write(`[PG Pool] Error inesperado: ${err.message}\n`);
});

module.exports = pool;
