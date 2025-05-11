import { Router } from "express";
import whatsappRouter from "./whatsapp/api/routes.js"
import authRouter from "./auth.routes.js";
import adminRouter from "./admin.routes.js";
import viewsRouter from "./views.routes.js";

const router = Router()

// Log de session
router.use((req, res, next) => {
  console.log('Session data:', req.session);
  next();
});
router.use("/", authRouter);
router.use("/", adminRouter);
router.use("/", viewsRouter);

// http://localhost:8080/
router.use('/webhook/', whatsappRouter)

router.all('*', (req, res, next) => { res.send(`No se encuentra la url: ${req.originalUrl} en este servidor`); });

export default router