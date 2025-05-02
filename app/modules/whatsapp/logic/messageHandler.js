import { contact, location } from "../../../config/contact.js";
import { addToSheet } from "../../googleapis/logic/googleSheetsService.js";
import openAiService from "../../opeai/logic/openAiService.js";
import service from "./service.js";

class MessageHandler {
  constructor() {
    this.appointmentState = {}; // estado flujo Agendar Cita
    this.assistandState = {}; // estado flujo ChatGPT
  }

  // Recibe Mensaje - ESTA FUNCION ES LA BASE DE TODO
  async handleIncomingMessage(message, senderInfo) {
    // console.log(this.appointmentState);
    // console.log(this.assistandState);

    if (message?.type === 'text') { // Si manda un texto

      const incomingMessage = message.text.body.toLowerCase().trim(); // limpia el mensaje
      const mediaFile = ['audio', 'video', 'image', 'document']

      if (this.isGreeting(incomingMessage)) { // es saludo de apertura ??
        await this.sendWelcomeMessage(message.from, message.id, senderInfo) // manda bienvenida
        await this.sendWelcomeMenu(message.from) // manda menu bienvenida

      } else if (mediaFile.includes(incomingMessage)) { // si una alabra pidiendo media
        await this.sendMedia(message.from, incomingMessage);

      } else if (this.appointmentState[message.from]) { // Captura flujo Agendar Cita - si ese usuario tiene ese estado
        await this.handleAppointmentFlow(message.from, incomingMessage);

      } else if (this.assistandState[message.from]) { // Captura flujo ChatGPT - si ese usuario tiene ese estado
        await this.handleAssistandFlow(message.from, incomingMessage);

      } else { // En su defecto asume que se refiere al menu
        await this.handleMenuOption(message.from, incomingMessage)
      }

      await service.markAsRead(message.id); // marca como leido

    } else if (message?.type === 'interactive') { // Si elije una opcion interactiva

      const optionId = message?.interactive?.button_reply?.id; // "id" del elemento
      await this.handleMenuOption(message.from, optionId) // maneja la opcion elegida
      await service.markAsRead(message.id); // marca como leido
    }
  }

  // Obtiene el nombre
  getSenderName(senderInfo) {
    // console.log("senderInfo: ", senderInfo); // { profile: { name: 'Gustavo Andrés' }, wa_id: '5493541xxxxxx' }

    const name = senderInfo.profile?.name ? senderInfo.profile?.name.split(" ")[0] : null;

    const sendName = name || senderInfo.wa_id || "";
    return sendName == "" ? "" : " " + sendName
  }

  // Si es saludo de apertura ( hola, buenas, buenos dias, .. etc)
  isGreeting(message) {
    const greetings = ["hola", "holas", "buenas", "buenas tardes", "buenas días"];
    return greetings.includes(message);
  }

  // Mensaje de bienvenida
  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `Hola${name}, Bienvenido a MEDPET, Tu tienda de mascotas en línea. ¿En qué puedo ayudarte hoy?`;
    await service.sendMessage(to, welcomeMessage, messageId);
  }

  // MENU Bienvenida
  async sendWelcomeMenu(to) {
    const menuTitle = "Elige una Opción"
    const buttons = [
      { type: 'reply', reply: { id: 'option_1', title: 'Agendar' } },
      { type: 'reply', reply: { id: 'option_2', title: 'Consultar' } },
      { type: 'reply', reply: { id: 'option_3', title: 'Ubicación' } },
    ]
    await service.sendInteractiveButtons(to, menuTitle, buttons)
  }

  // HANDLER MENU: Manejar opcion Elegida (del menu)
  async handleMenuOption(to, optionId) {
    let response;
    switch (optionId) {

      // ? MENU INICIAL
      case 'option_1': // respuesta a la eleccion del menu
        this.appointmentState[to] = { step: 'name' } // aqui es donde el "flujo" se inicia de agendar cita
        response = "Por favor, ingresa tu nombre: "
        break;
      case 'option_2': // respuesta a la eleccion del menu
        this.assistandState[to] = { step: 'question' } // aqui es donde el "flujo" se inicia de chat gpt
        response = "Realiza tu consulta"
        break;
      case 'option_3': // respuesta a la eleccion del menu
        response = 'Te esperamos en nuestra sucursal.';
        await this.sendLocation(to)

      // ? MENU CHAT
      case 'option_2_3':
        response = "Si esto es una emergencia, te invitamos a llamar a nuestra linea de atención"
        await this.sendContact(to);

      // ? OPCION POR DEFETO
      default:
        response = 'Lo siento, no entendí tu selección. Por favor, elige una de las opciones del menú.';
        break;
    }
    await service.sendMessage(to, response);
  }

  // Enviar mensaje multimedia
  async sendMedia(to, typeSelected) {
    let mediaUrl;
    let caption;
    let type;

    switch (typeSelected) {
      case 'audio':

        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac';
        caption = 'Bienvenida';
        type = 'audio';
        break;

      case 'image':
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png';
        caption = '¡Esto es una Imagen!';
        type = 'image';
        break;

      case 'video':
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4';
        caption = '¡Esto es una video!';
        type = 'video';
        break;

      case 'document':
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf';
        caption = '¡Esto es un PDF!';
        type = 'document';
        break;
      default:
        break;
    }

    await service.sendMediaMessage(to, type, mediaUrl, caption)
  }

  // MENU - AGENDAR CITA: Opciones 
  async handleAppointmentFlow(to, message) {
    const state = this.appointmentState[to];
    let response;

    switch (state.step) {
      case 'name':
        state.name = message;
        state.step = 'petName';
        response = "Gracias, Ahora, ¿Cuál es el nombre de tu Mascota?";
        break;

      case 'petName':
        state.petName = message;
        state.step = 'petType';
        response = '¿Qué tipo de mascota es? (por ejemplo: perro, gato, huron, etc.)';
        break;

      case 'petType':
        state.petType = message;
        state.step = 'reason';
        response = '¿Cuál es el motivo de la Consulta?';
        break;

      case 'reason':
        state.reason = message;
        response = this.completeAppointmentFlow(to); // Cierre
        break;

      default:
        break;
    }

    await service.sendMessage(to, response);
  }

  // MENU - AGENDAR CITA: Cierre
  completeAppointmentFlow(to) {
    const appointment = this.appointmentState[to]; // se copia datos guardado
    delete this.appointmentState[to]; // se libera memoria

    const userData = [
      to,
      appointment.name,
      appointment.petName,
      appointment.petType,
      appointment.reason,
      new Date().toISOString()
    ]

    addToSheet(userData); // Guarda los datos en Sheets

    return `Gracias por agendar tu cita.

    Resumen:
    Nombre: ${appointment.name}
    Mascota: ${appointment.petName}
    Tipo: ${appointment.petType}
    Motivo: ${appointment.reason}

    Nos pondremos en contacto contigo pronto para confirmar la fecha y hora de tu cita.`
  }

  // MENU - CONSULTAR (CHAT GPT)
  async handleAssistandFlow(to, message) {

    // Flujo Pregunta Chat GPT - se inicia en consulta
    const state = this.assistandState[to];
    let response;

    if (state.step === 'question') {
      response = await openAiService(message)
    }

    delete this.assistandState[to];

    await service.sendMessage(to, response);

    // Menu que se manda luego de la respuesta de IA
    const menuTitle = "¿La respuesta fue de tu ayuda?"
    const buttons = [
      { type: 'reply', reply: { id: 'option_2_1', title: 'Si, Gracias' } },
      { type: 'reply', reply: { id: 'option_2_2', title: 'Hacer otra pregunta' } },
      { type: 'reply', reply: { id: 'option_2_3', title: 'Emergencia' } },
    ]
    await service.sendIntereactiveButtonds(to, menuTitle, buttons)
  }

  // Mandar contacto - Ver Json referencia
  async sendContact(to) {
    const contactToSend = contact // se importa de config
    await service.sendContactMessage(to, contactToSend);
  }

  // Mandar Ubicación - latitude, longitude, name, address
  async sendLocation(to) {
    await service.sendLocationMessage(to, location);
  }
}

export default new MessageHandler();