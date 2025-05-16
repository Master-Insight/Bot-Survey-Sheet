import SurveyManager from "../../whatsapp/logic/managers/SurveyManager"

class PrivateService {

  async reloadSurveys() {
    try {
      await SurveyManager.loadSurveys();
      return {
        success: true,
        message: "🔁 Encuestas recargadas correctamente",
      }
    } catch (error) {
      console.log(error);

      return {
        success: false,
        message: "⚠️ Error al recargar encuestas",
      }
    }
  }


export default new PrivateService()