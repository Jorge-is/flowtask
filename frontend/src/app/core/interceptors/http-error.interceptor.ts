import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../services/notification.service';
import { toUserMessage } from './http-error-message';

/** Muestra un aviso amigable ante cualquier error HTTP y lo propaga para que el llamador reaccione. */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const notifications = inject(NotificationService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        notifications.error(toUserMessage(error));
      }
      return throwError(() => error);
    }),
  );
};
