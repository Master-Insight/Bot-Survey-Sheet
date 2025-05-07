import { addToSheet, batchUpdateSheetCells, getFromSheet, updateSheetCell } from "../../googleapis/logic/googleSheetsService.js";
import SurveyManager from "./managers/SurveyManager.js";
import service from "./service.js";

class MessageHandler {
  // Variable estática para evitar recargar preguntas por cada instancia
  static surveys = null

  constructor() {
    this.surveyState = {}; // Guarda paso y respuestas por usuario
    this.init(); // Carga encuestas al arrancar
  }

  // * METODO INICIAL
  // ! LOG Inicializa la clase cargando los datos de encuestas desde Google Sheets
  async init() {
    try {
      await SurveyManager.loadSurveys();
    } catch (error) {
      console.error('❌ Error al inicializar encuestas:', error);
    }
    // ! GUIA !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    finally {
      console.log("surveys: ", SurveyManager.surveys);
    }
  }

  // * LOGICA PRINCIPAL de entrada de mensajes
  async handleIncomingMessage(message, senderInfo) {

    const sender = message.from;
    const incomingMessage = message?.text?.body?.toLowerCase()?.trim(); // limpieza
    console.log(incomingMessage);

    if (!sender || !message) return; // verificación

    if (message?.type === 'text') {
      await this.handleTextMessage(sender, incomingMessage, message);
    } else if (message?.type === 'interactive') {
      await this.handleInteractiveMessage(sender, message);
    }
  }

  // Handler: Texto plano
  async handleTextMessage(sender, messageText, originalMessage) {

    // 🔍 Revisa Lanzadores
    if (await SurveyManager.checkSurveyTrigger(messageText, originalMessage.id, sender, this)) { return; };

    // Saludo inicial
    if (this.isGreeting(messageText, sender)) { await this.handleGreeting(sender, originalMessage.id); return; }

    // Está respondiendo la encuesta
    if (this.surveyState[sender]) { this.handleSurveyResponse(sender, this.surveyState[sender].step, messageText); return; }

    // Comandos administrativos
    const commandHandlers = {
      "test": () => this.handleTestCommand(sender),
      "/recarga": () => SurveyManager.reloadSurveys(sender),
      "/cargar pendientes": () => PendingManager.loadPendingSurveys(sender),
      "/enviar siguiente": () => PendingManager.sendNextPendingSurvey(sender, null, this),
      "/enviar múltiples": () => {
        const partes = messageText.split(" ");
        const cantidad = parseInt(partes[2]) || 5;
        return PendingManager.sendMultiplePendingSurveys(sender, cantidad, null, this);
      }

    };

    const handler = commandHandlers[messageText];
    if (handler) {
      await handler();
      await service.markAsRead(originalMessage.id);
    }
  }

  // Handler: Acciones Interactivas (menu)
  async handleInteractiveMessage(sender, message) {
    const optionId = message?.interactive?.button_reply?.id;
    const optionText = message?.interactive?.button_reply?.title;

    if (this.surveyState[sender]) {
      const step = this.surveyState[sender].step;
      await this.handleSurveyResponse(sender, step, optionText);
    } else {
      await this.handleMenuOption(sender, optionId);
    }

    await service.markAsRead(message.id);
  }

  // * Auxiliares: Flujo

  // Determina si el mensaje es un saludo inicial
  isGreeting(message, to) {
    const greetings = ["hola", "holas", "buenas", "buenas tardes", "buenos días"];

    const istrue = greetings.includes(message);

    // Elimina estado actual si el usuario envía un saludo
    if (istrue) { delete this.surveyState[to]; }

    return istrue;
  }

  // Saludo Inicial
  async handleGreeting(to, messageId) {
    await service.sendMessage(to, "👋 ¡Bienvenido!");
    await SurveyManager.sendSurveyMenu(to, this);
    if (messageId) await service.markAsRead(messageId);
  }

  // ? ******************************************************
  // ? ------------------------------------------------------
  // ? ******************************************************

  // * MENU Y FLUJO ENCUESTA

  // Lógica según opción de menú
  async handleMenuOption(to, optionId) {
    const index = parseInt(optionId.replace('survey_', '')); // ontengo el index de las opciones

    const selectedSurvey = SurveyManager.surveys?.[index];

    if (!selectedSurvey) {
      await service.sendMessage(to, "⚠️ Encuesta no encontrada.");
      return;
    }

    this.surveyState[to] = {
      step: 0,
      answers: [],
      surveyIndex: index,
    };

    await this.handleSurveyResponse(to, 0);
  }

  // Genera la siguiente pregunta
  async handleSurveyResponse(to, step, answer = "") {
    const userState = this.surveyState[to]; // recibe estado de la encuesta
    const survey = SurveyManager.surveys?.[userState.surveyIndex]; // recupera la seleccionada

    if (!survey) return;

    // Trata la respuesta
    if (step > 0) { userState.answers.push(answer) };

    // Prepara pregunta
    const question = survey.questions[step];
    const options = survey.choices[step]

    // Si no hay más preguntas, se terminó la encuesta
    if (!question) {
      await this.handleSurveyEnd(to, userState.answers, survey.title);
      delete this.surveyState[to];
      return;
    }

    // Avanza al siguiente paso
    userState.step += 1;

    // Si hay opciones, mostrar botones sino es una respuesta libre
    if (Array.isArray(options)) {
      const buttons = options.map((opt, i) => ({
        type: 'reply',
        reply: { id: `step_${step}_opt_${i}`, title: opt },
      }));
      await service.sendInteractiveButtons(to, question, buttons);
    } else {
      await service.sendMessage(to, question);
    }
  }

  // Acción al terminar la encuesta
  async handleSurveyEnd(to, answers, title) {
    const resumen = answers.map((res, i) => `• ${SurveyManager.surveys.find(s => s.title === title).questions[i]}: ${res}`).join("\n");
    await service.sendMessage(to, `✅ Encuesta "${title}" completada:\n\n${resumen}`);
    const now = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

    try {
      await addToSheet([to, now, title, ...answers], 'answers');
      await service.sendMessage(to, "📄 Tus respuestas fueron registradas.");
    } catch (error) {
      console.error("❌ Error al guardar encuesta:", error);
      await service.sendMessage(to, "⚠️ Hubo un problema al guardar tus respuestas.");
    }
  }

  // ? ******************************************************
  // ? ------------------------------------------------------
  // ? ******************************************************

  // Testeo de comandos
  async handleTestCommand(to, messageId) {
    await service.sendMessage(to, "✅ Test");
  }

}

export default new MessageHandler();