import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type AboutUsLanguage = 'en' | 'km';

const COPY = {
  en: {
    label: 'ABOUT AUTICARE',
    heading: 'Every Child Deserves to Be Understood.',
    paragraphs: [
      'AutiCare is a Cambodian startup supporting families of children with autism and developmental differences through helpful tools, educational resources, and AI guidance.',
    ],
    missionTitle: 'Our Mission',
    mission: 'Make child-development support accessible to every family in Cambodia.',
    visionTitle: 'Our Vision',
    vision:
      'A future where every child is understood, supported, and given the opportunity to grow.',
    valuesTitle: 'Our Values',
    values: [
      {
        title: 'Compassion',
        description: 'Supporting families with care and understanding.',
        icon: '♡',
      },
      {
        title: 'Accessibility',
        description: 'Making helpful resources easier to access.',
        icon: '◎',
      },
      {
        title: 'Collaboration',
        description: 'Connecting parents, teachers, and professionals.',
        icon: '↗',
      },
    ],
    imageAlt: 'AutiCare welcome screen and family dashboard displayed on two phones',
  },
  km: {
    label: 'អំពី AUTICARE',
    heading: 'កុមារគ្រប់រូបសមនឹងទទួលបានការយល់ចិត្ត។',
    paragraphs: [
      'AutiCare គឺជាអាជីវកម្មបង្កើតថ្មីនៅកម្ពុជា ដែលមានគោលបំណងជួយគ្រួសារដែលមានកូនអូទីស្សឹម និងកុមារដែលមានភាពខុសគ្នាក្នុងការអភិវឌ្ឍ តាមរយៈឧបករណ៍ជំនួយ ធនធានអប់រំ និងការណែនាំដោយ AI។',
    ],
    missionTitle: 'បេសកកម្មរបស់យើង',
    mission: 'ធ្វើឱ្យការគាំទ្រការអភិវឌ្ឍរបស់កុមារកាន់តែងាយស្រួលទទួលបានសម្រាប់គ្រួសារនៅកម្ពុជា។',
    visionTitle: 'ចក្ខុវិស័យរបស់យើង',
    vision: 'អនាគតមួយដែលកុមារគ្រប់រូបទទួលបានការយល់ចិត្ត ការគាំទ្រ និងឱកាសក្នុងការរីកចម្រើន។',
    valuesTitle: 'គុណតម្លៃរបស់យើង',
    values: [
      {
        title: 'ការយកចិត្តទុកដាក់',
        description: 'គាំទ្រគ្រួសារដោយក្តីស្រឡាញ់ និងការយល់ចិត្ត។',
        icon: '♡',
      },
      {
        title: 'ភាពងាយស្រួលក្នុងការទទួលបាន',
        description: 'ធ្វើឱ្យធនធានមានប្រយោជន៍កាន់តែងាយស្រួលទទួលបាន។',
        icon: '◎',
      },
      {
        title: 'កិច្ចសហការ',
        description: 'ភ្ជាប់ឪពុកម្តាយ គ្រូបង្រៀន និងអ្នកជំនាញ។',
        icon: '↗',
      },
    ],
    imageAlt: 'អេក្រង់ស្វាគមន៍ និងផ្ទាំងគ្រប់គ្រងគ្រួសារ AutiCare នៅលើទូរសព្ទពីរ',
  },
} as const;

@Component({
  selector: 'section[acAboutUs]',
  standalone: true,
  host: {
    class: 'about-us-section',
    'aria-labelledby': 'about-us-title',
  },
  template: `
    <div class="inner">
      <div class="overview">
        <div class="copy">
          <p class="eyebrow">{{ content().label }}</p>
          <h2 id="about-us-title">{{ content().heading }}</h2>
          @for (paragraph of content().paragraphs; track $index) {
            <p class="description">{{ paragraph }}</p>
          }

          <div class="purpose-grid">
            <article class="purpose-card">
              <h3>{{ content().missionTitle }}</h3>
              <p>{{ content().mission }}</p>
            </article>
            <article class="purpose-card">
              <h3>{{ content().visionTitle }}</h3>
              <p>{{ content().vision }}</p>
            </article>
          </div>
        </div>

        <figure class="photo-frame">
          <img
            src="/mobile.png"
            [alt]="content().imageAlt"
            width="1380"
            height="1140"
            loading="lazy"
            decoding="async"
          />
        </figure>
      </div>

      <section class="values" aria-labelledby="about-values-title">
        <h3 id="about-values-title">{{ content().valuesTitle }}</h3>
        <div class="value-grid">
          @for (value of content().values; track value.title) {
            <article class="value-card">
              <span class="value-icon" aria-hidden="true">{{ value.icon }}</span>
              <div>
                <h4>{{ value.title }}</h4>
                <p>{{ value.description }}</p>
              </div>
            </article>
          }
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: clamp(64px, 7vw, 96px) var(--lp-x, clamp(16px, 4vw, 48px));
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .inner {
        max-width: var(--lp-max, 1280px);
        margin: 0 auto;
      }

      .overview {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
        align-items: center;
        gap: clamp(32px, 5vw, 72px);
      }

      .copy {
        min-width: 0;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        margin: 0 0 14px;
        color: var(--ac-color-action);
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
        letter-spacing: 0.12em;
        line-height: 1.4;
        text-transform: uppercase;
      }

      .eyebrow::before {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ac-color-action);
        content: '';
      }

      h2,
      h3,
      h4,
      p {
        margin: 0;
      }

      h2 {
        max-width: 18ch;
        margin-bottom: 18px;
        color: var(--ac-color-text-strong);
        font-size: clamp(32px, 3.6vw, 48px);
        font-weight: var(--ac-font-weight-bold);
        letter-spacing: -0.035em;
        line-height: 1.12;
      }

      .description {
        max-width: 66ch;
        margin-top: 12px;
        color: var(--ac-color-text-body);
        font-size: 15px;
        line-height: 1.7;
      }

      .purpose-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 24px;
      }

      .purpose-card {
        padding: 18px;
        border: 1px solid var(--ac-color-border-info);
        border-radius: 16px;
        background: var(--ac-color-surface-info);
      }

      .purpose-card h3 {
        margin-bottom: 8px;
        color: var(--ac-color-action-deep);
        font-size: 16px;
        font-weight: var(--ac-font-weight-bold);
      }

      .purpose-card p {
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: 1.55;
      }

      .photo-frame {
        position: relative;
        isolation: isolate;
        min-width: 0;
        height: min(100%, 560px);
        min-height: 440px;
        margin: 0;
        overflow: visible;
      }

      .photo-frame::before {
        position: absolute;
        z-index: 0;
        right: 14%;
        bottom: 1%;
        left: 14%;
        height: 8%;
        border-radius: 50%;
        background: color-mix(in srgb, var(--ac-color-action) 28%, transparent);
        filter: blur(24px);
        opacity: 0.28;
        transform: scaleX(0.9);
        content: '';
        pointer-events: none;
        animation: phone-shadow 7.5s ease-in-out infinite;
      }

      .photo-frame img {
        position: relative;
        z-index: 1;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        filter: drop-shadow(
          0 22px 20px color-mix(in srgb, var(--ac-color-action-deep) 24%, transparent)
        );
        transform-origin: center 78%;
        animation: phone-float 8s ease-in-out infinite;
        will-change: transform;
      }

      @keyframes phone-float {
        0%,
        100% {
          transform: translate3d(0, 0, 0) rotate(-0.4deg);
        }
        50% {
          transform: translate3d(0, -8px, 0) rotate(0.4deg);
        }
      }

      @keyframes phone-shadow {
        0%,
        100% {
          opacity: 0.24;
          transform: scaleX(0.82);
        }
        50% {
          opacity: 0.36;
          transform: scaleX(1.04);
        }
      }

      .values {
        margin-top: clamp(40px, 5vw, 64px);
      }

      .values > h3 {
        margin-bottom: 16px;
        color: var(--ac-color-text-strong);
        font-size: 20px;
        font-weight: var(--ac-font-weight-bold);
      }

      .value-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .value-card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        min-width: 0;
        padding: 18px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 16px;
        background: var(--ac-color-surface);
        box-shadow: 0 8px 24px color-mix(in srgb, var(--ac-color-action-deep) 5%, transparent);
      }

      .value-icon {
        display: grid;
        flex: 0 0 38px;
        width: 38px;
        height: 38px;
        place-items: center;
        border-radius: 12px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
        font-size: 24px;
        line-height: 1;
      }

      .value-card h4 {
        margin: 1px 0 5px;
        color: var(--ac-color-text-strong);
        font-size: 15px;
        font-weight: var(--ac-font-weight-bold);
      }

      .value-card p {
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: 1.55;
      }

      @media (max-width: 900px) {
        .overview {
          grid-template-columns: minmax(0, 1fr) minmax(260px, 0.8fr);
          gap: 28px;
        }

        .photo-frame {
          min-height: 390px;
        }

        .purpose-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }

      @media (max-width: 680px) {
        :host {
          padding-top: 56px;
          padding-bottom: 56px;
        }

        .overview {
          grid-template-columns: minmax(0, 1fr);
          gap: 24px;
        }

        h2 {
          font-size: clamp(30px, 8vw, 40px);
        }

        .photo-frame {
          order: -1;
          height: auto;
          min-height: 0;
          aspect-ratio: 1380 / 1140;
        }

        .photo-frame::before {
          right: 17%;
          left: 17%;
          filter: blur(16px);
        }

        .purpose-grid {
          grid-template-columns: minmax(0, 1fr);
          margin-top: 18px;
        }

        .purpose-card {
          padding: 16px;
        }

        .values {
          margin-top: 36px;
        }

        .values > h3 {
          font-size: 18px;
        }

        .value-grid {
          grid-template-columns: minmax(0, 1fr);
          gap: 10px;
        }

        .value-card {
          padding: 16px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .photo-frame img,
        .photo-frame::before {
          animation: none;
          will-change: auto;
        }

        .photo-frame img {
          transform: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutUsComponent {
  readonly lang = input<AboutUsLanguage>('en');
  protected readonly content = () => COPY[this.lang()];
}
