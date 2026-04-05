// ============================================================
// TEST-BOT.JS — Suite de pruebas automáticas
// Ejecutar con: node test-bot.js
// ============================================================

const { procesarMensaje, calificarLead, obtenerSesion } = require("./bot-engine");

let pasados = 0;
let fallidos = 0;

async function probar(descripcion, fn) {
  try {
    await fn();
    console.log(`  ✅ ${descripcion}`);
    pasados++;
  } catch (err) {
    console.log(`  ❌ ${descripcion}\n     → ${err.message}`);
    fallidos++;
  }
}

function assert(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje || "Assertion failed");
}

async function correrPruebas() {
  console.log("\n🧪 PRUEBAS DEL CHATBOT INMOBILIARIO\n" + "=".repeat(50));

  // ── GRUPO 1: BIENVENIDA ───────────────────────────────────
  console.log("\n📋 1. Bienvenida y menú inicial");

  await probar("Responde a 'hola' con bienvenida y menú", async () => {
    const r = await procesarMensaje("test_1", "hola");
    assert(r.toLowerCase().includes("bienvenido") || r.toLowerCase().includes("menú"), "Debe incluir bienvenida o menú");
  });

  await probar("Responde a 'buenas' con bienvenida", async () => {
    const r = await procesarMensaje("test_2", "buenas");
    assert(r.length > 50, "Respuesta demasiado corta");
  });

  await probar("Muestra menú al escribir 'menu'", async () => {
    const r = await procesarMensaje("test_3", "menú");
    assert(r.includes("1") && r.includes("2"), "Debe mostrar opciones numeradas");
  });

  // ── GRUPO 2: OPCIONES DE MENÚ ─────────────────────────────
  console.log("\n📋 2. Opciones del menú principal");

  await probar("Opción 1 muestra el proyecto", async () => {
    await procesarMensaje("test_m1", "hola");
    const r = await procesarMensaje("test_m1", "1");
    assert(r.toLowerCase().includes("proyecto") || r.toLowerCase().includes("amenidad"), "Debe mostrar info del proyecto");
  });

  await probar("Opción 2 muestra ubicación con mapa", async () => {
    await procesarMensaje("test_m2", "hola");
    const r = await procesarMensaje("test_m2", "2");
    assert(r.toLowerCase().includes("ubicaci") || r.toLowerCase().includes("maps"), "Debe mostrar ubicación");
  });

  await probar("Opción 3 muestra precios", async () => {
    await procesarMensaje("test_m3", "hola");
    const r = await procesarMensaje("test_m3", "3");
    assert(r.includes("$") || r.toLowerCase().includes("precio"), "Debe mostrar precios");
  });

  await probar("Opción 4 muestra formas de pago", async () => {
    await procesarMensaje("test_m4", "hola");
    const r = await procesarMensaje("test_m4", "4");
    assert(r.toLowerCase().includes("pago") || r.toLowerCase().includes("crédito"), "Debe mostrar formas de pago");
  });

  await probar("Opción 7 muestra brochure con enlace", async () => {
    await procesarMensaje("test_m7", "hola");
    const r = await procesarMensaje("test_m7", "7");
    assert(r.toLowerCase().includes("brochure") || r.toLowerCase().includes("http"), "Debe mostrar enlace");
  });

  // ── GRUPO 3: AGENDAMIENTO ─────────────────────────────────
  console.log("\n📋 3. Flujo de agendamiento de visita");

  const uid = "test_agenda";
  await probar("Inicia flujo de agendamiento con opción 5", async () => {
    await procesarMensaje(uid, "hola");
    const r = await procesarMensaje(uid, "5");
    assert(r.toLowerCase().includes("nombre") || r.toLowerCase().includes("visita"), "Debe pedir nombre");
  });

  await probar("Captura nombre correctamente", async () => {
    const r = await procesarMensaje(uid, "María García");
    assert(r.toLowerCase().includes("teléfono") || r.toLowerCase().includes("whatsapp"), "Debe pedir teléfono");
  });

  await probar("Valida número de teléfono inválido", async () => {
    const r = await procesarMensaje(uid, "abc123");
    assert(r.toLowerCase().includes("teléfono") || r.toLowerCase().includes("válido"), "Debe rechazar teléfono inválido");
  });

  await probar("Acepta teléfono válido", async () => {
    const r = await procesarMensaje(uid, "3001234567");
    assert(r.length > 10, "Debe avanzar al siguiente paso");
  });

  await probar("Captura ciudad", async () => {
    const r = await procesarMensaje(uid, "Bogotá");
    assert(r.toLowerCase().includes("presupuesto") || r.includes("$"), "Debe pedir presupuesto");
  });

  await probar("Captura presupuesto", async () => {
    const r = await procesarMensaje(uid, "2");
    assert(r.toLowerCase().includes("apartamento") || r.toLowerCase().includes("tipo"), "Debe pedir tipo de apto");
  });

  await probar("Captura tipo de apartamento", async () => {
    const r = await procesarMensaje(uid, "2");
    assert(r.toLowerCase().includes("vivir") || r.toLowerCase().includes("inversión"), "Debe pedir propósito");
  });

  await probar("Captura propósito de compra", async () => {
    const r = await procesarMensaje(uid, "1");
    assert(r.toLowerCase().includes("pago") || r.toLowerCase().includes("crédito"), "Debe pedir forma de pago");
  });

  await probar("Captura forma de pago", async () => {
    const r = await procesarMensaje(uid, "1");
    assert(r.toLowerCase().includes("fecha") || r.toLowerCase().includes("día"), "Debe pedir fecha de visita");
  });

  await probar("Confirma visita correctamente", async () => {
    const r = await procesarMensaje(uid, "Sábado 10 de mayo a las 11am");
    assert(r.toLowerCase().includes("confirm") || r.toLowerCase().includes("agend"), "Debe confirmar la visita");
  });

  // ── GRUPO 4: FAQs ─────────────────────────────────────────
  console.log("\n📋 4. Preguntas frecuentes automáticas");

  await probar("Responde pregunta sobre precio", async () => {
    await procesarMensaje("test_faq1", "hola");
    const r = await procesarMensaje("test_faq1", "¿cuánto cuesta un apartamento?");
    assert(r.includes("$") || r.toLowerCase().includes("precio"), "Debe incluir precio");
  });

  await probar("Responde pregunta sobre cuota inicial", async () => {
    await procesarMensaje("test_faq2", "hola");
    const r = await procesarMensaje("test_faq2", "¿cuánto es la cuota inicial?");
    assert(r.toLowerCase().includes("cuota") || r.includes("%"), "Debe mencionar cuota inicial");
  });

  await probar("Responde pregunta sobre parqueadero", async () => {
    await procesarMensaje("test_faq3", "hola");
    const r = await procesarMensaje("test_faq3", "¿tiene parqueadero?");
    assert(r.toLowerCase().includes("parqueadero") || r.toLowerCase().includes("garaje"), "Debe mencionar parqueadero");
  });

  // ── GRUPO 5: CALIFICACIÓN DE LEADS ───────────────────────
  console.log("\n📋 5. Calificación de leads");

  await probar("Lead vacío tiene puntuación 0", () => {
    const puntos = calificarLead({});
    assert(puntos === 0, `Esperado 0, obtenido ${puntos}`);
  });

  await probar("Lead completo tiene puntuación ≥ 70", () => {
    const datos = {
      nombre: "Juan Pérez",
      telefono: "3001234567",
      presupuesto: "$200M–$350M",
      tipoApto: "2 Habitaciones",
      propositoCompra: "Vivienda",
      formaPagoPreferida: "Crédito",
      fechaVisita: "Sábado 10am",
    };
    const puntos = calificarLead(datos);
    assert(puntos >= 70, `Esperado ≥70, obtenido ${puntos}`);
  });

  await probar("Lead solo con nombre y teléfono tiene 30 puntos", () => {
    const puntos = calificarLead({ nombre: "Juan", telefono: "3001234567" });
    assert(puntos === 30, `Esperado 30, obtenido ${puntos}`);
  });

  // ── GRUPO 6: MANEJO DE ERRORES ────────────────────────────
  console.log("\n📋 6. Manejo de mensajes no reconocidos");

  await probar("Mensaje sin sentido genera respuesta de ayuda", async () => {
    await procesarMensaje("test_err1", "hola");
    const r = await procesarMensaje("test_err1", "asdfghjkl");
    assert(r.length > 20, "Debe dar respuesta aunque no entienda");
  });

  await probar("Detecta intención de despedida", async () => {
    await procesarMensaje("test_bye", "hola");
    const r = await procesarMensaje("test_bye", "adiós");
    assert(r.toLowerCase().includes("hasta") || r.toLowerCase().includes("pronto"), "Debe despedirse");
  });

  await probar("Transfiere a asesor con opción 6", async () => {
    await procesarMensaje("test_asesor", "hola");
    const r = await procesarMensaje("test_asesor", "6");
    assert(r.toLowerCase().includes("asesor") || r.toLowerCase().includes("conectando"), "Debe transferir a asesor");
  });

  // ── RESUMEN ────────────────────────────────────────────────
  console.log("\n" + "=".repeat(50));
  console.log(`📊 RESULTADOS: ${pasados} pasados ✅  |  ${fallidos} fallidos ❌`);
  console.log(`📈 Cobertura: ${Math.round((pasados / (pasados + fallidos)) * 100)}%`);
  if (fallidos === 0) {
    console.log("🎉 ¡Todas las pruebas pasaron correctamente!\n");
  } else {
    console.log("⚠️  Revisa los casos fallidos antes de desplegar.\n");
  }
}

correrPruebas().catch(console.error);
