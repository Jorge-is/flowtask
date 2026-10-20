import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Task, TaskStatus } from '../../../../core/models/task.model';
import { TaskCard } from '../task-card/task-card';

export interface TaskStatusChange {
  task: Task;
  status: TaskStatus;
}

@Component({
  selector: 'app-task-list',
  imports: [TaskCard],
  template: `
    <ul class="task-list">
      @for (task of tasks(); track task.id) {
        <li>
          <app-task-card
            [task]="task"
            (statusChange)="statusChange.emit({ task, status: $event })"
            (deleteRequest)="deleteRequest.emit(task)"
          />
        </li>
      }
    </ul>
  `,
  styles: `
    .task-list {
      display: grid;
      gap: 0.625rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskList {
  readonly tasks = input.required<Task[]>();
  readonly statusChange = output<TaskStatusChange>();
  readonly deleteRequest = output<Task>();
}
