import sendToWhatsApp from "../../../pkg/api/whatsappService.js";

class Service {
  constructor() { }

  /**
   * Marca un mensaje como leído en WhatsApp.
   * @param {string} messageId - ID del mensaje que se marcará como leído.
   */
  async markAsRead(messageId) {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };
    await sendToWhatsApp(data);
  }

  /**
   * Envía un mensaje de texto a través de WhatsApp.
   * @param {string} to - Número de teléfono del destinatario.
   * @param {string} body - Contenido del mensaje de texto.
   * @param {string} [messageId] - (Opcional) ID del mensaje que se está respondiendo.
   */
  async sendMessage(to, body, messageId) {
    const data = {
      messaging_product: "whatsapp",
      to,
      text: { body },
    };

    if (messageId) {
      data.context = { message_id: messageId };
    }

    await sendToWhatsApp(data);
  }

  /**
   * Envía un mensaje interactivo de tipo botón a través de WhatsApp.
   * @param {string} to - Número de teléfono del destinatario.
   * @param {string} menuTitle - Texto que aparecerá como título en el cuerpo del mensaje.
   * @param {Array<Object>} buttons - Lista de botones disponibles para seleccionar.
   * Ejemplo: [{ type: 'reply', reply: { id: 'option_1', title: 'Agendar' } }]
   */
  async sendInteractiveButtons(to, menuTitle, buttons) {
    const data = {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: menuTitle },
        action: { buttons }
      }
    };

    await sendToWhatsApp(data);
  }

  /**
   * Envía un mensaje multimedia (imagen, audio, video o documento) a través de WhatsApp.
   * @param {string} to - Número de teléfono del destinatario.
   * @param {string} type - Tipo de medio a enviar: 'image', 'audio', 'video' o 'document'.
   * @param {string} mediaUrl - URL pública del recurso multimedia.
   * @param {string} [caption] - (Opcional) Texto descriptivo o nombre del recurso.
   * @throws {Error} Si el tipo de medio no es soportado.
   */
  async sendMediaMessage(to, type, mediaUrl, caption) {
    const mediaObject = {};

    switch (type) {
      case 'image':
        mediaObject.image = { link: mediaUrl, caption };
        break;
      case 'audio':
        mediaObject.audio = { link: mediaUrl };
        break;
      case 'video':
        mediaObject.video = { link: mediaUrl, caption };
        break;
      case 'document':
        mediaObject.document = { link: mediaUrl, caption, filename: 'medpet.pdf' };
        break;
      default:
        throw new Error('Not Supported Media Type');
    }

    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type,
      ...mediaObject,
    };

    await sendToWhatsApp(data);
  }

  /**
   * Envía un contacto a través de WhatsApp.
   * @param {string} to - Número de teléfono del destinatario.
   * @param {Object} contact - Objeto que representa el contacto que se enviará.
   */
  async sendContactMessage(to, contact) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'contacts',
      contacts: [contact],
    };

    await sendToWhatsApp(data);
  }

  /**
   * Envía una ubicación a través de WhatsApp.
   * @param {string} to - Número de teléfono del destinatario.
   * @param {Object} location - Objeto de ubicación con latitud, longitud y nombre.
   */
  async sendLocationMessage(to, location) {
    const data = {
      messaging_product: 'whatsapp',
      to,
      type: 'location',
      location,
    };

    await sendToWhatsApp(data);
  }
}

export default new Service();
