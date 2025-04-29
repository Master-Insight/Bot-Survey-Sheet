import { Router } from "express";
import whatsappRouter from "./whatsapp/api/routes.js"

const router = Router()

router.get("/", (req, res) => {
  res.send(`
    <h3>Server online</h3>
    <pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

// http://localhost:8080/
router.use('/webhook/', whatsappRouter)

router.all('*', (req, res, next) => { res.send(`No se encuentra la url: ${req.originalUrl} en este servidor`); });

export default router