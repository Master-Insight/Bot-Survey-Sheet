import { Router } from "express";
import { authenticate } from "./auth.routes.js";
import { getFromSheet } from "../../googleapis/logic/googleSheetsService.js";
import configEnv from "../../../config/env.js";

const router = Router();
const { CONFIG_SHEET } = configEnv

router.use(authenticate); // Todas las rutas aquí requieren autenticación

// Ruta para el panel admin
router.get('/private', async (req, res) => {
  try {
    const config = await getFromSheet(CONFIG_SHEET);
    const surveys = Array.isArray(config) ? config.slice(1).map(rgln => rgln[0]) : [];
    const session = req.session

    res.renderPage("private", "Panel Admin", {
      admin: true,
      surveys,
      session
    });
  } catch (error) {
    console.error('Error en panel admin:', error);
    res.status(500).send('Error al cargar el panel');
  }
});

// Ruta para ejecutar comandos
router.post('/private/execute-command', async (req, res) => {
  try {
    const { command } = req.body;

    // Aquí simularías el envío del comando al MessageHandler
    // Esto es un ejemplo - necesitarás adaptarlo a tu arquitectura
    // Usamos un número especial para identificar que viene del panel admin
    const adminPhone = 'admin_panel';
    const mockMessage = {
      id: 'admin_panel_command',
      from: adminPhone,
      text: { body: command },
      type: 'text'
    };

    // await MessageHandler.handleIncomingMessage(mockMessage, {});
    const result = await simulateCommandExecution(command);


    res.json({
      success: true,
      command,
      result,
      message: "Comando ejecutado correctamente"
    });
  } catch (error) {
    console.error('Error ejecutando comando:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Función de ejemplo para simular la ejecución de comandos
async function simulateCommandExecution(command) {
  // En una implementación real, aquí llamarías a los métodos de MessageHandler
  // Por ejemplo:
  // const phoneNumber = 'ADMIN_PANEL'; // O algún identificador especial
  // await messageHandler.handleTextMessage(phoneNumber, command, {id: 'panel'});

  return {
    executedAt: new Date().toISOString(),
    command,
    status: 'processed'
  };
}

export default router;