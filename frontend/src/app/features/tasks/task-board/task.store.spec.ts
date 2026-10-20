import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { Page } from '../../../core/models/page.model';
import { Task } from '../../../core/models/task.model';
import { NotificationService } from '../../../core/services/notification.service';
import { TaskService } from '../../../core/services/task.service';
import { TaskStore } from './task.store';

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: 'Preparar informe',
    description: null,
    status: 'Pendiente',
    dueDate: '2026-10-23',
    category: { id: 1, name: 'Trabajo', description: null },
    ...overrides,
  };
}

function pageOf(items: Task[]): Page<Task> {
  return { items, total: items.length, limit: 10, offset: 0 };
}

describe('TaskStore', () => {
  let store: TaskStore;
  const taskService = {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const notifications = { success: vi.fn(), error: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    taskService.list.mockReturnValue(of(pageOf([buildTask()])));
    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TaskService, useValue: taskService },
        { provide: NotificationService, useValue: notifications },
      ],
    });
    store = TestBed.inject(TaskStore);
  });

  it('carga las tareas y el total', () => {
    store.load();

    expect(store.tasks()).toEqual([buildTask()]);
    expect(store.total()).toBe(1);
    expect(store.loading()).toBe(false);
  });

  it('al filtrar por estado consulta al backend desde la primera página', () => {
    store.setPage({ limit: 10, offset: 20 });

    store.setStatusFilter('Completada');

    expect(taskService.list).toHaveBeenLastCalledWith(
      { status: 'Completada', categoryId: null },
      { limit: 10, offset: 0 },
    );
  });

  it('limpiar filtros vuelve a "Todos" con una sola consulta desde la primera página', () => {
    store.setStatusFilter('Pendiente');
    store.setCategoryFilter(2);
    store.setPage({ limit: 10, offset: 20 });
    taskService.list.mockClear();

    store.clearFilters();

    expect(store.filters()).toEqual({ status: null, categoryId: null });
    expect(taskService.list).toHaveBeenCalledTimes(1);
    expect(taskService.list).toHaveBeenLastCalledWith(
      { status: null, categoryId: null },
      { limit: 10, offset: 0 },
    );
  });

  it('marca la carga como fallida si la API no responde', () => {
    taskService.list.mockReturnValue(throwError(() => new Error('offline')));

    store.load();

    expect(store.loadFailed()).toBe(true);
    expect(store.loading()).toBe(false);
  });

  it('cambia el estado en la UI antes de que responda la API', () => {
    store.load();
    const pendingUpdate = new Subject<Task>();
    taskService.update.mockReturnValue(pendingUpdate);

    store.changeStatus(buildTask(), 'Completada');

    expect(store.tasks()[0].status).toBe('Completada');
    expect(taskService.update).toHaveBeenCalledWith(1, { status: 'Completada' });
  });

  it('revierte el cambio de estado si la API falla', () => {
    store.load();
    taskService.update.mockReturnValue(throwError(() => new Error('500')));

    store.changeStatus(buildTask(), 'Completada');

    expect(store.tasks()[0].status).toBe('Pendiente');
  });

  it('recarga si la tarea deja de coincidir con el filtro activo', () => {
    store.setStatusFilter('Pendiente');
    taskService.update.mockReturnValue(of(buildTask({ status: 'Completada' })));
    taskService.list.mockClear();

    store.changeStatus(buildTask(), 'Completada');

    expect(taskService.list).toHaveBeenCalledTimes(1);
  });

  it('elimina la tarea de la lista y avisa al usuario', () => {
    store.load();
    taskService.delete.mockReturnValue(of(undefined));
    taskService.list.mockReturnValue(of(pageOf([])));

    store.remove(buildTask());

    expect(store.tasks()).toEqual([]);
    expect(notifications.success).toHaveBeenCalledWith('Tarea eliminada');
  });

  it('al crear una tarea avisa y vuelve a la primera página', () => {
    store.setPage({ limit: 10, offset: 20 });
    taskService.create.mockReturnValue(of(buildTask({ id: 2 })));

    store.create({
      title: 'Nueva',
      description: null,
      status: 'Pendiente',
      dueDate: '2026-10-30',
      categoryId: 1,
    });

    expect(notifications.success).toHaveBeenCalledWith('Tarea creada');
    expect(store.page().offset).toBe(0);
  });
});
