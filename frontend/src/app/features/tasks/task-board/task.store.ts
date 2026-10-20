import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, Subject, switchMap, tap } from 'rxjs';

import { PageRequest } from '../../../core/models/page.model';
import { CreateTaskPayload, Task, TaskFilters, TaskStatus } from '../../../core/models/task.model';
import { NotificationService } from '../../../core/services/notification.service';
import { TaskService } from '../../../core/services/task.service';
import { getTaskChanges } from '../../../core/utils/task-changes';

interface TaskBoardState {
  tasks: Task[];
  total: number;
  loading: boolean;
  loadFailed: boolean;
  filters: TaskFilters;
  page: PageRequest;
}

const INITIAL_STATE: TaskBoardState = {
  tasks: [],
  total: 0,
  loading: false,
  loadFailed: false,
  filters: { status: null, categoryId: null },
  page: { limit: 10, offset: 0 },
};

/** Estado del tablero de tareas. Se provee a nivel de componente: vive mientras vive el tablero. */
@Injectable()
export class TaskStore {
  private readonly taskService = inject(TaskService);
  private readonly notifications = inject(NotificationService);
  private readonly state = signal<TaskBoardState>(INITIAL_STATE);
  private readonly reload$ = new Subject<void>();

  readonly tasks = computed(() => this.state().tasks);
  readonly total = computed(() => this.state().total);
  readonly loading = computed(() => this.state().loading);
  readonly loadFailed = computed(() => this.state().loadFailed);
  readonly filters = computed(() => this.state().filters);
  readonly page = computed(() => this.state().page);

  constructor() {
    // switchMap descarta respuestas viejas si el usuario cambia de filtro antes de que lleguen.
    this.reload$
      .pipe(
        tap(() => this.patch({ loading: true, loadFailed: false })),
        switchMap(() =>
          this.taskService.list(this.filters(), this.page()).pipe(
            catchError(() => {
              this.patch({ loading: false, loadFailed: true });
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((result) =>
        this.patch({ tasks: result.items, total: result.total, loading: false }),
      );
  }

  load(): void {
    this.reload$.next();
  }

  setStatusFilter(status: TaskStatus | null): void {
    this.applyFilters({ ...this.filters(), status });
  }

  setCategoryFilter(categoryId: number | null): void {
    this.applyFilters({ ...this.filters(), categoryId });
  }

  clearFilters(): void {
    this.applyFilters({ status: null, categoryId: null });
  }

  setPage(page: PageRequest): void {
    this.patch({ page });
    this.load();
  }

  create(payload: CreateTaskPayload): void {
    this.taskService.create(payload).subscribe(() => {
      this.notifications.success('Tarea creada');
      this.setPage({ ...this.page(), offset: 0 });
    });
  }

  changeStatus(task: Task, status: TaskStatus): void {
    this.replaceTask({ ...task, status });

    this.taskService.update(task.id, { status }).subscribe({
      next: (updated) => {
        this.replaceTask(updated);
        const activeStatus = this.filters().status;
        if (activeStatus && activeStatus !== updated.status) {
          this.load();
        }
      },
      // El interceptor ya avisó del error; aquí solo se revierte el cambio optimista.
      error: () => this.replaceTask(task),
    });
  }

  update(task: Task, payload: CreateTaskPayload): void {
    const changes = getTaskChanges(task, payload);
    if (Object.keys(changes).length === 0) {
      return;
    }
    this.taskService.update(task.id, changes).subscribe(() => {
      this.notifications.success('Tarea actualizada');
      // Recargar respeta el orden por fecha y los filtros activos, que la edición puede alterar.
      this.load();
    });
  }

  remove(task: Task): void {
    this.taskService.delete(task.id).subscribe(() => {
      this.patch({
        tasks: this.tasks().filter((current) => current.id !== task.id),
        total: Math.max(this.total() - 1, 0),
      });
      this.notifications.success('Tarea eliminada');
      this.reloadKeepingPageInRange();
    });
  }

  private applyFilters(filters: TaskFilters): void {
    this.patch({ filters, page: { ...this.page(), offset: 0 } });
    this.load();
  }

  /** Si se borró el último elemento de una página, retrocede a la anterior. */
  private reloadKeepingPageInRange(): void {
    const { limit, offset } = this.page();
    const offsetOutOfRange = offset > 0 && offset >= this.total();
    this.setPage({ limit, offset: offsetOutOfRange ? Math.max(offset - limit, 0) : offset });
  }

  private replaceTask(task: Task): void {
    this.patch({
      tasks: this.tasks().map((current) => (current.id === task.id ? task : current)),
    });
  }

  private patch(changes: Partial<TaskBoardState>): void {
    this.state.update((current) => ({ ...current, ...changes }));
  }
}
