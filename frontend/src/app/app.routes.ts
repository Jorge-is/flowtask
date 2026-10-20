import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'FlowTask · Tablero de tareas',
    loadChildren: () =>
      import('./features/tasks/tasks.routes').then((module) => module.TASKS_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
