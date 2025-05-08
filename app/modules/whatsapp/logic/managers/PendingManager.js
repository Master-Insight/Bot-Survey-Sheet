// PendingManager.js
// Este módulo gestiona los envíos pendientes de respuestas. Permite agregar, eliminar y recuperar pendientes por usuario.

import { getFromSheet, batchUpdateSheetCells } from "../../../googleapis/logic/googleSheetsService.js";
import service from "../service.js";
import configEnv from "../../../../config/env.js";
import SurveyManager from "./SurveyManager.js";

const { PENDING_SHEET } = configEnv

class PendingManager {
  constructor() {
    this.pendingSurveys = [];
    this.surveyManager = SurveyManager;
    this.lock = false; // Para evitar envíos concurrentes
  }

  // * Carga los mensajes pendientes desde Google Sheets
  async loadPendingSurveys(to, messageId = null) {
    if (this.lock) {
      await service.sendMessage(to, "⏳ Ya hay una operación en curso. Por favor espera.");
      return;
    }
    this.lock = true;

    try {
      // estructura: Teléfono, Encuesta, Estado, FechaEnvío, Error
      const values = await getFromSheet(PENDING_SHEET + "!A2:C")

      if (!Array.isArray(values)) {
        await service.sendMessage(to, "⚠️ No se pudieron cargar los pendientes");
        return [];
      }

      this.pendingSurveys = values
        .filter((row) => row.length >= 3) // Filas completas
        .filter(([, , estado]) => !estado || estado.toString().trim() === "") // Filtra solo pendientes (sin estado)
        .map(([telefono, encuesta], index) => ({
          telefono: telefono?.toString().trim(),
          encuesta: encuesta?.toString().trim(),
          row: index + 2 // Fila en Sheets (A2 es la fila 2)
        }));

      // Validación de datos
      this.pendingSurveys = this.pendingSurveys.filter(p =>
        p.telefono && p.encuesta && p.telefono.match(/^\d+$/)
      );

      if (this.pendingSurveys.length === 0) {
        await service.sendMessage(to, "✅ No hay encuestas pendientes para enviar.");
        return [];
      }

      // Resumen de carga
      const summary = this.pendingSurveys.slice(0, 10) // Mostrar solo primeros 10
        .map((p, i) => `${i + 1}. ${p.telefono} - ${p.encuesta}`)
        .join("\n");

      const moreText = this.pendingSurveys.length > 10
        ? `\n\n...y ${this.pendingSurveys.length - 10} más`
        : "";

      await service.sendMessage(to,
        `📃 *${this.pendingSurveys.length}* pendientes cargados:\n${summary}${moreText}`
      );

      return this.pendingSurveys;

    } catch (error) {
      console.error("❌ Error al cargar pendientes:", error);
      await service.sendMessage(to, `⚠️ Error al cargar pendientes: ${error.message}`);
      throw error;

    } finally {
      this.lock = false;
      if (messageId) await service.markAsRead(messageId);
    }
  }

  // * Método para agregar nuevos pendientes
  async addPendingSurvey(phone, surveyTitle) {
    try {
      // Validar que la encuesta exista
      const survey = this.surveyManager.getSurveyByTitle(surveyTitle);
      if (!survey) {
        throw new Error(`La encuesta "${surveyTitle}" no existe`);
      }

      // Agregar a Google Sheets
      await appendToSheet(
        [phone, surveyTitle, "", "", ""], // Campos: teléfono, encuesta, estado, fecha, error
        PENDING_SHEET
      );

      return { success: true, phone, surveyTitle };
    } catch (error) {
      console.error("❌ Error al agregar pendiente:", error);
      throw error;
    }
  }

  // * Método para validar y formatear número de teléfono
  _formatPhoneNumber(phone) {
    // Eliminar todo lo que no sea número
    const cleaned = phone.toString().replace(/\D/g, '');

    // Si no tiene código de país, agregar +54 (Argentina)
    return cleaned.length === 10 ? `+54${cleaned}` : `+${cleaned}`;
  }

  // * Método privado para enviar una sola encuesta
  async _sendSingleSurvey(pendingSurvey, messageHandler) {

    const { telefono, encuesta, row } = pendingSurvey;
    const formattedPhone = this._formatPhoneNumber(telefono);
    const now = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

    try {
      // Validar teléfono
      if (!formattedPhone.match(/^\+\d{10,15}$/)) {
        throw new Error("Número de teléfono inválido");
      }

      // Buscar la encuesta
      const survey = this.surveyManager.getSurveyByTitle(encuesta);
      if (!survey) {
        await batchUpdateSheetCells([
          { cell: `${PENDING_SHEET}!C${row}`, value: "NO ENCONTRADA ⚠️" },
          { cell: `${PENDING_SHEET}!D${row}`, value: now },
        ]);
        return {
          success: false,
          telefono: formattedPhone,
          error: `Encuesta "${encuesta}" no encontrada`
        };
      }

      // Configurar estado de encuesta para el usuario
      if (messageHandler) {
        messageHandler.surveyState[formattedPhone] = {
          step: 0,
          answers: [],
          surveyIndex: this.surveyManager.surveys.indexOf(survey),
          meta: {
            fila: row,
            esPendiente: true // Marcar como envío pendiente
          },
        };
      }

      // Enviar mensaje inicial
      await service.sendMessage(
        formattedPhone,
        `📋 Hola! Queremos invitarte a responder una encuesta: *${encuesta}*`
      );

      // Manejar primera pregunta
      if (messageHandler) {
        await messageHandler.handleSurveyResponse(formattedPhone, 0);
      }

      // Actualizar estado en Sheets
      await batchUpdateSheetCells([
        { cell: `${PENDING_SHEET}!C${row}`, value: "ENVIADO ✅" },
        { cell: `${PENDING_SHEET}!D${row}`, value: now },
        { cell: `${PENDING_SHEET}!E${row}`, value: "" },
      ]);


      return {
        success: true,
        telefono: formattedPhone,
        encuesta
      };

    } catch (error) {
      const errorMsg = error.message.substring(0, 100);
      await batchUpdateSheetCells([
        { cell: `${PENDING_SHEET}!C${row}`, value: "ERROR ❌" },
        { cell: `${PENDING_SHEET}!D${row}`, value: now },
        { cell: `${PENDING_SHEET}!E${row}`, value: errorMsg },
      ]);

      return {
        success: false,
        telefono: formattedPhone,
        error: errorMsg,
        encuesta
      };
    }

  }

  // * Envía la siguiente encuesta pendiente
  async sendNextPendingSurvey(to, messageId = null, messageHandler = null) {
    if (this.lock) {
      await service.sendMessage(to, "⏳ Ya hay un envío en curso. Por favor espera.");
      return;
    }

    this.lock = true;

    try {
      if (this.pendingSurveys.length === 0) {
        await service.sendMessage(to, "ℹ️ No hay encuestas pendientes cargadas. Usa '/cargar pendientes' primero.");
        return null;
      }

      const pending = this.pendingSurveys.shift();
      const result = await this._sendSingleSurvey(pending, messageHandler);

      // Pequeño delay para evitar rate limits
      await new Promise(resolve => setTimeout(resolve, 500))

      const message = result.success
        ? `📨 Encuesta "${result.encuesta}" enviada a ${result.telefono} ✅`
        : `⚠️ Error al enviar a ${result.telefono}: ${result.error}`;

      await service.sendMessage(to, message);
      return result;

    } catch (error) {
      console.error("❌ Error al enviar siguiente pendiente:", error);
      await service.sendMessage(to, `⚠️ Error al enviar encuesta: ${error.message}`);
      throw error;

    } finally {
      this.lock = false;
      if (messageId) await service.markAsRead(messageId);
    }
  }

  // * Envía múltiples encuestas pendientes (con control de tasa)
  async sendMultiplePendingSurveys(to, quantity = 5, messageId = null, messageHandler = null) {
    if (this.lock) {
      await service.sendMessage(to, "⏳ Ya hay un envío en curso. Por favor espera.");
      return;
    }
    this.lock = true;

    try {
      if (this.pendingSurveys.length === 0) {
        await service.sendMessage(to, "ℹ️ No hay encuestas pendientes cargadas. Usa '/cargar pendientes' primero.");
        return [];
      }

      const actualQuantity = Math.min(quantity, this.pendingSurveys.length);
      const results = [];
      const BATCH_SIZE = 5; // Envíos por lote
      const DELAY_BETWEEN_BATCHES = 2000; // 2 segundos entre lotes

      for (let i = 0; i < actualQuantity; i += BATCH_SIZE) {
        const batch = this.pendingSurveys.splice(0, BATCH_SIZE);

        // Procesar lote actual
        const batchResults = await Promise.all(
          batch.map(pending => this._sendSingleSurvey(pending, messageHandler))
        );
        results.push(...batchResults);

        // Notificar progreso
        if (i + BATCH_SIZE < actualQuantity) {
          await service.sendMessage(
            to,
            `⏳ Procesando... (${Math.min(i + BATCH_SIZE, actualQuantity)}/${actualQuantity})`
          );
        }

        // Pequeño delay entre lotes
        if (i + BATCH_SIZE < actualQuantity) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }

      // Generar resumen
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;

      const summary = [
        `📊 *Resumen de envío múltiple*`,
        `• Total: ${results.length}`,
        `• Éxitos: ${successCount}`,
        `• Errores: ${errorCount}`,
        ``,
        `📋 *Detalle de errores:*`,
        ...results.filter(r => !r.success)
          .slice(0, 5) // Mostrar solo primeros 5 errores
          .map(r => `- ${r.telefono}: ${r.error}`)
      ].join("\n");


      await service.sendMessage(to, summary);
      return results;

    } catch (error) {
      console.error("❌ Error en envío múltiple:", error);
      await service.sendMessage(to, `⚠️ Error en envío múltiple: ${error.message}`);
      throw error;

    } finally {
      this.lock = false;
      if (messageId) await service.markAsRead(messageId);
    }
  }


}

export default new PendingManager();