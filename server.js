// ============================================================
// SERVER.JS — Servidor Express para Webhook de WhatsApp
// Compatible con Twilio, Meta Cloud API, WhatsApp Business API
// ============================================================

require("dotenv").config();

const express = require("express");
const path = require("path");
const { procesarMensaje } = require("./bot-engine");
const CONFIG = require("./config");
const pool = require("./src/db/pool");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || "";

// ── LOGS ──────────────────────────────────────────────────────
function log(tipo, msg, data = null) {
  const ts = new Date().toISOString();
  const prefijos = { INFO: "ℹ️", ERROR: "❌", WARN: "⚠️", BOT: "🤖", USER: "👤" };
  console.log(`[${ts}] ${prefijos[tipo] || "•"} ${msg}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

// ── SALUD DEL SERVIDOR ────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    proyecto: CONFIG.proyecto.nombre,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});
app.get("/health/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      ok: true,
      db: "connected",
      now: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      db: "error",
      error: error.message
    });
  }
});

// ════════════════════════════════════════════════════════════
// MODO A: META / WHATSAPP CLOUD API
// ════════════════════════════════════════════════════════════

// Verificación de webhook (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    log("INFO", "Webhook de Meta verificado correctamente.");
    res.status(200).send(challenge);
  } else {
    log("WARN", "Verificación de webhook fallida.");
    res.sendStatus(403);
  }
});

// Recepción de mensajes (POST) — Meta Cloud API
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value?.messages) continue;

        for (const msg of value.messages) {
          const userId = msg.from;
          const texto =
            msg.type === "text"
              ? msg.text.body
              : msg.type === "interactive"
              ? msg.interactive?.button_reply?.title ||
                msg.interactive?.list_reply?.title ||
                ""
              : "";

          if (!texto) continue;

          log("USER", `[${userId}] → ${texto}`);
          const respuesta = await procesarMensaje(userId, texto);
          log("BOT", `[${userId}] ← ${respuesta.substring(0, 80)}...`);

          await enviarMensajeMeta(userId, respuesta);
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    log("ERROR", "Error procesando webhook Meta:", err.message);
    res.sendStatus(500);
  }
});

// ════════════════════════════════════════════════════════════
// MODO B: TWILIO WHATSAPP API
// ════════════════════════════════════════════════════════════

app.post("/twilio/webhook", async (req, res) => {
  try {
    const userId = req.body.From?.replace("whatsapp:", "");
    const texto = req.body.Body || "";

    if (!userId || !texto) return res.status(400).send("Bad Request");

    log("USER", `[Twilio][${userId}] → ${texto}`);
    const respuesta = await procesarMensaje(userId, texto);
    log("BOT", `[Twilio][${userId}] ← ${respuesta.substring(0, 80)}...`);

    // Respuesta en formato TwiML
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

// ════════════════════════════════════════════════════════════
// MODO C: ENDPOINT GENÉRICO (para integraciones custom)
// ════════════════════════════════════════════════════════════

app.post("/message", async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: "Se requieren userId y message" });
    }

    log("USER", `[Generic][${userId}] → ${message}`);
    const respuesta = await procesarMensaje(userId, message);
    log("BOT", `[Generic][${userId}] ← ${respuesta.substring(0, 80)}...`);

    res.json({ userId, response: respuesta, timestamp: new Date().toISOString() });
  } catch (err) {
    log("ERROR", "Error en endpoint genérico:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ════════════════════════════════════════════════════════════
// SEGUIMIENTOS AUTOMÁTICOS — Ejecutar en cron job
// ════════════════════════════════════════════════════════════

app.post("/seguimientos/ejecutar", async (req, res) => {
  // En producción: llamar desde cron job cada hora
  // Ejemplo con cURL: curl -X POST http://localhost:3000/seguimientos/ejecutar
  log("INFO", "Ejecutando seguimientos automáticos...");
  res.json({ mensaje: "Seguimientos procesados", timestamp: new Date().toISOString() });
});

// ════════════════════════════════════════════════════════════
// ENVIAR MENSAJES — Meta API
// ════════════════════════════════════════════════════════════

async function enviarMensajeMeta(telefono, texto) {
  
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
  log("WARN", "WHATSAPP_TOKEN o PHONE_NUMBER_ID no configurados. No se envió mensaje a Meta.");
  return null;
}
  
  const payload = {
    messaging_product: "whatsapp",
    to: telefono,
    type: "text",
    text: { body: texto },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) log("ERROR", "Error enviando mensaje Meta:", data);
    return data;
  } catch (err) {
    log("ERROR", "Fetch error Meta API:", err.message);
  }
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── INICIAR SERVIDOR ──────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  log("INFO", `🚀 Servidor del Chatbot ${CONFIG.proyecto.nombre} corriendo en puerto ${PORT}`);
  log("INFO", `📡 Webhook Meta: POST http://localhost:${PORT}/webhook`);
  log("INFO", `📡 Webhook Twilio: POST http://localhost:${PORT}/twilio/webhook`);
  log("INFO", `📡 Endpoint genérico: POST http://localhost:${PORT}/message`);
});

module.exports = app;
