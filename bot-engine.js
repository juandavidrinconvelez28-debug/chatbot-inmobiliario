"use strict";
// ============================================================
// BOT-ENGINE.JS — Motor principal del Chatbot Inmobiliario
// ============================================================

const CONFIG = require("./config");
const fetch = require("node-fetch");
const {
  getSession,
  upsertSession,
} = require("./src/repositories/session.repository");
const { upsertLead } = require("./src/repositories/lead.repository");
const { createVisit } = require("./src/repositories/visit.repository");

// ── LOGGER ────────────────────────────────────────────────────
const logger = {
  info:  (msg, data) => _log("INFO",  msg, data),
  error: (msg, data) => _log("ERROR", msg, data),
  warn:  (msg, data) => _log("WARN",  msg, data),
  bot:   (msg, data) => _log("BOT",   msg, data),
};

function _log(level, msg, data) {
  const ts = new Date().toISOString();
  const icons = { INFO: "ℹ️", ERROR: "❌", WARN: "⚠️", BOT: "🤖" };
  process.stdout.write(`[${ts}] ${icons[level] || "•"} ${msg}\n`);
  if (data) process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

// ── MENSAJES ──────────────────────────────────────────────────
const MENSAJES = {
  bienvenida: () =>
    `🏠 *¡Bienvenido a ${CONFIG.proyecto.nombre}!*\n\n` +
    `Hola, soy tu asesor virtual de bienes raíces. Estoy aquí para ayudarte a encontrar tu apartamento ideal en *${CONFIG.proyecto.ciudad}*. 🌟\n\n` +
    `¿En qué puedo ayudarte hoy?`,

  menuPrincipal: () =>
    `📋 *MENÚ PRINCIPAL*\n\n` +
    `Elige una opción escribiendo el número:\n\n` +
    `1️⃣  Ver el proyecto\n` +
    `2️⃣  📍 Ubicación\n` +
    `3️⃣  💰 Precios y disponibilidad\n` +
    `4️⃣  💳 Formas de pago\n` +
    `5️⃣  📅 Agendar visita\n` +
    `6️⃣  🙋 Hablar con un asesor\n` +
    `7️⃣  📄 Ver brochure / proyecto digital\n` +
    `8️⃣  ❓ Preguntas frecuentes\n\n` +
    `_Escribe el número de tu opción o hazme tu pregunta directamente._`,

  proyecto: () =>
    `🏢 *${CONFIG.proyecto.nombre}*\n\n` +
    `${CONFIG.proyecto.descripcion}\n\n` +
    `📍 *Ubicación:* ${CONFIG.proyecto.ubicacion}\n` +
    `🗓️ *Entrega:* ${CONFIG.proyecto.fechaEntrega}\n\n` +
    `✨ *Amenidades:*\n${CONFIG.amenidades.map((a) => `  • ${a}`).join("\n")}\n\n` +
    `¿Te gustaría ver los precios y disponibilidad? Escribe *3* o dime qué más quieres saber. 😊`,

  ubicacion: () =>
    `📍 *UBICACIÓN DEL PROYECTO*\n\n` +
    `*${CONFIG.proyecto.nombre}* está ubicado en:\n` +
    `🗺️ ${CONFIG.proyecto.ubicacion}, ${CONFIG.proyecto.ciudad}\n\n` +
    `🔗 *Ver en Google Maps:*\n${CONFIG.proyecto.linkUbicacion}\n\n` +
    `La zona cuenta con:\n` +
    `  • Acceso fácil a vías principales\n` +
    `  • Centros comerciales y supermercados\n` +
    `  • Colegios y universidades cercanas\n` +
    `  • Transporte público\n\n` +
    `¿Quieres agendar una visita para conocerlo? Escribe *5* 📅`,

  precios: () => {
    const lineas = CONFIG.apartamentos.map(
      (a) =>
        `*${a.tipo}* (${a.area})\n` +
        `  💰 Precio: ${a.precio}\n` +
        `  🛏️ ${a.habitaciones} hab / 🚿 ${a.banos} baños\n` +
        `  ✅ Disponibles: ${a.disponibles}\n` +
        `  ${a.descripcion}`
    );
    return (
      `💰 *PRECIOS Y DISPONIBILIDAD*\n\n` +
      lineas.join("\n\n") +
      `\n\n⚠️ _Disponibilidad limitada. Los precios pueden cambiar sin previo aviso._\n\n` +
      `¿Te interesa alguna tipología? Escribe *4* para ver formas de pago o *5* para agendar visita. 🔑`
    );
  },

  formasDePago: () =>
    `💳 *FORMAS DE PAGO*\n\n` +
    `*1. Cuota Inicial (${CONFIG.formasDePago.cuotaInicial.porcentaje})*\n` +
    `${CONFIG.formasDePago.cuotaInicial.descripcion}\n\n` +
    `*2. Crédito Hipotecario*\n` +
    `${CONFIG.formasDePago.credito.descripcion}\n` +
    `  • Plazo: ${CONFIG.formasDePago.credito.plazo}\n` +
    `  • Tasa: ${CONFIG.formasDePago.credito.tasaReferencia}\n\n` +
    `*3. Pago de Contado*\n` +
    `${CONFIG.formasDePago.contado.descuento} 🎉\n\n` +
    `*4. Subsidio de Vivienda*\n` +
    `${CONFIG.formasDePago.subsidioCasa.descripcion}\n\n` +
    `💡 _Te asesoramos en el proceso de crédito sin costo adicional._\n\n` +
    `¿Quieres que un asesor te explique cuál opción se ajusta mejor a ti? Escribe *6* o agenda tu visita con el *5*. 😊`,

  brochure: () =>
    `📄 *PROYECTO DIGITAL Y BROCHURE*\n\n` +
    `Accede a toda la información del proyecto:\n\n` +
    `🏠 *Recorrido Virtual 360°:*\n${CONFIG.proyecto.linkDigital}\n\n` +
    `📋 *Brochure Completo:*\n${CONFIG.proyecto.linkBrochure}\n\n` +
    `Encontrarás: planos, renders, especificaciones técnicas y todo sobre el proyecto.\n\n` +
    `¿Tienes alguna pregunta después de verlo? Estoy aquí para ayudarte. 💬`,

  iniciarAgendamiento: () =>
    `📅 *AGENDAR VISITA*\n\n` +
    `¡Perfecto! Visítanos y conoce el proyecto en persona. 🏠✨\n\n` +
    `🕐 *Horario de visitas:*\n${CONFIG.proyecto.horarioVisitas}\n\n` +
    `Para agendarte necesito algunos datos. ¿Me dices tu nombre completo? 😊`,

  solicitarCiudad:         () => `¿Desde qué ciudad nos contactas?`,
  solicitarPresupuesto:    () =>
    `💰 ¿Cuál es tu presupuesto aproximado para el apartamento?\n\n` +
    `1️⃣  Hasta $200 millones\n` +
    `2️⃣  $200M – $350M\n` +
    `3️⃣  $350M – $500M\n` +
    `4️⃣  Más de $500 millones\n\n` +
    `Escribe el número de tu opción.`,

  solicitarTipoApto: () =>
    `¿Qué tipo de apartamento te interesa?\n\n` +
    `1️⃣  Estudio (38 m²)\n` +
    `2️⃣  2 Habitaciones (58 m²)\n` +
    `3️⃣  3 Habitaciones (78 m²)\n` +
    `4️⃣  Penthouse (110 m²)\n` +
    `5️⃣  No he decidido aún`,

  solicitarPropositoCompra: () =>
    `¿Para qué lo vas a usar?\n\n` +
    `1️⃣  🏠 Para vivir\n` +
    `2️⃣  💼 Como inversión / arriendo\n` +
    `3️⃣  Ambos`,

  solicitarFormaPagoPreferida: () =>
    `¿Cómo piensas financiar la compra?\n\n` +
    `1️⃣  Crédito hipotecario\n` +
    `2️⃣  Cuota inicial + crédito\n` +
    `3️⃣  Contado\n` +
    `4️⃣  Subsidio de vivienda\n` +
    `5️⃣  Aún no sé`,

  solicitarFechaVisita: () =>
    `📅 ¿Qué día te queda mejor para visitar el proyecto?\n\n` +
    `Puedes decirme la fecha y hora de tu preferencia. Recuerda que atendemos:\n` +
    `📌 ${CONFIG.proyecto.horarioVisitas}`,

  confirmacionVisita: (datos) =>
    `✅ *¡VISITA CONFIRMADA!*\n\n` +
    `*${datos.nombre}*, quedaste agendado/a para visitar *${CONFIG.proyecto.nombre}*:\n\n` +
    `📅 Fecha: *${datos.fechaVisita}*\n` +
    `📍 Dirección: ${CONFIG.proyecto.ubicacion}\n` +
    `📞 Asesor: ${CONFIG.asesor.nombre}\n\n` +
    `Te esperamos con mucho gusto. Si necesitas cambiar la fecha, escríbenos aquí.\n\n` +
    `_¡Nos vemos pronto!_ 🏠✨`,

  transferenciaAsesor: (nombre) =>
    `👤 *CONECTANDO CON ASESOR*\n\n` +
    `*${nombre || "Estimado cliente"}*, en un momento uno de nuestros asesores estará contigo.\n\n` +
    `Si prefieres, también puedes contactarnos directamente:\n` +
    `📞 *WhatsApp:* ${CONFIG.asesor.telefono}\n` +
    `📧 *Email:* ${CONFIG.asesor.email}\n\n` +
    `_Tiempo de espera promedio: menos de 5 minutos durante horario laboral._`,

  seguimiento1: (nombre) =>
    `👋 Hola *${nombre || ""}*! Soy el asistente virtual de *${CONFIG.proyecto.nombre}*.\n\n` +
    `Vi que estuviste preguntando sobre nuestros apartamentos. ¿Pudiste ver la información que te compartí? 😊\n\n` +
    `Si tienes alguna duda o quieres agendar una visita, aquí estoy. ¡Te espero!`,

  seguimiento2: (nombre) =>
    `🏠 Hola *${nombre || ""}*! Te escribimos desde *${CONFIG.proyecto.nombre}*.\n\n` +
    `Quería contarte que la disponibilidad de apartamentos está bajando rápido. ¡Quedan muy pocas unidades!\n\n` +
    `¿Tienes 5 minutos para que te cuente sobre las últimas opciones disponibles? 💬`,

  reactivacion: (nombre) =>
    `✨ Hola *${nombre || ""}*! ¿Cómo estás?\n\n` +
    `Tenemos *novedades importantes* en *${CONFIG.proyecto.nombre}* que podrían interesarte:\n\n` +
    `🎁 Condiciones especiales de pago este mes\n` +
    `⚡ Últimas unidades disponibles\n\n` +
    `¿Te gustaría que te contara más? 😊`,

  noEntendido: () =>
    `😊 No entendí bien tu mensaje. Escribe el número de la opción que te interesa o hazme tu pregunta directamente.\n\n` +
    `Si prefieres, escribe *menú* para ver todas las opciones.`,

  despedida: (nombre) =>
    `¡Hasta pronto, *${nombre || ""}*! 👋\n\n` +
    `Fue un placer atenderte. Recuerda que estamos disponibles para cualquier consulta sobre *${CONFIG.proyecto.nombre}*.\n\n` +
    `¡Que tengas un excelente día! 🌟`,
};

// ── DETECCIÓN DE INTENCIÓN ────────────────────────────────────
const INTENCIONES = [
  {
    nombre: "SALUDO",
    patrones: [
      /^(hola|buenos|buenas|buen\s*d[íi]a|hi|hey|saludos|qu[eé]\s*tal|qu[eé]\s*hubo)/i,
    ],
  },
  {
    nombre: "MENU",
    patrones: [/^(men[uú]|inicio|volver|regresar|opciones|ayuda|help|\*)$/i],
  },
  {
    nombre: "VER_PROYECTO",
    patrones: [
      /^1$/, /proyecto|residencial|apartamento|apto|conjunto/i,
    ],
  },
  {
    nombre: "UBICACION",
    patrones: [
      /^2$/, /ubicaci[oó]n|d[oó]nde|direcci[oó]n|maps|mapa|zona|barrio|sector/i,
    ],
  },
  {
    nombre: "PRECIOS",
    patrones: [
      /^3$/, /precio|valor|costo|cu[aá]nto|costo|disponib/i,
    ],
  },
  {
    nombre: "FORMAS_PAGO",
    patrones: [
      /^4$/, /pago|financiaci[oó]n|cr[eé]dito|cuota|subsidio|financiar|banco/i,
    ],
  },
  {
    nombre: "AGENDAR_VISITA",
    patrones: [
      /^5$/, /visit|agenda|cita|conocer|ir\s*a\s*ver|cuando\s*puedo|horario/i,
    ],
  },
  {
    nombre: "TRANSFERENCIA_ASESOR",
    patrones: [
      /^6$/, /asesor|humano|persona|ejecutivo|vendedor|hablar\s*con|contactar/i,
    ],
  },
  {
    nombre: "BROCHURE",
    patrones: [
      /^7$/, /brochure|cat[aá]logo|pdf|digital|recorrido|virtual|fotos|renders/i,
    ],
  },
  {
    nombre: "FAQ",
    patrones: [
      /^8$/, /preguntas?\s*frecuentes|faq|m[aá]s\s*info/i,
    ],
  },
  {
    nombre: "DESPEDIDA",
    patrones: [
      /^(adi[oó]s|hasta\s*luego|chao|bye|gracias\s*y?\s*adi[oó]s|nos\s*vemos)$/i,
    ],
  },
];

function detectarIntencion(texto) {
  const t = texto.trim();
  for (const { nombre, patrones } of INTENCIONES) {
    if (patrones.some((p) => p.test(t))) return nombre;
  }
  return null;
}

// ── BÚSQUEDA EN FAQs ──────────────────────────────────────────
function buscarEnFAQs(texto) {
  const t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const faq of CONFIG.faqs) {
    const pregunta = faq.pregunta
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const palabras = pregunta.split(/\s+/).filter((p) => p.length > 3);
    const coincidencias = palabras.filter((p) => t.includes(p)).length;
    if (coincidencias >= Math.min(2, palabras.length)) {
      return faq.respuesta;
    }
  }
  return null;
}

function generarFAQRapida(texto) {
  const resp = buscarEnFAQs(texto);
  if (resp) return resp + "\n\n¿Tienes alguna otra pregunta? Escribe *menú* para ver más opciones.";
  return (
    `❓ *PREGUNTAS FRECUENTES*\n\n` +
    CONFIG.faqs
      .slice(0, 5)
      .map((f, i) => `${i + 1}. ${f.pregunta}`)
      .join("\n") +
    `\n\nEscribe tu pregunta y te respondo. 😊`
  );
}

// ── CALIFICACIÓN DE LEAD ──────────────────────────────────────
function calificarLead(datos) {
  let puntos = 0;
  if (datos.nombre)              puntos += 10;
  if (datos.ciudad)              puntos += 10;
  if (datos.presupuesto && !datos.presupuesto.includes("200M"))
                                 puntos += 20;
  else if (datos.presupuesto)    puntos += 10;
  if (datos.tipoApto && datos.tipoApto !== "Por definir")
                                 puntos += 15;
  if (datos.propositoCompra)     puntos += 10;
  if (datos.formaPagoPreferida && datos.formaPagoPreferida !== "Por definir")
                                 puntos += 15;
  if (datos.fechaVisita)         puntos += 20;
  return Math.min(puntos, 100);
}

// ── NOTIFICACIÓN AL ASESOR ────────────────────────────────────
async function notificarAsesor(sesion) {
  const webhookUrl = process.env.ADVISOR_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    evento: "nuevo_lead",
    timestamp: new Date().toISOString(),
    proyecto: CONFIG.proyecto.nombre,
    lead: {
      telefono: sesion.userId,
      nombre: sesion.datos.nombre || "Sin nombre",
      ciudad: sesion.datos.ciudad || "Sin ciudad",
      presupuesto: sesion.datos.presupuesto || "No indicado",
      tipoApto: sesion.datos.tipoApto || "No indicado",
      proposito: sesion.datos.propositoCompra || "No indicado",
      formaPago: sesion.datos.formaPagoPreferida || "No indicado",
      fechaVisita: sesion.datos.fechaVisita || "Sin fecha",
      nivelInteres: sesion.datos.nivelInteres || "Por calificar",
    },
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    logger.warn("No se pudo notificar al asesor vía webhook.", err.message);
  }
}

// ── GESTIÓN DE SESIONES ───────────────────────────────────────
function sesionVacia(userId) {
  return {
    userId,
    estado: CONFIG.estados.INICIO,
    etapa_captura: null,
    datos: {
      nombre: null,
      telefono: userId,
      ciudad: null,
      presupuesto: null,
      tipoApto: null,
      propositoCompra: null,
      formaPagoPreferida: null,
      fechaVisita: null,
      nivelInteres: null,
      asesorAsignado: CONFIG.asesor.nombre,
    },
    etiqueta: CONFIG.etiquetas.NUEVO,
    historial: [],
    ultimaActividad: Date.now(),
    intentosNoEntendido: 0,
    seguimientos: {
      seguimiento1Enviado: false,
      seguimiento2Enviado: false,
      reactivacionEnviada: false,
    },
  };
}

async function obtenerSesion(userId) {
  const sessionDb = await getSession(userId);

  if (!sessionDb) {
    const nueva = sesionVacia(userId);
    await upsertSession(userId, nueva.estado, nueva);
    return nueva;
  }

  const ctx = sessionDb.context || {};
  return {
    userId,
    estado: ctx.estado || CONFIG.estados.INICIO,
    etapa_captura: ctx.etapa_captura || null,
    datos: {
      nombre:              ctx.datos?.nombre              || null,
      telefono:            ctx.datos?.telefono            || userId,
      ciudad:              ctx.datos?.ciudad              || null,
      presupuesto:         ctx.datos?.presupuesto         || null,
      tipoApto:            ctx.datos?.tipoApto            || null,
      propositoCompra:     ctx.datos?.propositoCompra     || null,
      formaPagoPreferida:  ctx.datos?.formaPagoPreferida  || null,
      fechaVisita:         ctx.datos?.fechaVisita         || null,
      nivelInteres:        ctx.datos?.nivelInteres        || null,
      asesorAsignado:      ctx.datos?.asesorAsignado      || CONFIG.asesor.nombre,
    },
    etiqueta:             ctx.etiqueta              || CONFIG.etiquetas.NUEVO,
    historial:            Array.isArray(ctx.historial) ? ctx.historial : [],
    ultimaActividad:      ctx.ultimaActividad       || Date.now(),
    intentosNoEntendido:  ctx.intentosNoEntendido   || 0,
    seguimientos: {
      seguimiento1Enviado: ctx.seguimientos?.seguimiento1Enviado || false,
      seguimiento2Enviado: ctx.seguimientos?.seguimiento2Enviado || false,
      reactivacionEnviada: ctx.seguimientos?.reactivacionEnviada || false,
    },
  };
}

async function guardarSesion(sesion) {
  sesion.ultimaActividad = Date.now();
  // Limitar el historial a los últimos 50 mensajes para no inflar el JSON
  if (sesion.historial.length > 50) {
    sesion.historial = sesion.historial.slice(-50);
  }
  await upsertSession(sesion.userId, sesion.estado, sesion);
}

// ── FLUJO PRINCIPAL ───────────────────────────────────────────
async function procesarMensaje(userId, mensajeEntrante) {
  const sesion = await obtenerSesion(userId);

  sesion.historial.push({
    rol: "usuario",
    texto: mensajeEntrante,
    timestamp: Date.now(),
  });

  let respuesta = "";

  if (sesion.estado === CONFIG.estados.CAPTURA_DATOS) {
    respuesta = await manejarCapturaDatos(sesion, mensajeEntrante);
    sesion.historial.push({ rol: "bot", texto: respuesta, timestamp: Date.now() });
    await guardarSesion(sesion);
    return respuesta;
  }

  const intencion = detectarIntencion(mensajeEntrante);
  if (intencion) sesion.intentosNoEntendido = 0;

  if (intencion === "SALUDO" || sesion.estado === CONFIG.estados.INICIO) {
    respuesta = MENSAJES.bienvenida() + "\n\n" + MENSAJES.menuPrincipal();
    sesion.estado = CONFIG.estados.MENU_PRINCIPAL;
    sesion.etiqueta = CONFIG.etiquetas.INTERESADO;
  } else if (intencion === "MENU") {
    respuesta = MENSAJES.menuPrincipal();
    sesion.estado = CONFIG.estados.MENU_PRINCIPAL;
  } else if (intencion === "VER_PROYECTO") {
    respuesta = MENSAJES.proyecto();
    sesion.estado = CONFIG.estados.VER_PROYECTO;
  } else if (intencion === "UBICACION") {
    respuesta = MENSAJES.ubicacion();
    sesion.estado = CONFIG.estados.UBICACION;
  } else if (intencion === "PRECIOS") {
    respuesta = MENSAJES.precios();
    sesion.estado = CONFIG.estados.PRECIOS;
  } else if (intencion === "FORMAS_PAGO") {
    respuesta = MENSAJES.formasDePago();
    sesion.estado = CONFIG.estados.FORMAS_PAGO;
  } else if (intencion === "BROCHURE") {
    respuesta = MENSAJES.brochure();
    sesion.estado = CONFIG.estados.BROCHURE;
  } else if (intencion === "AGENDAR_VISITA") {
    sesion.estado = CONFIG.estados.CAPTURA_DATOS;
    sesion.etapa_captura = "nombre";
    respuesta = MENSAJES.iniciarAgendamiento();
  } else if (intencion === "TRANSFERENCIA_ASESOR") {
    respuesta = MENSAJES.transferenciaAsesor(sesion.datos.nombre);
    sesion.estado = CONFIG.estados.TRANSFERENCIA_ASESOR;
    sesion.etiqueta = CONFIG.etiquetas.CALIFICADO;
    await notificarAsesor(sesion);
  } else if (intencion === "FAQ") {
    respuesta = generarFAQRapida(mensajeEntrante);
    sesion.estado = CONFIG.estados.FAQ;
  } else if (intencion === "DESPEDIDA") {
    respuesta = MENSAJES.despedida(sesion.datos.nombre);
    sesion.estado = CONFIG.estados.CIERRE;
  } else {
    const faqResp = buscarEnFAQs(mensajeEntrante);
    if (faqResp) {
      respuesta = faqResp + "\n\n¿Tienes alguna otra pregunta? Escribe *menú* para ver más opciones.";
      sesion.intentosNoEntendido = 0;
    } else {
      sesion.intentosNoEntendido += 1;
      respuesta =
        sesion.intentosNoEntendido >= 2
          ? MENSAJES.noEntendido() +
            "\n\n¿Prefieres que te conecte con un asesor? Escribe *6* para hablar con alguien de nuestro equipo. 😊"
          : MENSAJES.noEntendido();
    }
  }

  sesion.historial.push({ rol: "bot", texto: respuesta, timestamp: Date.now() });
  await guardarSesion(sesion);
  return respuesta;
}

// ── CAPTURA DE DATOS (funnel de agendamiento) ─────────────────
async function manejarCapturaDatos(sesion, texto) {
  const etapa = sesion.etapa_captura;
  const valor = texto.trim();

  if (etapa === "nombre") {
    if (valor.length < 3) return "Por favor, escribe tu nombre completo.";
    sesion.datos.nombre = valor;
    sesion.etapa_captura = "ciudad";
    return MENSAJES.solicitarCiudad();
  }

  if (etapa === "ciudad") {
    if (valor.length < 2) return "Por favor, indica tu ciudad.";
    sesion.datos.ciudad = valor;
    sesion.etapa_captura = "presupuesto";
    return MENSAJES.solicitarPresupuesto();
  }

  if (etapa === "presupuesto") {
    const opciones = { 1: "Hasta $200M", 2: "$200M–$350M", 3: "$350M–$500M", 4: "Más de $500M" };
    sesion.datos.presupuesto = opciones[valor] || valor;
    sesion.etapa_captura = "tipoApto";
    return MENSAJES.solicitarTipoApto();
  }

  if (etapa === "tipoApto") {
    const opciones = { 1: "Estudio", 2: "2 Habitaciones", 3: "3 Habitaciones", 4: "Penthouse", 5: "Por definir" };
    sesion.datos.tipoApto = opciones[valor] || valor;
    sesion.etapa_captura = "proposito";
    return MENSAJES.solicitarPropositoCompra();
  }

  if (etapa === "proposito") {
    const opciones = { 1: "Vivienda", 2: "Inversión", 3: "Ambos" };
    sesion.datos.propositoCompra = opciones[valor] || valor;
    sesion.etapa_captura = "formaPago";
    return MENSAJES.solicitarFormaPagoPreferida();
  }

  if (etapa === "formaPago") {
    const opciones = {
      1: "Crédito hipotecario",
      2: "Cuota inicial + crédito",
      3: "Contado",
      4: "Subsidio",
      5: "Por definir",
    };
    sesion.datos.formaPagoPreferida = opciones[valor] || valor;
    sesion.etapa_captura = "fechaVisita";
    return MENSAJES.solicitarFechaVisita();
  }

  if (etapa === "fechaVisita") {
    sesion.datos.fechaVisita = valor;
    sesion.etapa_captura = null;
    sesion.estado = CONFIG.estados.AGENDAR_VISITA;

    const puntos = calificarLead(sesion.datos);
    sesion.datos.nivelInteres =
      puntos >= 70 ? "Alto" : puntos >= 40 ? "Medio" : "Bajo";
    sesion.etiqueta =
      puntos >= 70 ? CONFIG.etiquetas.VISITA_AGENDADA : CONFIG.etiquetas.CALIFICADO;

    try {
      await upsertLead({
        phone:               sesion.userId,
        full_name:           sesion.datos.nombre,
        city:                sesion.datos.ciudad,
        budget:              sesion.datos.presupuesto,
        apartment_type:      sesion.datos.tipoApto,
        purchase_reason:     sesion.datos.propositoCompra,
        payment_preference:  sesion.datos.formaPagoPreferida,
        interest_level:      sesion.datos.nivelInteres,
        advisor_assigned:    sesion.datos.asesorAsignado || null,
      });

      await createVisit({
        lead_phone:  sesion.userId,
        visit_date:  sesion.datos.fechaVisita,
        visit_time:  "Pendiente confirmar",
        status:      "pending",
        notes:       "Visita registrada desde el bot",
      });

      await notificarAsesor(sesion);
    } catch (error) {
      logger.error("Error guardando lead/visita:", error.message);
    }

    return MENSAJES.confirmacionVisita(sesion.datos);
  }

  return MENSAJES.noEntendido();
}

// ── SEGUIMIENTOS AUTOMÁTICOS ──────────────────────────────────
const pool = require("./src/db/pool");

async function procesarSeguimiento(sendMessageFn = null) {
  let procesados = 0;
  let enviados = 0;
  const telefonos = [];

  const { rows } = await pool.query(`
    SELECT phone, state, context_json, updated_at
    FROM sessions
    WHERE state <> $1
    ORDER BY updated_at ASC
    LIMIT 500
  `, [CONFIG.estados.CIERRE]);

  for (const row of rows) {
    const sesion = await obtenerSesion(row.phone);
    procesados += 1;

    const ahora = Date.now();
    const ultimaActividad = row.updated_at
      ? new Date(row.updated_at).getTime()
      : ahora;
    const inactivoMs = ahora - ultimaActividad;

    let mensaje = null;

    if (inactivoMs >= CONFIG.timeouts.seguimiento3 && !sesion.seguimientos.reactivacionEnviada) {
      mensaje = MENSAJES.reactivacion(sesion.datos.nombre);
      sesion.seguimientos.reactivacionEnviada = true;
    } else if (inactivoMs >= CONFIG.timeouts.seguimiento2 && !sesion.seguimientos.seguimiento2Enviado) {
      mensaje = MENSAJES.seguimiento2(sesion.datos.nombre);
      sesion.seguimientos.seguimiento2Enviado = true;
    } else if (inactivoMs >= CONFIG.timeouts.seguimiento1 && !sesion.seguimientos.seguimiento1Enviado) {
      mensaje = MENSAJES.seguimiento1(sesion.datos.nombre);
      sesion.seguimientos.seguimiento1Enviado = true;
    }

    if (!mensaje) continue;

    sesion.historial.push({ rol: "bot", texto: mensaje, timestamp: Date.now() });
    await guardarSesion(sesion);

    if (typeof sendMessageFn === "function") {
      try {
        await sendMessageFn(sesion.userId, mensaje);
      } catch (err) {
        logger.error(`Error enviando seguimiento a ${sesion.userId}:`, err.message);
      }
    }

    enviados += 1;
    telefonos.push(sesion.userId);
  }

  return { procesados, enviados, telefonos };
}

module.exports = {
  procesarMensaje,
  procesarSeguimiento,
  obtenerSesion,
  sesionVacia,
};
