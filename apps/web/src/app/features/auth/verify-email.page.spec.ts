import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { VerifyEmailPage } from './verify-email.page';

describe('VerifyEmailPage', () => {
  const setup = (email: string | null = 'new.parent@example.com', lang: 'en' | 'km' = 'en') => {
    const auth = { verifyEmail: vi.fn(), resendVerification: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: (k: string) => (k === 'email' ? email : null) } },
          },
        },
      ],
    });
    TestBed.inject(I18nService).setLanguage(lang);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(VerifyEmailPage);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, auth, router };
  };

  it('shows the address the code went to, and asks only for the code', () => {
    const { fixture } = setup();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('new.parent@example.com');
    expect(el.querySelector('input[type="email"]')).toBeNull();
    const code = el.querySelector<HTMLInputElement>('input.code-input');
    expect(code?.getAttribute('autocomplete')).toBe('one-time-code');
    expect(code?.getAttribute('inputmode')).toBe('numeric');
  });

  it('asks for the email too when it is not in the link', () => {
    const { fixture } = setup(null);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('input[type="email"]'),
    ).not.toBeNull();
  });

  it('signs the parent in with the right code', () => {
    const { page, auth, router } = setup();
    auth.verifyEmail.mockReturnValue(of({ id: 'p-1', role: 'PARENT' }));
    page.form.controls.code.setValue('042913');

    page.submit();

    expect(auth.verifyEmail).toHaveBeenCalledWith('new.parent@example.com', '042913');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('does not send anything that is not six digits', () => {
    const { page, auth } = setup();
    page.form.controls.code.setValue('12345');
    page.submit();
    expect(auth.verifyEmail).not.toHaveBeenCalled();
  });

  it('explains a wrong or expired code in the chosen language', () => {
    const { page, auth, fixture } = setup('new.parent@example.com', 'km');
    auth.verifyEmail.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    page.form.controls.code.setValue('111111');

    page.submit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'លេខកូដមិនត្រឹមត្រូវ ឬផុតកំណត់ហើយ',
    );
  });

  it('waits a minute before offering a new code, then sends one', () => {
    vi.useFakeTimers();
    try {
      const { auth, fixture } = setup();
      const resend = () =>
        (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.resend-btn')!;
      expect(resend().disabled).toBe(true);

      vi.advanceTimersByTime(60_000);
      fixture.detectChanges();
      expect(resend().disabled).toBe(false);

      auth.resendVerification.mockReturnValue(of({ message: 'ok' }));
      resend().click();
      fixture.detectChanges();
      expect(auth.resendVerification).toHaveBeenCalledWith('new.parent@example.com');
      expect(resend().disabled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
