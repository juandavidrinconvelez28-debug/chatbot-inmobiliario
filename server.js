"use strict";
// ============================================================
// SERVER.JS — Servidor Express para Webhook de WhatsApp
// Compatible con Meta Cloud API y Twilio WhatsApp API
// ============================================================

require("dotenv").config();

const express = require("express");
const path    = require("path");
const fs      = require("fs");
const pool    = require("./src/db/pool");
const initDb  = require("./src/db/init");
const CONFIG  = require("./config");
const fetch   = require("node-fetch");

const {
  procesarMensaje,
  procesarSeguimiento,
  obtenerSesion,
  sesionVacia,
} = require("./bot-engine");

const app = express();

// ── MIDDLEWARES ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Solo se sirven estáticos en producción para el panel admin
app.use(express.static(path.join(__dirname)));

// ── CONFIGURACIÓN ─────────────────────────────────────────────
const PORT             = parseInt(process.env.PORT, 10) || 3000;
const WHATSAPP_TOKEN   = process.env.WHATSAPP_TOKEN   || "";
const VERIFY_TOKEN     = process.env.VERIFY_TOKEN     || "";
const PHONE_NUMBER_ID  = process.env.PHONE_NUMBER_ID  || "";

// ── LOGGER ────────────────────────────────────────────────────
const ICONS = { INFO: "ℹ️", ERROR: "❌", WARN: "⚠️", BOT: "🤖", USER: "👤" };

function log(tipo, msg, data = null) {
  const ts = new Date().toISOString();
  process.stdout.write(`[${ts}] ${ICONS[tipo] || "•"} ${msg}\n`);
  if (data) process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

// ── HEALTH ────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    status:    "OK",
    proyecto:  CONFIG.proyecto.nombre,
    version:   process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, db: "connected", now: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ ok: false, db: "error", error: error.message });
  }
});

app.get("/health/tables", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    res.json({ ok: true, tables: result.rows.map((r) => r.table_name) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════
// MODO A: META / WHATSAPP CLOUD API
// ══════════════════════════════════════════════════════════════

// Verificación de webhook (GET)
app.get("/webhook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    log("INFO", "Webhook de Meta verificado correctamente.");
    return res.status(200).send(challenge);
  }
  log("WARN", "Verificación de webhook fallida.");
  res.sendStatus(403);
});

// Recepción de mensajes (POST)
app.post("/webhook", async (req, res) => {
  // Respondemos 200 de inmediato para que Meta no reintente
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value?.messages) continue;

        for (const msg of value.messages) {
          const userId = msg.from;
          const texto =
            msg.type === "text"
              ? msg.text?.body || ""
              : msg.type === "interactive"
                ? msg.interactive?.button_reply?.title ||
                  msg.interactive?.list_reply?.title  || ""
                : "";

          if (!texto) continue;

          log("USER", `[${userId}] → ${texto}`);
          const respuesta = await procesarMensaje(userId, texto);
          log("BOT",  `[${userId}] ← ${respuesta.substring(0, 80)}…`);

          await enviarMensajeMeta(userId, respuesta);
        }
      }
    }
  } catch (err) {
    log("ERROR", "Error procesando webhook Meta:", err.message);
  }
});

// ══════════════════════════════════════════════════════════════
// MODO B: TWILIO WHATSAPP API
// ══════════════════════════════════════════════════════════════

app.post("/twilio/webhook", async (req, res) => {
  try {
    const userId = req.body.From?.replace("whatsapp:", "");
    const texto  = req.body.Body || "";

    if (!userId || !texto) return res.status(400).send("Bad Request");

    log("USER", `[Twilio][${userId}] → ${texto}`);
    const respuesta = await procesarMensaje(userId, texto);
    log("BOT",  `[Twilio][${userId}] ← ${respuesta.substring(0, 80)}…`);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message to="whatsapp:${userId}">
    ${escapeXml(respuesta)}
  </Message>
</Response>`;

    res.type("text/xml").send(twiml);
  } catch (err) {
    log("ERROR", "Error procesando Twilio:", err.message);
    res.status(500).send("Error interno");
  }
});

// ══════════════════════════════════════════════════════════════
// MODO C: ENDPOINT GENÉRICO (integraciones custom / testing)
// ══════════════════════════════════════════════════════════════

app.post("/message", async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: "Se requieren userId y message" });
    }

    log("USER", `[Generic][${userId}] → ${message}`);
    const respuesta = await procesarMensaje(userId, message);
    log("BOT",  `[Generic][${userId}] ← ${respuesta.substring(0, 80)}…`);

    res.json({ userId, response: respuesta, timestamp: new Date().toISOString() });
  } catch (err) {
    log("ERROR", "Error en endpoint genérico:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ══════════════════════════════════════════════════════════════
// API — SESIONES
// ══════════════════════════════════════════════════════════════

app.get("/api/session/:userId", async (req, res) => {
  try {
    const sesion = await obtenerSesion(req.params.userId);
    res.json(sesion);
  } catch (error) {
    log("ERROR", "Error obteniendo sesión:", error.message);
    res.status(500).json({ error: "No se pudo obtener la sesión" });
  }
});

app.delete("/api/session/:userId", async (req, res) => {
  try {
    const userId    = req.params.userId;
    const nueva     = sesionVacia(userId);
    const { upsertSession } = require("./src/repositories/session.repository");
    await upsertSession(userId, nueva.estado, nueva);
    res.json({ ok: true, session: nueva });
  } catch (error) {
    log("ERROR", "Error reiniciando sesión:", error.message);
    res.status(500).json({ error: "No se pudo reiniciar la sesión" });
  }
});

// ══════════════════════════════════════════════════════════════
// API — DASHBOARD
// ══════════════════════════════════════════════════════════════

app.get("/api/dashboard", async (_req, res) => {
  try {
    const [sessionsResult, leadsResult, visitsResult] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM sessions"),
      pool.query("SELECT COUNT(*)::int AS total FROM leads"),
      pool.query("SELECT COUNT(*)::int AS total FROM visits"),
    ]);

    const totalConversaciones = sessionsResult.rows[0].total;
    const totalLeads          = leadsResult.rows[0].total;
    const totalVisitas        = visitsResult.rows[0].total;
    const conversion          =
      totalLeads > 0 ? Math.round((totalVisitas / totalLeads) * 100) : 0;

    res.json({ totalConversaciones, totalLeads, totalVisitas, conversion });
  } catch (error) {
    log("ERROR", "Error obteniendo dashboard:", error.message);
    res.status(500).json({ error: "No se pudieron obtener métricas" });
  }
});

app.get("/api/dashboard/by-state", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT state, COUNT(*)::int AS total
      FROM sessions
      GROUP BY state
      ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (error) {
    log("ERROR", "Error obteniendo métricas por estado:", error.message);
    res.status(500).json({ error: "No se pudieron obtener métricas por estado" });
  }
});

// ══════════════════════════════════════════════════════════════
// API — LEADS
// ══════════════════════════════════════════════════════════════

app.get("/api/leads", async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit, 10)  || 100, 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const result = await pool.query(`
      SELECT
        l.phone,
        l.full_name,
        l.city,
        l.budget,
        l.apartment_type,
        l.purchase_reason,
        l.payment_preference,
        l.interest_level,
        l.advisor_assigned,
        l.updated_at,
        (
          SELECT v.visit_date
          FROM visits v
          WHERE v.lead_phone = l.phone
          ORDER BY v.created_at DESC
          LIMIT 1
        ) AS visit_date
      FROM leads l
      ORDER BY l.updated_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json(result.rows);
  } catch (error) {
    log("ERROR", "Error obteniendo leads:", error.message);
    res.status(500).json({ error: "No se pudieron obtener los leads" });
  }
});

// ══════════════════════════════════════════════════════════════
// API — CONFIGURACIÓN
// ══════════════════════════════════════════════════════════════

app.get("/api/config", (_req, res) => {
  try {
    res.json({
      proyecto:     CONFIG.proyecto,
      asesor: {
        nombre:   CONFIG.asesor?.nombre,
        telefono: CONFIG.asesor?.telefono,
        email:    CONFIG.asesor?.email,
      },
      amenidades:   CONFIG.amenidades   || [],
      apartamentos: CONFIG.apartamentos || [],
      formasDePago: CONFIG.formasDePago || [],
      faqs:         CONFIG.faqs         || [],
    });
  } catch (error) {
    res.status(500).json({ error: "No se pudo obtener la configuración" });
  }
});

app.get("/api/faqs", (_req, res) => {
  res.json(CONFIG.faqs || []);
});

app.put("/api/config", async (req, res) => {
  // Persiste la configuración editable del proyecto en la base de datos.
  // El archivo config.js sigue siendo la fuente de verdad en arranque;
  // esta tabla permite sobrescribir valores desde el panel admin.
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ ok: false, error: "Payload inválido" });
    }
    await pool.query(
      `INSERT INTO project_config (config_key, value_json, updated_at)
       VALUES ('main', $1, NOW())
       ON CONFLICT (config_key)
       DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()`,
      [JSON.stringify(payload)]
    );
    res.json({ ok: true });
  } catch (error) {
    log("ERROR", "Error guardando configuración:", error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ── Mensajes editables (leídos desde mensajes.json) ──────────
app.get("/api/mensajes", (_req, res) => {
  try {
    const mensajesPath = path.join(__dirname, "mensajes.json");
    const mensajes = JSON.parse(fs.readFileSync(mensajesPath, "utf8"));
    res.json(mensajes);
  } catch (error) {
    log("ERROR", "Error leyendo mensajes.json:", error.message);
    res.status(500).json({ error: "No se pudieron obtener los mensajes" });
  }
});

app.put("/api/mensajes", async (req, res) => {
  try {
    const { key, content } = req.body;
    if (!key || content === undefined) {
      return res.status(400).json({ error: "Se requieren key y content" });
    }
    const mensajesPath = path.join(__dirname, "mensajes.json");
    const mensajes = JSON.parse(fs.readFileSync(mensajesPath, "utf8"));
    mensajes[key] = content;
    fs.writeFileSync(mensajesPath, JSON.stringify(mensajes, null, 2), "utf8");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/prompt", (_req, res) => {
  try {
    const promptPath = path.join(__dirname, "PROMPT.md");
    const content    = fs.readFileSync(promptPath, "utf8");
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: "No se pudo leer el prompt" });
  }
});

app.put("/api/prompt", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Se requiere content" });
    const promptPath = path.join(__dirname, "PROMPT.md");
    fs.writeFileSync(promptPath, content, "utf8");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════
// SEGUIMIENTOS AUTOMÁTICOS — Invocar desde un cron job externo
// POST /api/seguimientos/ejecutar
// ══════════════════════════════════════════════════════════════

app.post("/api/seguimientos/ejecutar", async (_req, res) => {
  try {
    const resultado = await procesarSeguimiento(enviarMensajeMeta);
    res.json({ ok: true, resultado, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════
// ENVÍO DE MENSAJES — Meta Cloud API
// ══════════════════════════════════════════════════════════════

async function enviarMensajeMeta(telefono, texto) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    log("WARN", "WHATSAPP_TOKEN o PHONE_NUMBER_ID no configurados. Mensaje no enviado.");
    return null;
  }

  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to:   telefono,
    type: "text",
    text: { body: texto },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) log("ERROR", "Error enviando mensaje Meta:", data);
    return data;
  } catch (err) {
    log("ERROR", "Fetch error Meta API:", err.message);
    return null;
  }
}

// ── UTILIDADES ────────────────────────────────────────────────
function escapeXml(text) {
  return text
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;");
}

// ── MANEJO DE ERRORES GLOBAL ──────────────────────────────────
app.use((err, _req, res, _next) => {
  log("ERROR", "Error no controlado:", err.message);
  res.status(500).json({ error: "Error interno del servidor" });
});

// ── INICIO DEL SERVIDOR ───────────────────────────────────────
async function startServer() {
  try {
    await initDb();

    app.listen(PORT, "0.0.0.0", () => {
      log("INFO", `🚀 ${CONFIG.proyecto.nombre} — Puerto ${PORT}`);
      log("INFO", "📡 POST /webhook            → Meta Cloud API");
      log("INFO", "📡 POST /twilio/webhook     → Twilio WhatsApp API");
      log("INFO", "📡 POST /message            → Endpoint genérico");
      log("INFO", "📡 POST /api/seguimientos/ejecutar → Cron seguimientos");
    });
  } catch (error) {
    log("ERROR", "No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  }
}

// Manejo limpio de señales de sistema
process.on("SIGTERM", async () => {
  log("INFO", "Señal SIGTERM recibida. Cerrando servidor…");
  await pool.end();
  process.exit(0);
});
process.on("SIGINT", async () => {
  log("INFO", "Señal SIGINT recibida. Cerrando servidor…");
  await pool.end();
  process.exit(0);
});

startServer();

module.exports = app;
