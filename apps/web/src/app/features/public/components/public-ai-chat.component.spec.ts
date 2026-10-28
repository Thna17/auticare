// @vitest-environment jsdom
import '@angular/compiler';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PublicAiChatComponent } from './public-ai-chat.component';
import { I18nService } from '../../../core/i18n/i18n.service';

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

describe('PublicAiChatComponent', () => {
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<PublicAiChatComponent>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PublicAiChatComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).setLanguage('km');
    fixture = TestBed.createComponent(PublicAiChatComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  const send = (text: string) => {
    const component = fixture.componentInstance as any;
    component.draft.set(text);
    component.send();
    fixture.detectChanges();
  };

  it('sends a real request without authentication and renders the generated answer', () => {
    send('What can I try at home?');
    const request = http.expectOne('/api/v1/public/ai-chat');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(false);
    expect(request.request.body).toEqual({
      content: 'What can I try at home?',
      language: 'km',
      history: [],
    });
    request.flush({ data: { message: 'សាកល្បងលេងជាមួយគ្នា។' } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('សាកល្បងលេងជាមួយគ្នា។');
  });

  it('preserves the transcript while switching language and sends recent context', () => {
    send('My child is four.');
    http.expectOne('/api/v1/public/ai-chat').flush({ data: { message: 'Thanks for sharing.' } });
    fixture.detectChanges();
    (fixture.componentInstance as any).setLanguage('en');
    send('What should I try?');
    const request = http.expectOne('/api/v1/public/ai-chat');
    expect(request.request.body).toEqual({
      content: 'What should I try?',
      language: 'en',
      history: [
        { role: 'USER', content: 'My child is four.' },
        { role: 'ASSISTANT', content: 'Thanks for sharing.' },
      ],
    });
    request.flush({ data: { message: 'Try a short activity together.' } });
  });

  it('clears the local conversation and shows useful rate-limit feedback', () => {
    send('A question');
    http
      .expectOne('/api/v1/public/ai-chat')
      .flush({ error: { code: 'RATE_LIMITED' } }, { status: 429, statusText: 'Too Many Requests' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('រង់ចាំបន្តិច');
    (fixture.componentInstance as any).clearChat();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.message-row')).toHaveLength(0);
  });

  it('explains backend connection and provider configuration failures', () => {
    send('Could you explain communication delays?');
    http.expectOne('/api/v1/public/ai-chat').error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('មិនអាចភ្ជាប់ទៅ API របស់ AutiCare បានទេ');

    send('Could you explain communication delays?');
    http
      .expectOne('/api/v1/public/ai-chat')
      .flush(
        { error: { code: 'AI_UNAVAILABLE', message: 'Not configured.' } },
        { status: 503, statusText: 'Service Unavailable' },
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('AI_BASE_URL និង AI_MODEL');
  });
});
