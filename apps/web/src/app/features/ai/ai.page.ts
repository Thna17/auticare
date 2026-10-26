import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import type {
  AiConversationDetailResponse,
  AiConversationSummary,
  AiMessageResponse,
  AiStatusResponse,
} from '@auticare/contracts';
import { switchMap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { AiApi } from './data-access/ai.api';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { GuidanceBrowserComponent } from '../guidance/guidance-browser.component';

const COPY = {
  en: {
    eyebrow: 'AI assistant',
    title: 'Ask anything',
    subtitle:
      'About your child, about autism, about what to do tonight. Answers are general guidance, never a diagnosis.',
    placeholder: 'Type your question…',
    send: 'Send',
    sending: 'Thinking…',
    newConversation: 'New conversation',
    history: 'Earlier conversations',
    noHistory: 'No earlier conversations yet.',
    suggestions: [
      'My son is 3 and does not point at things. Should I be worried?',
      'She screams when we leave the house. What can I do?',
      'What should I tell the doctor at our appointment?',
    ],
    suggestionsLabel: 'Try asking',
    crisisTitle: 'This needs help now',
    crisisLink: 'Open crisis support',
    medicationBadge: 'No medication advice',
    sources: 'Where this came from',
    notConfiguredTitle: 'The assistant is not switched on yet',
    notConfiguredBody:
      'This installation has no model provider configured, so the assistant cannot answer. Everything else in the app keeps working. An administrator sets AI_BASE_URL and AI_MODEL on the server to enable it.',
    messageSentError: 'Your message could not be sent.',
    limitError: 'You have reached today’s limit for assistant messages. It resets tomorrow.',
    unavailableError: 'The assistant is not available right now. Please try again in a moment.',
    usage: (used: number, limit: number) => `${used} of ${limit} messages used today`,
    disclaimer:
      'AutiCare does not diagnose. If you are worried, a qualified clinician should see your child.',
    deleteConversation: 'Delete this conversation',
    retry: 'Try again',
  },
  km: {
    eyebrow: 'ជំនួយការ AI',
    title: 'សួរបានគ្រប់រឿង',
    subtitle:
      'អំពីកូនរបស់អ្នក អំពីអូទីសឹម អំពីអ្វីដែលត្រូវធ្វើយប់នេះ។ ចម្លើយជាការណែនាំទូទៅ មិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ។',
    placeholder: 'វាយសំណួររបស់អ្នក…',
    send: 'ផ្ញើ',
    sending: 'កំពុងគិត…',
    newConversation: 'ការសន្ទនាថ្មី',
    history: 'ការសន្ទនាមុនៗ',
    noHistory: 'មិនទាន់មានការសន្ទនាមុនទេ។',
    suggestions: [
      'កូនប្រុសខ្ញុំអាយុ ៣ ឆ្នាំ ហើយមិនចង្អុលបង្ហាញអ្វី។ តើខ្ញុំគួរព្រួយបារម្ភទេ?',
      'គាត់យំរាល់ពេលយើងចេញពីផ្ទះ។ តើខ្ញុំអាចធ្វើដូចម្តេច?',
      'តើខ្ញុំគួរប្រាប់គ្រូពេទ្យអ្វីខ្លះនៅពេលជួប?',
    ],
    suggestionsLabel: 'សាកសួរ',
    crisisTitle: 'រឿងនេះត្រូវការជំនួយឥឡូវនេះ',
    crisisLink: 'បើកជំនួយបន្ទាន់',
    medicationBadge: 'មិនផ្តល់យោបល់អំពីថ្នាំ',
    sources: 'ប្រភពនៃចម្លើយនេះ',
    notConfiguredTitle: 'ជំនួយការមិនទាន់បានបើកទេ',
    notConfiguredBody:
      'ការដំឡើងនេះមិនទាន់មានកំណត់អ្នកផ្តល់ម៉ូដែលទេ ដូច្នេះជំនួយការមិនអាចឆ្លើយបានទេ។ ផ្នែកផ្សេងទៀតនៃកម្មវិធីនៅតែដំណើរការ។ អ្នកគ្រប់គ្រងកំណត់ AI_BASE_URL និង AI_MODEL នៅលើម៉ាស៊ីនមេ ដើម្បីបើកវា។',
    messageSentError: 'មិនអាចផ្ញើសាររបស់អ្នកបានទេ។',
    limitError: 'អ្នកបានឈានដល់កំណត់សារប្រចាំថ្ងៃហើយ។ វានឹងចាប់ផ្តើមឡើងវិញនៅថ្ងៃស្អែក។',
    unavailableError: 'ជំនួយការមិនអាចប្រើបាននៅពេលនេះទេ។ សូមព្យាយាមម្តងទៀត។',
    usage: (used: number, limit: number) => `ប្រើ ${used} ក្នុង ${limit} សារថ្ងៃនេះ`,
    disclaimer:
      'AutiCare មិនធ្វើរោគវិនិច្ឆ័យទេ។ ប្រសិនបើអ្នកបារម្ភ គ្រូពេទ្យជំនាញគួរពិនិត្យកូនអ្នក។',
    deleteConversation: 'លុបការសន្ទនានេះ',
    retry: 'ព្យាយាមម្តងទៀត',
  },
};

/**
 * The assistant tab.
 *
 * Three things are visible by design rather than hidden in a settings screen:
 * the daily allowance, the standing "we do not diagnose" line, and the sources an
 * answer drew on. A parent trusting this most is exactly why it should show its
 * own limits.
 */
@Component({
  standalone: true,
  imports: [RouterLink, UiSpinnerComponent, GuidanceBrowserComponent],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">{{ copy().eyebrow }}</p>
        <h1>{{ copy().title }}</h1>
        <p class="subtitle">{{ copy().subtitle }}</p>
      </div>
      <div class="head-actions">
        @if (conversation()) {
          <button type="button" class="ghost" (click)="startNew()">
            {{ copy().newConversation }}
          </button>
        }
      </div>
    </header>

    @if (status(); as state) {
      @if (!state.configured) {
        <section class="setup" role="status">
          <h2>{{ copy().notConfiguredTitle }}</h2>
          <p>{{ copy().notConfiguredBody }}</p>
        </section>
      } @else {
        <p class="usage">{{ copy().usage(state.usedToday, state.dailyLimit) }}</p>
      }
    }

    @if (conversations().length > 0) {
      <details class="history">
        <summary>{{ copy().history }}</summary>
        <ul>
          @for (item of conversations(); track item.id) {
            <li>
              <button type="button" class="history-item" (click)="open(item.id)">
                <span class="history-title">{{ item.title }}</span>
                <span class="history-count">{{ item.messageCount }}</span>
              </button>
            </li>
          }
        </ul>
      </details>
    }

    <section class="thread" aria-live="polite">
      @if (loading()) {
        <ac-ui-spinner [label]="copy().sending" />
      } @else if (messages().length === 0) {
        <div class="intro">
          <p class="suggestions-label">{{ copy().suggestionsLabel }}</p>
          <div class="suggestions">
            @for (suggestion of copy().suggestions; track suggestion) {
              <button
                type="button"
                class="suggestion"
                [disabled]="sending()"
                (click)="ask(suggestion)"
              >
                {{ suggestion }}
              </button>
            }
          </div>
        </div>
      } @else {
        @for (message of messages(); track message.id) {
          @if (message.role === 'USER') {
            <div class="bubble user">
              <p>{{ message.content }}</p>
            </div>
          } @else {
            <div class="bubble assistant" [class.crisis]="message.kind === 'CRISIS'">
              @if (message.kind === 'CRISIS') {
                <p class="kind-label">{{ copy().crisisTitle }}</p>
              }
              <p class="answer">{{ message.content }}</p>

              @if (message.kind === 'CRISIS') {
                <a class="crisis-link" routerLink="/crisis">{{ copy().crisisLink }}</a>
              }
              @if (message.kind === 'MEDICATION') {
                <span class="badge">{{ copy().medicationBadge }}</span>
              }
              @if (message.sources.length > 0) {
                <div class="sources">
                  <p class="sources-label">{{ copy().sources }}</p>
                  <ul>
                    @for (source of message.sources; track source.url) {
                      <li>
                        <a [href]="source.url" target="_blank" rel="noopener noreferrer">
                          {{ source.title }}
                        </a>
                        <span class="publisher">· {{ source.publisher }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
        }
      }

      @if (sending()) {
        <div class="bubble assistant typing">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          <span class="sr">{{ copy().sending }}</span>
        </div>
      }
    </section>

    @if (error()) {
      <div class="error" role="alert">{{ error() }}</div>
    }

    <form class="composer" (submit)="submit($event)">
      <label class="sr" for="ai-input">{{ copy().placeholder }}</label>
      <textarea
        id="ai-input"
        rows="1"
        maxlength="2000"
        [placeholder]="copy().placeholder"
        [value]="draft()"
        [disabled]="sending()"
        (input)="onInput($event)"
        (keydown.enter)="onEnter($event)"
      ></textarea>
      <button type="submit" class="primary" [disabled]="sending() || draft().trim() === ''">
        {{ sending() ? copy().sending : copy().send }}
      </button>
    </form>

    <ac-guidance-browser />

    <p class="disclaimer">{{ copy().disclaimer }}</p>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        max-width: 820px;
        margin: 0 auto;
        min-height: calc(100vh - 160px);
      }

      .page-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
        flex-wrap: wrap;
      }

      .eyebrow {
        margin: 0 0 6px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: var(--ac-type-label);
        font-weight: 700;
        color: var(--ac-color-action);
      }

      h1 {
        margin: 0 0 8px;
        font-size: var(--ac-type-page-title);
        color: var(--ac-color-text-strong);
      }

      h2 {
        margin: 0 0 8px;
        font-size: var(--ac-type-card-title);
        color: var(--ac-color-text-strong);
      }

      .subtitle {
        margin: 0;
        max-width: 60ch;
        color: var(--ac-color-text-muted);
        line-height: 1.6;
      }

      .ghost {
        font: inherit;
        font-size: var(--ac-type-meta);
        font-weight: 700;
        padding: 10px 16px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        background: transparent;
        color: var(--ac-color-text-strong);
        cursor: pointer;
      }

      .ghost:hover {
        background: var(--ac-color-surface-slate);
      }

      .setup {
        padding: 18px 20px;
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border-info);
        background: var(--ac-color-blue-surface-soft);
        margin-bottom: 16px;
      }

      .setup p {
        margin: 0;
        color: var(--ac-color-text-strong);
        line-height: 1.6;
        font-size: var(--ac-type-meta);
      }

      .usage {
        margin: 0 0 12px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .history {
        margin-bottom: 14px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .history summary {
        cursor: pointer;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .history ul {
        list-style: none;
        margin: 10px 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .history-item {
        width: 100%;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font: inherit;
        text-align: left;
        padding: 8px 10px;
        border-radius: var(--ac-radius-sm);
        border: 1px solid transparent;
        background: transparent;
        color: var(--ac-color-text-strong);
        cursor: pointer;
      }

      .history-item:hover {
        border-color: var(--ac-color-border);
        background: var(--ac-color-surface);
      }

      .history-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .history-count {
        color: var(--ac-color-text-muted);
      }

      .thread {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 16px;
      }

      .intro {
        padding: 8px 0 24px;
      }

      .suggestions-label {
        margin: 0 0 10px;
        font-size: var(--ac-type-label);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--ac-color-text-muted);
        font-weight: 700;
      }

      .suggestions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }

      .suggestion {
        font: inherit;
        text-align: left;
        padding: 12px 16px;
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        cursor: pointer;
        line-height: 1.5;
      }

      .suggestion:hover:not(:disabled) {
        border-color: var(--ac-color-action);
      }

      .bubble {
        max-width: 88%;
        padding: 14px 16px;
        border-radius: var(--ac-radius-lg);
        line-height: 1.65;
      }

      .bubble p {
        margin: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .user {
        align-self: flex-end;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-bottom-right-radius: var(--ac-radius-xs);
      }

      .assistant {
        align-self: flex-start;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        color: var(--ac-color-text-strong);
        border-bottom-left-radius: var(--ac-radius-xs);
      }

      .assistant.crisis {
        border-color: var(--ac-color-alert-strong);
        background: var(--ac-color-alert-surface);
      }

      .kind-label {
        font-weight: 800;
        font-size: var(--ac-type-label);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--ac-color-alert-text);
        margin-bottom: 8px !important;
      }

      .crisis-link {
        display: inline-block;
        margin-top: 12px;
        font-weight: 700;
        color: var(--ac-color-alert-text);
      }

      .badge {
        display: inline-block;
        margin-top: 10px;
        font-size: var(--ac-type-label);
        font-weight: 700;
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-muted);
      }

      .sources {
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid var(--ac-color-border);
      }

      .sources-label {
        font-size: var(--ac-type-label);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--ac-color-text-muted);
        margin-bottom: 6px !important;
      }

      .sources ul {
        margin: 0;
        padding-left: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: var(--ac-type-meta);
      }

      .sources a {
        color: var(--ac-color-action);
      }

      .publisher {
        color: var(--ac-color-text-muted);
      }

      .typing {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ac-color-text-muted);
        animation: pulse 1.1s infinite ease-in-out;
      }

      .dot:nth-child(2) {
        animation-delay: 0.15s;
      }

      .dot:nth-child(3) {
        animation-delay: 0.3s;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 0.25;
        }
        50% {
          opacity: 1;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .dot {
          animation: none;
          opacity: 0.6;
        }
      }

      .error {
        margin: 8px 0;
        padding: 12px 14px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-meta);
      }

      .composer {
        position: sticky;
        bottom: 12px;
        display: flex;
        gap: 10px;
        align-items: flex-end;
        padding: 10px;
        border-radius: var(--ac-radius-lg);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
      }

      textarea {
        flex: 1;
        font: inherit;
        resize: none;
        min-height: 44px;
        max-height: 140px;
        padding: 10px 8px;
        border: 0;
        background: transparent;
        color: var(--ac-color-text-strong);
      }

      textarea:focus-visible {
        outline: none;
      }

      .composer:focus-within {
        border-color: var(--ac-color-action);
      }

      .primary {
        font: inherit;
        font-weight: 700;
        padding: 11px 20px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-action-deep);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .disclaimer {
        margin: 10px 0 0;
        text-align: center;
        font-size: 11px;
        color: var(--ac-color-text-muted);
      }

      .sr {
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

      @media (max-width: 640px) {
        .bubble {
          max-width: 100%;
        }

        .composer {
          bottom: 78px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPage implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly api = inject(AiApi);

  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);

  protected readonly status = signal<AiStatusResponse | null>(null);
  protected readonly conversations = signal<readonly AiConversationSummary[]>([]);
  protected readonly conversation = signal<AiConversationDetailResponse | null>(null);
  protected readonly messages = computed<readonly AiMessageResponse[]>(
    () => this.conversation()?.messages ?? [],
  );
  protected readonly draft = signal('');
  protected readonly sending = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly configured = computed(() => this.status()?.configured ?? false);

  private childId: string | null = null;

  ngOnInit(): void {
    this.api.status().subscribe({
      next: (status) => this.status.set(status),
      error: () => this.status.set(null),
    });

    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.childId = children[0]?.id ?? null;
      },
      error: () => {
        this.childId = null;
      },
    });

    this.api.listConversations().subscribe({
      next: (conversations) => {
        this.conversations.set(conversations);
        const latest = conversations[0];
        if (latest) this.open(latest.id);
      },
      error: () => this.conversations.set([]),
    });
  }

  protected open(conversationId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getConversation(conversationId).subscribe({
      next: (conversation) => {
        this.conversation.set(conversation);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.copy().messageSentError);
      },
    });
  }

  protected startNew(): void {
    this.conversation.set(null);
    this.draft.set('');
    this.error.set(null);
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  /** Enter sends; Shift+Enter is a newline, as in every other chat box. */
  protected onEnter(event: Event): void {
    const keyboard = event as KeyboardEvent;
    if (keyboard.shiftKey) return;
    event.preventDefault();
    this.submit(event);
  }

  protected ask(question: string): void {
    this.draft.set(question);
    this.submit();
  }

  protected submit(event?: Event): void {
    event?.preventDefault();
    const content = this.draft().trim();
    if (!content || this.sending()) return;

    this.error.set(null);
    this.sending.set(true);

    const existing = this.conversation();
    const conversation$ = existing
      ? this.api.sendMessage(existing.id, content)
      : this.api
          .createConversation({
            language: this.i18n.currentLang(),
            ...(this.childId ? { childId: this.childId } : {}),
          })
          .pipe(
            // Create, then ask: the conversation id is only known after the POST.
            switchMap((created) => this.api.sendMessage(created.id, content)),
          );

    conversation$.subscribe({
      next: (result) => {
        this.sending.set(false);
        this.draft.set('');
        this.conversation.update((current) => {
          if (current) {
            return {
              ...current,
              messages: [...current.messages, result.userMessage, result.assistantMessage],
              updatedAt: result.assistantMessage.createdAt,
            };
          }
          return {
            id: result.assistantMessage.conversationId,
            childId: this.childId,
            title: content.length > 60 ? `${content.slice(0, 57)}…` : content,
            language: this.i18n.currentLang(),
            createdAt: result.userMessage.createdAt,
            updatedAt: result.assistantMessage.createdAt,
            messageCount: 2,
            messages: [result.userMessage, result.assistantMessage],
          };
        });
        this.status.update((status) =>
          status ? { ...status, usedToday: status.usedToday + 1 } : status,
        );
        this.refreshConversations();
      },
      error: (response: unknown) => {
        this.sending.set(false);
        this.error.set(this.errorFor(response));
      },
    });
  }

  private refreshConversations(): void {
    this.api.listConversations().subscribe({
      next: (conversations) => this.conversations.set(conversations),
      error: () => {
        // The thread is already on screen; a stale history list is not worth an error.
      },
    });
  }

  private errorFor(response: unknown): string {
    const copy = this.copy();
    if (response instanceof HttpErrorResponse) {
      if (response.status === 429) return copy.limitError;
      if (response.status === 503) return copy.unavailableError;
    }
    return copy.messageSentError;
  }
}
