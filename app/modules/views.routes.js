import { Router } from "express";
import { getFromSheet } from "./googleapis/logic/googleSheetsService.js";

const router = Router()

router
  .get("/", async (req, res) => {

    const config = await getFromSheet('TCONFIG');
    if (!Array.isArray(config)) return;
    config.shift(); // Eliminar headers

    const surveys = config.map(rgln => rgln[0])

    res.renderPage("index", "Bot Whatsapp InsightDev", { surveys, admin: false })
  })
  .get("/politica", (req, res) => {
    res.renderPage("politica", "Politica", {})
  })
  .get("/conducta", (req, res) => {
    res.renderPage("conducta", "Conducta", {})
  })

export default router