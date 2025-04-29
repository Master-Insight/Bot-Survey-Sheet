import axios from "axios";
import configEnv from "../../config/env.js";

const { BASE_WP_URL, API_VERSION, BUSINESS_PHONE, API_TOKEN } = configEnv

const whatsappClient = axios.create({
  baseURL: `${BASE_WP_URL}/${API_VERSION}/${BUSINESS_PHONE}`,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 1000 * 5, // Tiempo de espera máximo de 5 segundos - opcional
})

export default whatsappClient;