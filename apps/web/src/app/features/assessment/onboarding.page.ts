import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import type {
  ChildResponse,
  ScreeningQuestionResponse,
  ScreeningSessionDetailResponse,
} from '@auticare/contracts';
import type { Observable } from 'rxjs';
import { forkJoin, of, switchMap } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { ScreeningAnswerScaleComponent } from '../screening/components/screening-answer-scale.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { OnboardingState } from './onboarding-state';

type Step = 'child' | 'intro' | 'questions' | 'result';

/**
 * Copy is held here, in both languages, rather than inline in the template.
 *
 * Two reasons: this screen is the first thing a parent ever reads, so the wording
 * needs to be reviewable as a whole rather than scattered through markup; and the
 * Khmer is written natively — not translated at display time — because a
 * transliterated sentence reads as machine output to a Khmer speaker.
 */
const COPY = {
  en: {
    brand: 'AutiCare',
    privacy: 'Private to your family',
    child: {
      eyebrow: 'Getting started',
      title: 'Who are we supporting?',
      subtitle:
        'We need only enough to pick the right questions. You can add a photo and more detail later.',
      firstName: 'First name',
      firstNamePlaceholder: 'e.g. Sokha',
      dob: 'Date of birth',
      notes: 'Anything you have noticed (optional)',
      notesPlaceholder: 'e.g. He is not pointing at things yet.',
      submit: 'Continue',
      nameError: 'Enter a first name.',
      dobError: 'Enter a date of birth.',
      age: (years: number, months: number) =>
        years >= 1 ? `${years} years ${months} months old` : `${months} months old`,
    },
    intro: {
      eyebrow: (name: string) => `${name}'s first check-in`,
      title: 'A few questions. About three minutes.',
      body: 'Ten short questions about what you see day to day. There are no right answers, and you can go back to change one.',
      points: [
        'Ten questions, roughly three minutes',
        'Answer for the last few weeks, not only today',
        'You can answer again or skip and come back later',
      ],
      notice:
        'This gives you an indication of concern. It is not a diagnosis — only a qualified clinician can diagnose autism.',
      start: 'Start',
      skip: 'Skip for now',
    },
    questions: {
      progress: (current: number, total: number) => `Question ${current} of ${total}`,
      back: 'Back',
      next: 'Next',
      finish: 'See result',
      working: 'Working…',
      hint: 'Think about the last few weeks.',
    },
    result: {
      eyebrow: 'What your answers suggest',
      band: 'Concern band',
      areas: 'The areas we asked about',
      bands: {
        LOW: {
          label: 'Low',
          headline: 'Nothing here stands out right now',
          meaning:
            'Most of what you described fits what is usual for a child this age. That is genuinely reassuring — and it is still worth keeping an eye on the things that made you look.',
          steps: [
            'Keep playing, talking and reading together',
            'Come back to the full screening if something changes',
          ],
        },
        MODERATE: {
          label: 'Moderate',
          headline: 'A few areas are worth watching',
          meaning:
            'Some of what you described is not unusual on its own, but a few areas came up often enough to be worth paying attention to. This is common, and it is not a verdict.',
          steps: [
            'Try a few age-appropriate activities at home over the next few weeks',
            'Record what you notice, so a pattern can appear',
            'Consider booking an appointment so a professional can look properly',
          ],
        },
        HIGH: {
          label: 'Elevated',
          headline: 'Several areas are worth a professional look',
          meaning:
            'A number of the things you described came up often. That does not mean your child is autistic — it means a professional should see them rather than waiting to find out. Booking early is the single most useful thing you can do.',
          steps: [
            'Book an appointment with a paediatric or developmental specialist',
            'Keep a short record of what you notice, to take with you',
            'Try the suggested activities while you wait',
          ],
        },
      },
      disclaimer:
        'These questions are a screening indicator, not a diagnosis. Only a qualified clinician can diagnose autism.',
      dashboard: 'Go to my dashboard',
      specialist: 'Find a specialist',
      activities: 'Try an activity',
      retake: 'Answer again',
      scoreCaption: (percent: number) => `${percent}% of the possible concern points`,
    },
    errors: {
      load: 'We could not start the questions. Please try again.',
      submit: 'Your answers could not be saved. Please try again.',
      child: 'The child profile could not be saved. Please try again.',
    },
  },
  km: {
    brand: 'AutiCare',
    privacy: 'ឯកជនសម្រាប់គ្រួសារអ្នក',
    child: {
      eyebrow: 'ចាប់ផ្តើម',
      title: 'តើយើងកំពុងជួយកុមារណា?',
      subtitle:
        'យើងត្រូវការតែព័ត៌មានចាំបាច់ ដើម្បីជ្រើសសំណួរត្រឹមត្រូវ។ អ្នកអាចបន្ថែមរូបថ្លុក និងព័ត៌មានបន្ថែមនៅពេលក្រោយ។',
      firstName: 'នាមខ្លួន',
      firstNamePlaceholder: 'ឧ. សុខា',
      dob: 'ថ្ងៃខែឆ្នាំកំណើត',
      notes: 'អ្វីដែលអ្នកបានសង្កេតឃើញ (មិនចាំបាច់)',
      notesPlaceholder: 'ឧ. គាត់មិនទាន់ចង្អុលបង្ហាញអ្វីទេ។',
      submit: 'បន្ត',
      nameError: 'សូមបញ្ចូលនាមខ្លួន។',
      dobError: 'សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើត។',
      age: (years: number, months: number) =>
        years >= 1 ? `អាយុ ${years} ឆ្នាំ ${months} ខែ` : `អាយុ ${months} ខែ`,
    },
    intro: {
      eyebrow: (name: string) => `ការពិនិត្យដំបូងរបស់ ${name}`,
      title: 'សំណួរពីរបី។ ប្រហែលបីនាទី។',
      body: 'សំណួរខ្លីៗដប់ អំពីអ្វីដែលអ្នកឃើញជារៀងរាល់ថ្ងៃ។ គ្មានចម្លើយត្រូវ ឬខុសទេ ហើយអ្នកអាចត្រឡប់ក្រោយដើម្បីកែបាន។',
      points: [
        'សំណួរដប់ ប្រហែលបីនាទី',
        'ឆ្លើយសម្រាប់រយៈពេលប៉ុន្មានសប្តាហ៍ចុងក្រោយ មិនមែនតែថ្ងៃនេះទេ',
        'អ្នកអាចឆ្លើយម្តងទៀត ឬរំលង ហើយត្រឡប់មកវិញនៅពេលក្រោយ',
      ],
      notice:
        'នេះជាការបង្ហាញពីកម្រិតនៃការព្រួយបារម្ភ។ វាមិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ — មានតែគ្រូពេទ្យជំនាញប៉ុណ្ណោះដែលអាចធ្វើរោគវិនិច្ឆ័យអូទីសឹមបាន។',
      start: 'ចាប់ផ្តើម',
      skip: 'រំលងសិន',
    },
    questions: {
      progress: (current: number, total: number) => `សំណួរ ${current} នៃ ${total}`,
      back: 'ត្រឡប់',
      next: 'បន្ទាប់',
      finish: 'មើលលទ្ធផល',
      working: 'កំពុងរក្សាទុក…',
      hint: 'សូមគិតអំពីប៉ុន្មានសប្តាហ៍ចុងក្រោយ។',
    },
    result: {
      eyebrow: 'អ្វីដែលចម្លើយរបស់អ្នកបង្ហាញ',
      band: 'កម្រិតនៃការព្រួយបារម្ភ',
      areas: 'ផ្នែកដែលយើងបានសួរ',
      bands: {
        LOW: {
          label: 'ទាប',
          headline: 'មិនមានអ្វីគួរឱ្យបារម្ភនៅពេលនេះទេ',
          meaning:
            'ភាគច្រើននៃអ្វីដែលអ្នកបានពិពណ៌នា គឺធម្មតាសម្រាប់កុមារអាយុនេះ។ នេះជាដំណឹងល្អ — ប៉ុន្តែនៅតែមានតម្លៃក្នុងការតាមដានអ្វីដែលធ្វើឱ្យអ្នកបារម្ភ។',
          steps: [
            'បន្តលេង និយាយ និងអានជាមួយគ្នា',
            'ត្រឡប់មកធ្វើការវាយតម្លៃពេញលេញវិញ ប្រសិនបើមានអ្វីផ្លាស់ប្តូរ',
          ],
        },
        MODERATE: {
          label: 'មធ្យម',
          headline: 'មានផ្នែកខ្លះគួរតាមដាន',
          meaning:
            'អ្វីដែលអ្នកបានពិពណ៌នាខ្លះ មិនមែនជារឿងចម្លែកដោយខ្លួនឯងទេ ប៉ុន្តែមានផ្នែកខ្លះកើតឡើងញឹកញាប់គ្រប់គ្រាន់ដើម្បីគួរយកចិត្តទុកដាក់។ រឿងនេះជារឿងធម្មតា ហើយវាមិនមែនជាសេចក្តីសម្រេចទេ។',
          steps: [
            'សាកល្បងសកម្មភាពសមស្របតាមអាយុនៅផ្ទះ ក្នុងរយៈពេលប៉ុន្មានសប្តាហ៍ខាងមុខ',
            'កត់ត្រាអ្វីដែលអ្នកសង្កេតឃើញ ដើម្បីឱ្យគំរូមួយលេចឡើង',
            'ពិចារណាកក់ណាត់ជួប ដើម្បីឱ្យអ្នកជំនាញពិនិត្យបានត្រឹមត្រូវ',
          ],
        },
        HIGH: {
          label: 'ខ្ពស់',
          headline: 'មានផ្នែកជាច្រើនគួរឱ្យអ្នកជំនាញពិនិត្យ',
          meaning:
            'អ្វីដែលអ្នកបានពិពណ៌នាជាច្រើនបានកើតឡើងញឹកញាប់។ នេះមិនមានន័យថាកូនអ្នកមានអូទីសឹមទេ — វាមានន័យថាអ្នកជំនាញគួរពិនិត្យគាត់ ជាជាងរង់ចាំមើល។ ការកក់ណាត់ជួបឱ្យបានឆាប់ គឺជាអ្វីដែលមានប្រយោជន៍បំផុត។',
          steps: [
            'កក់ណាត់ជួបជាមួយគ្រូពេទ្យកុមារ ឬអ្នកជំនាញអភិវឌ្ឍន៍',
            'កត់ត្រាខ្លីៗអំពីអ្វីដែលអ្នកសង្កេតឃើញ ដើម្បីយកទៅជាមួយ',
            'សាកល្បងសកម្មភាពដែលបានណែនាំ ខណៈពេលរង់ចាំ',
          ],
        },
      },
      disclaimer:
        'សំណួរទាំងនេះជាការបង្ហាញកម្រិត មិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ។ មានតែគ្រូពេទ្យជំនាញប៉ុណ្ណោះដែលអាចធ្វើរោគវិនិច្ឆ័យអូទីសឹមបាន។',
      dashboard: 'ទៅកាន់ផ្ទាំងគ្រប់គ្រងរបស់ខ្ញុំ',
      specialist: 'ស្វែងរកអ្នកជំនាញ',
      activities: 'សាកល្បងសកម្មភាព',
      retake: 'ឆ្លើយម្តងទៀត',
      scoreCaption: (percent: number) => `${percent}% នៃពិន្ទុដែលអាចមាន`,
    },
    errors: {
      load: 'យើងមិនអាចចាប់ផ្តើមសំណួរបានទេ។ សូមព្យាយាមម្តងទៀត។',
      submit: 'ចម្លើយរបស់អ្នកមិនអាចរក្សាទុកបានទេ។ សូមព្យាយាមម្តងទៀត។',
      child: 'មិនអាចរក្សាទុកប្រវត្តិរូបកុមារបានទេ។ សូមព្យាយាមម្តងទៀត។',
    },
  },
};

/**
 * The first-run flow: child → three-minute assessment → concern band → app.
 *
 * It is one page with four steps rather than four routes, because the parent's
 * answers live in memory until submit. Splitting it into routes would mean
 * persisting a half-finished draft or losing it on a refresh.
 */
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ScreeningAnswerScaleComponent,
    UiFieldComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    AccessibleFormDirective,
  ],
  template: `
    <div class="page">
      <header class="topbar">
        <span class="brand">
          <span class="brand-mark" aria-hidden="true">A</span>
          {{ copy().brand }}
        </span>
        <span class="privacy">
          <span class="lock" aria-hidden="true"></span>
          {{ copy().privacy }}
        </span>
      </header>

      <main class="stage" [attr.aria-busy]="saving()">
        @if (error()) {
          <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
        }

        <!-- ── Step 1: the child ─────────────────────────────────────────── -->
        @if (step() === 'child') {
          <section class="card" aria-labelledby="child-title">
            <p class="eyebrow">{{ copy().child.eyebrow }}</p>
            <h1 id="child-title">{{ copy().child.title }}</h1>
            <p class="lede">{{ copy().child.subtitle }}</p>

            <form [formGroup]="childForm" (ngSubmit)="createChild()" acAccessibleForm novalidate>
              <ac-ui-field
                [label]="copy().child.firstName"
                [required]="true"
                [error]="
                  childForm.controls.firstName.touched && childForm.controls.firstName.invalid
                    ? copy().child.nameError
                    : null
                "
              >
                <input
                  type="text"
                  formControlName="firstName"
                  autocomplete="off"
                  maxlength="80"
                  [placeholder]="copy().child.firstNamePlaceholder"
                />
              </ac-ui-field>

              <ac-ui-field
                [label]="copy().child.dob"
                [required]="true"
                [error]="
                  childForm.controls.dateOfBirth.touched && childForm.controls.dateOfBirth.invalid
                    ? copy().child.dobError
                    : null
                "
              >
                <input type="date" formControlName="dateOfBirth" [max]="today" />
              </ac-ui-field>

              <ac-ui-field [label]="copy().child.notes">
                <textarea
                  formControlName="notes"
                  rows="3"
                  maxlength="2000"
                  [placeholder]="copy().child.notesPlaceholder"
                ></textarea>
              </ac-ui-field>

              <button type="submit" class="primary" [disabled]="saving()">
                {{ saving() ? copy().questions.working : copy().child.submit }}
              </button>
            </form>
          </section>
        }

        <!-- ── Step 2: what this is ──────────────────────────────────────── -->
        @if (step() === 'intro') {
          <section class="card" aria-labelledby="intro-title">
            <p class="eyebrow">{{ copy().intro.eyebrow(childName()) }}</p>
            <h1 id="intro-title">{{ copy().intro.title }}</h1>
            <p class="hint">{{ childAge() }}</p>
            <p class="lede">{{ copy().intro.body }}</p>

            <ul class="points">
              @for (point of copy().intro.points; track point) {
                <li>
                  <span class="tick" aria-hidden="true"></span>
                  {{ point }}
                </li>
              }
            </ul>

            <p class="notice">{{ copy().intro.notice }}</p>

            <div class="actions">
              <button
                type="button"
                class="primary"
                (click)="startAssessment()"
                [disabled]="saving()"
              >
                {{ saving() ? copy().questions.working : copy().intro.start }}
              </button>
              <button type="button" class="ghost" (click)="skip()">{{ copy().intro.skip }}</button>
            </div>
          </section>
        }

        <!-- ── Step 3: the questions ─────────────────────────────────────── -->
        @if (step() === 'questions' && currentQuestion(); as question) {
          <section class="card question-card" aria-labelledby="question-title">
            <div class="progress-head">
              <span class="progress-label">
                {{ copy().questions.progress(index() + 1, questions().length) }}
              </span>
              <span
                class="progress-track"
                role="progressbar"
                [attr.aria-valuenow]="index() + 1"
                [attr.aria-valuemin]="1"
                [attr.aria-valuemax]="questions().length"
              >
                <span class="progress-fill" [style.width.%]="progressPercent()"></span>
              </span>
            </div>

            <h1 id="question-title" class="question">{{ question.questionText }}</h1>
            <p class="hint">{{ copy().questions.hint }}</p>

            <ac-screening-answer-scale
              [value]="selectedAnswer()"
              [disabled]="saving()"
              (valueChange)="answer($event)"
            />

            <div class="actions row">
              <button type="button" class="ghost" (click)="previous()" [disabled]="index() === 0">
                {{ copy().questions.back }}
              </button>
              @if (index() === questions().length - 1) {
                <button
                  type="button"
                  class="primary"
                  [disabled]="selectedAnswer() === null || saving()"
                  (click)="submit()"
                >
                  {{ saving() ? copy().questions.working : copy().questions.finish }}
                </button>
              } @else {
                <button
                  type="button"
                  class="primary"
                  [disabled]="selectedAnswer() === null"
                  (click)="next()"
                >
                  {{ copy().questions.next }}
                </button>
              }
            </div>
          </section>
        }

        @if (step() === 'questions' && !currentQuestion() && !error()) {
          <ac-ui-spinner [label]="copy().questions.working" />
        }

        <!-- ── Step 4: the result ───────────────────────────────────────── -->
        @if (step() === 'result' && result(); as outcome) {
          <section
            class="card result"
            [class.band-low]="bandKey() === 'low'"
            [class.band-moderate]="bandKey() === 'moderate'"
            [class.band-high]="bandKey() === 'high'"
          >
            <p class="eyebrow">{{ copy().result.eyebrow }}</p>
            <div class="band-row">
              <span class="band-chip"> {{ copy().result.band }} · {{ band().label }} </span>
            </div>
            <h1>{{ band().headline }}</h1>
            <p class="lede">{{ band().meaning }}</p>

            @if (outcome.result?.riskPercentage != null) {
              <p class="score-caption">
                {{ copy().result.scoreCaption(outcome.result?.riskPercentage ?? 0) }}
              </p>
            }

            <div class="areas">
              <h2>{{ copy().result.areas }}</h2>
              @for (area of areas(); track area.category) {
                <div class="area">
                  <div class="area-head">
                    <span class="area-name">{{ area.category }}</span>
                    <span class="area-level"> {{ area.percent }}% </span>
                  </div>
                  <span class="bar">
                    <span
                      class="bar-fill"
                      [class.lv-moderate]="area.riskLevel === 'MODERATE'"
                      [class.lv-high]="area.riskLevel === 'HIGH'"
                      [style.width.%]="area.percent"
                    ></span>
                  </span>
                </div>
              }
            </div>

            <ol class="steps">
              @for (step of band().steps; track step) {
                <li>{{ step }}</li>
              }
            </ol>

            <p class="notice">{{ copy().result.disclaimer }}</p>

            <div class="actions">
              <button type="button" class="primary" (click)="finish()">
                {{ copy().result.dashboard }}
              </button>
            </div>
            <div class="actions row secondary-row">
              <button type="button" class="ghost" (click)="go('/hospitals')">
                {{ copy().result.specialist }}
              </button>
              <button type="button" class="ghost" (click)="go('/activities')">
                {{ copy().result.activities }}
              </button>
              <button type="button" class="ghost" (click)="restart()">
                {{ copy().result.retake }}
              </button>
            </div>
          </section>
        }
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page {
        min-height: 100vh;
        background: var(--ac-color-background);
        padding: 0 20px 64px;
      }

      .topbar {
        max-width: 760px;
        margin: 0 auto;
        padding: 22px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        font-size: 18px;
        color: var(--ac-color-text-strong);
      }

      .brand-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 15px;
        font-weight: 800;
      }

      .privacy {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .lock {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--ac-color-green-teal);
      }

      .stage {
        max-width: 760px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-xl);
        box-shadow: var(--ac-shadow-sm);
        padding: 36px 32px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: var(--ac-type-label);
        font-weight: 700;
        color: var(--ac-color-action);
      }

      h1 {
        margin: 0;
        font-size: clamp(24px, 3vw, 32px);
        line-height: 1.2;
        color: var(--ac-color-text-strong);
      }

      h2 {
        margin: 0 0 4px;
        font-size: var(--ac-type-section-title);
        color: var(--ac-color-text-strong);
      }

      .lede {
        margin: 0;
        color: var(--ac-color-text-muted);
        line-height: 1.65;
        font-size: var(--ac-type-body);
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 4px;
      }

      .points {
        margin: 4px 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .points li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-body);
      }

      .tick {
        flex: none;
        width: 18px;
        height: 18px;
        margin-top: 2px;
        border-radius: 50%;
        border: 2px solid var(--ac-color-action);
        position: relative;
      }

      .tick::after {
        content: '';
        position: absolute;
        inset: 3px;
        border-radius: 50%;
        background: var(--ac-color-action);
      }

      .notice {
        margin: 4px 0 0;
        padding: 14px 16px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-alert-surface);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-alert-text);
        font-size: var(--ac-type-meta);
        line-height: 1.6;
      }

      .actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 8px;
      }

      .actions.row {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .secondary-row {
        margin-top: 0;
        flex-wrap: wrap;
        justify-content: flex-start;
      }

      .primary,
      .ghost {
        font: inherit;
        border-radius: var(--ac-radius-pill);
        padding: 13px 24px;
        font-weight: 700;
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          border-color var(--ac-motion-fast),
          transform var(--ac-motion-fast);
      }

      .primary {
        border: 1px solid var(--ac-color-action-deep);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .primary:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
      }

      .primary:active:not(:disabled) {
        transform: translateY(1px);
      }

      .ghost {
        border: 1px solid var(--ac-color-border);
        background: transparent;
        color: var(--ac-color-text-strong);
      }

      .ghost:hover:not(:disabled) {
        background: var(--ac-color-surface-slate);
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      button:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .progress-head {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .progress-label {
        font-size: var(--ac-type-label);
        font-weight: 700;
        color: var(--ac-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .progress-track {
        display: block;
        height: 6px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        overflow: hidden;
      }

      .progress-fill {
        display: block;
        height: 100%;
        background: var(--ac-color-action);
        transition: width var(--ac-motion-normal);
      }

      .question {
        font-size: clamp(21px, 2.6vw, 27px);
        line-height: 1.35;
        margin-top: 6px;
      }

      .hint {
        margin: -4px 0 6px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .band-row {
        display: flex;
        gap: 8px;
      }

      .band-chip {
        display: inline-flex;
        padding: 6px 14px;
        border-radius: var(--ac-radius-pill);
        font-size: var(--ac-type-label);
        font-weight: 700;
        letter-spacing: 0.04em;
        background: var(--ac-color-blue-surface-soft);
        color: var(--ac-color-action-darkest);
      }

      .band-high .band-chip {
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-text);
      }

      .band-moderate .band-chip {
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-dark);
      }

      .score-caption {
        margin: 0;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .areas {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 18px 0 4px;
        border-top: 1px solid var(--ac-color-border);
      }

      .area {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .area-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: var(--ac-type-meta);
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }

      .area-level {
        font-variant-numeric: tabular-nums;
        color: var(--ac-color-text-muted);
      }

      .bar {
        display: block;
        height: 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-slate);
        overflow: hidden;
      }

      .bar-fill {
        display: block;
        height: 100%;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-green-teal);
      }

      .bar-fill.lv-moderate {
        background: var(--ac-color-amber-dark);
      }

      .bar-fill.lv-high {
        background: var(--ac-color-alert-strong);
      }

      .steps {
        margin: 4px 0;
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        color: var(--ac-color-text-strong);
        line-height: 1.55;
        font-size: var(--ac-type-body);
      }

      @media (max-width: 640px) {
        .page {
          padding: 0 14px 48px;
        }

        .card {
          padding: 24px 18px;
          border-radius: var(--ac-radius-lg);
        }

        .actions.row {
          flex-direction: column-reverse;
          align-items: stretch;
        }

        .actions.row button {
          width: 100%;
        }
      }

      :host-context(.lang-km) h1,
      :host-context(.lang-km) .lede,
      :host-context(.lang-km) .points li,
      :host-context(.lang-km) .steps {
        line-height: 1.85;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingPage implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly screeningApi = inject(ScreeningApi);
  private readonly onboarding = inject(OnboardingState);

  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);
  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly step = signal<Step>('child');
  protected readonly child = signal<ChildResponse | null>(null);
  protected readonly questions = signal<readonly ScreeningQuestionResponse[]>([]);
  protected readonly answers = signal<Readonly<Record<string, number>>>({});
  protected readonly index = signal(0);
  protected readonly result = signal<ScreeningSessionDetailResponse | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private sessionId: string | null = null;

  protected readonly childForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    dateOfBirth: ['', [Validators.required]],
    notes: [''],
  });

  protected readonly childName = computed(() => this.child()?.firstName ?? '');
  protected readonly currentQuestion = computed(() => this.questions()[this.index()] ?? null);
  protected readonly progressPercent = computed(() =>
    this.questions().length === 0 ? 0 : ((this.index() + 1) / this.questions().length) * 100,
  );
  protected readonly selectedAnswer = computed(() => {
    const question = this.currentQuestion();
    if (!question) return null;
    const value = this.answers()[question.id];
    return value === undefined ? null : value;
  });

  /** Which concern band the last answer landed in, as a plain key for styling. */
  protected readonly bandKey = computed(() => {
    const riskLevel = this.result()?.result?.riskLevel ?? 'LOW';
    return riskLevel.toLowerCase() as 'low' | 'moderate' | 'high';
  });

  protected readonly band = computed(
    () => this.copy().result.bands[this.result()?.result?.riskLevel ?? 'LOW'],
  );

  protected readonly areas = computed(() =>
    (this.result()?.result?.categoryBreakdown ?? []).map((entry) => ({
      category: entry.category,
      riskLevel: entry.riskLevel,
      percent: entry.riskPercentage,
    })),
  );

  ngOnInit(): void {
    // A parent who already has a child goes straight to the explanation. The
    // child step exists only because nothing else in the app works without one.
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        const existing = children[0];
        if (existing) {
          this.child.set(existing);
          this.step.set('intro');
        }
      },
      error: () => {
        // Stay on the child step; creating one will surface a real error.
      },
    });
  }

  protected childAge(): string {
    const child = this.child();
    if (!child) return '';
    const born = new Date(child.dateOfBirth);
    const now = new Date();
    let months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
    if (now.getDate() < born.getDate()) months -= 1;
    months = Math.max(months, 0);
    return this.copy().child.age(Math.floor(months / 12), months % 12);
  }

  protected createChild(): void {
    if (this.childForm.invalid) {
      this.childForm.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.saving.set(true);
    const value = this.childForm.getRawValue();

    this.childrenApi
      .createChild({
        firstName: value.firstName.trim(),
        dateOfBirth: value.dateOfBirth,
        ...(value.notes.trim() ? { notes: value.notes.trim() } : {}),
      })
      .subscribe({
        next: (child) => {
          this.saving.set(false);
          this.child.set(child);
          this.onboarding.invalidate();
          this.step.set('intro');
        },
        error: () => {
          this.saving.set(false);
          this.error.set(this.copy().errors.child);
        },
      });
  }

  protected startAssessment(): void {
    const child = this.child();
    if (!child) {
      this.step.set('child');
      return;
    }
    this.error.set(null);
    this.saving.set(true);

    this.screeningApi.createSession(child.id, 'SHORT').subscribe({
      next: (created) => {
        this.sessionId = created.session.id;
        this.questions.set(created.questions);
        this.answers.set({});
        this.index.set(0);
        this.saving.set(false);
        this.step.set('questions');
      },
      error: () => {
        this.saving.set(false);
        this.error.set(this.copy().errors.load);
      },
    });
  }

  protected answer(value: number): void {
    const question = this.currentQuestion();
    if (!question) return;
    this.answers.update((current) => ({ ...current, [question.id]: value }));
  }

  protected next(): void {
    if (this.index() < this.questions().length - 1) this.index.update((value) => value + 1);
  }

  protected previous(): void {
    if (this.index() > 0) this.index.update((value) => value - 1);
  }

  protected submit(): void {
    const sessionId = this.sessionId;
    if (!sessionId || this.saving()) return;

    const answers = this.answers();
    const requests = this.questions().map((question) =>
      this.screeningApi.upsertAnswer(sessionId, {
        questionId: question.id,
        answerValue: answers[question.id] ?? 0,
      }),
    );

    this.error.set(null);
    this.saving.set(true);

    const saved: Observable<unknown> = requests.length > 0 ? forkJoin(requests) : of(null);

    saved.pipe(switchMap(() => this.screeningApi.submitSession(sessionId))).subscribe({
      next: (session) => {
        this.saving.set(false);
        this.onboarding.markComplete();
        this.result.set(session);
        this.step.set('result');
      },
      error: () => {
        this.saving.set(false);
        this.error.set(this.copy().errors.submit);
      },
    });
  }

  protected finish(): void {
    this.onboarding.markComplete();
    void this.router.navigateByUrl('/dashboard');
  }

  protected skip(): void {
    this.onboarding.skip();
    void this.router.navigateByUrl('/dashboard');
  }

  protected go(path: string): void {
    void this.router.navigateByUrl(path);
  }

  protected restart(): void {
    this.result.set(null);
    this.answers.set({});
    this.index.set(0);
    this.startAssessment();
  }
}
