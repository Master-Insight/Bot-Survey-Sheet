import express from "express";
import session from 'express-session';
import handlebars from 'express-handlebars';
import configEnv from "../config/env.js";
import appRouter from '../modules/routes.js'
import handleResponses from "../pkg/middleware/handleResponses.js";
import __dirname from "../pkg/utils/dirname.js";

// Validación ENV requeridos ------------------------------
if (!configEnv.SECRET_COOKIE) {
  throw new Error('SECRET_COOKIE no está definido en las variables de entorno');
}

// App initialization ------------------------------
const app = express();

// App Configurations --------------------------------
const port = configEnv.PORT || 3000;

// Configuración de seguridad básica
app.disable('x-powered-by'); // Ocultar información del servidor
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Limitar tamaño de payload
app.use(express.json())
app.use(express.static(__dirname + '/public', {
  maxAge: configEnv.NODE_ENV === 'production' ? '1d' : '0' // Cache en producción
}));

// Handlebars --------------------------------
const hbs = handlebars.create({
  extname: '.hbs',
  helpers: {
    encodeURIComponent: (str) => encodeURIComponent(str),
    // Puedes agregar más helpers aquí según necesites
    eq: (a, b) => a === b, // {{#eq currentPath '/admin'}} -- dentro de codigo hbs
    json: (context) => JSON.stringify(context)
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', __dirname + '/pages');

// Sessiones-------------------------
const sessionConfig = {
  name: 'surveybot.sid', // Nombre personalizado para la cookie
  secret: configEnv.SECRET_COOKIE,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 4, // 4 horas de sesión
    secure: configEnv.NODE_ENV === 'production', // HTTPS en producción
    httpOnly: true, // Protección contra XSS
    sameSite: 'lax' // Protección contra CSRF
  },
  // No necesitamos store explícito si no nos importa perder sesiones al reiniciar
};
app.use(session(sessionConfig));

// App Middleware --------------------------------
app.use((req, res, next) => {
  // Pasar el estado de autenticación a todas las vistas
  res.locals.admin = req.session.admin || false; // disponibilisa admin como variable
  res.locals.currentPath = req.path; // disponibilisa currentPath como variable
  next();
});
app.use(handleResponses)

// App Routes --------------------------------
app.use('/', appRouter);

app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});
