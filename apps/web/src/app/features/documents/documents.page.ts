import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { PARENT_GUIDES } from './parent-guides.data';

type Shelf = {
  readonly key: string;
  readonly title: string;
  readonly body: string;
  readonly path: string;
  readonly cta: string;
};

const COPY = {
  en: {
    eyebrow: 'Documents',
    title: 'Everything you have collected',
    subtitle:
      'Schools, hospitals, activities and appointments in one place, instead of scattered across the app.',
    guidesTitle: 'Guides to read',
    guidesIntro:
      'Free guides from trusted organisations. They are in English and open on the publisher’s website.',
    guideCta: 'Open guide (new tab)',
    shelves: [
      {
        key: 'school',
        title: 'School',
        body: 'Schools you have saved, admission requests, and the reports staff have written about your child.',
        path: '/schools',
        cta: 'Open school',
      },
      {
        key: 'hospital',
        title: 'Hospital',
        body: 'Hospitals and specialists near you, and every appointment your family has had.',
        path: '/hospitals',
        cta: 'Open hospital',
      },
      {
        key: 'activities',
        title: 'Activities',
        body: 'Play ideas that suit your child’s age, what you have tried, and what your child responded to.',
        path: '/activities',
        cta: 'Open activities',
      },
      {
        key: 'book',
        title: 'Book',
        body: 'Request an appointment in three steps: choose a hospital, choose a specialist, choose a time.',
        path: '/appointments',
        cta: 'Book an appointment',
      },
    ],
  },
  km: {
    eyebrow: 'ឯកសារ',
    title: 'អ្វីៗដែលអ្នកបានប្រមូលទុក',
    subtitle:
      'សាលារៀន មន្ទីរពេទ្យ សកម្មភាព និងការណាត់ជួប នៅកន្លែងតែមួយ ជំនួសឱ្យការខ្ចាត់ខ្ចាយពេញក្នុងកម្មវិធី។',
    guidesTitle: 'ឯកសារណែនាំសម្រាប់អាន',
    guidesIntro:
      'ឯកសារណែនាំឥតគិតថ្លៃពីអង្គការដែលគួរឱ្យទុកចិត្ត។ ឯកសារទាំងនេះជាភាសាអង់គ្លេស ហើយបើកនៅលើគេហទំព័ររបស់អ្នកបោះពុម្ព។',
    guideCta: 'បើកឯកសារ (ផ្ទាំងថ្មី)',
    shelves: [
      {
        key: 'school',
        title: 'សាលារៀន',
        body: 'សាលាដែលអ្នកបានរក្សាទុក សំណើចូលរៀន និងរបាយការណ៍ដែលគ្រូបានសរសេរអំពីកូនរបស់អ្នក។',
        path: '/schools',
        cta: 'បើកសាលារៀន',
      },
      {
        key: 'hospital',
        title: 'មន្ទីរពេទ្យ',
        body: 'មន្ទីរពេទ្យ និងអ្នកជំនាញនៅជិតអ្នក ព្រមទាំងការណាត់ជួបទាំងអស់របស់គ្រួសារ។',
        path: '/hospitals',
        cta: 'បើកមន្ទីរពេទ្យ',
      },
      {
        key: 'activities',
        title: 'សកម្មភាព',
        body: 'គំនិតលេងដែលសមស្របតាមអាយុកូន អ្វីដែលអ្នកបានសាកល្បង និងអ្វីដែលកូនឆ្លើយតប។',
        path: '/activities',
        cta: 'បើកសកម្មភាព',
      },
      {
        key: 'book',
        title: 'កក់ណាត់ជួប',
        body: 'ស្នើសុំការណាត់ជួបក្នុងបីជំហាន៖ ជ្រើសមន្ទីរពេទ្យ ជ្រើសអ្នកជំនាញ ជ្រើសពេលវេលា។',
        path: '/appointments',
        cta: 'កក់ណាត់ជួប',
      },
    ],
  },
};

/**
 * The Documents hub: four shelves, each one a door to a screen that already
 * existed. Nothing was rebuilt to make this page — which is the point of the
 * restructure. The app was organised by feature; it is now organised by what the
 * parent is looking for.
 *
 * Below the shelves, a reading list of free guides from trusted publishers
 * (parent-guides.data.ts). Each one links out to the publisher's own copy.
 */
@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="page-head">
      <p class="eyebrow">{{ copy().eyebrow }}</p>
      <h1>{{ copy().title }}</h1>
      <p class="subtitle">{{ copy().subtitle }}</p>
    </header>

    <div class="shelves">
      @for (shelf of shelves(); track shelf.key) {
        <a class="shelf" [routerLink]="shelf.path" [attr.aria-label]="shelf.title">
          <span class="shelf-icon" [class]="shelf.key" aria-hidden="true"></span>
          <h2>{{ shelf.title }}</h2>
          <p>{{ shelf.body }}</p>
          <span class="cta">{{ shelf.cta }} →</span>
        </a>
      }
    </div>

    <section class="guides" aria-labelledby="guides-heading">
      <h2 id="guides-heading" class="guides-title">{{ copy().guidesTitle }}</h2>
      <p class="subtitle">{{ copy().guidesIntro }}</p>

      <ul class="guide-list">
        @for (guide of guides(); track guide.id) {
          <li class="guide">
            <p class="guide-topic">{{ guide.topic }}</p>
            <h3>{{ guide.title }}</h3>
            <p class="guide-source">
              {{ guide.publisher }}
              @if (guide.year) {
                · {{ guide.year }}
              }
            </p>
            <p>{{ guide.summary }}</p>
            <a class="cta" [href]="guide.url" target="_blank" rel="noopener noreferrer">
              {{ copy().guideCta }} →
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-head {
        margin-bottom: 26px;
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

      .subtitle {
        margin: 0;
        max-width: 62ch;
        color: var(--ac-color-text-muted);
        line-height: 1.6;
      }

      .shelves {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 18px;
      }

      .shelf {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 24px 22px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        box-shadow: var(--ac-shadow-xs);
        text-decoration: none;
        color: inherit;
        transition:
          transform var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .shelf:hover {
        transform: translateY(-2px);
        border-color: var(--ac-color-action);
        box-shadow: var(--ac-shadow-sm);
      }

      .shelf:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      h2 {
        margin: 6px 0 0;
        font-size: var(--ac-type-card-title);
        color: var(--ac-color-text-strong);
      }

      p {
        margin: 0;
        flex: 1;
        color: var(--ac-color-text-muted);
        line-height: 1.6;
        font-size: var(--ac-type-body);
      }

      .cta {
        margin-top: 6px;
        font-weight: 700;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-action);
      }

      .shelf-icon {
        width: 38px;
        height: 38px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-blue-surface-soft);
        position: relative;
      }

      .shelf-icon::before,
      .shelf-icon::after {
        content: '';
        position: absolute;
        box-sizing: border-box;
      }

      /* A simple shelf-mark per card keeps the four doors distinguishable
         without depending on an icon font. */
      .shelf-icon.school::before {
        inset: 12px 9px 10px;
        border: 2px solid var(--ac-color-action-deep);
        border-radius: 2px;
      }

      .shelf-icon.hospital::before {
        inset: 9px;
        border: 2px solid var(--ac-color-action-deep);
        border-radius: 3px;
      }

      .shelf-icon.hospital::after {
        left: 17px;
        top: 12px;
        width: 2px;
        height: 14px;
        background: var(--ac-color-action-deep);
        box-shadow: -5px 5px 0 0 var(--ac-color-action-deep);
      }

      .shelf-icon.activities::before {
        left: 17px;
        top: 10px;
        width: 3px;
        height: 18px;
        border-radius: 2px;
        background: var(--ac-color-action-deep);
      }

      .shelf-icon.activities::after {
        left: 10px;
        top: 17px;
        width: 18px;
        height: 3px;
        border-radius: 2px;
        background: var(--ac-color-action-deep);
      }

      .shelf-icon.book::before {
        inset: 10px 11px;
        border: 2px solid var(--ac-color-action-deep);
        border-radius: 2px;
      }

      .shelf-icon.book::after {
        left: 18px;
        top: 10px;
        width: 2px;
        height: 18px;
        background: var(--ac-color-action-deep);
      }

      .guides {
        margin-top: 40px;
      }

      .guides-title {
        margin: 0 0 8px;
        font-size: var(--ac-type-section-title);
      }

      .guide-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
        margin: 20px 0 0;
        padding: 0;
        list-style: none;
      }

      .guide {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 22px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
      }

      .guide h3 {
        margin: 0;
        font-size: var(--ac-type-card-title);
        color: var(--ac-color-text-strong);
        line-height: 1.35;
      }

      .guide .guide-topic {
        flex: none;
        font-size: var(--ac-type-label);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--ac-color-action);
      }

      .guide .guide-source {
        flex: none;
        font-size: var(--ac-type-meta);
      }

      .guide .cta {
        align-self: flex-start;
        text-decoration: none;
      }

      .guide .cta:hover {
        text-decoration: underline;
      }

      .guide .cta:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
        border-radius: 2px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsPage {
  private readonly i18n = inject(I18nService);

  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);
  protected readonly shelves = computed<readonly Shelf[]>(() => this.copy().shelves);
  protected readonly guides = computed(() => {
    const isKm = this.i18n.currentLang() === 'km';
    return PARENT_GUIDES.map((guide) => ({
      ...guide,
      topic: isKm ? guide.topicKm : guide.topicEn,
      summary: isKm ? guide.summaryKm : guide.summaryEn,
    }));
  });
}
