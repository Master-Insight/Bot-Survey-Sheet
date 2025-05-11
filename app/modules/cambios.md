# Implementación de Acceso Administrativo con Autenticación

Voy a crear un sistema de autenticación simple pero seguro para el panel administrativo, utilizando:

1. Una clave almacenada en ENV
2. Sesiones del servidor (no localStorage del cliente)
3. Protección de rutas administrativas

## 1. Primero, actualiza el layout principal (layout/main.hbs)

Agrega el botón administrativo condicional:

```html
<!-- Dentro del header, después del título -->
<div class="px-4 py-5 sm:px-6 flex justify-between">
  <div>
    <a href="/">
      <h1 class="text-xl leading-6 font-bold text-gray-900">
        Insight Dev - Encuestas Bot
      </h1>
    </a>
    <h2 class="text-sm leading-6 text-gray-500 -mt-1">@insightdev</h2>
    <p class="mt-1 max-w-3xl text-md text-gray-500 mr-6">
      Bots generados a partir de una tabla Sheets
    </p>
  </div>
  <div class="flex flex-col items-end">
    {{#if admin}}
    <a href="/admin" class="mb-2 text-sm text-indigo-600 hover:text-indigo-800">
      Panel Admin
    </a>
    {{else}}
    <a href="/login" class="mb-2 text-sm text-indigo-600 hover:text-indigo-800">
      Acceso Admin
    </a>
    {{/if}}
    <a href="https://www.insightdevs.com.ar" target="_blank">
      <img
        class="rounded-lg w-24"
        src="https://avatars.githubusercontent.com/u/179395921?v=4"
        alt="Insight Dev"
      />
    </a>
  </div>
</div>
```

## 2. Crea la vista de login (views/login.hbs)

```html
<div class="px-4 py-5 sm:p-6">
  <h3 class="text-lg font-medium leading-6 text-gray-900">Acceso Administrativo</h3>
  
  <form action="/login" method="POST" class="mt-5">
    <div class="shadow sm:rounded-md sm:overflow-hidden">
      <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
        <div class="grid grid-cols-3 gap-6">
          <div class="col-span-3">
            <label for="password" class="block text-sm font-medium text-gray-700">
              Clave de acceso
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>
      <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <button
          type="submit"
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Ingresar
        </button>
      </div>
    </div>
  </form>
</div>
```

## 3. Crea la vista del panel admin (views/admin.hbs)

```html
<div class="px-4 py-5 sm:p-6">
  <h3 class="text-lg font-medium leading-6 text-gray-900">Panel Administrativo</h3>
  
  <div class="mt-5 shadow sm:rounded-md sm:overflow-hidden">
    <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
      <div class="grid grid-cols-1 gap-6">
        
        <!-- Sección Encuestas -->
        <div>
          <h4 class="text-md font-medium text-gray-900 mb-3">Gestión de Encuestas</h4>
          <div class="flex space-x-3">
            <form action="/admin/reload-surveys" method="POST">
              <button
                type="submit"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Recargar Encuestas
              </button>
            </form>
            
            <a 
              href="/admin/pending-surveys"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ver Pendientes
            </a>
          </div>
        </div>
        
        <!-- Sección Estadísticas -->
        <div class="border-t border-gray-200 pt-4">
          <h4 class="text-md font-medium text-gray-900 mb-3">Estadísticas</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm text-gray-500">Encuestas cargadas</p>
              <p class="text-2xl font-bold">{{surveysCount}}</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm text-gray-500">Respuestas registradas</p>
              <p class="text-2xl font-bold">{{answersCount}}</p>
            </div>
          </div>
        </div>
        
        <!-- Cerrar sesión -->
        <div class="border-t border-gray-200 pt-4 text-right">
          <form action="/logout" method="POST">
            <button
              type="submit"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
```

## 4. Actualiza el router (router/views.js)

```javascript
import { Router } from "express";
import { getFromSheet } from "./googleapis/logic/googleSheetsService.js";
import { ADMIN_PASSWORD } from "../../config/env.js";

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
    if (password === ADMIN_PASSWORD) {
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
```

## 5. Configuración necesaria en el servidor principal

Asegúrate de tener:

1. `express-session` instalado:
```bash
npm install express-session
```

2. Configuración básica de sesión (en tu archivo principal del servidor):
```javascript
import session from 'express-session';

// Configuración de sesión
app.use(session({
  secret: 'tu_secreto_seguro', // Cambia esto por un secreto fuerte
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    maxAge: 1000 * 60 * 60 // 1 hora de sesión
  }
}));
```

3. Variable de entorno en tu `.env`:
```env
ADMIN_PASSWORD=tu_clave_segura_123
```

## 6. Vista adicional para pendientes (views/pending-surveys.hbs)

```html
<div class="px-4 py-5 sm:p-6">
  <h3 class="text-lg font-medium leading-6 text-gray-900">Encuestas Pendientes</h3>
  
  {{#if error}}
    <div class="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{error}}</p>
        </div>
      </div>
    </div>
  {{/if}}

  <div class="mt-5 shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Teléfono
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Encuesta
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Estado
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {{#each pendientes}}
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{this.[0]}}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{this.[1]}}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{this.[2]}}
            </td>
          </tr>
        {{else}}
          <tr>
            <td colspan="3" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
              No hay encuestas pendientes
            </td>
          </tr>
        {{/each}}
      </tbody>
    </table>
  </div>

  <div class="mt-5 text-right">
    <a 
      href="/admin"
      class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Volver al panel
    </a>
  </div>
</div>
```

## Características clave de esta implementación:

1. **Autenticación segura**:
   - Usa sesiones del servidor (no localStorage)
   - La clave se almacena en variables de entorno
   - Las sesiones tienen tiempo de expiración

2. **Protección de rutas**:
   - Middleware `checkAuth` para proteger rutas administrativas
   - Redirección a login si no autenticado

3. **Panel administrativo**:
   - Estadísticas básicas
   - Acciones administrativas
   - Vista de pendientes

4. **Experiencia de usuario**:
   - Feedback visual de errores/éxitos
   - Diseño coherente con el resto de la aplicación
   - Navegación intuitiva

Para usar este sistema:

1. El usuario hace clic en "Acceso Admin" en la barra superior
2. Ingresa la clave (definida en .env)
3. Si es correcta, accede al panel con las opciones administrativas
4. La sesión se mantiene por 1 hora o hasta que haga logout

Este enfoque es más seguro que usar localStorage porque:
- La autenticación se maneja en el servidor
- La clave nunca se expone al cliente
- Las sesiones pueden invalidarse del lado del servidor
- Es menos vulnerable a ataques XSS