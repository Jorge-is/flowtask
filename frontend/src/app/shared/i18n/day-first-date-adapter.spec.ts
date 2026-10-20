import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { DAY_FIRST_DATE_FORMATS, DayFirstDateAdapter } from './day-first-date-adapter';

describe('DayFirstDateAdapter', () => {
  let adapter: DayFirstDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DayFirstDateAdapter, { provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
    });
    adapter = TestBed.inject(DayFirstDateAdapter);
  });

  it.each(['30/10/2026', '30-10-2026', '30.10.2026'])('interpreta %s como día/mes/año', (text) => {
    const date = adapter.parse(text, null);

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(30);
  });

  it('marca como inválida una fecha inexistente', () => {
    expect(adapter.isValid(adapter.parse('31/02/2026', null) as Date)).toBe(false);
  });

  it('devuelve null si el campo está vacío', () => {
    expect(adapter.parse('', null)).toBeNull();
  });

  it('muestra la fecha del input como dd/mm/aaaa', () => {
    const inputFormat = DAY_FIRST_DATE_FORMATS.display.dateInput;

    expect(adapter.format(new Date(2026, 0, 5), inputFormat)).toBe('05/01/2026');
  });
});
