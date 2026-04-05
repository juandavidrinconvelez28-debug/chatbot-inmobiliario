// ============================================================
// BOT-ENGINE.JS — Motor principal del Chatbot Inmobiliario
// Maneja todos los flujos, estados y respuestas del bot
// ============================================================

const CONFIG = require("./config");

// ── SESIONES EN MEMORIA (reemplazar con Redis/BD en producción) ──
const sesiones = new Map();

// ── MENSAJES PREDEFINIDOS ─────────────────────────────────────
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

  solicitarTelefono: (nombre) =>
    `Perfecto, *${nombre}*! 😊\n\n` +
    `¿Cuál es tu número de teléfono o WhatsApp para confirmarte la visita?`,

  solicitarCiudad: () =>
    `¿Desde qué ciudad nos contactas?`,

  solicitarPresupuesto: () =>
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
    `🏗️ Avance de obra al ${Math.floor(Math.random() * 20 + 60)}%\n` +
    `⚡ Últimas unidades disponibles\n\n` +
    `¿Te gustaría que te contara más? 😊`,

  postVisita: (nombre) =>
    `🌟 ¡Hola *${nombre || ""}*! ¿Cómo estás?\n\n` +
    `Espero que tu visita a *${CONFIG.proyecto.nombre}* haya sido de tu agrado. 🏠\n\n` +
    `¿Qué te pareció el proyecto? ¿Tienes alguna duda o quieres avanzar con tu apartamento? Aquí estoy para ayudarte.`,

  noEntendido: () =>
    `😊 No entendí bien tu mensaje. Escribe el número de la opción que te interesa o hazme tu pregunta directamente.\n\n` +
    `Si prefieres, escribe *menú* para ver todas las opciones.`,

  despedida: (nombre) =>
    `¡Hasta pronto, *${nombre || ""}*! 👋\n\n` +
    `Fue un placer atenderte. Recuerda que estamos disponibles para cualquier consulta sobre *${CONFIG.proyecto.nombre}*.\n\n` +
    `¡Que tengas un excelente día! 🌟`,

  timeout: () =>
    `⏰ ¿Sigues ahí? Estoy aquí para ayudarte con cualquier pregunta sobre nuestros apartamentos. Escribe *menú* para continuar o *adiós* para terminar.`,
};

// ── UTILIDADES ────────────────────────────────────────────────

function obtenerSesion(userId) {
  if (!sesiones.has(userId)) {
    sesiones.set(userId, {
      userId,
      estado: CONFIG.estados.INICIO,
      etapa_captura: null,
      datos: {
        nombre: null,
        telefono: null,
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
    });
  }
  return sesiones.get(userId);
}

function guardarSesion(sesion) {
  sesion.ultimaActividad = Date.now();
  sesiones.set(sesion.userId, sesion);
}

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function detectarIntencion(texto) {
  const t = normalizarTexto(texto);

  // Números de menú
  if (t === "1" || t.includes("ver proyecto") || t.includes("proyecto")) return "VER_PROYECTO";
  if (t === "2" || t.includes("ubicacion") || t.includes("donde") || t.includes("mapa")) return "UBICACION";
  if (t === "3" || t.includes("precio") || t.includes("costo") || t.includes("valor") || t.includes("disponibilidad")) return "PRECIOS";
  if (t === "4" || t.includes("forma de pago") || t.includes("credito") || t.includes("financiacion") || t.includes("cuota inicial")) return "FORMAS_PAGO";
  if (t === "5" || t.includes("agendar") || t.includes("visita") || t.includes("cita")) return "AGENDAR_VISITA";
  if (t === "6" || t.includes("asesor") || t.includes("humano") || t.includes("persona") || t.includes("hablar con")) return "TRANSFERENCIA_ASESOR";
  if (t === "7" || t.includes("brochure") || t.includes("catalogo") || t.includes("digital") || t.includes("link") || t.includes("enlace")) return "BROCHURE";
  if (t === "8" || t.includes("pregunta") || t.includes("faq") || t.includes("duda")) return "FAQ";
  if (t.includes("menu") || t.includes("inicio") || t.includes("opciones") || t.includes("ayuda")) return "MENU";
  if (t.includes("adios") || t.includes("hasta luego") || t.includes("chao") || t.includes("bye") || t.includes("gracias")) return "DESPEDIDA";
  if (t.includes("hola") || t.includes("buenas") || t.includes("buen dia") || t.includes("buenos dias")) return "SALUDO";

  return null;
}

function calificarLead(datos) {
  let puntos = 0;
  if (datos.nombre) puntos += 10;
  if (datos.telefono) puntos += 20;
  if (datos.presupuesto) puntos += 15;
  if (datos.tipoApto) puntos += 10;
  if (datos.propositoCompra) puntos += 10;
  if (datos.formaPagoPreferida) puntos += 10;
  if (datos.fechaVisita) puntos += 25;
  return puntos; // 0–100
}

// ── MANEJADOR PRINCIPAL ───────────────────────────────────────

async function procesarMensaje(userId, mensajeEntrante) {
  const sesion = obtenerSesion(userId);
  sesion.historial.push({ rol: "usuario", texto: mensajeEntrante, timestamp: Date.now() });
  sesion.intentosNoEntendido = 0;

  let respuesta = "";

  // ── FLUJO DE CAPTURA DE DATOS (agendamiento) ──────────────
  if (sesion.estado === CONFIG.estados.CAPTURA_DATOS) {
    respuesta = await manejarCapturaDatos(sesion, mensajeEntrante);
    guardarSesion(sesion);
    sesion.historial.push({ rol: "bot", texto: respuesta, timestamp: Date.now() });
    return respuesta;
  }

  // ── DETECCIÓN DE INTENCIÓN ────────────────────────────────
  const intencion = detectarIntencion(mensajeEntrante);

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
    // Intentar responder FAQ automáticamente
    const faqResp = buscarEnFAQs(mensajeEntrante);
    if (faqResp) {
      respuesta = faqResp + "\n\n¿Tienes alguna otra pregunta? Escribe *menú* para ver más opciones.";
    } else {
      sesion.intentosNoEntendido++;
      if (sesion.intentosNoEntendido >= 2) {
        respuesta =
          MENSAJES.noEntendido() +
          "\n\n¿Prefieres que te conecte con un asesor? Escribe *6* para hablar con alguien de nuestro equipo. 😊";
      } else {
        respuesta = MENSAJES.noEntendido();
      }
    }
  }

  guardarSesion(sesion);
  sesion.historial.push({ rol: "bot", texto: respuesta, timestamp: Date.now() });
  return respuesta;
}

// ── FLUJO DE CAPTURA DE DATOS ─────────────────────────────────
async function manejarCapturaDatos(sesion, texto) {
  const etapa = sesion.etapa_captura;

  if (etapa === "nombre") {
    if (texto.trim().length < 3) return "Por favor escribe tu nombre completo. 😊";
    sesion.datos.nombre = texto.trim();
    sesion.etapa_captura = "telefono";
    return MENSAJES.solicitarTelefono(sesion.datos.nombre);
  }

  if (etapa === "telefono") {
    const tel = texto.replace(/\s/g, "");
    if (!/^[\+\d]{7,15}$/.test(tel)) return "Por favor escribe un número de teléfono válido (ej: 3001234567). 📞";
    sesion.datos.telefono = tel;
    sesion.etapa_captura = "ciudad";
    return MENSAJES.solicitarCiudad();
  }

  if (etapa === "ciudad") {
    sesion.datos.ciudad = texto.trim();
    sesion.etapa_captura = "presupuesto";
    return MENSAJES.solicitarPresupuesto();
  }

  if (etapa === "presupuesto") {
    const opciones = { "1": "Hasta $200M", "2": "$200M–$350M", "3": "$350M–$500M", "4": "Más de $500M" };
    sesion.datos.presupuesto = opciones[texto.trim()] || texto.trim();
    sesion.etapa_captura = "tipoApto";
    return MENSAJES.solicitarTipoApto();
  }

  if (etapa === "tipoApto") {
    const opciones = { "1": "Estudio", "2": "2 Habitaciones", "3": "3 Habitaciones", "4": "Penthouse", "5": "Por definir" };
    sesion.datos.tipoApto = opciones[texto.trim()] || texto.trim();
    sesion.etapa_captura = "proposito";
    return MENSAJES.solicitarPropositoCompra();
  }

  if (etapa === "proposito") {
    const opciones = { "1": "Vivienda", "2": "Inversión", "3": "Ambos" };
    sesion.datos.propositoCompra = opciones[texto.trim()] || texto.trim();
    sesion.etapa_captura = "formaPago";
    return MENSAJES.solicitarFormaPagoPreferida();
  }

  if (etapa === "formaPago") {
    const opciones = { "1": "Crédito hipotecario", "2": "Cuota inicial + crédito", "3": "Contado", "4": "Subsidio", "5": "Por definir" };
    sesion.datos.formaPagoPreferida = opciones[texto.trim()] || texto.trim();
    sesion.etapa_captura = "fechaVisita";
    return MENSAJES.solicitarFechaVisita();
  }

  if (etapa === "fechaVisita") {
    sesion.datos.fechaVisita = texto.trim();
    sesion.etapa_captura = null;
    sesion.estado = CONFIG.estados.AGENDAR_VISITA;

    // Calcular nivel de interés
    const puntos = calificarLead(sesion.datos);
    sesion.datos.nivelInteres = puntos >= 70 ? "Alto" : puntos >= 40 ? "Medio" : "Bajo";
    sesion.etiqueta =
      puntos >= 70 ? CONFIG.etiquetas.VISITA_AGENDADA : CONFIG.etiquetas.CALIFICADO;

    // Notificar asesor
    await notificarAsesor(sesion);

    return MENSAJES.confirmacionVisita(sesion.datos);
  }

  return MENSAJES.noEntendido();
}

// ── FAQ AUTOMÁTICO ────────────────────────────────────────────
function buscarEnFAQs(pregunta) {
  const p = normalizarTexto(pregunta);
  const palabrasClave = {
    ubicacion: ["donde", "ubicacion", "lugar", "mapa", "como llegar"],
    precio: ["precio", "costo", "valor", "cuanto cuesta"],
    cuota_inicial: ["cuota inicial", "separacion", "adelanto"],
    credito: ["credito", "banco", "financiacion", "prestamo"],
    area: ["area", "metros", "tamano", "grande"],
    entrega: ["entrega", "cuando", "listo", "terminado"],
    amenidades: ["amenidades", "servicios", "piscina", "gimnasio", "parqueadero"],
    parqueadero: ["parqueadero", "garaje", "carro", "vehiculo"],
    seguridad: ["seguridad", "vigilancia", "porteria", "camara"],
    documentos: ["documentos", "papeles", "requisitos", "separar"],
    subsidio: ["subsidio", "mi casa ya", "caja", "beneficio"],
    inversion: ["inversion", "invertir", "arriendo", "rentabilidad"],
  };

  for (const [clave, palabras] of Object.entries(palabrasClave)) {
    if (palabras.some((pal) => p.includes(pal))) {
      const faq = CONFIG.faqs.find((f) =>
        normalizarTexto(f.pregunta).includes(clave.replace("_", " "))
      );
      if (faq) return `❓ *${faq.pregunta}*\n\n${faq.respuesta}`;
    }
  }
  return null;
}

function generarFAQRapida(pregunta) {
  const resp = buscarEnFAQs(pregunta);
  if (resp) return resp;
  return (
    `❓ *PREGUNTAS FRECUENTES*\n\n` +
    CONFIG.faqs
      .slice(0, 5)
      .map((f, i) => `${i + 1}. ${f.pregunta}`)
      .join("\n") +
    `\n\nEscribe tu pregunta y te respondo al instante. O escribe *6* para hablar con un asesor.`
  );
}

// ── NOTIFICACIÓN A ASESOR ─────────────────────────────────────
async function notificarAsesor(sesion) {
  const datos = sesion.datos;
  const puntos = calificarLead(datos);
  const notif = {
    tipo: "NUEVO_LEAD_CALIFICADO",
    timestamp: new Date().toISOString(),
    lead: {
      nombre: datos.nombre,
      telefono: datos.telefono,
      ciudad: datos.ciudad,
      presupuesto: datos.presupuesto,
      tipoApto: datos.tipoApto,
      proposito: datos.propositoCompra,
      formaPago: datos.formaPagoPreferida,
      fechaVisita: datos.fechaVisita,
      nivelInteres: datos.nivelInteres || (puntos >= 70 ? "Alto" : "Medio"),
      etiqueta: sesion.etiqueta,
      puntuacion: puntos,
    },
    asesorAsignado: CONFIG.asesor.nombre,
  };
  // En producción: enviar webhook, email, Slack, CRM, etc.
  console.log("\n📢 NOTIFICACIÓN A ASESOR:");
  console.log(JSON.stringify(notif, null, 2));
  return notif;
}

// ── SEGUIMIENTO AUTOMÁTICO ────────────────────────────────────
function procesarSeguimiento(userId) {
  const sesion = sesiones.get(userId);
  if (!sesion) return null;

  const tiempoSinActividad = Date.now() - sesion.ultimaActividad;

  if (tiempoSinActividad > CONFIG.timeouts.seguimiento2) {
    return MENSAJES.reactivacion(sesion.datos.nombre);
  } else if (tiempoSinActividad > CONFIG.timeouts.seguimiento1) {
    return MENSAJES.seguimiento2(sesion.datos.nombre);
  } else if (tiempoSinActividad > CONFIG.timeouts.respuesta) {
    return MENSAJES.seguimiento1(sesion.datos.nombre);
  }
  return null;
}

module.exports = {
  procesarMensaje,
  procesarSeguimiento,
  obtenerSesion,
  MENSAJES,
  CONFIG,
  calificarLead,
  notificarAsesor,
};
