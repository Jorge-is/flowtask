import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'FlowTask · Tablero de tareas',
    loadComponent: () =>
      import('./features/tasks/task-board/task-board').then((module) => module.TaskBoard),
  },
  { path: '**', redirectTo: '' },
];
