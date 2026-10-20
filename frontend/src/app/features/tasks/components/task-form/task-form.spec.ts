import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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
