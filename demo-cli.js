// ============================================================
// DEMO-CLI.JS — Simulador de conversación en terminal
// Ejecutar con: node demo-cli.js
// ============================================================

const readline = require("readline");
const { procesarMensaje } = require("./bot-engine");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const USER_ID = "demo_user_123";

const COLORES = {
  reset: "\x1b[0m",
  bot: "\x1b[36m",   // Cyan
  user: "\x1b[33m",  // Amarillo
  system: "\x1b[90m", // Gris
  titulo: "\x1b[35m", // Magenta
};

function printBanner() {
  console.clear();
  console.log(`${COLORES.titulo}
╔══════════════════════════════════════════════════════════╗
║        🏠  CHATBOT INMOBILIARIO - MODO DEMO              ║
║        Simulador de conversación WhatsApp                ║
╚══════════════════════════════════════════════════════════╝
${COLORES.system}Escribe tus mensajes y presiona Enter.
Escribe 'salir' para terminar.
${COLORES.reset}`);
}

async function iniciarDemo() {
  printBanner();

  // Mensaje inicial automático
  console.log(`${COLORES.system}[Sistema] Iniciando conversación...${COLORES.reset}\n`);
  const bienvenida = await procesarMensaje(USER_ID, "hola");
  console.log(`${COLORES.bot}🤖 Bot:\n${bienvenida}${COLORES.reset}\n`);
  console.log(`${COLORES.system}${"─".repeat(60)}${COLORES.reset}\n`);

  const preguntar = () => {
    rl.question(`${COLORES.user}👤 Tú: ${COLORES.reset}`, async (input) => {
      const mensaje = input.trim();

      if (!mensaje) return preguntar();
      if (mensaje.toLowerCase() === "salir") {
        console.log(`\n${COLORES.system}Sesión terminada. ¡Hasta luego!${COLORES.reset}\n`);
        rl.close();
        return;
      }

      try {
        const respuesta = await procesarMensaje(USER_ID, mensaje);
        console.log(`\n${COLORES.bot}🤖 Bot:\n${respuesta}${COLORES.reset}\n`);
        console.log(`${COLORES.system}${"─".repeat(60)}${COLORES.reset}\n`);
      } catch (err) {
        console.error(`${COLORES.system}Error: ${err.message}${COLORES.reset}\n`);
      }

      preguntar();
    });
  };

  preguntar();
}

iniciarDemo();
