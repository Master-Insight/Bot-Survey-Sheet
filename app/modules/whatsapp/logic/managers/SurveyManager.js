import configEnv from "../../../../config/env.js";
import { getFromSheet } from "../../../googleapis/logic/googleSheetsService.js";

import service from "../service.js";

const { CONFIG_SHEET } = configEnv

class SurveyManager {
  static surveys = [];

  // * LECTURA Y CARGA DE ENCUESTAS

  // Carga de encuestas
  static async loadSurveys() {
    try {
      if (!CONFIG_SHEET) throw new Error("Falta definir ENV - CONFIG_SHEET");

      const config = await getFromSheet(CONFIG_SHEET);
      if (!Array.isArray(config)) {
        throw new Error("No se pudo cargar la configuración de encuestas");
      }

      const surveysData = config.slice(1); // Eliminar headers
      this.surveys = [];

      for (const row of surveysData) {
        const [title, range] = row.map(cell => cell?.trim());
        if (!title || !range) continue;

        const questionsData = await getFromSheet(range);
        if (!Array.isArray(questionsData)) continue;

        const questions = [];
        const choices = [];

        questionsData.slice(1).forEach(questionRow => {
          questions.push(questionRow[0]?.trim() ?? "");
          choices.push(
            questionRow[1]?.trim()
              ? questionRow[1].split("/").map(o => o.trim())
              : undefined
          );
        });

        this.surveys.push({ title, range, questions, choices });
      }

      return this.surveys;
    } catch (error) {
      console.error("❌ Error al cargar encuestas:", error);
      throw error;
    }
  }

  // Recarga de encuestas manual // ! FALTA
  static async reloadSurveys(to, messageId = null) {
    try {
      await this.loadSurveys();
      await service.sendMessage(to, "🔁 Encuestas recargadas correctamente");
      if (messageId) await service.markAsRead(messageId);
    } catch (error) {
      console.error("❌ Error al recargar encuestas:", error);
      await service.sendMessage(to, "⚠️ Error al recargar encuestas");
      if (messageId) await service.markAsRead(messageId);
    }
  }

  // Obtener encuesta según posición // ! FALTA
  static getSurveyByIndex(index) {
    return this.surveys[index] || null;
  }

  // Obtener encuesta según titulo // ! FALTA
  static getSurveyByTitle(title) {
    return this.surveys.find(s =>
      s.title.toLowerCase().trim() === title.toLowerCase().trim()
    ) || null;
  }

  // * VERIFICADORES 

  // Verifica si es un "Lanzador" de encuestas  // ! FALTA
  static async checkSurveyTrigger(text, to, messageHandler) {
    if (!this.surveys.length) return false;

    const normalizedText = text.toLowerCase().trim();
    const survey = this.getSurveyByTitle(normalizedText);

    if (!survey) return false;

    messageHandler.surveyState[to] = {
      step: 0,
      answers: [],
      surveyIndex: this.surveys.indexOf(survey),
    };

    await service.markAsRead(text.id)

    console.log("to: ", to);
    console.log(text);

    await messageHandler.handleQuestions(to, 0);
    return true;
  }

  // * MENUS

  // Menú inicial con botones
  static async sendSurveyMenu(to, messageHandler) {
    if (!this.surveys.length) { await service.sendMessage(to, "⚠️ No hay encuestas disponibles"); return; }

    // Crea botones en base a "Surveys"
    const buttons = this.surveys.map((survey, i) => ({
      type: 'reply',
      reply: { id: `survey_${i}`, title: survey.title }
    }));

    await service.sendInteractiveButtons(to, "📋 Elige una Encuesta", buttons);
  }


}

export default SurveyManager;