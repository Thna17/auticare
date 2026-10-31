import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';
import { NavIconComponent } from '../../../core/layout/nav-icon.component';

type Lang = 'en' | 'km';

type AutismValue = {
  readonly title: string;
  readonly headline: string;
  readonly details: readonly string[];
  readonly topics: readonly string[];
  readonly icon: string;
  readonly photoAlt: string;
};

const COPY = {
  en: {
    kicker: 'About autism',
    heading: 'Understanding and compassionate care',
    lead: 'The best support comes from shared context and mutual understanding.',
    values: [
      {
        title: 'Every child is unique',
        headline: 'Support starts with your child, not with a checklist.',
        details: [
          'Autism looks different in every child. AutiCare organises what you notice around your child: their age, their routines and the moments that matter to your family.',
          'There is no single path. What helps one child may not help another, so ideas are matched to where your child is now.',
        ],
        topics: ['Each child', 'Age-matched ideas', 'Family routines'],
        icon: 'children',
        photoAlt: 'Mother playing with a baby using wooden toys',
      },
      {
        title: 'Screening is a starting point',
        headline: 'A check-in opens the conversation. It never closes it.',
        details: [
          'AutiCare’s questions give you a calm starting point in plain words. It is not a diagnosis and it never labels your child.',
          'Your dated notes and answers help you prepare for a doctor or specialist, so the visit starts from what you have already seen.',
        ],
        topics: ['Not a diagnosis', 'Dated notes', 'Ready for the doctor'],
        icon: 'checklist',
        photoAlt: 'Parents speaking with a doctor about their child',
      },
      {
        title: 'Progress works best as a team',
        headline: 'Children do best when the people around them share what they see.',
        details: [
          'Parents stay in control of what is shared. With your consent, your child’s school can see reports and add its own observations.',
          'When home, school and doctors see the same picture, support is more consistent and nobody has to start again.',
        ],
        topics: ['Parent consent', 'Home and school', 'One shared picture'],
        icon: 'family',
        photoAlt: 'Mother helping a young child draw',
      },
    ] as readonly AutismValue[],
  },
  km: {
    kicker: 'អំពីអូទីស្សឹម',
    heading: 'ការយល់ដឹង និងការគាំទ្រប្រកបដោយសេចក្តីថ្លៃថ្នូរ',
    lead: 'ការគាំទ្រដ៏ល្អបំផុតកើតចេញពីកិច្ចសហការ និងការយល់ដឹងច្បាស់លាស់។',
    values: [
      {
        title: 'កុមារម្នាក់ៗមានភាពពិសេសរៀងៗខ្លួន',
        headline: 'ការគាំទ្រចាប់ផ្តើមពីកូនរបស់អ្នក មិនមែនពីបញ្ជីត្រួតពិនិត្យទេ។',
        details: [
          'អូទីស្សឹមបង្ហាញខ្លួនខុសៗគ្នានៅក្នុងកុមារម្នាក់ៗ។ AutiCare រៀបចំអ្វីដែលអ្នកកត់សម្គាល់ជុំវិញកូនរបស់អ្នក៖ អាយុ ទម្លាប់ និងពេលវេលាដែលសំខាន់សម្រាប់គ្រួសារអ្នក។',
          'មិនមានផ្លូវតែមួយទេ។ អ្វីដែលជួយកុមារម្នាក់ អាចមិនជួយកុមារម្នាក់ទៀត ដូច្នេះគំនិតត្រូវបានជ្រើសរើសឱ្យសមនឹងកូនរបស់អ្នកឥឡូវនេះ។',
        ],
        topics: ['កុមារម្នាក់ៗ', 'សមនឹងអាយុ', 'ទម្លាប់គ្រួសារ'],
        icon: 'children',
        photoAlt: 'ម្តាយកំពុងលេងប្រដាប់ក្មេងលេងឈើជាមួយទារក',
      },
      {
        title: 'ការវាយតម្លៃគឺជាចំណុចចាប់ផ្តើម',
        headline: 'ការពិនិត្យបើកការសន្ទនា វាមិនបិទការសន្ទនាទេ។',
        details: [
          'សំណួររបស់ AutiCare ផ្តល់ឱ្យអ្នកនូវចំណុចចាប់ផ្តើមដ៏ស្ងប់ស្ងាត់ ជាពាក្យសាមញ្ញ។ វាមិនមែនជាការធ្វើរោគវិនិច្ឆ័យ ហើយមិនដាក់ស្លាកលើកូនរបស់អ្នកឡើយ។',
          'កំណត់ត្រា និងចម្លើយដែលមានកាលបរិច្ឆេទ ជួយអ្នករៀបចំខ្លួនសម្រាប់ជួបវេជ្ជបណ្ឌិត ដូច្នេះការជួបចាប់ផ្តើមពីអ្វីដែលអ្នកបានឃើញរួចហើយ។',
        ],
        topics: ['មិនមែនរោគវិនិច្ឆ័យ', 'កំណត់ត្រាមានកាលបរិច្ឆេទ', 'រួចរាល់សម្រាប់វេជ្ជបណ្ឌិត'],
        icon: 'checklist',
        photoAlt: 'ឪពុកម្តាយកំពុងពិភាក្សាជាមួយគ្រូពេទ្យអំពីកូន',
      },
      {
        title: 'ការរីកចម្រើនកើតពីកិច្ចសហការ',
        headline: 'កុមាររីកចម្រើនល្អបំផុត នៅពេលមនុស្សជុំវិញខ្លួនចែករំលែកអ្វីដែលពួកគេឃើញ។',
        details: [
          'ឪពុកម្តាយគ្រប់គ្រងអ្វីដែលត្រូវចែករំលែក។ ដោយមានការយល់ព្រមពីអ្នក សាលារបស់កូនអ្នកអាចមើលរបាយការណ៍ និងបន្ថែមការសង្កេតរបស់ខ្លួន។',
          'នៅពេលផ្ទះ សាលា និងវេជ្ជបណ្ឌិតមើលឃើញរូបភាពដូចគ្នា ការគាំទ្រកាន់តែស៊ីសង្វាក់ ហើយគ្មាននរណាត្រូវចាប់ផ្តើមឡើងវិញទេ។',
        ],
        topics: ['ការយល់ព្រមពីឪពុកម្តាយ', 'ផ្ទះ និងសាលា', 'រូបភាពរួមតែមួយ'],
        icon: 'family',
        photoAlt: 'ម្តាយកំពុងជួយកូនតូចគូររូប',
      },
    ] as readonly AutismValue[],
  },
} as const;

/**
 * Splits text into the pieces the heading animates one by one: visible
 * characters (grapheme clusters), so Khmer vowels and subscripts stay joined
 * to their consonant. Without Intl.Segmenter it falls back to whole words.
 * Each word is kept together so lines only break between words.
 */
const splitHeading = (text: string): string[][] => {
  const words = text.split(' ');
  const Segmenter = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (!Segmenter) return words.map((word) => [word]);
  const segmenter = new Segmenter(undefined, { granularity: 'grapheme' });
  return words.map((word) => Array.from(segmenter.segment(word), (part) => part.segment));
};

/**
 * The landing page's "About autism" section, in the style of an alternating
 * values layout: an illustrated panel that fades in where it stands, and text
 * that slides in from the opposite side to meet it. The heading appears one
 * character at a time. Used as <section acAutismValues id="about-autism">.
 */
@Component({
  selector: 'section[acAutismValues]',
  standalone: true,
  imports: [NavIconComponent],
  host: { class: 'autism-values', 'aria-labelledby': 'autism-title' },
  template: `
    <div class="inner">
      <header class="intro">
        <p class="kicker" data-reveal="up">
          <span class="kicker-dot" aria-hidden="true"></span>{{ copy().kicker }}
        </p>
        <h2 id="autism-title" class="chars" data-reveal="chars" [attr.aria-label]="copy().heading">
          @for (word of headingParts(); track $index; let w = $index) {
            <span class="word" aria-hidden="true">
              @for (char of word; track $index) {
                <span class="char" [style.--c]="charIndex(w, $index)">{{ char }}</span>
              }
            </span>
          }
        </h2>
        <p class="lead" data-reveal="up" style="--delay: 200ms">{{ copy().lead }}</p>
      </header>

      <div class="values">
        @for (value of copy().values; track value.title; let i = $index) {
          <article class="value" [class.reversed]="i % 2 === 1">
            <div class="panel" data-reveal="fade">
              <div class="art">
                <img
                  class="photo"
                  [src]="photoUrl(i)"
                  [alt]="value.photoAlt"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div class="badge">
                <span class="badge-icon" aria-hidden="true"
                  ><ac-nav-icon [name]="value.icon"
                /></span>
                <span class="num">{{ number(i) }}</span>
              </div>
            </div>

            <div
              class="content"
              [attr.data-reveal]="i % 2 === 1 ? 'left' : 'right'"
              style="--delay: 120ms"
            >
              <h3>{{ value.title }}</h3>
              <p class="headline">{{ value.headline }}</p>
              <div class="details">
                @for (detail of value.details; track $index) {
                  <p>{{ detail }}</p>
                }
              </div>
              <ul class="topics">
                @for (topic of value.topics; track topic) {
                  <li>{{ topic }}</li>
                }
              </ul>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        --ease: cubic-bezier(0.22, 1, 0.36, 1);
        padding: 104px var(--lp-x, clamp(16px, 4vw, 48px));
        background: var(--ac-brand-50);
        border-top: 1px solid var(--ac-color-border-slate);
        /* clip rather than hidden, so nothing inside becomes a scroll container. */
        overflow: clip;
      }

      /* Reveal: [data-reveal] starts hidden and settles once on screen. */
      [data-reveal] {
        transition:
          opacity 1000ms var(--ease),
          transform 1000ms var(--ease);
        transition-delay: var(--delay, 0ms);
      }

      [data-reveal='up'] {
        opacity: 0;
        transform: translateY(40px);
      }

      [data-reveal='left'] {
        opacity: 0;
        transform: translateX(-140px);
      }

      [data-reveal='right'] {
        opacity: 0;
        transform: translateX(140px);
      }

      [data-reveal='fade'] {
        opacity: 0;
      }

      [data-reveal].in-view {
        opacity: 1;
        transform: none;
      }

      .intro {
        max-width: 860px;
        margin-bottom: clamp(72px, 9vw, 112px);
      }

      .kicker {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 24px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--ac-color-action-deep);
      }

      .kicker-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ac-color-action);
      }

      h2 {
        margin: 0;
        font-size: clamp(36px, 6vw, 72px);
        line-height: 1.05;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--ac-color-text-strong);
      }

      .word {
        display: inline-block;
        white-space: nowrap;
        margin-right: 0.25em;
      }

      .char {
        display: inline-block;
        opacity: 0;
        transform: translateY(0.4em);
        transition:
          opacity 500ms var(--ease),
          transform 500ms var(--ease);
        transition-delay: calc(var(--c) * 25ms);
      }

      .chars.in-view .char {
        opacity: 1;
        transform: none;
      }

      .lead {
        margin: 32px 0 0;
        max-width: 640px;
        font-size: 18px;
        line-height: 1.65;
        color: var(--ac-color-text-muted);
      }

      .values {
        display: grid;
        gap: clamp(80px, 9vw, 112px);
      }

      .value {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: center;
        gap: clamp(40px, 5vw, 64px);
      }

      .value.reversed .panel {
        order: 2;
      }

      /* Photo panel; zooms slightly when the row is hovered. */
      .panel {
        position: relative;
        height: clamp(320px, 36vw, 440px);
        border-radius: 14px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        overflow: hidden;
      }

      .art {
        position: absolute;
        inset: 0;
        transition: transform 700ms ease-out;
      }

      .photo {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .value:hover .art {
        transform: scale(1.05);
      }

      /* A soft fade at the bottom, like light over a photo. */
      .panel::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to top,
          color-mix(in srgb, var(--ac-color-action-deep) 14%, transparent),
          transparent 45%
        );
        pointer-events: none;
      }

      .badge {
        position: absolute;
        top: 20px;
        left: 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1;
      }

      .badge-icon {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--ac-color-action) 25%, transparent);
        background: color-mix(in srgb, var(--ac-color-surface) 75%, transparent);
        backdrop-filter: blur(8px);
        color: var(--ac-color-action-deep);
      }

      .num {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 14px;
        letter-spacing: 0.18em;
        color: var(--ac-color-action-deep);
      }

      .content h3 {
        margin: 0 0 24px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--ac-color-text-muted);
      }

      .headline {
        margin: 0 0 32px;
        max-width: 560px;
        font-size: clamp(26px, 3vw, 38px);
        line-height: 1.18;
        font-weight: 600;
        letter-spacing: -0.01em;
        color: var(--ac-color-text-strong);
      }

      .details {
        display: grid;
        gap: 20px;
        max-width: 560px;
      }

      .details p {
        margin: 0;
        font-size: 15px;
        line-height: 1.7;
        color: var(--ac-color-text-body);
      }

      .topics {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 32px 0 0;
        padding: 0;
        list-style: none;
      }

      .topics li {
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--ac-color-text-muted);
      }

      @media (max-width: 1023px) {
        .value,
        .value.reversed {
          grid-template-columns: minmax(0, 1fr);
        }

        .value.reversed .panel {
          order: 0;
        }

        /* Sliding 140px sideways would push past a narrow screen. */
        [data-reveal='left'],
        [data-reveal='right'] {
          transform: translateY(40px);
        }
      }

      @media (max-width: 720px) {
        :host {
          padding: 64px var(--lp-x, clamp(16px, 4vw, 48px));
        }

        .panel {
          height: 260px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        [data-reveal],
        .char,
        .art {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutismValuesComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly lang = input<Lang>('en');

  protected readonly copy = computed(() => COPY[this.lang()]);
  protected readonly headingParts = computed(() => splitHeading(this.copy().heading));
  /** Running character position across words, for the stagger delay. */
  private readonly offsets = computed(() => {
    let total = 0;
    return this.headingParts().map((word) => {
      const start = total;
      total += word.length;
      return start;
    });
  });

  constructor() {
    afterNextRender(() => this.observe());
  }

  protected charIndex(word: number, char: number): number {
    return (this.offsets()[word] ?? 0) + char;
  }

  protected number(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected photoUrl(index: number): string {
    return `/images/photo${this.number(index)}.webp`;
  }

  /** Each [data-reveal] element settles the first time it is on screen. */
  private observe(): void {
    const targets = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('[data-reveal]'),
    );
    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('in-view'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );
    targets.forEach((el) => observer.observe(el));
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
