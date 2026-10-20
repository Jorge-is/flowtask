import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Category } from '../../../../core/models/category.model';
import {
  CreateTaskPayload,
  Task,
  TASK_STATUSES,
  TaskStatus,
} from '../../../../core/models/task.model';
import { parseIsoDate, toIsoDate } from '../../../../core/utils/due-date';
import { notBlank } from '../../../../shared/validators/not-blank.validator';

export interface TaskFormData {
  categories: Category[];
  /** Tarea a editar. Sin ella, el formulario crea una nueva. */
  task?: Task;
}

export const TITLE_MAX_LENGTH = 150;
export const DESCRIPTION_MAX_LENGTH = 1000;

@Component({
  selector: 'app-task-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskForm {
  private readonly dialogRef = inject<MatDialogRef<TaskForm, CreateTaskPayload>>(MatDialogRef);
  protected readonly data = inject<TaskFormData>(MAT_DIALOG_DATA);
  protected readonly statuses = TASK_STATUSES;
  protected readonly titleMaxLength = TITLE_MAX_LENGTH;
  protected readonly descriptionMaxLength = DESCRIPTION_MAX_LENGTH;
  protected readonly isEdit = this.data.task !== undefined;

  private readonly originalDueDate = this.data.task?.dueDate ?? null;
  // Una tarea vencida conserva su fecha: el calendario debe poder mostrarla y aceptarla.
  protected readonly minDueDate = this.originalDueDate
    ? new Date(Math.min(Date.now(), parseIsoDate(this.originalDueDate).getTime()))
    : new Date();

  /** Solo hoy en adelante, salvo la fecha original de la tarea que se edita. */
  protected readonly isAllowedDueDate = (date: Date | null): boolean => {
    if (!date) return true;
    const isoDate = toIsoDate(date);
    return isoDate >= toIsoDate(new Date()) || isoDate === this.originalDueDate;
  };

  readonly form = this.buildForm(this.data.task);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, description, status, dueDate, categoryId } = this.form.getRawValue();
    this.dialogRef.close({
      title: title!.trim(),
      description: description?.trim() || null,
      status: status!,
      dueDate: toIsoDate(dueDate!),
      categoryId: categoryId!,
    });
  }

  private buildForm(task: Task | undefined) {
    return inject(FormBuilder).group({
      title: [
        task?.title ?? '',
        [Validators.required, Validators.maxLength(TITLE_MAX_LENGTH), notBlank],
      ],
      description: [task?.description ?? '', Validators.maxLength(DESCRIPTION_MAX_LENGTH)],
      status: [task?.status ?? ('Pendiente' as TaskStatus), Validators.required],
      dueDate: [task ? parseIsoDate(task.dueDate) : (null as Date | null), Validators.required],
      categoryId: [task?.category.id ?? (null as number | null), Validators.required],
    });
  }
}
