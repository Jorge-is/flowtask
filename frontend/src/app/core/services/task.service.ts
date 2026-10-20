import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_URL } from '../config/api-url.token';
import { Page, PageRequest } from '../models/page.model';
import { CreateTaskPayload, Task, TaskFilters, UpdateTaskPayload } from '../models/task.model';
import { TaskDto, toTask, toTaskWriteDto } from './task-api.mapper';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly tasksUrl = `${inject(API_URL)}/tasks`;

  list(filters: TaskFilters, page: PageRequest): Observable<Page<Task>> {
    let params = new HttpParams().set('limit', page.limit).set('offset', page.offset);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.categoryId) params = params.set('category_id', filters.categoryId);

    return this.http
      .get<Page<TaskDto>>(this.tasksUrl, { params })
      .pipe(map((result) => ({ ...result, items: result.items.map(toTask) })));
  }

  create(payload: CreateTaskPayload): Observable<Task> {
    return this.http.post<TaskDto>(this.tasksUrl, toTaskWriteDto(payload)).pipe(map(toTask));
  }

  update(id: number, changes: UpdateTaskPayload): Observable<Task> {
    return this.http
      .patch<TaskDto>(`${this.tasksUrl}/${id}`, toTaskWriteDto(changes))
      .pipe(map(toTask));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.tasksUrl}/${id}`);
  }
}
