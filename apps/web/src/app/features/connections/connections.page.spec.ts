import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../core/i18n/i18n.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { ConnectionsApi } from './data-access/connections.api';
import { ConnectionsPage } from './connections.page';

const preview = {
  school: { id: 'school-1', name: 'Sunrise Learning', city: 'Phnom Penh', logoUrl: null },
  label: null,
  expiresAt: '2026-11-02T00:00:00.000Z',
  teachers: [{ firstName: 'Serey', lastName: 'Sok', title: 'Lead teacher' }],
};

const connection = {
  enrollmentId: 'enrollment-1',
  status: 'ACTIVE' as const,
  startDate: '2026-10-27',
  child: { id: 'child-1', firstName: 'Dara' },
  school: preview.school,
  teachers: [{ firstName: 'Serey', lastName: 'Sok', title: 'Lead teacher' }],
  reportCount: 2,
};

describe('ConnectionsPage', () => {
  const api = {
    list: vi.fn(() => of([] as (typeof connection)[])),
    preview: vi.fn(() => of(preview)),
    connect: vi.fn(() => of(connection)),
    disconnect: vi.fn(() => of({ disconnected: true as const })),
  };
  const childrenApi = {
    listChildren: vi.fn(() =>
      of([
        {
          id: 'child-1',
          firstName: 'Dara',
          dateOfBirth: '2022-03-10',
          notes: null,
          archivedAt: null,
        },
        {
          id: 'child-2',
          firstName: 'Mealea',
          dateOfBirth: '2021-06-01',
          notes: null,
          archivedAt: null,
        },
      ]),
    ),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ConnectionsPage],
      providers: [
        provideRouter([]),
        { provide: ConnectionsApi, useValue: api },
        { provide: ChildrenApi, useValue: childrenApi },
      ],
    });
    TestBed.inject(I18nService).setLanguage('en');
  });

  const render = () => {
    const fixture = TestBed.createComponent(ConnectionsPage);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };

  it('connects only after the parent picks a child and agrees', () => {
    const { fixture, el } = render();

    const input = el.querySelector<HTMLInputElement>('.code-input')!;
    input.value = 'k7qm-4xpa';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    el.querySelector<HTMLFormElement>('.code-form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(api.preview).toHaveBeenCalledWith('k7qm-4xpa');
    expect(el.querySelector('.preview')?.textContent).toContain('Sunrise Learning');

    const connect = () =>
      Array.from(el.querySelectorAll<HTMLButtonElement>('.actions button')).find((b) =>
        b.textContent?.includes('Connect'),
      )!;
    // Two children: nothing is picked for the parent, so nothing can be sent.
    expect(connect().disabled).toBe(true);

    el.querySelectorAll<HTMLInputElement>('input[type="radio"]')[0]!.dispatchEvent(
      new Event('change'),
    );
    fixture.detectChanges();
    expect(el.querySelector('.consent')?.textContent).toContain('Sunrise Learning');
    expect(el.querySelector('.consent')?.textContent).toContain('Dara');
    expect(connect().disabled).toBe(true);

    const consent = el.querySelector<HTMLInputElement>('.consent input')!;
    consent.checked = true;
    consent.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(connect().disabled).toBe(false);

    connect().click();
    fixture.detectChanges();
    expect(api.connect).toHaveBeenCalledWith({
      code: 'k7qm-4xpa',
      childId: 'child-1',
      consent: true,
    });
    expect(el.textContent).toContain('Dara is now connected to Sunrise Learning.');
  });

  it('lists connected schools with their teachers and report count', () => {
    api.list.mockReturnValueOnce(of([connection]));
    const { el } = render();

    const card = el.querySelector('.school-card')!;
    expect(card.textContent).toContain('Sunrise Learning');
    expect(card.textContent).toContain('Serey Sok');
    expect(card.textContent).toContain('2 reports');
  });
});
