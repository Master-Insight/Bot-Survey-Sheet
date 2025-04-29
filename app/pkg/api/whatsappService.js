import whatsappClient from "./axiosWhatsapp.js";

const sendToWhatsApp = async (data) => {
  try {
    const response = await whatsappClient.post('/messages', data);
    return response.data;
  } catch (error) {
    console.error('Error al enviar mensaje a WhatsApp:', error);
    throw error;
  }
}

export default sendToWhatsApp