import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

const MESSAGES = {
  offline:
    'No se pudo conectar con el servidor. Verifica que la API esté disponible e intenta de nuevo.',
  validation: 'Hay datos inválidos. Revisa el formulario e intenta de nuevo.',
  server: 'El servidor no pudo procesar la solicitud. Intenta de nuevo en unos minutos.',
  fallback: 'No se pudo completar la operación. Intenta de nuevo.',
} as const;

/** Traduce un error HTTP a un mensaje comprensible para el usuario. */
export function toUserMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return MESSAGES.offline;
  }
  if (error.status >= HttpStatusCode.InternalServerError) {
    return MESSAGES.server;
  }

  const detail: unknown = error.error?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (error.status === HttpStatusCode.UnprocessableEntity) {
    return MESSAGES.validation;
  }
  return MESSAGES.fallback;
}
