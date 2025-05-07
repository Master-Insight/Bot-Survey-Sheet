import SurveyManager from "./managers/SurveyManager.js";
import { addToSheet, batchUpdateSheetCells } from "../../googleapis/logic/googleSheetsService.js";
import service from "./service.js";

class MessageHandler {
  constructor() {
    this.surveyState = {}; // Estado de encuestas por usuario
  }

  /* ! ACA ESTOY */
  async handleTextMessage(sender, messageText, originalMessage) {
    // Check survey trigger
    if (await SurveyManager.checkSurveyTrigger(messageText, sender, this)) {
      return;
    }

    // if (this.isGreeting(messageText, sender)) {
    //   await this.handleGreeting(sender, originalMessage.id);
    //   return;
    // }

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

  // ... (otros métodos como handleQuestions, handleSurveyEnd, etc. se mantienen similares)
  // Solo cambiando MessageHandler.surveys por SurveyManager.surveys
}

export default new MessageHandler();