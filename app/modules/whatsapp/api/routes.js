import { Router } from "express";
import controller from "./controller.js";

const router = Router();

// http://localhost:8080/webhook/
router
  .post('/', controller.handleIncoming) // recibe los mensajes enviados por whatsapp
  .get('/', controller.verifyWebhook) // se usa para verificar que funcione esta conexión

export default router
