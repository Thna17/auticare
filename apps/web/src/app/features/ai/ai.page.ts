import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import type {
  AiConversationDetailResponse,
  AiConversationSummary,
  AiMessageResponse,
  AiStatusResponse,
  ChildResponse,
} from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { AiApi } from './data-access/ai.api';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { GuidanceBrowserComponent } from '../guidance/guidance-browser.component';

type AssistantTab = 'chat' | 'saved';

const COPY = {
  en: {
    eyebrow: 'AI assistant',
    title: 'Ask anything',
    subtitle:
      'About your child, about autism, about what to do tonight. Answers are general guidance, never a diagnosis.',
    chatTab: 'Chat',
    savedTab: 'Saved answers',
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
    relatedActivities: 'Related activities',
    viewActivity: 'View activity',
    saveAnswer: 'Save',
    savedAnswer: 'Saved',
    helpful: 'Helpful',
    notHelpful: 'Not helpful',
    feedbackThanks: 'Thank you for your feedback',
    childContextToggle: 'Include child details',
    childContextHint: 'Tailors responses using child age and recent observations. Off by default.',
    savedEmptyTitle: 'No saved answers yet',
    savedEmptyBody:
      'When the assistant provides a helpful reply, click the Save button to keep it here for quick reference.',
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
    title: 'សួរសំណួរណាមួយ',
    subtitle:
      'អំពីកូនរបស់អ្នក អំពីអូទីសឹម អំពីអ្វីដែលត្រូវធ្វើនៅយប់នេះ។ ចម្លើយជាការណែនាំទូទៅ មិនមែនជាការវិនិច្ឆ័យរោគឡើយ។',
    chatTab: 'ការសន្ទនា',
    savedTab: 'ចម្លើយដែលបានរក្សាទុក',
    placeholder: 'វាយបញ្ចូលសំណួររបស់អ្នក…',
    send: 'ផ្ញើ',
    sending: 'កំពុងគិត…',
    newConversation: 'ការសន្ទនាថ្មី',
    history: 'ការសន្ទនាមុនៗ',
    noHistory: 'មិនទាន់មានការសន្ទនាមុនៗនៅឡើយទេ។',
    suggestions: [
      'កូនប្រុសខ្ញុំអាយុ ៣ ឆ្នាំមិនចង្អុលបង្ហាញរបស់របរទេ។ តើខ្ញុំគួរព្រួយបារម្ភដែរឬទេ?',
      'គាត់ស្រែកពេលចេញពីផ្ទះ។ តើខ្ញុំអាចធ្វើអ្វីបាន?',
      'តើខ្ញុំគួរប្រាប់វេជ្ជបណ្ឌិតអ្វីខ្លះនៅពេលណាត់ជួប?',
    ],
    suggestionsLabel: 'សាកល្បងសួរ',
    crisisTitle: 'ករណីនេះត្រូវការជំនួយភ្លាមៗ',
    crisisLink: 'បើកជំនួយបន្ទាន់',
    medicationBadge: 'គ្មានការណែនាំអំពីថ្នាំ',
    sources: 'ប្រភពឯកសារយោង',
    relatedActivities: 'សកម្មភាពពាក់ព័ន្ធ',
    viewActivity: 'មើលសកម្មភាព',
    saveAnswer: 'រក្សាទុក',
    savedAnswer: 'បានរក្សាទុក',
    helpful: 'មានប្រយោជន៍',
    notHelpful: 'មិនសូវមានប្រយោជន៍',
    feedbackThanks: 'សូមអរគុណចំពោះមតិកែលម្អរបស់អ្នក',
    childContextToggle: 'រួមបញ្ចូលព័ត៌មានកូន',
    childContextHint: 'ផ្តល់ការណែនាំតាមអាយុ និងកំណត់ត្រាសង្កេតថ្មីៗរបស់កូន។ បិទជាលំនាំដើម។',
    savedEmptyTitle: 'មិនទាន់មានចម្លើយដែលបានរក្សាទុកទេ',
    savedEmptyBody:
      'នៅពេលជំនួយការឆ្លើយតបមានប្រយោជន៍ ចុចប៊ូតុងរក្សាទុក ដើម្បីទុកមើលនៅទីនេះយ៉ាងរហ័ស។',
    notConfiguredTitle: 'ជំនួយការមិនទាន់បានបើកដំណើរការនៅឡើយទេ',
    notConfiguredBody:
      'ការដំឡើងនេះមិនទាន់មានការកំណត់អ្នកផ្តល់សេវាគំរូទេ ដូច្នេះជំនួយការមិនអាចឆ្លើយបានទេ។ អ្វីៗផ្សេងទៀតនៅក្នុងកម្មវិធីនៅតែដំណើរការធម្មតា។',
    messageSentError: 'មិនអាចផ្ញើសាររបស់អ្នកបានទេ។',
    limitError: 'អ្នកបានដល់កម្រិតកំណត់សារប្រចាំថ្ងៃហើយ។ វានឹងកំណត់ឡើងវិញនៅថ្ងៃស្អែក។',
    unavailableError: 'ជំនួយការមិនអាចប្រើបាននៅពេលនេះទេ។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀត។',
    usage: (used: number, limit: number) => `ប្រើ ${used} នៃ ${limit} សារសម្រាប់ថ្ងៃនេះ`,
    disclaimer:
      'AutiCare មិនធ្វើរោគវិនិច្ឆ័យទេ។ ប្រសិនបើអ្នកព្រួយបារម្ភ គ្លីនិកជំនាញគួរតែពិនិត្យកូនរបស់អ្នក។',
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
  imports: [RouterLink, SlicePipe, UiSpinnerComponent, GuidanceBrowserComponent],
  template: `
    <header class="page-head">
      <div>
        <p class="eyebrow">{{ copy().eyebrow }}</p>
        <h1>{{ copy().title }}</h1>
        <p class="subtitle">{{ copy().subtitle }}</p>
      </div>
      <div class="head-actions">
        @if (conversation() && activeTab() === 'chat') {
          <button type="button" class="ghost" (click)="startNew()">
            {{ copy().newConversation }}
          </button>
        }
      </div>
    </header>

    <!-- Tab navigation -->
    <div class="tabs-bar" role="tablist">
      <button
        type="button"
        role="tab"
        class="tab-btn"
        [class.active]="activeTab() === 'chat'"
        [attr.aria-selected]="activeTab() === 'chat'"
        (click)="setTab('chat')"
      >
        💬 {{ copy().chatTab }}
      </button>
      <button
        type="button"
        role="tab"
        class="tab-btn"
        [class.active]="activeTab() === 'saved'"
        [attr.aria-selected]="activeTab() === 'saved'"
        (click)="setTab('saved')"
      >
        ⭐ {{ copy().savedTab }} ({{ savedMessages().length }})
      </button>
    </div>

    @if (activeTab() === 'saved') {
      <section class="saved-section" aria-label="Saved Answers">
        @if (loadingSaved()) {
          <ac-ui-spinner [label]="copy().sending" />
        } @else if (savedMessages().length === 0) {
          <div class="saved-empty">
            <h3>{{ copy().savedEmptyTitle }}</h3>
            <p>{{ copy().savedEmptyBody }}</p>
          </div>
        } @else {
          <div class="saved-list">
            @for (item of savedMessages(); track item.id) {
              <article class="saved-card">
                <div class="saved-card-head">
                  <span class="saved-time">{{ item.createdAt | slice: 0 : 10 }}</span>
                  <button type="button" class="unsave-btn" (click)="unsave(item)">
                    ★ {{ copy().savedAnswer }}
                  </button>
                </div>
                <p class="saved-content">{{ item.content }}</p>
              </article>
            }
          </div>
        }
      </section>
    } @else {
      @if (status(); as state) {
        @if (!state.configured) {
          <section class="setup" role="status">
            <h2>{{ copy().notConfiguredTitle }}</h2>
            <p>{{ copy().notConfiguredBody }}</p>
          </section>
        } @else {
          <div class="status-bar">
            <p class="usage">{{ copy().usage(state.usedToday, state.dailyLimit) }}</p>
            @if (children().length > 0) {
              <label class="context-toggle">
                <input
                  type="checkbox"
                  [checked]="includeChildContext()"
                  (change)="includeChildContext.set(!includeChildContext())"
                />
                <span>{{ copy().childContextToggle }} ({{ childName() }})</span>
              </label>
            }
          </div>
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
                          <span class="publisher">• {{ source.publisher }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                }

                <!-- Related Activities -->
                @if (message.relatedActivities && message.relatedActivities.length > 0) {
                  <div class="related-activities">
                    <p class="rel-label">{{ copy().relatedActivities }}</p>
                    <div class="rel-grid">
                      @for (act of message.relatedActivities; track act.id) {
                        <div class="rel-card">
                          <span class="rel-cat">{{ act.category }}</span>
                          <h4 class="rel-title">{{ act.title }}</h4>
                          @if (act.description) {
                            <p class="rel-desc">{{ act.description }}</p>
                          }
                          <a routerLink="/activities" class="rel-link"
                            >{{ copy().viewActivity }} →</a
                          >
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Message Actions: Save & Feedback -->
                <div class="msg-footer">
                  <button
                    type="button"
                    class="save-msg-btn"
                    [class.saved]="!!message.savedAt"
                    (click)="toggleSave(message)"
                    [attr.aria-label]="message.savedAt ? copy().savedAnswer : copy().saveAnswer"
                  >
                    {{ message.savedAt ? '★ ' + copy().savedAnswer : '☆ ' + copy().saveAnswer }}
                  </button>

                  <div class="feedback-group">
                    <button
                      type="button"
                      class="fb-btn"
                      [class.active]="message.feedback === 'HELPFUL'"
                      (click)="sendFeedback(message, 'HELPFUL')"
                      [attr.aria-label]="copy().helpful"
                    >
                      👍 {{ copy().helpful }}
                    </button>
                    <button
                      type="button"
                      class="fb-btn"
                      [class.active]="message.feedback === 'NOT_HELPFUL'"
                      (click)="sendFeedback(message, 'NOT_HELPFUL')"
                      [attr.aria-label]="copy().notHelpful"
                    >
                      👎 {{ copy().notHelpful }}
                    </button>
                  </div>
                </div>
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
          (keydown.enter)="onEnter($any($event))"
        ></textarea>
        <button type="submit" class="primary" [disabled]="sending() || draft().trim() === ''">
          {{ sending() ? copy().sending : copy().send }}
        </button>
      </form>

      <ac-guidance-browser />
    }

    <p class="disclaimer">{{ copy().disclaimer }}</p>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 160px);
        max-width: 820px;
        margin: 0 auto;
        padding: 32px 16px 80px;
      }

      .page-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 20px;
      }

      .eyebrow {
        margin: 0 0 6px;
        font-size: var(--ac-type-meta);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ac-color-text-muted);
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(24px, 3.2vw, 32px);
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .subtitle {
        margin: 0;
        color: var(--ac-color-text-muted);
        line-height: 1.5;
      }

      .tabs-bar {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
        border-bottom: 1px solid var(--ac-color-border);
        padding-bottom: 8px;
      }

      .tab-btn {
        padding: 8px 16px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid transparent;
        background: transparent;
        color: var(--ac-color-text-muted);
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }

      .tab-btn.active {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        border-color: var(--ac-color-border);
      }

      .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 16px;
      }

      .usage {
        margin: 0;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .context-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-strong);
        cursor: pointer;
      }

      .history {
        margin-bottom: 16px;
        padding: 10px 14px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        font-size: var(--ac-type-meta);
      }

      .history summary {
        cursor: pointer;
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }

      .history ul {
        list-style: none;
        margin: 10px 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .history-item {
        display: flex;
        justify-content: space-between;
        width: 100%;
        padding: 6px 8px;
        border-radius: var(--ac-radius-sm);
        border: none;
        background: transparent;
        color: var(--ac-color-text-strong);
        font: inherit;
        cursor: pointer;
        text-align: left;
      }

      .history-item:hover {
        background: var(--ac-color-surface-slate);
      }

      .history-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .history-count {
        color: var(--ac-color-text-muted);
        margin-left: 8px;
      }

      .thread {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
      }

      .intro {
        padding: 32px 16px;
        text-align: center;
      }

      .suggestions-label {
        margin: 0 0 12px;
        font-weight: 600;
        color: var(--ac-color-text-muted);
      }

      .suggestions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 480px;
        margin: 0 auto;
      }

      .suggestion {
        padding: 10px 16px;
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 14px;
        cursor: pointer;
        text-align: left;
        line-height: 1.4;
      }

      .suggestion:hover:not(:disabled) {
        background: var(--ac-color-surface-slate);
      }

      .bubble {
        max-width: 85%;
        padding: 14px 18px;
        border-radius: var(--ac-radius-lg);
        line-height: 1.55;
      }

      .bubble.user {
        align-self: flex-end;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-bottom-right-radius: 4px;
      }

      .bubble.user p {
        margin: 0;
      }

      .bubble.assistant {
        align-self: flex-start;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        border: 1px solid var(--ac-color-border);
        border-bottom-left-radius: 4px;
      }

      .bubble.assistant.crisis {
        border-color: var(--ac-color-alert-strong);
        background: color-mix(in srgb, var(--ac-color-alert-strong) 8%, var(--ac-color-surface));
      }

      .kind-label {
        margin: 0 0 8px;
        font-weight: 700;
        color: var(--ac-color-alert-text);
      }

      .crisis-link {
        display: inline-block;
        margin-top: 10px;
        font-weight: 700;
        color: var(--ac-color-alert-text);
      }

      .badge {
        display: inline-block;
        margin-top: 8px;
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .sources {
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid var(--ac-color-border);
        font-size: var(--ac-type-meta);
      }

      .sources-label {
        margin: 0 0 4px;
        font-weight: 600;
        color: var(--ac-color-text-muted);
      }

      .sources ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .sources a {
        color: var(--ac-color-action);
        text-decoration: underline;
      }

      .publisher {
        color: var(--ac-color-text-muted);
        margin-left: 6px;
      }

      .related-activities {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--ac-color-border);
      }

      .rel-label {
        margin: 0 0 8px;
        font-size: var(--ac-type-meta);
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .rel-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .rel-card {
        padding: 10px 14px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border);
      }

      .rel-cat {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--ac-color-action);
      }

      .rel-title {
        margin: 2px 0 4px;
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }

      .rel-desc {
        margin: 0 0 6px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .rel-link {
        font-size: var(--ac-type-meta);
        font-weight: 600;
        color: var(--ac-color-action);
      }

      .msg-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px solid var(--ac-color-border);
      }

      .save-msg-btn {
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        background: transparent;
        color: var(--ac-color-text-muted);
        font: inherit;
        font-size: var(--ac-type-meta);
        cursor: pointer;
      }

      .save-msg-btn.saved {
        background: color-mix(in srgb, var(--ac-color-action) 12%, transparent);
        color: var(--ac-color-action);
        border-color: var(--ac-color-action);
      }

      .feedback-group {
        display: flex;
        gap: 6px;
      }

      .fb-btn {
        padding: 3px 8px;
        border-radius: var(--ac-radius-sm);
        border: 1px solid var(--ac-color-border);
        background: transparent;
        color: var(--ac-color-text-muted);
        font: inherit;
        font-size: 12px;
        cursor: pointer;
      }

      .fb-btn.active {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        border-color: var(--ac-color-text-strong);
      }

      .saved-section {
        margin-bottom: 24px;
      }

      .saved-empty {
        padding: 40px 20px;
        text-align: center;
        border: 1.5px dashed var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
      }

      .saved-empty h3 {
        margin: 0 0 8px;
        color: var(--ac-color-text-strong);
      }

      .saved-empty p {
        margin: 0;
        color: var(--ac-color-text-muted);
      }

      .saved-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .saved-card {
        padding: 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
      }

      .saved-card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .saved-time {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .unsave-btn {
        padding: 3px 8px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-action);
        background: color-mix(in srgb, var(--ac-color-action) 12%, transparent);
        color: var(--ac-color-action);
        font: inherit;
        font-size: 11px;
        cursor: pointer;
      }

      .saved-content {
        margin: 0;
        color: var(--ac-color-text-strong);
        line-height: 1.55;
        white-space: pre-wrap;
      }

      .composer {
        display: flex;
        gap: 12px;
        align-items: flex-end;
        padding: 12px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
      }

      .composer textarea {
        flex: 1;
        padding: 8px 12px;
        border-radius: var(--ac-radius-sm);
        border: none;
        background: transparent;
        color: var(--ac-color-text-strong);
        font: inherit;
        resize: none;
      }

      .primary {
        padding: 10px 20px;
        border-radius: var(--ac-radius-pill);
        border: none;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      .primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .ghost {
        padding: 8px 16px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        background: transparent;
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 14px;
        cursor: pointer;
      }

      .disclaimer {
        margin-top: 24px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
        text-align: center;
      }

      .typing {
        display: flex;
        gap: 4px;
        align-items: center;
        padding: 12px 18px;
      }

      .typing .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ac-color-text-muted);
        animation: blink 1.2s infinite both;
      }

      .typing .dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      .typing .dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes blink {
        0%,
        80%,
        100% {
          opacity: 0.3;
        }
        40% {
          opacity: 1;
        }
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPage implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly api = inject(AiApi);

  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);
  protected readonly activeTab = signal<AssistantTab>('chat');

  protected readonly status = signal<AiStatusResponse | null>(null);
  protected readonly children = signal<readonly ChildResponse[]>([]);
  protected readonly child = computed(() => this.children()[0] ?? null);
  protected readonly childName = computed(() => this.child()?.firstName ?? '');
  protected readonly includeChildContext = signal(false);

  protected readonly conversations = signal<readonly AiConversationSummary[]>([]);
  protected readonly conversation = signal<AiConversationDetailResponse | null>(null);
  protected readonly messages = signal<readonly AiMessageResponse[]>([]);
  protected readonly savedMessages = signal<readonly AiMessageResponse[]>([]);

  protected readonly loading = signal(true);
  protected readonly loadingSaved = signal(false);
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly draft = signal('');

  ngOnInit(): void {
    this.api.status().subscribe({
      next: (status) => this.status.set(status),
      error: () => {},
    });

    this.childrenApi.listChildren().subscribe({
      next: (children) => this.children.set(children),
      error: () => {},
    });

    this.loadConversations();
    this.loadSaved();
  }

  protected setTab(tab: AssistantTab): void {
    this.activeTab.set(tab);
    if (tab === 'saved') {
      this.loadSaved();
    }
  }

  private loadConversations(): void {
    this.api.listConversations().subscribe({
      next: (items) => {
        this.conversations.set(items);
        const first = items[0];
        if (first) {
          this.open(first.id);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private loadSaved(): void {
    this.loadingSaved.set(true);
    this.api.listSaved().subscribe({
      next: (items) => {
        this.savedMessages.set(items);
        this.loadingSaved.set(false);
      },
      error: () => this.loadingSaved.set(false),
    });
  }

  protected open(id: string): void {
    this.loading.set(true);
    this.api.getConversation(id).subscribe({
      next: (detail) => {
        this.conversation.set(detail);
        this.messages.set(detail.messages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.copy().unavailableError);
      },
    });
  }

  protected startNew(): void {
    this.conversation.set(null);
    this.messages.set([]);
    this.error.set(null);
  }

  protected ask(prompt: string): void {
    this.draft.set(prompt);
    this.send(prompt);
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  /** Enter sends; Shift+Enter is a newline, as in every other chat box. */
  protected onEnter(event: KeyboardEvent): void {
    if (event.shiftKey) return;
    event.preventDefault();
    const content = this.draft().trim();
    if (content) this.send(content);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const content = this.draft().trim();
    if (content) this.send(content);
  }

  private send(content: string): void {
    if (this.sending()) return;
    const current = this.conversation();
    if (!current) {
      this.startConversationAndSend(content);
      return;
    }

    this.sending.set(true);
    this.error.set(null);
    this.draft.set('');

    this.api.sendMessage(current.id, content).subscribe({
      next: (turn) => {
        this.messages.update((list) => [...list, turn.userMessage, turn.assistantMessage]);
        this.sending.set(false);
        this.refreshStatus();
      },
      error: (err) => {
        this.sending.set(false);
        this.error.set(err?.error?.error?.message ?? this.copy().messageSentError);
      },
    });
  }

  private startConversationAndSend(content: string): void {
    this.sending.set(true);
    this.error.set(null);
    this.draft.set('');

    const child = this.child();
    const childId = this.includeChildContext() && child ? child.id : undefined;

    this.api
      .createConversation({
        childId,
        language: this.i18n.currentLang() === 'km' ? 'km' : 'en',
        includeChildContext: this.includeChildContext(),
      })
      .subscribe({
        next: (summary) => {
          this.conversations.update((list) => [summary, ...list]);
          this.api.sendMessage(summary.id, content).subscribe({
            next: (turn) => {
              this.conversation.set({
                ...summary,
                messages: [turn.userMessage, turn.assistantMessage],
              });
              this.messages.set([turn.userMessage, turn.assistantMessage]);
              this.sending.set(false);
              this.refreshStatus();
            },
            error: (err) => {
              this.sending.set(false);
              this.error.set(err?.error?.error?.message ?? this.copy().messageSentError);
            },
          });
        },
        error: (err) => {
          this.sending.set(false);
          this.error.set(err?.error?.error?.message ?? this.copy().unavailableError);
        },
      });
  }

  protected toggleSave(message: AiMessageResponse): void {
    this.api.toggleSave(message.id).subscribe({
      next: (updated) => {
        this.messages.update((list) =>
          list.map((m) => (m.id === message.id ? { ...m, savedAt: updated.savedAt } : m)),
        );
        this.loadSaved();
      },
      error: () => {},
    });
  }

  protected unsave(item: AiMessageResponse): void {
    this.api.toggleSave(item.id).subscribe({
      next: () => {
        this.savedMessages.update((list) => list.filter((m) => m.id !== item.id));
        this.messages.update((list) =>
          list.map((m) => (m.id === item.id ? { ...m, savedAt: null } : m)),
        );
      },
      error: () => {},
    });
  }

  protected sendFeedback(message: AiMessageResponse, feedback: 'HELPFUL' | 'NOT_HELPFUL'): void {
    this.api.sendFeedback(message.id, feedback).subscribe({
      next: (updated) => {
        this.messages.update((list) =>
          list.map((m) => (m.id === message.id ? { ...m, feedback: updated.feedback } : m)),
        );
      },
      error: () => {},
    });
  }

  private refreshStatus(): void {
    this.api.status().subscribe({
      next: (status) => this.status.set(status),
      error: () => {},
    });
  }
}
