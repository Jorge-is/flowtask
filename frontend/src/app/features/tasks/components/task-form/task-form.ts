import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Category } from '../../../../core/models/category.model';
import { CreateTaskPayload, TASK_STATUSES, TaskStatus } from '../../../../core/models/task.model';
import { toIsoDate } from '../../../../core/utils/due-date';
import { notBlank } from '../../../../shared/validators/not-blank.validator';

export interface TaskFormData {
  categories: Category[];
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
  protected readonly minDueDate = new Date();

  readonly form = inject(FormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(TITLE_MAX_LENGTH), notBlank]],
    description: ['', Validators.maxLength(DESCRIPTION_MAX_LENGTH)],
    status: ['Pendiente' as TaskStatus, Validators.required],
    dueDate: [null as Date | null, Validators.required],
    categoryId: [null as number | null, Validators.required],
  });

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
}
