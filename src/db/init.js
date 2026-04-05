const fs = require("fs");
const path = require("path");
const pool = require("./pool");

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schemaSql);
    console.log("✅ Base de datos inicializada correctamente.");
  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error.message);
    throw error;
  }
}

module.exports = initDb;