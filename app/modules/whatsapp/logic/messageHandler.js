import { addToSheet, getFromSheet } from "../../googleapis/logic/googleSheetsService.js";
import service from "./service.js";

class MessageHandler {
  // Variable estática para evitar recargar preguntas por cada instancia
  static surveys = null

  constructor() {
    this.survey1State = {}; // Estado individual por contacto
    this.init(); // Carga inicial
  }

  // * METODOS INICIALES Y DE CARGA

  // Método para inicializar el bot
  async init() {
    try {
      MessageHandler.surveys = await this.getSurveysData();
      console.log('🔄 Surveys loaded:', MessageHandler.surveys);
    } catch (error) {
      console.error('❌ Error al cargar encuestas en init:', error);
    }
  }

  // Método reutilizable para recargar encuestas
  static async reloadSurveys() {
    try {
      MessageHandler.surveys = await getFromSheet('TPREGUNTAS');
      console.log('✅ Surveys reloaded:', MessageHandler.surveys);
    } catch (error) {
      console.error('❌ Error al recargar encuestas:', error);
    }
  }

  // Procesa las encuestas y las separa en preguntas/respuestas
  async getSurveysData() {
    try {
      const datos = await getFromSheet('TPREGUNTAS');
      if (!Array.isArray(datos)) return;

      datos.shift(); // Eliminar headers
      const questions = datos.map(row => row[0]);
      const answers = datos.map(row => row[1]);

      return [{ questions, answers }];
    } catch (error) {
      console.error("❌ Error al procesar datos de encuesta:", error);
    }
  }

  // * METODO CENTRAL: recibe mensajes entrantes

  async handleIncomingMessage(message, senderInfo) {
    const sender = message.from;
    console.log("📩 Mensaje recibido de:", sender);
    console.log("📊 Estado actual:", this.survey1State[sender]);

    if (message?.type === 'text') { // Captura mensajes texto
      const incomingMessage = message.text.body.toLowerCase().trim(); // limpia el mensaje

      if (incomingMessage === "test") {
        await service.sendMessage(sender, "✅ Test");
        await service.markAsRead(message.id);
        return;
      }

      if (this.isGreeting(incomingMessage)) {
        await service.sendMessage(sender, "👋 ¡Bienvenido!");
        await this.sendInitialMenu(sender); // Menu INICIAL
        await service.markAsRead(message.id);
        return;
      }


    } else if (message?.type === 'interactive') { // Captura acciones interactivas (menu)
      const optionId = message?.interactive?.button_reply?.id;
      await this.handleMenuOption(sender, optionId);
      await service.markAsRead(message.id);
    }
  }

  // * MENU

  // Muestra el menú inicial con botones
  async sendInitialMenu(to) {
    const menuTitle = "📋 Elige una Opción";
    const buttons = [
      { type: 'reply', reply: { id: 'option_1', title: 'Encuesta 1' } },
    ];
    await service.sendInteractiveButtons(to, menuTitle, buttons);
  }

  // Maneja opciones del menú
  async handleMenuOption(to, optionId) {
    let response;

    switch (optionId) {
      case 'option_1':
        this.survey1State[to] = { step: '1' }; // Inicia flujo para el usuario
        response = "📝 Por favor, ingresa tu nombre:";
        break;

      default:
        response = "❓ No entendí tu selección. Elige una opción del menú.";
    }

    await service.sendMessage(to, response);
  }

  // * Auxiliares

  // Determina si el mensaje es un saludo inicial
  isGreeting(message) {
    const greetings = ["hola", "holas", "buenas", "buenas tardes", "buenos días"];
    return greetings.includes(message);
  }
}

export default new MessageHandler();