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

  // Procesamiento para carga de encuestas
  async getSurveysData() {
    try {
      // Obtener configuracion de encuestas
      const config = await getFromSheet('TCONFIG');
      if (!Array.isArray(config)) return;
      config.shift(); // Eliminar headers

      const surveys = [];

      for (const row of config) {
        const title = row[0]?.trim(); // titulo
        const range = row[1]?.trim(); // Rango
        if (!title || !range) continue;


        const datos = await getFromSheet(range);
        if (!Array.isArray(datos)) return;
        datos.shift(); // Eliminar headers

        const questions = [];
        const choices = [];

        for (const row of datos) {
          const pregunta = row[0]?.trim() ?? "";
          const opcionesRaw = row[1]?.trim();

          questions.push(pregunta);
          choices.push(opcionesRaw ? opcionesRaw.split("/").map(o => o.trim()) : undefined);
        }

        surveys.push({ title, range, questions, choices });
      }

      return surveys;

    } catch (error) {
      console.error("❌ Error al procesar datos de las encuestas:", error);
    }
  }

  // * Lógica principal de entrada de mensajes

  async handleIncomingMessage(message, senderInfo) {
    const sender = message.from;
    const incomingMessage = message?.text?.body?.toLowerCase()?.trim(); // si mensaje texto lo limpia

    if (!sender || !message) return; // seguro

    console.log("📩 Mensaje recibido de:", sender);

    if (message?.type === 'text') { // Captura Texto plano

      if (this.isGreeting(incomingMessage)) {
        await service.sendMessage(sender, "👋 ¡Bienvenido!");
        await this.sendInitialMenu(sender); // Menu INICIAL
        await service.markAsRead(message.id);

        // Está respondiendo la encuesta
      } else if (this.survey1State[sender]) {
        this.handleQuestions(sender, this.survey1State[sender].step, incomingMessage)

      } else if (incomingMessage === "test") {
        await service.sendMessage(sender, "✅ Test");
        await service.markAsRead(message.id);
        return;
      }


      console.log("📊 Estado actual:", this.survey1State[sender]);

    } else if (message?.type === 'interactive') { // Captura acciones interactivas (menu)

      const optionId = message?.interactive?.button_reply?.id;
      const optionText = message?.interactive?.button_reply?.title;

      if (this.survey1State[sender]) {
        const step = this.survey1State[sender].step;
        await this.handleQuestions(sender, step, optionText);
      } else {
        await this.handleMenuOption(sender, optionId);
      }

      await service.markAsRead(message.id);
    }
  }

  // * MENU

  // Menú inicial con botones
  async sendInitialMenu(to) {

    // Si existen encuestas optiene las opciones
    if (!MessageHandler.surveys) return;
    const buttons = MessageHandler.surveys.map((survey, i) => ({
      type: 'reply',
      reply: { id: `survey_${i}`, title: survey.title, }
    }))

    const menuTitle = "📋 Elige una Opción";
    await service.sendInteractiveButtons(to, menuTitle, buttons);
  }

  // Lógica según opción de menú
  async handleMenuOption(to, optionId) {
    switch (optionId) {
      case 'survey_1':
        // Inicia encuesta
        this.survey1State[to] = {
          step: 0,
          answers: []
        };
        await this.handleQuestions(to, 0);
        break;

      default:
        await service.sendMessage(to, "❓ No entendí tu selección.");
    }
  }

  // Genera la siguiente pregunta
  async handleQuestions(to, step, answer = "") {
    const userState = this.survey1State[to]; // recibe estado de la encuesta

    // Trata la respuesta
    if (step > 0) { userState.answers.push(answer) };

    // Prepara pregunta
    const survey = MessageHandler.surveys?.[0]; // recupera las encuestas
    if (!survey) return;
    const question = survey.questions[step];
    const options = survey.choices[step]

    // Si no hay más preguntas, se terminó la encuesta
    if (!question) {
      await this.handleSurveyEnd(to, userState.answers);
      delete this.survey1State[to];
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
  async handleSurveyEnd(to, answers) {
    const userState = this.survey1State[to]; // recibe estado de la encuesta

    const resumen = answers.map((res, i) => `• ${MessageHandler.surveys[0].questions[i]}: ${res}`).join("\n");
    await service.sendMessage(to, `✅ Encuesta completada:\n\n${resumen}`);

    try {
      await addToSheet([to, ...answers], 'answers');
      await service.sendMessage(to, "📄 Tus respuestas fueron registradas.");
    } catch (error) {
      await service.sendMessage(to, "⚠️ Hubo un problema al guardar tus respuestas.");
      console.error("❌ Error al guardar encuesta:", error);
    }

  }

  // * Auxiliares

  // Determina si el mensaje es un saludo inicial
  isGreeting(message) {
    const greetings = ["hola", "holas", "buenas", "buenas tardes", "buenos días"];
    return greetings.includes(message);
  }
}

export default new MessageHandler();