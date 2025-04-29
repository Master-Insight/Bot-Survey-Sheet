import path from 'path';
import configEnv from '../../../config/env.js';
import { google } from 'googleapis';

const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEETS_ID } = configEnv

const sheets = google.sheets({ version: 'v4' }); // { version: 'v4', auth } // tambien puedo incluir auth alli

// Funcion de agregado guardar datos
async function addRowToSheet(auth, spreadsheetId, values) {
  const request = {
    spreadsheetId,
    range: 'Reservas', // Eso es el nombre de hoja, tambien puede ser nombre de rango o rango nombrado: 'Sorteo!A:E'
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [values], // values es un array
    },
    auth,
  }

  try {
    const response = await sheets.spreadsheets.values.append(request).data;
    return response;
  } catch (error) {
    console.error('Error in addRowToSheet:', error);
  }
}

// Authentifica y llama a funcion de agregado
const appendToSheet = async (data) => {
  try {
    // * Autenticación con Google Sheets con GoogleAuth
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'app/config', 'credentials.json'), // Este archivo se descarga y se ignora 
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    // * Autenticación con Google Sheets con JWT
    // const auth = new google.auth.JWT(
    //   GOOGLE_SERVICE_ACCOUNT_EMAIL,
    //   null,
    //   GOOGLE_PRIVATE_KEY,
    //   ['https://www.googleapis.com/auth/spreadsheets']
    // );

    const authClient = await auth.getClient();
    const spreadsheetId = GOOGLE_SHEETS_ID

    await addRowToSheet(authClient, spreadsheetId, data)

    return 'Datos correctamente agregados'

  } catch (error) {
    console.error('Error in appendToSheet:', error);
  }
}

export default appendToSheet;