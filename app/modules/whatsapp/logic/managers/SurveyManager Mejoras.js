// SurveyManager.js

class SurveyManager {
  // ... (métodos existentes)

  // * Versión mejorada de getSurveyByTitle
  static getSurveyByTitle(title) {
    if (!this.surveys.length) return null;

    const normalizedTitle = title.toLowerCase().trim();
    return this.surveys.find(s =>
      s.title.toLowerCase().trim() === normalizedTitle ||
      s.title.toLowerCase().trim().includes(normalizedTitle) ||
      normalizedTitle.includes(s.title.toLowerCase().trim())
    ) || null;
  }

  // * Versión mejorada de checkSurveyTrigger
  static async checkSurveyTrigger(text, messageId, to, messageHandler) {
    if (!this.surveys.length) return false;

    const normalizedText = text.toLowerCase().trim();
    const survey = this.getSurveyByTitle(normalizedText);

    if (!survey) return false;

    // Verificar si es un envío pendiente
    const isPending = messageHandler.surveyState[to]?.meta?.esPendiente;

    messageHandler.surveyState[to] = {
      step: 0,
      answers: [],
      surveyIndex: this.surveys.indexOf(survey),
      meta: {
        ...(isPending && { esPendiente: true }) // Mantener el flag si existe
      }
    };

    await service.markAsRead(messageId);
    await messageHandler.handleSurveyResponse(to, 0);
    return true;
  }
}