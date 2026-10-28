import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavIconComponent } from '../../../core/layout/nav-icon.component';

type Lang = 'en' | 'km';

const COPY = {
  en: {
    heading: 'From noticing to support. One family at a time.',
    lead: 'AutiCare helps families in Cambodia through the weeks between first noticing something and being seen by a specialist.',
    blocks: [
      {
        title: 'AutiCare for families',
        sub: 'A calm companion for parents, in Khmer and English, from the first question onwards.',
      },
      {
        title: 'Our journey',
        sub: 'How AutiCare grew from one worried question into a place where families, schools and care teams meet.',
      },
      {
        title: 'Safe by design',
        sub: 'Children’s information is sensitive. AutiCare is built so families stay in control.',
      },
      {
        title: 'For schools and clinics',
        sub: 'Verified schools and care teams work alongside families, with the parent’s consent at every step.',
      },
    ],
    family: {
      badge: 'AutiCare',
      title: 'Built for the weeks between noticing and being seen',
      text: 'A three-minute check-in, daily notes that show patterns, and calm answers to the questions that keep parents awake.',
      cta: 'Create a free account',
      tiles: [
        ['Khmer and English', 'Every screen, both languages'],
        ['Not a diagnosis', 'Educational guidance only'],
        ['Private by default', 'You choose what is shared'],
      ],
    },
    journey: [
      {
        step: 'Step 1',
        title: 'The waiting gap',
        text: 'Many parents notice something early, then wait weeks or months to see a specialist, with little to go on.',
        icon: 'help',
      },
      {
        step: 'Step 2',
        title: 'Families first',
        text: 'AutiCare began with parents: a short check-in, daily notes and careful answers in their own language.',
        icon: 'family',
      },
      {
        step: 'Step 3',
        title: 'Schools join in',
        text: 'With a parent’s consent, teachers share progress reports, so home and school see the same picture.',
        icon: 'school',
      },
      {
        step: 'Step 4',
        title: 'Care teams connect',
        text: 'Hospitals and clinics manage appointment requests, and families arrive with dated notes.',
        icon: 'hospital',
      },
    ],
    safety: {
      kicker: 'What matters most',
      title: ['Your child’s story', 'stays yours'],
      text: 'Families decide who sees what. AutiCare gives educational guidance, never a diagnosis, and every important change is recorded.',
      points: [
        [
          'Parents decide what is shared',
          'A school sees a child only after the parent connects it with a code and agrees. Parents can stop sharing at any time.',
        ],
        [
          'Educational, never diagnostic',
          'The check-in and the AI assistant guide and explain. They never diagnose, prescribe or replace a professional.',
        ],
        [
          'Accountable access',
          'The AutiCare team sees counts, not children’s records, and important actions are kept in an audit log.',
        ],
      ],
      footer: 'Privacy first',
    },
    partners: {
      window: 'AutiCare for schools',
      nav: 'Navigation',
      items: ['Overview', 'Students', 'Progress reports'],
      active: 'Teachers & staff',
      section: 'What schools get',
      bullets: [
        'Teacher accounts with a username and a one-time setup code',
        'Progress reports shared with parents who agreed',
        'Five sponsored Pro accounts for families with the Business plan',
      ],
      status: 'Every school is verified by the AutiCare team before it opens.',
    },
  },
  km: {
    heading: 'ពីការកត់សម្គាល់ ដល់ការគាំទ្រ។ គ្រួសារម្តងមួយៗ។',
    lead: 'AutiCare ជួយគ្រួសារនៅកម្ពុជា ក្នុងអំឡុងពេលចាប់ពីការកត់សម្គាល់ឃើញអ្វីមួយ រហូតដល់ការជួបអ្នកជំនាញ។',
    blocks: [
      {
        title: 'AutiCare សម្រាប់គ្រួសារ',
        sub: 'ដៃគូដ៏ស្ងប់ស្ងាត់សម្រាប់ឪពុកម្តាយ ជាភាសាខ្មែរ និងអង់គ្លេស ចាប់ពីសំណួរដំបូង។',
      },
      {
        title: 'ដំណើររបស់យើង',
        sub: 'របៀបដែល AutiCare រីកចម្រើនពីសំណួរព្រួយបារម្ភមួយ ទៅជាកន្លែងដែលគ្រួសារ សាលា និងក្រុមថែទាំជួបគ្នា។',
      },
      {
        title: 'សុវត្ថិភាពតាំងពីការរចនា',
        sub: 'ព័ត៌មានកុមារមានលក្ខណៈរសើប។ AutiCare ត្រូវបានបង្កើតឡើង ដើម្បីឱ្យគ្រួសារនៅតែជាអ្នកគ្រប់គ្រង។',
      },
      {
        title: 'សម្រាប់សាលា និងគ្លីនិក',
        sub: 'សាលា និងក្រុមថែទាំដែលបានផ្ទៀងផ្ទាត់ ធ្វើការជាមួយគ្រួសារ ដោយមានការយល់ព្រមពីឪពុកម្តាយគ្រប់ជំហាន។',
      },
    ],
    family: {
      badge: 'AutiCare',
      title: 'បង្កើតឡើងសម្រាប់ពេលវេលារវាងការកត់សម្គាល់ និងការជួបអ្នកជំនាញ',
      text: 'ការពិនិត្យរយៈពេលបីនាទី កំណត់ត្រាប្រចាំថ្ងៃដែលបង្ហាញលំនាំ និងចម្លើយដ៏ស្ងប់ស្ងាត់ចំពោះសំណួរដែលធ្វើឱ្យឪពុកម្តាយព្រួយបារម្ភ។',
      cta: 'បង្កើតគណនីឥតគិតថ្លៃ',
      tiles: [
        ['ខ្មែរ និងអង់គ្លេស', 'គ្រប់អេក្រង់ ទាំងពីរភាសា'],
        ['មិនមែនរោគវិនិច្ឆ័យ', 'ការណែនាំអប់រំប៉ុណ្ណោះ'],
        ['ឯកជនតាមលំនាំដើម', 'អ្នកជ្រើសរើសអ្វីដែលត្រូវចែករំលែក'],
      ],
    },
    journey: [
      {
        step: 'ជំហាន ១',
        title: 'ពេលរង់ចាំ',
        text: 'ឪពុកម្តាយជាច្រើនកត់សម្គាល់ឃើញអ្វីមួយតាំងពីដំបូង បន្ទាប់មករង់ចាំច្រើនសប្តាហ៍ ឬច្រើនខែ ដើម្បីជួបអ្នកជំនាញ។',
        icon: 'help',
      },
      {
        step: 'ជំហាន ២',
        title: 'គ្រួសារមុនគេ',
        text: 'AutiCare ចាប់ផ្តើមជាមួយឪពុកម្តាយ៖ ការពិនិត្យខ្លី កំណត់ត្រាប្រចាំថ្ងៃ និងចម្លើយដោយប្រុងប្រយ័ត្នជាភាសារបស់ពួកគេ។',
        icon: 'family',
      },
      {
        step: 'ជំហាន ៣',
        title: 'សាលាចូលរួម',
        text: 'ដោយមានការយល់ព្រមពីឪពុកម្តាយ គ្រូចែករំលែករបាយការណ៍វឌ្ឍនភាព ដូច្នេះផ្ទះ និងសាលាមើលឃើញរូបភាពដូចគ្នា។',
        icon: 'school',
      },
      {
        step: 'ជំហាន ៤',
        title: 'ក្រុមថែទាំភ្ជាប់គ្នា',
        text: 'មន្ទីរពេទ្យ និងគ្លីនិកគ្រប់គ្រងសំណើណាត់ជួប ហើយគ្រួសារមកដល់ជាមួយកំណត់ត្រាមានកាលបរិច្ឆេទ។',
        icon: 'hospital',
      },
    ],
    safety: {
      kicker: 'អ្វីដែលសំខាន់បំផុត',
      title: ['រឿងរ៉ាវកូនរបស់អ្នក', 'នៅតែជារបស់អ្នក'],
      text: 'គ្រួសារសម្រេចថាអ្នកណាឃើញអ្វី។ AutiCare ផ្តល់ការណែនាំអប់រំ មិនដែលធ្វើរោគវិនិច្ឆ័យ ហើយរាល់ការផ្លាស់ប្តូរសំខាន់ៗត្រូវបានកត់ត្រា។',
      points: [
        [
          'ឪពុកម្តាយសម្រេចអ្វីដែលត្រូវចែករំលែក',
          'សាលាអាចមើលឃើញកុមារ លុះត្រាតែឪពុកម្តាយភ្ជាប់ដោយកូដ និងយល់ព្រម។ ឪពុកម្តាយអាចឈប់ចែករំលែកបានគ្រប់ពេល។',
        ],
        [
          'អប់រំ មិនមែនរោគវិនិច្ឆ័យ',
          'ការពិនិត្យ និងជំនួយការ AI ណែនាំ និងពន្យល់។ ពួកវាមិនធ្វើរោគវិនិច្ឆ័យ មិនចេញវេជ្ជបញ្ជា និងមិនជំនួសអ្នកជំនាញទេ។',
        ],
        [
          'ការចូលប្រើដែលមានការទទួលខុសត្រូវ',
          'ក្រុម AutiCare ឃើញតែចំនួន មិនមែនកំណត់ត្រាកុមារទេ ហើយសកម្មភាពសំខាន់ៗត្រូវបានរក្សាទុកក្នុងកំណត់ហេតុសវនកម្ម។',
        ],
      ],
      footer: 'ឯកជនភាពមុនគេ',
    },
    partners: {
      window: 'AutiCare សម្រាប់សាលា',
      nav: 'ការរុករក',
      items: ['ទិដ្ឋភាពទូទៅ', 'សិស្ស', 'របាយការណ៍វឌ្ឍនភាព'],
      active: 'គ្រូ និងបុគ្គលិក',
      section: 'អ្វីដែលសាលាទទួលបាន',
      bullets: [
        'គណនីគ្រូដោយប្រើឈ្មោះអ្នកប្រើ និងកូដរៀបចំប្រើតែម្តង',
        'របាយការណ៍វឌ្ឍនភាពចែករំលែកជាមួយឪពុកម្តាយដែលបានយល់ព្រម',
        'គណនី Pro ឧបត្ថម្ភចំនួនប្រាំ សម្រាប់គ្រួសារ ជាមួយគម្រោង Business',
      ],
      status: 'សាលានីមួយៗត្រូវបានផ្ទៀងផ្ទាត់ដោយក្រុម AutiCare មុនពេលបើក។',
    },
  },
} as const;

/**
 * The first section of the About page: a heading that pops in, a line on the
 * left with a dot that travels down it as you scroll, and four blocks, each
 * with a glowing window: the family product, a drawn timeline, the privacy
 * promise with stacked plates, and what schools get. Used as
 * <section acAboutJourney>.
 */
@Component({
  selector: 'section[acAboutJourney]',
  standalone: true,
  imports: [RouterLink, NavIconComponent],
  host: { class: 'journey', 'aria-labelledby': 'journey-title' },
  template: `
    <div class="grid-bg" aria-hidden="true"></div>

    <header class="intro" data-reveal>
      <h1 id="journey-title" class="words">
        @for (word of headingWords(); track $index) {
          <span class="word" [style.--w]="$index">{{ word }}</span>
        }
      </h1>
      <p class="lead">{{ copy().lead }}</p>
    </header>

    <div class="layout">
      <div class="rail" aria-hidden="true">
        <div class="line">
          <span class="ball" [style.--p]="progress()"></span>
        </div>
      </div>

      <div class="blocks">
        @for (block of copy().blocks; track block.title; let i = $index) {
          <article class="block" data-reveal>
            <div class="block-copy">
              <h2>{{ block.title }}</h2>
              <p>{{ block.sub }}</p>
            </div>

            <div class="frame">
              <div class="glow" [attr.data-tone]="i" aria-hidden="true"></div>

              @switch (i) {
                @case (0) {
                  <div class="panel family">
                    <div class="family-top">
                      <div>
                        <span class="badge">
                          <ac-nav-icon name="star" />{{ copy().family.badge }}
                        </span>
                        <h3>{{ copy().family.title }}</h3>
                        <p>{{ copy().family.text }}</p>
                      </div>
                      <a class="cta" routerLink="/register">{{ copy().family.cta }}</a>
                    </div>
                    <div class="tiles">
                      @for (tile of copy().family.tiles; track tile[0]) {
                        <div class="tile">
                          <strong>{{ tile[0] }}</strong>
                          <span>{{ tile[1] }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
                @case (1) {
                  <div class="panel timeline">
                    <div class="columns" aria-hidden="true">
                      @for (c of columns; track c) {
                        <span></span>
                      }
                    </div>

                    <!-- Wide screens: a drawn circuit with milestones on it. -->
                    <div class="circuit">
                      <svg viewBox="0 0 1000 260" preserveAspectRatio="none" aria-hidden="true">
                        <path
                          class="trace"
                          pathLength="1"
                          d="M 0 50 L 250 50 Q 260 50 260 60 L 260 190 Q 260 200 270 200 L 490 200 Q 500 200 500 190 L 500 60 Q 500 50 510 50 L 730 50 Q 740 50 740 60 L 740 190 Q 740 200 750 200 L 1000 200"
                        />
                      </svg>
                      @for (node of copy().journey; track node.title; let n = $index) {
                        <div class="node" [style.--n]="n" [attr.data-pos]="n">
                          <span class="node-icon"><ac-nav-icon [name]="node.icon" /></span>
                          <div class="node-card">
                            <small>{{ node.step }}</small>
                            <strong>{{ node.title }}</strong>
                            <p>{{ node.text }}</p>
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Narrow screens: the same milestones, stacked. -->
                    <ol class="stacked">
                      @for (node of copy().journey; track node.title; let n = $index) {
                        <li [style.--n]="n">
                          <span class="node-icon"><ac-nav-icon [name]="node.icon" /></span>
                          <div class="node-card">
                            <small>{{ node.step }}</small>
                            <strong>{{ node.title }}</strong>
                            <p>{{ node.text }}</p>
                          </div>
                        </li>
                      }
                    </ol>
                  </div>
                }
                @case (2) {
                  <div class="panel safety">
                    <div class="safety-grid">
                      <div class="safety-lead">
                        <small>{{ copy().safety.kicker }}</small>
                        <h3>{{ copy().safety.title[0] }}<br />{{ copy().safety.title[1] }}</h3>
                        <p>{{ copy().safety.text }}</p>
                      </div>
                      <div class="plates" aria-hidden="true">
                        <span class="plate p1"></span>
                        <span class="plate p2"></span>
                        <span class="plate p3"><ac-nav-icon name="shield" /></span>
                      </div>
                      <ul class="points">
                        @for (point of copy().safety.points; track point[0]) {
                          <li>
                            <span class="point-icon"><ac-nav-icon name="check" /></span>
                            <div>
                              <strong>{{ point[0] }}</strong>
                              <p>{{ point[1] }}</p>
                            </div>
                          </li>
                        }
                      </ul>
                    </div>
                    <footer class="safety-foot">
                      <span class="dots" aria-hidden="true"
                        ><i></i><i></i><i></i><i></i><i></i><i></i
                      ></span>
                      <span>{{ copy().safety.footer }}</span>
                    </footer>
                  </div>
                }
                @case (3) {
                  <div class="panel window">
                    <header class="window-bar">
                      <span class="light"></span><span class="light"></span
                      ><span class="light"></span>
                      <span class="window-title"
                        ><ac-nav-icon name="school" />{{ copy().partners.window }}</span
                      >
                      <span class="spacer"></span>
                    </header>
                    <div class="window-body">
                      <nav class="side" aria-hidden="true">
                        <small>{{ copy().partners.nav }}</small>
                        @for (item of copy().partners.items; track item) {
                          <span>{{ item }}</span>
                        }
                        <span class="current"><i></i>{{ copy().partners.active }}</span>
                      </nav>
                      <div class="detail">
                        <small>{{ copy().partners.section }}</small>
                        <ul>
                          @for (bullet of copy().partners.bullets; track bullet; let b = $index) {
                            <li [style.--n]="b"><i></i>{{ bullet }}</li>
                          }
                        </ul>
                      </div>
                    </div>
                    <footer class="window-foot">{{ copy().partners.status }}</footer>
                  </div>
                }
              }
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
        position: relative;
        --ease: cubic-bezier(0.22, 1, 0.36, 1);
        --pop: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        padding: 140px var(--lp-x, clamp(16px, 4vw, 48px)) 112px;
        background: var(--ac-color-surface);
        /* clip, not hidden, so the sticky rail keeps working. */
        overflow: clip;
      }

      .grid-bg {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(to right, var(--ac-color-border-slate) 1px, transparent 1px),
          linear-gradient(to bottom, var(--ac-color-border-slate) 1px, transparent 1px);
        background-size: 4rem 4rem;
        opacity: 0.5;
        mask-image: radial-gradient(
          ellipse 60% 50% at 50% 0%,
          var(--ac-color-ink-a) 70%,
          transparent 100%
        );
        pointer-events: none;
      }

      /* Header pops up from small, with a slight overshoot. */
      .intro {
        position: relative;
        max-width: 900px;
        margin: 0 auto 88px;
        text-align: center;
        opacity: 0;
        transform: translateY(48px) scale(0.5);
        transition:
          opacity 700ms var(--pop),
          transform 700ms var(--pop);
      }

      .intro.in-view {
        opacity: 1;
        transform: none;
      }

      h1 {
        margin: 0 0 24px;
        font-size: clamp(32px, 5.2vw, 64px);
        line-height: 1.08;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--ac-color-text-strong);
      }

      .word {
        display: inline-block;
        margin-right: 0.26em;
        opacity: 0;
        transform: translateY(0.4em);
        transition:
          opacity 600ms var(--ease),
          transform 600ms var(--ease);
        transition-delay: calc(250ms + var(--w) * 70ms);
      }

      .in-view .word {
        opacity: 1;
        transform: none;
      }

      .lead {
        margin: 0 auto;
        max-width: 680px;
        font-size: clamp(17px, 1.6vw, 20px);
        line-height: 1.65;
        color: var(--ac-color-text-muted);
      }

      .layout {
        position: relative;
        display: grid;
        grid-template-columns: 120px minmax(0, 1fr);
        gap: 48px;
      }

      /* A line with a dot that moves down it as the section scrolls by. */
      .rail {
        position: sticky;
        top: 160px;
        align-self: start;
        height: calc(100vh - 16rem);
        display: flex;
        justify-content: center;
      }

      .line {
        position: relative;
        width: 1px;
        height: 100%;
        background: var(--ac-color-border-slate);
      }

      .ball {
        position: absolute;
        left: 50%;
        top: calc(var(--p, 0) * (100% - 14px));
        width: 14px;
        height: 14px;
        margin-left: -7px;
        border-radius: 50%;
        background: var(--ac-color-action);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--ac-color-action) 22%, transparent);
      }

      .blocks {
        display: grid;
        gap: 128px;
        min-width: 0;
      }

      .block {
        display: grid;
        gap: 40px;
        min-width: 0;
      }

      .block-copy {
        max-width: 720px;
        opacity: 0;
        transform: translateY(24px);
        transition:
          opacity 700ms var(--ease),
          transform 700ms var(--ease);
      }

      .block.in-view .block-copy {
        opacity: 1;
        transform: none;
      }

      .block-copy h2 {
        margin: 0;
        font-size: clamp(28px, 3.2vw, 38px);
        line-height: 1.15;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--ac-color-text-strong);
      }

      .block-copy p {
        margin: 16px 0 0;
        max-width: 640px;
        font-size: 18px;
        line-height: 1.6;
        color: var(--ac-color-text-muted);
      }

      .frame {
        position: relative;
        min-width: 0;
        opacity: 0;
        transform: translateY(40px) scale(0.98);
        transition:
          opacity 800ms var(--ease) 150ms,
          transform 800ms var(--ease) 150ms;
      }

      .block.in-view .frame {
        opacity: 1;
        transform: none;
      }

      /* Soft colour behind each window. */
      .glow {
        position: absolute;
        inset: -2px;
        border-radius: 18px;
        filter: blur(24px);
        opacity: 0.35;
        background: linear-gradient(135deg, var(--ac-brand-300), var(--ac-brand-mint));
      }

      .glow[data-tone='1'] {
        background: linear-gradient(135deg, var(--ac-brand-200), var(--ac-color-blue-tint-sky));
      }

      .glow[data-tone='2'] {
        background: linear-gradient(135deg, var(--ac-color-amber-tint-cream), var(--ac-brand-200));
      }

      .glow[data-tone='3'] {
        background: linear-gradient(135deg, var(--ac-brand-mint), var(--ac-brand-200));
      }

      .panel {
        position: relative;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 16px;
        background: var(--ac-color-surface);
        box-shadow: 0 30px 60px -36px
          color-mix(in srgb, var(--ac-color-action-deep) 40%, transparent);
        overflow: hidden;
      }

      small {
        display: block;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--ac-color-text-muted);
      }

      /* 1 · Family product card */
      .family {
        display: grid;
        gap: 32px;
        padding: clamp(24px, 3vw, 36px);
        min-height: 340px;
        background:
          radial-gradient(circle at 0% 100%, var(--ac-brand-50), transparent 40%),
          var(--ac-color-surface);
      }

      .family-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        flex-wrap: wrap;
      }

      .family-top > div {
        max-width: 620px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 5px 12px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-slate);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: var(--ac-color-text-muted);
      }

      .badge ac-nav-icon {
        width: 14px;
        height: 14px;
        color: var(--ac-color-action);
      }

      .family h3 {
        margin: 18px 0 0;
        font-size: clamp(24px, 2.8vw, 34px);
        line-height: 1.2;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .family p {
        margin: 14px 0 0;
        font-size: 16px;
        line-height: 1.65;
        color: var(--ac-color-text-body);
      }

      .cta {
        display: inline-flex;
        align-items: center;
        height: 48px;
        padding: 0 22px;
        border-radius: 10px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
        box-shadow: 0 18px 40px -18px
          color-mix(in srgb, var(--ac-color-action-deep) 60%, transparent);
        transition:
          background 200ms ease,
          transform 200ms ease;
      }

      .cta:hover {
        background: var(--ac-color-action-deep);
        transform: translateY(-1px);
      }

      .cta:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 3px;
      }

      .tiles {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .tile {
        display: grid;
        gap: 4px;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
      }

      .tile strong {
        font-size: 14px;
        color: var(--ac-color-text-strong);
      }

      .tile span {
        font-size: 14px;
        line-height: 1.5;
        color: var(--ac-color-text-muted);
      }

      /* 2 · Timeline */
      .timeline {
        min-height: 520px;
      }

      .columns {
        position: absolute;
        inset: 0;
        display: flex;
        justify-content: space-between;
        padding: 0 40px;
        opacity: 0.6;
        pointer-events: none;
      }

      .columns span {
        width: 1px;
        background: var(--ac-color-border-slate);
      }

      .circuit {
        position: relative;
        margin: 40px auto 0;
        width: 100%;
        max-width: 1000px;
        height: 480px;
      }

      .circuit svg {
        position: absolute;
        inset: 0 0 auto;
        width: 100%;
        height: 260px;
      }

      .trace {
        fill: none;
        stroke: color-mix(in srgb, var(--ac-color-action) 55%, transparent);
        stroke-width: 2;
        vector-effect: non-scaling-stroke;
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        transition: stroke-dashoffset 2000ms ease-in-out 200ms;
      }

      .block.in-view .trace {
        stroke-dashoffset: 0;
      }

      .node {
        position: absolute;
        width: 24%;
        translate: -50% 0;
        margin-top: -24px;
      }

      .node[data-pos='0'] {
        left: 14%;
        top: 50px;
      }

      .node[data-pos='1'] {
        left: 38%;
        top: 200px;
      }

      .node[data-pos='2'] {
        left: 62%;
        top: 50px;
      }

      .node[data-pos='3'] {
        left: 86%;
        top: 200px;
      }

      .node-icon {
        position: relative;
        z-index: 1;
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        margin: 0 auto;
        border-radius: 12px;
        border: 1px solid var(--ac-color-border-slate);
        background: linear-gradient(to bottom, var(--ac-color-surface), var(--ac-brand-50));
        color: var(--ac-color-action-deep);
        box-shadow: 0 10px 24px -14px
          color-mix(in srgb, var(--ac-color-action-deep) 50%, transparent);
        opacity: 0;
        transform: scale(0.5);
        transition:
          opacity 400ms var(--ease),
          transform 400ms var(--pop);
        transition-delay: calc(var(--n) * 400ms);
      }

      .node-card {
        position: relative;
        margin-top: 24px;
        padding: 16px 18px;
        border-radius: 12px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        box-shadow: 0 18px 40px -28px
          color-mix(in srgb, var(--ac-color-action-deep) 45%, transparent);
        opacity: 0;
        transform: translateY(20px);
        transition:
          opacity 500ms var(--ease),
          transform 500ms var(--ease),
          border-color 200ms ease;
        transition-delay: calc(var(--n) * 400ms + 200ms);
      }

      .node-card::before {
        content: '';
        position: absolute;
        left: 50%;
        top: -24px;
        width: 1px;
        height: 24px;
        background: linear-gradient(to bottom, var(--ac-color-border-slate), transparent);
      }

      .node-card:hover {
        border-color: color-mix(in srgb, var(--ac-color-action) 45%, transparent);
      }

      .block.in-view .node-icon,
      .block.in-view .node-card,
      .block.in-view .stacked li {
        opacity: 1;
        transform: none;
      }

      .node-card strong {
        display: block;
        margin: 4px 0 8px;
        font-size: 14px;
        color: var(--ac-color-text-strong);
      }

      .node-card p {
        margin: 0;
        font-size: 13px;
        line-height: 1.55;
        color: var(--ac-color-text-muted);
      }

      .stacked {
        display: none;
        list-style: none;
        margin: 0;
        padding: clamp(20px, 4vw, 32px);
      }

      .stacked li {
        position: relative;
        display: flex;
        gap: 16px;
        padding-bottom: 24px;
        opacity: 0;
        transform: translateY(20px);
        transition:
          opacity 500ms var(--ease),
          transform 500ms var(--ease);
        transition-delay: calc(var(--n) * 150ms);
      }

      .stacked li:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 24px;
        top: 56px;
        bottom: 8px;
        width: 1px;
        background: var(--ac-color-border-slate);
      }

      .stacked .node-icon {
        flex: 0 0 48px;
        margin: 0;
        opacity: 1;
        transform: none;
      }

      .stacked .node-card {
        flex: 1;
        margin: 0;
        opacity: 1;
        transform: none;
      }

      .stacked .node-card::before {
        display: none;
      }

      /* 3 · Safety with stacked plates */
      .safety {
        display: flex;
        flex-direction: column;
        padding: clamp(24px, 4vw, 48px);
        min-height: 500px;
      }

      .safety-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: center;
        gap: 48px;
      }

      .safety h3 {
        margin: 12px 0 20px;
        font-size: clamp(30px, 3.6vw, 46px);
        line-height: 1.08;
        font-weight: 800;
        color: var(--ac-color-text-strong);
      }

      .safety-lead p {
        margin: 0;
        max-width: 360px;
        font-size: 15px;
        line-height: 1.65;
        color: var(--ac-color-text-body);
      }

      .plates {
        position: relative;
        height: 260px;
        perspective: 900px;
      }

      .plate {
        position: absolute;
        left: 50%;
        width: 150px;
        height: 150px;
        margin-left: -75px;
        border-radius: 6px;
        border: 1px solid var(--ac-color-border-slate);
        transform: rotateX(60deg) rotateZ(-45deg);
        transition: translate 900ms var(--ease);
      }

      .p1 {
        top: 120px;
        background: var(--ac-brand-50);
        translate: 0 40px;
      }

      .p2 {
        top: 70px;
        background: var(--ac-brand-100);
        box-shadow: 0 20px 40px -20px
          color-mix(in srgb, var(--ac-color-action-deep) 50%, transparent);
        translate: 0 60px;
      }

      .p3 {
        top: 10px;
        display: grid;
        place-items: center;
        background: var(--ac-color-surface);
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
        box-shadow: 0 24px 44px -20px
          color-mix(in srgb, var(--ac-color-action-deep) 55%, transparent);
        translate: 0 80px;
      }

      .p3 ac-nav-icon {
        width: 48px;
        height: 48px;
        transform: rotate(45deg);
      }

      .block.in-view .plate {
        translate: 0 0;
      }

      .block.in-view .p2 {
        transition-delay: 120ms;
      }

      .block.in-view .p3 {
        transition-delay: 240ms;
      }

      .points {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 32px;
      }

      .points li {
        display: flex;
        gap: 14px;
      }

      .point-icon {
        display: grid;
        place-items: center;
        flex: 0 0 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .point-icon ac-nav-icon {
        width: 13px;
        height: 13px;
      }

      .points strong {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ac-color-text-strong);
      }

      .points p {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: var(--ac-color-text-muted);
      }

      .safety-foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 48px;
        padding-top: 20px;
        border-top: 1px solid var(--ac-color-border-slate);
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .dots {
        display: grid;
        grid-template-columns: repeat(3, 6px);
        gap: 3px;
      }

      .dots i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ac-color-action);
      }

      .dots i:nth-child(3),
      .dots i:nth-child(5) {
        opacity: 0;
      }

      /* 4 · School window */
      .window-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface-slate);
      }

      .light {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--ac-color-border-slate);
      }

      .window-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 auto;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-muted);
      }

      .window-title ac-nav-icon {
        width: 14px;
        height: 14px;
      }

      .spacer {
        width: 46px;
      }

      .window-body {
        display: grid;
        grid-template-columns: 200px minmax(0, 1fr);
        min-height: 300px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .side {
        display: grid;
        align-content: start;
        gap: 12px;
        padding: 18px;
        border-right: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface-slate);
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      .side .current {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 8px;
        background: var(--ac-brand-50);
        color: var(--ac-color-text-strong);
        font-weight: 600;
      }

      .side .current i,
      .detail li i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ac-color-action);
        flex: 0 0 6px;
      }

      .detail {
        padding: 24px;
      }

      .detail ul {
        list-style: none;
        margin: 16px 0 0;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      .detail li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        font-size: 14px;
        color: var(--ac-color-text-body);
        opacity: 0;
        transform: translateX(-20px);
        transition:
          opacity 500ms var(--ease),
          transform 500ms var(--ease),
          border-color 200ms ease;
        transition-delay: calc(300ms + var(--n) * 120ms);
      }

      .detail li:hover {
        border-color: color-mix(in srgb, var(--ac-color-action) 45%, transparent);
      }

      .block.in-view .detail li {
        opacity: 1;
        transform: none;
      }

      .window-foot {
        padding: 12px 16px;
        background: var(--ac-color-surface-slate);
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      @media (max-width: 1023px) {
        .layout {
          grid-template-columns: minmax(0, 1fr);
          gap: 0;
        }

        .rail {
          display: none;
        }

        .circuit {
          display: none;
        }

        .stacked {
          display: block;
        }

        .timeline {
          min-height: 0;
        }

        .safety-grid {
          grid-template-columns: minmax(0, 1fr);
          gap: 32px;
        }

        .plates {
          height: 220px;
        }
      }

      @media (max-width: 720px) {
        :host {
          padding: 112px var(--lp-x, 16px) 72px;
        }

        .blocks {
          gap: 88px;
        }

        .tiles {
          grid-template-columns: minmax(0, 1fr);
        }

        .window-body {
          grid-template-columns: minmax(0, 1fr);
        }

        .side {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          transition: none !important;
        }

        .intro,
        .word,
        .block-copy,
        .frame,
        .node-icon,
        .node-card,
        .stacked li,
        .detail li {
          opacity: 1 !important;
          transform: none !important;
        }

        .trace {
          stroke-dashoffset: 0 !important;
        }

        .plate {
          translate: 0 0 !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutJourneyComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly lang = input<Lang>('en');

  protected readonly copy = computed(() => COPY[this.lang()]);
  protected readonly headingWords = computed(() => this.copy().heading.split(' '));
  /** 0 at the top of the section, 1 at its end; moves the dot on the rail. */
  protected readonly progress = signal(0);
  protected readonly columns = Array.from({ length: 10 }, (_, i) => i);

  constructor() {
    afterNextRender(() => {
      this.observeReveal();
      this.trackScroll();
    });
  }

  /** Each [data-reveal] element animates in once, the first time it is on screen. */
  private observeReveal(): void {
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
      { threshold: 0.15 },
    );
    targets.forEach((el) => observer.observe(el));
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  /** Scroll progress through the section, read at most once per frame. */
  private trackScroll(): void {
    const host = this.host.nativeElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = host.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const value = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      this.progress.set(Math.round(value * 1000) / 1000);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    });
  }
}
