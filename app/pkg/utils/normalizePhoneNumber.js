// Corrige situaciones de telefono
export function normalizePhoneNumber(number) {
  return number.replace(/^549/, "54"); // Para Arg se reemplaza el 9, sino va solo "to"
}