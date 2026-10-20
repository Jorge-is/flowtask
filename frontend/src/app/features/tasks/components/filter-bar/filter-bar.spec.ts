import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskFilters } from '../../../../core/models/task.model';
import { FilterBar } from './filter-bar';

describe('FilterBar', () => {
  let fixture: ComponentFixture<FilterBar>;

  async function render(filters: TaskFilters): Promise<HTMLElement> {
    fixture.componentRef.setInput('filters', filters);
    fixture.componentRef.setInput('categories', []);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function clearButton(element: HTMLElement): HTMLButtonElement | null {
    return element.querySelector('button.clear-filters');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FilterBar] });
    fixture = TestBed.createComponent(FilterBar);
  });

  it('no muestra "Limpiar filtros" si no hay filtros activos', async () => {
    const element = await render({ status: null, categoryId: null });

    expect(clearButton(element)).toBeNull();
  });

  it.each([
    { status: 'Pendiente', categoryId: null },
    { status: null, categoryId: 2 },
  ] satisfies TaskFilters[])(
    'muestra "Limpiar filtros" con filtros activos: %o',
    async (filters) => {
      const element = await render(filters);

      expect(clearButton(element)).not.toBeNull();
    },
  );

  it('emite clear al pulsar "Limpiar filtros"', async () => {
    const element = await render({ status: 'Completada', categoryId: 1 });
    let cleared = false;
    fixture.componentInstance.clear.subscribe(() => (cleared = true));

    clearButton(element)!.click();

    expect(cleared).toBe(true);
  });
});
