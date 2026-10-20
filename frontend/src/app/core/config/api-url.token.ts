import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

/** URL base de la API. Se inyecta para poder reemplazarla en tests o por entorno. */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});
