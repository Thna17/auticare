import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { API_BASE_URL } from '../config/api.config';
import { previewBackendInterceptor } from './preview-backend.interceptor';
import { previewRole, setPreviewRole } from './preview-mode';

describe('previewBackendInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([previewBackendInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => setPreviewRole(null));

  it('does nothing outside preview mode', () => {
    setPreviewRole(null);
    http.get('/api/v1/auth/me').subscribe();
    controller.expectOne('/api/v1/auth/me').flush({ data: {} });
    controller.verify();
  });

  it('answers the signed-in account for the chosen role, without the network', async () => {
    setPreviewRole('hospital');
    const res = await firstValueFrom(
      http.get<{ data: { parent: { role: string } } }>('/api/v1/auth/me'),
    );
    expect(res.data.parent.role).toBe('HOSPITAL');
    controller.verify();
  });

  it('serves each role its dashboard data', async () => {
    setPreviewRole('parent');
    const parent = await firstValueFrom(
      http.get<{ data: { questionnaireStatus: string } }>('/api/v1/dashboard/parent?childId=x'),
    );
    expect(parent.data.questionnaireStatus).toBe('COMPLETED');

    setPreviewRole('teacher');
    const staff = await firstValueFrom(
      http.get<{ data: { role: string } }>('/api/v1/schools/staff/me'),
    );
    expect(staff.data.role).toBe('TEACHER');
  });

  it('refuses anything not covered with a clear 503, never fake success', async () => {
    setPreviewRole('admin');
    await expect(firstValueFrom(http.post('/api/v1/children', {}))).rejects.toMatchObject({
      status: 503,
      error: { error: { code: 'PREVIEW_MODE' } },
    });
  });

  it('leaves preview mode on sign-out', async () => {
    setPreviewRole('parent');
    await firstValueFrom(http.post('/api/v1/auth/logout', {}));
    expect(previewRole()).toBeNull();
  });
});
