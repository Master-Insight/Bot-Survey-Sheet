import service from "../logic/service.js";
import messageHandler from "../logic/messageHandler.js";
import configEnv from "../../../config/env.js";
import { normalizePhoneNumber } from "../../../pkg/utils/normalizePhoneNumber.js";

class Controller {
  constructor() { }

  /**
 * Verifica el webhook de WhatsApp.
 * Se utiliza durante la configuración inicial para validar la URL del webhook.
 */
  verifyWebhook(req, res) { // GET
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === configEnv.WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }

  /**
 * Maneja los mensajes entrantes de WhatsApp.
 * Procesa mensajes de texto e interactivos.
 */
  async handleIncoming(req, res) { // POST
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
    const senderInfo = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0]; // Quien lo envio

    if (message) {
      message.from = normalizePhoneNumber(message.from)
      await messageHandler.handleIncomingMessage(message, senderInfo);
    }
    res.sendStatus(200);
  }






}

export default new Controller();