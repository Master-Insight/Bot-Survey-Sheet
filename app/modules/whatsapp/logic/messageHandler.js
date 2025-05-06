import { addToSheet, batchUpdateSheetCells, getFromSheet, updateSheetCell } from "../../googleapis/logic/googleSheetsService.js";
import service from "./service.js";

class MessageHandler {
  // Variable estática para evitar recargar preguntas por cada instancia
  static surveys = null

  constructor() {
    this.survey1State = {}; // Guarda paso y respuestas por usuario
    this.init(); // Carga encuestas al arrancar
    this.pendientes = []
  }

  // * METODO INICIAL
  // Inicializa la clase cargando los datos de encuestas desde Google Sheets
  async init() {
    try {
      MessageHandler.surveys = await this.getSurveysData();
    } catch (error) {
      console.error('❌ Error al cargar encuestas en init:', error);
    }
  }

  // * Lógica principal de entrada de mensajes
  async handleIncomingMessage(message, senderInfo) {

    const sender = message.from;

    const incomingMessage = message?.text?.body?.toLowerCase()?.trim(); // si mensaje texto lo limpia

    if (!sender || !message) return; // seguro

    if (message?.type === 'text') { // Captura Texto plano
      // 🔍 Revisa si es una frase clave que inicia encuesta
      const started = await this.checkSurveyTrigger(incomingMessage, sender);
      if (started) return;

      if (this.isGreeting(incomingMessage, sender)) {
        await service.sendMessage(sender, "👋 ¡Bienvenido!");
        await this.sendInitialMenu(sender); // Menu INICIAL
        await service.markAsRead(message.id);

        // Está respondiendo la encuesta
      } else if (this.survey1State[sender]) {
        this.handleQuestions(sender, this.survey1State[sender].step, incomingMessage)

      } else if (incomingMessage === "test") {
        await service.sendMessage(sender, "✅ Test");
        await service.markAsRead(message.id);

      } else if (incomingMessage === "/recarga") {
        await MessageHandler.reloadSurveys(sender)
        await service.markAsRead(message.id);

      } else if (incomingMessage === "/cargar pendientes") {
        await this.getPendingMessages(sender);
        await service.markAsRead(message.id);

      } else if (incomingMessage === "/enviar siguiente") {
        await this.sendNextPendingSurvey(sender);
        await service.markAsRead(message.id);

      } else if (incomingMessage.startsWith("/enviar múltiples")) {
        const partes = incomingMessage.split(" ");
        const cantidad = parseInt(partes[2]) || 5; // Default: 5 si no se especifica bien
        await this.sendMultiplePendingSurveys(sender, cantidad);
        await service.markAsRead(message.id);
      }

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
    const index = parseInt(optionId.replace('survey_', '')); // ontengo el index de las opciones

    const selectedSurvey = MessageHandler.surveys?.[index];

    if (!selectedSurvey) {
      await service.sendMessage(to, "⚠️ Encuesta no encontrada.");
      return;
    }

    this.survey1State[to] = {
      step: 0,
      answers: [],
      surveyIndex: index,
    };

    await this.handleQuestions(to, 0);
  }

  // Genera la siguiente pregunta
  async handleQuestions(to, step, answer = "") {
    const userState = this.survey1State[to]; // recibe estado de la encuesta
    const survey = MessageHandler.surveys?.[userState.surveyIndex]; // recupera la seleccionada

    if (!survey) return;

    // Trata la respuesta
    if (step > 0) { userState.answers.push(answer) };

    // Prepara pregunta
    const question = survey.questions[step];
    const options = survey.choices[step]

    // Si no hay más preguntas, se terminó la encuesta
    if (!question) {
      await this.handleSurveyEnd(to, userState.answers, survey.title);
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
  async handleSurveyEnd(to, answers, title) {
    const resumen = answers.map((res, i) => `• ${MessageHandler.surveys.find(s => s.title === title).questions[i]}: ${res}`).join("\n");
    await service.sendMessage(to, `✅ Encuesta "${title}" completada:\n\n${resumen}`);

    try {
      await addToSheet([to, title, ...answers], 'answers');
      await service.sendMessage(to, "📄 Tus respuestas fueron registradas.");
    } catch (error) {
      console.error("❌ Error al guardar encuesta:", error);
      await service.sendMessage(to, "⚠️ Hubo un problema al guardar tus respuestas.");
    }
  }

  // * Auxiliares: Carga de datos

  // Recarga de encuestas manual
  static async reloadSurveys(to) {
    try {
      MessageHandler.surveys = await getFromSheet('TPREGUNTAS');
      await service.sendMessage(to, "🔁 Recarga completada");
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

  // * Auxiliares: Check

  // Determina si el mensaje es un saludo inicial
  isGreeting(message, to) {
    const greetings = ["hola", "holas", "buenas", "buenas tardes", "buenos días"];

    const istrue = greetings.includes(message);

    if (istrue) {
      // Elimina estado actual si el usuario envía un saludo
      delete this.survey1State[to];
    }

    return istrue;
  }

  // Verifica trigger
  async checkSurveyTrigger(text, to) {

    if (!MessageHandler.surveys) return false;

    const normalizedText = text.toLowerCase().trim();

    const matchedIndex = MessageHandler.surveys.findIndex(s =>
      normalizedText === s.title.toLowerCase()
    );

    if (matchedIndex === -1) return false;

    // Reiniciar estado anterior si lo hay
    delete this.survey1State[to];

    // Iniciar flujo directamente
    this.survey1State[to] = {
      step: 0,
      answers: [],
      surveyIndex: matchedIndex,
    };

    await this.handleQuestions(to, 0);
    return true;
  }

  // * Auxiliares: Tareas Extras

  // Obtiene las filas pendientes de envío desde la hoja 'A enviar'
  async getPendingMessages(to) {
    const values = await getFromSheet("'A enviar'!A2:C")
    if (!Array.isArray(values)) return;
    // values.shift(); // Eliminar headers

    const pendientes = [];
    values.forEach((row, index) => {
      const [telefono, encuesta, estado] = row;
      if (!estado) {
        pendientes.push({
          telefono,
          encuesta,
          fila: index + 2 // +2 porque empezamos en A2 y queremos fila absoluta
        });
      }
    });

    this.pendientes = pendientes;

    const resumen = pendientes.map((res, i) => `• Cel: ${res.telefono} - Encuesta: ${res.encuesta}`).join("\n");
    await service.sendMessage(to, `📃 Pendientes cargados\n${resumen}`);
  }

  // Envía la siguiente encuesta pendiente
  async sendNextPendingSurvey(to) {
    if (this.pendientes.length === 0) {
      await service.sendMessage(to, "✅ No hay encuestas pendientes para enviar.");
      return;
    }

    const pendiente = this.pendientes.shift(); // Saca la primera de la cola
    const { telefono, encuesta, fila } = pendiente;

    const matchedIndex = MessageHandler.surveys.findIndex(s =>
      encuesta.toLowerCase().trim() === s.title.toLowerCase().trim()
    );

    if (matchedIndex === -1) {
      await service.sendMessage(to, `⚠️ Encuesta "${encuesta}" no encontrada para ${telefono}.`);
      return;
    }

    // Inicializar estado de usuario
    this.survey1State[telefono] = {
      step: 0,
      answers: [],
      surveyIndex: matchedIndex,
      meta: { fila }, // Guardamos info para marcar como enviado después
    };

    // Prepara actualización en bloque para columnas C, D y E
    const now = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

    try {

      await service.sendMessage(telefono, `📋 Hola! Queremos invitarte a responder una encuesta: *${encuesta}*`);
      await this.handleQuestions(telefono, 0);

      // await updateSheetCell("ENVIADO ✅", `'A enviar'!C${fila}`); // estoy podria estar al final del ciclo
      await batchUpdateSheetCells([
        { cell: `'A enviar'!C${fila}`, value: "ENVIADO ✅" },
        { cell: `'A enviar'!D${fila}`, value: now },
        { cell: `'A enviar'!E${fila}`, value: "" },
      ]);
      await service.sendMessage(to, `📨 Encuesta enviada a ${telefono} ✅`);

    } catch (error) {
      // await updateSheetCell("ERROR ❌", `'A enviar'!C${fila}`);
      await batchUpdateSheetCells([
        { cell: `'A enviar'!C${fila}`, value: "ERROR ❌" },
        { cell: `'A enviar'!D${fila}`, value: now },
        { cell: `'A enviar'!E${fila}`, value: error },
      ]);
      await service.sendMessage(to, `📨 Encuesta NO pudo ser enviada a ${telefono} ❌`);
    }


    /* SI CLIENTE CONTESTA SE PUEDE AGREGAR ESTO - PERO OJO, si eliminan la fila es para lio
    await batchUpdateSheetCells([
      { cell: `'A enviar'!F${fila}`, value: "COMPLETADA ✅" }
    ] );
*/
  }

  // Envía múltiples encuestas pendientes (máximo definido por parámetro)
  async sendMultiplePendingSurveys(to, cantidad = 5) {
    if (this.pendientes.length === 0) {
      await service.sendMessage(to, "✅ No hay encuestas pendientes para enviar.");
      return;
    };

    const enviados = [];

    for (let i = 0; i < cantidad && this.pendientes.length > 0; i++) {

      const pendiente = this.pendientes.shift();
      const { telefono, encuesta, fila } = pendiente;

      const matchedIndex = MessageHandler.surveys.findIndex(s =>
        encuesta.toLowerCase().trim() === s.title.toLowerCase().trim()
      );

      if (matchedIndex === -1) {
        await batchUpdateSheetCells([
          { cell: `'A enviar'!C${fila}`, value: "NO ENCONTRADA ⚠️" },
          { cell: `'A enviar'!D${fila}`, value: new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }) },
        ]);
        enviados.push(`⚠️ Encuesta no encontrada para ${telefono}`);
        continue;
      }

      // Inicializar estado de usuario
      this.survey1State[telefono] = {
        step: 0,
        answers: [],
        surveyIndex: matchedIndex,
        meta: { fila },
      };

      const now = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

      try {
        await service.sendMessage(telefono, `📋 Hola! Queremos invitarte a responder una encuesta: *${encuesta}*`);
        await this.handleQuestions(telefono, 0);

        await batchUpdateSheetCells([
          { cell: `'A enviar'!C${fila}`, value: "ENVIADO ✅" },
          { cell: `'A enviar'!D${fila}`, value: now },
          { cell: `'A enviar'!E${fila}`, value: "" },
        ]);

        enviados.push(`✅ ${telefono}`);
      } catch (error) {
        await batchUpdateSheetCells([
          { cell: `'A enviar'!C${fila}`, value: "ERROR ❌" },
          { cell: `'A enviar'!D${fila}`, value: now },
          { cell: `'A enviar'!E${fila}`, value: error.toString().substring(0, 100) }, // Evita errores largos
        ]);
        enviados.push(`❌ ${telefono}`);
      }
    }

    const resumen = enviados.map(e => `• ${e}`).join("\n");
    await service.sendMessage(to, `📦 Resultado de envío múltiple:\n${resumen}`);
  }
}

export default new MessageHandler();