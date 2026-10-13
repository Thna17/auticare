import { type ErrorHandler, Injectable, NgZone, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { I18nService } from '../i18n/i18n.service';

export interface StructuredClientError {
  readonly id: string;
  readonly message: string;
  readonly stack?: string;
  readonly url: string;
  readonly timestamp: string;
  readonly userContext: {
    readonly id?: string;
    readonly role?: string;
    readonly email?: string;
  };
  readonly language?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientErrorService {
  readonly lastError = signal<StructuredClientError | null>(null);
  readonly errorMessage = signal<string | null>(null);

  reportError(error: StructuredClientError): void {
    this.lastError.set(error);
    const msg =
      error.language === 'en'
        ? 'An unexpected error occurred. Please try again or contact support.'
        : 'សូមអភ័យទោស មានបញ្ហាបច្ចេកទេសបន្តិចបន្តួចបានកើតឡើង។ សូមព្យាយាមម្តងទៀត។';
    this.errorMessage.set(msg);
  }

  clearError(): void {
    this.lastError.set(null);
    this.errorMessage.set(null);
  }
}

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  private readonly zone = inject(NgZone);
  private readonly clientErrorService = inject(ClientErrorService);
  private readonly auth = inject(AuthService, { optional: true });
  private readonly i18n = inject(I18nService, { optional: true });

  handleError(error: unknown): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const parent = this.auth?.parent?.();
    const currentLang = this.i18n?.currentLang?.() ?? 'km';

    const payload: StructuredClientError = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      message: errorObj.message || 'Unknown runtime client error',
      stack: errorObj.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
      userContext: parent
        ? {
            id: parent.id,
            role: parent.role,
            email: parent.email,
          }
        : {},
      language: currentLang,
    };

    // Structured telemetry logging
    console.error('[AutiCare Telemetry: Uncaught Client Error]', payload);

    // Run inside NgZone so signals and UI updates trigger reliably
    this.zone.run(() => {
      this.clientErrorService.reportError(payload);
    });
  }
}
