import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../config/api-url.token';
import { Task } from '../models/task.model';
import { TaskService } from './task.service';

const API = 'http://api.test';

const taskDto = {
  id: 7,
  title: 'Preparar informe',
  description: null,
  status: 'Pendiente',
  due_date: '2026-10-23',
  category_id: 1,
  category: { id: 1, name: 'Trabajo', description: null },
  created_at: '2026-10-20T10:00:00',
  updated_at: '2026-10-20T10:00:00',
};

const expectedTask: Task = {
  id: 7,
  title: 'Preparar informe',
  description: null,
  status: 'Pendiente',
  dueDate: '2026-10-23',
  category: { id: 1, name: 'Trabajo', description: null },
};

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: API },
      ],
    });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista tareas enviando filtros y paginación como query params', () => {
    let result: unknown;
    service
      .list({ status: 'En Progreso', categoryId: 2 }, { limit: 10, offset: 20 })
      .subscribe((page) => (result = page));

    const request = http.expectOne((req) => req.url === `${API}/tasks`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('status')).toBe('En Progreso');
    expect(request.request.params.get('category_id')).toBe('2');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.params.get('offset')).toBe('20');
    request.flush({ items: [taskDto], total: 21, limit: 10, offset: 20 });

    expect(result).toEqual({ items: [expectedTask], total: 21, limit: 10, offset: 20 });
  });

  it('omite los filtros vacíos', () => {
    service.list({ status: null, categoryId: null }, { limit: 10, offset: 0 }).subscribe();

    const request = http.expectOne((req) => req.url === `${API}/tasks`);
    expect(request.request.params.has('status')).toBe(false);
    expect(request.request.params.has('category_id')).toBe(false);
    request.flush({ items: [], total: 0, limit: 10, offset: 0 });
  });

  it('crea una tarea enviando el cuerpo en snake_case', () => {
    let created: Task | undefined;
    service
      .create({
        title: 'Preparar informe',
        description: null,
        status: 'Pendiente',
        dueDate: '2026-10-23',
        categoryId: 1,
      })
      .subscribe((task) => (created = task));

    const request = http.expectOne(`${API}/tasks`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Preparar informe',
      description: null,
      status: 'Pendiente',
      due_date: '2026-10-23',
      category_id: 1,
    });
    request.flush(taskDto);

    expect(created).toEqual(expectedTask);
  });

  it('actualiza solo los campos enviados', () => {
    service.update(7, { status: 'Completada' }).subscribe();

    const request = http.expectOne(`${API}/tasks/7`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'Completada' });
    request.flush({ ...taskDto, status: 'Completada' });
  });

  it('elimina una tarea por id', () => {
    service.delete(7).subscribe();

    const request = http.expectOne(`${API}/tasks/7`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
