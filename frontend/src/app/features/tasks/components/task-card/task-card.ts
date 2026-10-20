import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Task, TASK_STATUSES, TaskStatus } from '../../../../core/models/task.model';
import {
  DueDateUrgency,
  getDaysUntil,
  getDueDateUrgency,
  parseIsoDate,
} from '../../../../core/utils/due-date';

function urgencyLabel(urgency: DueDateUrgency, daysLeft: number): string {
  switch (urgency) {
    case 'overdue':
      return 'Vencida';
    case 'today':
      return 'Hoy';
    case 'soon':
      return daysLeft === 1 ? 'Mañana' : `En ${daysLeft} días`;
    default:
      return '';
  }
}

@Component({
  selector: 'app-task-card',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  readonly task = input.required<Task>();
  readonly statusChange = output<TaskStatus>();
  readonly deleteRequest = output<void>();

  protected readonly statuses = TASK_STATUSES;
  protected readonly dueDate = computed(() => parseIsoDate(this.task().dueDate));
  protected readonly isDone = computed(() => this.task().status === 'Completada');
  protected readonly urgency = computed(() =>
    getDueDateUrgency(this.task().dueDate, this.task().status),
  );
  protected readonly urgencyLabel = computed(() =>
    urgencyLabel(this.urgency(), getDaysUntil(this.task().dueDate)),
  );

  protected toggleCompleted(): void {
    this.statusChange.emit(this.isDone() ? 'Pendiente' : 'Completada');
  }
}
