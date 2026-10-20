import { Category } from './category.model';

export const TASK_STATUSES = ['Pendiente', 'En Progreso', 'Completada'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Fecha en formato ISO `YYYY-MM-DD`, sin hora ni zona horaria. */
  dueDate: string;
  category: Category;
}

export interface TaskFilters {
  status: TaskStatus | null;
  categoryId: number | null;
}

export interface CreateTaskPayload {
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string;
  categoryId: number;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;
