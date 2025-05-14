import { Router } from "express";
import whatsappRouter from "./whatsapp/api/routes.js"
import authRouter from "./admin/api/auth.routes.js";
import adminRouter from "./admin/api/admin.routes.js";
import viewsRouter from "./routes/views.routes.js";

const router = Router()

// Log de session
// router.use((req, res, next) => {
//   console.log('Session data:', req.session);
//   next();
// });

router
  // Rutas Publicas
  .use("/", viewsRouter)
  .use('/webhook/', whatsappRouter)
  // Rutas para Autenticación 
  .use("/", authRouter)
  // Rutas Privadas
  .use("/", adminRouter)

// Manejo de errores 404
router.use((req, res) => {
  res.status(404).render('404', {
    title: 'Página no encontrada',
    admin: req.session.admin || false
  });
});

// Manejo de errores global
router.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).render('500', {
    title: 'Error del servidor',
    admin: req.session.admin || false
  });
});

export default router