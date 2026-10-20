import { TaskStatus } from '../models/task.model';

export type DueDateUrgency = 'overdue' | 'today' | 'soon' | 'later' | 'done';

const SOON_THRESHOLD_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Convierte `YYYY-MM-DD` en una fecha local a medianoche.
 * `new Date('YYYY-MM-DD')` la interpreta en UTC y, en zonas como Lima (UTC-5), muestra el día anterior.
 */
export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getDueDateUrgency(
  dueDate: string,
  status: TaskStatus,
  today: Date = new Date(),
): DueDateUrgency {
  if (status === 'Completada') {
    return 'done';
  }
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysLeft = Math.round((parseIsoDate(dueDate).getTime() - startOfToday.getTime()) / MS_PER_DAY);

  if (daysLeft < 0) return 'overdue';
  if (daysLeft === 0) return 'today';
  if (daysLeft <= SOON_THRESHOLD_DAYS) return 'soon';
  return 'later';
}
