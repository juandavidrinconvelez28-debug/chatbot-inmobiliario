// ============================================================
// CONFIG.JS — Configuración central del Chatbot Inmobiliario
// Edita este archivo con los datos reales del proyecto
// ============================================================

const CONFIG = {
  // ── PROYECTO ────────────────────────────────────────────
  proyecto: {
    nombre: "NOMBRE DEL PROYECTO",
    ciudad: "CIUDAD",
    ubicacion: "UBICACIÓN EXACTA O ZONA",
    descripcion: "Moderno proyecto residencial en el corazón de la ciudad, diseñado para quienes buscan calidad de vida e inversión inteligente.",
    linkDigital: "https://link-del-proyecto.com",
    linkBrochure: "https://link-brochure.com",
    linkUbicacion: "https://maps.google.com/?q=UBICACION",
    imagenProyecto: "https://imagen-proyecto.com/foto.jpg",
    horarioVisitas: "Lunes a Sábado 9:00 AM – 6:00 PM / Domingos 10:00 AM – 4:00 PM",
    fechaEntrega: "Diciembre 2026",
  },

  // ── ASESOR / EQUIPO COMERCIAL ────────────────────────────
  asesor: {
    nombre: "Equipo Comercial",
    telefono: "+57 300 000 0000",
    whatsapp: "573000000000",
    email: "ventas@proyecto.com",
  },

  // ── APARTAMENTOS ─────────────────────────────────────────
  apartamentos: [
    {
      tipo: "Estudio",
      area: "38 m²",
      habitaciones: 1,
      banos: 1,
      precio: "$180.000.000",
      disponibles: 5,
      descripcion: "Ideal para inversión o primera vivienda. Acabados modernos y balcón.",
    },
    {
      tipo: "2 Habitaciones",
      area: "58 m²",
      habitaciones: 2,
      banos: 2,
      precio: "$280.000.000",
      disponibles: 8,
      descripcion: "Perfecto para parejas o familias pequeñas. Cocina integral y zona de ropas.",
    },
    {
      tipo: "3 Habitaciones",
      area: "78 m²",
      habitaciones: 3,
      banos: 2,
      precio: "$380.000.000",
      disponibles: 4,
      descripcion: "Espacioso y luminoso. Cuarto de servicio, doble parqueadero incluido.",
    },
    {
      tipo: "Penthouse",
      area: "110 m²",
      habitaciones: 3,
      banos: 3,
      precio: "$580.000.000",
      disponibles: 2,
      descripcion: "Terraza privada, vistas panorámicas y acabados premium. Exclusivo.",
    },
  ],

  // ── FORMAS DE PAGO ────────────────────────────────────────
  formasDePago: {
    cuotaInicial: {
      porcentaje: "30%",
      descripcion: "Cuota inicial del 30% durante la construcción en cuotas mensuales diferidas.",
    },
    credito: {
      descripcion: "Financiación con entidades bancarias aliadas: Bancolombia, Davivienda, BBVA.",
      plazo: "Hasta 30 años",
      tasaReferencia: "Desde 10.9% E.A.",
    },
    contado: {
      descuento: "Descuento especial del 3% al pagar de contado.",
    },
    subsidioCasa: {
      aplica: true,
      descripcion: "Aplica para subsidios de vivienda del Gobierno (Mi Casa Ya, Caja de Compensación).",
    },
  },

  // ── AMENIDADES ────────────────────────────────────────────
  amenidades: [
    "Piscina adultos y niños",
    "Gimnasio equipado",
    "Salón social",
    "Zona BBQ",
    "Parque infantil",
    "Coworking",
    "Portería 24/7",
    "Parqueadero cubierto",
    "Bicicletero",
    "Zonas verdes",
  ],

  // ── FAQS ─────────────────────────────────────────────────
  faqs: [
    {
      pregunta: "¿Dónde está ubicado el proyecto?",
      respuesta: "El proyecto está ubicado en [UBICACIÓN], una zona estratégica con fácil acceso a vías principales, centros comerciales, colegios y transporte público. Te comparto la ubicación exacta: [LINK_MAPS]",
    },
    {
      pregunta: "¿Cuáles son los precios?",
      respuesta: "Los precios van desde $180.000.000 para estudios hasta $580.000.000 para penthouses. Todos los precios incluyen parqueadero y cuarto útil. Disponibilidad limitada.",
    },
    {
      pregunta: "¿Cuánto es la cuota inicial?",
      respuesta: "La cuota inicial es del 30% del valor del apartamento, diferida en cuotas mensuales durante la construcción. Por ejemplo, para un apto de $280M, la cuota inicial sería $84M pagadera en cómodas mensualidades.",
    },
    {
      pregunta: "¿Con qué bancos puedo financiar?",
      respuesta: "Trabajamos con Bancolombia, Davivienda, BBVA y otras entidades. El crédito puede ser hasta por el 70% del valor, a plazos de hasta 30 años.",
    },
    {
      pregunta: "¿Cuál es el área de los apartamentos?",
      respuesta: "Tenemos desde 38 m² (estudios) hasta 110 m² (penthouses). Cada tipología incluye balcón, zonas comunes y acabados de primera calidad.",
    },
    {
      pregunta: "¿Cuándo es la entrega?",
      respuesta: "La entrega estimada es en Diciembre 2026, cumpliendo con todos los estándares de calidad y normativa vigente.",
    },
    {
      pregunta: "¿Qué amenidades tiene el proyecto?",
      respuesta: "El proyecto cuenta con: piscina, gimnasio, salón social, zona BBQ, parque infantil, coworking, portería 24/7, parqueadero cubierto, bicicletero y amplias zonas verdes.",
    },
    {
      pregunta: "¿El parqueadero está incluido?",
      respuesta: "Sí, todos los apartamentos incluyen un parqueadero cubierto. El penthouse y los de 3 habitaciones incluyen doble parqueadero.",
    },
    {
      pregunta: "¿El proyecto tiene seguridad?",
      respuesta: "Sí, contamos con portería 24/7, CCTV en áreas comunes, control de acceso biométrico y zonas perimetrales seguras.",
    },
    {
      pregunta: "¿Qué documentos necesito para separar?",
      respuesta: "Para separar solo necesitas: copia de cédula, carta laboral o certificado de ingresos y el pago de la cuota de separación ($2.000.000). El proceso es rápido y 100% digital.",
    },
    {
      pregunta: "¿Aplica para subsidio de vivienda?",
      respuesta: "Sí, aplica para Mi Casa Ya, subsidios de Caja de Compensación y otros beneficios del Gobierno. Te asesoramos en el proceso sin costo.",
    },
    {
      pregunta: "¿Puedo comprar como inversión?",
      respuesta: "¡Claro! Es una excelente inversión. La zona tiene alta valorización y el proyecto es apto para arriendo. La rentabilidad estimada es entre 5% y 7% anual.",
    },
  ],

  // ── ESTADOS DEL BOT ───────────────────────────────────────
  estados: {
    INICIO: "inicio",
    MENU_PRINCIPAL: "menu_principal",
    VER_PROYECTO: "ver_proyecto",
    UBICACION: "ubicacion",
    PRECIOS: "precios",
    FORMAS_PAGO: "formas_pago",
    AGENDAR_VISITA: "agendar_visita",
    CAPTURA_DATOS: "captura_datos",
    CALIFICACION: "calificacion",
    FAQ: "faq",
    BROCHURE: "brochure",
    TRANSFERENCIA_ASESOR: "transferencia_asesor",
    SEGUIMIENTO: "seguimiento",
    CIERRE: "cierre",
    TIMEOUT: "timeout",
  },

  // ── TIMEOUTS (en ms) ──────────────────────────────────────
  timeouts: {
    respuesta: 30000,        // 30s sin respuesta → reenganche
    abandonado: 3600000,     // 1h → lead frío
    seguimiento1: 86400000,  // 24h → primer seguimiento
    seguimiento2: 259200000, // 3 días → segundo seguimiento
    seguimiento3: 604800000, // 7 días → reactivación
  },

  // ── ETIQUETAS DE LEAD ─────────────────────────────────────
  etiquetas: {
    NUEVO: "🆕 Nuevo Lead",
    INTERESADO: "🔥 Interesado",
    CALIFICADO: "⭐ Calificado",
    VISITA_AGENDADA: "📅 Visita Agendada",
    EN_PROCESO: "🔄 En Proceso",
    FRIO: "❄️ Frío",
    CERRADO: "✅ Cerrado",
    PERDIDO: "❌ Perdido",
  },
};

module.exports = CONFIG;
