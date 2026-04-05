# ============================================================
# DOCUMENTACION-TECNICA.md
# Documentación completa del Chatbot Inmobiliario WhatsApp
# ============================================================

## 1. RESUMEN DEL CHATBOT

### ¿Qué hace?
Chatbot de ventas inmobiliarias para WhatsApp que automatiza el proceso de captación y calificación de prospectos interesados en comprar apartamentos, desde el primer contacto hasta el agendamiento de visita.

### Objetivos que cumple
| Objetivo | Estado |
|----------|--------|
| Captar leads 24/7 | ✅ |
| Responder preguntas frecuentes | ✅ |
| Presentar el proyecto | ✅ |
| Compartir ubicación y brochure | ✅ |
| Explicar precios y formas de pago | ✅ |
| Calificar prospectos | ✅ |
| Capturar datos de contacto | ✅ |
| Agendar visitas | ✅ |
| Derivar a asesor humano | ✅ |
| Hacer seguimiento automático | ✅ |

### Beneficios al negocio
- **Disponibilidad 24/7**: Captura leads fuera del horario comercial
- **Calificación automática**: Solo leads calificados llegan al asesor
- **Tiempo de respuesta inmediato**: 0 segundos vs minutos/horas humanas
- **Reducción de carga**: Asesores se enfocan en leads calificados
- **Trazabilidad**: Registro completo de cada conversación y lead
- **Escala**: Atiende decenas de conversaciones simultáneas

---

## 2. ÁRBOL CONVERSACIONAL

```
INICIO
│
├── [Saludo / Primer mensaje]
│   └── BIENVENIDA + MENÚ PRINCIPAL
│       │
│       ├── [1] VER PROYECTO
│       │   ├── Descripción del proyecto
│       │   ├── Amenidades
│       │   └── → CTA: Agendar visita o Ver precios
│       │
│       ├── [2] UBICACIÓN
│       │   ├── Dirección exacta
│       │   ├── Link Google Maps
│       │   ├── Ventajas de la zona
│       │   └── → CTA: Agendar visita
│       │
│       ├── [3] PRECIOS Y DISPONIBILIDAD
│       │   ├── Tabla de tipologías
│       │   ├── Precio por tipo
│       │   ├── Disponibilidad actual
│       │   └── → CTA: Ver formas de pago / Agendar
│       │
│       ├── [4] FORMAS DE PAGO
│       │   ├── Cuota inicial (30%)
│       │   ├── Crédito hipotecario
│       │   ├── Contado (descuento)
│       │   ├── Subsidios
│       │   └── → CTA: Hablar con asesor / Agendar
│       │
│       ├── [5] AGENDAR VISITA ← FLUJO PRINCIPAL
│       │   │
│       │   ├── Solicitar nombre
│       │   ├── Validar → Solicitar teléfono
│       │   ├── Validar → Solicitar ciudad
│       │   ├── Solicitar presupuesto (opciones 1-4)
│       │   ├── Solicitar tipo de apto (opciones 1-5)
│       │   ├── Solicitar propósito (vivir/invertir)
│       │   ├── Solicitar forma de pago preferida
│       │   ├── Solicitar fecha de visita
│       │   ├── → CONFIRMACIÓN DE VISITA
│       │   └── → NOTIFICACIÓN A ASESOR (webhook)
│       │
│       ├── [6] HABLAR CON ASESOR
│       │   ├── Mensaje de transferencia
│       │   ├── Datos de contacto directo
│       │   └── → NOTIFICACIÓN A ASESOR (webhook)
│       │
│       ├── [7] BROCHURE / PROYECTO DIGITAL
│       │   ├── Link recorrido virtual
│       │   ├── Link brochure PDF
│       │   └── → CTA: ¿Tienes preguntas?
│       │
│       └── [8] PREGUNTAS FRECUENTES
│           ├── Detección automática por palabras clave
│           ├── Respuesta de la FAQ correspondiente
│           └── → CTA: Menú / Asesor
│
├── [Mensaje no reconocido]
│   ├── Intento 1 → Sugerir menú
│   ├── Intento 2 → Ofrecer asesor humano
│   └── Intento 3+ → Transferir automáticamente
│
└── [Despedida]
    └── Mensaje de cierre + CTA final
```

---

## 3. ESTADOS DEL CHATBOT

| Estado | Descripción | Siguiente estado posible |
|--------|-------------|--------------------------|
| `inicio` | Primera interacción | `menu_principal` |
| `menu_principal` | Mostrando opciones | Cualquier estado |
| `ver_proyecto` | Información del proyecto | `menu_principal`, `agendar_visita` |
| `ubicacion` | Mostrando ubicación | `menu_principal`, `agendar_visita` |
| `precios` | Mostrando precios | `formas_pago`, `agendar_visita` |
| `formas_pago` | Explicando financiación | `agendar_visita`, `transferencia_asesor` |
| `captura_datos` | Recopilando información | `agendar_visita` (al completar) |
| `agendar_visita` | Visita confirmada | `cierre` |
| `brochure` | Compartiendo enlaces | `menu_principal` |
| `faq` | Respondiendo FAQ | `menu_principal` |
| `transferencia_asesor` | Derivado a humano | `cierre` |
| `seguimiento` | Reenganche automático | `menu_principal` |
| `cierre` | Conversación cerrada | `inicio` (si vuelve) |
| `timeout` | Sin actividad | `menu_principal` (si responde) |

---

## 4. VARIABLES DE SESIÓN

### Obligatorias (para agendar visita)
| Variable | Tipo | Descripción | Validación |
|----------|------|-------------|------------|
| `nombre` | string | Nombre completo del prospecto | Min 3 chars |
| `telefono` | string | WhatsApp de contacto | Regex `/^[\+\d]{7,15}$/` |
| `fechaVisita` | string | Fecha y hora de visita deseada | Free text |

### Recomendadas (para calificación)
| Variable | Tipo | Descripción | Opciones |
|----------|------|-------------|----------|
| `ciudad` | string | Ciudad de residencia | Free text |
| `presupuesto` | string | Rango de presupuesto | 4 opciones |
| `tipoApto` | string | Tipología de interés | 5 opciones |
| `propositoCompra` | string | Vivir / Invertir / Ambos | 3 opciones |
| `formaPagoPreferida` | string | Método de pago preferido | 5 opciones |

### Internas (calculadas por el bot)
| Variable | Tipo | Descripción |
|----------|------|-------------|
| `nivelInteres` | string | Alto / Medio / Bajo (calculado) |
| `etiqueta` | string | Etiqueta del CRM |
| `puntuacion` | number | Score 0–100 |
| `asesorAsignado` | string | Nombre del asesor |
| `ultimaActividad` | timestamp | Para seguimientos |
| `intentosNoEntendido` | number | Para transferencia automática |

---

## 5. INTENCIONES Y ENTIDADES

### Intenciones detectadas
| Intención | Palabras clave / patrones |
|-----------|--------------------------|
| `SALUDO` | hola, buenas, buen día, buenos días |
| `VER_PROYECTO` | 1, proyecto, ver proyecto |
| `UBICACION` | 2, ubicación, dónde, mapa, cómo llegar |
| `PRECIOS` | 3, precio, costo, valor, disponibilidad |
| `FORMAS_PAGO` | 4, forma de pago, crédito, financiación, cuota inicial |
| `AGENDAR_VISITA` | 5, agendar, visita, cita, quiero ver |
| `TRANSFERENCIA_ASESOR` | 6, asesor, humano, persona, hablar con |
| `BROCHURE` | 7, brochure, catálogo, digital, link, enlace |
| `FAQ` | 8, pregunta, duda, cómo funciona |
| `MENU` | menú, inicio, opciones, ayuda |
| `DESPEDIDA` | adiós, hasta luego, chao, bye, gracias |

### Entidades capturadas
| Entidad | Tipo | Ejemplo |
|---------|------|---------|
| `NOMBRE` | string | "María García" |
| `TELEFONO` | regex | "3001234567", "+57300..." |
| `PRESUPUESTO` | enum | Hasta $200M, $200M–$350M... |
| `TIPO_APTO` | enum | Estudio, 2 Hab, 3 Hab, Penthouse |
| `PROPOSITO` | enum | Vivienda, Inversión, Ambos |
| `FORMA_PAGO` | enum | Crédito, Contado, Subsidio... |
| `FECHA_VISITA` | free text | "Sábado a las 10am" |

---

## 6. JSON DEL MENÚ PRINCIPAL

```json
{
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "🏠 NOMBRE DEL PROYECTO"
    },
    "body": {
      "text": "Bienvenido/a. ¿En qué puedo ayudarte hoy?"
    },
    "footer": {
      "text": "Elige una opción para continuar"
    },
    "action": {
      "button": "Ver opciones",
      "sections": [
        {
          "title": "Información del Proyecto",
          "rows": [
            { "id": "VER_PROYECTO", "title": "🏢 Ver el proyecto", "description": "Descripción, amenidades y más" },
            { "id": "UBICACION", "title": "📍 Ubicación", "description": "Dónde estamos y cómo llegar" },
            { "id": "PRECIOS", "title": "💰 Precios y disponibilidad", "description": "Tipologías y precios actuales" },
            { "id": "BROCHURE", "title": "📄 Brochure / Proyecto digital", "description": "Catálogo y recorrido virtual" }
          ]
        },
        {
          "title": "Compra y Asesoría",
          "rows": [
            { "id": "FORMAS_PAGO", "title": "💳 Formas de pago", "description": "Crédito, cuota inicial, subsidios" },
            { "id": "AGENDAR_VISITA", "title": "📅 Agendar visita", "description": "Visita el proyecto sin compromiso" },
            { "id": "TRANSFERENCIA_ASESOR", "title": "🙋 Hablar con asesor", "description": "Atención personalizada" },
            { "id": "FAQ", "title": "❓ Preguntas frecuentes", "description": "Resuelve tus dudas" }
          ]
        }
      ]
    }
  }
}
```

---

## 7. WEBHOOK — REQUEST Y RESPONSE

### Webhook entrante (Meta → Tu servidor)
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "573001234567",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": { "name": "Juan Pérez" },
          "wa_id": "573009876543"
        }],
        "messages": [{
          "from": "573009876543",
          "id": "wamid.HBgNNTczMDA5ODc2NTQzFQIAERgSM...",
          "timestamp": "1697123456",
          "text": { "body": "hola" },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Respuesta que envías (Tu servidor → Meta API)
```json
{
  "messaging_product": "whatsapp",
  "to": "573009876543",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "🏠 *¡Bienvenido a NOMBRE DEL PROYECTO!*\n\nHola, soy tu asesor virtual..."
  }
}
```

### Notificación a asesor (Tu servidor → CRM/Webhook)
```json
{
  "tipo": "NUEVO_LEAD_CALIFICADO",
  "timestamp": "2025-10-01T14:30:00.000Z",
  "lead": {
    "nombre": "Juan Pérez",
    "telefono": "3009876543",
    "ciudad": "Bogotá",
    "presupuesto": "$200M–$350M",
    "tipoApto": "2 Habitaciones",
    "proposito": "Vivienda",
    "formaPago": "Crédito hipotecario",
    "fechaVisita": "Sábado 10am",
    "nivelInteres": "Alto",
    "etiqueta": "📅 Visita Agendada",
    "puntuacion": 90
  },
  "asesorAsignado": "Equipo Comercial"
}
```

---

## 8. AUTOMATIZACIONES RECOMENDADAS

### Seguimientos automáticos
| Trigger | Mensaje | Cuándo |
|---------|---------|--------|
| Sin respuesta 30min | Reenganche suave | `seguimiento1` |
| Sin actividad 24h | Mensaje con urgencia (disponibilidad) | `seguimiento2` |
| Frío 7 días | Reactivación con novedad | `reactivacion` |
| Visita agendada +24h | Mensaje post-visita | `postVisita` |

### Etiquetas del CRM por comportamiento
| Etiqueta | Condición |
|----------|-----------|
| 🆕 Nuevo Lead | Primer contacto |
| 🔥 Interesado | Completó el menú |
| ⭐ Calificado | Dio nombre + teléfono + presupuesto |
| 📅 Visita Agendada | Completó flujo de agendamiento |
| ❄️ Frío | Sin actividad > 7 días |
| ✅ Cerrado | Compra realizada |

---

## 9. REGLAS DE NEGOCIO

1. **Derivación automática a humano**: Si el bot no entiende 3 mensajes consecutivos
2. **Notificación prioritaria**: Leads con puntuación ≥ 70 notifican al asesor inmediatamente
3. **No repetir preguntas**: El bot recuerda toda la sesión y no vuelve a pedir datos ya dados
4. **Timeout amable**: Después de 30 segundos sin respuesta, envía mensaje de reenganche (máximo 1 vez)
5. **Validación de teléfono**: Solo acepta números con 7–15 dígitos (acepta +57, +1, etc.)
6. **Fuera de horario**: Informar horario y ofrecer dejar datos para ser contactado
7. **Privacidad**: No compartir datos del lead con terceros no autorizados

---

## 10. PSEUDOCÓDIGO DEL FLUJO PRINCIPAL

```
FUNCIÓN procesarMensaje(userId, texto):

  sesion = obtenerOCrearSesion(userId)
  
  SI sesion.estado == CAPTURA_DATOS:
    respuesta = manejarCapturaDatos(sesion, texto)
    RETORNAR respuesta
  
  intencion = detectarIntencion(texto)
  
  SWITCH intencion:
    CASO "SALUDO" o estado == INICIO:
      respuesta = bienvenida() + menu()
      sesion.estado = MENU_PRINCIPAL
    
    CASO "VER_PROYECTO":
      respuesta = mostrarProyecto()
    
    CASO "UBICACION":
      respuesta = mostrarUbicacion()
    
    CASO "PRECIOS":
      respuesta = mostrarPrecios()
    
    CASO "FORMAS_PAGO":
      respuesta = mostrarFormasDePago()
    
    CASO "AGENDAR_VISITA":
      sesion.estado = CAPTURA_DATOS
      sesion.etapa = "nombre"
      respuesta = solicitarNombre()
    
    CASO "TRANSFERENCIA_ASESOR":
      respuesta = transferirAsesor()
      notificarAsesor(sesion)
    
    CASO "DESPEDIDA":
      respuesta = despedida()
    
    DEFAULT:
      faq = buscarEnFAQs(texto)
      SI faq:
        respuesta = faq
      SINO:
        sesion.intentos++
        SI sesion.intentos >= 3:
          respuesta = transferirAsesor()
        SINO:
          respuesta = noEntendido()
  
  guardarSesion(sesion)
  RETORNAR respuesta


FUNCIÓN manejarCapturaDatos(sesion, texto):
  
  SWITCH sesion.etapa:
    CASO "nombre":
      SI texto.longitud < 3: RETORNAR "Nombre inválido"
      sesion.datos.nombre = texto
      sesion.etapa = "telefono"
      RETORNAR solicitarTelefono(nombre)
    
    CASO "telefono":
      SI NO validarTelefono(texto): RETORNAR "Teléfono inválido"
      sesion.datos.telefono = texto
      sesion.etapa = "ciudad"
      RETORNAR solicitarCiudad()
    
    CASO "ciudad":
      sesion.datos.ciudad = texto
      sesion.etapa = "presupuesto"
      RETORNAR solicitarPresupuesto()
    
    [... continúa para cada campo ...]
    
    CASO "fechaVisita":
      sesion.datos.fechaVisita = texto
      sesion.estado = AGENDAR_VISITA
      puntuacion = calificarLead(sesion.datos)
      notificarAsesor(sesion)
      RETORNAR confirmacionVisita(sesion.datos)
```

---

## 11. GUÍA DE INSTALACIÓN RÁPIDA

```bash
# 1. Clonar o crear el proyecto
mkdir chatbot-inmobiliario && cd chatbot-inmobiliario

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus datos reales

# 4. Editar config.js con los datos del proyecto
# (nombre, precios, ubicación, etc.)

# 5. Probar en modo demo (sin WhatsApp)
node demo-cli.js

# 6. Correr pruebas automáticas
node test-bot.js

# 7. Iniciar servidor
node server.js
# o en desarrollo:
npm run dev

# 8. Exponer con ngrok para pruebas locales
npx ngrok http 3000
# Usar la URL de ngrok como webhook en Meta/Twilio
```

---

## 12. CHECKLIST DE LANZAMIENTO

- [ ] Llenar `config.js` con datos reales del proyecto
- [ ] Llenar `PROMPT.md` con datos reales (para versión con IA)
- [ ] Configurar `.env` con tokens de WhatsApp API
- [ ] Correr `node test-bot.js` — todos los tests deben pasar
- [ ] Configurar webhook en Meta Developers o Twilio
- [ ] Probar conversación completa en WhatsApp real
- [ ] Configurar notificación a asesor (webhook/email/Slack)
- [ ] Activar seguimientos automáticos (cron job)
- [ ] Configurar dominio con SSL (HTTPS requerido por Meta)
- [ ] Monitorear logs las primeras 24 horas
