import express from "express";
import configEnv from "../config/env.js";
import appRouter from '../modules/routes.js'
import handleResponses from "../pkg/middleware/handleResponses.js";

// App initialization ------------------------------
const app = express();

// App Configurations --------------------------------
const port = configEnv.PORT || 8080;
app.use(express.json());

// App Middleware --------------------------------
app.use(handleResponses)

// App Routes --------------------------------
app.use('/', appRouter);

app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});
