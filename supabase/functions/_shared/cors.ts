// CORS compartido entre Edge Functions.
// Usamos "*" porque la función está protegida por verificación de JWT y se
// llama con un Bearer token (no cookies), así que no hay restricción de
// CORS con credenciales. localhost:5173 y producción quedan cubiertos.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
