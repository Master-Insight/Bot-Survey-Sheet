import { Router } from "express";
import whatsappRouter from "./whatsapp/api/routes.js"
import viewsRouter from "./views.routes.js";

const router = Router()

router.use("/", viewsRouter);

// http://localhost:8080/
router.use('/webhook/', whatsappRouter)

router.all('*', (req, res, next) => { res.send(`No se encuentra la url: ${req.originalUrl} en este servidor`); });

export default router