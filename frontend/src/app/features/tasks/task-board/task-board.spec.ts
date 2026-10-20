import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../../app.routes';

describe('TaskBoard (integración con rutas)', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    harness = await RouterTestingHarness.create('/');
    http = TestBed.inject(HttpTestingController);
    http.expectOne((req) => req.url.endsWith('/categories')).flush([]);
    http
      .expectOne((req) => req.url.endsWith('/tasks'))
      .flush({ items: [], total: 0, limit: 10, offset: 0 });
    await harness.fixture.whenStable();
  });

  it('muestra el estado vacío cuando no hay tareas', () => {
    expect(harness.routeNativeElement?.textContent).toContain('Aún no hay tareas');
  });

  it('abre el formulario de alta con el selector de fecha operativo', async () => {
    const createButton = Array.from(
      harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.includes('Nueva tarea'))!;

    createButton.click();
    await harness.fixture.whenStable();

    expect(
      document.querySelector('mat-dialog-container input[placeholder="dd/mm/aaaa"]'),
    ).not.toBeNull();
  });
});

describe('TaskBoard (edición)', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    harness = await RouterTestingHarness.create('/');
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((req) => req.url.endsWith('/categories'))
      .flush([{ id: 1, name: 'Trabajo', description: null }]);
    http
      .expectOne((req) => req.url.endsWith('/tasks'))
      .flush({
        items: [
          {
            id: 5,
            title: 'Preparar informe',
            description: null,
            status: 'Pendiente',
            due_date: '2099-10-23',
            category_id: 1,
            category: { id: 1, name: 'Trabajo', description: null },
          },
        ],
        total: 1,
        limit: 10,
        offset: 0,
      });
    await harness.fixture.whenStable();
  });

  it('abre el formulario precargado con la tarea a editar', async () => {
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('button[aria-label="Editar tarea"]')!
      .click();
    await harness.fixture.whenStable();

    const titleInput = document.querySelector<HTMLInputElement>(
      'mat-dialog-container input[formcontrolname="title"]',
    );
    expect(titleInput?.value).toBe('Preparar informe');
  });
});
