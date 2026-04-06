"use strict";

const fs   = require("fs");
const path = require("path");
const pool = require("./pool");

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql  = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schemaSql);
    process.stdout.write("✅ Base de datos inicializada correctamente.\n");
  } catch (error) {
    process.stderr.write(`❌ Error inicializando base de datos: ${error.message}\n`);
    throw error;
  }
}

module.exports = initDb;
