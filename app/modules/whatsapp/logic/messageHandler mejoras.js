// En MessageHandler.js, actualiza el método handleSurveyEnd

async handleSurveyEnd(to, answers, title) {
  const survey = SurveyManager.surveys.find(s => s.title === title);
  if (!survey) return;

  const resumen = answers.map((res, i) =>
    `• ${survey.questions[i]}: ${res}`
  ).join("\n");

  await service.sendMessage(
    to,
    `✅ Encuesta "${title}" completada:\n\n${resumen}`
  );

  const now = new Date().toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires"
  });

  try {
    // Guardar respuestas
    await addToSheet([to, now, title, ...answers], 'answers');
    await service.sendMessage(to, "📄 Tus respuestas fueron registradas.");

    // Si era un pendiente, marcarlo como completado
    const userState = this.surveyState[to];
    if (userState?.meta?.esPendiente && userState.meta.fila) {
      await batchUpdateSheetCells([
        { cell: `'A enviar'!F${userState.meta.fila}`, value: "COMPLETADA ✅" },
        { cell: `'A enviar'!G${userState.meta.fila}`, value: now }
      ]);
    }
  } catch (error) {
    console.error("❌ Error al guardar encuesta:", error);
    await service.sendMessage(
      to,
      "⚠️ Hubo un problema al guardar tus respuestas. Por favor inténtalo más tarde."
    );
  } finally {
    delete this.surveyState[to];
  }
}