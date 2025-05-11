import { Router } from "express";
import { getFromSheet } from "../googleapis/logic/googleSheetsService.js";
import configEnv from "../../config/env.js";

const router = Router();
const { CONFIG_SHEET } = configEnv

// Rutas Visuales
router
  .get("/", async (req, res) => {
    const config = await getFromSheet(CONFIG_SHEET);
    const surveys = Array.isArray(config) ? config.slice(1).map(rgln => rgln[0]) : [];
    res.renderPage("index", "Bot Whatsapp InsightDev", {
      surveys,
      admin: req.session.authenticated // Pasa el estado de autenticación a la vista
    });
  })
  .get("/politica", (req, res) => {
    res.renderPage("politica", "Politica", {});
  })
  .get("/conducta", (req, res) => {
    res.renderPage("conducta", "Conducta", {});
  });


export default router;