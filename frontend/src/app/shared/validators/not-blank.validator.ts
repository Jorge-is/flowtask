import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Rechaza textos vacíos o compuestos solo por espacios (misma regla que el backend). */
export function notBlank(control: AbstractControl<string | null>): ValidationErrors | null {
  const value = control.value ?? '';
  return value.length > 0 && value.trim().length === 0 ? { blank: true } : null;
}
