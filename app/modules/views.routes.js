import { Router } from "express";

const router = Router()

router
  .get("/", (req, res) => {
    res.renderPage("index", "Home", {})
  })
  .get("/politica", (req, res) => {
    res.renderPage("politica", "Politica", {})
  })
  .get("/conducta", (req, res) => {
    res.renderPage("conducta", "Conducta", {})
  })

export default router