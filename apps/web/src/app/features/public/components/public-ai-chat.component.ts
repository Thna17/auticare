import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/config/api.config';
import { I18nService } from '../../../core/i18n/i18n.service';

type ChatRole = 'USER' | 'ASSISTANT';
type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  sources?: { title: string; publisher: string; url: string }[];
};

const COPY = {
  en: {
    title: 'Ask AutiCare',
    subtitle: 'AI Parent Assistant',
    assistant: 'AI Assistant',
    newChat: 'New Chat',
    clearChat: 'Clear chat',
    placeholder: 'Ask anything about autism or child development...',
    send: 'Send message',
    empty: 'Ask your first question to begin. Your chat is not saved by AutiCare.',
    privacy:
      'Messages are sent to an AI service for processing and are not saved by AutiCare. Please do not include names, addresses, or other identifying details.',
    disclaimer: 'Educational information only, not a medical diagnosis.',
    thinking: 'AutiCare is thinking',
    copy: 'Copy response',
    copied: 'Copied',
    failed: 'I could not send that just now. Please try again.',
    unavailable:
      'The AI assistant is not configured. An administrator must set AI_BASE_URL and AI_MODEL, plus AI_API_KEY if the provider requires it.',
    connection:
      'Cannot reach the AutiCare API. Check that the backend is running and that this site is allowed by CORS.',
    invalid: 'Please check your message and try again. Messages can be up to 2,000 characters.',
    denied:
      'The chat API refused this request. Check that the deployed backend includes public chat access.',
    provider:
      'The AI provider request failed. Check its server-side configuration and provider status.',
    limited: 'Please wait a little before sending another question.',
  },
  km: {
    title: 'សួរ AutiCare',
    subtitle: 'ជំនួយការ AI សម្រាប់មាតាបិតា',
    assistant: 'ជំនួយការ AI',
    newChat: 'ជជែកថ្មី',
    clearChat: 'សម្អាតការជជែក',
    placeholder: 'សួរអំពីអូទីសឹម ឬការអភិវឌ្ឍរបស់កុមារ...',
    send: 'ផ្ញើសារ',
    empty: 'សូមសួរសំណួរដំបូងដើម្បីចាប់ផ្តើម។ AutiCare មិនរក្សាទុកការជជែកនេះទេ។',
    privacy:
      'សាររបស់អ្នកត្រូវបានផ្ញើទៅសេវា AI ដើម្បីដំណើរការ ហើយ AutiCare មិនរក្សាទុកសារទាំងនេះទេ។ សូមកុំបញ្ចូលឈ្មោះ អាសយដ្ឋាន ឬព័ត៌មានដែលអាចសម្គាល់អត្តសញ្ញាណបាន។',
    disclaimer: 'ព័ត៌មានសម្រាប់ការអប់រំប៉ុណ្ណោះ មិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ។',
    thinking: 'AutiCare កំពុងគិត',
    copy: 'ចម្លងចម្លើយ',
    copied: 'បានចម្លង',
    failed: 'មិនអាចផ្ញើសារឥឡូវនេះបានទេ។ សូមព្យាយាមម្តងទៀត។',
    unavailable:
      'មិនទាន់បានកំណត់រចនាសម្ព័ន្ធ AI ទេ។ អ្នកគ្រប់គ្រងត្រូវកំណត់ AI_BASE_URL និង AI_MODEL ព្រមទាំង AI_API_KEY ប្រសិនបើអ្នកផ្តល់សេវាតម្រូវ។',
    connection:
      'មិនអាចភ្ជាប់ទៅ API របស់ AutiCare បានទេ។ សូមពិនិត្យថាម៉ាស៊ីនមេកំពុងដំណើរការ និងបានអនុញ្ញាតគេហទំព័រនេះក្នុង CORS។',
    invalid: 'សូមពិនិត្យសាររបស់អ្នក រួចព្យាយាមម្តងទៀត។ សារអាចមានប្រវែងរហូតដល់ ២,០០០ តួអក្សរ។',
    denied: 'API ជជែកបានបដិសេធសំណើនេះ។ សូមពិនិត្យថាម៉ាស៊ីនមេដែលបានដាក់ឱ្យប្រើមានមុខងារជជែកសាធារណៈ។',
    provider: 'សំណើទៅសេវា AI បានបរាជ័យ។ សូមពិនិត្យការកំណត់នៅលើម៉ាស៊ីនមេ និងស្ថានភាពអ្នកផ្តល់សេវា។',
    limited: 'សូមរង់ចាំបន្តិច មុនពេលផ្ញើសំណួរបន្ទាប់។',
  },
} as const;

@Component({
  selector: 'ac-public-ai-chat',
  standalone: true,
  template: `
    <section class="chat-card" aria-label="{{ copy().title }}">
      <header class="chat-head">
        <span class="brand-mark" aria-hidden="true">✧</span>
        <div>
          <h3>{{ copy().title }}</h3>
          <p>{{ copy().subtitle }}</p>
        </div>
        <span class="assistant-badge">{{ copy().assistant }}</span>
      </header>
      <div class="chat-toolbar">
        <div
          class="language"
          role="group"
          [attr.aria-label]="currentLang() === 'km' ? 'ភាសា' : 'Language'"
        >
          <button
            type="button"
            [class.selected]="currentLang() === 'en'"
            (click)="setLanguage('en')"
          >
            English
          </button>
          <button
            type="button"
            [class.selected]="currentLang() === 'km'"
            (click)="setLanguage('km')"
          >
            ខ្មែរ
          </button>
        </div>
        <button class="new-chat" type="button" [disabled]="sending()" (click)="clearChat()">
          ＋ {{ copy().newChat }}
        </button>
      </div>
      <div #thread class="thread" aria-live="polite" aria-relevant="additions text">
        @if (messages().length === 0) {
          <p class="empty-state">{{ copy().empty }}</p>
        } @else {
          @for (message of messages(); track message.id) {
            <article class="message-row" [class.from-user]="message.role === 'USER'">
              <p class="message" [class.user]="message.role === 'USER'">{{ message.content }}</p>
              @if (message.role === 'ASSISTANT' && message.sources?.length) {
                <ul class="sources">
                  @for (source of message.sources; track source.url) {
                    <li>
                      <a [href]="source.url" target="_blank" rel="noopener noreferrer">{{
                        source.title
                      }}</a>
                      · {{ source.publisher }}
                    </li>
                  }
                </ul>
              }
              @if (message.role === 'ASSISTANT') {
                <button class="copy" type="button" (click)="copyResponse(message)">
                  {{ copiedId() === message.id ? copy().copied : copy().copy }}
                </button>
              }
            </article>
          }
        }
        @if (sending()) {
          <div class="message assistant typing" role="status">
            <span>{{ copy().thinking }}</span
            ><i></i><i></i><i></i>
          </div>
        }
      </div>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <form class="composer" (submit)="submit($event)">
        <label class="sr-only" for="public-chat-input">{{ copy().placeholder }}</label>
        <textarea
          id="public-chat-input"
          rows="1"
          maxlength="2000"
          [value]="draft()"
          [placeholder]="copy().placeholder"
          [disabled]="sending()"
          (input)="draft.set($any($event.target).value)"
          (keydown)="onKeydown($event)"
        ></textarea>
        <button
          type="submit"
          [disabled]="sending() || !draft().trim()"
          [attr.aria-label]="copy().send"
        >
          ➤
        </button>
      </form>
      <p class="privacy">{{ copy().privacy }}</p>
      <p class="disclaimer">{{ copy().disclaimer }}</p>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .chat-card {
        display: grid;
        grid-template-rows: auto auto minmax(240px, 1fr) auto auto auto;
        min-height: 500px;
        max-height: 560px;
        overflow: hidden;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 24px;
        background: #fff;
        box-shadow: 0 16px 40px rgb(19 48 46 / 8%);
      }
      .chat-head {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 22px;
        background: var(--ac-color-surface-info);
      }
      .brand-mark {
        color: var(--ac-color-action);
        font-size: 32px;
      }
      .chat-head h3 {
        margin: 0;
        font-size: 20px;
      }
      .chat-head p {
        margin: 2px 0 0;
        color: var(--ac-color-text-muted);
      }
      .assistant-badge {
        margin-left: auto;
        padding: 6px 12px;
        border-radius: 999px;
        color: var(--ac-color-action-deep);
        background: var(--ac-color-surface-success);
        font-weight: 700;
        white-space: nowrap;
      }
      .chat-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 18px;
      }
      .language {
        display: flex;
        gap: 4px;
        padding: 4px;
        background: var(--ac-color-surface-soft);
        border-radius: 999px;
      }
      .language button,
      .new-chat {
        min-height: 40px;
        padding: 7px 14px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        font: inherit;
        cursor: pointer;
      }
      .language button.selected {
        background: #fff;
        box-shadow: 0 1px 5px rgb(0 0 0 / 10%);
      }
      .new-chat {
        border: 1px solid var(--ac-color-border-slate);
        color: var(--ac-color-text-body);
        white-space: nowrap;
      }
      .new-chat:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .thread {
        display: flex;
        flex-direction: column;
        gap: 14px;
        overflow: auto;
        padding: 12px 22px;
        background-color: #fff;
        background-image: radial-gradient(var(--ac-color-border-slate) 1px, transparent 1px);
        background-size: 18px 18px;
      }
      .message-row {
        display: grid;
        justify-items: start;
        max-width: min(86%, 760px);
      }
      .message-row.from-user {
        align-self: end;
        justify-items: end;
      }
      .message {
        margin: 0;
        padding: 12px 16px;
        border-radius: 18px;
        line-height: 1.55;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .empty-state {
        margin: auto;
        padding: 18px;
        color: var(--ac-color-text-muted);
        text-align: center;
      }
      .message.assistant {
        border: 1px solid var(--ac-color-border-slate);
        background: #fff;
        color: var(--ac-color-text-body);
      }
      .message.user {
        color: var(--ac-color-text-on-action);
        background: var(--ac-color-action);
      }
      .copy {
        border: 0;
        padding: 5px 8px;
        background: transparent;
        color: var(--ac-color-text-muted);
        font: inherit;
        font-size: 12px;
        cursor: pointer;
      }
      .sources {
        margin: 4px 0 0;
        padding-left: 18px;
        color: var(--ac-color-text-muted);
        font-size: 12px;
        line-height: 1.5;
      }
      .sources a {
        color: var(--ac-color-action-deep);
      }
      .typing {
        display: flex;
        align-items: center;
        gap: 5px;
        align-self: start;
        color: var(--ac-color-text-muted) !important;
      }
      .typing i {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--ac-color-action);
        animation: pulse 1s infinite alternate;
      }
      .typing i:nth-child(3) {
        animation-delay: 0.2s;
      }
      .typing i:nth-child(4) {
        animation-delay: 0.4s;
      }
      @keyframes pulse {
        to {
          opacity: 0.25;
          transform: translateY(-3px);
        }
      }
      .composer {
        display: flex;
        align-items: end;
        gap: 10px;
        padding: 12px 18px 8px;
      }
      .composer textarea {
        flex: 1;
        min-width: 0;
        max-height: 120px;
        resize: vertical;
        padding: 12px 16px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 24px;
        font: inherit;
        line-height: 1.4;
      }
      .composer textarea:focus-visible,
      .composer button:focus-visible,
      .new-chat:focus-visible,
      .language button:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }
      .composer button {
        flex: none;
        width: 44px;
        height: 44px;
        border: 0;
        border-radius: 50%;
        color: #fff;
        background: var(--ac-color-action);
        font-size: 21px;
        cursor: pointer;
      }
      .composer button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .privacy,
      .disclaimer,
      .error {
        margin: 0;
        padding: 4px 20px;
        text-align: center;
        color: var(--ac-color-text-muted);
        font-size: 12px;
        line-height: 1.45;
      }
      .disclaimer {
        padding-bottom: 14px;
      }
      .error {
        color: var(--ac-color-alert-text);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @media (max-width: 600px) {
        .chat-card {
          min-height: 460px;
          max-height: 70vh;
          border-radius: 18px;
        }
        .chat-head {
          padding: 14px;
          gap: 8px;
        }
        .assistant-badge {
          font-size: 12px;
          padding: 5px 8px;
        }
        .thread {
          padding: 10px 12px;
        }
        .message-row {
          max-width: 94%;
        }
        .composer {
          padding-inline: 10px;
        }
        .privacy,
        .disclaimer {
          padding-inline: 12px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicAiChatComponent {
  private nextMessageId = 0;
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly i18n = inject(I18nService);
  private readonly threadElement = viewChild<ElementRef<HTMLElement>>('thread');
  protected readonly currentLang = this.i18n.currentLang;
  protected readonly copy = computed(() => COPY[this.currentLang() === 'km' ? 'km' : 'en']);
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);
  protected readonly error = signal('');
  protected readonly copiedId = signal<string | null>(null);

  protected setLanguage(language: 'en' | 'km'): void {
    this.i18n.setLanguage(language);
  }
  protected clearChat(): void {
    this.messages.set([]);
    this.draft.set('');
    this.error.set('');
  }
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
  protected submit(event: Event): void {
    event.preventDefault();
    this.send();
  }

  private send(): void {
    const content = this.draft().trim();
    if (!content || this.sending()) return;
    this.error.set('');
    this.sending.set(true);
    this.scrollToLatest();
    const history = this.messages()
      .slice(-10)
      .map(({ role, content: text }) => ({ role, content: text }));
    this.http
      .post<{ data: { message: string; sources?: ChatMessage['sources'] } }>(
        `${this.apiBaseUrl}/public/ai-chat`,
        {
          content,
          language: this.currentLang(),
          history,
        },
      )
      .subscribe({
        next: ({ data }) => {
          this.messages.update((items) => [
            ...items,
            { id: this.makeId(), role: 'USER', content },
            { id: this.makeId(), role: 'ASSISTANT', content: data.message, sources: data.sources },
          ]);
          this.draft.set('');
          this.sending.set(false);
          this.scrollToLatest();
        },
        error: (failure) => {
          this.sending.set(false);
          this.error.set(this.messageForFailure(failure));
        },
      });
  }

  private messageForFailure(failure: {
    status?: number;
    error?: { error?: { message?: string } };
  }): string {
    if (failure.status === 0 || failure.status === undefined) return this.copy().connection;
    if (failure.status === 400) return this.copy().invalid;
    if (failure.status === 401 || failure.status === 403) return this.copy().denied;
    if (failure.status === 429) return this.copy().limited;
    if (failure.status === 503) return this.copy().unavailable;
    if (failure.status === 502) return failure.error?.error?.message ?? this.copy().provider;
    return this.copy().failed;
  }

  protected async copyResponse(message: ChatMessage): Promise<void> {
    try {
      await navigator.clipboard.writeText(message.content);
      this.copiedId.set(message.id);
    } catch {
      this.error.set(this.copy().failed);
    }
  }

  private scrollToLatest(): void {
    requestAnimationFrame(() => {
      const thread = this.threadElement()?.nativeElement;
      if (thread) thread.scrollTop = thread.scrollHeight;
    });
  }

  private makeId(): string {
    this.nextMessageId += 1;
    return `public-chat-${this.nextMessageId}`;
  }
}
