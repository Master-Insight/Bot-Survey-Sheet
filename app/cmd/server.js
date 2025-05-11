import express from "express";
import session from 'express-session';
import handlebars from 'express-handlebars';
import configEnv from "../config/env.js";
import appRouter from '../modules/routes.js'
import handleResponses from "../pkg/middleware/handleResponses.js";
import __dirname from "../pkg/utils/dirname.js";

// App initialization ------------------------------
const app = express();

// App Configurations --------------------------------
const port = configEnv.PORT || 3000;
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(__dirname + '/public'));

// Handlebars --------------------------------
const hbs = handlebars.create({
  extname: '.hbs',
  helpers: {
    encodeURIComponent: (str) => encodeURIComponent(str)
  }
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', __dirname + '/pages');

// Sessiones-------------------------
app.use(session({
  secret: configEnv.SECRET_COOKIE, // Cambia esto por una cadena secreta
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambia a true si usas HTTPS
}));

// App Middleware --------------------------------
app.use(handleResponses)

// App Routes --------------------------------
app.use('/', appRouter);

app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});
