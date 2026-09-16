// Next.js (esta versión) no reenvía el mensaje de un `throw` hecho en un
// Server Action al cliente en producción: lo reemplaza por un error
// genérico minificado. Los errores esperados (validación, sesión vencida,
// credenciales incorrectas, etc.) tienen que modelarse como valor de
// retorno en vez de tirarse. Ver node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md.
export type ActionError = { error: string };

export type ActionResult<T> = T | ActionError;

export function isActionError(value: unknown): value is ActionError {
  return typeof value === "object" && value !== null && "error" in value;
}
