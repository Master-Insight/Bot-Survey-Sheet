import { Router } from "express";
import { getFromSheet } from "./googleapis/logic/googleSheetsService.js";

const router = Router()

router
  .get("/", async (req, res) => {
    /* PRUEBAS */
    let datos = []
    let preguntas = []
    let respuestas = []

    datos = await getFromSheet()
    // console.log(   );

    console.log("datos: ", datos);
    if (Array.isArray(datos)) {
      datos.shift();
      preguntas = datos.map(rgln => rgln[0])
      respuestas = datos.map(rgln => rgln[1])
    }
    console.log("preguntas: ", preguntas);
    console.log("respuestas: ", respuestas);

    /* ------- */
    res.renderPage("index", "Home", {})
  })
  .get("/politica", (req, res) => {
    res.renderPage("politica", "Politica", {})
  })
  .get("/conducta", (req, res) => {
    res.renderPage("conducta", "Conducta", {})
  })

export default router