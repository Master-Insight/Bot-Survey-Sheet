import { addToSheet, getFromSheet } from "../../googleapis/logic/googleSheetsService.js";
import service from "./service.js";

class MessageHandler {
  constructor() {
    this.surveyState = {}
  }

  // Recibe Mensaje - ESTA FUNCION ES LA BASE DE TODO
  async handleIncomingMessage(message, senderInfo) {
    // console.log(this.appointmentState);
    // console.log(this.assistandState);


    if (message?.type === 'text') { // Si manda un texto

      const incomingMessage = message.text.body.toLowerCase().trim(); // limpia el mensaje

      if (incomingMessage == "test") {
        // await this.pruebas()
        await service.sendMessage(message.from, "Test")
      }
      else if (this.isGreeting(incomingMessage)) { // es saludo de apertura ??
        await service.sendMessage(message.from, "Inicio"); // manda bienvenida
      }

      await service.markAsRead(message.id); // marca como leido

    }
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

  // Obtiene el nombre
  getSenderName(senderInfo) {
    // console.log("senderInfo: ", senderInfo); // { profile: { name: 'Gustavo Andrés' }, wa_id: '5493541xxxxxx' }

    const name = senderInfo.profile?.name ? senderInfo.profile?.name.split(" ")[0] : null;

    const sendName = name || senderInfo.wa_id || "";
    return sendName == "" ? "" : " " + sendName
  }

  // Si es saludo de apertura ( hola, buenas, buenos dias, .. etc)
  isGreeting(message) {
    const greetings = ["hola", "holas", "buenas", "buenas tardes", "buenas días"];
    return greetings.includes(message);
  }
}

export default new MessageHandler();