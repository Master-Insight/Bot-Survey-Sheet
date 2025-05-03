import whatsappClient from "./axiosWhatsapp.js";

const sendToWhatsApp = async (data) => {
  try {
    const response = await whatsappClient.post('/messages', data);
    return response.data;
  } catch (error) {
    const err = error.response?.data?.error;

    console.error('❌ Error al enviar mensaje a WhatsApp:');
    if (err) {
      console.error(`  - Código: ${err.code}`);
      console.error(`  - Tipo: ${err.type}`);
      console.error(`  - Mensaje: ${err.message}`);
      if (err.error_data?.details) {
        console.error(`  - Detalles: ${err.error_data.details}`);
      }
    } else {
      console.error(`  - Error desconocido: ${error.message}`);
    }

    throw new Error(err?.message || 'Error al enviar mensaje a WhatsApp');
  }
};

export default sendToWhatsApp