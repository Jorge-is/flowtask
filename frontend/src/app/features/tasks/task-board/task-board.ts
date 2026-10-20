import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { catchError, filter, of } from 'rxjs';

import { CreateTaskPayload, Task } from '../../../core/models/task.model';
import { CategoryService } from '../../../core/services/category.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';
import { FilterBar } from '../components/filter-bar/filter-bar';
import { TaskForm, TaskFormData } from '../components/task-form/task-form';
import { TaskList, TaskStatusChange } from '../components/task-list/task-list';
import { TaskStore } from './task.store';

/** Contenedor del tablero: conecta el estado (TaskStore) con los componentes de presentación. */
@Component({
  selector: 'app-task-board',
  imports: [
    FilterBar,
    TaskList,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
  ],
  providers: [TaskStore],
  templateUrl: './task-board.html',
  styleUrl: './task-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoard implements OnInit {
  protected readonly store = inject(TaskStore);
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);

  protected readonly categories = toSignal(
    inject(CategoryService)
      .list()
      .pipe(catchError(() => of([]))),
    { initialValue: [] },
  );
  protected readonly hasActiveFilters = computed(() => {
    const { status, categoryId } = this.store.filters();
    return status !== null || categoryId !== null;
  });
  protected readonly pageIndex = computed(() => {
    const { limit, offset } = this.store.page();
    return Math.floor(offset / limit);
  });
  protected readonly pageSizeOptions = [5, 10, 20];

  ngOnInit(): void {
    this.store.load();
  }

  protected openCreateDialog(): void {
    this.dialog
      .open<TaskForm, TaskFormData, CreateTaskPayload>(TaskForm, {
        data: { categories: this.categories() },
        // MatDialog vive en root: sin esto, el formulario no ve el DateAdapter de la ruta.
        injector: this.injector,
        width: '36rem',
        maxWidth: 'calc(100vw - 2rem)',
      })
      .afterClosed()
      .pipe(filter((payload): payload is CreateTaskPayload => payload !== undefined))
      .subscribe((payload) => this.store.create(payload));
  }

  protected confirmDelete(task: Task): void {
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Eliminar tarea',
          message: `Se eliminará «${task.title}». Esta acción no se puede deshacer.`,
          confirmLabel: 'Eliminar',
        },
        width: '28rem',
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.store.remove(task));
  }

  protected onStatusChange({ task, status }: TaskStatusChange): void {
    this.store.changeStatus(task, status);
  }

  protected onPageChange(event: PageEvent): void {
    this.store.setPage({ limit: event.pageSize, offset: event.pageIndex * event.pageSize });
  }
}
