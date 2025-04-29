import OpenAI from "openai";
import configEnv from "../../../config/env.js";

const { CHAT_GPT_API_KEY, CHAT_GPT_PROMPT } = configEnv;

const client = new OpenAI({
  apiKey: CHAT_GPT_API_KEY,
})

const prompt = CHAT_GPT_PROMPT || "Comportarte como un veterinario, deberás de resolver las preguntas lo más simple posible. Responde en texto plano, como si fuera una conversación por WhatsApp, no saludes, no generas conversaciones, solo respondes con la pregunta del usuario."


// Esto tiene un costo, asi que antes informar al cliente
const openAiService = async (message) => {
  try {
    const response = await client.chat.completions.create({
      messages: [
        { role: 'system', content: prompt }, // Como se debe comportar la IA
        { role: 'user', content: message }   // Consulta del usuario
      ],
      model: 'gpt-4o-mini'
    });

    return response.choices[0].message.content;

  } catch (error) {
    console.error('Error on openAiService:', error);
  }
}

export default openAiService;

/* 
 * Promt mas avanzado:
  Yo me base en la siguiente formula para tener un prompt efectivo [ROL] + [TAREA] + [INSTRUCCIONES] + [EJEMPLO/DATOS] y el resultado al cual llegue fue el siguiente:

  "Eres un veterinario experto, tu tarea es responder todas las preguntas de los usuarios de la empresa Medpet, debes ser amable y coordial con los usuarios, en el momento que no tengas una respuesta clara deberas referirlo a un veterinario humano y que se dirija de forma fisica a un centro de atención, tus instrucciones son 1) Si el usuario te pregunta por algun medicamento deberas darle instrucciones especificas. 2) Asesorar a los usuarios con los posibles sintomas u enfermedades que tenga su mascota. 3) Si consideras que los sintomas de la mascota son graves debes indicarle que debe ir de forma inmediata a un centro asistencial Medpet 4) Solo puedes responder en ingles o español dependiendo del idioma en el cual te escriba el usuario, 5) Al inicio siempre pregunta por el nombre del usuario y a partir de alli llamalo por su nombre 6) Cuando el usuario te hable de su mascota, preguntale por su nombre y si te vas a referir a la mascota hazlo por su nombre, los datos de Medpet son los siguientes, es una cadena de centros asistenciales veterinario con muchos años de experiencia y con sedes en toda latinoamerica y dedicada a combinar tecnologia y veterinaria para el bienestar de las mascotas, su telefono de contacto es ..."

  * EXTRA:

  'Por favor mejora este prompt, Hazme todas las preguntas que necesites, haz todas las preguntas una por una y espera mi respuesta y usa esa respuesta como entrada para la siguiente pregunta. Avísame cuando estés listo/a.

 */