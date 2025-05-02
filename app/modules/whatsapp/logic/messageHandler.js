import { addToSheet, getFromSheet } from "../../googleapis/logic/googleSheetsService.js";
import service from "./service.js";

class MessageHandler {
  constructor() {
    this.surveys = {}
    this.survey1State = {}

    this.getSurveysData()
  }

  async getSurveysData() {
    // Aqui se carga la logica para cargar los datos
    // await this.pruebas()
  }

  // Recibe Mensaje - ESTA FUNCION ES LA BASE DE TODO
  async handleIncomingMessage(message, senderInfo) {
    // console.log(this.survey1State);

    if (message?.type === 'text') { // Si manda un texto

      const incomingMessage = message.text.body.toLowerCase().trim(); // limpia el mensaje

      if (incomingMessage == "test") {
        await service.sendMessage(message.from, "Test")
      }
      else if (this.isGreeting(incomingMessage)) {
        await service.sendMessage(message.from, "Inicio");
        await this.sendInitialMenu(message.from); // Menu INICIAL
      }

      await service.markAsRead(message.id); // marca como leido

    } else if (message?.type === 'interactive') { // Si elije una opcion interactiva

      const optionId = message?.interactive?.button_reply?.id; // "id" del elemento
      await this.handleMenuOption(message.from, optionId) // maneja la opcion elegida
      await service.markAsRead(message.id); // marca como leido
    }
  }

  // MENU Inicial
  async sendInitialMenu(to) {
    const menuTitle = "Elige una Opción"
    const buttons = [
      { type: 'reply', reply: { id: 'option_1', title: 'Encuesta 1' } },
    ]
    await service.sendInteractiveButtons(to, menuTitle, buttons)
  }

  // HANDLER MENUS
  async handleMenuOption(to, optionId) {
    let response;
    switch (optionId) {

      // ? MENU INICIAL
      case 'option_1': // respuesta a la eleccion del menu
        this.survey1State[to] = { step: '1' } // aqui es donde el "flujo" se inicia de agendar cita
        response = "Por favor, ingresa tu nombre: "
        break;

      // ? OPCION POR DEFETO
      default:
        response = 'Lo siento, no entendí tu selección. Por favor, elige una de las opciones del menú.';
        break;
    }
    await service.sendMessage(to, response);
  }


  async pruebas() {
    /* PRUEBAS */
    let datos = []
    let preguntas = []
    let respuestas = []

    datos = await getFromSheet()
    // console.log(   );

    console.log("datos: ", datos);
    if (Array.isArray(datos)) {
      datos.shift();
      preguntas = datos.map(rgln => rgln[0])
      respuestas = datos.map(rgln => rgln[1])
    }
    console.log("preguntas: ", preguntas);
    console.log("respuestas: ", respuestas);

    // datos: [
    //   ['Preguntas', 'Posibles Respuestas'],
    //   ['Indica tu nombre'],
    //   ['Edad'],
    //   ['Sexo', 'Hombre/Mujer/No Binario']
    // ]
    // preguntas: ['Indica tu nombre', 'Edad', 'Sexo']
    // respuestas: [undefined, undefined, 'Hombre/Mujer/No Binario']

    /* ------- */
  }

  // Si es saludo de apertura ( hola, buenas, buenos dias, .. etc)
  isGreeting(message) {
    const greetings = ["hola", "holas", "buenas", "buenas tardes", "buenas días"];
    return greetings.includes(message);
  }
}

export default new MessageHandler();