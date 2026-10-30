import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import type { ElementRef, OnInit } from '@angular/core';
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

type AssistantTab = 'chat' | 'saved';

const COPY = {
  en: {
    eyebrow: 'AI assistant',
    title: 'Ask anything',
    subtitle:
      'About your child, about autism, about what to do tonight. Answers are general guidance, never a diagnosis.',
    chatTab: 'Chat',
    savedTab: 'Saved answers',
    placeholder: 'Ask anything…',
    send: 'Send',
    sending: 'Thinking…',
    newConversation: 'New chat',
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
    childContextToggle: 'Consent to share limited child context',
    childContextHint:
      'Opt in to share only approximate age and recent observation count with the AI provider for replies. No name, notes, school records, or questionnaire results are sent.',
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
    copyResponse: 'Copy response',
    copiedResponse: 'Copied',
    copyError: 'This response could not be copied. Please select and copy it instead.',
    assistantRole: 'AutiCare Assistant',
    careSupportBadge: 'Care Guidance',
    nonDiagnosticTag: 'Non-diagnostic guidance',
    privacyNote:
      'Messages are stored in your AutiCare account until you delete the conversation. The latest 10 messages are sent to the configured AI provider as context. Child context is shared only when you opt in below; only approximate age and recent observation count are sent. Names, notes, school records, and questionnaire results are not sent.',
  },
  km: {
    eyebrow: 'ជំនួយការ AI',
    title: 'សួរសំណួរណាមួយ',
    subtitle:
      'អំពីកូនរបស់អ្នក អំពីអូទីសឹម អំពីអ្វីដែលត្រូវធ្វើនៅយប់នេះ។ ចម្លើយជាការណែនាំទូទៅ មិនមែនជាការវិនិច្ឆ័យរោគឡើយ។',
    chatTab: 'ការសន្ទនា',
    savedTab: 'ចម្លើយដែលបានរក្សាទុក',
    placeholder: 'សួរសំណួរណាមួយ…',
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
    childContextToggle: 'យល់ព្រមចែករំលែកព័ត៌មានកូនដែលមានកំណត់',
    childContextHint:
      'បើកការយល់ព្រម ដើម្បីចែករំលែកតែអាយុប្រហាក់ប្រហែល និងចំនួនកំណត់ត្រាសង្កេតថ្មីៗជាមួយអ្នកផ្តល់សេវា AI សម្រាប់ចម្លើយ។ មិនផ្ញើឈ្មោះ កំណត់ចំណាំ កំណត់ត្រាសាលា ឬលទ្ធផលសំណួរវាយតម្លៃទេ។',
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
    copyResponse: 'ចម្លងចម្លើយ',
    copiedResponse: 'បានចម្លង',
    copyError: 'មិនអាចចម្លងចម្លើយនេះបានទេ។ សូមជ្រើសរើស ហើយចម្លងវាដោយខ្លួនឯង។',
    assistantRole: 'ជំនួយការ AutiCare',
    careSupportBadge: 'ការណែនាំថែទាំ',
    nonDiagnosticTag: 'ការណែនាំមិនមែនរោគវិនិច្ឆ័យ',
    privacyNote:
      'សារត្រូវបានរក្សាទុកក្នុងគណនី AutiCare របស់អ្នក រហូតដល់អ្នកលុបការសន្ទនា។ សារចុងក្រោយចំនួន ១០ ត្រូវបានផ្ញើទៅអ្នកផ្តល់សេវា AI ដែលបានកំណត់ ដើម្បីធ្វើជាបរិបទ។ ព័ត៌មានកូនត្រូវបានចែករំលែកតែពេលអ្នកយល់ព្រមខាងក្រោមប៉ុណ្ណោះ ដោយផ្ញើតែអាយុប្រហាក់ប្រហែល និងចំនួនកំណត់ត្រាសង្កេតថ្មីៗ។ មិនផ្ញើឈ្មោះ កំណត់ចំណាំ កំណត់ត្រាសាលា ឬលទ្ធផលសំណួរវាយតម្លៃទេ។',
  },
};

@Component({
  selector: 'ac-ai-page',
  standalone: true,
  imports: [RouterLink, SlicePipe, UiSpinnerComponent],
  template: `
    <!-- Modern Minimalist Chat Topbar (Aligned with 1200px column) -->
    <header class="chat-header">
      <div class="chat-header-left">
        <span class="ai-spark-badge" aria-hidden="true">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
          </svg>
        </span>
        <span class="chat-header-title">AutiCare AI</span>
        @if (status()?.model; as model) {
          <span class="model-badge">{{ model }}</span>
        }
      </div>

      <div class="chat-header-right">
        <!-- Tab Switcher: Chat / Saved -->
        <div class="header-nav-pills" role="tablist">
          <button
            type="button"
            role="tab"
            class="nav-pill"
            [class.active]="activeTab() === 'chat'"
            [attr.aria-selected]="activeTab() === 'chat'"
            (click)="setTab('chat')"
            [attr.aria-label]="copy().chatTab"
            [title]="copy().chatTab"
          >
            <svg
              class="pill-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="pill-label">{{ copy().chatTab }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="nav-pill"
            [class.active]="activeTab() === 'saved'"
            [attr.aria-selected]="activeTab() === 'saved'"
            (click)="setTab('saved')"
            [attr.aria-label]="copy().savedTab"
            [title]="copy().savedTab"
          >
            <svg
              class="pill-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="pill-label">{{ copy().savedTab }}</span>
            <span class="pill-count">({{ savedMessages().length }})</span>
          </button>
        </div>

        @if (activeTab() === 'chat' && (conversation() || messages().length > 0)) {
          <button
            type="button"
            class="btn-new-chat"
            (click)="startNew()"
            [title]="copy().newConversation"
            [attr.aria-label]="copy().newConversation"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span class="btn-new-chat-text">{{ copy().newConversation }}</span>
          </button>
        }
      </div>
    </header>

    @if (activeTab() === 'saved') {
      <!-- Saved Answers View -->
      <section class="saved-viewport" aria-label="Saved Answers">
        <div class="saved-inner">
          <div class="saved-header-row">
            <h2>{{ copy().savedTab }}</h2>
            <button type="button" class="back-to-chat-btn" (click)="setTab('chat')">
              ← {{ copy().chatTab }}
            </button>
          </div>

          @if (loadingSaved()) {
            <div class="center-spinner">
              <ac-ui-spinner [label]="copy().sending" />
            </div>
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
                      {{ copy().savedAnswer }}
                    </button>
                  </div>
                  <p class="saved-content">{{ item.content }}</p>
                </article>
              }
            </div>
          }
        </div>
      </section>
    } @else {
      @if (status(); as state) {
        @if (!state.configured) {
          <div class="setup-wrapper">
            <section class="setup-card" role="status">
              <h2>{{ copy().notConfiguredTitle }}</h2>
              <p>{{ copy().notConfiguredBody }}</p>
            </section>
          </div>
        } @else {
          <!-- Chat Message Thread (Spacious, fills 1200px viewport) -->
          <main #thread class="chat-viewport" aria-live="polite">
            <div class="chat-viewport-inner">
              @if (loading()) {
                <div class="center-spinner">
                  <ac-ui-spinner [label]="copy().sending" />
                </div>
              } @else if (messages().length === 0) {
                <!-- Empty State Hero: ChatGPT / Gemini Style -->
                <div class="empty-chat-hero">
                  <div class="empty-hero-icon" aria-hidden="true">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
                    </svg>
                  </div>
                  <h1 class="empty-hero-title">{{ copy().title }}</h1>
                  <p class="empty-hero-subtitle">{{ copy().subtitle }}</p>

                  <div class="suggestions-grid">
                    @for (suggestion of copy().suggestions; track suggestion) {
                      <button
                        type="button"
                        class="suggestion-card"
                        [disabled]="sending()"
                        (click)="ask(suggestion)"
                      >
                        <span class="suggestion-text">{{ suggestion }}</span>
                        <span class="suggestion-arrow" aria-hidden="true">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </span>
                      </button>
                    }
                  </div>
                </div>
              } @else {
                <!-- Messages List -->
                <div class="messages-list">
                  @for (message of messages(); track message.id) {
                    @if (message.role === 'USER') {
                      <div class="message-row user-row">
                        <div class="user-bubble">
                          <p>{{ message.content }}</p>
                        </div>
                      </div>
                    } @else {
                      <div class="message-row assistant-row">
                        <div class="assistant-avatar" aria-hidden="true">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path
                              d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93"
                            />
                          </svg>
                        </div>
                        <div class="assistant-body">
                          <article class="assistant-card">
                            <header class="assistant-card-header">
                              <div class="assistant-name-group">
                                <span class="assistant-name">{{ copy().assistantRole }}</span>
                                <span class="assistant-badge">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                  </svg>
                                  {{ copy().careSupportBadge }}
                                </span>
                              </div>
                              @if (message.model || status()?.model) {
                                <span class="assistant-model-tag">
                                  {{ message.model || status()?.model }}
                                </span>
                              }
                            </header>

                            @if (message.kind === 'CRISIS') {
                              <div class="crisis-card" role="alert">
                                <div class="crisis-head">
                                  <svg
                                    class="crisis-icon"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                    ></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                  </svg>
                                  <p class="crisis-title">{{ copy().crisisTitle }}</p>
                                </div>
                                <a class="crisis-link" routerLink="/crisis">
                                  {{ copy().crisisLink }}
                                  <span aria-hidden="true">→</span>
                                </a>
                              </div>
                            }

                            <div
                              class="assistant-content prose-container"
                              [innerHTML]="formatResponseHtml(message.content)"
                            ></div>

                            @if (message.kind === 'MEDICATION') {
                              <div class="med-badge-row">
                                <span class="medication-badge">
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                  >
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                  </svg>
                                  {{ copy().medicationBadge }}
                                </span>
                              </div>
                            }

                            @if (message.sources.length > 0) {
                              <div class="sources-card">
                                <p class="sources-title">
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path
                                      d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                                    ></path>
                                  </svg>
                                  {{ copy().sources }}
                                </p>
                                <ul class="sources-list">
                                  @for (source of message.sources; track source.url) {
                                    <li>
                                      <a
                                        [href]="source.url"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="source-item-link"
                                      >
                                        <span>{{ source.title }}</span>
                                        <svg
                                          width="11"
                                          height="11"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          stroke-width="2"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                          aria-hidden="true"
                                        >
                                          <path
                                            d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                                          ></path>
                                          <polyline points="15 3 21 3 21 9"></polyline>
                                          <line x1="10" y1="14" x2="21" y2="3"></line>
                                        </svg>
                                      </a>
                                      <span class="publisher">· {{ source.publisher }}</span>
                                    </li>
                                  }
                                </ul>
                              </div>
                            }

                            @if (
                              message.relatedActivities && message.relatedActivities.length > 0
                            ) {
                              <div class="related-activities-section">
                                <p class="rel-title-label">
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                  </svg>
                                  {{ copy().relatedActivities }}
                                </p>
                                <div class="rel-grid">
                                  @for (act of message.relatedActivities; track act.id) {
                                    <div class="rel-card">
                                      <div class="rel-card-top">
                                        <span class="rel-cat">{{ act.category }}</span>
                                      </div>
                                      <h4 class="rel-name">{{ act.title }}</h4>
                                      @if (act.description) {
                                        <p class="rel-desc">{{ act.description }}</p>
                                      }
                                      <a routerLink="/activities" class="rel-link">
                                        {{ copy().viewActivity }}
                                        <span aria-hidden="true">→</span>
                                      </a>
                                    </div>
                                  }
                                </div>
                              </div>
                            }

                            <!-- Action Toolbar -->
                            <footer class="assistant-toolbar">
                              <div class="toolbar-primary-actions">
                                <button
                                  type="button"
                                  class="tool-btn copy-btn"
                                  [class.copied]="copiedMessageId() === message.id"
                                  (click)="copyResponse(message)"
                                  [attr.aria-label]="
                                    copiedMessageId() === message.id
                                      ? copy().copiedResponse
                                      : copy().copyResponse
                                  "
                                >
                                  @if (copiedMessageId() === message.id) {
                                    <svg
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2.5"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      aria-hidden="true"
                                    >
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  } @else {
                                    <svg
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      aria-hidden="true"
                                    >
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                      <path
                                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                      ></path>
                                    </svg>
                                  }
                                  <span>{{
                                    copiedMessageId() === message.id
                                      ? copy().copiedResponse
                                      : copy().copyResponse
                                  }}</span>
                                </button>

                                <button
                                  type="button"
                                  class="tool-btn bookmark-btn"
                                  [class.active]="!!message.savedAt"
                                  (click)="toggleSave(message)"
                                  [attr.aria-label]="
                                    message.savedAt ? copy().savedAnswer : copy().saveAnswer
                                  "
                                >
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    [attr.fill]="message.savedAt ? 'currentColor' : 'none'"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                                    ></path>
                                  </svg>
                                  <span>{{
                                    message.savedAt ? copy().savedAnswer : copy().saveAnswer
                                  }}</span>
                                </button>

                                <div
                                  class="feedback-cluster"
                                  role="group"
                                  [attr.aria-label]="copy().feedbackThanks"
                                >
                                  <button
                                    type="button"
                                    class="tool-btn icon-only"
                                    [class.active]="message.feedback === 'HELPFUL'"
                                    (click)="sendFeedback(message, 'HELPFUL')"
                                    [attr.aria-label]="copy().helpful"
                                    [title]="copy().helpful"
                                  >
                                    <svg
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      aria-hidden="true"
                                    >
                                      <path
                                        d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                                      ></path>
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    class="tool-btn icon-only"
                                    [class.active]="message.feedback === 'NOT_HELPFUL'"
                                    (click)="sendFeedback(message, 'NOT_HELPFUL')"
                                    [attr.aria-label]="copy().notHelpful"
                                    [title]="copy().notHelpful"
                                  >
                                    <svg
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      aria-hidden="true"
                                    >
                                      <path
                                        d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"
                                      ></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              <div class="toolbar-advisory-hint">
                                <span class="hint-pill">
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                  </svg>
                                  {{ copy().nonDiagnosticTag }}
                                </span>
                              </div>
                            </footer>
                          </article>
                        </div>
                      </div>
                    }
                  }

                  @if (sending()) {
                    <div class="message-row assistant-row typing-row">
                      <div class="assistant-avatar" aria-hidden="true">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
                        </svg>
                      </div>
                      <div class="typing-bubble">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="sr">{{ copy().sending }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </main>

          <!-- Modern Bottom Composer Bar (Aligned with 1200px column) -->
          <footer class="composer-container">
            @if (error()) {
              <div class="error-banner" role="alert">
                <span class="error-text">{{ error() }}</span>
                @if (draft().trim()) {
                  <button type="button" class="retry-btn" (click)="retry()">
                    {{ copy().retry }}
                  </button>
                }
              </div>
            }

            <form class="composer-box" (submit)="submit($event)">
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
              <button
                type="submit"
                class="send-btn"
                aria-label="Send message"
                [disabled]="sending() || draft().trim() === ''"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </button>
            </form>

            <p class="composer-disclaimer">
              {{ copy().disclaimer }}
              <span class="sr">{{ copy().privacyNote }}</span>
            </p>
          </footer>
        }
      }
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        background: transparent;
        box-sizing: border-box;
        position: relative;
        font-family: inherit;
      }

      /* ─── CHAT TOPBAR (Consistent 1200px width alignment) ─── */
      .chat-header {
        flex: 0 0 auto;
        height: 52px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0;
        border-bottom: 1px solid var(--ac-color-border);
        box-sizing: border-box;
        z-index: 10;
      }

      .chat-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ai-spark-badge {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-brand-100);
        color: var(--ac-color-action);
      }

      .chat-header-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        letter-spacing: -0.01em;
        white-space: nowrap;
      }

      .model-badge {
        font-size: 12px;
        font-weight: 600;
        color: var(--ac-color-action);
        background: color-mix(in srgb, var(--ac-color-action) 10%, transparent);
        padding: 3px 10px;
        border-radius: var(--ac-radius-pill);
        letter-spacing: 0.02em;
        white-space: nowrap;
      }

      .chat-header-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .header-nav-pills {
        display: inline-flex;
        align-items: center;
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        padding: 3px;
        gap: 3px;
      }

      .nav-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 16px;
        border-radius: var(--ac-radius-pill);
        border: none;
        background: transparent;
        color: var(--ac-color-text-muted);
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
      }

      .pill-icon {
        display: none;
      }

      .pill-label {
        display: inline;
        white-space: nowrap;
      }

      .pill-count {
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }

      .nav-pill:hover {
        color: var(--ac-color-text-strong);
      }

      .nav-pill.active {
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        box-shadow: 0 1px 3px color-mix(in srgb, var(--ac-color-black) 8%, transparent);
      }

      .btn-new-chat {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 16px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .btn-new-chat-text {
        white-space: nowrap;
      }

      .btn-new-chat:hover {
        background: var(--ac-brand-50);
        border-color: var(--ac-color-action);
        color: var(--ac-color-action);
      }

      /* ─── CHAT VIEWPORT (Spacious, consistent 1200px width) ─── */
      .chat-viewport {
        flex: 1 1 0%;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 20px 0 16px;
        box-sizing: border-box;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--ac-color-text-muted) 35%, transparent) transparent;
      }

      .chat-viewport::-webkit-scrollbar {
        width: 6px;
      }

      .chat-viewport::-webkit-scrollbar-thumb {
        border-radius: var(--ac-radius-pill);
        background: color-mix(in srgb, var(--ac-color-text-muted) 35%, transparent);
      }

      .chat-viewport-inner {
        width: 100%;
        max-width: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }

      .center-spinner {
        display: grid;
        place-items: center;
        padding: 60px 20px;
        margin: auto;
      }

      /* ─── EMPTY STATE (Matching typography and scale of other pages) ─── */
      .empty-chat-hero {
        margin: auto 0;
        padding: 32px 0 24px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }

      .empty-hero-icon {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        background: linear-gradient(135deg, var(--ac-brand-100), var(--ac-brand-200));
        color: var(--ac-color-action);
        display: grid;
        place-items: center;
        margin-bottom: 16px;
        box-shadow: 0 4px 14px color-mix(in srgb, var(--ac-color-action) 15%, transparent);
      }

      .empty-hero-title {
        margin: 0 0 8px;
        font-size: var(--ac-type-page-title);
        font-weight: 800;
        color: var(--ac-color-text-strong);
        letter-spacing: -0.02em;
        line-height: var(--ac-line-tight);
      }

      .empty-hero-subtitle {
        margin: 0 0 28px;
        max-width: 680px;
        font-size: var(--ac-type-page-subtitle);
        color: var(--ac-color-text-muted);
        line-height: var(--ac-line-body);
      }

      .suggestions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 12px;
        width: 100%;
        text-align: left;
      }

      .suggestion-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 20px;
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 15.5px;
        line-height: 1.5;
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: 0 1px 3px color-mix(in srgb, var(--ac-color-black) 3%, transparent);
      }

      .suggestion-card:hover:not(:disabled) {
        border-color: var(--ac-color-action);
        background: var(--ac-brand-50);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--ac-color-action) 10%, transparent);
      }

      .suggestion-card:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .suggestion-arrow {
        color: var(--ac-color-action);
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      /* ─── MESSAGES LIST ─── */
      .messages-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 100%;
        margin-top: auto;
      }

      .message-row {
        display: flex;
        width: 100%;
      }

      /* User Message (Right-aligned bubble, comfortable 16px font size) */
      .user-row {
        justify-content: flex-end;
      }

      .user-bubble {
        max-width: min(85%, 760px);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-radius: 20px 20px 4px 20px;
        padding: 14px 20px;
        font-size: 16px;
        line-height: 1.6;
        word-break: break-word;
        box-shadow: 0 1px 2px color-mix(in srgb, var(--ac-color-black) 6%, transparent);
      }

      .user-bubble p {
        margin: 0;
      }

      /* Assistant Message (Modern Elevated Card, Line-height 1.7) */
      .assistant-row {
        justify-content: flex-start;
        align-items: flex-start;
        gap: 14px;
        width: 100%;
      }

      .assistant-avatar {
        width: 36px;
        height: 36px;
        border-radius: var(--ac-radius-pill);
        background: linear-gradient(135deg, var(--ac-brand-50), var(--ac-brand-100));
        border: 1.5px solid var(--ac-brand-200);
        color: var(--ac-color-action);
        display: grid;
        place-items: center;
        flex-shrink: 0;
        margin-top: 2px;
        box-shadow: 0 2px 6px color-mix(in srgb, var(--ac-color-action) 12%, transparent);
      }

      .assistant-body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      /* Elevated Assistant Response Card */
      .assistant-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: 18px;
        border-top-left-radius: 4px;
        padding: 20px 24px;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ac-color-border) 45%, transparent);
        max-width: min(840px, 100%);
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 14px;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }

      .assistant-card:hover {
        border-color: color-mix(in srgb, var(--ac-color-action) 25%, var(--ac-color-border));
      }

      /* Card Header */
      .assistant-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding-bottom: 12px;
        border-bottom: 1px solid
          var(--ac-color-border-subtle, color-mix(in srgb, var(--ac-color-border) 60%, transparent));
        flex-wrap: wrap;
      }

      .assistant-name-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .assistant-name {
        font-size: 14.5px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        letter-spacing: -0.01em;
      }

      .assistant-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-brand-50);
        border: 1px solid var(--ac-brand-200);
        color: var(--ac-color-action);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .assistant-model-tag {
        font-size: 11.5px;
        font-weight: 500;
        color: var(--ac-color-text-muted);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        padding: 2px 8px;
        font-family: inherit;
      }

      /* Structured Prose Content */
      .assistant-content {
        font-size: 15.5px;
        line-height: 1.7;
        color: var(--ac-color-text-strong);
        word-break: break-word;
      }

      .assistant-content .response-p {
        margin: 0 0 14px 0;
      }

      .assistant-content .response-p:last-child {
        margin-bottom: 0;
      }

      .assistant-content strong {
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .assistant-content code {
        font-family: monospace;
        font-size: 13.5px;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border);
        color: var(--ac-color-action);
      }

      /* Bullet List Styling */
      .assistant-content .response-list {
        margin: 8px 0 14px 0;
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .assistant-content .response-list li {
        position: relative;
        padding-left: 4px;
        line-height: 1.65;
      }

      .assistant-content .response-list li::marker {
        color: var(--ac-color-action);
      }

      /* Numbered List Styling */
      .assistant-content .response-numbered-list {
        margin: 8px 0 14px 0;
        padding-left: 22px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .assistant-content .response-numbered-list li {
        padding-left: 4px;
        line-height: 1.65;
      }

      .assistant-content .response-numbered-list li::marker {
        font-weight: 700;
        color: var(--ac-color-action);
      }

      /* Clinical Advisory Callout inside Content */
      .advisory-callout {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
        margin: 12px 0;
        border-radius: var(--ac-radius-md);
        background: color-mix(in srgb, var(--ac-color-action) 6%, var(--ac-color-surface));
        border: 1px solid color-mix(in srgb, var(--ac-color-action) 20%, transparent);
        border-left: 3px solid var(--ac-color-action);
      }

      .advisory-icon {
        color: var(--ac-color-action);
        flex-shrink: 0;
        display: grid;
        place-items: center;
        margin-top: 2px;
      }

      .advisory-body {
        margin: 0;
        font-size: 14px;
        line-height: 1.55;
        color: var(--ac-color-text-strong);
      }

      /* Crisis Alert */
      .crisis-card {
        background: color-mix(in srgb, var(--ac-color-alert-strong) 8%, var(--ac-color-surface));
        border: 1px solid var(--ac-color-alert-strong);
        border-left: 4px solid var(--ac-color-alert-strong);
        border-radius: var(--ac-radius-sm);
        padding: 14px 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .crisis-head {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .crisis-icon {
        color: var(--ac-color-alert-text);
        flex-shrink: 0;
      }

      .crisis-title {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        color: var(--ac-color-alert-text);
      }

      .crisis-link {
        font-size: 14px;
        font-weight: 700;
        color: var(--ac-color-alert-text);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .crisis-link:hover {
        text-decoration: underline;
      }

      /* Medication Badge */
      .med-badge-row {
        margin-top: 2px;
      }

      .medication-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border);
        font-size: var(--ac-type-meta);
        font-weight: 500;
        color: var(--ac-color-text-muted);
      }

      /* Sources */
      .sources-card {
        padding: 12px 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border);
        font-size: 13.5px;
      }

      .sources-title {
        margin: 0 0 8px;
        font-weight: 700;
        color: var(--ac-color-text-muted);
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.05em;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .sources-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .source-item-link {
        color: var(--ac-color-action);
        text-decoration: none;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .source-item-link:hover {
        text-decoration: underline;
      }

      .publisher {
        color: var(--ac-color-text-muted);
        margin-left: 6px;
        font-size: 12.5px;
      }

      /* Related Activities */
      .related-activities-section {
        margin-top: 4px;
      }

      .rel-title-label {
        margin: 0 0 10px;
        font-size: 12.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-muted);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .rel-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 12px;
      }

      .rel-card {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-slate);
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        transition:
          border-color 0.15s ease,
          background 0.15s ease;
      }

      .rel-card:hover {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface);
      }

      .rel-cat {
        font-size: 11.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--ac-color-action);
      }

      .rel-name {
        margin: 0;
        font-size: 14.5px;
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }

      .rel-desc {
        margin: 0;
        font-size: 13.5px;
        color: var(--ac-color-text-muted);
        line-height: 1.45;
      }

      .rel-link {
        margin-top: 6px;
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-action);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .rel-link:hover {
        text-decoration: underline;
      }

      /* Modern Action Toolbar */
      .assistant-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding-top: 14px;
        border-top: 1px solid
          var(--ac-color-border-subtle, color-mix(in srgb, var(--ac-color-border) 60%, transparent));
        flex-wrap: wrap;
      }

      .toolbar-primary-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .tool-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-muted);
        font: inherit;
        font-size: 12.5px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .tool-btn:hover {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        border-color: color-mix(in srgb, var(--ac-color-action) 35%, var(--ac-color-border));
      }

      .tool-btn.active {
        background: var(--ac-brand-50);
        border-color: var(--ac-color-action);
        color: var(--ac-color-action);
        font-weight: 600;
      }

      .tool-btn.copied {
        background: color-mix(in srgb, var(--ac-color-action) 12%, var(--ac-color-surface));
        border-color: var(--ac-color-action);
        color: var(--ac-color-action);
        font-weight: 600;
      }

      .tool-btn.icon-only {
        padding: 5px 8px;
      }

      .feedback-cluster {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: 2px;
        padding-left: 6px;
        border-left: 1px solid var(--ac-color-border);
      }

      .toolbar-advisory-hint {
        display: flex;
        align-items: center;
      }

      .hint-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11.5px;
        color: var(--ac-color-text-muted);
        padding: 2px 6px;
      }

      /* Typing indicator */
      .typing-row {
        align-items: flex-start;
      }

      .typing-bubble {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: 16px;
        border-top-left-radius: 4px;
        padding: 12px 18px;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 6px color-mix(in srgb, var(--ac-color-border) 40%, transparent);
      }

      .typing-dot {
        width: 7px;
        height: 7px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-action);
        opacity: 0.4;
        animation: typingBounce 1.4s infinite ease-in-out both;
      }

      .typing-dot:nth-child(1) {
        animation-delay: -0.32s;
      }
      .typing-dot:nth-child(2) {
        animation-delay: -0.16s;
      }
      .typing-dot:nth-child(3) {
        animation-delay: 0s;
      }

      @keyframes typingBounce {
        0%,
        80%,
        100% {
          transform: scale(0.6);
          opacity: 0.35;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }

      /* ─── COMPOSER BAR (Consistent width aligned with 1200px) ─── */
      .composer-container {
        flex: 0 0 auto;
        width: 100%;
        padding: 8px 0 16px;
        background: linear-gradient(180deg, transparent 0%, var(--ac-color-tint-blue-faint) 35%);
        box-sizing: border-box;
        z-index: 5;
      }

      .error-banner {
        width: 100%;
        margin: 0 auto 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 14px;
        border-radius: var(--ac-radius-md);
        background: color-mix(in srgb, var(--ac-color-alert-strong) 10%, var(--ac-color-surface));
        border: 1px solid var(--ac-color-alert-strong);
        color: var(--ac-color-alert-text);
        font-size: 14px;
        box-sizing: border-box;
      }

      .retry-btn {
        padding: 4px 12px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-alert-strong);
        background: var(--ac-color-surface);
        color: var(--ac-color-alert-text);
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }

      .composer-box {
        width: 100%;
        display: flex;
        align-items: flex-end;
        gap: 12px;
        padding: 10px 12px 10px 20px;
        border-radius: 28px;
        border: 1.5px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        box-shadow: 0 3px 14px color-mix(in srgb, var(--ac-color-black) 4%, transparent);
        box-sizing: border-box;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }

      .composer-box:focus-within {
        border-color: var(--ac-color-action);
        box-shadow: 0 4px 20px color-mix(in srgb, var(--ac-color-action) 12%, transparent);
      }

      .composer-box textarea {
        flex: 1;
        padding: 6px 0;
        border: none;
        outline: none;
        background: transparent;
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: 16px;
        line-height: 1.55;
        resize: none;
        min-height: 26px;
        max-height: 160px;
      }

      .send-btn {
        width: 38px;
        height: 38px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border: none;
        display: grid;
        place-items: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.15s ease;
      }

      .send-btn:hover:not(:disabled) {
        background: var(--ac-color-action-mid);
        transform: scale(1.04);
      }

      .send-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }

      .composer-disclaimer {
        margin: 8px auto 0;
        width: 100%;
        font-size: 13px;
        color: var(--ac-color-text-muted);
        text-align: center;
      }

      /* ─── SAVED VIEWPORT ─── */
      .saved-viewport {
        flex: 1 1 0%;
        overflow-y: auto;
        padding: 20px 0;
        box-sizing: border-box;
      }

      .saved-inner {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .saved-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .saved-header-row h2 {
        margin: 0;
        font-size: var(--ac-type-card-title);
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .back-to-chat-btn {
        padding: 6px 14px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-action);
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }

      .saved-empty {
        padding: 48px 20px;
        text-align: center;
        border: 1.5px dashed var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
      }

      .saved-empty h3 {
        margin: 0 0 6px;
        color: var(--ac-color-text-strong);
      }

      .saved-empty p {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: 15.5px;
      }

      .saved-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .saved-card {
        padding: 16px 18px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: 0 1px 3px color-mix(in srgb, var(--ac-color-black) 3%, transparent);
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
        padding: 4px 12px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-action);
        background: color-mix(in srgb, var(--ac-color-action) 10%, transparent);
        color: var(--ac-color-action);
        font: inherit;
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
      }

      .saved-content {
        margin: 0;
        color: var(--ac-color-text-strong);
        line-height: 1.65;
        font-size: 16px;
        white-space: pre-wrap;
      }

      /* ─── SETUP STATE ─── */
      .setup-wrapper {
        flex: 1;
        display: grid;
        place-items: center;
        padding: 24px 0;
      }

      .setup-card {
        max-width: 480px;
        padding: 28px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        text-align: center;
      }

      .setup-card h2 {
        margin: 0 0 10px;
        font-size: 20px;
        color: var(--ac-color-text-strong);
      }

      .setup-card p {
        margin: 0;
        font-size: 15.5px;
        color: var(--ac-color-text-muted);
        line-height: 1.5;
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

      /* ─── MOBILE RESPONSIVE ADAPTATIONS ─── */
      @media (max-width: 860px) {
        :host {
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          bottom: calc(68px + max(env(safe-area-inset-bottom, 0px), 8px));
          width: 100vw;
          height: auto;
          z-index: 20;
          padding: 0 16px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--ac-color-tint-blue-faint);
        }

        .chat-header {
          height: 48px;
          max-width: 1200px;
          margin: 0 auto;
          white-space: nowrap;
        }

        .model-badge {
          display: none;
        }

        .pill-icon {
          display: inline-block;
        }

        .pill-label {
          display: none;
        }

        .pill-count {
          font-size: 11px;
        }

        .btn-new-chat-text {
          display: none;
        }

        .btn-new-chat {
          width: 34px;
          height: 34px;
          padding: 0;
          border-radius: var(--ac-radius-pill);
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .nav-pill {
          padding: 6px 10px;
          font-size: 12px;
          gap: 4px;
        }

        .chat-viewport {
          padding: 10px 0 6px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .composer-container {
          padding: 4px 0 6px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          background: var(--ac-color-tint-blue-faint);
        }

        .composer-box {
          padding: 6px 8px 6px 14px;
          border-radius: 22px;
          gap: 8px;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--ac-color-black) 6%, transparent);
        }

        .composer-box textarea {
          font-size: 14.5px;
          min-height: 22px;
          max-height: 80px;
          line-height: 1.4;
          padding: 4px 0;
        }

        .send-btn {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
        }

        .composer-disclaimer {
          font-size: 11px;
          margin: 3px auto 0;
          line-height: 1.3;
        }

        .empty-chat-hero {
          padding: 16px 0 12px;
        }

        .empty-hero-icon {
          width: 40px;
          height: 40px;
          margin-bottom: 10px;
          border-radius: 10px;
        }

        .empty-hero-title {
          font-size: 1.3rem;
          margin-bottom: 4px;
        }

        .empty-hero-subtitle {
          font-size: 13.5px;
          margin-bottom: 14px;
        }

        .suggestions-grid {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .suggestion-card {
          padding: 11px 14px;
          font-size: 13.5px;
        }

        .messages-list {
          gap: 12px;
        }

        .user-bubble {
          max-width: 90%;
          padding: 10px 14px;
          font-size: 14.5px;
          line-height: 1.5;
          border-radius: 16px 16px 4px 16px;
        }

        .assistant-row {
          gap: 10px;
        }

        .assistant-avatar {
          width: 28px;
          height: 28px;
        }

        .assistant-card {
          padding: 14px 16px;
          border-radius: 14px;
          border-top-left-radius: 4px;
          gap: 12px;
        }

        .assistant-card-header {
          padding-bottom: 8px;
        }

        .assistant-name {
          font-size: 13.5px;
        }

        .assistant-content {
          font-size: 14.5px;
          line-height: 1.6;
        }

        .assistant-content .response-p {
          margin-bottom: 10px;
        }

        .crisis-card {
          padding: 10px 12px;
        }

        .sources-card {
          padding: 10px 12px;
          font-size: 13px;
        }

        .rel-grid {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .rel-card {
          padding: 10px 12px;
        }

        .assistant-toolbar {
          padding-top: 10px;
          gap: 8px;
        }

        .tool-btn {
          padding: 4px 10px;
          font-size: 12px;
        }

        .toolbar-advisory-hint {
          display: none;
        }

        .saved-header-row h2 {
          font-size: 16px;
        }

        .saved-card {
          padding: 12px 14px;
        }

        .saved-content {
          font-size: 14.5px;
        }
      }

      @media (max-width: 480px) {
        :host {
          padding: 0 10px;
        }

        .chat-header-title {
          font-size: 14px;
        }

        .nav-pill {
          padding: 5px 8px;
        }

        .composer-box {
          padding: 6px 6px 6px 12px;
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
  @ViewChild('thread') private threadElement?: ElementRef<HTMLElement>;

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
  protected readonly copiedMessageId = signal<string | null>(null);

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
    this.includeChildContext.set(false);
    this.api.getConversation(id).subscribe({
      next: (detail) => {
        this.conversation.set(detail);
        this.messages.set(detail.messages);
        this.loading.set(false);
        this.scrollToLatest();
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
    this.draft.set('');
    this.includeChildContext.set(false);
    this.error.set(null);
  }

  protected clearConversation(): void {
    const current = this.conversation();
    if (!current || this.sending()) return;
    this.api.deleteConversation(current.id).subscribe({
      next: () => {
        this.conversations.update((list) => list.filter((item) => item.id !== current.id));
        this.conversation.set(null);
        this.messages.set([]);
        this.draft.set('');
        this.includeChildContext.set(false);
        this.error.set(null);
      },
      error: () => this.error.set(this.copy().unavailableError),
    });
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

    this.api.sendMessage(current.id, content, this.messageOptions()).subscribe({
      next: (turn) => {
        this.messages.update((list) => [...list, turn.userMessage, turn.assistantMessage]);
        this.sending.set(false);
        this.draft.set('');
        this.refreshStatus();
        this.scrollToLatest();
      },
      error: (err) => {
        this.sending.set(false);
        this.error.set(this.sendError(err));
      },
    });
  }

  private startConversationAndSend(content: string): void {
    this.sending.set(true);
    this.error.set(null);

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
          this.conversation.set({ ...summary, messages: [] });
          this.api.sendMessage(summary.id, content, this.messageOptions()).subscribe({
            next: (turn) => {
              this.conversation.set({
                ...summary,
                messages: [turn.userMessage, turn.assistantMessage],
              });
              this.messages.set([turn.userMessage, turn.assistantMessage]);
              this.sending.set(false);
              this.draft.set('');
              this.refreshStatus();
              this.scrollToLatest();
            },
            error: (err) => {
              this.sending.set(false);
              this.error.set(this.sendError(err));
            },
          });
        },
        error: (err) => {
          this.sending.set(false);
          this.error.set(err?.error?.error?.message ?? this.copy().unavailableError);
        },
      });
  }

  private messageOptions() {
    const child = this.child();
    const includeChildContext = this.includeChildContext() && !!child;
    return {
      language: this.i18n.currentLang() === 'km' ? ('km' as const) : ('en' as const),
      includeChildContext,
      ...(includeChildContext && child ? { childId: child.id } : {}),
    };
  }

  private sendError(error: { status?: number; error?: { error?: { message?: string } } }): string {
    if (error.status === 429) return this.copy().limitError;
    if (!error.status || error.status === 502 || error.status === 503 || error.status >= 500) {
      return this.copy().unavailableError;
    }
    return error.error?.error?.message ?? this.copy().messageSentError;
  }

  protected retry(): void {
    const content = this.draft().trim();
    if (!content || this.sending()) return;
    this.send(content);
  }

  protected async copyResponse(message: AiMessageResponse): Promise<void> {
    try {
      await navigator.clipboard.writeText(message.content);
      this.copiedMessageId.set(message.id);
      window.setTimeout(() => {
        if (this.copiedMessageId() === message.id) this.copiedMessageId.set(null);
      }, 1800);
    } catch {
      this.error.set(this.copy().copyError);
    }
  }

  /** Formats assistant raw text into professional structured HTML with safe escaping */
  protected formatResponseHtml(content: string): string {
    if (!content) return '';
    const text = content.replace(/\r\n/g, '\n').trim();
    const blocks = text.split(/\n\s*\n/);

    return blocks
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return '';

        // Check if paragraph is a clinical disclaimer / advisory notice
        const isDisclaimer =
          /(?:not a (?:doctor|diagnosis)|can(?:'t|not) diagnose|qualified clinician|general guidance|AutiCare does not diagnose|មិនធ្វើរោគវិនិច្ឆ័យ|គ្លីនិកជំនាញ)/i.test(
            trimmed,
          ) && trimmed.length < 360;

        const lines = trimmed
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        // Entire block is bullet list
        if (lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l))) {
          const items = lines
            .map((l) => `<li>${this.formatInline(l.replace(/^[-*•]\s+/, ''))}</li>`)
            .join('');
          return `<ul class="response-list">${items}</ul>`;
        }

        // Entire block is numbered list
        if (lines.length > 0 && lines.every((l) => /^\d+[.)]\s+/.test(l))) {
          const items = lines
            .map((l) => `<li>${this.formatInline(l.replace(/^\d+[.)]\s+/, ''))}</li>`)
            .join('');
          return `<ol class="response-numbered-list">${items}</ol>`;
        }

        // Text followed by bullet points
        const bulletIdx = lines.findIndex((l) => /^[-*•]\s+/.test(l));
        if (bulletIdx > 0) {
          const intro = lines.slice(0, bulletIdx).join(' ');
          const listLines = lines.slice(bulletIdx);
          if (listLines.every((l) => /^[-*•]\s+/.test(l))) {
            const introHtml = `<p class="response-p">${this.formatInline(intro)}</p>`;
            const items = listLines
              .map((l) => `<li>${this.formatInline(l.replace(/^[-*•]\s+/, ''))}</li>`)
              .join('');
            return `${introHtml}<ul class="response-list">${items}</ul>`;
          }
        }

        const formattedBody = this.formatInline(trimmed).replace(/\n/g, '<br/>');

        if (isDisclaimer) {
          return `
            <div class="advisory-callout" role="note">
              <span class="advisory-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
              <p class="advisory-body">${formattedBody}</p>
            </div>
          `;
        }

        return `<p class="response-p">${formattedBody}</p>`;
      })
      .filter(Boolean)
      .join('');
  }

  private formatInline(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  private scrollToLatest(): void {
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => {
      const thread = this.threadElement?.nativeElement;
      if (thread) thread.scrollTop = thread.scrollHeight;
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
