import { Injectable } from '@angular/core';
import { MAT_NATIVE_DATE_FORMATS, MatDateFormats, NativeDateAdapter } from '@angular/material/core';

const INPUT_FORMAT = 'dd/mm/aaaa';
const DAY_FIRST_PATTERN = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;

export const DAY_FIRST_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: INPUT_FORMAT },
  display: { ...MAT_NATIVE_DATE_FORMATS.display, dateInput: INPUT_FORMAT },
};

/**
 * NativeDateAdapter interpreta lo que se escribe con `Date.parse` (formato mes/día de EE. UU.),
 * así que "30/10/2026" resulta inválido. Este adapter lee y muestra las fechas como día/mes/año.
 */
@Injectable()
export class DayFirstDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat: unknown): Date | null {
    if (typeof value !== 'string') {
      return super.parse(value, parseFormat);
    }
    const text = value.trim();
    if (!text) {
      return null;
    }
    const match = DAY_FIRST_PATTERN.exec(text);
    if (!match) {
      return this.invalid();
    }
    const [day, month, year] = match.slice(1).map(Number);
    const date = new Date(year, month - 1, day);
    // Date "corrige" fechas imposibles (31/02 → 03/03); eso debe contar como inválido.
    const isRealDate = date.getDate() === day && date.getMonth() === month - 1;
    return isRealDate ? date : this.invalid();
  }

  override format(date: Date, displayFormat: unknown): string {
    if (displayFormat !== INPUT_FORMAT) {
      return super.format(date, displayFormat as object);
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  }
}
