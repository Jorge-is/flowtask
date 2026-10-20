import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api-url.token';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly categoriesUrl = `${inject(API_URL)}/categories`;

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoriesUrl);
  }
}
