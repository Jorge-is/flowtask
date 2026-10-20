import { Category } from '../models/category.model';
import { CreateTaskPayload, Task, TaskStatus, UpdateTaskPayload } from '../models/task.model';

/** Forma de una tarea tal como la devuelve la API (snake_case). */
export interface TaskDto {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string;
  category_id: number;
  category: Category;
  created_at: string;
  updated_at: string;
}

export interface TaskWriteDto {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  due_date?: string;
  category_id?: number;
}

export function toTask(dto: TaskDto): Task {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    status: dto.status,
    dueDate: dto.due_date,
    category: dto.category,
  };
}

/** Traduce solo las propiedades presentes, para que un PATCH no envíe campos de más. */
export function toTaskWriteDto(payload: CreateTaskPayload | UpdateTaskPayload): TaskWriteDto {
  const dto: TaskWriteDto = {};
  if (payload.title !== undefined) dto.title = payload.title;
  if (payload.description !== undefined) dto.description = payload.description;
  if (payload.status !== undefined) dto.status = payload.status;
  if (payload.dueDate !== undefined) dto.due_date = payload.dueDate;
  if (payload.categoryId !== undefined) dto.category_id = payload.categoryId;
  return dto;
}
