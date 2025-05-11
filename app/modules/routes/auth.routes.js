import { Router } from "express";
import configEnv from "../../config/env.js";
import { addToSheet } from "../googleapis/logic/googleSheetsService.js";

const { USER_ADMIN_PASS, SESSION_SHEET } = configEnv
const router = Router();

// Middleware de autenticación
export const authenticate = (req, res, next) => {
  if (req.session.authenticated && req.session.username) {
    return next();
  }
  res.redirect('/login');
};

router
  // Ruta de login
  .get('/login', (req, res) => {
    res.renderPage('login', 'Acceso Admin', {});
  })

  // Procesar login
  .post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (password === USER_ADMIN_PASS) {
      req.session.authenticated = true;
      req.session.username = username;
      const now = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

      try {
        // Registrar acceso en Google Sheets
        await addToSheet(
          [now, username, req.ip || 'IP desconocida'],
          SESSION_SHEET
        );

        req.session.save(() => {
          res.redirect('/admin');
        });

      } catch (error) {
        console.error('Error registrando acceso:', error);
        // Aunque falle el registro, permitimos el login
        req.session.save(() => {
          res.redirect('/admin');
        });
      }
    } else {
      res.renderPage('login', 'Acceso Admin', {
        error: 'Credenciales incorrectas',
        username // Mantenemos el nombre de usuario ingresado
      });
    }
  })

  // Logout
  .get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });

export default router;