import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { NotificationService } from '../services/notification.service';
import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  const notifications = { error: vi.fn(), success: vi.fn() };

  beforeEach(() => {
    notifications.error.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notifications },
      ],
    });
  });

  it('notifica el error y lo propaga al suscriptor', () => {
    let propagated = false;
    TestBed.inject(HttpClient)
      .get('/tasks/99')
      .subscribe({ error: () => (propagated = true) });

    TestBed.inject(HttpTestingController)
      .expectOne('/tasks/99')
      .flush({ detail: 'Tarea no encontrada' }, { status: 404, statusText: 'Not Found' });

    expect(notifications.error).toHaveBeenCalledWith('Tarea no encontrada');
    expect(propagated).toBe(true);
  });
});
