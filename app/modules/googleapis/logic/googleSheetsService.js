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
 * @param {Array<any>} data - Fila de datos a insertar (ej: ['Juan', 'Pérez', 'juan@mail.com']).
 * @param {string} [range='answers'] - Nombre de la hoja o rango (ej: 'Consultas!A:D' o rango nombrado).
 * @param {string} [spreadsheetId=GOOGLE_SHEETS_ID] - ID del documento de Google Sheets.
 * @returns {Promise<string>} - Mensaje de confirmación.
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
 * @param {string} range - Rango en A1 notation (ej: 'Hoja1!A1:C10' o un rango nombrado).
 * @param {string} [spreadsheetId=GOOGLE_SHEETS_ID] - ID del documento de Google Sheets.
 * @returns {Promise<Array<Array<any>>>} - Matriz con los valores recuperados.
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
 * @param {any} value - Valor que se quiere escribir en la celda.
 * @param {string} cell - Celda en A1 notation (ej: 'Hoja1!C4').
 * @param {string} spreadsheetId - ID del documento de Google Sheets.
 * @returns {Promise<string>} - Mensaje de confirmación.
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

/**
 * 🔄 Actualiza múltiples celdas (en bloque)
 * @param {Array<{cell: string, value: any}>} updates - Lista de objetos con `cell` (A1 notation) y `value` a escribir.
 * @param {string} spreadsheetId - ID del documento de Google Sheets.
 * @returns {Promise<string>} - Mensaje con cantidad de celdas actualizadas.
 */
export async function batchUpdateSheetCells(updates = [], spreadsheetId = GOOGLE_SHEETS_ID) {
  try {
    const data = updates.map(({ cell, value }) => ({
      range: cell,
      values: [[value]]
    }))

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: 'RAW',
        data
      }
    })
    return `✅ ${updates.length} celdas actualizadas`

  } catch (error) {
    console.error('❌ Error en batchUpdateSheetCells:', error)
    throw error
  }
}

/**
 * 🔎 Busca la primera fila vacía en una hoja dada (útil para saber desde dónde continuar)
 * @param {string} range - Rango de una sola columna donde buscar la primera fila vacía. Ej: 'Sheet1!A:A'
 * @param {string} spreadsheetId - ID del documento de Google Sheets.
 * @returns {Promise<number>} - Número de fila (1-based) que está vacía.
 */
export async function findFirstEmptyRow(range = 'Sheet1!A:A', spreadsheetId = GOOGLE_SHEETS_ID) {
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || []
    return rows.length + 1 // +1 porque el index en Sheets empieza en 1
  } catch (error) {
    console.error('❌ Error en findFirstEmptyRow:', error)
    throw error
  }
}