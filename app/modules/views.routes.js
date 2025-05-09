import { Router } from "express";
import { getFromSheet } from "./googleapis/logic/googleSheetsService.js";
import configEnv from "../config/env.js";

const USER_ADMIN_PASS{ } = configEnv

const router = Router();

// Middleware para verificar autenticación
const checkAuth = (req, res, next) => {
  if (req.session.admin) {
    return next();
  }
  res.redirect('/login');
};

// Ruta de login
router
  .get("/login", (req, res) => {
    if (req.session.admin) {
      return res.redirect('/admin');
    }
    res.renderPage("login", "Acceso Admin", {});
  })
  .post("/login", (req, res) => {
    const { password } = req.body;
    if (password === USER_ADMIN_PASS) {
      req.session.admin = true;
      return res.redirect('/admin');
    }
    res.renderPage("login", "Acceso Admin", {
      error: "Clave incorrecta"
    });
  });

// Ruta de logout
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Panel administrativo
router.get("/admin", checkAuth, async (req, res) => {
  try {
    const config = await getFromSheet('TCONFIG');
    const answers = await getFromSheet('answers');

    const surveysCount = Array.isArray(config) ? config.length - 1 : 0;
    const answersCount = Array.isArray(answers) ? answers.length - 1 : 0;

    res.renderPage("admin", "Panel Admin", {
      surveysCount,
      answersCount,
      admin: true
    });
  } catch (error) {
    console.error("Error loading admin data:", error);
    res.renderPage("admin", "Panel Admin", {
      error: "Error cargando datos",
      admin: true
    });
  }
});

// Acción para recargar encuestas
router.post("/admin/reload-surveys", checkAuth, async (req, res) => {
  try {
    // Aquí iría la lógica para recargar encuestas
    // Por ejemplo: await SurveyManager.loadSurveys();
    res.redirect('/admin?success=Encuestas recargadas');
  } catch (error) {
    res.redirect('/admin?error=Error al recargar encuestas');
  }
});

// Vista de pendientes
router.get("/admin/pending-surveys", checkAuth, async (req, res) => {
  try {
    const pendientes = await getFromSheet("'A enviar'!A2:C");
    res.renderPage("pending-surveys", "Pendientes", {
      pendientes: Array.isArray(pendientes) ? pendientes : [],
      admin: true
    });
  } catch (error) {
    res.renderPage("pending-surveys", "Pendientes", {
      error: "Error cargando pendientes",
      admin: true
    });
  }
});

// Rutas públicas
router
  .get("/", async (req, res) => {
    const config = await getFromSheet('TCONFIG');
    const surveys = Array.isArray(config) ? config.slice(1).map(rgln => rgln[0]) : [];
    res.renderPage("index", "Bot Whatsapp InsightDev", {
      surveys,
      admin: req.session.admin
    });
  })
  .get("/politica", (req, res) => {
    res.renderPage("politica", "Politica", {
      admin: req.session.admin
    });
  })
  .get("/conducta", (req, res) => {
    res.renderPage("conducta", "Conducta", {
      admin: req.session.admin
    });
  });

export default router;