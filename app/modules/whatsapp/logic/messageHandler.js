import { addToSheet, getFromSheet } from "../../googleapis/logic/googleSheetsService.js";
import service from "./service.js";

class MessageHandler {
  // Variable estática para evitar recargar preguntas por cada instancia
  static surveys = null

  constructor() {
    this.survey1State = {}; // Guarda paso y respuestas por usuario
    this.init(); // Carga encuestas al arrancar
  }

  // * METODOS INICIALES Y DE CARGA

  // Carga inicial de encuestas
  async init() {
    try {
      MessageHandler.surveys = await this.getSurveysData();
      console.log('🔄 Surveys loaded:', MessageHandler.surveys);
    } catch (error) {
      console.error('❌ Error al cargar encuestas en init:', error);
    }
  }

  // Recarga de encuestas manual
  static async reloadSurveys() {
    try {
      MessageHandler.surveys = await getFromSheet('TPREGUNTAS');
      console.log('✅ Surveys reloaded:', MessageHandler.surveys);
    } catch (error) {
      console.error('❌ Error al recargar encuestas:', error);
    }
  }

  // Procesamiento de la hoja de cálculo
  async getSurveysData() {
    try {
      const datos = await getFromSheet('TPREGUNTAS');
      if (!Array.isArray(datos)) return;

      datos.shift(); // Eliminar headers
      const questions = datos.map(row => row[0]);
      const choices = datos.map(row => row[1]);

      return [{ questions, choices }];
    } catch (error) {
      console.error("❌ Error al procesar datos de encuesta:", error);
    }
  }

  // * Lógica principal de entrada de mensajes

  async handleIncomingMessage(message, senderInfo) {
    const sender = message.from;
    const incomingMessage = message?.text?.body?.toLowerCase()?.trim(); // si mensaje texto lo limpia

    if (!sender || !message) return; // seguro

    console.log("📩 Mensaje recibido de:", sender);
    console.log("📊 Estado actual:", this.survey1State[sender]);

    if (message?.type === 'text') { // Captura Texto plano

      if (this.isGreeting(incomingMessage)) {
        await service.sendMessage(sender, "👋 ¡Bienvenido!");
        await this.sendInitialMenu(sender); // Menu INICIAL
        await service.markAsRead(message.id);
        return;
      }

      // Está respondiendo la encuesta
      if (this.survey1State[sender]) {
        this.handleQuestions(sender, incomingMessage)
        return;
      }

      if (incomingMessage === "test") {
        await service.sendMessage(sender, "✅ Test");
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

  // Menú inicial con botones
  async sendInitialMenu(to) {
    const menuTitle = "📋 Elige una Opción";
    const buttons = [
      { type: 'reply', reply: { id: 'option_1', title: 'Encuesta 1' } },
    ];
    await service.sendInteractiveButtons(to, menuTitle, buttons);
  }

  // Lógica según opción de menú
  async handleMenuOption(to, optionId) {
    switch (optionId) {
      case 'option_1':
        // Inicia encuesta
        this.survey1State[to] = {
          step: 0,
          answers: []
        };
        await this.askNextQuestion(to);
        break;

      default:
        await service.sendMessage(to, "❓ No entendí tu selección.");
    }
  }

  async handleQuestions(to, answer) {
    const state = this.survey1State[to]; // recibe estado de la encuesta

    const survey = MessageHandler.surveys?.[0]; // recupera las encuestas
    if (!survey) return;

    // Guarda respuesta anterior
    state.answers[state.step] = answer;

    // Avanza al siguiente paso
    state.step += 1;

    if (state.step >= survey.questions.length) {
      await this.handleSurveyCompleted(to, state.answers);
      delete this.survey1State[to]; // Limpia estado
    } else {
      await this.askNextQuestion(to);
    }

  }

  // Envía la siguiente pregunta al usuario
  async askNextQuestion(to) {
    const state = this.survey1State[to];
    const survey = MessageHandler.surveys?.[0];
    const question = survey?.questions[state.step];

    if (question) {
      await service.sendMessage(to, `❓ ${question}`);
    }
  }

  // * Acción al terminar la encuesta
  async handleSurveyCompleted(to, answers) {
    const resumen = answers.map((res, i) => `• ${MessageHandler.surveys[0].questions[i]}: ${res}`).join("\n");
    await service.sendMessage(to, `✅ Encuesta completada:\n\n${resumen}`);

    // Aquí podrías hacer un addToSheet(to, answers) o llamar a una API
  }

  // * Auxiliares

  // Determina si el mensaje es un saludo inicial
  isGreeting(message) {
    const greetings = ["hola", "holas", "buenas", "buenas tardes", "buenos días"];
    return greetings.includes(message);
  }
}

export default new MessageHandler();