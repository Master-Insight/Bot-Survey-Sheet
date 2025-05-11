import { Router } from "express";
import configEnv from "../config/env.js";

const { USER_ADMIN_PASS } = configEnv
const router = Router();

// Middleware de autenticación
const authenticate = (req, res, next) => {
  if (req.session.authenticated) {
    return next();
  }
  res.redirect('/login');
};

// Ruta de login
router.get('/login', (req, res) => {
  res.renderPage('login', 'Acceso Admin', {});
});

// Procesar login
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (password === USER_ADMIN_PASS) {
    req.session.authenticated = true;
    req.session.save(() => {
      res.redirect('/admin');
    });
  } else {
    res.renderPage('login', 'Acceso Admin', {
      error: 'Contraseña incorrecta'
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

export default router;