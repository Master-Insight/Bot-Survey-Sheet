import { Router } from "express";
import { authenticate } from "./auth.routes.js";
import { getFromSheet } from "../../googleapis/logic/googleSheetsService.js";
import configEnv from "../../../config/env.js";
import privateServ from "../logic/services.js"

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

    let result = {
      success: false,
      message: "Comandos no enviados"
    }

    switch (command) {
      case "reload":
        result = await privateServ.reloadSurveys()
        break;

      default:
        break;
    }

    res.json({
      success: result.success,
      command,
      message: result.message
    });
  } catch (error) {
    console.error('Error ejecutando comando:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;