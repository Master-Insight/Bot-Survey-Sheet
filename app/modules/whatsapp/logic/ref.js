import SurveyManager from "./managers/SurveyManager.js";
import { addToSheet, batchUpdateSheetCells } from "../../googleapis/logic/googleSheetsService.js";
import service from "./service.js";

class MessageHandler {
  constructor() {
    this.surveyState = {}; // Estado de encuestas por usuario
    this.init();
  }

  // async init() {
  //   try {
  //     await SurveyManager.loadSurveys();
  //   } catch (error) {
  //     console.error('❌ Error al inicializar encuestas:', error);
  //   }
  // }

  // async handleIncomingMessage(message, senderInfo) {
  //   const sender = message.from;
  //   const incomingMessage = message?.text?.body?.toLowerCase()?.trim();

  //   if (!sender || !message) return;

  //   try {
  //     if (message?.type === 'text') {
  //       await this.handleTextMessage(sender, incomingMessage, message);
  //     } else if (message?.type === 'interactive') {
  //       await this.handleInteractiveMessage(sender, message);
  //     }
  //   } catch (error) {
  //     console.error(`❌ Error procesando mensaje de ${sender}:`, error);
  //     await service.sendMessage(sender, "⚠️ Ocurrió un error al procesar tu mensaje");
  //   }
  // }

  async handleTextMessage(sender, messageText, originalMessage) {
    // Check survey trigger
    if (await SurveyManager.checkSurveyTrigger(messageText, sender, this)) {
      return;
    }

    if (this.isGreeting(messageText, sender)) {
      await this.handleGreeting(sender, originalMessage.id);
      return;
    }

    if (this.surveyState[sender]) {
      await this.handleSurveyResponse(sender, messageText);
      return;
    }

    // Comandos administrativos
    const commandHandlers = {
      "test": () => this.handleTestCommand(sender, originalMessage.id),
      "/recarga": () => SurveyManager.reloadSurveys(sender, originalMessage.id),
      // Los comandos de pendientes se moverán al PendingManager
    };

    const handler = commandHandlers[messageText];
    if (handler) {
      await handler();
    }
  }

  async handleGreeting(to, messageId) {
    await service.sendMessage(to, "👋 ¡Bienvenido!");
    await SurveyManager.sendSurveyMenu(to, this);
    if (messageId) await service.markAsRead(messageId);
  }

  // ... (otros métodos como handleQuestions, handleSurveyEnd, etc. se mantienen similares)
  // Solo cambiando MessageHandler.surveys por SurveyManager.surveys
}

export default new MessageHandler();