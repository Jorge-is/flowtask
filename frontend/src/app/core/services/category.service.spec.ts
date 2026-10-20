import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../config/api-url.token';
import { Category } from '../models/category.model';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  it('obtiene las categorías desde /categories', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: 'http://api.test' },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const categories: Category[] = [{ id: 1, name: 'Trabajo', description: null }];
    let result: Category[] | undefined;

    TestBed.inject(CategoryService)
      .list()
      .subscribe((value) => (result = value));
    http.expectOne('http://api.test/categories').flush(categories);

    expect(result).toEqual(categories);
    http.verify();
  });
});
