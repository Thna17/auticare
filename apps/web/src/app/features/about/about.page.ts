import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PublicHeaderComponent,
  PublicFooterComponent,
} from '../../core/layout/public-chrome.component';
import { I18nService } from '../../core/i18n/i18n.service';

const TEAM = [
  {
    name: 'Chim Lina',
    image: '/chimlina.png',
    role: ['Founder & Team Leader', 'ស្ថាបនិក និងប្រធានក្រុម'],
  },
  {
    name: 'Lim Potkolbotey',
    image: '/limpotkolbotey.png',
    role: ['Research & Partnership Coordinator', 'អ្នកសម្របសម្រួលស្រាវជ្រាវ និងភាពជាដៃគូ'],
  },
  {
    name: 'So Sereysokbotra',
    image: '/sosereysokbotra.png',
    role: ['Backend Developer', 'អ្នកអភិវឌ្ឍផ្នែក Backend'],
  },
  {
    name: 'Tes Sothyroth',
    image: '/tessothyroth.png',
    role: ['Frontend Developer', 'អ្នកអភិវឌ្ឍផ្នែក Frontend'],
  },
  {
    name: 'Yean Sreymom',
    image: '/yeansreymom.png',
    role: ['Marketing & Communications', 'ទីផ្សារ និងទំនាក់ទំនង'],
  },
  {
    name: 'Noeun Tithearin',
    image: '/noeuntithearin.png',
    role: ['AI & Machine Learning Developer', 'អ្នកអភិវឌ្ឍ AI និង Machine Learning'],
  },
] as const;

@Component({
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent, PublicFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="about-page" [class.khmer]="lang() === 'km'">
      <ac-public-header />

      <main id="top">
        <section class="hero wrap">
          <div class="hero-copy">
            <span class="eyebrow">{{ t('ABOUT AUTICARE', 'អំពី AUTICARE') }}</span>
            <h1>
              {{
                t('Every Child Deserves to Be Understood.', 'កុមារគ្រប់រូបសមនឹងទទួលបានការយល់ដឹង។')
              }}
            </h1>
            <p>
              {{
                t(
                  'AutiCare is an independent Cambodian startup created by students from Kirirom Institute of Technology in Phnom Penh. We aim to support families of autistic children through accessible technology, educational resources, and practical guidance.',
                  'AutiCare គឺជាអាជីវកម្មបង្កើតថ្មីឯករាជ្យនៅកម្ពុជា បង្កើតឡើងដោយនិស្សិតមកពីវិទ្យាស្ថានបច្ចេកវិទ្យាគិរីរម្យនៅភ្នំពេញ។ យើងមានគោលបំណងគាំទ្រគ្រួសារដែលមានកូនអូទីស្សឹម តាមរយៈបច្ចេកវិទ្យាដែលងាយស្រួលប្រើ ធនធានអប់រំ និងការណែនាំជាក់ស្តែង។'
                )
              }}
            </p>
            <a class="button" routerLink="/"
              >{{ t('Explore AutiCare', 'ស្វែងយល់អំពី AutiCare') }} <span>→</span></a
            >
          </div>
          <div class="hero-art">
            <img src="/about1.png" alt="A parent supporting a child" /><span class="art-note">{{
              t(
                'A little support can open up a world of possibility.',
                'ការគាំទ្រតិចតួច អាចបើកឱកាសដ៏ធំធេង។'
              )
            }}</span>
          </div>
        </section>

        <section class="story section wrap">
          <div class="story-art">
            <img
              src="/about2.png"
              alt="A family spending time learning together"
              loading="lazy"
            /><span class="story-tag">{{
              t('Built with care in Cambodia', 'បង្កើតឡើងដោយក្តីយកចិត្តទុកដាក់នៅកម្ពុជា')
            }}</span>
          </div>
          <div class="story-copy">
            <span class="eyebrow">{{ t('WHY WE STARTED', 'មូលហេតុដែលយើងចាប់ផ្តើម') }}</span>
            <h2>
              {{
                t(
                  'Our Story — Inspired by Family, Built with Purpose',
                  'រឿងរ៉ាវរបស់យើង — បំផុសគំនិតពីគ្រួសារ បង្កើតឡើងដោយមានគោលបំណង'
                )
              }}
            </h2>
            <p>
              {{
                t(
                  'AutiCare began with a personal story. One of our team members grew up alongside her cousin, an autistic child, and witnessed the challenges he and his family faced in finding understanding, support, and suitable learning opportunities.',
                  'AutiCare ចាប់ផ្តើមពីរឿងរ៉ាវផ្ទាល់ខ្លួនមួយ។ សមាជិកក្រុមម្នាក់របស់យើងបានធំឡើងជាមួយបងប្អូនជីដូនមួយដែលមានអូទីស្សឹម ហើយបានឃើញបញ្ហាប្រឈមដែលគាត់ និងគ្រួសារជួបប្រទះក្នុងការស្វែងរកការយល់ដឹង ការគាំទ្រ និងឱកាសសិក្សាសមស្រប។'
                )
              }}
            </p>
            <p>
              {{
                t(
                  'That experience inspired our team to create AutiCare—a platform designed to help families feel less alone and more confident in supporting their children.',
                  'បទពិសោធន៍នោះបានបំផុសគំនិតឱ្យក្រុមយើងបង្កើត AutiCare ជាវេទិកាដែលជួយឱ្យគ្រួសារមានអារម្មណ៍ថាមិននៅម្នាក់ឯង និងមានទំនុកចិត្តក្នុងការគាំទ្រកូនៗរបស់ពួកគេ។'
                )
              }}
            </p>
            <p>
              {{
                t(
                  'We believe that every child deserves patience, acceptance, and the opportunity to grow.',
                  'យើងជឿថា កុមារគ្រប់រូបសមនឹងទទួលបានការអត់ធ្មត់ ការទទួលយក និងឱកាសដើម្បីរីកចម្រើន។'
                )
              }}
            </p>
          </div>
        </section>

        <section class="purpose section">
          <div class="wrap">
            <div class="section-heading">
              <span class="eyebrow">{{ t('OUR PURPOSE', 'គោលបំណងរបស់យើង') }}</span>
              <h2>
                {{
                  t(
                    'A more supportive journey for every family',
                    'ដំណើរដែលមានការគាំទ្រកាន់តែប្រសើរសម្រាប់គ្រួសារគ្រប់រូប'
                  )
                }}
              </h2>
            </div>
            <div class="purpose-grid">
              <article class="purpose-card">
                <span class="card-symbol">↗</span>
                <h3>{{ t('Our Mission', 'បេសកកម្មរបស់យើង') }}</h3>
                <p>
                  {{
                    t(
                      'To make autism information, educational guidance, and family support more accessible to parents and educators in Cambodia.',
                      'ធ្វើឱ្យព័ត៌មានអំពីអូទីស្សឹម ការណែនាំផ្នែកអប់រំ និងការគាំទ្រគ្រួសារ កាន់តែងាយស្រួលទទួលបានសម្រាប់ឪពុកម្តាយ និងអ្នកអប់រំនៅកម្ពុជា។'
                    )
                  }}
                </p>
              </article>
              <article class="purpose-card">
                <span class="card-symbol">✳</span>
                <h3>{{ t('Our Vision', 'ចក្ខុវិស័យរបស់យើង') }}</h3>
                <p>
                  {{
                    t(
                      'A Cambodia where every child is understood, every family feels supported, and every child has the opportunity to reach their potential.',
                      'កម្ពុជាមួយដែលកុមារគ្រប់រូបត្រូវបានយល់ដឹង គ្រួសារគ្រប់រូបមានអារម្មណ៍ថាទទួលបានការគាំទ្រ និងកុមារគ្រប់រូបមានឱកាសសម្រេចសក្តានុពលរបស់ខ្លួន។'
                    )
                  }}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section class="section wrap">
          <div class="section-heading">
            <span class="eyebrow">{{ t('WHAT WE DO', 'អ្វីដែលយើងធ្វើ') }}</span>
            <h2>{{ t('How AutiCare Supports Families', 'របៀបដែល AutiCare គាំទ្រគ្រួសារ') }}</h2>
            <p>
              {{
                t(
                  'Practical tools to help families learn, reflect, and keep moving forward.',
                  'ឧបករណ៍ជាក់ស្តែងជួយឱ្យគ្រួសាររៀន សង្កេត និងបន្តដំណើរទៅមុខ។'
                )
              }}
            </p>
          </div>
          <div class="feature-grid">
            @for (feature of features(); track feature.title) {
              <article class="feature-card">
                <span class="feature-icon">{{ feature.icon }}</span>
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.body }}</p>
              </article>
            }
          </div>
          <p class="disclaimer">
            {{
              t(
                'AutiCare provides educational support and does not replace professional diagnosis or treatment.',
                'AutiCare ផ្តល់ការគាំទ្រផ្នែកអប់រំ និងមិនជំនួសការធ្វើរោគវិនិច្ឆ័យ ឬការព្យាបាលដោយអ្នកជំនាញទេ។'
              )
            }}
          </p>
        </section>

        <section class="values section">
          <div class="wrap">
            <div class="section-heading">
              <span class="eyebrow">{{ t('WHAT GUIDES US', 'អ្វីដែលជាគោលការណ៍ណែនាំយើង') }}</span>
              <h2>{{ t('Our Core Values', 'គុណតម្លៃស្នូលរបស់យើង') }}</h2>
            </div>
            <div class="value-grid">
              @for (value of values(); track value.title) {
                <article class="value-card">
                  <span>{{ value.icon }}</span>
                  <div>
                    <h3>{{ value.title }}</h3>
                    <p>{{ value.body }}</p>
                  </div>
                </article>
              }
            </div>
          </div>
        </section>

        <section class="team section wrap">
          <div class="section-heading">
            <span class="eyebrow">{{
              t('THE PEOPLE BEHIND AUTICARE', 'ក្រុមការងារនៅពីក្រោយ AUTICARE')
            }}</span>
            <h2>
              {{ t('Meet the Team Behind AutiCare', 'ជួបជាមួយក្រុមការងារនៅពីក្រោយ AutiCare') }}
            </h2>
            <p>
              {{
                t(
                  'We are six passionate students from Kirirom Institute of Technology, combining technology, research, and creativity to make a meaningful difference.',
                  'យើងជានិស្សិតប្រាំមួយរូបដែលមានចំណង់ចំណូលចិត្តមកពីវិទ្យាស្ថានបច្ចេកវិទ្យាគិរីរម្យ ដោយរួមបញ្ចូលបច្ចេកវិទ្យា ការស្រាវជ្រាវ និងភាពច្នៃប្រឌិត ដើម្បីបង្កើតការផ្លាស់ប្តូរដ៏មានអត្ថន័យ។'
                )
              }}
            </p>
          </div>
          <div class="team-grid">
            @for (member of team; track member.name; let i = $index) {
              <article class="team-card">
                <div class="portrait">
                  <img
                    [src]="member.image"
                    [alt]="t('Portrait of ' + member.name, 'រូបថតរបស់ ' + member.name)"
                    loading="lazy"
                  />
                </div>
                <div class="member-copy">
                  <h3>{{ member.name }}</h3>
                  <p>{{ member.role[lang() === 'km' ? 1 : 0] }}</p>
                  <span class="member-number">0{{ i + 1 }}</span>
                </div>
              </article>
            }
          </div>
        </section>

        <section class="journey section">
          <div class="wrap journey-inner">
            <div>
              <span class="eyebrow">{{ t('WHERE WE ARE', 'ដំណាក់កាលបច្ចុប្បន្ន') }}</span>
              <h2>
                {{
                  t(
                    'Building AutiCare for a Better Tomorrow',
                    'កសាង AutiCare សម្រាប់អនាគតកាន់តែប្រសើរ'
                  )
                }}
              </h2>
              <p>
                {{
                  t(
                    'AutiCare is currently in the development and testing stage. We are improving our platform, learning from families, and seeking collaboration with schools, specialists, and organizations that share our mission.',
                    'បច្ចុប្បន្ន AutiCare កំពុងស្ថិតក្នុងដំណាក់កាលអភិវឌ្ឍ និងសាកល្បង។ យើងកំពុងកែលម្អវេទិកា សិក្សាពីគ្រួសារ និងស្វែងរកកិច្ចសហការជាមួយសាលារៀន អ្នកជំនាញ និងអង្គការដែលមានបេសកកម្មដូចគ្នា។'
                  )
                }}
              </p>
            </div>
            <ol class="steps">
              @for (step of steps(); track step; let i = $index) {
                <li>
                  <span>{{ i + 1 }}</span
                  >{{ step }}
                </li>
              }
            </ol>
          </div>
        </section>

        <section class="closing wrap">
          <span class="eyebrow">{{ t('LET’S BUILD IT TOGETHER', 'ចូលរួមកសាងជាមួយគ្នា') }}</span>
          <h2>
            {{ t('Together, We Can Make a Difference.', 'រួមគ្នា យើងអាចបង្កើតការផ្លាស់ប្តូរបាន។') }}
          </h2>
          <p>
            {{
              t(
                'We welcome parents, educators, healthcare professionals, and organizations who want to help create a more supportive future for children in Cambodia.',
                'យើងស្វាគមន៍ឪពុកម្តាយ អ្នកអប់រំ អ្នកជំនាញថែទាំសុខភាព និងអង្គការនានាដែលចង់ចូលរួមបង្កើតអនាគតដែលមានការគាំទ្រកាន់តែប្រសើរសម្រាប់កុមារនៅកម្ពុជា។'
              )
            }}
          </p>
          <div class="closing-actions">
            <a class="button" routerLink="/"
              >{{ t('Explore AutiCare', 'ស្វែងយល់អំពី AutiCare') }} <span>→</span></a
            ><a class="button secondary" routerLink="/" fragment="footer-contact">{{
              t('Contact Our Team', 'ទាក់ទងក្រុមការងារយើង')
            }}</a>
          </div>
        </section>
      </main>
      <ac-public-footer />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        --teal: #348c83;
        --deep: #174d47;
        --ink: #263b39;
        --muted: #627370;
        --mint: #f2f9f7;
        font-family: Inter, 'Kantumruy Pro', system-ui, sans-serif;
        color: var(--ink);
      }
      .about-page {
        background: #fff;
        min-height: 100vh;
      }
      .khmer {
        font-family: 'Kantumruy Pro', Inter, system-ui, sans-serif;
      }
      .wrap {
        width: min(1160px, calc(100% - 48px));
        margin-inline: auto;
      }
      .site-header {
        height: 76px;
        padding: 0 max(24px, calc((100vw - 1160px) / 2));
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #e9f0ee;
        background: #fff;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #194e48;
        font-size: 20px;
        font-weight: 750;
        text-decoration: none;
      }
      .mark {
        width: 34px;
        height: 34px;
        border-radius: 12px;
        background: var(--teal);
        color: #fff;
        display: grid;
        place-items: center;
        font-size: 21px;
      }
      .site-header nav,
      .head-actions {
        display: flex;
        align-items: center;
        gap: 28px;
      }
      .site-header nav a {
        color: #506360;
        text-decoration: none;
        font-size: 14px;
      }
      .site-header nav a[aria-current='page'] {
        color: var(--teal);
        font-weight: 700;
      }
      .head-actions {
        gap: 12px;
      }
      .language {
        border: 0;
        background: none;
        color: #365c56;
        font: inherit;
        cursor: pointer;
      }
      .header-cta,
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 12px 19px;
        border-radius: 12px;
        background: var(--teal);
        color: #fff;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 5px 14px #348c832b;
      }
      .hero {
        display: grid;
        grid-template-columns: 1fr 0.9fr;
        gap: 64px;
        align-items: center;
        padding-top: 64px;
        padding-bottom: 72px;
      }
      .hero-copy {
        max-width: 590px;
      }
      .eyebrow {
        display: inline-block;
        color: var(--teal);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.13em;
        margin-bottom: 16px;
      }
      .hero h1 {
        font-size: clamp(38px, 5vw, 62px);
        line-height: 1.08;
        letter-spacing: -0.045em;
        color: var(--deep);
        margin: 0 0 20px;
        max-width: 12ch;
      }
      .hero p,
      .story-copy p,
      .section-heading > p,
      .journey p,
      .closing > p {
        color: var(--muted);
        font-size: 15px;
        line-height: 1.8;
        margin: 0 0 22px;
      }
      .hero-art {
        position: relative;
        background: #eff8f5;
        border-radius: 30px;
        padding: 18px;
        min-height: 340px;
      }
      .hero-art img {
        display: block;
        width: 100%;
        height: 380px;
        object-fit: cover;
        object-position: center;
        border-radius: 22px;
      }
      .art-note,
      .story-tag {
        position: absolute;
        background: #fff;
        color: var(--deep);
        font-size: 13px;
        font-weight: 650;
        line-height: 1.5;
        padding: 13px 16px;
        border-radius: 14px;
        box-shadow: 0 8px 26px #173d3720;
      }
      .art-note {
        bottom: 36px;
        left: -28px;
        max-width: 230px;
      }
      .section {
        padding-top: 78px;
        padding-bottom: 78px;
      }
      .story {
        display: grid;
        grid-template-columns: 0.92fr 1fr;
        gap: 70px;
        align-items: center;
      }
      .story-art {
        position: relative;
        background: #f0f8f6;
        border-radius: 26px;
        padding: 14px;
      }
      .story-art img {
        width: 100%;
        height: 390px;
        object-fit: cover;
        border-radius: 18px;
        display: block;
      }
      .story-tag {
        left: 30px;
        bottom: 30px;
      }
      .story-copy h2,
      .section-heading h2,
      .journey h2,
      .closing h2 {
        color: var(--deep);
        font-size: clamp(29px, 3.3vw, 42px);
        letter-spacing: -0.03em;
        line-height: 1.17;
        margin: 0 0 18px;
      }
      .story-copy p {
        margin-bottom: 13px;
      }
      .purpose,
      .values,
      .journey {
        background: var(--mint);
      }
      .section-heading {
        max-width: 670px;
        margin: 0 auto 34px;
        text-align: center;
      }
      .section-heading h2 {
        margin-bottom: 12px;
      }
      .section-heading > p {
        margin-bottom: 0;
      }
      .purpose-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 18px;
      }
      .purpose-card,
      .feature-card,
      .value-card,
      .team-card {
        background: white;
        border: 1px solid #e5efec;
        border-radius: 20px;
        box-shadow: 0 9px 30px #234c4510;
      }
      .purpose-card {
        padding: 28px 30px;
        min-height: 190px;
      }
      .card-symbol {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: #e8f5f2;
        color: var(--teal);
        font-size: 20px;
      }
      .purpose-card h3,
      .feature-card h3,
      .value-card h3,
      .member-copy h3 {
        color: var(--deep);
        margin: 17px 0 8px;
        font-size: 18px;
      }
      .purpose-card p,
      .feature-card p,
      .value-card p,
      .member-copy p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.7;
      }
      .feature-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
      }
      .feature-card {
        padding: 22px 19px;
      }
      .feature-icon {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 14px;
        background: #eaf6f3;
        color: var(--teal);
        font-size: 21px;
      }
      .feature-card h3 {
        font-size: 16px;
        margin-top: 16px;
      }
      .disclaimer {
        margin: 22px auto 0;
        text-align: center;
        color: #6e7f7c;
        font-size: 12px;
        line-height: 1.6;
      }
      .value-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
      }
      .value-card {
        padding: 22px;
        display: flex;
        gap: 14px;
        align-items: flex-start;
      }
      .value-card > span {
        display: grid;
        place-items: center;
        flex: 0 0 38px;
        height: 38px;
        border-radius: 13px;
        background: #e8f5f2;
        color: var(--teal);
        font-size: 19px;
      }
      .value-card h3 {
        margin: 3px 0 7px;
        font-size: 16px;
      }
      .team {
        padding-bottom: 88px;
      }
      .team-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-auto-rows: 1fr;
        gap: 20px;
        align-items: stretch;
      }
      .team-card {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }
      .team-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 34px #234c4518;
      }
      .portrait {
        aspect-ratio: 2/3;
        background: #f2f8f6;
        display: grid;
        place-items: center;
        overflow: hidden;
      }
      .portrait img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
      }
      .member-copy {
        position: relative;
        flex: 1;
        padding: 11px 18px 14px;
        min-height: 82px;
      }
      .member-copy h3 {
        margin: 0 28px 4px;
        font-size: 17px;
      }
      .member-copy p {
        margin-left: 28px;
        font-size: 12px;
      }
      .member-number {
        position: absolute;
        left: 18px;
        top: 16px;
        color: #9bbab4;
        font-size: 11px;
        font-weight: 750;
      }
      .journey-inner {
        display: grid;
        grid-template-columns: 1fr 1.03fr;
        gap: 65px;
        align-items: center;
      }
      .journey h2 {
        max-width: 440px;
      }
      .journey p {
        margin-bottom: 0;
      }
      .steps {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 10px;
      }
      .steps li {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        border: 1px solid #dfede9;
        border-radius: 13px;
        background: #fff;
        color: #385652;
        font-size: 14px;
        font-weight: 650;
      }
      .steps li span {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #e8f5f2;
        color: var(--teal);
        font-size: 12px;
      }
      .closing {
        max-width: 820px;
        text-align: center;
        padding-top: 84px;
        padding-bottom: 84px;
      }
      .closing h2 {
        font-size: clamp(32px, 4vw, 46px);
      }
      .closing > p {
        max-width: 650px;
        margin: 0 auto 23px;
      }
      .closing-actions {
        display: flex;
        justify-content: center;
        gap: 12px;
      }
      .secondary {
        color: var(--teal);
        background: white;
        border: 1px solid #cfe2dd;
        box-shadow: none;
      }
      .site-footer {
        --footer-bg: #123c37;
        --footer-text: #f5f8f7;
        --footer-muted: #bdceca;
        --footer-line: #ffffff24;
        background: var(--footer-bg);
        color: var(--footer-text);
        padding: 56px max(24px, calc((100vw - 1440px) / 2)) 24px;
      }
      .footer-main {
        display: grid;
        grid-template-columns: 1.45fr repeat(4, 1fr);
        gap: 32px;
        max-width: 1900px;
        margin: 0 auto;
      }
      .footer-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #fff;
        text-decoration: none;
        font-size: 24px;
        font-weight: 800;
      }
      .footer-logo {
        width: 54px;
        height: 54px;
        overflow: hidden;
        border-radius: 14px;
        background: #fff;
        display: grid;
        place-items: center;
      }
      .footer-logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .footer-about p {
        max-width: 38ch;
        margin: 22px 0;
        color: var(--footer-muted);
        font-size: 16px;
        line-height: 1.7;
      }
      .footer-cta {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 15px 22px;
        border-radius: 999px;
        background: #fff;
        color: #173f3a;
        text-decoration: none;
        font-weight: 750;
      }
      .footer-col {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 17px;
      }
      .footer-col h2 {
        margin: 0 0 6px;
        color: #c1d4d0;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 13px;
      }
      .footer-col a {
        color: #edf4f2;
        text-decoration: none;
        font-size: 16px;
      }
      .footer-col a:hover {
        text-decoration: underline;
        text-underline-offset: 4px;
      }
      .socials {
        display: flex;
        gap: 10px;
        margin-top: 6px;
      }
      .socials a {
        width: 48px;
        height: 48px;
        border: 1px solid var(--footer-line);
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-size: 20px;
      }
      .footer-notice {
        max-width: 1900px;
        margin: 52px auto 34px;
        padding: 20px 24px;
        border: 1px solid var(--footer-line);
        border-radius: 17px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px 28px;
      }
      .footer-notice p {
        display: flex;
        align-items: center;
        gap: 14px;
        margin: 0;
        color: var(--footer-muted);
        font-size: 15px;
        line-height: 1.7;
      }
      .footer-notice p span {
        font-size: 22px;
      }
      .emergency {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        flex: none;
        padding: 15px 22px;
        border-radius: 999px;
        background: #fce9e8;
        color: #ac3636;
        text-decoration: none;
        font-weight: 750;
      }
      .footer-bottom {
        max-width: 1900px;
        margin: 0 auto;
        padding-top: 24px;
        border-top: 1px solid var(--footer-line);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        color: var(--footer-muted);
        font-size: 14px;
      }
      .footer-bottom p {
        margin: 0;
      }
      .footer-bottom > div {
        display: flex;
        align-items: center;
        gap: 22px;
      }
      .footer-bottom button {
        padding: 11px 18px;
        border: 1px solid var(--footer-line);
        border-radius: 999px;
        background: transparent;
        color: #fff;
        font: inherit;
        cursor: pointer;
      }
      .footer-bottom a {
        color: #fff;
        text-decoration: none;
      }
      .button:hover,
      .header-cta:hover {
        background: #26776f;
      }
      a:focus-visible,
      button:focus-visible {
        outline: 3px solid #8ad4c9;
        outline-offset: 3px;
      }
      @media (max-width: 850px) {
        .site-header {
          padding-inline: 24px;
        }
        .site-header nav {
          gap: 15px;
        }
        .site-header nav a {
          font-size: 12px;
        }
        .hero {
          gap: 32px;
          padding-top: 48px;
        }
        .hero-art img {
          height: 330px;
        }
        .story {
          gap: 38px;
        }
        .feature-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .team-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .journey-inner {
          gap: 32px;
        }
        .footer-main {
          grid-template-columns: 1.3fr 1fr 1fr;
          gap: 34px 24px;
        }
        .footer-notice {
          align-items: flex-start;
        }
      }
      @media (max-width: 620px) {
        .wrap {
          width: calc(100% - 36px);
        }
        .site-header {
          height: 66px;
          padding-inline: 18px;
        }
        .site-header nav {
          display: none;
        }
        .head-actions {
          gap: 8px;
        }
        .header-cta {
          padding: 10px 12px;
          font-size: 12px;
        }
        .hero {
          grid-template-columns: 1fr;
          gap: 30px;
          padding-top: 42px;
          padding-bottom: 50px;
        }
        .hero h1 {
          font-size: 43px;
        }
        .hero-art {
          min-height: 0;
          padding: 11px;
        }
        .hero-art img {
          height: 270px;
        }
        .art-note {
          left: 10px;
          bottom: 22px;
        }
        .section {
          padding-top: 58px;
          padding-bottom: 58px;
        }
        .story {
          grid-template-columns: 1fr;
          gap: 32px;
        }
        .story-art img {
          height: 300px;
        }
        .story-copy h2,
        .section-heading h2,
        .journey h2 {
          font-size: 31px;
        }
        .purpose-grid,
        .journey-inner {
          grid-template-columns: 1fr;
        }
        .purpose-card {
          min-height: 0;
        }
        .feature-grid {
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .feature-card {
          padding: 18px 14px;
        }
        .feature-card h3 {
          font-size: 14px;
        }
        .feature-card p {
          font-size: 12px;
        }
        .value-grid {
          grid-template-columns: 1fr;
        }
        .team-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .member-copy {
          padding: 10px 11px 13px;
          min-height: 82px;
        }
        .member-copy h3 {
          font-size: 14px;
          margin-left: 23px;
        }
        .member-copy p {
          font-size: 11px;
          margin-left: 23px;
        }
        .member-number {
          left: 11px;
        }
        .closing {
          padding-top: 60px;
          padding-bottom: 60px;
        }
        .closing-actions {
          flex-direction: column;
          align-items: stretch;
        }
        .closing h2 {
          font-size: 34px;
        }
        .site-footer {
          padding: 42px 20px 22px;
        }
        .footer-main {
          grid-template-columns: 1fr 1fr;
          gap: 32px 18px;
        }
        .footer-about {
          grid-column: 1/-1;
        }
        .footer-about p {
          margin: 14px 0;
        }
        .footer-col a {
          font-size: 14px;
        }
        .footer-notice {
          margin: 34px auto 25px;
          padding: 18px;
          flex-direction: column;
        }
        .footer-notice p {
          font-size: 13px;
        }
        .emergency {
          font-size: 13px;
          max-width: 100%;
        }
        .footer-bottom {
          align-items: flex-start;
          flex-direction: column;
          font-size: 12px;
        }
        .footer-bottom > div {
          width: 100%;
          justify-content: space-between;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          scroll-behavior: auto !important;
          transition: none !important;
        }
      }
    `,
  ],
})
export class AboutPage {
  protected readonly i18n = inject(I18nService);
  protected readonly lang = computed(() => this.i18n.currentLang());
  protected readonly team = TEAM;
  protected readonly year = new Date().getFullYear();
  protected readonly features = computed(() =>
    this.lang() === 'km'
      ? [
          {
            icon: '✳',
            title: 'ជំនួយការ AI សម្រាប់មាតាបិតា',
            body: 'ការណែនាំអប់រំសាមញ្ញ ដើម្បីជួយមាតាបិតាយល់ពីតម្រូវការកូន។',
          },
          {
            icon: '◷',
            title: 'ការពិនិត្យការអភិវឌ្ឍ',
            body: 'សំណួរងាយយល់ ជួយគ្រួសារពិចារណាអំពីការលូតលាស់របស់កូន។',
          },
          {
            icon: '▤',
            title: 'ធនធានសិក្សា',
            body: 'អត្ថបទ និងសកម្មភាពមានប្រយោជន៍សម្រាប់មាតាបិតា និងអ្នកអប់រំ។',
          },
          {
            icon: '↗',
            title: 'តាមដានការរីកចម្រើន',
            body: 'ឧបករណ៍រៀបចំការសង្កេត និងតាមដានការរីកចម្រើនតាមពេលវេលា។',
          },
        ]
      : [
          {
            icon: '✳',
            title: 'AI Parent Assistant',
            body: "Simple educational guidance to help parents understand their child's needs.",
          },
          {
            icon: '◷',
            title: 'Developmental Check-In',
            body: "Parent-friendly questions that help families reflect on their child's development.",
          },
          {
            icon: '▤',
            title: 'Learning Resources',
            body: 'Helpful articles and activities for parents and educators.',
          },
          {
            icon: '↗',
            title: 'Progress Tracking',
            body: 'Tools to organize developmental observations and follow progress over time.',
          },
        ],
  );
  protected readonly values = computed(() =>
    this.lang() === 'km'
      ? [
          {
            icon: '♡',
            title: 'ក្តីមេត្តា',
            body: 'យើងគាំទ្រគ្រួសារដោយការយល់ដឹង ការអត់ធ្មត់ និងការគោរព។',
          },
          {
            icon: '◎',
            title: 'ភាពងាយស្រួល',
            body: 'យើងធ្វើឱ្យព័ត៌មានមានប្រយោជន៍ងាយស្រួលទទួលបានសម្រាប់គ្រួសារកម្ពុជា។',
          },
          {
            icon: '↗',
            title: 'កិច្ចសហការ',
            body: 'យើងលើកទឹកចិត្តឱ្យមាតាបិតា គ្រូបង្រៀន និងអ្នកជំនាញធ្វើការរួមគ្នា។',
          },
        ]
      : [
          {
            icon: '♡',
            title: 'Compassion',
            body: 'We support families with understanding, patience, and respect.',
          },
          {
            icon: '◎',
            title: 'Accessibility',
            body: 'We make helpful information easier for Cambodian families to access.',
          },
          {
            icon: '↗',
            title: 'Collaboration',
            body: 'We encourage parents, teachers, and professionals to work together.',
          },
        ],
  );
  protected readonly steps = computed(() =>
    this.lang() === 'km'
      ? [
          'ស្រាវជ្រាវ និងស្វែងយល់',
          'អភិវឌ្ឍវេទិកា',
          'សាកល្បង និងទទួលមតិកែលម្អ',
          'ការដាក់ឱ្យប្រើប្រាស់នាពេលអនាគត',
        ]
      : ['Research & Understanding', 'Platform Development', 'Testing & Feedback', 'Future Launch'],
  );
  protected t(en: string, km: string): string {
    return this.lang() === 'km' ? km : en;
  }
  protected initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('');
  }
}
