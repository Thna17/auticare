import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';

type Answer = 'Often' | 'Sometimes' | 'Rarely' | 'Not sure / Not observed';
type CheckQuestion = { text: string; area: number; positive: boolean };
type Area = { name: string; explanation: string; tips: string[] };
type CheckInScore = {
  percentage: number | null;
  scoredResponses: number;
  notSureResponses: number;
};
type CheckInResult = CheckInScore & { areas: ReturnType<typeof analyzeCheckIn> };

export const CHECKIN_QUESTIONS: readonly CheckQuestion[] = [
  {
    text: "When you call your child's name, how often do they respond by looking at you or turning toward you?",
    area: 0,
    positive: true,
  },
  {
    text: 'How often does your child use eye contact naturally while interacting with familiar people?',
    area: 0,
    positive: true,
  },
  {
    text: 'How often does your child point to or show you something interesting, just to share it with you?',
    area: 1,
    positive: true,
  },
  {
    text: 'How often does your child communicate their needs using words, gestures, pictures, or another communication method?',
    area: 0,
    positive: true,
  },
  {
    text: 'How often does your child show interest in interacting or playing with other people?',
    area: 2,
    positive: true,
  },
  {
    text: 'How often does your child copy simple actions, gestures, or sounds during play or daily activities?',
    area: 2,
    positive: true,
  },
  {
    text: 'How often does your child repeat certain movements, sounds, or actions, such as hand movements, spinning objects, or repeating phrases?',
    area: 3,
    positive: false,
  },
  {
    text: 'How often does your child become upset or distressed when familiar routines unexpectedly change?',
    area: 3,
    positive: false,
  },
  {
    text: 'How often does your child show strong reactions to sounds, lights, textures, smells, or other sensory experiences?',
    area: 4,
    positive: false,
  },
  {
    text: 'How often does your child follow your pointing or looking to notice something you are showing them?',
    area: 1,
    positive: true,
  },
];

export const CHECKIN_QUESTIONS_KM: readonly string[] = [
  'នៅពេលអ្នកហៅឈ្មោះកូន តើកូនងាកមកមើល ឬឆ្លើយតបញឹកញាប់ប៉ុណ្ណា?',
  'តើកូនសម្លឹងមើលភ្នែកអ្នកដទៃដោយធម្មជាតិ ពេលប្រាស្រ័យទាក់ទងញឹកញាប់ប៉ុណ្ណា?',
  'តើកូនចង្អុល ឬបង្ហាញអ្វីមួយដែលគេចាប់អារម្មណ៍ ដើម្បីចែករំលែកជាមួយអ្នកញឹកញាប់ប៉ុណ្ណា?',
  'តើកូនប្រាប់ពីតម្រូវការរបស់ខ្លួនតាមរយៈពាក្យសម្ដី កាយវិការ រូបភាព ឬវិធីផ្សេងៗញឹកញាប់ប៉ុណ្ណា?',
  'តើកូនបង្ហាញចំណាប់អារម្មណ៍ក្នុងការលេង ឬប្រាស្រ័យទាក់ទងជាមួយអ្នកដទៃញឹកញាប់ប៉ុណ្ណា?',
  'តើកូនធ្វើត្រាប់តាមសកម្មភាព កាយវិការ ឬសំឡេងងាយៗញឹកញាប់ប៉ុណ្ណា?',
  'តើកូនធ្វើចលនា បញ្ចេញសំឡេង ឬធ្វើសកម្មភាពដដែលៗញឹកញាប់ប៉ុណ្ណា?',
  'តើកូនមានអារម្មណ៍មិនស្រួល ឬតានតឹង នៅពេលទម្លាប់ប្រចាំថ្ងៃផ្លាស់ប្តូរភ្លាមៗញឹកញាប់ប៉ុណ្ណា?',
  'តើកូនមានប្រតិកម្មខ្លាំងចំពោះសំឡេង ពន្លឺ ការប៉ះពាល់ ក្លិន ឬអារម្មណ៍តាមវិញ្ញាណផ្សេងៗញឹកញាប់ប៉ុណ្ណា?',
  'នៅពេលអ្នកចង្អុល ឬសម្លឹងមើលអ្វីមួយ តើកូនមើលតាមដើម្បីដឹងថាអ្នកកំពុងបង្ហាញអ្វីញឹកញាប់ប៉ុណ្ណា?',
];

const UI_COPY = {
  en: {
    kicker: 'Free · private · no account needed',
    title: 'Free Child Development Check-In',
    intro:
      "Answer 10 simple questions about your child's communication, social interaction, behavior, and sensory experiences.",
    free: 'Free to complete',
    time: 'About 3–5 minutes',
    ten: '10 questions',
    guidance: 'Educational guidance, not a diagnosis',
    noPayment: 'No payment required',
    introDisclaimer:
      "This is a preliminary educational check-in with original prompts, not a validated diagnostic or autism-severity assessment. Children develop differently; interpret answers in your child's age and context.",
    age: "Child's age",
    months: 'months',
    years: 'years',
    nickname: 'Optional nickname',
    nicknamePlaceholder: 'Leave blank to stay anonymous',
    consent:
      "I am this child's parent or guardian and consent to processing these answers on this device for this check-in.",
    privacy:
      'Answers stay in this browser session and are not sent to a server or external AI. They are cleared when you leave or choose Delete answers. Avoid entering identifying details.',
    begin: 'Begin check-in',
    question: 'Question',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    analyze: 'Analyze My Answers',
    sessionPrivacy:
      'Answers are saved only in this page while you complete the check-in. You can delete them at any time.',
    delete: 'Delete answers',
    resultTitle: "Your Child's Check-In Result",
    responseScore: 'Response score',
    descriptive: 'Descriptive result',
    noScore:
      'All responses were marked “Not sure / Not observed,” so there are not enough scored responses to show a percentage.',
    low: 'Low',
    medium: 'Medium — Areas to Explore',
    elevated: 'Elevated',
    lowExplanation:
      'Your scored answers showed fewer response patterns to explore in this brief check-in.',
    mediumExplanation:
      'Some answers suggest areas where additional developmental guidance may be helpful.',
    elevatedExplanation:
      'Several answers suggest it may be helpful to discuss your observations with a developmental professional.',
    recommendation:
      "If you have questions or ongoing concerns, consider discussing your observations with your child's pediatrician or a qualified developmental professional.",
    download: 'Download Result',
    retake: 'Retake Questionnaire',
    findSupport: 'Find Support',
    resultDisclaimer:
      'This is an educational check-in, not an autism diagnosis or probability estimate.',
    pdfTitle: "Your Child's Check-In Result",
    pdfUnavailable: 'No percentage available',
    pdfUnknown: 'Not sure or unobserved answers are excluded from scoring.',
  },
  km: {
    kicker: 'ឥតគិតថ្លៃ · រក្សាឯកជនភាព · មិនចាំបាច់បង្កើតគណនី',
    title: 'ការពិនិត្យបឋមអំពីការអភិវឌ្ឍរបស់កុមារ ដោយឥតគិតថ្លៃ',
    intro:
      'សូមចំណាយពេលឆ្លើយសំណួរងាយៗចំនួន ១០ ទាក់ទងនឹងការប្រាស្រ័យទាក់ទង ជំនាញសង្គម អាកប្បកិរិយា និងការឆ្លើយតបតាមញ្ញាណទាំង៥ របស់កូនអ្នក។',
    free: 'បំពេញដោយឥតគិតថ្លៃ',
    time: 'ប្រហែល ៣–៥ នាទី',
    ten: 'សំណួរ ១០',
    guidance: 'ព័ត៌មានអប់រំ មិនមែនជារោគវិនិច្ឆ័យទេ',
    noPayment: 'មិនត្រូវបង់ប្រាក់ទេ',
    introDisclaimer:
      'នេះជាការពិនិត្យបឋមសម្រាប់ផ្តល់ព័ត៌មានអប់រំ ដោយប្រើសំណួរដែលបានរៀបចំឡើងថ្មី។ វាមិនមែនជាការវាយតម្លៃរោគវិនិច្ឆ័យ ឬកម្រិតធ្ងន់ធ្ងរនៃអូទីស្សឹមដែលបានផ្ទៀងផ្ទាត់ទេ។ កុមារម្នាក់ៗមានការអភិវឌ្ឍខុសៗគ្នា ដូច្នេះសូមពិចារណាចម្លើយតាមអាយុ និងស្ថានភាពអភិវឌ្ឍរបស់កូនអ្នក។',
    age: 'អាយុរបស់កូន',
    months: 'ខែ',
    years: 'ឆ្នាំ',
    nickname: 'ឈ្មោះហៅក្រៅ (មិនចាំបាច់)',
    nicknamePlaceholder: 'ទុកទទេ ប្រសិនបើចង់រក្សាអនាមិកភាព',
    consent:
      'ខ្ញុំជាឪពុក ម្តាយ ឬអាណាព្យាបាលរបស់កុមារនេះ ហើយយល់ព្រមឱ្យដំណើរការចម្លើយទាំងនេះនៅលើឧបករណ៍នេះសម្រាប់ការពិនិត្យបឋមនេះ។',
    privacy:
      'ចម្លើយត្រូវបានរក្សាទុកតែក្នុងទំព័រនេះ នៅក្នុងកម្មវិធីរុករករបស់អ្នកប៉ុណ្ណោះ ហើយមិនត្រូវបានផ្ញើទៅម៉ាស៊ីនមេ ឬសេវា AI ខាងក្រៅទេ។ ចម្លើយនឹងត្រូវលុបនៅពេលអ្នកចាកចេញ ឬជ្រើសរើស “លុបចម្លើយ”។ សូមកុំបញ្ចូលព័ត៌មានដែលអាចសម្គាល់អត្តសញ្ញាណបាន។',
    begin: 'ចាប់ផ្តើម',
    question: 'សំណួរទី',
    of: 'ក្នុងចំណោម',
    previous: 'ត្រឡប់ក្រោយ',
    next: 'បន្ទាប់',
    analyze: 'វិភាគចម្លើយរបស់ខ្ញុំ',
    sessionPrivacy:
      'ចម្លើយត្រូវបានរក្សាទុកតែក្នុងទំព័រនេះ ខណៈពេលអ្នកបំពេញការពិនិត្យបឋម។ អ្នកអាចលុបចម្លើយបានគ្រប់ពេល។',
    delete: 'លុបចម្លើយ',
    resultTitle: 'លទ្ធផលនៃការពិនិត្យបឋមរបស់កូន',
    responseScore: 'ពិន្ទុចម្លើយ',
    descriptive: 'លទ្ធផលជាពាក្យពិពណ៌នា',
    noScore:
      'ចម្លើយទាំងអស់ត្រូវបានជ្រើសរើសជា “មិនប្រាកដ / មិនទាន់សង្កេតឃើញ” ដូច្នេះមិនមានចម្លើយគ្រប់គ្រាន់សម្រាប់បង្ហាញជាភាគរយទេ។',
    low: 'ទាប',
    medium: 'មធ្យម — ផ្នែកដែលគួរស្វែងយល់បន្ថែម',
    elevated: 'ខ្ពស់',
    lowExplanation:
      'ចម្លើយដែលបានដាក់ពិន្ទុបង្ហាញថា មានលំនាំតិចជាងដែលគួរស្វែងយល់បន្ថែមក្នុងការពិនិត្យបឋមខ្លីនេះ។',
    mediumExplanation: 'ចម្លើយមួយចំនួនបង្ហាញថា ការណែនាំបន្ថែមអំពីការអភិវឌ្ឍអាចមានប្រយោជន៍។',
    elevatedExplanation:
      'ចម្លើយមួយចំនួនបង្ហាញថា ការពិភាក្សាអំពីអ្វីដែលអ្នកបានសង្កេតជាមួយអ្នកជំនាញការអភិវឌ្ឍអាចមានប្រយោជន៍។',
    recommendation:
      'ប្រសិនបើអ្នកមានសំណួរ ឬកង្វល់ជាបន្តបន្ទាប់ សូមពិចារណាពិភាក្សាអំពីអ្វីដែលអ្នកបានសង្កេតជាមួយគ្រូពេទ្យកុមារ ឬអ្នកជំនាញការអភិវឌ្ឍដែលមានសមត្ថភាព។',
    download: 'ទាញយកលទ្ធផល',
    retake: 'ធ្វើការវាយតម្លៃម្តងទៀត',
    findSupport: 'ស្វែងរកជំនួយ',
    resultDisclaimer:
      'នេះជាការពិនិត្យបឋមសម្រាប់ព័ត៌មានអប់រំ មិនមែនជារោគវិនិច្ឆ័យអូទីស្សឹម ឬការប៉ាន់ប្រមាណប្រូបាប៊ីលីតេទេ។',
    pdfTitle: 'លទ្ធផលនៃការពិនិត្យបឋមរបស់កូន',
    pdfUnavailable: 'មិនមានភាគរយសម្រាប់បង្ហាញទេ',
    pdfUnknown:
      'ចម្លើយ “មិនប្រាកដ” ឬ “មិនទាន់សង្កេតឃើញ” មិនត្រូវបានរាប់បញ្ចូលក្នុងការដាក់ពិន្ទុទេ។',
  },
} as const;

const AREAS: readonly Area[] = [
  {
    name: 'Social Communication',
    explanation:
      'Communication includes words, gestures, pictures, and each child’s own ways of connecting.',
    tips: [
      'Follow your child’s communication and give them time to respond.',
      'Offer pictures or objects as optional ways to make choices.',
    ],
  },
  {
    name: 'Shared Attention',
    explanation:
      'Shared attention is noticing and enjoying something together, in ways that work for the child.',
    tips: [
      'Share interest in what your child notices without insisting they look at you.',
      'Point out interesting things during relaxed everyday moments.',
    ],
  },
  {
    name: 'Social Interaction',
    explanation: 'Children connect and learn from others at different rates and in different ways.',
    tips: [
      'Try short, enjoyable turn-taking activities based on your child’s interests.',
      'Make space for parallel play and comfortable breaks.',
    ],
  },
  {
    name: 'Repetitive Behaviors & Routines',
    explanation:
      'Repeated actions and familiar routines can be enjoyable, regulating, or helpful. Distress and support needs matter.',
    tips: [
      'Give advance notice of changes with a simple picture or gentle reminder.',
      'Keep harmless self-regulating movements available.',
    ],
  },
  {
    name: 'Sensory Experiences',
    explanation:
      'Sounds, lights, textures, and other sensations can feel different for each child.',
    tips: [
      'Notice what feels comfortable and adapt the environment where possible.',
      'Offer a quiet break or hearing protection when your child wants it.',
    ],
  },
];

const ANSWERS: readonly Answer[] = ['Often', 'Sometimes', 'Rarely', 'Not sure / Not observed'];

/** Transparent educational summary. It describes answers only; it is not a clinical score. */
export function analyzeCheckIn(answers: readonly (Answer | undefined)[]) {
  return AREAS.map((area, areaIndex) => {
    const observations = CHECKIN_QUESTIONS.flatMap((question, index) => {
      const answer = answers[index];
      return question.area === areaIndex && answer
        ? [
            {
              question: question.text,
              answer,
              strength: question.positive ? answer === 'Often' : answer === 'Rarely',
            },
          ]
        : [];
    });
    return {
      ...area,
      observations,
      strengths: observations.filter((item) => item.strength),
      explore: observations.filter(
        (item) => !item.strength && item.answer !== 'Not sure / Not observed',
      ),
      unknown: observations.filter((item) => item.answer === 'Not sure / Not observed'),
    };
  });
}

/**
 * Descriptive response index only: positive prompts score Often=0, Sometimes=1,
 * Rarely=2; concern-oriented prompts use the reverse mapping. Not sure and
 * unanswered items are excluded from both numerator and denominator.
 */
export function calculateResponseScore(answers: readonly (Answer | undefined)[]): CheckInScore {
  let concernPoints = 0;
  let scoredResponses = 0;
  let notSureResponses = 0;
  answers.forEach((answer, index) => {
    if (!answer) return;
    if (answer === 'Not sure / Not observed') {
      notSureResponses += 1;
      return;
    }
    const oftenConcern = CHECKIN_QUESTIONS[index]?.positive === false;
    const points = answer === 'Sometimes' ? 1 : (answer === 'Often') === oftenConcern ? 2 : 0;
    concernPoints += points;
    scoredResponses += 1;
  });
  return {
    percentage: scoredResponses ? Math.round((concernPoints / (scoredResponses * 2)) * 100) : null,
    scoredResponses,
    notSureResponses,
  };
}

@Component({
  selector: 'ac-free-checkin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="checkin" aria-labelledby="checkin-title">
      @if (!result()) {
        <header class="intro">
          <p class="eyebrow">{{ copy().kicker }}</p>
          <h2 id="checkin-title">{{ copy().title }}</h2>
          @if (!result()) {
            <p>{{ copy().intro }}</p>
            <ul class="facts">
              <li>{{ copy().free }}</li>
              <li>{{ copy().time }}</li>
              <li>{{ copy().ten }}</li>
              <li>{{ copy().guidance }}</li>
              <li>{{ copy().noPayment }}</li>
            </ul>
            <p class="disclaimer">{{ copy().introDisclaimer }}</p>
          }
        </header>
      }

      @if (!started() && !result()) {
        <form class="start-form" (submit)="$event.preventDefault(); start()">
          <label
            >{{ copy().age }}
            <span class="age-input"
              ><input
                type="number"
                min="0"
                max="240"
                [value]="age()"
                (input)="age.set($any($event.target).value)"
                required
                [attr.aria-label]="copy().age"
              /><select
                [value]="unit()"
                (change)="unit.set($any($event.target).value)"
                [attr.aria-label]="isKhmer() ? 'ឯកតាអាយុ' : 'Age unit'"
              >
                <option value="months">{{ copy().months }}</option>
                <option value="years">{{ copy().years }}</option>
              </select></span
            ></label
          >
          <label
            >{{ copy().nickname }}
            <input
              maxlength="24"
              [value]="nickname()"
              (input)="nickname.set($any($event.target).value)"
              [placeholder]="copy().nicknamePlaceholder"
          /></label>
          <label class="consent"
            ><input
              type="checkbox"
              [checked]="consent()"
              (change)="consent.set($any($event.target).checked)"
            />
            {{ copy().consent }}</label
          >
          <p class="privacy-note">{{ copy().privacy }}</p>
          <button class="primary" type="submit" [disabled]="!consent() || !age()">
            {{ copy().begin }}
          </button>
        </form>
      } @else if (started() && !result()) {
        <div class="progress-wrap">
          <div
            class="progress"
            role="progressbar"
            [attr.aria-valuenow]="current() + 1"
            aria-valuemin="1"
            aria-valuemax="10"
          >
            <span [style.width.%]="(current() + 1) * 10"></span>
          </div>
          <p>
            {{ copy().question }} {{ questionNumber() }} {{ copy().of }}
            {{ isKhmer() ? '១០' : '10' }} · {{ ageDescription() }}
          </p>
        </div>
        <article class="question-card">
          <h3>{{ questionText() }}</h3>
          <div
            class="options"
            role="group"
            [attr.aria-label]="copy().question + ' ' + (current() + 1)"
          >
            @for (answer of answerOptions; track answer) {
              <button
                type="button"
                [class.selected]="answers()[current()] === answer"
                [attr.aria-pressed]="answers()[current()] === answer"
                (click)="choose(answer)"
              >
                {{ answerLabel(answer) }}
              </button>
            }
          </div>
        </article>
        <div class="controls">
          <button type="button" class="secondary" (click)="previous()" [disabled]="current() === 0">
            {{ copy().previous }}</button
          ><button
            type="button"
            class="primary"
            (click)="next()"
            [disabled]="!answers()[current()]"
          >
            {{ current() === 9 ? copy().analyze : copy().next }}
          </button>
        </div>
        <p class="privacy-note">{{ copy().sessionPrivacy }}</p>
        <button class="text-button" type="button" (click)="clear()">{{ copy().delete }}</button>
      } @else if (result(); as report) {
        <section class="result-card" aria-labelledby="result-title">
          <h2 id="result-title">{{ copy().resultTitle }}</h2>
          @if (report.percentage !== null) {
            <p class="result-kicker">{{ copy().responseScore }}</p>
            <div
              class="score-gauge"
              role="img"
              [attr.aria-label]="
                copy().responseScore + ' ' + report.percentage + (isKhmer() ? ' ភាគរយ' : ' percent')
              "
            >
              <svg viewBox="0 0 160 160" aria-hidden="true">
                <circle class="gauge-track" cx="80" cy="80" r="56" />
                <circle
                  class="gauge-progress"
                  cx="80"
                  cy="80"
                  r="56"
                  [attr.stroke-dasharray]="351.86"
                  [attr.stroke-dashoffset]="351.86 - (351.86 * report.percentage) / 100"
                />
              </svg>
              <div class="gauge-label">
                <strong
                  >{{ isKhmer() ? khmerDigits(report.percentage) : report.percentage }}%</strong
                ><span>{{ copy().responseScore }}</span>
              </div>
            </div>
            <p class="result-band">{{ scoreBand(report.percentage) }}</p>
            <p class="result-explanation">{{ scoreExplanation(report.percentage) }}</p>
          } @else {
            <p class="result-kicker">{{ copy().descriptive }}</p>
            <p class="result-explanation">{{ copy().noScore }}</p>
          }
          <p class="recommendation">{{ copy().recommendation }}</p>
          <div class="result-actions">
            <button class="primary" type="button" (click)="download()">
              {{ copy().download }}
            </button>
            <button class="secondary" type="button" (click)="startAgain()">
              {{ copy().retake }}
            </button>
            <a class="secondary link" href="/find-support">{{ copy().findSupport }}</a>
          </div>
          <p class="result-disclaimer">{{ copy().resultDisclaimer }}</p>
        </section>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }
      :host-context(.lang-km) .checkin {
        font-family: 'Noto Sans Khmer', var(--ac-font-family), sans-serif;
      }
      .checkin {
        position: relative;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 20px;
        background: var(--ac-color-surface);
        box-shadow: 0 24px 60px -30px
          color-mix(in srgb, var(--ac-color-action-deep) 35%, transparent);
        overflow: hidden;
      }
      .intro {
        padding: clamp(24px, 4vw, 48px) clamp(20px, 4vw, 56px) 20px;
        max-width: 900px;
      }
      .eyebrow {
        color: var(--ac-color-action-deep);
        font-weight: 750;
        margin: 0 0 8px;
      }
      h2 {
        color: var(--ac-color-text-strong);
        font-size: clamp(28px, 4vw, 42px);
        line-height: 1.14;
        margin: 0 0 12px;
      }
      .intro > p:not(.eyebrow),
      .summary p,
      .follow-up p {
        color: var(--ac-color-text-muted);
        line-height: 1.65;
        font-size: 17px;
      }
      .facts {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        list-style: none;
        padding: 0;
        margin: 18px 0;
      }
      .facts li {
        border-radius: 999px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
        padding: 8px 12px;
        font-size: 14px;
        font-weight: 650;
      }
      .disclaimer,
      .privacy-note {
        font-size: 14px !important;
        color: var(--ac-color-text-muted);
        line-height: 1.55;
      }
      .start-form {
        padding: 8px clamp(20px, 4vw, 56px) 36px;
        display: grid;
        gap: 18px;
        max-width: 620px;
      }
      label {
        display: grid;
        gap: 8px;
        font-weight: 650;
        color: var(--ac-color-text-strong);
      }
      input:not([type='checkbox']),
      select {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 10px;
        padding: 12px;
        font: inherit;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
      }
      .age-input {
        display: flex;
        gap: 8px;
      }
      .age-input input {
        flex: 1;
        min-width: 0;
      }
      .consent {
        grid-template-columns: auto 1fr;
        align-items: start;
        font-weight: 500;
        line-height: 1.5;
      }
      .consent input {
        margin-top: 5px;
        accent-color: var(--ac-color-action);
      }
      .progress-wrap,
      .question-card,
      .controls,
      .privacy-note,
      .text-button {
        margin-left: clamp(20px, 4vw, 56px);
        margin-right: clamp(20px, 4vw, 56px);
      }
      .progress-wrap {
        max-width: 760px;
        padding-top: 8px;
      }
      .progress {
        height: 12px;
        background: var(--ac-color-surface-info);
        border-radius: 99px;
        overflow: hidden;
      }
      .progress span {
        display: block;
        height: 100%;
        background: var(--ac-color-action);
        border-radius: inherit;
        transition: width 0.2s ease;
      }
      .progress-wrap p {
        color: var(--ac-color-text-muted);
        font-weight: 600;
      }
      .question-card,
      .area-card {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 16px;
        padding: 24px;
        background: var(--ac-color-surface);
      }
      .question-card {
        max-width: 760px;
        margin-top: 20px;
      }
      .question-card h3 {
        margin: 0 0 20px;
        color: var(--ac-color-text-strong);
        font-size: 22px;
      }
      .options {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .options button {
        min-width: 0;
        white-space: normal;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      button,
      .link {
        font: inherit;
        cursor: pointer;
        border-radius: 999px;
        padding: 11px 18px;
        font-weight: 650;
      }
      .options button,
      .secondary {
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
      }
      .options button.selected,
      .primary {
        border: 1px solid var(--ac-color-action);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }
      button:focus-visible,
      a:focus-visible,
      summary:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 3px;
      }
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .controls {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        max-width: 760px;
        margin-top: 20px;
      }
      .privacy-note {
        max-width: 760px;
      }
      .text-button {
        border: 0;
        background: none;
        color: var(--ac-color-action-deep);
        padding: 8px 0;
        margin-bottom: 24px;
      }
      .result-card {
        box-sizing: border-box;
        width: min(100% - 32px, 760px);
        margin: 24px auto;
        padding: clamp(24px, 5vw, 56px);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 24px;
        background: var(--ac-color-surface);
        box-shadow: 0 12px 40px -30px
          color-mix(in srgb, var(--ac-color-action-deep) 35%, transparent);
        text-align: center;
      }
      .result-card h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: clamp(26px, 4vw, 36px);
        line-height: 1.2;
      }
      .result-kicker {
        margin: 12px 0 0;
        color: var(--ac-color-text-muted);
        font-size: 18px;
      }
      .score-gauge {
        position: relative;
        width: clamp(180px, 42vw, 250px);
        aspect-ratio: 1;
        margin: 28px auto 14px;
      }
      .score-gauge svg {
        display: block;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }
      .gauge-track,
      .gauge-progress {
        fill: none;
        stroke-width: 12;
      }
      .gauge-track {
        stroke: var(--ac-color-surface-info);
      }
      .gauge-progress {
        stroke: var(--ac-color-action);
        stroke-linecap: round;
        transition: stroke-dashoffset 0.4s ease;
      }
      .gauge-label {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .gauge-label strong {
        color: var(--ac-color-text-strong);
        font-size: clamp(42px, 8vw, 60px);
        line-height: 1;
      }
      .gauge-label span {
        margin-top: 8px;
        color: var(--ac-color-text-muted);
        font-size: 16px;
      }
      .result-band {
        margin: 6px 0 10px;
        color: var(--ac-color-text-strong);
        font-size: clamp(21px, 3vw, 27px);
        font-weight: 750;
      }
      .result-explanation,
      .recommendation {
        max-width: 610px;
        margin: 0 auto;
        color: var(--ac-color-text-muted);
        font-size: 17px;
        line-height: 1.5;
      }
      .recommendation {
        margin-top: 22px;
        color: var(--ac-color-text-body);
      }
      .result-actions {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 24px;
      }
      .result-actions button,
      .result-actions a {
        min-height: 46px;
        border-radius: 999px;
        padding: 11px 20px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .result-actions .primary {
        border: 1px solid var(--ac-color-action);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }
      .result-actions .secondary {
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
      }
      .result-actions .link {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
      }
      .result-disclaimer {
        margin: 20px auto 0;
        color: var(--ac-color-text-muted);
        font-size: 14px;
        line-height: 1.45;
      }
      .result-actions button:focus-visible,
      .result-actions a:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 3px;
      }
      @media (max-width: 600px) {
        .result-card {
          width: calc(100% - 24px);
          margin: 12px auto;
          padding: 24px 18px;
          border-radius: 18px;
        }
        .result-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
      }
      @media print {
        :host {
          display: block !important;
        }
        .intro,
        .start-form,
        .controls,
        .text-button,
        .privacy-note,
        .progress-wrap {
          display: none !important;
        }
        .checkin {
          border: 0;
          box-shadow: none;
        }
        .result-card {
          width: 100%;
          margin: 0;
          box-shadow: none;
          break-inside: avoid;
        }
      }
    `,
  ],
})
export class FreeCheckinComponent {
  private readonly i18n = inject(I18nService);
  readonly isKhmer = computed(() => this.i18n.currentLang() === 'km');
  readonly copy = computed(() => UI_COPY[this.isKhmer() ? 'km' : 'en']);
  readonly questions = CHECKIN_QUESTIONS;
  readonly answerOptions = ANSWERS;
  readonly current = signal(0);
  readonly answers = signal<(Answer | undefined)[]>(Array(10).fill(undefined));
  readonly started = signal(false);
  readonly result = signal<CheckInResult | null>(null);
  readonly age = signal('');
  readonly unit = signal<'months' | 'years'>('months');
  readonly nickname = signal('');
  readonly consent = signal(false);
  readonly ageDescription = computed(() =>
    this.isKhmer()
      ? `អាយុ៖ ${this.khmerDigits(this.age())} ${this.unit() === 'months' ? UI_COPY.km.months : UI_COPY.km.years}`
      : `Age: ${this.age()} ${this.unit()}`,
  );
  questionNumber() {
    return this.isKhmer() ? this.khmerDigits(this.current() + 1) : this.current() + 1;
  }
  questionText() {
    return this.isKhmer()
      ? CHECKIN_QUESTIONS_KM[this.current()]
      : this.questions[this.current()].text;
  }
  khmerDigits(value: string | number) {
    return String(value).replace(/[0-9]/g, (digit) => '០១២៣៤៥៦៧៨៩'[Number(digit)]);
  }
  answerLabel(answer: Answer) {
    if (!this.isKhmer()) return answer;
    return (
      {
        Often: 'ញឹកញាប់',
        Sometimes: 'ពេលខ្លះ',
        Rarely: 'កម្រណាស់',
        'Not sure / Not observed': 'មិនប្រាកដ / មិនទាន់សង្កេតឃើញ',
      } as const
    )[answer];
  }
  scoreBand(score: number) {
    if (this.isKhmer())
      return score <= 30 ? UI_COPY.km.low : score <= 66 ? UI_COPY.km.medium : UI_COPY.km.elevated;
    return score <= 30
      ? 'Low (0–30%)'
      : score <= 66
        ? 'Medium — Areas to Explore (31–66%)'
        : 'Elevated (67–100%)';
  }
  scoreExplanation(score: number) {
    if (score <= 30) return this.copy().lowExplanation;
    if (score <= 66) return this.copy().mediumExplanation;
    return this.copy().elevatedExplanation;
  }
  start() {
    if (this.consent() && Number(this.age()) > 0) this.started.set(true);
  }
  choose(answer: Answer) {
    this.answers.update((values) =>
      values.map((value, index) => (index === this.current() ? answer : value)),
    );
  }
  previous() {
    this.current.update((value) => Math.max(0, value - 1));
  }
  next() {
    if (!this.answers()[this.current()]) return;
    if (this.current() < 9) this.current.update((value) => value + 1);
    else this.analyze();
  }
  analyze() {
    if (this.answers().some((answer) => !answer)) return;
    this.result.set({
      ...calculateResponseScore(this.answers()),
      areas: analyzeCheckIn(this.answers()),
    });
  }
  download() {
    const report = this.result();
    if (!report) return;
    const escape = (value: string) =>
      value.replace(
        /[&<>"]/g,
        (character) =>
          ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] ?? character,
      );
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const percentage =
      report.percentage === null
        ? this.copy().pdfUnavailable
        : `${this.isKhmer() ? this.khmerDigits(report.percentage) : report.percentage}% · ${this.scoreBand(report.percentage)}`;
    const explanation =
      report.percentage === null
        ? this.copy().pdfUnknown
        : this.scoreExplanation(report.percentage);
    const cssToken = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    const teal = cssToken('--ac-brand-500', 'teal');
    const ink = cssToken('--ac-color-text-strong', 'black');
    const line = cssToken('--ac-color-border-slate', 'lightgray');
    const muted = cssToken('--ac-color-text-muted', 'gray');
    const printFont = this.isKhmer() ? "'Noto Sans Khmer', sans-serif" : 'Arial, sans-serif';
    printWindow.document.write(
      `<!doctype html><html lang="${this.isKhmer() ? 'km' : 'en'}"><head><meta charset="utf-8"><title>${escape(this.copy().pdfTitle)}</title><style>body{font:16px/1.5 ${escape(printFont)};color:${escape(ink)};max-width:680px;margin:50px auto;padding:24px;text-align:center;border:1px solid ${escape(line)};border-radius:20px}h1{font-size:30px}.score{font-size:48px;font-weight:700;color:${escape(teal)}}.note{color:${escape(muted)}}@media print{body{margin:10mm}}</style></head><body><h1>${escape(this.copy().pdfTitle)}</h1><p class="score">${escape(percentage)}</p><p>${escape(explanation)}</p><p>${escape(this.copy().recommendation)}</p><p class="note">${escape(this.copy().resultDisclaimer)}</p></body></html>`,
    );
    printWindow.document.close();
    window.setTimeout(() => printWindow.print(), 250);
  }
  startAgain() {
    this.current.set(0);
    this.answers.set(Array(10).fill(undefined));
    this.result.set(null);
    this.started.set(true);
  }
  clear() {
    this.current.set(0);
    this.answers.set(Array(10).fill(undefined));
    this.result.set(null);
    this.started.set(false);
    this.age.set('');
    this.nickname.set('');
    this.consent.set(false);
  }
}
