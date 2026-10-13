import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { I18nService } from '../i18n/i18n.service';
import { ClientErrorService, GlobalErrorHandler } from './global-error-handler';
import { AppComponent } from '../../app.component';
import { provideRouter } from '@angular/router';

describe('GlobalErrorHandler & Client Telemetry Service', () => {
  let errorHandler: GlobalErrorHandler;
  let clientErrorService: ClientErrorService;
  let mockAuth: {
    parent: ReturnType<typeof signal<{ id: string; role: string; email: string } | null>>;
  };
  let mockI18n: { currentLang: ReturnType<typeof signal<string>> };
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockAuth = {
      parent: signal({
        id: 'usr_parent_123',
        role: 'PARENT',
        email: 'parent@auticare.kh',
      }),
    };

    mockI18n = {
      currentLang: signal('km'),
    };

    TestBed.configureTestingModule({
      providers: [
        ClientErrorService,
        GlobalErrorHandler,
        { provide: AuthService, useValue: mockAuth },
        { provide: I18nService, useValue: mockI18n },
      ],
    });

    errorHandler = TestBed.inject(GlobalErrorHandler);
    clientErrorService = TestBed.inject(ClientErrorService);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    clientErrorService.clearError();
  });

  it('captures standard Error instances and produces structured telemetry payload', () => {
    const error = new Error('Test template rendering failure');

    errorHandler.handleError(error);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[AutiCare Telemetry: Uncaught Client Error]',
      expect.objectContaining({
        message: 'Test template rendering failure',
        language: 'km',
        userContext: {
          id: 'usr_parent_123',
          role: 'PARENT',
          email: 'parent@auticare.kh',
        },
      }),
    );

    const lastError = clientErrorService.lastError();
    expect(lastError).not.toBeNull();
    expect(lastError?.message).toBe('Test template rendering failure');
    expect(lastError?.id).toMatch(/^err_/);
    expect(lastError?.timestamp).toBeTruthy();
  });

  it('handles non-Error throwables (e.g. string or custom object)', () => {
    errorHandler.handleError('Unexpected string error message');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[AutiCare Telemetry: Uncaught Client Error]',
      expect.objectContaining({
        message: 'Unexpected string error message',
      }),
    );

    expect(clientErrorService.lastError()?.message).toBe('Unexpected string error message');
  });

  it('records anonymous user context when user is unauthenticated', () => {
    mockAuth.parent.set(null);

    errorHandler.handleError(new Error('Unauthenticated crash'));

    const lastError = clientErrorService.lastError();
    expect(lastError?.userContext).toEqual({});
  });

  it('emits localized Khmer notification message when language is km', () => {
    mockI18n.currentLang.set('km');

    errorHandler.handleError(new Error('Crash in Khmer mode'));

    expect(clientErrorService.errorMessage()).toBe(
      'សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសបន្តិចបន្តួចបានកើតឡើង។ សូមព្យាយាមម្តងទៀត។',
    );
  });

  it('emits localized English notification message when language is en', () => {
    mockI18n.currentLang.set('en');

    errorHandler.handleError(new Error('Crash in English mode'));

    expect(clientErrorService.errorMessage()).toBe(
      'An unexpected error occurred. Please try again or contact support.',
    );
  });

  it('resets error state when clearError() is called', () => {
    errorHandler.handleError(new Error('Temporary glitch'));
    expect(clientErrorService.errorMessage()).not.toBeNull();

    clientErrorService.clearError();

    expect(clientErrorService.lastError()).toBeNull();
    expect(clientErrorService.errorMessage()).toBeNull();
  });
});

describe('AppComponent Global Error Toast Integration', () => {
  let fixture: ComponentFixture<AppComponent>;
  let clientErrorService: ClientErrorService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        ClientErrorService,
        {
          provide: I18nService,
          useValue: { currentLang: signal('km') },
        },
      ],
    });

    fixture = TestBed.createComponent(AppComponent);
    clientErrorService = TestBed.inject(ClientErrorService);
    fixture.detectChanges();
  });

  it('does not render error toast when there is no active error', () => {
    const toast = fixture.nativeElement.querySelector('.global-error-toast');
    expect(toast).toBeNull();
  });

  it('renders global error toast when clientErrorService reports an error', () => {
    clientErrorService.reportError({
      id: 'err_test',
      message: 'Network timeout',
      url: 'http://localhost/dashboard',
      timestamp: new Date().toISOString(),
      userContext: {},
      language: 'km',
    });

    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.global-error-toast');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសបន្តិចបន្តួចបានកើតឡើង');
  });

  it('dismisses toast when close button is clicked', () => {
    clientErrorService.reportError({
      id: 'err_test',
      message: 'Network timeout',
      url: 'http://localhost/dashboard',
      timestamp: new Date().toISOString(),
      userContext: {},
      language: 'km',
    });
    fixture.detectChanges();

    const dismissBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.toast-dismiss-btn');
    expect(dismissBtn).not.toBeNull();
    dismissBtn.click();
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('.global-error-toast');
    expect(toast).toBeNull();
    expect(clientErrorService.errorMessage()).toBeNull();
  });
});
