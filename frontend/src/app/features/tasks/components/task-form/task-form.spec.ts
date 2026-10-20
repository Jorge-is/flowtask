import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Task } from '../../../../core/models/task.model';
import { TaskForm, TaskFormData } from './task-form';

describe('TaskForm', () => {
  const dialogRef = { close: vi.fn() };
  let component: TaskForm;

  beforeEach(() => {
    dialogRef.close.mockClear();
    const data: TaskFormData = {
      categories: [{ id: 3, name: 'Urgente', description: null }],
    };
    TestBed.configureTestingModule({
      imports: [TaskForm],
      providers: [
        provideNativeDateAdapter(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    });
    component = TestBed.createComponent(TaskForm).componentInstance;
  });

  it('considera inválido un título con solo espacios', () => {
    component.form.controls.title.setValue('   ');

    expect(component.form.controls.title.hasError('blank')).toBe(true);
  });

  it('no cierra el diálogo si el formulario es inválido', () => {
    component.submit();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('cierra el diálogo con el payload listo para la API', () => {
    component.form.setValue({
      title: '  Renovar certificado  ',
      description: '',
      status: 'En Progreso',
      dueDate: new Date(2099, 0, 15),
      categoryId: 3,
    });

    component.submit();

    expect(dialogRef.close).toHaveBeenCalledWith({
      title: 'Renovar certificado',
      description: null,
      status: 'En Progreso',
      dueDate: '2099-01-15',
      categoryId: 3,
    });
  });
});

describe('TaskForm en modo edición', () => {
  const dialogRef = { close: vi.fn() };
  const overdueTask: Task = {
    id: 7,
    title: 'Renovar certificado',
    description: 'Dominio principal',
    status: 'En Progreso',
    dueDate: '2020-03-10',
    category: { id: 3, name: 'Urgente', description: null },
  };
  let fixture: ComponentFixture<TaskForm>;

  beforeEach(async () => {
    dialogRef.close.mockClear();
    const data: TaskFormData = {
      categories: [{ id: 3, name: 'Urgente', description: null }],
      task: overdueTask,
    };
    TestBed.configureTestingModule({
      imports: [TaskForm],
      providers: [
        provideNativeDateAdapter(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    });
    fixture = TestBed.createComponent(TaskForm);
    await fixture.whenStable();
  });

  it('precarga los valores de la tarea', () => {
    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      title: 'Renovar certificado',
      description: 'Dominio principal',
      status: 'En Progreso',
      dueDate: new Date(2020, 2, 10),
      categoryId: 3,
    });
  });

  it('muestra el título y la acción de edición', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[mat-dialog-title]')?.textContent).toContain('Editar tarea');
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain(
      'Guardar cambios',
    );
  });

  it('acepta la fecha original aunque ya esté vencida', () => {
    expect(fixture.componentInstance.form.controls.dueDate.valid).toBe(true);
  });

  it('rechaza otra fecha en el pasado', async () => {
    const { dueDate } = fixture.componentInstance.form.controls;

    dueDate.setValue(new Date(2020, 2, 11));
    await fixture.whenStable();

    expect(dueDate.valid).toBe(false);
  });
});
