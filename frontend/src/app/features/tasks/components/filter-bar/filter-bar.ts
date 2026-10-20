import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { Category } from '../../../../core/models/category.model';
import { TASK_STATUSES, TaskFilters, TaskStatus } from '../../../../core/models/task.model';

@Component({
  selector: 'app-filter-bar',
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <div class="filter-bar" role="search" aria-label="Filtrar tareas">
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Estado</mat-label>
        <mat-select [value]="filters().status" (valueChange)="statusChange.emit($event)">
          <mat-option [value]="null">Todos</mat-option>
          @for (status of statuses; track status) {
            <mat-option [value]="status">{{ status }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Categoría</mat-label>
        <mat-select [value]="filters().categoryId" (valueChange)="categoryChange.emit($event)">
          <mat-option [value]="null">Todas</mat-option>
          @for (category of categories(); track category.id) {
            <mat-option [value]="category.id">{{ category.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: `
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    mat-form-field {
      width: 12rem;
    }

    @media (max-width: 600px) {
      mat-form-field {
        flex: 1 1 10rem;
        width: auto;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBar {
  readonly filters = input.required<TaskFilters>();
  readonly categories = input.required<Category[]>();
  readonly statusChange = output<TaskStatus | null>();
  readonly categoryChange = output<number | null>();

  protected readonly statuses = TASK_STATUSES;
}
