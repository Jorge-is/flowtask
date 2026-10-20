import { CreateTaskPayload, Task, UpdateTaskPayload } from '../models/task.model';

/**
 * Devuelve solo los campos del formulario que difieren de la tarea original.
 * Así el PATCH no reenvía una fecha vencida sin tocar, que la API rechazaría por estar en el pasado.
 */
export function getTaskChanges(task: Task, payload: CreateTaskPayload): UpdateTaskPayload {
  const original: CreateTaskPayload = {
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate,
    categoryId: task.category.id,
  };
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([field, value]) => original[field as keyof CreateTaskPayload] !== value,
    ),
  );
}
