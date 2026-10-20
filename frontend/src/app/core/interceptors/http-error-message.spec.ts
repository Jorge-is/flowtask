import { HttpErrorResponse } from '@angular/common/http';

import { toUserMessage } from './http-error-message';

function errorWith(status: number, error: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('toUserMessage', () => {
  it('indica que el servidor no responde cuando no hay conexión', () => {
    expect(toUserMessage(errorWith(0))).toBe(
      'No se pudo conectar con el servidor. Verifica que la API esté disponible e intenta de nuevo.',
    );
  });

  it('usa el detalle de la API cuando es un texto', () => {
    expect(toUserMessage(errorWith(404, { detail: 'Tarea no encontrada' }))).toBe(
      'Tarea no encontrada',
    );
  });

  it('resume los errores de validación de Pydantic', () => {
    const pydanticError = { detail: [{ loc: ['body', 'title'], msg: 'String too short' }] };

    expect(toUserMessage(errorWith(422, pydanticError))).toBe(
      'Hay datos inválidos. Revisa el formulario e intenta de nuevo.',
    );
  });

  it('da un mensaje genérico ante errores del servidor', () => {
    expect(toUserMessage(errorWith(500, { detail: 'Error interno del servidor' }))).toBe(
      'El servidor no pudo procesar la solicitud. Intenta de nuevo en unos minutos.',
    );
  });
});
