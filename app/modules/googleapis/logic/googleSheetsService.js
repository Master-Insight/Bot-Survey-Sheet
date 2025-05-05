import path from 'path'
import { google } from 'googleapis'
import configEnv from '../../../config/env.js'

const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEETS_ID } = configEnv

// 🛡️ Crea el authClient usando JWT y claves desde variables de entorno
// Auth global, se usa cuando el cliente de Google siempre es el mismo, sino se pasa en las peticiones

const auth = new google.auth.JWT(
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY, // Ajuste para claves privadas (los saltos corregir en el ENV)
  ['https://www.googleapis.com/auth/spreadsheets'],
);
// Cliente de Sheets con auth incluido
const sheets = google.sheets({ version: 'v4', auth })

/**
 * ✍️ Escribe una fila en la hoja o rango indicado (modo append)
 * @param {Array} data - Array de datos (ej: ['Juan', 'Pérez', 'juan@mail.com'])
 * @param {string} range - Nombre de hoja (ej: 'answers'), rango (ej: 'Consultas!A:D') o rango nombrado (ej: 'TPREGUNTAS')
 * @param {string} spreadsheetId - Opcional, usa el ID por defecto si no se pasa
 */
export async function addToSheet(data, range = 'answers', spreadsheetId = GOOGLE_SHEETS_ID) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [data],
      },
    })

    return '✅ Datos correctamente agregados'
  } catch (error) {
    console.error('❌ Error en addToSheet:', error)
    throw error
  }
}

/**
 * 📖 Lee datos desde un rango (ej: 'Consultas!A:G' o un rango nombrado como 'TPREGUNTAS') (modo get)
 * @param {string} range - Rango explícito o rango nombrado (debe existir en el archivo)
 * @param {string} spreadsheetId - Opcional, usa el ID por defecto si no se pasa
 * @returns {Array[]} - Array de arrays de valores
 */
export async function getFromSheet(range = "TPREGUNTAS", spreadsheetId = GOOGLE_SHEETS_ID) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    })
    return response.data.values
  } catch (error) {
    console.error('❌ Error en readRange::', error);
    throw error
  }
}

/**
 * 🔁 Actualiza una celda específica (por fila y columna)
 * @param {any} value - Valor a colocar
 * @param {String} cell - Celda (ej: 'Hoja1!C4')
 * @param {string} spreadsheetId - Opcional, usa el ID por defecto si no se pasa
 */
export async function updateSheetCell(value, cell, spreadsheetId = GOOGLE_SHEETS_ID) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: cell,
      valueInputOption: 'RAW',
      resource: {
        values: [[value]]
      },
    })
    return `✅ Celda ${cell} actualizada`
  } catch (error) {
    console.error(`❌ Error en updateSheetCell ${cell}:`, error)
    throw error
  }
}