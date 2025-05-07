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
  }

  // * Carga los mensajes pendientes desde Google Sheets
  async loadPendingSurveys(to, messageId = null) {

    try {
      // estructura: Teléfono, Encuesta, Estado, FechaEnvío, Error
      const values = await getFromSheet(PENDING_SHEET + "!A:C")
      if (!Array.isArray(values)) return;
      values.shift(); // Eliminar headers

      this.pendingSurveys = values
        .filter(([, , estado]) => !estado) // Filtra solo pendientes (sin estado)
        .map(([telefono, encuesta], index) => ({
          telefono,
          encuesta,
          row: index + 2 // +2 porque, al eliminar el encabezado, empezamos en A2 (fila 2)
        }));

      // Resumen de carga
      const summary = this.pendingSurveys.map(p => `• Cel: ${p.telefono} - Encuesta: ${p.encuesta}`).join("\n");
      await service.sendMessage(to, `📃 Pendientes cargados\n${summary}`);
      if (messageId) await service.markAsRead(messageId);

      return this.pendingSurveys;

    } catch (error) {
      console.error("❌ Error al cargar pendientes:", error);
      await service.sendMessage(to, "⚠️ Error al cargar pendientes");
      if (messageId) await service.markAsRead(messageId);
      throw error;
    }
  }

  // * Método privado para enviar una sola encuesta
  async _sendSingleSurvey(pendingSurvey, messageHandler) {

    const { telefono, encuesta, row } = pendingSurvey;
    const now = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

    try {
      // Buscar la encuesta
      const surveyIndex = this.surveyManager.surveys.findIndex(s =>
        encuesta.toLowerCase().trim() === s.title.toLowerCase().trim()
      );

      if (surveyIndex === -1) {
        await batchUpdateSheetCells([
          { cell: `${PENDING_SHEET}!C${row}`, value: "NO ENCONTRADA ⚠️" },
          { cell: `${PENDING_SHEET}!D${row}`, value: now },
        ]);
        return { success: false, telefono, error: "Encuesta no encontrada" };
      }

      // Configurar estado de encuesta para el usuario
      if (messageHandler) {
        messageHandler.surveyState[telefono] = {
          step: 0,
          answers: [],
          surveyIndex,
          meta: { fila: row },
        };
      }

      // Enviar mensaje inicial
      await service.sendMessage(telefono, `📋 Hola! Queremos invitarte a responder una encuesta: *${encuesta}*`);

      // Manejar primera pregunta
      if (messageHandler) {
        await messageHandler.handleSurveyResponse(telefono, 0);
      }

      // Actualizar estado en Sheets
      await batchUpdateSheetCells([
        { cell: `${PENDING_SHEET}!C${row}`, value: "ENVIADO ✅" },
        { cell: `${PENDING_SHEET}!D${row}`, value: now },
        { cell: `${PENDING_SHEET}!E${row}`, value: "" },
      ]);
      return { success: true, telefono };

    } catch (error) {
      await batchUpdateSheetCells([
        { cell: `${PENDING_SHEET}!C${row}`, value: "ERROR ❌" },
        { cell: `${PENDING_SHEET}!D${row}`, value: now },
        { cell: `${PENDING_SHEET}!E${row}`, value: error.toString().substring(0, 100) },
      ]);
      return { success: false, telefono, error: error.toString() };
    }

  }

  // * Envía la siguiente encuesta pendiente
  async sendNextPendingSurvey(to, messageId = null, messageHandler = null) {
    try {
      if (this.pendingSurveys.length === 0) {
        await service.sendMessage(to, "✅ No hay encuestas pendientes para enviar.");
        return;
      }

      const pending = this.pendingSurveys.shift();
      const result = await this._sendSingleSurvey(pending, messageHandler);

      const message = result.success
        ? `📨 Encuesta enviada a ${result.telefono} ✅`
        : `⚠️ ${result.error} para ${result.telefono}`;

      await service.sendMessage(to, message);
      if (messageId) await service.markAsRead(messageId);

      return result;
    } catch (error) {
      console.error("❌ Error al enviar siguiente pendiente:", error);
      await service.sendMessage(to, "⚠️ Error al enviar encuesta pendiente");
      if (messageId) await service.markAsRead(messageId);
      throw error;
    }
  }

  // * Envía múltiples encuestas pendientes
  async sendMultiplePendingSurveys(to, quantity = 5, messageId = null, messageHandler = null) {
    try {
      if (this.pendingSurveys.length === 0) {
        await service.sendMessage(to, "✅ No hay encuestas pendientes para enviar.");
        return;
      }

      const results = [];
      const actualQuantity = Math.min(quantity, this.pendingSurveys.length);

      for (let i = 0; i < actualQuantity; i++) {
        const pending = this.pendingSurveys.shift();
        const result = await this._sendSingleSurvey(pending, messageHandler);
        results.push(result);
      }

      const summary = results.map(r =>
        r.success
          ? `✅ ${r.telefono}`
          : `❌ ${r.telefono} - ${r.error}`
      ).join("\n");

      await service.sendMessage(to, `📦 Resultado de envío múltiple (${actualQuantity}):\n${summary}`);
      if (messageId) await service.markAsRead(messageId);

      return results;
    } catch (error) {
      console.error("❌ Error en envío múltiple:", error);
      await service.sendMessage(to, "⚠️ Error al enviar múltiples encuestas");
      if (messageId) await service.markAsRead(messageId);
      throw error;
    }
  }
}

export default new PendingManager();