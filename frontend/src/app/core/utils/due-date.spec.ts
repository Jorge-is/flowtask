import { getDueDateUrgency, parseIsoDate, toIsoDate } from './due-date';

describe('parseIsoDate', () => {
  it('interpreta la fecha en hora local, sin desfasarse un día por UTC', () => {
    const date = parseIsoDate('2026-10-23');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(23);
  });
});

describe('toIsoDate', () => {
  it('formatea una fecha local como YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('getDueDateUrgency', () => {
  const today = new Date(2026, 9, 20, 15, 0);

  it.each([
    ['2026-10-19', 'Pendiente', 'overdue'],
    ['2026-10-20', 'En Progreso', 'today'],
    ['2026-10-27', 'Pendiente', 'soon'],
    ['2026-10-28', 'Pendiente', 'later'],
    ['2026-10-01', 'Completada', 'done'],
  ] as const)('%s con estado %s es %s', (dueDate, status, expected) => {
    expect(getDueDateUrgency(dueDate, status, today)).toBe(expected);
  });
});
