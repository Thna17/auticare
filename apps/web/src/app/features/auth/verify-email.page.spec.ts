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
    const boxes = el.querySelectorAll<HTMLInputElement>('input.code-box');
    expect(boxes).toHaveLength(6);
    // Only the first box takes the browser's one-time-code autofill.
    expect(boxes[0]?.getAttribute('autocomplete')).toBe('one-time-code');
    expect(boxes[1]?.getAttribute('autocomplete')).toBe('off');
    expect(boxes[0]?.getAttribute('inputmode')).toBe('numeric');
    expect(boxes[5]?.getAttribute('aria-label')).toBe('Digit 6 of 6');
  });

  const boxesOf = (fixture: { nativeElement: unknown }) =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input.code-box'),
    );

  const type = (box: HTMLInputElement, value: string) => {
    box.value = value;
    box.dispatchEvent(new Event('input'));
  };

  it('moves to the next box as each digit is typed, and sends the code at the sixth', () => {
    const { fixture, auth } = setup();
    auth.verifyEmail.mockReturnValue(of({ id: 'p-1', role: 'PARENT' }));
    const boxes = boxesOf(fixture);

    type(boxes[0]!, '4');
    expect(document.activeElement).toBe(boxes[1]);
    '29130'.split('').forEach((digit, i) => type(boxes[i + 1]!, digit));

    expect(auth.verifyEmail).toHaveBeenCalledWith('new.parent@example.com', '429130');
  });

  it('ignores letters typed into a box', () => {
    const { fixture, page } = setup();
    const [first] = boxesOf(fixture);
    type(first!, 'a');
    expect(first!.value).toBe('');
    expect(page.form.controls.code.value).toBe('');
  });

  it('fills every box from a pasted code and sends it', () => {
    const { fixture, auth } = setup();
    auth.verifyEmail.mockReturnValue(of({ id: 'p-1', role: 'PARENT' }));
    const boxes = boxesOf(fixture);
    const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', {
      value: { getData: () => 'Your code is 123 456' },
    });

    boxes[2]!.dispatchEvent(paste);
    fixture.detectChanges();

    expect(boxes.map((box) => box.value).join('')).toBe('123456');
    expect(auth.verifyEmail).toHaveBeenCalledWith('new.parent@example.com', '123456');
  });

  it('steps back and clears the previous box on Backspace in an empty box', () => {
    const { fixture, page } = setup();
    const boxes = boxesOf(fixture);
    type(boxes[0]!, '7');
    boxes[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(boxes[0]);
    expect(page.form.controls.code.value).toBe('');
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
