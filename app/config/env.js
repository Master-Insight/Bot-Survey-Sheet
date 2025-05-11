import dotenv from 'dotenv';

dotenv.config()

const configEnv = {
  PORT: process.env.PORT,
  USER_ADMIN_PASS: process.env.USER_ADMIN_PASS, // Contraseña administrativa
  SECRET_COOKIE: process.env.SECRET_COOKIE, // clave cookie
  NODE_ENV: process.env.NODE_ENV,  // Estado de la app (develop o production)

  // Whatsapp
  BASE_WP_URL: process.env.BASE_WP_URL, // Base URL de la API
  API_VERSION: process.env.API_VERSION, // version de la api en Meta
  API_TOKEN: process.env.API_TOKEN, // Identificador de acceso
  BUSINESS_PHONE: process.env.BUSINESS_PHONE, // Identificador del número de teléfono
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN, // Contraseña ìnventada

  // GOOGLE API
  GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, // Email de servicio
  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY, // token

  // SHEETS RANGES
  GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID, // Planilla base Sheets
  CONFIG_SHEET: process.env.CONFIG_SHEET, // rango de la configuracion de la preguntas - incluye encabezado
  SESSION_SHEET: process.env.SESSION_SHEET, // rango de las respuestas - incluye encabezado
  ANSWERS_SHEET: process.env.ANSWERS_SHEET, // rango de las respuestas - incluye encabezado
  PENDING_SHEET: process.env.PENDING_SHEET, // rango de las encuentas pendientes a enviar - incluye encabezado

  // OPEN AI
  CHAT_GPT_API_KEY: process.env.CHAT_GPT_API_KEY, // token
  CHAT_GPT_PROMPT: process.env.CHAT_GPT_PROMPT,
}

export default configEnv