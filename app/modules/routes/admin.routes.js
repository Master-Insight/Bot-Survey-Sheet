import { Router } from "express";
import { authenticate } from "./auth.routes.js";
import { getFromSheet } from "../googleapis/logic/googleSheetsService.js";
import configEnv from "../../config/env.js";

const router = Router();
const { CONFIG_SHEET } = configEnv

router.use(authenticate); // Todas las rutas aquí requieren autenticación

router.get('/admin', async (req, res) => {
  try {
    const config = await getFromSheet(CONFIG_SHEET);
    const surveys = Array.isArray(config) ? config.slice(1).map(rgln => rgln[0]) : [];
    const session = req.session

    res.renderPage("admin", "Panel Admin", {
      admin: true,
      surveys,
      session
    });
  } catch (error) {
    console.error('Error en panel admin:', error);
    res.status(500).send('Error al cargar el panel');
  }
});

export default router;