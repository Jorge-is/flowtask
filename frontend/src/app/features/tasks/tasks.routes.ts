import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Routes } from '@angular/router';

import {
  DAY_FIRST_DATE_FORMATS,
  DayFirstDateAdapter,
} from '../../shared/i18n/day-first-date-adapter';
import { SpanishDatepickerIntl } from '../../shared/i18n/spanish-datepicker-intl';
import { SpanishPaginatorIntl } from '../../shared/i18n/spanish-paginator-intl';
import { TaskBoard } from './task-board/task-board';

/** Rutas de la feature de tareas. Sus providers se cargan junto con la feature, no en el arranque. */
export const TASKS_ROUTES: Routes = [
  {
    path: '',
    component: TaskBoard,
    providers: [
      { provide: DateAdapter, useClass: DayFirstDateAdapter },
      { provide: MAT_DATE_FORMATS, useValue: DAY_FIRST_DATE_FORMATS },
      { provide: MatDatepickerIntl, useClass: SpanishDatepickerIntl },
      { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl },
    ],
  },
];
