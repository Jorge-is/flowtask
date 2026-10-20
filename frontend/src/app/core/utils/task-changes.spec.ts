import { CreateTaskPayload, Task } from '../models/task.model';
import { getTaskChanges } from './task-changes';

const task: Task = {
  id: 1,
  title: 'Preparar informe',
  description: null,
  status: 'Pendiente',
  dueDate: '2026-10-01',
  category: { id: 1, name: 'Trabajo', description: null },
};

const unchanged: CreateTaskPayload = {
  title: 'Preparar informe',
  description: null,
  status: 'Pendiente',
  dueDate: '2026-10-01',
  categoryId: 1,
};

describe('getTaskChanges', () => {
  it('devuelve un objeto vacío si nada cambió', () => {
    expect(getTaskChanges(task, unchanged)).toEqual({});
  });

  it('devuelve solo los campos modificados', () => {
    const changes = getTaskChanges(task, { ...unchanged, title: 'Informe final', categoryId: 2 });

    expect(changes).toEqual({ title: 'Informe final', categoryId: 2 });
  });

  it('no incluye la fecha si no cambió, aunque ya esté vencida', () => {
    const changes = getTaskChanges(task, { ...unchanged, status: 'En Progreso' });

    expect(changes).not.toHaveProperty('dueDate');
  });

  it('incluye la descripción cuando se borra', () => {
    const withDescription = { ...task, description: 'Consolidar avances' };

    expect(getTaskChanges(withDescription, unchanged)).toEqual({ description: null });
  });
});
