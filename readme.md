
# 🤖 WhatsApp Bot - Medpet Encuestas

Este proyecto implementa un bot conversacional de WhatsApp para automatizar encuestas dinámicas, utilizando la API de WhatsApp Cloud y Google Sheets como backend de datos.

> Forma parte de los desarrollos de [InsightDevs](https://insightdevs.com.ar/), una plataforma de soluciones conversacionales automatizadas para negocios, eventos y servicios.

---

## ✨ Funcionalidades principales

- 📲 Recibe mensajes entrantes por WhatsApp
- 🧠 Reconoce comandos personalizados (saludos, ayuda, etc.)
- 📄 Carga encuestas dinámicas desde Google Sheets
- 💬 Envía preguntas con botones, texto libre o multimedia
- 🗃️ Registra respuestas en la misma hoja de cálculo
- 🖼️ Soporte para imágenes, contactos, ubicaciones
- ♻️ Modular y reutilizable para distintos flujos de negocio

---

## 🛠️ Tecnologías utilizadas

- Node.js + Express
- API de WhatsApp Cloud (Meta)
- API de Google Sheets
- Arquitectura MVC
- Webhooks + REST API
- Compatibilidad con Postman

---

## ⚙️ Configuración de la App en Meta for Developers

### PASO 0 – Token de acceso
- Usar el token temporal o configurar uno permanente vía sistema de tokens.
- Atención: los tokens temporales se vencen cada ~3 horas.

### PASO 1 – Validar número de teléfono
- El número debe estar en formato internacional, **sin `0` ni `15`**.  
  Ejemplo: `54911XXXXXXXX`

### PASO 2 – Configurar Webhooks
1. Activar puertos en tu entorno local (ej: Visual Studio Code > PORTS)
2. Hacer público el puerto (usando `dev tunnels`, `ngrok`, etc.)
3. Establecer `https://<tu_túnel>.devtunnels.ms/webhook` como URL
4. Agregar el token de verificación: `WEBHOOK_VERIFY_TOKEN`
5. Activar los siguientes eventos:
   - ✅ messages
   - ✅ message_template_status_update
   - ✅ message_template_quality_update

---

## 🌐 Variables de entorno (`.env`)

```env
PORT=3000
WHATSAPP_TOKEN=<token_de_acceso>
WHATSAPP_PHONE_NUMBER_ID=<id_del_número>
WHATSAPP_VERIFY_TOKEN=<token_webhook>
GOOGLE_SHEET_ID=<id_de_la_hoja>
GOOGLE_CREDENTIALS=<credenciales_google_base64>
```

---

## 🧪 Pruebas y documentación

### Colecciones recomendadas:

- 📚 [Documentación oficial API de WhatsApp Cloud](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- 🧪 [Colección Postman oficial](https://elements.getpostman.com/view/fork?collection=13382743-84d01ff8-4253-4720-b454-af661f36acc2&referrer=https%3A%2F%2Fdevelopers.facebook.com%2Fapp%2Fdashboard#)
- 🤖 [OpenAI API Reference](https://platform.openai.com/docs/api-reference/introduction)
- 🧰 [Landing Template (GNDX)](https://github.com/gndx/whatsapp-landing)

### Consejos para comenzar

- 🟢 **Inicio rápido**: Usar `Examples → Send Sample Text Message` en Postman
- 💬 **Mensajes**: Ver `API Reference → Messages`
- 🧠 **IA + WhatsApp**: Explorar cómo alimentar la IA con datos de Google Sheets o formularios

---

## 📋 Roadmap y tareas pendientes

- [x] Integración con Google Sheets como backend dinámico
- [ ] Armar encuestas predeterminadas reutilizables
- [ ] Guardar respuestas en una tabla adicional por usuario
- [ ] Convertir el proyecto en plantilla reutilizable (boilerplate)
- [ ] Integrar módulo IA (OpenAI) para preguntas abiertas
- [ ] Implementar lógica condicional y validaciones por pregunta
- [ ] Exportación y análisis de respuestas (dashboard o CSV)

---

## ♻️ Reutilización en otros negocios

El sistema está pensado para adaptarse fácilmente a distintos rubros y flujos:

- 🏥 Clínicas médicas o veterinarias (turnos, seguimientos)
- 🛍️ Tiendas y catálogos conversacionales
- 📝 Formularios de inscripción o reclamos
- 📊 Encuestas de satisfacción o atención
- 📥 Captura de leads automatizada

> ¿Querés implementar algo parecido en tu negocio? Contactanos en [InsightDevs](https://insightdevs.com.ar/)

---

## 🤝 Contribuciones

Este proyecto está en desarrollo activo. Se agradecen sugerencias, pull requests o ideas para ampliarlo.  
Se prioriza el uso de una arquitectura clara, modular y escalable.
