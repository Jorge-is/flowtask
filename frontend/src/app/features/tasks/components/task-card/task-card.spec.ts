import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { LOCALE_ID } from '@angular/core';

import { Task, TaskStatus } from '../../../../core/models/task.model';
import { TaskCard } from './task-card';

registerLocaleData(localeEsPe);

const task: Task = {
  id: 1,
  title: 'Preparar informe',
  description: 'Consolidar avances',
  status: 'Pendiente',
  dueDate: '2099-10-23',
  category: { id: 1, name: 'Trabajo', description: null },
};

describe('TaskCard', () => {
  let fixture: ComponentFixture<TaskCard>;

  async function render(value: Task): Promise<HTMLElement> {
    fixture.componentRef.setInput('task', value);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function button(element: HTMLElement, label: string): HTMLButtonElement {
    return element.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TaskCard],
      providers: [{ provide: LOCALE_ID, useValue: 'es-PE' }],
    });
    fixture = TestBed.createComponent(TaskCard);
  });

  it('muestra título, nombre de la categoría, estado y fecha límite', async () => {
    const element = await render(task);

    expect(element.textContent).toContain('Preparar informe');
    expect(element.textContent).toContain('Trabajo');
    expect(element.textContent).toContain('Pendiente');
    expect(element.querySelector('.due-date__day')?.textContent?.trim()).toBe('23');
  });

  it('emite "Completada" al marcar una tarea pendiente', async () => {
    const element = await render(task);
    const emitted: TaskStatus[] = [];
    fixture.componentInstance.statusChange.subscribe((status) => emitted.push(status));

    button(element, 'Marcar como completada').click();

    expect(emitted).toEqual(['Completada']);
  });

  it('emite "Pendiente" al reabrir una tarea completada', async () => {
    const element = await render({ ...task, status: 'Completada' });
    const emitted: TaskStatus[] = [];
    fixture.componentInstance.statusChange.subscribe((status) => emitted.push(status));

    button(element, 'Reabrir tarea').click();

    expect(emitted).toEqual(['Pendiente']);
  });

  it('solicita la eliminación al pulsar eliminar', async () => {
    const element = await render(task);
    let requested = false;
    fixture.componentInstance.deleteRequest.subscribe(() => (requested = true));

    button(element, 'Eliminar tarea').click();

    expect(requested).toBe(true);
  });
});
