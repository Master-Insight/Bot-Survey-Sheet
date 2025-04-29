import dotenv from 'dotenv';

dotenv.config()

const configEnv = {
  PORT: process.env.PORT,

  // Whatsapp
  BASE_WP_URL: process.env.BASE_WP_URL, // Base URL de la API
  API_VERSION: process.env.API_VERSION, // version de la api en Meta
  API_TOKEN: process.env.API_TOKEN, // Identificador de acceso
  BUSINESS_PHONE: process.env.BUSINESS_PHONE, // Identificador del número de teléfono
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN, // Contraseña ìnventada

  // GOOGLE API
  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, // Email de servicio
  GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID, // Planilla base Sheets
  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY, // token

  // OPEN AI
  CHAT_GPT_API_KEY: process.env.CHAT_GPT_API_KEY, // token
  CHAT_GPT_PROMPT: process.env.CHAT_GPT_PROMPT,
}

export default configEnv